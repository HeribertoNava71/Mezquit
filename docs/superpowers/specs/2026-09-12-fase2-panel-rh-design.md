# Mez — Fase 2: Panel de RH (diseño)

**Fecha:** 2026-09-12
**Estado:** Aprobado por el usuario
**Origen:** `prompt-flujos-mettl-mezquit.md` fase 2 (F2, F4, F7, F8, F9) + `docs/design-tokens.md`.
**Alcance:** Panel autenticado de RH: lista de evaluaciones, estados, reenvío, tabla comparativa, exportación (PDF/CSV), y ledger de créditos con aprobación manual por super-admin.

## Decisiones aprobadas

1. **Créditos: descontar y bloquear.** Crear evaluación descuenta 1 crédito por candidato y bloquea si el saldo no alcanza. Orgs nuevas reciben créditos de cortesía al registrarse.
2. **Aprobación por super-admin (UI).** Un operador de Mez (`is_platform_admin`) revisa y aprueba/rechaza solicitudes de créditos en `/admin/creditos`.
3. **Unidad de crédito:** 1 crédito = 1 candidato invitado.
4. **PDF** desde el mismo HTML con `@media print` (sin librería, sin plantilla aparte). **CSV** de la comparativa generado en el cliente.
5. **Sin tabla `plans` en BD** (precios estáticos y `[PENDIENTE]`; YAGNI).

## Restricciones heredadas

- Panel de RH = superficie densa, sobria, orientada a datos.
- Éxito/error nunca solo por color: ícono + texto. Estados y niveles con etiqueta de texto, no solo color.
- Eventos de integridad se muestran como dato neutro, nunca como acusación.
- El saldo de créditos siempre coincide con la suma de transacciones (nunca se guarda editable).
- Un score guardado no cambia retroactivamente (ya garantizado en Fase 1).
- Convenciones: `#[Fillable]`, migraciones anónimas, tests `RefreshDatabase`, Sanctum SPA.

## Modelo de datos (nuevo)

```
credit_transactions (id, organization_id FK, type: compra|consumo|cortesia|ajuste,
                     amount int (negativo = consumo), reference nullable, meta json nullable,
                     created_at)
credit_requests     (id, organization_id FK, requested_amount int, note nullable,
                     status: pendiente|aprobada|rechazada, resolved_by nullable FK users,
                     resolved_at nullable, timestamps)
users               + is_platform_admin bool default false
```

**Saldo** = `SUM(amount)` de `credit_transactions` de la organización. Nunca se persiste como columna editable.

**Modelos:** `CreditTransaction`, `CreditRequest` con `#[Fillable]`. Relación `Organization hasMany creditTransactions/creditRequests`. `User` gana `is_platform_admin` en `#[Fillable]` y cast bool.

## CreditService

`app/Services/CreditService.php`:
- `balance(Organization $org): int` — suma de amounts.
- `grant(Organization $org, int $amount, string $type, ?string $reference = null): CreditTransaction` — inserta transacción positiva (compra/cortesia/ajuste).
- `consume(Organization $org, int $amount, ?string $reference = null): void` — verifica `balance >= amount`; si no, lanza `InsufficientCreditsException` (mapeada a 422); si sí, inserta transacción `consumo` de `-amount`.

## Integración de créditos

- **Registro** (`RegisterController`): tras crear la org, `CreditService::grant($org, config('credits.free_signup'), 'cortesia', 'registro')`. Config `config/credits.php` → `'free_signup' => env('CREDITS_FREE_SIGNUP', 10)`. Valor real `[PENDIENTE: número de créditos de cortesía]`.
- **Crear evaluación** (`AssessmentController::store`): todo dentro de una misma transacción DB (`DB::transaction`). Primero se verifica saldo (`balance >= count($candidates)`); si no alcanza, se aborta con 422 `{message: 'Créditos insuficientes: necesitas X, tienes Y'}` sin crear nada. Si alcanza, se crea el assessment + invitaciones y luego `consume($org, count($candidates), "assessment:{id}")` referenciando el assessment recién creado. Si algo falla, la transacción hace rollback y no queda saldo consumido ni evaluación a medias. El `AssessmentTest` de Fase 1 se actualiza para otorgar cortesía a la org antes de crear.

## Endpoints backend

**RH (`auth:sanctum`):**
- `GET /api/assessments` — lista evaluaciones de la org: `{id, name, position, deadline, status, counts:{pendiente,iniciada,completada,total}, created_at}`.
- `POST /api/invitations/{invitation}/resend` — reenvía `InvitationNotification` (403 si no es de su org; 409 si `completada`); actualiza `sent_at`.
- `GET /api/assessments/{id}/compare` — `{assessment, scales:[{code,name}], rows:[{candidate, invitation_id, status, scores:{[scaleCode]:{category,percentile,normalized}}}]}` para candidatos `completada`.
- `GET /api/credits` — `{balance, transactions:[{type, amount, reference, created_at}]}`.
- `POST /api/credit-requests` — crea solicitud `pendiente` (`requested_amount` requerido, `note` opcional).

