# Mez — Fase 3: Sitio de ventas (diseño)

**Fecha:** 2026-09-11
**Estado:** Aprobado por el usuario
**Origen:** `prompt-claude-code-mezquit.md` (brief del sitio) + `prompt-flujos-mettl-mezquit.md` sección 3 (IA) + `docs/design-tokens.md`.
**Alcance:** Reestructurar el sitio de ventas a la arquitectura de información del documento Mettl, con el catálogo real desde la base de datos (tabla `tests` de Fase 1) y el componente `Report` compartido.

## Decisiones aprobadas

1. **Nombre:** Mez (se mantiene `SITE.name = 'Mez'`). El brief decía "Mezquit" pero quedó desactualizado.
2. **Catálogo:** desde la base de datos + API pública. Se siembra la tabla `tests` con las pruebas de marketing y se exponen endpoints públicos read-only.
3. **IA:** adoptar la IA Mettl completa. Mover la metodología de `/psicometria` a `/como-funciona`. Eliminar `/nosotros`, `/test`, `/psicometria`.
4. **Baterías/paquetes:** se **omiten** del sitio por ahora (evita una sección solo-placeholder). Se agregan cuando el psicólogo defina las baterías. `[PENDIENTE: baterías por puesto]`.

## Restricciones heredadas

- Paleta y reglas de `docs/design-tokens.md` obligatorias.
- Prohibido inventar cifras/testimonios/logos/premios/precios. Faltantes → `[PENDIENTE: …]` visible.
- Español de México, tuteo, frases cortas. Promesas prohibidas ("sin sesgos", "predice el desempeño", etc.).
- Sin nombres de pruebas comerciales (usar categorías). Sin "IA" salvo función real.
- Corchetes `[ ]` solo para cantidades/rangos. Numeración solo en "Cómo funciona". Textura SVG solo hero + separador tenue.
- No instalar librerías de animación/WebGL/scroll suave.
- Sistema de diseño ya existe (tokens, Cormorant Garamond + DM Sans autohospedadas, textura, `Report` compartido). No se re-propone tipografía.

## Arquitectura de información

```
/                     Inicio (resumen que enlaza)
/pruebas              Catálogo desde BD (filtro por categoría, conteos, búsqueda)
/pruebas/:slug        Detalle de prueba + reporte de ejemplo (componente Report)
/como-funciona        4 pasos numerados + metodología
/precios              Planes públicos (data source, precios [PENDIENTE])
/demo                 Formulario calificador + agenda
/ayuda                "Soy candidato" / "Soy empresa"
/aviso-de-privacidad  Legal [PENDIENTE contenido]
/terminos             Legal [PENDIENTE contenido]
/evaluar              Landing: pegar código/enlace → /evaluar/:token
/login, /registro     (ya existen)
```

Se eliminan las rutas `/test`, `/psicometria`, `/nosotros`.

## Backend — catálogo público

**Seeder `CatalogSeeder`** (`database/seeders/CatalogSeeder.php`): siembra la tabla `tests` con ~18 pruebas de marketing en 4 categorías (personalidad, razonamiento, integridad, intereses), con nombres genéricos (sin marcas), `slug` único, `description`, `duration_min`, `item_count`, `requires_license = false`, `active = true`. Sin `items` (metadata de catálogo; solo la Prueba de demostración tiene reactivos). Idempotente con `updateOrCreate` por slug. Registrado en `DatabaseSeeder` después de `DemoTestSeeder`.

**Exclusión de la prueba de demostración:** es una prueba interna de desarrollo, no un producto. El endpoint del catálogo la excluye filtrando por su slug conocido `prueba-de-demostracion`. Así el catálogo público muestra solo las 18 de marketing.

**Endpoints públicos (read-only, sin auth)** en `routes/api.php`:
- `GET /api/catalog` → `{ data: [ { id, label, tests: [ {id, slug, name, description, duration_min, item_count} ], count } ] }` agrupado por categoría, solo pruebas `active = true`, `requires_license = false`, slug ≠ `prueba-de-demostracion`. `count` = número de pruebas de la categoría.
- `GET /api/catalog/{slug}` → detalle de una prueba (404 si no existe/no publicable).

Controlador `CatalogController` (index, show). Sin modelo nuevo; usa `Test`/`Scale`. Feature tests: catálogo agrupa por categoría con conteos; excluye la prueba de demostración y las `requires_license`; detalle por slug; 404 para slug inexistente.

## Frontend — páginas

