# Reconstrucción del frontend · frontend-strata

**Fecha:** 2026-10-01. **Estado:** `npm run build` y `npm run lint` pasan; el lint da 0 errores y 2 avisos. **Alcance:** solo el frontend. No se tocaron `frontend/` ni `backend/`, y no se ejecutó git.

Las citas siguen el formato archivo:línea, como en [auditoria.md](auditoria.md). Los planes están en `docs/superpowers/plans`, y dentro de una celda «:NNNN» se refiere al último archivo citado.

## Resumen

- El código real del frontend sigue sin aparecer ([PB-01](pendientes-backend.md#pb-01)). Para no frenar el rediseño, se reconstruyó a partir de los 7 planes de implementación (D-26).
- Está en `frontend-strata/`, no en `frontend/`, porque escribir en `frontend/` obliga a quitar su gitlink, y eso necesita aprobación.
- Es el estado final de los planes, copiado tal cual. `src/` tiene 104 archivos, y el árbol de rutas coincide con [auditoria.md](auditoria.md) 1.3: 26 rutas con página, más `/admin`, que no tiene index.
- Para que compilara y pasara el lint hicieron falta dos cambios de código, uno en Header.tsx y otro en profile.ts, y cinco supresiones puntuales de ESLint. Las desviaciones están todas abajo.
- Faltan las imágenes de `public/` (logo, favicons y og-image), que se generan a partir de `backend/img/mezquite.png`, y un backend en marcha para probar la app con datos.

## Por qué se reconstruyó

- `frontend/` y `backend/` son gitlinks vacíos sin `.gitmodules`, y los commits a los que apuntan no están ni en el repo ni en el remoto ([auditoria.md](auditoria.md), «Bloqueo»). PB-01 sigue abierto.
- Sin código no había sobre qué construir el rediseño ni manera de correr el build y el lint que pide cada fase (auditoría, «Impacto»; T-21 en [decisiones.md](decisiones.md)).
- **D-26** ([decisiones.md](decisiones.md), estado del 2026-10-01 en «Decisiones abiertas»): se reconstruye el frontend desde los planes como base y el rediseño se construye encima. Cuando llegue el código real, se hace un diff contra el commit base y se portan las diferencias. Las desviaciones de la reconstrucción se documentan aquí.

## Dónde y por qué ahí

- **Carpeta:** `frontend-strata/`, en la raíz del repo, al lado de `frontend/`.
- **Por qué no en `frontend/`:** es un gitlink (modo 160000). Para versionar archivos ahí primero hay que sacarlo del índice con `git rm --cached frontend`, y eso cambia cómo el repo trata el frontend: es la decisión de [D-01](decisiones.md#d-01) (monorepo o submódulos) y el primer paso de PB-01, que ejecuta el compañero. Mientras esa aprobación no llegue, la reconstrucción va en una carpeta nueva y `frontend/` queda intacto. `backend/` tampoco se tocó (regla 1).
- **Diferencia con D-26:** el texto de D-26 dice «`frontend/` se reconstruye…», pero la reconstrucción está en `frontend-strata/`. Cuando se apruebe quitar el gitlink, la carpeta se mueve a `frontend/` en un commit aparte (paso 7 de «Cómo comparar con el código real»).

## Método

**Base.** Se partió del scaffold de create-vite con la plantilla react-ts: Vite 8.3, React 19, TypeScript 6.0 y ESLint 10. Su `tsconfig.app.json` activa `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals` y `noUnusedParameters`. Los scripts son `build` = `tsc -b && vite build` y `lint` = `eslint .`. Es la plantilla que la auditoría da por probable (1.10, riesgo 8).

**Orden de los planes.** Las modificaciones de cada archivo se aplicaron en este orden, el mismo de la auditoría (sección 1, «Orden de aplicación»):

| Paso | Plan | Tareas que se tomaron |
|---|---|---|
| 1 | 2026-09-10-evaluation-module.md | Solo la Task 10: el cliente axios (`src/api/axios.ts`) y `.env` |
| 2 | 2026-09-10-sales-site.md | Las de frontend (0, 2 a 4 y 6 a 16): dependencias, script de favicons, `config/site.ts`, estilos, index.html, vite.config.ts, Button, GrainTexture, Header, Footer, secciones y App.tsx |
| 3 | 2026-09-10-multipage-site.md | Todas (1 a 13): router v7, Button con `to`, ScrollToTop, Header con NavLink, PageHeader, datos, secciones, páginas y RootLayout |
| 4 | 2026-09-11-fase1-nucleo.md | 11 a 15: axios con Sanctum, AuthContext, RequireAuth, Registro, Login, AppLayout, NuevaEvaluacion, portal del candidato y Report |
| 5 | 2026-09-11-fase3-sitio-ventas.md | 3 a 8: catálogo, páginas públicas, Header con menú móvil, Footer, HomePage, App.tsx reescrito y borrado de páginas, secciones y datos viejos |
| 6 | 2026-09-12-fase2-panel-rh.md | 8 a 12: clientes rh y admin, AppLayout con navegación, Resumen, Evaluaciones, Detalle, Comparar, Créditos, PDF del reporte y `/admin/creditos` |
| 7 | 2026-09-12-registro-login-crud-usuarios.md | 4 a 7: animaciones, FloatingInput, PasswordStrength, Registro, Login, Header por sesión, UserDropdown, `/perfil` y usuarios y perfil de `/admin` |

**Reglas.**

- El objetivo es el estado final de cada archivo. Si un plan reemplaza un archivo completo, se parte de ese reemplazo y se le aplican las modificaciones de los planes siguientes. Si un plan posterior lo borra, no se escribe.
- Las modificaciones parciales («añadir al final», «reemplazar el bloque», «agregar la ruta») se aplicaron sobre la versión vigente del archivo.
- El código se copió tal cual: nombres, clases, textos, comentarios y lógica, sin rediseñar ni corregir bugs. La única excepción prevista era `import type` por `verbatimModuleSyntax`, y no hizo falta usarla porque los planes ya marcan los imports que solo son de tipo.
- Lo que un plan da por existente sin que ningún plan lo defina se creó con lo mínimo y figura como desviación.

**Reparto.** Seis grupos escribieron los archivos. Después, una fase de integración compiló, corrigió y verificó el conjunto.

| Grupo | Qué escribió |
|---|---|
| infra-api-estilos | package.json, package-lock.json, tsconfig.app.json, .gitignore, .env.example, index.html, vite.config.ts, scripts/, main.tsx, App.tsx, api/, context/, las dos guardas, config/, data/ y styles/ |
| layout-ui | components/layout/ y components/ui/ |
| secciones | sections/ |
| paginas-publicas | Las páginas públicas, legal/, PerfilPage y EvaluarLanding |
| panel-candidato | pages/app/ y CandidateFlow |
| auth-admin | pages/auth/ y pages/admin/ |
| integración | Build, lint, correcciones, verificación y este documento |

**Verificación.**

1. `npm run build` y `npm run lint` terminan bien (detalle en «Estado»).
2. Un script extrajo el árbol de rutas de App.tsx y se comparó con auditoria.md 1.3: es idéntico.
3. Los bloques de código de los planes se cruzaron con los archivos finales. Hay 166 bloques asociados a un archivo de frontend, y 132 están completos en el archivo final. De los 34 restantes, 17 son de archivos que borra fase 3, 15 son versiones que un plan posterior reemplaza y 2 corresponden a las correcciones 7 y 8 de la tabla de desviaciones.
4. También se hizo la comprobación inversa: cada línea de los archivos finales sale de algún bloque de los planes. Las excepciones son las desviaciones de abajo y la ruta `perfil` de App.tsx, que registro-login da en prosa y no en un bloque (2026-09-12-registro-login-crud-usuarios.md:2013).
5. No existe ningún archivo que un plan borre (lista en «Archivos por carpeta»).
6. Todas las variables `var(--…)` que se usan están definidas en algún .css. Solo una clase no tiene regla: `.report-toolbar`, que tampoco la tiene en el plan.
7. Todos los archivos están en UTF-8 sin BOM y con fin de línea LF. Los planes usan CRLF.

## Estado

| Comprobación | Resultado |
|---|---|
| `npm install` | No hizo falta. Las dependencias ya estaban instaladas y `npm ls` no reporta faltantes |
| `npm run build` | Pasa. Vite avisa que `__dirname` (vite.config.ts:9) no será compatible con `configLoader: 'native'`, que será el valor por defecto en un futuro major. Es código del plan y no se cambió |
| `npm run lint` | Pasa con 0 errores y 2 avisos de `react-hooks/exhaustive-deps` en AdminUsuariosPage.tsx:18-19 |
| `npx tsc --noEmit -p tsconfig.app.json` | Pasa. Ojo: `npx tsc --noEmit` en la raíz, que es el chequeo que usan los planes, no revisa nada, porque `tsconfig.json` solo tiene references. Hay que usar `npm run build` o `npx tsc -b` |
| Rutas | 26 con página, más `/admin` sin index, igual que auditoria.md 1.3 |
| Archivos en `src/` | 104: 51 .tsx, 12 .ts y 41 .css |

## Dependencias instaladas

Versiones tomadas de `package-lock.json`. Los paquetes que agregaron los planes se instalaron con la versión vigente del registro, porque ningún plan fija versiones salvo la del router (v7.x).

| Paquete | Rango en package.json | Versión instalada | Origen |
|---|---|---|---|
| react | ^19.2.8 | 19.3.0 | Scaffold |
| react-dom | ^19.2.8 | 19.3.0 | Scaffold |
| react-router-dom | ^7.18.4 | 7.18.4 | 2026-09-10-multipage-site.md:55 |
| axios | ^1.20.0 | 1.20.0 | Ningún plan lo instala y evaluation-module lo da por instalado. Supera el mínimo 1.6.2 que exige `withXSRFToken` (auditoría, riesgo 9) |
| @fontsource/cormorant-garamond | ^5.3.0 | 5.3.0 | 2026-09-10-sales-site.md:63 |
| @fontsource-variable/dm-sans | ^5.3.0 | 5.3.0 | 2026-09-10-sales-site.md:63 |
| sharp (dev) | ^0.35.5 | 0.35.5 | 2026-09-10-sales-site.md:64 |
| typescript (dev) | ~6.0.2 | 6.0.3 | Scaffold |
| vite (dev) | ^8.3.0 | 8.3.2 | Scaffold |
| @vitejs/plugin-react (dev) | ^6.1.1 | 6.1.1 | Scaffold |
| eslint (dev) | ^10.10.0 | 10.11.0 | Scaffold |
| @eslint/js (dev) | ^10.0.1 | 10.0.1 | Scaffold |
| typescript-eslint (dev) | ^8.69.0 | 8.71.0 | Scaffold |
| eslint-plugin-react-hooks (dev) | ^7.1.1 | 7.1.1 | Scaffold |
| eslint-plugin-react-refresh (dev) | ^0.5.6 | 0.5.7 | Scaffold |
| globals (dev) | ^17.12.0 | 17.13.0 | Scaffold |
| @types/node (dev) | ^24.13.3 | 24.19.0 | Scaffold |
| @types/react (dev) | ^19.2.18 | 19.3.0 | Scaffold |
| @types/react-dom (dev) | ^19.2.7 | 19.3.0 | Scaffold |

## Archivos por carpeta

**Raíz de `frontend-strata/`**

| Archivo | Origen |
|---|---|
| package.json y package-lock.json | Scaffold, más las dependencias de los planes (desviación 4) |
| tsconfig.json y tsconfig.node.json | Scaffold, sin cambios |
| tsconfig.app.json | Scaffold, más `paths` (desviación 1) |
| eslint.config.js | Scaffold, sin cambios. Las supresiones son de una línea, en cada archivo |
| vite.config.ts e index.html | 2026-09-10-sales-site.md, Task 4 |
| scripts/generate-favicons.mjs | 2026-09-10-sales-site.md, Task 0. Se escribió y no se ejecutó |
| .gitignore | Scaffold, más `.env` (desviación 3) |
| .env.example | Desviación 2 |
| README.md | Plantilla de create-vite, sin cambios. Ningún plan lo menciona |
| public/ | Vacía (ver «Lo que falta») |

`node_modules/` y `dist/` están ignorados por git. `dist/` es la salida del último build.

**`src/` (104 archivos)**

| Carpeta | N.º | Archivos |
|---|---|---|
| src/ | 2 | App.tsx, main.tsx |
| src/api/ | 10 | admin, adminUsers, assessments, auth, axios, candidate, catalog, profile, report y rh (.ts) |
| src/components/ | 2 | RequireAuth.tsx, RequirePlatformAdmin.tsx |
| src/components/layout/ | 6 | Footer (.tsx y .css), Header (.tsx y .css), RootLayout.tsx, ScrollToTop.tsx |
| src/components/ui/ | 10 | Button, FloatingInput, GrainTexture, PasswordStrength y UserDropdown (.tsx y .css) |
| src/config/ | 1 | site.ts |
| src/context/ | 1 | AuthContext.tsx |
| src/data/ | 1 | plans.ts |
| src/pages/ | 18 | AvisoPrivacidadPage, AyudaPage (+ .css), ComoFuncionaPage, DemoPage, HomePage (+ .css), NotFoundPage (+ .css), PerfilPage (+ .css), PreciosPage (+ .css), PruebaDetallePage (+ .css), PruebasPage (+ .css), TerminosPage |
| src/pages/admin/ | 9 | AdminCreditosPage (+ .css), AdminLayout (+ .css), AdminPerfilPage (+ .css), AdminUsuarioDetallePage, AdminUsuariosPage (+ .css) |
| src/pages/app/ | 15 | AppLayout, CompararPage, CreditosPage, EvaluacionDetallePage, EvaluacionesPage, NuevaEvaluacion y ResumenPage, cada una con su .css, y ReporteCandidato |
| src/pages/auth/ | 3 | Auth.css, Login.tsx, Registro.tsx |
| src/pages/candidate/ | 4 | CandidateFlow (+ .css), EvaluarLanding (+ .css) |
| src/pages/legal/ | 2 | LegalPage (.tsx y .css) |
| src/sections/ | 16 | ContactSection, Hero, HowItWorks, Methodology, PageHeader, Report, SampleReport y Trust (.tsx y .css) |
| src/styles/ | 4 | animations.css, global.css, tokens.css, typography.css |

**Archivos borrados por los planes, que no existen:** pages/TestPage.tsx, PsicometriaPage.tsx y NosotrosPage.tsx; sections/CompanyInfo, Testimonials, PackagesSection, TestInventory y Catalog, cada una con su .tsx y su .css; y data/catalog.ts, packages.ts y company.ts (2026-09-11-fase3-sitio-ventas.md:25, :1283-1289). Las tres páginas nunca tuvieron .css (2026-09-10-multipage-site.md:28-30).

**Anunciados que ningún plan implementa, que no se crearon:** pages/app/EvaluacionDetalle.tsx y pages/candidate/CandidateLayout.tsx con un archivo por paso (2026-09-11-fase1-nucleo.md:23, :2439). Sus funciones las cumplen EvaluacionDetallePage y CandidateFlow (auditoría 1.9).

**Archivos de la demo del scaffold, que se borraron:** src/App.css, src/index.css, src/assets/ (hero.png, react.svg y vite.svg), public/icons.svg y public/favicon.svg (desviación 5).

## Desviaciones respecto de los planes

| # | Archivo | Cambio | Motivo | Quién |
|---|---|---|---|---|
| 1 | tsconfig.app.json | Se agregó `"paths": { "@/*": ["./src/*"] }` en compilerOptions, sin `baseUrl` | Ningún plan muestra el tsconfig, y `tsc -b` necesita resolver el alias `@` que define vite.config.ts (auditoría 1.1, fila «Bundler») | infra-api-estilos |
| 2 | .env → .env.example | Se creó `.env.example` con `VITE_API_URL=http://localhost:8000`, y no `.env` | evaluation-module crea y versiona `frontend/.env` (2026-09-10-evaluation-module.md:624-630, :664), y versionar `.env` es justo el problema de seguridad de PB-01. Sin `.env`, axios.ts y site.ts usan el valor de respaldo, que es el mismo | infra-api-estilos |
| 3 | .gitignore | Se agregó la línea `.env` | Por el mismo motivo; el scaffold solo ignoraba `*.local`. No afecta a `.env.example` | infra-api-estilos |
| 4 | package.json y package-lock.json | Se instalaron axios, react-router-dom, los dos paquetes de @fontsource y sharp con las versiones vigentes del registro. Se mantienen el nombre `frontend-strata` y los scripts del scaffold | Ningún plan muestra package.json ni fija versiones, salvo la v7.x del router, y ninguno instala axios | infra-api-estilos |
| 5 | Demo del scaffold | Se borraron src/App.css, src/index.css, src/assets/, public/icons.svg y public/favicon.svg | No son parte del estado final y ningún archivo los referencia | infra-api-estilos |
| 6 | src/pages/HomePage.css | Se creó el archivo. Arriba lleva un comentario, `.home-cta` (`text-align: center; padding-bottom: var(--section-py)`) y `.home-cta--tinted` (`background: var(--color-timberwolf)`). Debajo va, sin cambios, el bloque `.home-catalog*` de fase 3 | Fase 3 importa el archivo (2026-09-11-fase3-sitio-ventas.md:1169), le añade reglas «al final» (:1214-1226) y usa `.home-cta` y `.home-cta--tinted` (:1182, :1197, :1204), pero ningún plan lo crea ni define esas clases (auditoría, riesgo 6). Los valores salen de los estilos inline que esas clases reemplazan (2026-09-10-multipage-site.md:1217, :1221). Efecto secundario: el `.home-cta` que está dentro de `.home-catalog__inner` suma su padding-bottom al de la sección | paginas-publicas |
| 7 | src/components/layout/Header.tsx | Se borraron las constantes `demoTo` y `demoHref` | Se declaran y nunca se leen (2026-09-12-registro-login-crud-usuarios.md:1511-1512). Con `noUnusedLocals`, `tsc -b` da TS6133 y ESLint da `no-unused-vars` (auditoría, riesgo 3). El comportamiento no cambia | integración |
| 8 | src/api/profile.ts | Al tipo de retorno de `getProfile` se le sumaron `phone?: string; birth_date?: string; position?: string` | PerfilPage lee esos campos (2026-09-12-registro-login-crud-usuarios.md:1722, :1761-1762), pero el tipo del plan no los declara (:1632), lo que da 5 errores TS2339 (auditoría, riesgo 3). Se amplió solo el tipo de `getProfile` y no `AuthUser`, para no tocar el tipo de la sesión. El cambio es solo de tipos: el JavaScript generado es el mismo | integración |
| 9 | Todos | Los archivos están en LF y UTF-8 sin BOM | Así viene el scaffold. Los planes usan CRLF, así que al comparar hay que ignorar el CR (ver «Cómo comparar con el código real») | todos |

**Reglas de ESLint desactivadas.** Cada supresión es un `eslint-disable-next-line` de una sola línea, con una nota que empieza por «reconstrucción:». En los cinco casos, corregir el aviso obligaba a reescribir lógica del plan. `eslint.config.js` sigue igual que en el scaffold.

| Archivo:línea | Regla | Código del plan | Por qué no se corrigió |
|---|---|---|---|
| src/components/layout/Header.tsx:21 | react-hooks/set-state-in-effect | `useEffect(() => { setOpen(false) }, [pathname])` (2026-09-12-registro-login-crud-usuarios.md:1509; viene de 2026-09-11-fase3-sitio-ventas.md:1033) | Cierra el menú móvil al cambiar de ruta. Quitar el efecto cambia cuándo se cierra el menú |
| src/pages/PruebaDetallePage.tsx:33 | react-hooks/set-state-in-effect | `setTest(null)` y `setError(false)` antes de cargar el nuevo slug (2026-09-11-fase3-sitio-ventas.md:606-610) | Es el efecto de carga. Corregirlo obliga a reorganizar el estado de la página |
| src/pages/candidate/CandidateFlow.tsx:21 | react-hooks/purity | `useRef<number>(Date.now())` (2026-09-11-fase1-nucleo.md:2797) | Es el cronómetro del reactivo para `elapsed_ms` |
| src/pages/candidate/CandidateFlow.tsx:60 | react-hooks/purity | `Date.now() - itemShownAt.current` dentro de `choose` (2026-09-11-fase1-nucleo.md:2835) | Calcula `elapsed_ms` al responder. La regla lo marca aunque se ejecute en un manejador de eventos |
| src/context/AuthContext.tsx:23 | react-refresh/only-export-components | `export function useAuth` en el mismo archivo que `AuthProvider` (2026-09-11-fase1-nucleo.md:2119) | Sacar el hook a otro archivo obliga a cambiar el import en todos los archivos que usan `useAuth`. La regla solo afecta al Fast Refresh en desarrollo |

**Avisos que quedan.** No hacen fallar el lint y no se desactivaron:

- AdminUsuariosPage.tsx:18-19, `react-hooks/exhaustive-deps`: falta `load` en las dependencias de los dos efectos (2026-09-12-registro-login-crud-usuarios.md:1821-1822). Por ese mismo código, al montar la página la lista se pide dos veces.
- El aviso de Vite sobre `__dirname` en vite.config.ts:9 (ver «Estado»).

**Decisiones de colocación.** No cambian el contenido, pero pueden salir en el diff contra el código real:

- App.tsx: fase 2 y registro-login dicen «agregar» sin fijar la posición. Las rutas siguen el orden de auditoria.md 1.3: en `/app`, primero index y `evaluaciones`, y `creditos` antes del reporte; `perfil`, antes de `*`. Los imports nuevos van al final, en orden cronológico. En react-router v7 el orden no afecta al matching.
- Header.css: la regla `@media (max-width: 767px) { .header__cta { display: none; } }` de fase 3 (2026-09-11-fase3-sitio-ventas.md:1108) no dice dónde va. Se puso después del bloque del menú móvil y antes del bloque de sesión de registro-login.
- Report.css y AppLayout.css: los bloques que fase 2 añade «al final» van pegados detrás de los de fase 1. Por eso Report.css termina con dos `@media print` separados.

## Lo que el plan deja tal cual

Esto no son desviaciones: son rasgos del código de los planes que se copiaron sin corregir. El detalle está en auditoria.md 1.9 y 1.10.

- **Marca:** `SITE.name` y el title de index.html dicen «Mezquit». «Mez» está escrito a mano en AppLayout, AdminLayout, Ayuda y los datos de ejemplo (riesgo 5).
- **Anclas rotas:** el Hero enlaza a `#contacto` y `#catalogo`, que ya no existen en la Home (riesgo 21).
- **Código sin uso:** Trust.tsx y Trust.css, la regla `.header__cta`, `getAssessment()` de assessments.ts, `.resumen__list` y `.resumen__row`, `.cand__nav`, `SITE.apiBase` y `SITE.domain`, y varias clases de SampleReport.css (1.9).
- **Clase sin estilos:** `.report-toolbar` (ReporteCandidato) no tiene regla CSS en ningún plan.
- **Rutas:** `/perfil` no tiene guarda y `/admin` no tiene página index (1.3; riesgos 13 y 20).
- **Créditos:** NuevaEvaluacion muestra el mensaje genérico ante el 422 por créditos insuficientes (riesgo 15).
- **Animación:** la barra de progreso del candidato anima `width` (CandidateFlow.css:6). Se revisa en la Fase 3 del rediseño.
- **CSS acoplado entre archivos:** AdminLayout usa `.applayout__logout` de AppLayout.css; el spinner `.btn--loading::before` vive en Auth.css; la impresión oculta barras por nombre de clase (riesgo 19).

## Lo que falta

1. **Imágenes de `public/`.** La carpeta está vacía. Faltan logo.png, favicon-16.png, favicon-32.png, apple-touch-icon.png y og-image.png. Las genera con sharp `scripts/generate-favicons.mjs` a partir de `../backend/img/mezquite.png` (2026-09-10-sales-site.md:52-106), pero ese archivo no existe porque `backend/` es un gitlink vacío. Mientras tanto dan 404: `/logo.png` en Header, Footer, Login y Registro, y los favicons y og-image en index.html. Con el PNG ya en `backend/img/`, se generan desde la carpeta del frontend, porque las rutas del script son relativas: `cd frontend-strata && node scripts/generate-favicons.mjs`. Git no versiona carpetas vacías, así que `public/` aparecerá en el repo cuando tenga archivos. Si el rediseño cambia el logo por el de STRATA (D-03), se cambia `SRC` en el script en esa fase.
2. **`.env` local.** Hace falta solo si la API no está en http://localhost:8000: `cp .env.example .env` y ajustar el valor.
3. **Backend.** Sin la API de Laravel con Sanctum en `VITE_API_URL`, el sitio carga, pero fallan el catálogo, la demo, el login, el panel y el portal del candidato. Sanctum y CORS solo admiten el puerto 5173 (riesgo 11).
4. **Pruebas.** No hay tests de frontend porque ningún plan los tiene. D-05 recomienda Vitest y Testing Library.
5. **D-26.** Su texto habla de `frontend/`: hay que corregirlo a `frontend-strata/`, o mover la carpeta cuando se apruebe quitar el gitlink.
6. **Código real (PB-01).** Hay que validar esta reconstrucción contra el código real en cuanto aparezca (siguiente sección) y corregir auditoria.md donde difiera.
7. **Supresiones de lint.** Los cinco `eslint-disable-next-line` se quitan cuando el rediseño reescriba esos componentes.
8. **README.md.** Sigue siendo el de la plantilla de create-vite.

## Cómo comparar con el código real

El commit base es el que agrega `frontend-strata/`; D-26 prevé para él el mensaje `chore(frontend): reconstruir…`. Todo el rediseño va encima de ese commit. La idea es aplicar el código real como un commit sobre la base y fusionarlo con el rediseño, para que git porte solo las diferencias.

1. Ubicar el commit base y anotar su hash (BASE):

   ```bash
   git log --diff-filter=A --format="%h %s" -- frontend-strata/package.json
   ```

2. Conseguir el código real, es decir, el repo embebido en `c61e733…` o un commit posterior, sin `.git`, `node_modules/`, `dist/` ni `.env`. Su historial no debe publicarse, porque versionó `.env` (PB-01).
3. Crear una rama desde la base y poner el código real en la misma carpeta:

   ```bash
   git switch -c frontend-real BASE
   git rm -r -q frontend-strata
   # copiar aquí el código real dentro de frontend-strata/
   git add frontend-strata
   git commit -m "chore(frontend): código real sobre la reconstrucción"
   ```

4. Revisar las diferencias. Cada una es algo que los planes no describen o una de las desviaciones de este documento; en cada desviación, confirmar qué hace el código real.

   ```bash
   git diff --stat BASE frontend-real -- frontend-strata
   git diff --ignore-cr-at-eol BASE frontend-real -- frontend-strata/src
   ```

5. Portar las diferencias al rediseño:

   ```bash
   git switch feat/rediseno-strata
   git merge frontend-real
   ```

   Git aplica solo lo que cambia entre la reconstrucción y el código real. Habrá conflictos donde el rediseño tocó las mismas líneas: ahí se conserva la apariencia del rediseño y se toman la lógica y los contratos del código real (T-11 y T-12).
6. Correr `npm install`, `npm run build` y `npm run lint`, y corregir la sección 1 de auditoria.md donde el código real difiera.
7. Cuando se apruebe quitar el gitlink (D-01, PB-01), mover la carpeta en un commit aparte:

   ```bash
   git rm --cached frontend
   rmdir frontend
   git mv frontend-strata frontend
   ```

   Si la carpeta ya se movió antes de que llegue el código real, git suele detectar el renombre al fusionar. Si no lo detecta, el paso 3 se hace directamente sobre `frontend/`.
