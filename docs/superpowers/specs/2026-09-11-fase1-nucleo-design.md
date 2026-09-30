# Mez — Fase 1: Núcleo (diseño)

**Fecha:** 2026-09-11
**Estado:** Aprobado por el usuario
**Origen:** Flujos Mettl adaptados (documento del usuario), sección 5 fase 1.
**Alcance:** Rebanada vertical end-to-end: crear evaluación → invitar → candidato responde → calificar → reporte individual. Sin sitio de ventas ni gestión rica de RH.

## Decisiones aprobadas

1. **Eliminar el módulo `Evaluation` viejo** (modelo, migración, controller, requests, tests, ruta). El nuevo `assessments` lo reemplaza.
2. **Auth:** Laravel Sanctum con cookie de sesión (SPA).
3. **Sin créditos en Fase 1.** El ledger `credit_transactions` y el gating llegan en Fase 2.

## Contradicciones reconciliadas con el estado actual

- El módulo `Evaluation` (primera tarea) se elimina; "evaluación" ahora = `assessments`.
- No había auth instalada → se instala Sanctum.
- El catálogo del front (`data/catalog.ts`, `packages.ts`) es estático y temporal; Fase 3 lo migra a datos de BD. No se toca en Fase 1.
- La IA del sitio de ventas actual (`/test`, `/psicometria`, `/nosotros`) difiere de la del documento (`/pruebas`, `/precios`, etc.); se reconcilia en Fase 3. Fuera de alcance aquí.

---

## Arquitectura

React SPA (frontend) + Laravel API-only (backend), separación ya existente. Tres árboles de ruta en React con layouts distintos:

- `/registro`, `/login` — layout de auth (logo, sin menú).
- `/app/*` — portal RH autenticado (Sanctum cookie). Redirige a login sin sesión.
- `/evaluar/{token}` — portal del candidato, layout mínimo: sin navegación del sitio, sin login, sin enlaces a demo/precios.

**Sanctum SPA:** front pide `GET /sanctum/csrf-cookie`, luego `POST /login`; sesión en cookie httpOnly. Backend configura stateful domains (localhost:5173 en dev).

## Alcance exacto

**Incluye:** modelos + migraciones, seeder de la prueba de demostración, registro/login, creación de una evaluación, generación de token + enlace copiable + correo (driver dev), portal del candidato completo, cálculo de scores versionado, reporte individual HTML.

**Excluye (fases posteriores):** lista/gestión de evaluaciones, reenvío, recordatorios (F4), tabla comparativa (F2), PDF (F2), créditos (F2), sitio de ventas (F3), webhook/CSV (F4), baterías predefinidas (F4), proctoring (descartado), verificación de identidad (descartado).

## Modelo de datos (Fase 1)

```
organizations (id, name, sector, size, timestamps)
users (id, organization_id, name, email unique, password, role: admin|recruiter|viewer, timestamps)

tests (id, slug unique, name, category, description, duration_min, item_count,
       allows_back bool, requires_license bool, active bool, timestamps)
scales (id, test_id, code, name)
items (id, test_id, order, prompt, scale_id, reverse_scored bool)
item_options (id, item_id, label, value int)
scoring_rules (id, test_id, version int, algorithm json)
norms (id, test_id, version int, data json)

assessments (id, organization_id, name, position, deadline date, status, timestamps)
assessment_test (assessment_id, test_id, order)
candidates (id, name, email, phone nullable, timestamps)
invitations (id, assessment_id, candidate_id, token unique, status:
             pendiente|iniciada|completada|expirada, sent_at, opened_at,
             completed_at, expires_at, timestamps)

attempts (id, invitation_id, test_id, started_at, finished_at, status, timestamps)
answers (id, attempt_id, item_id, value int, responded_at, elapsed_ms)
attempt_events (id, attempt_id, type, payload json, created_at)
scores (id, attempt_id, scale_id, raw, normalized, percentile, category,
        scoring_rule_version int, norm_version int)
consents (id, invitation_id, accepted_at, ip, user_agent, privacy_version)
```

