# Strata · frontend

Frontend de Strata, la plataforma de evaluaciones psicométricas: sitio público, portal de RR. HH., portal del candidato y operación (super admin). Tiene el rediseño STRATA del prototipo aprobado, construido sobre una reconstrucción del frontend original hecha desde los planes de `docs/superpowers/plans`, porque el código real todavía no está en el repo (D-26 y PB-01).

- **Stack.** React 19, TypeScript 6, Vite 8, react-router-dom 7 en modo declarativo, CSS vanilla con custom properties (un .css por componente), axios con la sesión Sanctum por cookie y GSAP 3.12 solo para la mascota. Pruebas con Vitest y Testing Library, y de extremo a extremo con Playwright y axe-core.
- **Estado (2026-10-02).** Fases 1 a 4 y 6 a 8 hechas; la 5 (Test Builder) espera backend. Qué falta y por qué: [docs/rediseno/estado-final.md](../docs/rediseno/estado-final.md).
- **Reglas del rediseño.** El repo manda en datos, endpoints, validaciones, permisos y reglas; el prototipo manda en apariencia, navegación, estados, microcopy y movimiento. Lo que el prototipo muestra sin backend no se simula: se oculta o se adapta. Detalle en [docs/rediseno/](../docs/rediseno/).

## Requisitos

