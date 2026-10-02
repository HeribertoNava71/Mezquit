# Pendientes de backend

## Nota para el compañero

Este documento junta lo que el rediseño del frontend necesita del backend y hoy no existe, o existe con un contrato que complica la UI. **El frontend no tocará el backend** (regla 1, PROMPT_CLAUDE_CODE.md:37): ni rutas, ni controladores, ni modelos, ni migraciones, ni `.env`, ni tests.

Cómo leer cada ítem:

- **ID:** PB-xx. mapa.md, brechas.md y decisiones.md lo citan con ese ID.
- **Necesidad y evidencia:** qué falta y dónde se ve (archivo:línea; «:NNN» repite el último archivo citado en el mismo párrafo).
- **Pantalla que lo pide.**
- **Prioridad.** Alta: bloquea una fase o deja una función rota. Media: la pantalla funciona con una alternativa peor. Baja: mejora, o función nueva del prototipo que depende de una decisión de producto.
- **Propuesta de contrato (PROPUESTA):** método, path, payload y respuesta orientativos. Los nombres y formas los decides tú.
- **Mientras no exista:** qué hace el frontend sin simular nada.

Para responder, anota en cada ítem «Estado: aceptado, rechazado o hecho» y el contrato final. Advertencia: el inventario del frontend se reconstruyó desde los planes de `docs/superpowers/plans` porque `frontend/` y `backend/` son gitlinks vacíos; PB-01 es el primer paso.