**Nuevas** (`src/pages/`):
- `PruebasPage` — consume `GET /api/catalog`; filtro por categoría (botones `aria-pressed`), búsqueda por texto (filtra en cliente), conteos `[ N pruebas ]` desde la API. Cada prueba enlaza a `/pruebas/:slug`.
- `PruebaDetallePage` — consume `GET /api/catalog/:slug`; qué mide, duración, número de reactivos `[ N ]`, y el reporte de ejemplo (componente `Report` con datos de muestra, badge "Ejemplo").
- `ComoFuncionaPage` — 4 pasos numerados (`HowItWorks`) + metodología (`Methodology`, movida de psicometría).
- `PreciosPage` — planes desde `data/plans.ts`, precios `[PENDIENTE]`, tabla de inclusiones, fila "¿más de 200/mes?" → `/demo`.
- `DemoPage` — `ContactSection` (formulario calificador POST `/api/leads`) + bloque de agenda.
- `AyudaPage` — dos secciones: "Soy candidato" y "Soy empresa" (FAQ estáticas verificables).
- `AvisoPrivacidadPage`, `TerminosPage` — `PageHeader` + `[PENDIENTE: contenido legal]`.
- `EvaluarLanding` (`src/pages/candidate/EvaluarLanding.tsx`) — campo para pegar código o enlace; extrae el token (acepta token pelón o URL `/evaluar/{token}`) y navega a `/evaluar/:token`. Layout mínimo del sitio.

**Reusados:** `Hero`, `Report`, `HowItWorks`, `Methodology`, `ContactSection`, `GrainTexture`, `PageHeader`, `Button`.

**Eliminados:** `pages/TestPage.tsx`, `pages/PsicometriaPage.tsx`, `pages/NosotrosPage.tsx`, `sections/CompanyInfo.*`, `sections/Testimonials.*`, `sections/PackagesSection.*`, `sections/TestInventory.*`, `sections/Catalog.*` (se reemplaza por PruebasPage con API), `data/catalog.ts`, `data/packages.ts`, `data/company.ts`.

**Homepage** (`pages/HomePage.tsx`): Hero → adelanto de reporte (`Report` de ejemplo) con enlace a `/como-funciona` → adelanto de catálogo (4 categorías con conteos desde `GET /api/catalog`, versión resumida) con "Ver todas las pruebas" → `/pruebas` → `HowItWorks` → cierre con CTA a `/demo`. El formulario completo vive en `/demo`, no en la home (evita duplicar).

## Navegación

- **Header** (`components/layout/Header.tsx`): nav = Pruebas · Cómo funciona · Precios · Ayuda + CTA "Agenda una demo" (a `SITE.calendarUrl` o `/demo`). Hover-slide de escritorio se conserva.
- **Menú hamburguesa móvil:** nuevo. Botón que abre un panel con los mismos enlaces + "¿Te invitaron a una evaluación?" → `/evaluar`. Estado React mínimo; la animación de apertura se desactiva con `prefers-reduced-motion`. Cierra al navegar.
- **Footer** (`components/layout/Footer.tsx`): enlaces legales reales (`/aviso-de-privacidad`, `/terminos`, `/ayuda`), "¿Te invitaron a una evaluación?" → `/evaluar`, contacto, y `[PENDIENTE: razón social del titular]`.

## Datos y clientes

- `src/api/catalog.ts` — `getCatalog()`, `getTest(slug)` con tipos `CatalogCategory`, `CatalogTest`.
- `src/data/plans.ts` — planes con `price: '[PENDIENTE: precio]'` (única fuente).
- `src/config/site.ts` — sin cambios de nombre (Mez).

## Flujo de datos y errores

- Catálogo: SPA hace fetch a la API en `PruebasPage`/homepage; estado de carga ligero; error → mensaje discreto con reintento. Hero es estático (LCP rápido).
- Formulario de `/demo`: POST `/api/leads`, manejo de errores 422 (ya implementado en `ContactSection`).
- `/pruebas/:slug` inexistente → 404 amigable (reusa `NotFoundPage` o mensaje inline).
- `/evaluar` landing: si el código/enlace es inválido, mensaje; si válido, navega.

## Testing / criterios de aceptación

- Contraste AA y bordes 3:1 según tokens; foco de teclado visible; `prefers-reduced-motion` elimina animaciones no esenciales (textura, hover-slide, menú móvil).
- El reporte de ejemplo del sitio y el reporte real usan el **mismo componente `Report`** (ya se cumple; se mantiene).
- Conteos del catálogo salen de la BD (API), no hardcodeados.
- Backend: feature tests de `CatalogController` (agrupación, conteos, exclusión de demo y licenciadas, detalle, 404).
- Frontend: `tsc --noEmit` y `npm run build` limpios; capturas a 375px y 1440px de cada página nueva, revisadas antes de entregar.
- Lighthouse móvil objetivo: Performance ≥ 90, Accesibilidad ≥ 95, LCP < 2.5s.

## Fuera de alcance

Pasarela de pago, modelo `plans`/`credit_transactions` en BD (Fase 2), baterías reales, panel de RH, integraciones, contenido legal real, testimonios.

## Lista de [PENDIENTE] que genera esta fase

1. Precios de cada plan (`data/plans.ts`)
2. `SITE.calendarUrl` (enlace de agenda)
3. `SITE.email` (correo de contacto)
4. Razón social del titular (footer)
5. Contenido legal de `/aviso-de-privacidad` y `/terminos`
6. Baterías/paquetes por puesto (definir con el psicólogo)
7. Afirmaciones verificables de confianza (si se reintroduce un bloque de confianza)
