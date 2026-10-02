# Strata · frontend

Frontend de Strata, la plataforma de evaluaciones psicométricas: sitio público, portal de RR. HH., portal del candidato y operación (super admin). Tiene el rediseño STRATA del prototipo aprobado, construido sobre una reconstrucción del frontend original hecha desde los planes de `docs/superpowers/plans`, porque el código real todavía no está en el repo (D-26 y PB-01).

- **Stack.** React 19, TypeScript 6, Vite 8, react-router-dom 7 en modo declarativo, CSS vanilla con custom properties (un .css por componente), axios con la sesión Sanctum por cookie y GSAP 3.12 solo para la mascota. Pruebas con Vitest y Testing Library, y de extremo a extremo con Playwright y axe-core.
- **Estado (2026-10-02).** Fases 1 a 4 y 6 a 8 hechas; la 5 (Test Builder) espera backend. Qué falta y por qué: [docs/rediseno/estado-final.md](../docs/rediseno/estado-final.md).
- **Sin backend.** `npm run dev:mock` levanta el [modo demo](#modo-demo): la API sale de los escenarios de `e2e/mocks` y una pastilla cambia de escenario. Esos JSON son la referencia de los contratos que el frontend espera del backend.
- **Reglas del rediseño.** El repo manda en datos, endpoints, validaciones, permisos y reglas; el prototipo manda en apariencia, navegación, estados, microcopy y movimiento. Lo que el prototipo muestra sin backend no se simula: se oculta o se adapta. Detalle en [docs/rediseno/](../docs/rediseno/).

## Requisitos

- Node 22.12 o superior (lo pide Vitest 5; Vite 8 pide 20.19).
- Para usar el sitio con datos reales: el backend Laravel con Sanctum en `VITE_API_URL` (por defecto, http://localhost:8000). El modo demo y las pruebas no necesitan backend ni Docker.
- Para Playwright, la primera vez: `npx playwright install chromium`.

## Inicio rápido

Sin backend, con el [modo demo](#modo-demo):

```bash
npm install
npm run dev:mock              # http://localhost:5173
```

Con el backend Laravel:

```bash
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:8000
npx vite --port 5173 --strictPort
```

Abre http://localhost:5173. Con el backend, el puerto tiene que ser 5173 y el host `localhost`: Sanctum y CORS solo admiten ese origen. Con `--strictPort`, Vite se detiene si el puerto está ocupado en lugar de tomar otro. Cómo preparar el backend y qué revisar contra él: [estado-final.md, «Cómo correr el frontend contra el backend real»](../docs/rediseno/estado-final.md#backend-real).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite (5173 por defecto) |
| `npm run dev:mock` | [Modo demo](#modo-demo): el mismo servidor en http://localhost:5173, con la API respondida desde `e2e/mocks` |
| `npm run build` | `tsc -b` (app, configuración y pruebas de extremo a extremo) y `vite build` en `dist/` |
| `npm run preview` | Sirve `dist/` |
| `npm run typecheck` | TypeScript del código de la app, sin emitir |
| `npm run lint` | ESLint en todo el proyecto |
| `npm test` | Vitest: 148 archivos y 1219 pruebas (unos 5 min), con las del modo demo en `mock/`. Un archivo: `npx vitest run src/components/ui/Button.test.tsx` |
| `npm run test:e2e` | Playwright en Chromium, con movimiento reducido: 19 recorridos con la API simulada (Vite en el puerto 5189) y 5 del modo demo (proyecto `demo`, `vite --mode mock` en el 5190). Unos 2 min. Un archivo: `npx playwright test admin`; solo el modo demo: `npx playwright test --project demo` |

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
├── .env.mock              Modo demo: VITE_API_URL vacío (se versiona; no lleva secretos)
├── scripts/               captura.mjs y generate-favicons.mjs
├── mock/                  Modo demo: coincidencias.mjs (formato y buscador de los mocks, compartido)
│                          y plugin-mock.ts (el plugin de Vite que responde la API)
├── e2e/
│   ├── mocks/             Escenarios de la API en JSON: la referencia de los contratos
│   ├── flujos/            Recorridos de Playwright (npm run test:e2e) y api.ts, la API simulada
│   ├── demo/              Recorrido del modo demo (proyecto «demo» de Playwright)
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
    ├── demo/              Pastilla del modo demo (solo con npm run dev:mock)
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

<a id="modo-demo"></a>
## Modo demo (sin backend)

Sirve para ver y recorrer todo el frontend en el navegador antes de que exista el backend. El servidor de desarrollo de Vite responde `/api/*` y `/sanctum/*` con los escenarios de `e2e/mocks`, así que no hacen falta Laravel, PHP, base de datos ni Docker (el `docker-compose.yml` de la raíz solo levanta el MySQL del backend).

```bash
npm install
npm run dev:mock              # http://localhost:5173
```

- **La pastilla.** Abajo a la izquierda, «Modo demo · visitante» dice qué escenario responde. Al abrirla puedes cambiar de escenario (la página se recarga con `?escenario=<nombre>`) y saltar a Inicio, `/app`, `/admin/creditos` y `/evaluar/demo`. Solo existe en este modo: `npm run dev` y el build no la incluyen, y el resto del código es el mismo que corre contra el backend real.
- **El escenario activo** vive en la cookie `strata-mock-escenario`: sin ella es `visitante`, y se borra al cerrar el navegador. `?escenario=<nombre>` en cualquier URL lo cambia (por ejemplo, `/app?escenario=rh-vacio`) y http://localhost:5173/__mock dice cuál está activo y lista todos. La terminal avisa cada cambio y cada petición que ningún escenario responde.
- **Estados de carga.** Cada respuesta tarda de 250 a 400 ms. Para quitar la espera: `STRATA_MOCK_RETARDO=0 npm run dev:mock` (en PowerShell, `$env:STRATA_MOCK_RETARDO=0; npm run dev:mock`) o esa variable en `.env.mock.local`, que no se versiona. También acepta un valor fijo, como `300`.
- **Archivos.** `.env.mock` deja `VITE_API_URL` vacío para que axios pida la API al mismo servidor; `mock/plugin-mock.ts` es el plugin de Vite y `src/demo/SelectorEscenario.tsx`, la pastilla.

### Cómo entrar con cada rol

| Para ver | Haz esto | Escenario |
|---|---|---|
| El sitio público | Abre http://localhost:5173 | `visitante` |
| El panel de RR. HH. | En `/login`, cualquier correo y cualquier contraseña | `rh` |
| El super admin | En `/login`, un correo que empiece con `admin` (`admin@strata.mx`); después, `/admin/creditos` | `admin` |
| Una cuenta sin empresa | En `/login`, un correo que contenga `sinempresa` (`ana.sinempresa@correo.mx`) | `sin-org` |
| El registro | `/registro`: con empresa entra como RR. HH. y sin empresa, como cuenta sin empresa | `rh` o `sin-org` |
| Al candidato | `/evaluar/demo` (sirve cualquier token), con cualquier escenario | `candidato` |
| Los errores del acceso | La contraseña `incorrecta` en `/login`; un correo que empiece con `repetido` en `/registro` | El mismo |

«Salir» vuelve a `visitante`. El registro valida los campos obligatorios como `RegisterRequest` y responde sus 422 con los mensajes de Laravel en inglés, como un backend sin traducciones (PB-35).

### Escenarios

| Escenario | Qué simula |
|---|---|
| `visitante` | Sin sesión, con el catálogo de 18 pruebas en 4 categorías |
| `rh` | RR. HH. con 5 evaluaciones, saldo 37, reportes y comparativa |
| `rh-vacio` | Empresa recién registrada: sin evaluaciones, saldo 0 y 422 por saldo al crear |
| `rh-error` | Sesión válida, pero listas y detalles responden 500 |
| `rh-sesion-vencida` | La sesión vence: toda ruta con sesión responde 401 (al volver a entrar, pasa a `rh`) |
| `admin` | Super admin con solicitudes pendientes, 19 usuarios en 2 páginas y 409 al eliminarse |
| `sin-org` | Usuario sin empresa: GET /api/credits y POST /api/assessments responden 500 (PB-03) |
| `candidato` | Invitación pendiente con 2 pruebas (12 y 20 reactivos; la segunda sin «Anterior») |
| `candidato-iniciada` | Invitación iniciada, con 5 de 12 respuestas |
| `candidato-completada`, `candidato-expirada` y `candidato-404` | Bloqueos: completada, vencida y token inexistente |
| `candidato-sin-red` | Toda petición falla en la red |

Las claves `//` de cada JSON dicen qué rutas conviene visitar con ese escenario. Desde la pastilla, las variantes del candidato abren `/evaluar/demo`.

### Qué responde cada petición

1. **Sesión.** POST `/api/login`, `/api/register` y `/api/logout` los responde el modo demo: cambian de escenario y devuelven el usuario del escenario nuevo (`{ user }`, como espera `src/api/auth.ts`).
2. **Candidato.** `/api/evaluar/*` sale de `candidato.json` en cualquier escenario, salvo que el activo sea una variante `candidato-*`.
3. **El escenario activo**, con su entrada más específica.
4. **Catálogo y leads** (GET `/api/catalog*` y POST `/api/leads`), de `visitante.json` si el activo no los define.
5. **Escrituras de RR. HH. y super admin** que el escenario no define (crear evaluación, reenviar, solicitar créditos, aprobar, rechazar, editar o eliminar usuario, perfil y contraseña): éxito con la forma que esperan los clientes de `src/api`.
6. **Sin entrada:** la cookie CSRF responde 204, `/api/user` 401 y lo demás 404, con aviso en la terminal.

Los errores que cada escenario trae a propósito se respetan (el 422 por saldo de `rh-vacio`, los 409 de `rh` y `admin`…). Nada se guarda: lo que creas o editas no aparece después en las listas. Al crear una evaluación con éxito, la pantalla de enlaces muestra el nombre y los candidatos que escribiste, con enlaces al portal del candidato de este mismo servidor; «Ver evaluación» lleva al id del escenario (18 en `rh`), que no tiene detalle, y se ve el estado de no encontrada.

Cada respuesta trae las cabeceras `X-Strata-Mock-Escenario` y `X-Strata-Mock-Fuente` (el archivo y la entrada que respondió): se ven en la pestaña Red de las herramientas del navegador.

### Agregar o editar mocks

1. Edita o crea un `.json` en `e2e/mocks` con el [formato de los mocks](#mocks). El nombre del archivo es el del escenario: letras, números, guion y guion bajo.
2. Revísalo con `node scripts/captura.mjs --validar`. Para saber qué entrada responde una petición: `node scripts/captura.mjs --validar e2e/mocks/rh.json --probar "GET /api/assessments/13"`.
3. Con `npm run dev:mock` corriendo, el cambio se carga solo y la página se recarga. Si el JSON quedó con errores, la terminal lo dice y se sigue usando la versión anterior. Un escenario nuevo aparece en la pastilla, descrito con su comentario `//` hasta los dos puntos.

Las pruebas de extremo a extremo y los scripts de QA leen los mismos archivos: antes de cambiar una entrada que ya existe, busca quién la usa en `e2e/` y corre `npm run test:e2e`.

**Límites.** Solo funciona con `npm run dev:mock`: ni el build ni `vite preview` traen la API simulada, así que no sirve para publicar la demo en un hosting estático (haría falta simular la API en el navegador, por ejemplo con un service worker). Las cuentas no existen: cualquier contraseña entra, salvo `incorrecta`.

<a id="mocks"></a>
## Mocks: formato y herramientas

`e2e/mocks/` tiene la API simulada por escenario. La usan el [modo demo](#modo-demo), las capturas (`scripts/captura.mjs --mock`), los scripts de QA y las pruebas de extremo a extremo (`e2e/flujos/api.ts`). El formato, el buscador y la revisión están en `mock/coincidencias.mjs`, que todos comparten. Las formas siguen los contratos de `src/api` y de los controladores descritos en los planes; hay que validarlas contra el backend real (PB-01). Mientras tanto, son la referencia de lo que el frontend espera del backend.

Cada archivo es un objeto `{ "MÉTODO /ruta": respuesta }`: la clave acepta `:param`, `*` y `?consulta`, gana la entrada más específica, y las claves que empiezan con `//` son comentarios con las rutas que conviene visitar. La respuesta es `{ status, body, headers }`, o `{ abortar }` para una falla de red; el detalle está en la cabecera de `mock/coincidencias.mjs`. Las pruebas unitarias de `src/` no leen estos archivos (simulan `src/api` con `vi.mock`, y algunas copian datos de estos escenarios); las de `mock/` sí: revisan que todos sean válidos y prueban el modo demo con ellos.

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