Reactivos, reglas y baremos viven en BD, no en código. Modelos Laravel con atributo `#[Fillable]` (convención del proyecto, ver `User.php`). Migraciones con clase anónima.

## Prueba de demostración (seeder)

Prueba ficticia marcada visualmente "Prueba de demostración":
- 12 reactivos, 3 escalas (4 reactivos c/u), Likert 1-5 (Totalmente en desacuerdo → Totalmente de acuerdo).
- Escalas de ejemplo: `RES` Orientación a resultados, `COL` Colaboración, `ADA` Adaptabilidad.
- Algunos reactivos con `reverse_scored = true`.
- `allows_back = true`, `duration_min = 5`, `category = personalidad`, `requires_license = false`, `active = true`.
- `scoring_rule v1`: raw por escala = suma de sus 4 reactivos (invierte reverse: valor → 6 - valor). normalized = (raw - 4) / 16 * 100 (rango raw 4..20 → 0..100).
- `norm v1`: umbrales normalized → categoría: <34 bajo, 34–66 medio, >66 alto; percentil aproximado por interpolación lineal simple.

## Motor de scoring (ScoringService)

Servicio desacoplado que, al completar un attempt, calcula por escala: `raw`, `normalized`, `percentile`, `category`, y **persiste `scoring_rule_version` y `norm_version`** usados. Recalcular un reporte usa las versiones guardadas en `scores`, no las vigentes → un baremo nuevo no altera reportes viejos. Testeable de forma aislada con la prueba demo (input conocido → scores esperados).

## Portal del candidato (`/evaluar/{token}`)

Una pantalla por paso, mobile-first (desde 360px), botones ≥44px, funcional en 3G (cada pantalla de reactivo pesa poco; no se carga toda la prueba de golpe):

1. Bienvenida: empresa, número de pruebas, duración estimada, aviso de pausa/reanudación.
2. Consentimiento: casilla **sin premarcar**; al aceptar se persiste `consents` (accepted_at, ip, user_agent, privacy_version) **antes** del primer reactivo. Enlace a aviso de privacidad.
3. Datos mínimos: confirmar nombre (edad/escolaridad solo si el baremo lo requiere; en la demo, no).
4. Instrucciones + 2 reactivos de práctica (no se califican).
5. Reactivos: uno por pantalla, "Siguiente", barra de progreso, **autoguardado en servidor por cada respuesta**, sin animaciones entre reactivos. "Atrás" solo si `allows_back`.
6. Fin: "Gracias, tus respuestas se enviaron. La empresa te contactará." Sin resultados al candidato.

**Reanudación:** reabrir el mismo enlace continúa donde iba (estado en servidor). **Token completado/expirado:** pantalla explicativa, sin permitir responder. **Integridad como dato:** `attempt_events` registra tiempo por reactivo (elapsed_ms en answers), pérdida de foco (`visibilitychange`), y bandera multi-dispositivo (user_agent distinto en mismo token). Se mostrará a RH como información, nunca como acusación.

## Superficie RH mínima

- Registro `/registro` en 3 pasos: (1) correo + contraseña, (2) empresa + sector + tamaño, (3) verificación de correo. Crea `organizations` + `users(admin)`. La verificación usa el mecanismo estándar de Laravel (`MustVerifyEmail`) enviando el enlace por el driver de correo de dev; se **registra** el estado verificado pero **no bloquea** la creación de evaluaciones en Fase 1 (gating suave, se endurece en Fase 2).
- Login `/login`.
- Asistente `/app/evaluaciones/nueva` en 4 pasos: (1) nombre + puesto, (2) elegir pruebas (por ahora la demo), (3) candidatos (uno por uno o pegar "nombre, correo" por línea), (4) fecha límite + confirmar.
- Al confirmar: genera tokens, envía correos (driver dev) y **muestra los enlaces copiables** por candidato.
- Ver reporte individual cuando la invitación esté `completada`.