> **Estado al cierre del rediseño (2026-10-02).** El frontend rediseñado (`frontend-strata/`) ya hace lo que dice «Mientras no exista» en cada ítem, sin simular nada, y no cambió ningún endpoint ni contrato. Durante las fases surgieron dos ítems nuevos: [PB-36](#pb-36) (la fecha límite vence al empezar el día) y [PB-37](#pb-37) (teléfono del candidato en las invitaciones); [PB-35](#pb-35) suma dos pantallas. Lo que el frontend necesita primero: PB-01 (el código real, para la regresión), PB-22 (callejón sin salida en /perfil) y PB-36. Cómo correr el frontend contra tu backend está en [estado-final.md](estado-final.md#backend-real).

> **Contratos de referencia: `frontend-strata/e2e/mocks/`.** Esos JSON, uno por escenario, dicen qué espera el frontend de cada endpoint: método, ruta, status y la forma exacta del cuerpo, también en los errores (401, 403, 404, 409, 422 y 500) y en la sesión (`POST /api/login` y `/api/register` devuelven `{ user }`; `GET /api/user`, el usuario sin envolver; los recursos, `{ data }`). Salen de `src/api` y de los controladores de los planes. Para verlos funcionando sin backend: `npm run dev:mock` dentro de `frontend-strata/` levanta el frontend completo respondiendo con ellos ([README](../../frontend-strata/README.md#modo-demo)), y `node scripts/captura.mjs --validar e2e/mocks/rh.json --probar "GET /api/assessments/13"` dice qué entrada responde una petición. Si tu respuesta real difiere, manda el backend: avisa y se ajustan el cliente o la pantalla, el mock y su prueba (T-11). Los 422 del registro y del login que da el modo demo imitan los mensajes de Laravel en inglés (PB-35).

## Resumen

| ID | Necesidad | Prioridad | Pantalla | Decisión |
|---|---|---|---|---|
| PB-01 | Código real del frontend y del backend en el repo | Alta | Todas | D-01 |
| PB-02 | Nombre de la organización en GET /api/user | Baja | Barra superior | D-06 |
| PB-03 | Respuestas coherentes para usuarios sin organización | Media | Panel RR. HH. | D-07 |
| PB-04 | Pruebas asignables para RR. HH. | Media | Asistente, catálogo del panel | D-10 |
| PB-05 | Lista de invitaciones de la organización | Media | Candidatos, Resultados | D-06 |
| PB-06 | Detalle de evaluación con pruebas y fechas | Media | Detalle de evaluación | D-10 |
| PB-07 | Estado «expirada» al listar | Media | Candidatos, Resultados | — |
| PB-08 | Solicitudes de créditos propias | Media | Créditos | D-09 |
| PB-09 | Pago en línea | Baja | Catálogo, drawer de compra, home | D-09 |
| PB-10 | Precio por prueba y moneda | Baja | Catálogo, home, builder | D-09, D-17 |
| PB-11 | Código corto de invitación | Baja | Acceso, inventario | D-08 |
| PB-12 | Invitación solo con enlace (sin correo) | Baja | Modales de invitación | D-08, D-10 |
| PB-13 | Agregar candidatos a una evaluación existente | Media | Detalle de evaluación | D-10 |
| PB-14 | Nombre del candidato en el portal | Media | Acceso, examen | D-11 |
| PB-15 | Límite de tiempo por prueba | Baja | Examen | D-12 |
| PB-16 | Progreso del candidato para RR. HH. | Baja | Candidatos | — |
| PB-17 | Id de la evaluación en el reporte | Baja | Resultados | D-14 |
| PB-18 | Índice global, perfil esperado del puesto y percentil normativo | Baja | Resultados | D-14 |
| PB-19 | Envío del reporte por correo | Baja | Resultados | D-16 |
| PB-20 | API del Test Builder | Alta para la Fase 5 | Test Builder | D-15 |
| PB-21 | Compra individual (B2C) | Baja | Home | D-13 |
| PB-22 | Crear o editar la empresa desde el perfil | Alta | Perfil | D-13 |
| PB-23 | Recuperar contraseña | Media | Login | D-07 |
| PB-24 | Error estándar en PUT /api/admin/me | Baja | Perfil del operador | — |
| PB-25 | 422 de créditos insuficientes con código y excepción mapeada | Baja | Asistente | — |
| PB-26 | Longitud de la nota de solicitud (255 contra 500) | Baja | Créditos | — |
| PB-27 | Usuarios con last_name nulo | Baja | Perfil, admin de usuarios | — |
| PB-28 | Recordatorios y vencimiento por defecto | Baja | Modales de invitación | D-10 |
| PB-29 | Sección del reactivo en el portal | Baja | Examen | — |
| PB-30 | Respuestas del candidato para RR. HH. | Baja | Resultados, Candidatos | — |
| PB-31 | Reactivos de práctica | Baja | Examen (instrucciones) | — |
| PB-32 | Verificación de correo | Baja | Registro, perfil | — |
| PB-33 | Marca STRATA en los datos sembrados del backend | Baja | Barra superior, admin de usuarios | D-03 |
| PB-34 | Bandera multidispositivo en la integridad | Baja | Resultados | D-25 |
| PB-35 | Mensajes de validación (422) en español | Media | Registro, perfil, /demo, admin de usuarios, créditos, asistente | — |
| PB-36 | Fecha límite: vence al empezar el día y acepta fechas pasadas | Media | Asistente, portal del candidato | — |
| PB-37 | Teléfono del candidato en las invitaciones | Baja | Enlaces de invitación, detalle de evaluación | D-10 |

**Por prioridad.** Alta: PB-01, PB-22 y PB-20 (esta solo si se quiere la Fase 5). Media: PB-03, PB-04, PB-05, PB-06, PB-07, PB-08, PB-13, PB-14, PB-23, PB-35 y PB-36. Baja: el resto, casi todo ligado a decisiones de producto.

## Ítems

<a id="pb-01"></a>
### PB-01 · Código real del frontend y del backend en el repo

- **Necesidad:** `frontend/` y `backend/` son gitlinks (modo 160000) sin `.gitmodules`; apuntan a `c61e7333efe547698d2c17cc5926fbea65e0d5f5` y `a8f6cb566be051477fe06041f68ad8b6aaa119da`. Las carpetas están vacías y el código no está en GitHub. Probable origen: el `git init` dentro de cada carpeta del plan evaluation-module (2026-09-10-evaluation-module.md:611, :663). Ese mismo plan versionó `backend/.env` (:611) y `frontend/.env` (:664) dentro de los repos embebidos: el historial del backend guarda al menos las credenciales de la base de datos (:76-83) y la APP_KEY que Laravel escribe en `.env` al instalarse (conocimiento externo).
- **Pantalla que lo pide:** todas. Sin código no se valida mapa.md ni empieza la Fase 1.
- **Prioridad:** Alta.
- **Propuesta (PROPUESTA, no es API):** opción recomendada en D-01, monorepo, sin `.env`, `vendor/` ni `node_modules/`.

  ```bash
  git rm --cached frontend backend
  # copiar el código de cada carpeta sin su .git interno
  git add frontend backend
  git commit -m "chore: versionar frontend y backend en el monorepo"
  ```

  Alternativa: publicar los dos repos y crear `.gitmodules` con `path` y `url`, fijando los commits actuales.
- **Seguridad:** el repo Mezquit en GitHub es público. Publicar los repos embebidos como submódulos publicaría también su historial, con el `.env` versionado. Con el monorepo el código se copia sin su `.git` y ese historial no viaja. En los dos casos: `.env` en `.gitignore`, solo `.env.example` versionado y, si un repo con ese historial llegó a subirse a algún remoto, rotar la APP_KEY y las credenciales.
- **Mientras no exista:** el rediseño se construyó sobre una reconstrucción del frontend hecha desde los planes, en `frontend-strata/` (D-26). La regresión contra el backend real y el reemplazo del gitlink de `frontend/` esperan este punto; los pasos están en [estado-final.md](estado-final.md#migracion).

<a id="pb-02"></a>
### PB-02 · Nombre de la organización en GET /api/user

- **Necesidad:** la pastilla de RR. HH. muestra el nombre de la empresa (Strata.dc.html:70). GET /api/user devuelve el User sin la relación (2026-09-11-fase1-nucleo.md:1497). organization_id e is_platform_admin ya vienen (2026-09-12-registro-login-crud-usuarios.md:58, :63-70); solo falta el nombre.
- **Pantalla que lo pide:** barra superior de RR. HH. y de super admin.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):**

  ```http
  GET /api/user
  ```

  ```json
  { "id": 7, "name": "Ana", "last_name": "López", "email": "ana@empresa.com", "role": "admin", "organization_id": 3, "is_platform_admin": false, "organization": { "id": 3, "name": "Empresa SA" } }
  ```

- **Mientras no exista:** el frontend pide GET /api/user/profile, que ya carga `organization` (2026-09-12-registro-login-crud-usuarios.md:609-612).

<a id="pb-03"></a>
### PB-03 · Respuestas coherentes para usuarios sin organización

- **Necesidad:** tres endpoints de RR. HH. responden 500 si el usuario no tiene organización:
  - GET /api/credits llama a `creditTransactions()` sobre `$request->user()->organization`, que es nulo (2026-09-12-fase2-panel-rh.md:899-900).
  - POST /api/assessments pasa `$user->organization` (nulo) a `CreditService::balance(Organization $organization)`, que lanza TypeError (2026-09-12-fase2-panel-rh.md:412-421, :243).
  - POST /api/credit-requests intenta guardar organization_id nulo en una columna que no lo admite (2026-09-12-fase2-panel-rh.md:49, :913-918).

  Un usuario sin empresa llega a /app porque RequireAuth solo revisa la sesión (2026-09-11-fase1-nucleo.md:2135-2140). Los demás endpoints de /app no fallan: el detalle y el reporte responden 403 (:1472, :1931), igual que la comparativa y el reenvío (2026-09-12-fase2-panel-rh.md:633, :753), y la lista filtra por organization_id nulo (:587), así que devuelve una lista vacía (inferencia).
- **Pantalla que lo pide:** todo /app.
- **Prioridad:** Media.
- **Propuesta (PROPUESTA):** middleware o validación que responda 403 en esos tres endpoints.

  ```http
  GET  /api/credits          → 403
  POST /api/assessments      → 403
  POST /api/credit-requests  → 403
  ```

  ```json
  { "message": "Tu cuenta no tiene una empresa asociada." }
  ```

- **Mientras no exista:** guarda de organización en /app (D-07) y ninguna llamada a esos endpoints sin organization_id.

<a id="pb-04"></a>
### PB-04 · Pruebas asignables para RR. HH.

- **Necesidad:** el asistente envía `test_ids: [1]` fijo porque la demo «es el primer test sembrado» (2026-09-11-fase1-nucleo.md:2561), lo que depende del orden de los seeders (2026-09-11-fase3-sitio-ventas.md:101-106). El backend acepta cualquier prueba existente (`exists:tests,id`, 2026-09-11-fase1-nucleo.md:1399), incluidas las 18 del catálogo, que no tienen reactivos (2026-09-11-fase3-sitio-ventas-design.md:45). Con una de ellas, GET /api/evaluar/{token}/pruebas/{testId} devuelve `items` vacío (2026-09-11-fase1-nucleo.md:1724-1737) y el portal se queda en blanco (:2893, :2926). El catálogo público excluye la demo (2026-09-11-fase3-sitio-ventas-design.md:47). No hay forma de saber qué pruebas se pueden asignar.
- **Pantalla que lo pide:** asistente (paso «Prueba»), catálogo del panel y modales de asignación del prototipo (Strata.dc.html:1342-1353, :1390-1401).
- **Prioridad:** Media.
- **Propuesta (PROPUESTA):** solo pruebas activas que tienen reactivos, incluida la demo. Opcional: rechazar con 422 en POST /api/assessments las pruebas sin reactivos.

  ```http
  GET /api/tests/assignable      (auth:sanctum)
  ```

  ```json
  { "data": [ { "id": 1, "slug": "prueba-de-demostracion", "name": "Prueba de demostración", "category": "personalidad", "category_label": "Personalidad", "duration_min": 5, "item_count": 12, "allows_back": true, "scales": [ { "code": "RES", "name": "Orientación a resultados" } ] } ] }
  ```

- **Mientras no exista:** prueba fija id 1 con la etiqueta «Prueba de demostración», como hoy (2026-09-11-fase1-nucleo.md:2636). Si una invitación llega con una prueba sin reactivos, el portal muestra un estado vacío con contacto a la empresa en lugar de una pantalla en blanco.

<a id="pb-05"></a>
### PB-05 · Lista de invitaciones de la organización

- **Necesidad:** el panel «Candidatos» del prototipo lista a todos los candidatos con prueba, estado, fecha y código (Strata.dc.html:809-868). «Resultados» necesita las últimas completadas, que la spec ya pedía en el Resumen (2026-09-12-fase2-panel-rh-design.md:75). Hoy solo existen GET /api/assessments con conteos y el detalle por evaluación.
- **Pantalla que lo pide:** Candidatos (vista plana opcional) y Resultados (/app).
- **Prioridad:** Media.
- **Propuesta (PROPUESTA):** filtrado por la organización del usuario y ordenado por actividad reciente.

  ```http
  GET /api/invitations?status=completada&assessment_id=&search=&page=1      (auth:sanctum)
  ```

  ```json
  { "data": { "items": [ { "id": 41, "candidate": "Nombre", "email": "correo@dominio.com", "status": "completada", "assessment": { "id": 12, "name": "Evaluación", "position": "Puesto" }, "tests": [ { "id": 1, "name": "Prueba" } ], "sent_at": "2026-09-20 10:00", "opened_at": "2026-09-21 09:00", "completed_at": "2026-09-21 09:20", "expires_at": null, "link": "http://localhost:5173/evaluar/{token}" } ], "total": 1, "current_page": 1, "last_page": 1 } }
  ```

- **Mientras no exista:** candidatos por evaluación en /app/evaluaciones/:id. «Últimas completadas» se arma con GET /api/assessments y GET /api/assessments/{id} de las evaluaciones con completadas, con un tope (por ejemplo, 5), o se omite (D-06). Sin fecha de cierre por candidato (PB-06), ese orden solo puede seguir la fecha de creación de la evaluación.

<a id="pb-06"></a>
### PB-06 · Detalle de evaluación con pruebas y fechas

- **Necesidad:** la tabla del prototipo tiene «Examen asignado» y «Fecha» (Strata.dc.html:826, :828) y la spec pedía fecha por candidato (2026-09-12-fase2-panel-rh-design.md:77). GET /api/assessments/{id} carga `tests` pero no los devuelve, y no trae fecha límite ni fechas por invitación (2026-09-11-fase1-nucleo.md:1473-1486).
- **Pantalla que lo pide:** /app/evaluaciones/:id.
- **Prioridad:** Media.
- **Propuesta (PROPUESTA):** campos nuevos en la respuesta actual.

  ```json
  { "data": { "id": 12, "name": "…", "position": "…", "deadline": "2026-10-15", "created_at": "2026-09-20", "tests": [ { "id": 1, "name": "…" } ], "invitations": [ { "id": 41, "candidate": "…", "email": "…", "status": "iniciada", "link": "…", "sent_at": "2026-09-20 10:00", "opened_at": "2026-09-21 09:00", "completed_at": null, "expires_at": "2026-10-15 00:00" } ] } }
  ```

- **Mientras no exista:** sin columnas de prueba ni de fecha.

<a id="pb-07"></a>
### PB-07 · Estado «expirada» al listar

- **Necesidad:** expirada solo se calcula cuando alguien abre GET /api/evaluar/{token} (2026-09-11-fase1-nucleo.md:1677-1679). RR. HH. puede ver como pendientes o iniciadas invitaciones ya vencidas, y los conteos de GET /api/assessments no incluyen expirada (2026-09-12-fase2-panel-rh.md:588-593, :603-608).
- **Pantalla que lo pide:** Candidatos y Resultados.
- **Prioridad:** Media.
- **Propuesta (PROPUESTA):** calcular el estado efectivo al leer (GET /api/assessments y GET /api/assessments/{id}) o con una tarea programada; agregar `counts.expirada` en GET /api/assessments.
- **Mientras no exista:** se muestra el estado tal como llega y, en la lista, la fecha límite (`deadline`, 2026-09-12-fase2-panel-rh.md:601).

<a id="pb-08"></a>
### PB-08 · Solicitudes de créditos propias

- **Necesidad:** RR. HH. no puede ver sus solicitudes ni su estado; solo existen GET /api/credits y POST /api/credit-requests (2026-09-12-fase2-panel-rh.md:927-931).
- **Pantalla que lo pide:** Créditos (/app/creditos).
- **Prioridad:** Media.
- **Propuesta (PROPUESTA):**

  ```http
  GET /api/credit-requests      (auth:sanctum)
  ```

  ```json
  { "data": [ { "id": 5, "requested_amount": 50, "note": "…", "status": "pendiente", "created_at": "2026-09-20 10:00", "resolved_at": null } ] }
  ```

- **Mientras no exista:** confirmación tras enviar, sin lista de solicitudes.

<a id="pb-09"></a>
### PB-09 · Pago en línea

- **Necesidad:** el checkout del prototipo cobra con tres métodos de pago (Strata.dc.html:1823-1828), suma una fila «Impuestos (16 %)» con tasa fija (:1305, :2082) y acredita al instante (:1247-1321, :2086-2097); su pie promete «Pago cifrado · factura fiscal automática» (:1316). El repo no tiene pasarela (2026-09-12-fase2-panel-rh-design.md:110).
- **Pantalla que lo pide:** catálogo (Tests), drawer de compra y CTA de la home.
- **Prioridad:** Baja; depende de D-09.
- **Propuesta (PROPUESTA):** la compra termina en una transacción `compra` del ledger, como hoy hace la aprobación (2026-09-12-fase2-panel-rh.md:1089-1096).

  ```http
  POST /api/checkout      (auth:sanctum)
  ```

  ```json
  { "credits": 50, "payment_method": "card" }
  ```

  Respuesta 201: `{ "data": { "order_id": "…", "status": "pending", "checkout_url": "…" } }`, más un webhook del proveedor que acredita los créditos. La tasa de impuestos y la facturación necesitan su propia definición.
- **Mientras no exista:** solicitud de créditos con aprobación manual.

<a id="pb-10"></a>
### PB-10 · Precio por prueba y moneda

- **Necesidad:** el prototipo muestra precio por licencia, descuento por volumen y moneda (Strata.dc.html:660-663, :1560-1562). El repo no tiene precios en BD ni tabla de planes (2026-09-12-fase2-panel-rh-design.md:14); los precios están en data/plans.ts como «[PENDIENTE: precio]» (2026-09-11-fase3-sitio-ventas.md:381-409).
- **Pantalla que lo pide:** catálogo, home y paso 1 del builder.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** `price: { "amount": 24, "currency": "MXN" }` en cada prueba de GET /api/catalog, o `GET /api/plans` con los planes.
- **Mientras no exista:** sin precios; /precios con [PENDIENTE].

<a id="pb-11"></a>
### PB-11 · Código corto de invitación

- **Necesidad:** el prototipo usa códigos de 8 caracteres que el candidato escribe a mano (Strata.dc.html:1107-1120, :1553-1558). El repo usa un token de 40 caracteres (2026-09-11-fase1-nucleo.md:1453) y /evaluar solo acepta enlace o token alfanumérico (2026-09-11-fase3-sitio-ventas.md:944-952).
- **Pantalla que lo pide:** acceso (paso 1), inventario y modal de invitación.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** columna `invitations.code`, única, de 8 caracteres de un alfabeto sin caracteres ambiguos, como el del prototipo (Strata.dc.html:1554), y:

  ```http
  GET /api/evaluar/code/{code}
  ```

  Respuesta 200: `{ "data": { "token": "…" } }`; 404 si no existe. El frontend redirige a /evaluar/{token}.
- **Mientras no exista:** enlace o token.

<a id="pb-12"></a>
### PB-12 · Invitación solo con enlace (sin correo)

- **Necesidad:** el prototipo ofrece «Link de licencia: copias un enlace de un solo uso y lo compartes tú» (Strata.dc.html:1985) y enlaces sin candidato (:2127-2136). El backend envía el correo siempre al crear (2026-09-11-fase1-nucleo.md:1459) y exige nombre y correo (:1401-1402). Compartir el enlace por correo o WhatsApp desde el navegador (mailto, wa.me) no necesita backend; lo que falta es poder crear la invitación sin el correo automático.
- **Pantalla que lo pide:** modales de invitación y asignación.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** POST /api/assessments acepta `"send_email": false` (por defecto `true`). Las invitaciones sin candidato requieren otra decisión de producto (D-08).
- **Mientras no exista:** el correo se envía siempre y los enlaces se pueden copiar.

<a id="pb-13"></a>
### PB-13 · Agregar candidatos a una evaluación existente

- **Necesidad:** el prototipo agrega candidatos de uno en uno desde el panel (Strata.dc.html:1376-1418). En el repo solo se agregan al crear la evaluación (2026-09-11-fase1-nucleo.md:1398-1403).
- **Pantalla que lo pide:** detalle de evaluación y panel Candidatos.
- **Prioridad:** Media.
- **Propuesta (PROPUESTA):** consume un crédito por candidato; 422 si no alcanza; 403 si la evaluación es de otra organización.

  ```http
  POST /api/assessments/{id}/candidates      (auth:sanctum)
  ```

  ```json
  { "candidates": [ { "name": "Nombre", "email": "correo@dominio.com", "phone": null } ] }
  ```

  Respuesta 201: `{ "data": { "invitations": [ { "id": 42, "candidate": "…", "email": "…", "status": "pendiente", "link": "…" } ] } }`.
- **Mientras no exista:** se crea una evaluación nueva.

<a id="pb-14"></a>
### PB-14 · Nombre del candidato en el portal

- **Necesidad:** el prototipo muestra el nombre del candidato en la barra del examen (Strata.dc.html:1146, :2198) y pide confirmar datos (:1036-1066); la spec pedía «confirmar nombre» (2026-09-11-fase1-nucleo-design.md:90). GET /api/evaluar/{token} no devuelve datos del candidato (2026-09-11-fase1-nucleo.md:1683-1695).
- **Pantalla que lo pide:** acceso (paso 2) y examen.
- **Prioridad:** Media.
- **Propuesta (PROPUESTA):** `"candidate": { "name": "…" }` en GET /api/evaluar/{token}. Opcional: `PATCH /api/evaluar/{token}/candidate` con `{ "name": "…" }` antes del consentimiento; 409 si ya no admite respuestas.
- **Mientras no exista:** la barra muestra prueba y organización; no hay formulario.

<a id="pb-15"></a>
### PB-15 · Límite de tiempo por prueba

- **Necesidad:** el prototipo muestra una cuenta regresiva (Strata.dc.html:1148-1153, :1526-1540). El repo solo tiene duration_min estimado y elapsed_ms (2026-09-11-fase1-nucleo.md:207, :341).
- **Pantalla que lo pide:** examen.
- **Prioridad:** Baja; depende de D-12.
- **Propuesta (PROPUESTA):** `tests.time_limit_min` (nullable); GET /api/evaluar/{token}/pruebas/{testId} devuelve `time_limit_min` y el `started_at` del attempt; answers y complete responden 409 al vencer.
- **Mientras no exista:** sin cuenta regresiva.

<a id="pb-16"></a>
### PB-16 · Progreso del candidato para RR. HH.

- **Necesidad:** «Ver avance» (Strata.dc.html:1886). El repo solo da el estado de la invitación.
- **Pantalla que lo pide:** Candidatos.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** `"progress": { "answered": 7, "total": 12 }` en cada invitación de GET /api/assessments/{id}.
- **Mientras no exista:** estado en texto.

<a id="pb-17"></a>
### PB-17 · Id de la evaluación en el reporte

- **Necesidad:** «Volver al panel →» (Strata.dc.html:884) debería volver al detalle de la evaluación; el reporte solo trae su nombre (2026-09-11-fase1-nucleo.md:1966-1974).
- **Pantalla que lo pide:** Resultados.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** `"assessment_id": 12` en GET /api/invitations/{id}/report.
- **Mientras no exista:** «Volver» usa el historial, con respaldo a /app/evaluaciones.

<a id="pb-18"></a>
### PB-18 · Índice global, perfil esperado del puesto y percentil normativo

- **Necesidad:** el prototipo muestra un índice global, un «rango esperado del puesto» en el radar y «Percentiles vs. norma LATAM» (Strata.dc.html:891, :917, :929). El repo califica por escala (2026-09-11-fase1-nucleo.md:1934-1953) y su percentil no es normativo: ScoringService guarda percentile como el normalized redondeado (:980) y el baremo demo solo define umbrales (:792-801), aunque la spec pedía al menos un percentil aproximado por interpolación (2026-09-11-fase1-nucleo-design.md:78). La spec del reporte también pedía un «Resumen» prueba × resultado global (2026-09-11-fase1-nucleo-design.md:111), que el plan no implementó.
- **Pantalla que lo pide:** Resultados.
- **Prioridad:** Baja; requiere definición psicométrica y los baremos reales, que siguen pendientes del psicólogo (2026-09-11-fase1-nucleo-design.md:164).
- **Propuesta (PROPUESTA):** `"global": { "normalized": 76, "category": "alto" }` por prueba; `"position_profile": { "RES": [60, 80] }` por escala; y un percentil calculado contra un baremo real cargado en `norms`, conservando la versión usada en cada score (2026-09-11-fase1-nucleo-design.md:82).
- **Mientras no exista:** no se muestran el índice ni el rango esperado; «pc N» aparece sin ningún texto que sugiera una comparación con una población.

<a id="pb-19"></a>
### PB-19 · Envío del reporte por correo

- **Necesidad:** «Envío automático del reporte» a candidato y RR. HH. (Strata.dc.html:956-979). Ningún plan envía reportes por correo; la única notificación es la invitación (2026-09-11-fase1-nucleo.md:1356-1375).
- **Pantalla que lo pide:** Resultados.
- **Prioridad:** Baja. El envío al candidato depende de D-16.
- **Propuesta (PROPUESTA):** solo RR. HH. de la organización.

  ```http
  POST /api/invitations/{id}/report/send      (auth:sanctum)
  ```

  ```json
  { "recipients": ["rh@empresa.com"] }
  ```

  Respuesta 202: `{ "ok": true }`.
- **Mientras no exista:** «Descargar PDF» imprime el reporte (2026-09-12-fase2-panel-rh.md:1836).

<a id="pb-20"></a>
### PB-20 · API del Test Builder

- **Necesidad:** la Fase 5 del brief es el Test Builder (PROMPT_CLAUDE_CODE.md:176) y no hay API de edición: todo se siembra (2026-09-11-fase1-nucleo.md:713-803; 2026-09-11-fase3-sitio-ventas.md:48-95). El modelo existe: tests, scales, items, item_options, scoring_rules y norms (2026-09-11-fase1-nucleo.md:201-266). El prototipo además pide precio, tipo de reactivo, peso, rangos con texto, borrador y versión (Strata.dc.html:360-599).
- **Pantalla que lo pide:** Test Builder (datos, reactivos, algoritmo).
- **Prioridad:** Alta para la Fase 5; sin él la fase queda bloqueada (D-15).
- **Propuesta (PROPUESTA, borrador para revisar con el psicólogo):** todas con auth:sanctum y platform_admin.

  ```http
  GET    /api/admin/tests
  POST   /api/admin/tests                         {slug, name, category, description, duration_min, allows_back, active: false}
  GET    /api/admin/tests/{id}
  PUT    /api/admin/tests/{id}
  POST   /api/admin/tests/{id}/scales             {code, name}
  PUT    /api/admin/tests/{id}/scales/{scaleId}
  DELETE /api/admin/tests/{id}/scales/{scaleId}
  POST   /api/admin/tests/{id}/items              {order, prompt, scale_id, reverse_scored, options: [{label, value}]}
  PUT    /api/admin/tests/{id}/items/{itemId}
  DELETE /api/admin/tests/{id}/items/{itemId}
  PUT    /api/admin/tests/{id}/scoring-rule       {algorithm}   → crea una versión nueva
  PUT    /api/admin/tests/{id}/norms              {data}        → crea una versión nueva
  POST   /api/admin/tests/{id}/publish                          → active = true
  ```

  Pendiente de definir: precio (PB-10), tipo de reactivo, peso, reactivos de práctica (PB-31) y textos de interpretación por rango.
- **Mientras no exista:** sin pantalla ni enlace.

<a id="pb-21"></a>
### PB-21 · Compra individual (B2C)

- **Necesidad:** «Para mí (Sin registro)» con pago único y entrega al correo (Strata.dc.html:138, :2034-2037). El repo no vende y el candidato no ve resultados (2026-09-11-fase1-nucleo-design.md:93).
- **Pantalla que lo pide:** home.
- **Prioridad:** Baja; depende de D-13 y D-16.
- **Propuesta (PROPUESTA):** `POST /api/b2c/orders` con `{ "test_id": 1, "name": "…", "email": "…" }` → pago (PB-09) → invitación propia con token. Entregar el reporte a la persona exige cambiar la regla de C-09.
- **Mientras no exista:** el modo «Para mí» se dirige al candidato invitado.

<a id="pb-22"></a>
### PB-22 · Crear o editar la empresa desde el perfil

- **Necesidad:** un usuario sin empresa no tiene forma de crearla. /perfil le pide «completa el campo "Empresa" y guarda tu perfil», pero el campo no existe y PUT /api/user/profile no lo acepta (2026-09-12-registro-login-crud-usuarios.md:1752, :515-521). La spec sí lo prometía (2026-09-12-registro-login-crud-usuarios-design.md:50, :123).
- **Pantalla que lo pide:** /perfil.
- **Prioridad:** Alta: hoy es un callejón sin salida con un texto que promete algo imposible.
- **Propuesta (PROPUESTA):** PUT /api/user/profile acepta `company_name`; si no hay organización, la crea y otorga los créditos de cortesía; si existe, la renombra. Alternativa: `POST /api/organizations` con `{ "name": "…", "sector": null, "company_size": null }` → 201 `{ "data": { "organization": { "id": 3, "name": "…" } } }`.
- **Mientras no exista:** el aviso deja de pedir un campo inexistente y remite a soporte (SITE.email).

<a id="pb-23"></a>
### PB-23 · Recuperar contraseña

- **Necesidad:** «¿Olvidaste tu contraseña?» es un [PENDIENTE] (2026-09-12-registro-login-crud-usuarios.md:2058; 2026-09-12-registro-login-crud-usuarios-design.md:101).
- **Pantalla que lo pide:** /login.
- **Prioridad:** Media.
- **Propuesta (PROPUESTA):** flujo estándar de Laravel.

  ```http
  POST /api/forgot-password      {email}                                        → 200
  POST /api/reset-password       {token, email, password, password_confirmation} → 200
  ```

  El frontend agregaría una ruta de restablecimiento (D-07).
- **Mientras no exista:** sin enlace.

<a id="pb-24"></a>
### PB-24 · Error estándar en PUT /api/admin/me

- **Necesidad:** si la contraseña actual no coincide, responde 422 con un JSON serializado dentro de `message` y sin `errors` (2026-09-12-registro-login-crud-usuarios.md:694-696).
- **Pantalla que lo pide:** /admin/perfil.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** 422 `{ "message": "…", "errors": { "current_password": ["La contraseña actual es incorrecta."] } }`.
- **Mientras no exista:** mensaje genérico.

<a id="pb-25"></a>
### PB-25 · 422 de créditos insuficientes con código y excepción mapeada

- **Necesidad:** el 422 por saldo llega sin `errors` (2026-09-12-fase2-panel-rh.md:421) e InsufficientCreditsException no está mapeada, así que una carrera entre dos peticiones puede dar 500 (:226, :263); la spec pedía 422 (2026-09-12-fase2-panel-rh-design.md:46).
- **Pantalla que lo pide:** asistente de nueva evaluación.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** 422 `{ "message": "Créditos insuficientes: necesitas 3, tienes 1", "code": "insufficient_credits", "required": 3, "balance": 1 }` y la excepción mapeada a ese mismo 422.
- **Mientras no exista:** el frontend trata un 422 sin `errors` en POST /api/assessments como falta de saldo y muestra el `message` con enlace a /app/creditos.

<a id="pb-26"></a>
### PB-26 · Longitud de la nota de solicitud (255 contra 500)

- **Necesidad:** `credit_requests.note` es VARCHAR 255 (2026-09-12-fase2-panel-rh.md:51) y la validación admite 500 (:910).
- **Pantalla que lo pide:** Créditos.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** `max:255` o columna `text`.
- **Mientras no exista:** el frontend limita la nota a 255 caracteres.

<a id="pb-27"></a>
### PB-27 · Usuarios con last_name nulo

- **Necesidad:** la migración deja last_name nullable (2026-09-12-registro-login-crud-usuarios.md:37), pero el perfil lo exige (:517) y la edición del admin lo valida como string (:584). Un usuario previo con last_name nulo recibe 422.
- **Pantalla que lo pide:** /perfil y /admin/usuarios/:id.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** aceptar null en ambas validaciones o completar los datos existentes.
- **Mientras no exista:** /perfil pide el apellido como obligatorio; la edición del admin no envía last_name si está vacío.

<a id="pb-28"></a>
### PB-28 · Recordatorios y vencimiento por defecto

- **Necesidad:** el prototipo promete «Strata envía el enlace y recuerda a los 3 días» y «Vence en 14 días si no se inicia» (Strata.dc.html:1984, :1368). En el repo expires_at es la fecha límite opcional (2026-09-11-fase1-nucleo.md:1456) y no hay recordatorios: quedaron para una fase posterior (2026-09-11-fase1-nucleo-design.md:37; 2026-09-12-fase2-panel-rh-design.md:110).
- **Pantalla que lo pide:** modales de invitación y asistente.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** tarea programada que reenvía a invitaciones pendientes a los N días; `expires_at` por defecto (por ejemplo, 14 días) cuando no hay fecha límite.
- **Mientras no exista:** ninguna promesa de recordatorio; se muestra la fecha límite real o «Sin fecha límite».

<a id="pb-29"></a>
### PB-29 · Sección del reactivo en el portal

- **Necesidad:** «Sección: {sección}» en cada pregunta (Strata.dc.html:1168), que en el prototipo es un dato de cada reactivo (:1451-1456, :2204). Los ítems del portal no traen su escala (2026-09-11-fase1-nucleo.md:1730-1736).
- **Pantalla que lo pide:** examen.
- **Prioridad:** Baja. Consultar con el psicólogo: mostrar la escala puede sesgar las respuestas.
- **Propuesta (PROPUESTA):** `"section": "…"` en cada ítem.
- **Mientras no exista:** se omite.

<a id="pb-30"></a>
### PB-30 · Respuestas del candidato para RR. HH.

- **Necesidad:** «Ver respuestas» (Strata.dc.html:986). No hay endpoint de respuestas para RR. HH.
- **Pantalla que lo pide:** Resultados y Candidatos.
- **Prioridad:** Baja; con criterio del psicólogo.
- **Propuesta (PROPUESTA):** `GET /api/invitations/{id}/answers` → `{ "data": [ { "order": 1, "prompt": "…", "value": 4, "label": "De acuerdo", "elapsed_ms": 5200 } ] }`; 403 si es de otra organización.
- **Mientras no exista:** «Ver respuestas» no se muestra.

<a id="pb-31"></a>
### PB-31 · Reactivos de práctica

- **Necesidad:** la spec del portal pide «Instrucciones + 2 reactivos de práctica (no se califican)» (2026-09-11-fase1-nucleo-design.md:91). La tabla `items` no distingue reactivos de práctica (2026-09-11-fase1-nucleo.md:228-235), GET /api/evaluar/{token}/pruebas/{testId} devuelve todos los reactivos (:1728-1737) y ScoringService califica todos los que tienen respuesta (:953-965). Las instrucciones actuales no incluyen práctica (:2885-2891). El frontend no puede resolverlo solo: un reactivo de práctica no debe guardarse como respuesta calificable.
- **Pantalla que lo pide:** examen (instrucciones).
- **Prioridad:** Baja; con criterio del psicólogo.
- **Propuesta (PROPUESTA):** `items.is_practice` (booleano), excluido del scoring, del progreso y de `answered`; o un campo `practice: [ { "prompt": "…", "options": [ { "label": "…", "value": 1 } ] } ]` en la respuesta de GET /api/evaluar/{token}/pruebas/{testId}, cuyas respuestas el frontend no envía a POST answers.
- **Mientras no exista:** no hay reactivos de práctica; las instrucciones explican la escala con texto.

<a id="pb-32"></a>
### PB-32 · Verificación de correo

- **Necesidad:** la spec de Fase 1 pedía verificar el correo con el mecanismo estándar de Laravel (`MustVerifyEmail`), registrándolo sin bloquear (2026-09-11-fase1-nucleo-design.md:99). El registro actual crea el usuario e inicia sesión sin verificar (2026-09-12-registro-login-crud-usuarios.md:302-317), ningún plan define endpoints de verificación y `email_verified_at` solo aparece en los casts del modelo (:66). El registro de Fase 1 ya decía «te enviaremos un correo de verificación» sin enviarlo (2026-09-11-fase1-nucleo.md:2368); ese texto no está en el registro actual.
- **Pantalla que lo pide:** registro y perfil.
- **Prioridad:** Baja; depende del dueño.
- **Propuesta (PROPUESTA):** flujo estándar de Laravel.

  ```http
  POST /api/email/verification-notification     (auth:sanctum)     → 202
  GET  /api/email/verify/{id}/{hash}            (enlace firmado)   → redirige al frontend
  ```

  Y que GET /api/user incluya `email_verified_at`. El frontend necesitaría una ruta de aterrizaje nueva, que habría que proponer antes (regla 4, PROMPT_CLAUDE_CODE.md:40).
- **Mientras no exista:** ningún texto promete un correo de verificación.

<a id="pb-33"></a>
### PB-33 · Marca STRATA en los datos sembrados del backend

- **Necesidad:** con la marca Strata (D-03), algunos datos sembrados siguen diciendo «Mez»: la organización del operador es «Mez (operación)» (2026-09-12-registro-login-crud-usuarios.md:93) y el operador se siembra con nombre «Operador», apellido «Mez» y correo por defecto admin@mez.dev (:95-98, :114-116). Esos datos se ven en la pastilla de la barra (organización y nombre) y en /admin/usuarios. D-03 deja estos datos en manos del compañero, y este documento es el canal acordado (regla 1, PROMPT_CLAUDE_CODE.md:37).
- **Pantalla que lo pide:** barra superior y /admin/usuarios.
- **Prioridad:** Baja; depende de D-03.
- **Propuesta (PROPUESTA):** renombrar la organización y el operador en PlatformAdminSeeder y el valor por defecto de ADMIN_EMAIL en `.env.example`. Revisar también el nombre con el que firman los correos: la plantilla de correo de Laravel usa el nombre de la app (conocimiento externo) y ningún plan documenta APP_NAME.
- **Mientras no exista:** el frontend muestra los datos tal como llegan; no los reescribe.

<a id="pb-34"></a>
### PB-34 · Bandera multidispositivo en la integridad

- **Necesidad:** la spec registra como dato de integridad una «bandera multi-dispositivo (user_agent distinto en mismo token)» (2026-09-11-fase1-nucleo-design.md:95). La tabla `attempt_events` prevé el tipo multidevice (2026-09-11-fase1-nucleo.md:351), pero POST /api/evaluar/{token}/events solo guarda lo que manda el cliente (:1760-1772) y el cliente solo manda blur (:2810). Un navegador no puede saber si el mismo enlace se abrió en otro dispositivo; el backend sí, porque ya guarda el user agent del consentimiento (:1703-1711). El reporte solo cuenta blur (:1939).
- **Pantalla que lo pide:** Resultados (integridad de cada prueba).
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** en consent, answers y events, comparar el user agent de la petición con el del consentimiento; si cambia, registrar un evento multidevice una sola vez por attempt; en GET /api/invitations/{id}/report, agregar `integrity.multidevice` (booleano o conteo) por prueba. Si se decide enviar también eventos focus con payload (D-25), el reporte tendría que exponerlos.
- **Mientras no exista:** el reporte muestra solo las pérdidas de foco (blur).

<a id="pb-35"></a>
### PB-35 · Mensajes de validación (422) en español

- **Necesidad:** los FormRequest no definen `messages()` (RegisterRequest, 2026-09-12-registro-login-crud-usuarios.md:244-265; UpdateProfileRequest, UpdatePasswordRequest y AdminUpdateUserRequest, :509-588; StoreLeadRequest, 2026-09-10-sales-site.md:593-611) y ningún plan configura el idioma de Laravel (APP_LOCALE ni archivos `lang/es`). Si el backend real tampoco los tiene (por confirmar con PB-01), cada 422 llega con el texto en inglés de Laravel, por ejemplo «The email has already been taken.», y la UI lo muestra tal cual junto al campo, como siempre hizo.
- **Pantalla que lo pide:** /registro, /perfil, /admin/perfil, /demo y /admin/usuarios/:id (errores por campo, Fase 7). También el drawer «Solicitar créditos» de /app/creditos, que traduce en el frontend los mensajes de sus propias reglas (`pages/app/creditos/solicitud.ts`), y el asistente de /app/evaluaciones/nueva, que muestra los 422 por campo de POST /api/assessments tal como llegan (Fase 4).
- **Prioridad:** Media: los campos funcionan, pero el texto sale en otro idioma.
- **Propuesta (PROPUESTA):** `APP_LOCALE=es` (y `APP_FALLBACK_LOCALE`) con las traducciones de validación en `lang/es/validation.php` y nombres de atributo en español (`attributes`), o `messages()` en cada FormRequest.
- **Mientras no exista:** el frontend valida en el cliente, con textos en español, lo que ya exigía el servidor y es seguro repetir (obligatorios del login, confirmación de contraseña, fecha anterior a hoy, largo mínimo y nombre del usuario en el admin). Los 422 del servidor se muestran tal como llegan, en su campo.

<a id="pb-36"></a>
### PB-36 · Fecha límite: vence al empezar el día y acepta fechas pasadas

- **Necesidad:** POST /api/assessments valida `deadline` solo como `nullable|date` (2026-09-11-fase1-nucleo.md:1404) y guarda `expires_at` con esa fecha (:1456), es decir, a las 00:00 de ese día. GET /api/evaluar/{token} marca la invitación como expirada en cuanto `expires_at` pasó (:1677): vence al empezar el día límite, aunque el correo de invitación dice «Fecha límite: dd/mm/aaaa» (:1373) y el candidato entiende que puede responder ese día. Con una fecha de hoy o anterior, los enlaces nacen vencidos y los créditos se consumen igual. Además, consent, answers y complete solo revisan el `status` (:1799): si la fecha pasa a mitad del examen, el backend sigue aceptando respuestas hasta que alguien vuelve a pedir GET /api/evaluar/{token} (inferencia del código del plan). Surgió en la Fase 4, al diseñar el asistente.
- **Pantalla que lo pide:** asistente de nueva evaluación (fecha límite) y portal del candidato.
- **Prioridad:** Media: un candidato puede encontrar vencida su invitación el mismo día que el correo le da como límite.
- **Propuesta (PROPUESTA):** validar `deadline` con `after:today` (422 por campo) y vencer al final del día: `expires_at` a las 23:59:59 de esa fecha, en la zona horaria de la aplicación, o comparar con el fin del día. Revisar también `expires_at` en `assertAnswerable`, para que answers y complete respondan 409 en cuanto venza.
- **Mientras no exista:** el asistente solo acepta fechas posteriores a hoy (`validarFechaLimite`, `pages/app/nueva/modelo.ts`) y el mensaje para compartir por correo o WhatsApp dice «Responde antes del dd/mm/aaaa» (`pages/app/invitaciones/mensaje.ts`). El texto del correo automático es del backend y no cambia.

<a id="pb-37"></a>
### PB-37 · Teléfono del candidato en las invitaciones

- **Necesidad:** el asistente envía el teléfono opcional de cada candidato y el backend lo guarda (2026-09-11-fase1-nucleo.md:1403, :1449), pero no lo devuelven ni POST /api/assessments (:1460) ni GET /api/assessments/{id} (:1479-1484). Por eso el canal «WhatsApp» de D-10 abre `https://wa.me/?text=…` sin número, y RR. HH. elige el contacto a mano. Surgió en la Fase 4, con los canales para compartir.
- **Pantalla que lo pide:** pantalla de enlaces del asistente y modal «Enlace de invitación» del detalle de la evaluación.
- **Prioridad:** Baja.
- **Propuesta (PROPUESTA):** `"phone": "+525512345678"` (o `null`) en cada invitación de las dos respuestas, en formato internacional. Con el número, el frontend abriría `https://wa.me/<número>?text=…`.
- **Mientras no exista:** WhatsApp se abre sin destinatario, con el mensaje y el enlace real (`pages/app/invitaciones/mensaje.ts`).