- Node 22.12 o superior (lo pide Vitest 5; Vite 8 pide 20.19).
- Para usar el sitio con datos: el backend Laravel con Sanctum en `VITE_API_URL` (por defecto, http://localhost:8000). Las pruebas no lo necesitan.
- Para Playwright, la primera vez: `npx playwright install chromium`.

## Inicio rápido

```bash
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:8000
npx vite --port 5173 --strictPort
```

Abre http://localhost:5173. El puerto tiene que ser 5173 y el host `localhost`: Sanctum y CORS solo admiten ese origen. Con `--strictPort`, Vite se detiene si el puerto está ocupado en lugar de tomar otro. Cómo preparar el backend y qué revisar contra él: [estado-final.md, «Cómo correr el frontend contra el backend real»](../docs/rediseno/estado-final.md#backend-real).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite (5173 por defecto) |
| `npm run build` | `tsc -b` (app, configuración y pruebas de extremo a extremo) y `vite build` en `dist/` |
| `npm run preview` | Sirve `dist/` |
| `npm run typecheck` | TypeScript del código de la app, sin emitir |
| `npm run lint` | ESLint en todo el proyecto |
| `npm test` | Vitest: 145 archivos y 1159 pruebas (unos 4 min). Un archivo: `npx vitest run src/components/ui/Button.test.tsx` |
| `npm run test:e2e` | Playwright: 19 recorridos en Chromium con la API simulada y movimiento reducido. Levanta Vite en el puerto 5189 (unos 60 s). Un archivo: `npx playwright test admin` |

Otros, con `node` y desde esta carpeta:

| Script | Qué hace |
|---|---|
| `scripts/captura.mjs <url> <nombre> [anchos] --mock e2e/mocks/<escenario>.json` | Captura de página completa en `.capturas/`, con la API simulada. `--validar` revisa los mocks sin abrir el navegador. La cabecera del archivo explica todas las opciones |
| `scripts/generate-favicons.mjs` | Genera favicons, apple-touch-icon y og-image desde `public/brand/strata-mark.png` |
| `e2e/a11y.mjs`, `recorrido.mjs`, `barras.mjs`, `tablas.mjs`, `teclado.mjs`, `contraste.mjs`, `toast-overlay.mjs`, `fugas-mascota.mjs` y `capturas.mjs` | QA de la Fase 8 (axe, desborde y consola, barras, tablas, teclado, contraste, toast, fugas de la mascota y capturas de todas las rutas). Necesitan el sitio en `npx vite --port 5188 --strictPort`. En Git Bash, las opciones con rutas van con `MSYS_NO_PATHCONV=1` |

## Estructura

```text
frontend-strata/
├── index.html             Entrada: title, Open Graph y fuentes de Fontshare
├── showcase.html          Galería del sistema de diseño (solo desarrollo; el build no la publica)
├── public/                Favicons, og-image y brand/ (salamandra, emblema, logo y mascota)
├── scripts/               captura.mjs y generate-favicons.mjs
├── e2e/
│   ├── mocks/             Escenarios de la API en JSON
│   ├── flujos/            Recorridos de Playwright (npm run test:e2e) y api.ts, la API simulada
│   └── *.mjs              Scripts de QA de la Fase 8; comun.mjs tiene las 49 rutas con su mock
└── src/
    ├── main.tsx, App.tsx  Arranque, proveedores y rutas, con carga perezosa por ruta
    ├── api/               Clientes de la API: axios con Sanctum, sesión vencida y 419
    ├── context/           AuthContext: la sesión (GET /api/user)
    ├── config/site.ts     SITE: marca y datos del sitio, con los [PENDIENTE] del dueño
    ├── data/              Planes de /precios
    ├── components/
    │   ├── ui/            Componentes base del sistema de diseño
    │   ├── layout/        PageLayout, barras por rol (topbar/), pie, transición y ScrollToTop
    │   ├── mascota/       Mascota de la home (GSAP, carga diferida y preferencia para ocultarla)
    │   └── *.tsx          Guardas de ruta, SessionWatcher y respaldo de la carga perezosa
    ├── pages/             Pantallas: públicas en la raíz y en home/, catalogo/ y publicas/;
    │                      app/ (RR. HH.), admin/, auth/, candidate/, perfil/ y legal/
    ├── sections/          Secciones compartidas: Hero, HowItWorks, Methodology, ContactSection y Report
    ├── styles/            tokens.css, global.css, typography.css y animations.css
    ├── dev/               Galería de showcase.html
    └── test/              setup.ts de Vitest y datos de prueba
```

Las pruebas van junto a lo que prueban (`Componente.test.tsx`). El alias `@` apunta a `src/`.

### Rutas

| Zona | Rutas | Guarda |
|---|---|---|
| Pública | `/`, `/pruebas`, `/pruebas/:slug`, `/como-funciona`, `/precios`, `/demo`, `/ayuda`, `/aviso-de-privacidad`, `/terminos` y 404 | — |
| Acceso | `/login` y `/registro` | Con sesión, a `/app` o `/perfil` |
| Perfil | `/perfil` | Sesión |
| Candidato | `/evaluar` y `/evaluar/:token` | — (el enlace trae el token de la invitación) |
| RR. HH. | `/app` (Resultados), `/app/pruebas`, `/app/evaluaciones`, `/app/evaluaciones/nueva`, `/app/evaluaciones/:id`, `/app/evaluaciones/:id/comparar`, `/app/creditos` y `/app/candidatos/:invitationId/reporte` | Sesión y empresa (sin empresa, a `/perfil`) |
| Operación | `/admin` (a `/admin/creditos`), `/admin/creditos`, `/admin/usuarios`, `/admin/usuarios/:id` y `/admin/perfil` | `is_platform_admin` |

Las guardas recuerdan la ruta de origen y, si la sesión vence, SessionWatcher lleva a `/login` con aviso (D-07). Solo `/app/pruebas` y el índice de `/admin` son rutas nuevas.

## Sistema de diseño

La referencia completa, con cada token, su contraste y las reglas de uso, está en [docs/design-tokens.md](../docs/design-tokens.md). Lo esencial:

- **Solo tokens.** Los colores, tamaños, sombras, capas y duraciones salen de `src/styles/tokens.css` con `var(--…)`. Si falta un valor, se agrega como token. `style={{…}}` solo lleva valores dinámicos (anchos de barras, posiciones calculadas y el índice `--i` del escalonado). `src/styles/tokens.test.ts` falla si alguna `var(--x)` no está definida.
- **Clases** con prefijo `st-` y BEM: `.st-btn`, `.st-btn--primary`, `.st-card__title`.
- **Color.** Primario navy con texto blanco; coral solo para acentos y el subrayado del enlace activo (D-19). Foco #0284C7, bordes de control #8B8574, texto de éxito #157A3A y advertencia #A84E07 (D-29).
- **Avisos.** Errores en línea con ícono y texto; el toast solo confirma acciones y lleva `role="status"` (D-22).
- **Responsive.** Desktop primero y usable a 360 px. Las tablas pasan a tarjetas a 640 px o menos y cuando no caben (D-23, D-31). El menú móvil aparece por debajo de 960 px en la barra pública, de 900 px en la de RR. HH. y de 768 px en la de super admin.
- **Movimiento.** Entradas con los `--anim-*`. Con prefers-reduced-motion no hay animaciones y la mascota no se monta.
- **Fuentes.** Satoshi y General Sans desde el CDN de Fontshare, sin bloquear el render; JetBrains Mono con @fontsource (D-04, D-28).
- **Accesibilidad.** AA: 4.5:1 en texto, foco siempre visible, controles nativos o con rol y teclado. Textos en español de México, con tuteo.

<a id="componentes-base"></a>
## Componentes base

Están en `src/components/ui/`, cada uno con su `.tsx`, su `.css` y su prueba, y se importan desde `@/components/ui`. La galería los muestra con todas sus variantes en http://localhost:5173/showcase.html (con `npm run dev`).

| Grupo | Componentes |
|---|---|
| Controles | **Button** (primario, secundario, ghost, tinta y peligro; como botón, `Link` o enlace; con carga) · **IconButton** (solo ícono, con nombre accesible) · **Spinner** · **Field** y **FieldError** (etiqueta, ayuda y error de un campo) · **Input** (también `TextField`; neutro, válido, error y variante token) · **Textarea** · **Select** · **Checkbox** (también la variante del consentimiento) · **RadioGroup** y **RadioCard** (opciones como tarjetas) · **SegmentedFilter** (filtros con conteo) · **SegmentedToggle** (selector de dos o más modos) · **SelectableListRow** (fila seleccionable) · **Stepper** (cantidad con − y +) |
| Contenido | **Avatar** · **Badge** (también `StatusBadge`; tonos con punto y texto) e **InvitationStatusBadge** (los cuatro estados de invitación) · **Card** (vidrio, secundaria, blanca, oscura, punteada y paso) · **CodeDisplay** (enlace o código grande) · **CopyField** (valor con botón de copiar) · **DataTable** (filtros, orden con teclado y modo tarjeta) · **DotSeparator** · **Fecha** · **LiveDot** (punto con pulso) · **PageHeader** (eyebrow, título, entradilla y acciones) · **Persona** (avatar, nombre y correo) · **ProgressBar** · **StatCard** (cifra con carga) · **StepPills** (pasos del asistente) · **Tag** (también `Pill`) |
| Retroalimentación | **Callout** (aviso en línea con ícono) · **EstadoCarga**, **EstadoVacio** y **EstadoError** · **Modal** y **Drawer** (foco atrapado, Escape y devolución del foco) · **ToastProvider** con `useToast` |
| Utilidades | **VisuallyHidden** · `cx` · `useFocusTrap` · `useReducedMotion` · `useFocoAlRecuperar` · `formatearFecha`, `formatearNumero`, `textoCantidad` y `textoCreditos` · `copyToClipboard` · `getErrorKind` y `estadoErrorTextos` |

**PasswordStrength** (registro y cambio de contraseña) se importa por su ruta. FloatingInput, GrainTexture y UserDropdown son del sistema anterior y no se usan; la propuesta de limpieza los da por borrar (L-02 a L-04).

## Mocks: el sitio sin backend

`e2e/mocks/` tiene la API simulada por escenario. La usan las capturas (`scripts/captura.mjs --mock`), los scripts de QA y las pruebas de extremo a extremo (`e2e/flujos/api.ts`). Las formas siguen los contratos de `src/api` y de los controladores descritos en los planes; hay que validarlas contra el backend real (PB-01).

| Escenario | Qué simula |
|---|---|
| `visitante` | Sin sesión, con el catálogo de 18 pruebas en 4 categorías |
| `rh` | RR. HH. con 5 evaluaciones, saldo 37, reportes y comparativa |
| `rh-vacio` | Empresa recién registrada: sin evaluaciones, saldo 0 y 422 por saldo al crear |
| `rh-error` | Sesión válida, pero listas y detalles responden 500 |
| `rh-sesion-vencida` | La sesión vence: toda ruta con sesión responde 401 |
| `sin-org` | Usuario sin empresa: GET /api/credits y POST /api/assessments responden 500 (PB-03) |
| `admin` | Super admin con solicitudes pendientes, 19 usuarios en 2 páginas y 409 al eliminarse |
| `candidato` | Invitación pendiente con 2 pruebas (12 y 20 reactivos; la segunda sin «Anterior») |
| `candidato-iniciada` | Invitación iniciada, con 5 de 12 respuestas |
| `candidato-completada`, `candidato-expirada` y `candidato-404` | Bloqueos: completada, vencida y token inexistente |
| `candidato-sin-red` | Toda petición falla en la red |

Cada archivo es un objeto `{ "MÉTODO /ruta": respuesta }`: la clave acepta `:param`, `*` y `?consulta`, gana la entrada más específica, y las claves que empiezan con `//` son comentarios con las rutas que conviene visitar. Las pruebas unitarias no leen estos archivos: simulan `src/api` con `vi.mock`, y algunas copian datos de estos escenarios.

## Capturas

`.capturas/` guarda las capturas y la evidencia de la QA, y git la ignora.

```bash
npx vite --port 5188 --strictPort
node scripts/captura.mjs http://localhost:5188/app rh-resumen 1440,768,360 --mock e2e/mocks/rh.json
node e2e/capturas.mjs        # las 49 rutas a 360, 768 y 1440 px
```

Por defecto se emula prefers-reduced-motion para que la captura sea estable; `--con-movimiento` lo desactiva y `--clic <selector>` abre menús o diálogos antes de capturar.

## Documentación

- [docs/rediseno/estado-final.md](../docs/rediseno/estado-final.md): cierre, pendientes, desviaciones del prototipo, limpieza, backend real, pruebas y migración a `frontend/`.
- [docs/rediseno/decisiones.md](../docs/rediseno/decisiones.md): decisiones, microcopy por aprobar, preguntas para el psicólogo y plan por fases.
- [docs/rediseno/mapa.md](../docs/rediseno/mapa.md) y [brechas.md](../docs/rediseno/brechas.md): cada pantalla del prototipo y cada brecha, con su estado.
- [docs/rediseno/pendientes-backend.md](../docs/rediseno/pendientes-backend.md): lo que el frontend necesita del backend (PB-xx).
- [docs/rediseno/reconstruccion.md](../docs/rediseno/reconstruccion.md): cómo se reconstruyó esta base y cómo compararla con el código real.
- [docs/design-tokens.md](../docs/design-tokens.md): tokens y reglas del sistema de diseño.