La lista de evaluaciones, estados, reenvío, comparación y PDF son Fase 2.

## Reporte individual (componente reutilizable)

Orden (F7 del documento):
1. Encabezado: candidato, puesto, evaluación, fecha, empresa. Marca "Ejemplo" cuando sea muestra.
2. Resumen: tabla prueba × resultado global en escala común (bajo/medio/alto o percentil).
3. Por escala: barra con **etiqueta de texto** (no solo color) + interpretación en prosa (2–4 oraciones) por plantilla de rango.
4. Indicadores de integridad (attempt_events) y escalas de validez si el instrumento las tiene (la demo no).
5. Preguntas sugeridas para entrevista, derivadas de escalas con puntajes extremos.
6. Pie: qué mide y qué no; advertencia de que apoya la decisión, no la sustituye.

Gráficas con la escala secuencial timberwolf→sage→fern→hunter de `design-tokens.md`. **El mismo componente React** renderiza el reporte real (`/app/candidatos/{id}/reporte`) y el "Ejemplo" del sitio público (requisito de aceptación). Datos del reporte vienen de un endpoint JSON del backend.

## Endpoints (Laravel API)

```
GET  /sanctum/csrf-cookie
POST /register            crea org + admin (3 pasos consolidados)
POST /login   POST /logout   GET /user

# RH (auth:sanctum)
POST /api/assessments                     crea assessment + assessment_test + candidates + invitations, genera tokens, envía correos
GET  /api/assessments/{id}                detalle con invitaciones y enlaces
GET  /api/invitations/{id}/report         datos del reporte individual (si completada)

# Candidato (público, por token)
GET  /api/evaluar/{token}                 estado + paso actual (o expirada/completada)
POST /api/evaluar/{token}/consent         guarda consentimiento
POST /api/evaluar/{token}/answers         autoguarda una respuesta
POST /api/evaluar/{token}/events          registra attempt_event
POST /api/evaluar/{token}/complete        cierra attempt(s), dispara scoring
```

## Suposiciones

- Correo en dev: driver `log` o Mailpit; SMTP real `[PENDIENTE: proveedor de correo]`. El flujo no depende del correo (enlace copiable).
- Créditos gratis de registro: `[PENDIENTE: número de evaluaciones gratis]` en config; sin efecto en Fase 1.
- Aviso de privacidad: `privacy_version` se guarda; el texto del aviso es `[PENDIENTE: aviso de privacidad]`.

## Testing / criterios de aceptación (de la sección 7 del documento)

- Candidato recibe enlace, responde en móvil con conexión lenta, cierra a la mitad, reabre y termina; todo guardado.
- Token completado/expirado no permite responder de nuevo.
- Un score guardado no cambia si después se modifica una regla o baremo (versión persistida).
- El reporte individual y el "Ejemplo" del sitio usan el mismo componente.
- Eventos de integridad se muestran como datos, sin lenguaje de acusación.
- Consentimiento registrado con fecha, hora e IP antes del primer reactivo.
- Feature tests (PHPUnit) para: creación de assessment, flujo de invitación por token, autoguardado, completar + scoring, idempotencia de token usado, versionado de scores.

## Fuera de alcance (recordatorio)

Sitio de ventas, gestión RH rica, créditos, PDF, comparativa, recordatorios, webhook, CSV, baterías, proctoring, verificación de identidad. Cada uno en su fase o descartado.

## Lista de [PENDIENTE] que genera esta fase

1. `[PENDIENTE: proveedor de correo]` (SMTP real)
2. `[PENDIENTE: número de evaluaciones gratis]` (config de registro)
3. `[PENDIENTE: aviso de privacidad]` (texto legal)
4. `[PENDIENTE: reactivos, claves y baremos reales]` (el psicólogo; mientras tanto la prueba de demostración)