**Super-admin (`auth:sanctum` + middleware `platform_admin`):**
- `GET /api/admin/credit-requests` — solicitudes `pendiente` de todas las orgs con nombre de org y saldo actual.
- `POST /api/admin/credit-requests/{id}/approve` — `CreditService::grant(org, requested_amount, 'compra', 'request:{id}')`, marca `aprobada`, guarda `resolved_by/at`.
- `POST /api/admin/credit-requests/{id}/reject` — marca `rechazada`.

**Middleware `platform_admin`:** aborta 403 si `! $request->user()?->is_platform_admin`.

Feature tests (TDD): saldo por suma; cortesía en registro; bloqueo por insuficiencia (422); consumo correcto; reenvío (y 409 en completada); comparativa (solo completadas, matriz correcta); credit-request creación; approve suma compra y sube saldo; reject no cambia saldo; aislamiento por org; super-admin guard (403 para no-admin).

## Frontend RH (`/app`)

Layout `AppLayout` gana nav: **Resumen · Evaluaciones · Créditos** + saldo visible + salir.

- **`/app`** (Resumen/dashboard): saldo de créditos, número de evaluaciones activas, lista de últimas completadas (enlace a reporte).
- **`/app/evaluaciones`** (lista): tabla nombre/puesto/estado (X de Y completadas)/fecha → enlace a detalle. Botón "Nueva evaluación".
- **`/app/evaluaciones/:id`** (detalle): tabla de candidatos (nombre, correo, estado con ícono+texto, fecha), acciones por fila: "copiar enlace", "reenviar", "ver reporte" (si completada). Botón "Comparar candidatos".
- **`/app/evaluaciones/:id/comparar`**: tabla candidatos × escalas, celdas con categoría (texto) + percentil, **ordenable por columna** (click en encabezado), botón "Exportar CSV" (Blob en cliente).
- **`/app/creditos`**: saldo grande, historial de transacciones (tabla tipo/monto/fecha con signo), formulario "Solicitar más créditos" (cantidad + nota) → POST; muestra confirmación.
- **`/app/candidatos/:invitationId/reporte`** (existe): agregar botón "Descargar PDF" → `window.print()`. CSS `@media print` en `Report.css` oculta nav/botones y ajusta márgenes; el pie legal se conserva.

Clientes API: `src/api/rh.ts` (assessments list, detail ya existe, resend, compare, credits, credit-requests).

## Frontend super-admin (`/admin`)

- Árbol de rutas `/admin` con layout mínimo (`AdminLayout`), guardado por `is_platform_admin` (si no, redirige/deniega).
- **`/admin/creditos`**: tabla de solicitudes pendientes (org, saldo actual, cantidad solicitada, nota, fecha) con botones "Aprobar" / "Rechazar". Al resolver, la fila desaparece.
- Cliente `src/api/admin.ts`.
- Se siembra un usuario operador (`is_platform_admin=true`) vía un seeder de dev (`PlatformAdminSeeder`, credenciales `[PENDIENTE]`/dev por defecto).

## Flujo de datos y errores

- Créditos insuficientes al crear evaluación → 422; el wizard muestra el mensaje y enlace a `/app/creditos`.
- Reenvío en completada → 409; UI deshabilita el botón para completadas.
- Comparativa sin candidatos completados → tabla vacía con nota.
- Super-admin: no-admin recibe 403; la ruta `/admin` verifica `is_platform_admin` del usuario cargado.

## Testing / criterios de aceptación

- El saldo mostrado y usado siempre = suma de transacciones (test).
- No se puede crear una evaluación sin saldo suficiente (test 422; UI bloquea).
- Reenvío funciona y respeta estados; comparativa refleja solo completadas.
- Solo un `is_platform_admin` puede aprobar; aprobar sube el saldo por una transacción `compra`.
- PDF del reporte se genera desde el mismo componente (print CSS); CSV de la comparativa descarga en el cliente.
- Aislamiento por organización en todos los endpoints de RH.
- Backend suite verde; frontend `tsc`/`build` limpios; capturas de lista, detalle, comparativa, créditos y admin a 375/1440px.

## Fuera de alcance

Pasarela de pago, tabla `plans` en BD, recordatorio automático y webhook (Fase 4), sitio de ventas (Fase 3, hecho).

## Lista de [PENDIENTE]

1. `[PENDIENTE: número de créditos de cortesía]` (config `credits.free_signup`)
2. Credenciales reales del operador super-admin (dev usa un seeder)
3. Precios de planes (siguen en `data/plans.ts` del sitio)
