# Auditoría del frontend y del prototipo · Fase 0

**Alcance:** frontend actual reconstruido desde `docs/superpowers` (7 planes, 5 specs) y `docs/design-tokens.md`, más el prototipo aprobado `Strata.dc.html`; sin código real a la vista (ver «Bloqueo»). **Fecha:** 2026-09-30.

## Resumen de hallazgos

- **No hay código que auditar.** `frontend/` y `backend/` son gitlinks vacíos sin `.gitmodules`. Todo el inventario de la sección 1 se reconstruyó desde los planes, y ya hay señales de que el código real difiere: el último plan no compila tal cual y Fase 1 borra un archivo que ningún plan crea (1.10, riesgos 3 y 4). Ninguna de las fases 1 a 8 puede empezar hasta tener el código ([D-01](decisiones.md#d-01), [PB-01](pendientes-backend.md#pb-01)).
- **Stack y contratos que se conservan.** React 19 + TypeScript + Vite 8, react-router-dom v7 en modo declarativo, CSS vanilla con custom properties y axios con sesión Sanctum SPA por cookie. Hay 26 rutas con página, más `/admin` sin índice, y 33 llamadas distintas a la API, contando `/sanctum/csrf-cookie` (1.3, 1.6). El prototipo no tiene URLs: cambia de pantalla con `state.pantalla` (Strata.dc.html:1507-1508), así que el árbol de rutas del repo es la referencia (PROMPT_CLAUDE_CODE.md:40).
- **Dos modelos de negocio distintos.** El prototipo vende licencias por prueba con códigos, carrito y checkout con pago, y acredita al instante (Strata.dc.html:1247-1321, 2086-2097). El repo tiene un saldo único de créditos (1 crédito = 1 candidato), solicitudes que aprueba a mano el super-admin y ningún precio ni pasarela (2026-09-12-fase2-panel-rh-design.md:10-14, :110). «Tests», «Mis licencias» y «Candidatos» no se pueden portar tal cual.
- **«Super admin» no significa lo mismo.** En el prototipo construye pruebas con el Test Builder (Strata.dc.html:330-601). En el repo aprueba créditos y administra usuarios, y las pruebas se cargan por seeder, sin API de edición (2026-09-11-fase1-nucleo.md:712-730). La Fase 5 queda bloqueada hasta que exista ese backend.
- **El flujo del candidato del prototipo choca con reglas del repo.** El prototipo tiene un formulario de nombre y correo que no se envía, consentimiento premarcado, «Siguiente» activo sin respuesta, «Anterior» siempre visible, cuenta regresiva y promesas de copia del reporte por correo (Strata.dc.html:1036-1073, 1522, 2207, 1186, 1148, 1055, 1206). El repo exige consentimiento sin premarcar guardado antes del primer reactivo, no deja avanzar sin responder, muestra «Atrás» solo con allows_back, no tiene límite de tiempo y no entrega resultados al candidato (2026-09-11-fase1-nucleo-design.md:89-93).
- **El reporte del prototipo no corresponde a los datos.** Muestra radar de 6 dimensiones, índice global, «rango esperado del puesto» y «norma LATAM» (Strata.dc.html:891-929). El repo devuelve, por prueba, escalas con categoría e interpretación, integridad y preguntas de entrevista; su «percentil» es el normalized redondeado, no un percentil contra una población (2026-09-11-fase1-nucleo.md:980).
- **Estados de interfaz casi sin diseñar.** El prototipo solo dibuja el carrito vacío y manda todo aviso y error por un toast de 2,6 s sin aria-live (Strata.dc.html:1263-1268, 1544-1548). El repo tiene pantallas que se quedan en «Cargando…» y errores silenciosos (1.4). El brief exige carga, vacío y error en cada pantalla con API (PROMPT_CLAUDE_CODE.md:187).
- **Contraste y teclado.** Los CTA coral con texto blanco dan 2.78:1 y #0EA5E9 como texto entre 2.61 y 2.77:1; no hay color de error; drawer y modales no tienen semántica de diálogo, foco atrapado ni Escape (3.3, 3.4 y «Modales y overlays»). El brief asigna los botones primarios al navy (PROMPT_CLAUDE_CODE.md:63).
- **Hay que reescribir la mascota para producción.** Deja timelines y timers sin limpiar, ignora prefers-reduced-motion, queda debajo del contenido y elige sus objetivos por el texto de los botones (sección 2, «Mascota»).
- **Funciones del repo sin pantalla en el prototipo y huecos de navegación.** Login, registro, perfil, precios, demo, ayuda, legales, detalle de prueba, comparativa y todo `/admin` se diseñan con el mismo sistema (Fase 7). Hay huecos que no se deben copiar: el operador que entra por `/login` cae en `/app` sin camino a `/admin`, y en móvil no hay «Salir» ni «Operación» desde el sitio público (1.2).

## Bloqueo: el código del frontend y del backend no está en el repo

| Evidencia | Resultado | Cómo se comprobó |
|---|---|---|
| `frontend` y `backend` en el índice | Entradas modo 160000 (gitlink): frontend → `c61e7333efe547698d2c17cc5926fbea65e0d5f5`, backend → `a8f6cb566be051477fe06041f68ad8b6aaa119da` | `git ls-files -s frontend backend`; `git ls-tree HEAD` |
| Configuración de submódulos | No existe `.gitmodules`, no existe `.git/modules` y no hay entradas `submodule.*` en la configuración | `ls .gitmodules`; `ls .git/modules`; `git config --get-regexp submodule` |
| Commits apuntados | Los objetos `c61e733…` y `a8f6cb5…` no están en este repositorio | `git cat-file -t <sha>` falla con ambos |
| Carpetas de trabajo | `frontend/` y `backend/` están vacías | `ls -la frontend backend` |
| Remoto | `origin` es github.com/HeribertoNava71/Mezquit y `origin/main` tiene el mismo árbol: README.md, docker-compose.yml, docs/ y los dos gitlinks | `git remote -v`; `git ls-tree origin/main` |

**Origen probable.** El plan evaluation-module ejecuta `git init` dentro de `backend/` y de `frontend/` (2026-09-10-evaluation-module.md:611, :663). Al versionar la raíz, git registró esas carpetas como gitlinks sin contenido. Los planes usan rutas `C:\Users\geova\Documents\Mezquit\…` (por ejemplo, 2026-09-10-sales-site.md:62), así que el código vive probablemente en la máquina donde se ejecutaron.

**Impacto.**

- La sección 1 describe un estado reconstruido desde los planes, no código verificado. Hay señales de que el código real difiere (1.10, riesgos 3, 4, 6 y 7).
- No se pueden validar mapa.md ni brechas.md contra el código.
- Las fases 1 a 8 no pueden empezar: no hay qué modificar ni cómo correr build, lint y tests (PROMPT_CLAUDE_CODE.md:181).
- No se puede comprobar que el backend quede intacto (PROMPT_CLAUDE_CODE.md:186).

**Qué se necesita.**

1. El código de los dos repos embebidos, en los commits `c61e733…` y `a8f6cb5…` o posteriores, sin `.env`, `vendor/` ni `node_modules/`. Ojo: evaluation-module versionó `backend/.env` y `frontend/.env` dentro de esos repos (2026-09-10-evaluation-module.md:611, :664), así que su historial no debe publicarse tal cual ([PB-01](pendientes-backend.md#pb-01)).
2. Decidir cómo versionarlo: monorepo (quitar los gitlinks y versionar el contenido) o submódulos con `.gitmodules` y URLs publicadas. La recomendación y los pasos están en [D-01](decisiones.md#d-01) y [PB-01](pendientes-backend.md#pb-01).
3. Con el código a la vista, revisar package.json (scripts y versiones de axios y del router), tsconfig, ESLint, App.tsx, layouts y componentes, y corregir esta auditoría antes de la Fase 1.

## 1. Frontend actual (reconstruido desde docs/superpowers)

**Alcance.** Esta sección reconstruye el estado final aplicando en orden los 7 planes de `docs/superpowers/plans`, junto con sus specs (`docs/superpowers/specs`) y `docs/design-tokens.md`, y respeta lo que cada plan elimina. Es un estado reconstruido, no código verificado (ver «Bloqueo»); las dudas están en 1.10. Las citas siguen el formato archivo:línea: los planes y specs se citan por su nombre de archivo, y `Strata.dc.html` y `PROMPT_CLAUDE_CODE.md` están en «Plataforma Strata de evaluaciones psicométricas/». Dentro de una celda, «:NNNN» se refiere al último archivo citado.

**Orden de aplicación.** Es el orden indicado para esta auditoría, con una excepción: evaluation-module va antes que sales-site.

| Paso | Plan | Por qué va en esa posición | Evidencia |
|---|---|---|---|
| 1 | 2026-09-10-evaluation-module.md | Rellena `src/api/axios.ts`, que ya existía vacío, crea `frontend/.env` y hace `git init` en frontend y backend. Sales-site ya cuenta con su CRUD y con ese cliente | 2026-09-10-evaluation-module.md:611, :626-648, :663; 2026-09-10-sales-site.md:649-653, :663, :2134 |
| 2 | 2026-09-10-sales-site.md | Sitio de una sola página sin router: tokens, Button, Header, Footer, secciones y POST /api/leads | 2026-09-10-sales-site.md:7, :9 |
| 3 | 2026-09-10-multipage-site.md | Convierte esa página en un sitio de varias páginas con react-router-dom v7 | 2026-09-10-multipage-site.md:5, :51-58 |
| 4 | 2026-09-11-fase1-nucleo.md | Borra el CRUD, instala Sanctum y agrega /login, /registro, /app y /evaluar/:token sobre las rutas de multipage | 2026-09-11-fase1-nucleo.md:27-66, :2412-2417 |
| 5 | 2026-09-11-fase3-sitio-ventas.md | Reescribe App.tsx sin perder las rutas de Fase 1 y elimina /test, /psicometria y /nosotros | 2026-09-11-fase3-sitio-ventas.md:1246-1252, :1283-1290 |
| 6 | 2026-09-12-fase2-panel-rh.md | Agrega hijos a /app y el árbol /admin. Su spec da la Fase 3 por hecha y conserva data/plans.ts | 2026-09-12-fase2-panel-rh-design.md:110; 2026-09-12-fase2-panel-rh.md:2106 |
| 7 | 2026-09-12-registro-login-crud-usuarios.md | Reemplaza Registro, Login y Header, y agrega /perfil y rutas al grupo /admin, que ya existía | 2026-09-12-registro-login-crud-usuarios.md:714, :2013-2019 |

### 1.1 Stack

| Aspecto | Estado reconstruido | Evidencia |
|---|---|---|
| Framework | React 19 con TypeScript 6. SPA sin SSR. `main.tsx` monta StrictMode > BrowserRouter > AuthProvider > App e importa `global.css` | 2026-09-10-sales-site.md:9; 2026-09-11-fase1-nucleo.md:2384-2400 |
| Bundler | Vite 8 con `@vitejs/plugin-react`. El alias `@` → `./src` se define en `vite.config.ts`. Ningún plan muestra tsconfig, así que no consta cómo resuelve tsc los imports `@/` (necesita `paths`; conocimiento externo): hay que verificarlo en el código real. `index.html` tiene lang es, favicons y OG «Mezquit — Pruebas psicométricas para empresas» | 2026-09-10-sales-site.md:437-482 |
| Router | react-router-dom v7.x en modo declarativo: BrowserRouter y Routes/Route anidadas, con tres layout routes (RootLayout, AppLayout y AdminLayout). No hay data router, loaders, actions ni lazy. Se usan useLocation, useParams, useNavigate y NavLink | 2026-09-10-multipage-site.md:51-78; 2026-09-11-fase3-sitio-ventas.md:1233-1281; 2026-09-12-fase2-panel-rh.md:2027 |
| Estado | No hay librería. Cada página usa useState, useEffect y useMemo; el único estado global es AuthContext `{user, loading, setUser}`. Tampoco hay caché ni almacenamiento local: el saldo se pide por separado en AppLayout, Resumen y Créditos | 2026-09-11-fase1-nucleo.md:2100-2123; 2026-09-12-fase2-panel-rh.md:1287, :1355, :1758 |
| Estilos | CSS vanilla. `tokens.css` define color (`--color-*`, `--disc-*`), escala tipográfica (`--text-*`), espaciado (`--sp-*`), layout (`--max-width`, `--section-px`, `--section-py`, `--header-h`), radios (`--radius-*`) y transiciones (`--t-*`); las familias `--font-display` y `--font-body` están en `typography.css`. Además están `global.css` (reset, `:focus-visible`, reduced-motion y `body` con padding-top de 64px) y `animations.css`. La mayoría de componentes y páginas tiene su `.css` con nombres BEM; no lo tienen, entre otros, AdminUsuarioDetallePage, ReporteCandidato, DemoPage, ComoFuncionaPage, RequireAuth y RequirePlatformAdmin. Hay estilos inline estáticos en RequireAuth, RequirePlatformAdmin, SampleReport, NuevaEvaluacion, ContactSection, ReporteCandidato, Registro, Login, PerfilPage, AdminUsuariosPage y AdminUsuarioDetallePage, y dinámicos (ancho y color) en Report y CandidateFlow. No usa Tailwind ni CSS-in-JS | 2026-09-10-sales-site.md:263-350, :358-426, :2330; 2026-09-11-fase1-nucleo.md:2137, :2663, :2898, :3054, :3059, :3146; 2026-09-12-fase2-panel-rh.md:1835, :1897; 2026-09-12-registro-login-crud-usuarios.md:752-788, :1262, :1316, :1620, :1743, :1851-1852, :1910-1941 |
| Tipografía | Cormorant Garamond (400, 600, 700 e itálicas) y DM Sans Variable, servidas desde el propio proyecto con @fontsource. El brief las cambia por Satoshi, General Sans y JetBrains Mono | 2026-09-10-sales-site.md:336-350; PROMPT_CLAUDE_CODE.md:72-74 |
| Movimiento | Todo es CSS: drawGrain (la textura del Hero), el deslizamiento del menú al pasar el cursor, mobileDrop, slideInUp, shake, fadeIn y spin. Una regla global respeta reduced-motion. No hay GSAP | 2026-09-10-sales-site.md:373-380, :821-842; 2026-09-11-fase3-sitio-ventas.md:1101-1102; 2026-09-12-registro-login-crud-usuarios.md:755-779 |
| Cliente HTTP | Hay una sola instancia, `api`, en `src/api/axios.ts`. Su baseURL es `import.meta.env.VITE_API_URL ?? 'http://localhost:8000'`: solo el host, así que cada llamada escribe `/api`. Usa `withCredentials`, `withXSRFToken` y `Accept: application/json`, y trae el helper `csrf()`, que llama a GET /sanctum/csrf-cookie. No tiene interceptores, timeout ni manejo global de 401 o 419. Los módulos cliente son auth, catalog, assessments, candidate, report, rh, admin, profile y adminUsers. `frontend/.env` define `VITE_API_URL=http://localhost:8000`. La versión de axios no está documentada | 2026-09-11-fase1-nucleo.md:2025-2040; 2026-09-10-evaluation-module.md:626-630 |
| Sesión | Sanctum SPA por cookie: statefulApi, dominios stateful localhost:5173 y 127.0.0.1:5173, y CORS con credenciales para FRONTEND_URL. AuthProvider pide GET /api/user al montar; cualquier error deja la sesión vacía. `register()` y `login()` llaman antes a `csrf()` y devuelven `data.user`, y cada página hace `setUser`. Salir es POST /api/logout seguido de `setUser(null)` | 2026-09-11-fase1-nucleo.md:91-120, :2066-2089, :2112-2114 |
| Roles y guardas | RequireAuth protege /app y solo revisa la sesión. RequirePlatformAdmin protege /admin y pide sesión e `is_platform_admin`. `organization_id` solo decide menús y redirecciones, y `role` no se usa. /perfil, /login y /registro no tienen guarda. El detalle está en 1.2 | 2026-09-11-fase1-nucleo.md:2135-2140; 2026-09-12-fase2-panel-rh.md:1895-1901; 2026-09-12-registro-login-crud-usuarios.md:1306, :1469, :2013 |
| Dependencias npm | react, react-dom, react-router-dom v7, axios, `@fontsource/cormorant-garamond` y `@fontsource-variable/dm-sans`, más sharp como devDependency para `scripts/generate-favicons.mjs`. Solo el router tiene versión indicada (v7.x). Los planes 4 a 7 no agregan dependencias | 2026-09-10-sales-site.md:61-65, :71-106; 2026-09-10-multipage-site.md:55-58; 2026-09-12-registro-login-crud-usuarios.md:13 |
| Scripts | Los planes solo invocan `npm run dev` y `npm run build`. El chequeo de tipos se hace con `npx tsc --noEmit`, que no es un script. Ningún plan menciona lint, ESLint, Vitest ni tests de frontend, y ninguno muestra `package.json` ni `tsconfig` | 2026-09-11-fase3-sitio-ventas.md:1295, :1303, :1327 |
| Calidad | En el frontend: tsc, build y capturas con `npx playwright screenshot`, aunque Playwright no está declarado como dependencia. En el backend: PHPUnit con `php artisan test` y `php artisan migrate:fresh --seed`. En desarrollo: `php artisan serve --port=8000` y `npm run dev` en http://localhost:5173 | 2026-09-12-fase2-panel-rh.md:2035, :2055-2057, :2081-2082; 2026-09-11-fase3-sitio-ventas.md:1325-1338 |
| Backend (solo como contrato) | Laravel 13 con PHP 8.4 (8.3 según evaluation-module), Sanctum y MySQL 8.4 en Docker. Toda la API vive bajo /api | 2026-09-11-fase1-nucleo.md:9; 2026-09-10-evaluation-module.md:9, :126-147 |
| Assets | `public/logo.png`, los favicons y `og-image` se generan con sharp a partir de `../backend/img/mezquite.png` | 2026-09-10-sales-site.md:71-106 |

### 1.2 Sesión y roles

El brief pide que el rol salga de la sesión (PROMPT_CLAUDE_CODE.md:21). En el frontend reconstruido, la sesión es `useAuth().user`. AuthProvider la carga con GET /api/user al montar la app, en cualquier ruta, y Login, Registro y los botones Salir la actualizan con `setUser` (2026-09-11-fase1-nucleo.md:2108-2117, :2392-2400; 2026-09-12-registro-login-crud-usuarios.md:1191, :1305, :1451). No hay un campo único de rol: el frontend combina tres datos.

| Actor | Cómo lo distingue el frontend | Qué puede usar | Evidencia |
|---|---|---|---|
| Visitante | `user` es null porque GET /api/user falló | El sitio público dentro de RootLayout, /login, /registro y /evaluar | 2026-09-11-fase1-nucleo.md:2082-2089 |
| Candidato | No tiene cuenta. El token va en la URL /evaluar/:token y sus endpoints son públicos | CandidateFlow | 2026-09-11-fase1-nucleo.md:1806-1816; 2026-09-11-fase3-sitio-ventas.md:1261 |
| Usuario sin organización | `organization_id` es null porque se registró sin empresa | /perfil. Login y registro lo mandan ahí y el menú oculta «Panel de RH», pero nada le impide escribir /app en la barra de direcciones | 2026-09-12-registro-login-crud-usuarios.md:292-307, :1192, :1306, :1469 |
| RH | `organization_id` tiene valor | /app, después de RequireAuth. El backend filtra por organización y responde 403 si el recurso es de otra | 2026-09-11-fase1-nucleo.md:1472, :2135-2140; 2026-09-12-fase2-panel-rh.md:587 |
| Super-admin | `is_platform_admin` es verdadero; el dato llega en GET /api/user y en POST /api/login | /admin, después de RequirePlatformAdmin y del middleware `platform_admin`. Como pertenece a la organización «Mez (operación)», también entra a /app | 2026-09-12-fase2-panel-rh.md:1042-1056, :1895-1901; 2026-09-12-registro-login-crud-usuarios.md:93-104 |
| `role` | Puede ser admin, recruiter o viewer. Al registrarse siempre vale admin, y el super-admin puede cambiarlo | Ninguno: ningún plan lo usa para autorizar | 2026-09-12-registro-login-crud-usuarios.md:308, :587; 2026-09-11-fase1-nucleo-design.md:43 |

- **RequireAuth** (`/app`): mientras carga muestra «Cargando…»; si no hay `user`, navega a /login con replace. No guarda la ruta de origen ni revisa `organization_id` (2026-09-11-fase1-nucleo.md:2135-2140).
- **RequirePlatformAdmin** (`/admin`): muestra «Cargando…», manda a /login si no hay `user` y a /app si no hay `is_platform_admin` (2026-09-12-fase2-panel-rh.md:1895-1901). El backend repite el control con `platform_admin` y responde 403 (:1042-1056, :1112).
- **Rutas sin guarda:** /perfil (2026-09-12-registro-login-crud-usuarios.md:2013). /login y /registro se muestran aunque ya haya sesión.
- **Redirecciones:** Login lleva a /app si hay organización y a /perfil si no (:1306). Registro lleva a /app/evaluaciones/nueva o a /perfil (:1192). Salir lleva a /login desde AppLayout y AdminLayout (2026-09-12-fase2-panel-rh.md:1290, :1934) y a / desde UserDropdown (2026-09-12-registro-login-crud-usuarios.md:1452).
- **Navegación entre zonas:** «Panel de RH» está en el UserDropdown (escritorio) y en el panel móvil del Header público; «Operación» solo está en el UserDropdown (2026-09-12-registro-login-crud-usuarios.md:1469-1474, :1561). El bloque de sesión que contiene el UserDropdown se oculta por debajo de 768 px (:1596) y el panel móvil no tiene «Operación» ni «Salir» (:1558-1568). En móvil no hay enlace a /admin ni «Salir» en el sitio público: quien tiene organización puede salir desde /app, pero un usuario sin organización, que tampoco ve «Panel de RH», no tiene ningún «Salir» a su alcance. AppLayout no enlaza a /admin, a /perfil ni al sitio, y AdminLayout no tiene navegación (2026-09-12-fase2-panel-rh.md:1294-1306, :1936-1944).
- **Prototipo:** sus roles son admin (Super admin), empresa, candidato y visitante (Strata.dc.html:1783-1788). La equivalencia natural es: visitante = sin sesión; empresa = usuario con organización; candidato = token; super admin = `is_platform_admin`. Pero no hacen lo mismo: el super-admin del repo administra créditos y usuarios, y el del prototipo construye tests (PROMPT_CLAUDE_CODE.md:142-144), algo que no tiene backend.

### 1.3 Rutas

Las URLs se conservan (PROMPT_CLAUDE_CODE.md:40). El prototipo no tiene URLs: cambia de pantalla con `state.pantalla` (PROMPT_CLAUDE_CODE.md:19). Por eso este árbol es la referencia. AuthProvider corre en todas las rutas.

```text
App.tsx  (dentro de BrowserRouter > AuthProvider)
├─ /login                              Login                      sin layout
├─ /registro                           Registro                   sin layout
├─ /evaluar                            EvaluarLanding             sin layout
├─ /evaluar/:token                     CandidateFlow              sin layout
├─ RootLayout (ScrollToTop + Header + main#main-content + Footer)
│  ├─ /                                HomePage
│  ├─ /pruebas                         PruebasPage
│  ├─ /pruebas/:slug                   PruebaDetallePage
│  ├─ /como-funciona                   ComoFuncionaPage
│  ├─ /precios                         PreciosPage
│  ├─ /demo                            DemoPage
│  ├─ /ayuda                           AyudaPage
│  ├─ /aviso-de-privacidad             AvisoPrivacidadPage
│  ├─ /terminos                        TerminosPage
│  ├─ /perfil                          PerfilPage (sin guarda)
│  └─ *                                NotFoundPage
├─ /app   RequireAuth > AppLayout
│  ├─ (index)                          ResumenPage
│  ├─ evaluaciones                     EvaluacionesPage
│  ├─ evaluaciones/nueva               NuevaEvaluacion
│  ├─ evaluaciones/:id                 EvaluacionDetallePage
│  ├─ evaluaciones/:id/comparar        CompararPage
│  ├─ creditos                         CreditosPage
│  └─ candidatos/:invitationId/reporte ReporteCandidato
└─ /admin RequirePlatformAdmin > AdminLayout   (sin index)
   ├─ creditos                         AdminCreditosPage
   ├─ usuarios                         AdminUsuariosPage
   ├─ usuarios/:id                     AdminUsuarioDetallePage
   └─ perfil                           AdminPerfilPage
```

Fuentes del árbol: 2026-09-11-fase3-sitio-ventas.md:1255-1280; 2026-09-12-fase2-panel-rh.md:1448-1449, :1692-1693, :1863, :2027-2029; 2026-09-12-registro-login-crud-usuarios.md:2013-2019. Dos consecuencias que se deducen del árbol: cualquier ruta desconocida, incluso bajo /app o /admin, cae en el `*` de RootLayout, y /admin, que no tiene página index, muestra el layout vacío.

| Path | Página | Layout | Guarda | Endpoints | Evidencia |
|---|---|---|---|---|---|
| / | HomePage: Hero, SampleReport, adelanto del catálogo, HowItWorks y CTA a /demo | RootLayout | Pública | GET /api/catalog | 2026-09-11-fase3-sitio-ventas.md:1159-1210, :1263 |
| /pruebas | PruebasPage | RootLayout | Pública | GET /api/catalog | 2026-09-11-fase3-sitio-ventas.md:464-548, :1264 |
| /pruebas/:slug | PruebaDetallePage | RootLayout | Pública | GET /api/catalog/{slug} | 2026-09-11-fase3-sitio-ventas.md:574-651, :1265 |
| /como-funciona | ComoFuncionaPage (HowItWorks y Methodology) | RootLayout | Pública | Ninguno | 2026-09-11-fase3-sitio-ventas.md:679-693, :1266 |
| /precios | PreciosPage (data/plans.ts) | RootLayout | Pública | Ninguno | 2026-09-11-fase3-sitio-ventas.md:735-774, :1267 |
| /demo | DemoPage (ContactSection) | RootLayout | Pública | POST /api/leads | 2026-09-11-fase3-sitio-ventas.md:697-711, :1268 |
| /ayuda | AyudaPage | RootLayout | Pública | Ninguno | 2026-09-11-fase3-sitio-ventas.md:817-866, :1269 |
| /aviso-de-privacidad | AvisoPrivacidadPage (LegalPage) | RootLayout | Pública | Ninguno | 2026-09-11-fase3-sitio-ventas.md:900-907, :1270 |
| /terminos | TerminosPage (LegalPage) | RootLayout | Pública | Ninguno | 2026-09-11-fase3-sitio-ventas.md:910-917, :1271 |
| /perfil | PerfilPage | RootLayout | Ninguna. La API exige sesión, así que un visitante ve «Cargando…» sin fin | GET /api/user/profile, PUT /api/user/profile, PUT /api/user/password | 2026-09-12-registro-login-crud-usuarios.md:1701-1780, :2013 |
| `*` | NotFoundPage | RootLayout | Pública | Ninguno | 2026-09-11-fase3-sitio-ventas.md:1272; 2026-09-10-multipage-site.md:1331-1343 |
| /login | Login | Sin layout | Pública; no redirige si ya hay sesión | GET /sanctum/csrf-cookie, POST /api/login | 2026-09-11-fase3-sitio-ventas.md:1258; 2026-09-12-registro-login-crud-usuarios.md:1277-1336 |
| /registro | Registro | Sin layout | Pública; no redirige si ya hay sesión | GET /sanctum/csrf-cookie, POST /api/register | 2026-09-11-fase3-sitio-ventas.md:1259; 2026-09-12-registro-login-crud-usuarios.md:1146-1275 |
| /evaluar | EvaluarLanding | Sin layout; no tiene logo ni enlace de regreso | Pública | Ninguno | 2026-09-11-fase3-sitio-ventas.md:938-987, :1260 |
| /evaluar/:token | CandidateFlow | Sin layout; usa su propio contenedor `.cand` | Pública, se entra con el token | GET /api/evaluar/{token} y /pruebas/{testId}; POST /consent, /answers, /events y /complete | 2026-09-11-fase1-nucleo.md:2716-2942; 2026-09-11-fase3-sitio-ventas.md:1261 |
| /app | ResumenPage (index) | AppLayout | RequireAuth; solo pide sesión | GET /api/credits y GET /api/assessments. El layout además usa GET /api/credits y POST /api/logout | 2026-09-12-fase2-panel-rh.md:1271-1313, :1343-1379, :1448 |
| /app/evaluaciones | EvaluacionesPage | AppLayout | RequireAuth | GET /api/assessments | 2026-09-12-fase2-panel-rh.md:1396-1438, :1449 |
| /app/evaluaciones/nueva | NuevaEvaluacion | AppLayout | RequireAuth | POST /api/assessments | 2026-09-11-fase1-nucleo.md:2553-2673; 2026-09-11-fase3-sitio-ventas.md:1275 |
| /app/evaluaciones/:id | EvaluacionDetallePage | AppLayout | RequireAuth; el backend responde 403 si es de otra organización | GET /api/assessments/{id}, POST /api/invitations/{id}/resend | 2026-09-12-fase2-panel-rh.md:1495-1564, :1692 |
| /app/evaluaciones/:id/comparar | CompararPage | AppLayout | RequireAuth; el backend responde 403 si es de otra organización | GET /api/assessments/{id}/compare | 2026-09-12-fase2-panel-rh.md:1585-1680, :1693 |
| /app/creditos | CreditosPage | AppLayout | RequireAuth | GET /api/credits, POST /api/credit-requests | 2026-09-12-fase2-panel-rh.md:1740-1809, :1863 |
| /app/candidatos/:invitationId/reporte | ReporteCandidato; el id es el de la invitación | AppLayout | RequireAuth; el backend responde 403 si es de otra organización y 409 si no está completada | GET /api/invitations/{id}/report | 2026-09-12-fase2-panel-rh.md:1813-1842; 2026-09-11-fase1-nucleo.md:1931-1932 |
| /admin | Sin página index: AdminLayout con el Outlet vacío | AdminLayout | RequirePlatformAdmin | POST /api/logout | 2026-09-12-fase2-panel-rh.md:1915-1946, :2027-2029 |
| /admin/creditos | AdminCreditosPage | AdminLayout | RequirePlatformAdmin y `platform_admin` | GET /api/admin/credit-requests; POST …/{id}/approve; POST …/{id}/reject | 2026-09-12-fase2-panel-rh.md:1962-2016, :2028 |
| /admin/usuarios | AdminUsuariosPage | AdminLayout | RequirePlatformAdmin y `platform_admin` | GET /api/admin/users, DELETE /api/admin/users/{id} | 2026-09-12-registro-login-crud-usuarios.md:1801-1873, :2016 |
| /admin/usuarios/:id | AdminUsuarioDetallePage | AdminLayout | RequirePlatformAdmin y `platform_admin` | GET, PATCH y DELETE /api/admin/users/{id} | 2026-09-12-registro-login-crud-usuarios.md:1877-1945, :2017 |
| /admin/perfil | AdminPerfilPage | AdminLayout | RequirePlatformAdmin y `platform_admin` | PUT /api/admin/me | 2026-09-12-registro-login-crud-usuarios.md:1958-2000, :2018 |

### 1.4 Páginas

| Página y ruta | Datos | Formularios y validaciones | Acciones | Estados de UI existentes |
|---|---|---|---|---|
| HomePage `/` | GET /api/catalog: id, label y count de cada categoría. El Hero usa SITE.tagline y SampleReport muestra datos fijos (2026-09-11-fase3-sitio-ventas.md:1171-1209; 2026-09-11-fase1-nucleo.md:3120-3137) | Ninguno | En el Hero, «Agenda una demo» lleva a SITE.calendarUrl o a `#contacto`, y «Ver catálogo ↓» a `#catalogo`; ninguna de las dos anclas existe ya en la Home (2026-09-10-sales-site.md:1276-1284). «Ver cómo funciona» lleva a /como-funciona. Cada tarjeta de categoría y «Ver todas las pruebas» llevan a /pruebas, sin filtro. «Agenda una demo» lleva a /demo (2026-09-11-fase3-sitio-ventas.md:1182-1206) | Mientras carga, la grilla queda vacía y sin indicador. Si falla, la lista queda vacía sin avisar, y la lista vacía no tiene mensaje (:1175, :1190). La textura animada respeta reduced-motion (2026-09-10-sales-site.md:837-842) |
| PruebasPage `/pruebas` | GET /api/catalog (2026-09-11-fase3-sitio-ventas.md:482) | Búsqueda `type=search`, opcional; filtra en el cliente por nombre o descripción (:487-494, :516-523) | Filtros «Todas» y «{label} [ {count} ]» con aria-pressed. Cada tarjeta lleva a /pruebas/:slug y muestra «{min} min · [ {n} reactivos ]» (:508-535) | «Cargando catálogo…». Si falla: «No pudimos cargar el catálogo. Recarga la página.», sin botón para reintentar. Sin resultados: «No hay pruebas que coincidan con tu búsqueda.» (:502-503, :540) |
| PruebaDetallePage `/pruebas/:slug` | GET /api/catalog/{slug}. Muestra un Report con el SAMPLE fijo: organization «Mez» y escalas A, B y C (2026-09-11-fase3-sitio-ventas.md:582-609) | Ninguno | «← Volver al catálogo» lleva a /pruebas (:614, :627) | «Cargando…». Cualquier error (404, 500 o de red) muestra «Prueba no encontrada» y «Esta prueba no existe o no está disponible.» (:612-622). Si carga bien, muestra la categoría, la duración, «[ n ]» reactivos y «Así se ve un reporte de esta categoría:» (:629-645) |
| ComoFuncionaPage `/como-funciona` | Contenido fijo: HowItWorks (4 pasos) y Methodology (Validez, Confiabilidad, Estandarización, Baremos y normas) (2026-09-11-fase3-sitio-ventas.md:684-692; 2026-09-10-multipage-site.md:849-866) | Ninguno | Ninguna | No tiene estados |
| PreciosPage `/precios` | Contenido fijo de PLANS: «Paquete de créditos» y «Suscripción mensual», ambos con «[PENDIENTE: precio]» (2026-09-11-fase3-sitio-ventas.md:381-409) | Ninguno | «Agenda una demo» en cada plan y «Hablar con nosotros» llevan a /demo. No se puede comprar (:760, :765-767) | No tiene estados |
| DemoPage `/demo` | POST /api/leads desde ContactSection, más SITE.calendarUrl (2026-09-11-fase3-sitio-ventas.md:703-710) | Formulario con noValidate. Campos de texto Nombre, Empresa y Correo electrónico, y listas Sector, Tamaño de empresa y Evaluaciones al mes, que empiezan en «Selecciona…». Los 6 son obligatorios, pero eso solo lo valida el servidor (2026-09-10-sales-site.md:600-610, :2208-2301) | «Solicitar información». Al editar un campo se borra su error. «Reservar tiempo →» solo aparece si calendarUrl es un enlace real (:2164-2166, :2311, :2325-2333) | Al enviar, el botón dice «Enviando…» y se deshabilita. Si sale bien: «¡Gracias!» con role=status. Un 422 muestra el mensaje de cada campo con ⚠ y role=alert. Los errores de red, 419, 429 y 500 no muestran nada. Sin calendarUrl se lee «[PENDIENTE: enlace de agenda]» (:2169-2193, :2202-2206, :2225-2234, :2330-2332) |
| AyudaPage `/ayuda` | Contenido fijo: 3 preguntas de candidato, 3 de empresa y SITE.email (2026-09-11-fase3-sitio-ventas.md:823-833) | Ninguno | «¿Te invitaron a una evaluación? Accede aquí →» lleva a /evaluar. «Escríbenos: {email}» abre el correo (:849, :859) | No tiene estados |
| AvisoPrivacidadPage `/aviso-de-privacidad` y TerminosPage `/terminos` | LegalPage con el cuerpo «[PENDIENTE: …]» (2026-09-11-fase3-sitio-ventas.md:900-917) | Ninguno | Ninguna | No tiene estados |
| NotFoundPage `*` | Ninguno | Ninguno | «Volver al inicio» lleva a / (2026-09-10-multipage-site.md:1335-1343) | Un solo estado: «404» y «Esta página no existe o fue movida.» |
| PerfilPage `/perfil` | GET /api/user/profile, PUT /api/user/profile y PUT /api/user/password (2026-09-12-registro-login-crud-usuarios.md:1717-1741) | Datos personales: Nombre (required en HTML), Apellido, Teléfono (tel) y Puesto. El servidor exige name y last_name, y acepta phone de hasta 30, birth_date anterior a hoy y position de hasta 255 (:1759-1762, :515-521). Contraseña: actual, nueva y confirmación, las tres required; el servidor pide al menos 8 caracteres, que coincidan y que la actual sea correcta (:1770-1772, :545-561) | «Guardar cambios» (reenvía birth_date aunque no se muestra). «Cambiar contraseña», en estilo ghost (:1719-1724, :1764, :1773) | Se queda en «Cargando…» si el GET falla o no hay sesión. Los avisos de éxito duran 3 s: «Perfil guardado correctamente.» y «Contraseña actualizada.». Muestra un aviso si el usuario no tiene organización. Guardar el perfil no maneja errores, y de los errores de contraseña solo se ve el de current_password (:1717, :1743, :1750-1754, :1765, :1774) |
| Login `/login` | csrf() y POST /api/login (2026-09-11-fase1-nucleo.md:2072-2076) | Correo electrónico (email, required) y Contraseña (required), con la validación del navegador (2026-09-12-registro-login-crud-usuarios.md:1325-1328) | «Entrar» guarda el usuario con setUser y lleva a /app si hay organización o a /perfil si no. «¿No tienes cuenta? Regístrate» lleva a /registro (:1304-1306, :1331) | La tarjeta entra animada y el botón muestra un spinner con «Enviando…». Cualquier error dice «Correo o contraseña incorrectos.». No redirige si ya hay sesión (:1307-1309, :1316-1323) |
| Registro `/registro` | csrf() y POST /api/register (2026-09-11-fase1-nucleo.md:2066-2070) | Formulario con noValidate. Datos personales: Nombre, Apellido, Correo electrónico, Contraseña (mín. 8 caracteres) con PasswordStrength, Confirmar contraseña, Fecha de nacimiento y Teléfono. Empresa (opcional): Empresa / Organización y Puesto. Casilla de aviso de privacidad. Todas las reglas las valida solo el servidor (2026-09-12-registro-login-crud-usuarios.md:1209-1267, :250-263) | «Crear cuenta» guarda el usuario con setUser y lleva a /app/evaluaciones/nueva si hay organización o a /perfil si no. «Entra aquí» lleva a /login. El aviso de privacidad se abre en otra pestaña (:1184-1192, :1259, :1270) | La tarjeta entra con slideInUp y el botón muestra carga. Un 422 marca el campo con error y lo sacude. Si la respuesta no trae errors: «Ocurrió un error. Intenta de nuevo.». La confirmación de contraseña no se compara en el cliente (:1193-1201, :1216) |
| EvaluarLanding `/evaluar` | No llama a la API (2026-09-11-fase3-sitio-ventas.md:938-987) | Un campo «Enlace o código» que acepta una URL con /evaluar/{token} o un token alfanumérico (:944-952) | «Continuar» lleva a /evaluar/:token (:959-967) | Si el formato no sirve: «Pega el enlace completo o el código que te dieron.» con role=alert. No tiene estado de carga, ni logo ni enlace de regreso (:963, :981) |
| CandidateFlow `/evaluar/:token` | GET /api/evaluar/{token}; GET …/pruebas/{testId}, solo para tests[0]; POST consent, answers, events (blur) y complete (2026-09-11-fase1-nucleo.md:2799-2850) | Casilla de consentimiento, sin marcar al inicio, que habilita «Continuar». Las opciones son botones de al menos 44px (:2877-2881, :2902-2910, :2763) | Comenzar → Continuar (consentimiento v1) → Empezar (retoma en el primer reactivo sin respuesta) → elegir una opción (se guarda al momento con elapsed_ms) → Siguiente o Terminar. No hay «Atrás». «¿Problemas con la prueba?» no lleva a ningún lado (:2815-2850, :2868-2869) | Etapas: loading, blocked, welcome, consent, instructions, items y done. «Este enlace ya no está disponible» aparece igual para un 404, una invitación completada o expirada y un error de red. Muestra «Pregunta i de n» con barra de avance, y Siguiente está deshabilitado mientras no hay respuesta. Si falla el guardado no se avisa, y los fallos de consent, items y complete no se capturan (:2786, :2852-2924) |
| ResumenPage `/app` | GET /api/credits y GET /api/assessments (2026-09-12-fase2-panel-rh.md:1354-1359) | Ninguno | «Ver créditos» lleva a /app/creditos y «Ver evaluaciones» a /app/evaluaciones (:1368, :1373) | No tiene estado de carga ni de error: muestra «—» y 0 hasta que llegan los datos, y los errores se ignoran. Falta la lista de últimas completadas que pide la spec (:1355-1356, :1367-1372; 2026-09-12-fase2-panel-rh-design.md:75) |
| EvaluacionesPage `/app/evaluaciones` | GET /api/assessments (2026-09-12-fase2-panel-rh.md:1407) | Ninguno | «Nueva evaluación» lleva a /app/evaluaciones/nueva y «Ver» al detalle (:1413, :1429) | «Cargando…». Lista vacía: «Aún no tienes evaluaciones. Crea la primera.». Un error se muestra como lista vacía. La tabla tiene Nombre, Puesto, Avance («X de Y completadas») y Fecha (:1415-1429) |
| NuevaEvaluacion `/app/evaluaciones/nueva` | POST /api/assessments con test_ids [1] (2026-09-11-fase1-nucleo.md:2561, :2580-2596) | Paso 1: Nombre de la evaluación y Puesto, sin validar en el cliente. Paso 2: la prueba demo, fija. Paso 3: un área de texto con un candidato por línea en formato «nombre, correo». Paso 4: fecha límite opcional. El servidor valida con StoreAssessmentRequest (:2620-2669, :1393-1405) | Siguiente y Atrás; «Crear y enviar»; «Copiar enlace» en cada invitación (:2598-2612) | Muestra «Paso N de 4» y estado de carga. Cualquier error, incluido el 422 de créditos, muestra «Revisa los datos: nombre, al menos un candidato con "nombre, correo".». Al terminar no confirma la copia ni enlaza al detalle (:2591-2593, :2663) |
| EvaluacionDetallePage `/app/evaluaciones/:id` | GET /api/assessments/{id} y POST /api/invitations/{id}/resend (2026-09-12-fase2-panel-rh.md:1513-1518) | Ninguno | «Comparar candidatos», único acceso a la comparativa. «Copiar enlace», que cambia a «Copiado» durante 1,5 s. «Reenviar», deshabilitado si la invitación está completada. «Ver reporte», solo si está completada (:1533, :1548-1554) | Si la carga falla, se queda en «Cargando…». Cada estado lleva glifo y texto: ○ Pendiente, ◐ Iniciada, ● Completada, × Expirada. El reenvío no confirma el éxito ni avisa del error (:1503-1505, :1524) |
| CompararPage `/app/evaluaciones/:id/comparar` | GET /api/assessments/{id}/compare (2026-09-12-fase2-panel-rh.md:1599) | Ninguno | Ordenar por escala (por normalized, primero de mayor a menor). «Exportar CSV», que se genera en el navegador (:1601-1633, :1641) | Si la carga falla, se queda en «Cargando…». Sin candidatos completados: «Aún no hay candidatos que hayan completado esta evaluación.». Muestra una flecha ↑ o ↓ en la columna ordenada y la tabla tiene scroll horizontal (:1635-1654) |
| CreditosPage `/app/creditos` | GET /api/credits y POST /api/credit-requests (2026-09-12-fase2-panel-rh.md:1758-1765) | Cantidad (number, min 1, required) y Nota (opcional). El servidor exige un entero de 1 o más y una nota de hasta 500 caracteres (:1776-1787, :908-911) | «Enviar solicitud» (:1785) | Si falla, el saldo muestra «—». Tras enviar aparece «Solicitud registrada. Un asesor la revisará.» y no se quita. Los errores se ignoran. El historial no tiene estado vacío y muestra referencias en crudo, como assessment:12 (:1764, :1786, :1795-1801) |
| ReporteCandidato `/app/candidatos/:invitationId/reporte` | GET /api/invitations/{id}/report (2026-09-12-fase2-panel-rh.md:1827) | Ninguno | «Descargar PDF» llama a window.print() (:1836) | «Cargando reporte…». Cualquier error muestra «No se pudo cargar el reporte (¿la evaluación está completada?).». Al imprimir, @media print oculta las barras y los botones (:1830-1831, :1846-1854) |
| AdminCreditosPage `/admin/creditos` | GET /api/admin/credit-requests y POST approve o reject (2026-09-12-fase2-panel-rh.md:1972-1982) | Ninguno | «Aprobar» y «Rechazar» no piden confirmación; al resolverse, la fila desaparece (:1980, :2004-2005) | «Cargando…». Lista vacía: «No hay solicitudes pendientes.», que también aparece si la carga falla. Si aprobar o rechazar falla, no se avisa (:1972, :1987-1988) |
| AdminUsuariosPage `/admin/usuarios` | GET /api/admin/users?search&page y DELETE /api/admin/users/{id} (2026-09-12-registro-login-crud-usuarios.md:1817-1828) | Un buscador sin etiqueta, «Buscar por nombre o correo…», que hace una petición por cada tecla (:1834) | «Editar» lleva al detalle. «Eliminar» pide confirmar en la misma fila con «¿Eliminar? Sí · No». Paginación con «← Anterior» y «Siguiente →» (:1848-1867) | No tiene estado de carga, vacío ni error. El título es «Usuarios (N)» y el rol aparece sin traducir. El 409 que da intentar borrarse a sí mismo no se maneja (:1818, :1833, :1844) |
| AdminUsuarioDetallePage `/admin/usuarios/:id` | GET, PATCH y DELETE /api/admin/users/{id} (2026-09-12-registro-login-crud-usuarios.md:1893-1905) | Nombre, Apellido, Teléfono y Puesto, más una lista Rol (Admin, Reclutador, Visualizador) cuya etiqueta no está asociada al control. El servidor valida con AdminUpdateUserRequest (:1915-1928, :582-588) | «Guardar cambios». «Eliminar usuario» pide confirmación y luego lleva a /admin/usuarios (:1929-1941) | Si la carga falla, se queda en «Cargando…». Al guardar muestra «Guardado.» durante 3 s. Guardar y eliminar no manejan errores, y la página no tiene versión para móvil (:1893, :1907, :1914, :1930) |
| AdminPerfilPage `/admin/perfil` | PUT /api/admin/me (2026-09-12-registro-login-crud-usuarios.md:1975-1985) | Correo (email, required), contraseña actual, nueva contraseña y confirmación, todas required. El servidor exige un correo no usado por otro usuario, al menos 8 caracteres, que las contraseñas coincidan y que la actual sea correcta (:1990-1993, :687-696) | «Guardar» (:1995) | Cualquier error muestra «La contraseña actual es incorrecta o el correo ya está en uso.». Si sale bien: «Credenciales actualizadas.». No actualiza el correo en AuthContext (:1982-1984, :1996) |

### 1.5 Componentes compartidos

| Componente | Archivo | Uso y contrato | Evidencia |
|---|---|---|---|
| RootLayout | components/layout/RootLayout.tsx | ScrollToTop, Header, `main#main-content` con el Outlet y Footer. No tiene enlace para saltar al contenido | 2026-09-10-multipage-site.md:1359-1377 |
| Header | components/layout/Header.tsx y .css | Logo y SITE.name llevan a /. Enlaces Pruebas, Cómo funciona, Precios y Ayuda con efecto al pasar el cursor y marca del activo. Sin sesión muestra «Entrar» y «Crear cuenta»; con sesión, el UserDropdown; mientras carga, nada. En móvil, un botón abre un panel role=dialog, que no atrapa el foco ni se cierra con Escape. Por debajo de 768 px se oculta el bloque de sesión (Entrar, Crear cuenta o UserDropdown) y el panel agrega «¿Te invitaron a una evaluación?», «Mi perfil» y «Panel de RH», pero no «Salir» ni «Operación» | 2026-09-12-registro-login-crud-usuarios.md:1488-1597; 2026-09-11-fase3-sitio-ventas.md:1090-1109; 2026-09-10-multipage-site.md:294-298 |
| UserDropdown | components/ui/UserDropdown.tsx y .css | Muestra nombre y apellido. «Mi perfil» lleva a /perfil; «Panel de RH», a /app (solo con organización); «Operación», a /admin/creditos (solo super-admin). «Salir» llama a POST /api/logout y lleva a /. Se cierra con un clic fuera, pero no con Escape ni con las flechas | 2026-09-12-registro-login-crud-usuarios.md:1435-1481 |
| Footer | components/layout/Footer.tsx y .css | Logo invertido. Enlaces Aviso de privacidad, Términos y condiciones, Ayuda, ¿Te invitaron a una evaluación? y Contacto (abre el correo). Es el único lugar que enlaza /terminos. Muestra «© año [PENDIENTE: razón social del titular]» y SITE.email | 2026-09-10-sales-site.md:1143-1172; 2026-09-11-fase3-sitio-ventas.md:1116-1122 |
| ScrollToTop | components/layout/ScrollToTop.tsx | Al cambiar de ruta, sube al inicio o salta al #hash. Solo está en RootLayout: AppLayout y AdminLayout no lo usan | 2026-09-10-multipage-site.md:184-209; 2026-09-12-fase2-panel-rh.md:1293-1311, :1936-1944 |
| AppLayout | pages/app/AppLayout.tsx y .css | Barra con «Mez» (lleva a /app), enlaces Resumen (con end), Evaluaciones y Créditos, «Créditos: N» (se oculta en pantallas de 640px o menos) y Salir. El main mide 960px como máximo | 2026-09-12-fase2-panel-rh.md:1273-1325; 2026-09-11-fase1-nucleo.md:2481-2494 |
| AdminLayout | pages/admin/AdminLayout.tsx y .css | «Mez · operación», que no es un enlace, y Salir, con la clase de AppLayout. No tiene navegación | 2026-09-12-fase2-panel-rh.md:1915-1946 |
| AuthProvider y useAuth | context/AuthContext.tsx | Expone `{user, loading, setUser}` y pide GET /api/user al montar. useAuth lanza un error si se usa fuera del provider | 2026-09-11-fase1-nucleo.md:2096-2124 |
| RequireAuth y RequirePlatformAdmin | components/RequireAuth.tsx y components/RequirePlatformAdmin.tsx | Las guardas descritas en 1.2 | 2026-09-11-fase1-nucleo.md:2135-2140; 2026-09-12-fase2-panel-rh.md:1895-1901 |
| Button | components/ui/Button.tsx y .css | Props: variant (primary o ghost), size (md o lg), `to`, `href`, type, disabled, loading, className y onClick. Con `to` se pinta un Link; con `href`, un `a`; si no, un `button`. En el `button`, loading lo deshabilita y cambia el texto a «Enviando…». Link y `a` ignoran onClick y disabled; con loading reciben la clase btn--loading (opacidad .6, sin eventos de puntero y el spinner global de Auth.css), pero no cambian el texto ni quedan deshabilitados. No hay variante para acciones de peligro | 2026-09-10-multipage-site.md:103-162; 2026-09-10-sales-site.md:703-707; 2026-09-12-registro-login-crud-usuarios.md:1119-1129 |
| FloatingInput | components/ui/FloatingInput.tsx y .css | Campo con etiqueta flotante (usa como placeholder un espacio). El error pone aria-invalid, aria-describedby y role=alert, y sacude el campo; el mensaje es solo texto rojo, sin ícono. Al enfocarlo se quita el contorno de foco global y solo cambia el color del borde | 2026-09-12-registro-login-crud-usuarios.md:795-890 |
| PasswordStrength | components/ui/PasswordStrength.tsx y .css | Tres barras con la etiqueta Débil, Media o Fuerte, según la longitud (8 o más), las mayúsculas y los números. Solo informa; no bloquea | 2026-09-12-registro-login-crud-usuarios.md:898-954 |
| Report | sections/Report.tsx y .css | Pinta el reporte individual y los de ejemplo, que llevan el badge «Ejemplo» cuando sample es true. Contiene el encabezado y, por cada prueba de tests[], su título, sus escalas (categoría en texto, «pc N», barra sage, fern o hunter e interpretación) y su integridad (blur_count); después, las preguntas sugeridas y el pie legal, que es texto fijo del componente. «pc N» muestra el campo percentile, que es el normalized redondeado (ver 1.8). La categoría «bajo» se escribe en color sage, que design-tokens.md:30 prohíbe como color de texto (2.3:1). Tiene estilos @media print | 2026-09-11-fase1-nucleo.md:2995-3082, :3027-3031, :3054; 2026-09-12-fase2-panel-rh.md:1846-1854 |
| SampleReport | sections/SampleReport.tsx | «Este es el reporte que recibes», con Report y datos fijos | 2026-09-11-fase1-nucleo.md:3115-3153 |
| Hero | sections/Hero.tsx | Tagline, «Agenda una demo» (calendarUrl o `#contacto`), «Ver catálogo ↓» (`#catalogo`) y GrainTexture | 2026-09-10-sales-site.md:1261-1295 |
| HowItWorks y Methodology | sections/HowItWorks.tsx y sections/Methodology.tsx | HowItWorks: 4 pasos numerados. Methodology: 4 conceptos de metodología | 2026-09-10-sales-site.md:1843-1886; 2026-09-10-multipage-site.md:846-885 |
| ContactSection | sections/ContactSection.tsx y .css | Formulario de leads y bloque de agenda (`id=contacto`) | 2026-09-10-sales-site.md:2128-2339 |
| PageHeader y LegalPage | sections/PageHeader.tsx y pages/legal/LegalPage.tsx | PageHeader: h1 con entradilla opcional. LegalPage: plantilla legal de un párrafo | 2026-09-10-multipage-site.md:350-368; 2026-09-11-fase3-sitio-ventas.md:880-896 |
| GrainTexture | components/ui/GrainTexture.tsx | SVG decorativo animado. Solo aparece en el Hero | 2026-09-10-sales-site.md:797-907 |
| SITE y PLANS | config/site.ts y data/plans.ts | SITE: name, domain, email, calendarUrl, tagline y apiBase; domain, email y calendarUrl están en [PENDIENTE]. PLANS: dos planes con precio [PENDIENTE] | 2026-09-10-sales-site.md:169-176; 2026-09-11-fase3-sitio-ventas.md:372-409 |
| Etiquetas de presentación | EvaluacionDetallePage, CreditosPage y Report | Estados ○ Pendiente, ◐ Iniciada, ● Completada y × Expirada; tipos Compra, Consumo, Cortesía y Ajuste; un color por categoría | 2026-09-12-fase2-panel-rh.md:1503-1505, :1747-1749; 2026-09-11-fase1-nucleo.md:3027-3031 |

### 1.6 Endpoints consumidos

Todos los clientes usan la instancia `api`. La baseURL es solo el host y cada path incluye /api. Ningún cliente tiene interceptores.

| Método | Path | Auth | Consumido por | Payload | Respuesta | Errores y cómo los trata la UI | Evidencia |
|---|---|---|---|---|---|---|---|
| GET | /sanctum/csrf-cookie | Pública (Sanctum) | csrf(), que se llama antes de register() y login() | — | Cookie XSRF-TOKEN | No se manejan | 2026-09-11-fase1-nucleo.md:2035-2037, :2066-2076 |
| POST | /api/register | Pública (stateful con CSRF) | Registro | name, last_name, email, password, password_confirmation y privacy_accepted; opcionales company_name, sector, company_size, phone, birth_date y position | 201 {user}. Abre la sesión; si hay empresa, crea la organización y le da créditos de cortesía | Un 422 se muestra en cada campo; cualquier otro error, con «Ocurrió un error. Intenta de nuevo.» | 2026-09-12-registro-login-crud-usuarios.md:250-318, :1184-1201 |
| POST | /api/login | Pública | Login | {email, password} | 200 {user} con organization_id e is_platform_admin | El backend responde 422 «Credenciales incorrectas.»; la UI siempre muestra «Correo o contraseña incorrectos.» | 2026-09-11-fase1-nucleo.md:1186-1200; 2026-09-12-registro-login-crud-usuarios.md:1304-1309 |
| POST | /api/logout | Fuera de auth:sanctum | AppLayout, AdminLayout y UserDropdown | — | 204 | Sin catch | 2026-09-11-fase1-nucleo.md:1202-1209, :1229; 2026-09-12-registro-login-crud-usuarios.md:1449-1454 |
| GET | /api/user | auth:sanctum | AuthProvider, en todas las rutas | — | 200 con el User sin envoltorio | Cualquier error deja user en null | 2026-09-11-fase1-nucleo.md:1496-1497, :2082-2089 |
| POST | /api/leads | Pública, sin throttle | ContactSection (/demo) | {name, company, email, sector, company_size, evaluations_per_month} | 201 {message}; la UI lo ignora | Un 422 se muestra en cada campo; el resto, en silencio | 2026-09-10-sales-site.md:600-610, :633-638, :2169-2193 |
| GET | /api/catalog | Pública | HomePage y PruebasPage | — | 200 {data:[{id, label, count, tests:[{id, slug, name, description, duration_min, item_count}]}]} | En la Home, en silencio; en Pruebas, un mensaje sin opción de reintentar | 2026-09-11-fase3-sitio-ventas.md:238-269, :356-359, :482, :1175 |
| GET | /api/catalog/{slug} | Pública | PruebaDetallePage | slug sin codificar | 200 {data:{id, slug, name, category, category_label, description, duration_min, item_count}} | 404; cualquier error muestra «Prueba no encontrada» | 2026-09-11-fase3-sitio-ventas.md:271-292, :361-364, :606-618 |
| GET | /api/evaluar/{token} | Pública, con el token | CandidateFlow | — | 200 {data:{status, organization, position, tests, consented}}; si el enlace venció, lo marca como expirada | Un 404 o cualquier error lleva a la pantalla de bloqueo | 2026-09-11-fase1-nucleo.md:1673-1696, :2799-2805 |
| GET | /api/evaluar/{token}/pruebas/{testId} | Pública, con el token | CandidateFlow (solo tests[0]) | — | 200 {data:{test, items:[{id, order, prompt, options, answered}]}}; crea el attempt | 404; no se captura | 2026-09-11-fase1-nucleo.md:1720-1738, :2815-2824 |
| POST | /api/evaluar/{token}/consent | Pública, con el token | CandidateFlow | {privacy_version: 'v1'} | 201 {ok}; pasa de pendiente a iniciada | 409 «La evaluación ya no admite respuestas.»; no se captura | 2026-09-11-fase1-nucleo.md:1698-1718, :2826-2831 |
| POST | /api/evaluar/{token}/answers | Pública, con el token | CandidateFlow | {test_id, item_id, value, elapsed_ms} | 200 {ok}; guarda o reemplaza la respuesta del reactivo | 409 y 422, en silencio | 2026-09-11-fase1-nucleo.md:1740-1758, :2833-2838 |
| POST | /api/evaluar/{token}/events | Pública, con el token | CandidateFlow (blur) | {test_id, type} | 201 {ok} | En silencio | 2026-09-11-fase1-nucleo.md:1760-1772, :2807-2813 |
| POST | /api/evaluar/{token}/complete | Pública, con el token | CandidateFlow (último reactivo) | — | 200 {ok}; califica y cierra la evaluación | 409; no se captura | 2026-09-11-fase1-nucleo.md:1774-1787, :2840-2850 |
| GET | /api/assessments | auth:sanctum | ResumenPage y EvaluacionesPage | — | 200 {data:[{id, name, position, deadline, status, counts, created_at}]} | En Resumen, en silencio; en la lista, como vacío | 2026-09-12-fase2-panel-rh.md:584-611, :1356, :1407 |
| POST | /api/assessments | auth:sanctum | NuevaEvaluacion | {name, position, test_ids:[1], candidates:[{name, email}], deadline} | 201 {data:{id, name, invitations:[{id, candidate, email, status, link}]}}; descuenta créditos | Tanto el 422 de validación como el de créditos (este sin errors) muestran un mensaje genérico | 2026-09-11-fase1-nucleo.md:1393-1405, :2580-2596; 2026-09-12-fase2-panel-rh.md:411-459 |
| GET | /api/assessments/{assessment} | auth:sanctum | EvaluacionDetallePage | — | 200 {data:{id, name, position, invitations}} | 403 y 404 dejan «Cargando…» fijo | 2026-09-11-fase1-nucleo.md:1470-1487; 2026-09-12-fase2-panel-rh.md:1513 |
| GET | /api/assessments/{assessment}/compare | auth:sanctum | CompararPage | — | 200 {data:{assessment, scales, rows}} | 403 y 404 dejan «Cargando…» fijo | 2026-09-12-fase2-panel-rh.md:751-790, :1599 |
| POST | /api/invitations/{invitation}/resend | auth:sanctum | EvaluacionDetallePage | — | 200 {ok}; actualiza sent_at | 403 y 409, sin mensaje | 2026-09-12-fase2-panel-rh.md:630-641, :1515-1518 |
| GET | /api/invitations/{invitation}/report | auth:sanctum | ReporteCandidato | — | 200 {data:{candidate, position, assessment, organization, completed_at, tests:[{name, integrity:{blur_count}, scales:[{code, name, normalized, percentile, category, interpretation}]}], interview_questions}}. El pie legal no viene en la respuesta: es texto fijo de Report | 403, 409 y 404 muestran el mismo mensaje | 2026-09-11-fase1-nucleo.md:1928-1975, :3075-3078; 2026-09-12-fase2-panel-rh.md:1827 |
| GET | /api/credits | auth:sanctum | AppLayout, ResumenPage y CreditosPage | — | 200 {data:{balance, transactions}} | 500 si el usuario no tiene organización; la UI oculta el saldo o muestra «—» | 2026-09-12-fase2-panel-rh.md:897-904, :1287, :1355, :1758 |
| POST | /api/credit-requests | auth:sanctum | CreditosPage | {requested_amount, note} | 201 {message}; la UI lo ignora | 422, sin mensaje | 2026-09-12-fase2-panel-rh.md:906-921, :1761-1765 |
| GET | /api/user/profile | auth:sanctum | PerfilPage | — | 200 {data: User con organization} | 401 deja «Cargando…» fijo | 2026-09-12-registro-login-crud-usuarios.md:609-612, :1717 |
| PUT | /api/user/profile | auth:sanctum | PerfilPage | {name, last_name, phone, birth_date, position} | 200 {data: User} | 422, sin catch | 2026-09-12-registro-login-crud-usuarios.md:515-521, :614-618, :1719-1724 |
| PUT | /api/user/password | auth:sanctum | PerfilPage | {current_password, password, password_confirmation} | 200 {ok} | 422; solo se muestra el de current_password | 2026-09-12-registro-login-crud-usuarios.md:545-561, :620-624, :1726-1741 |
| GET | /api/admin/credit-requests | auth:sanctum + platform_admin | AdminCreditosPage | — | 200 {data:[{id, organization, organization_balance, requested_amount, note, created_at}]} | 403 se muestra como lista vacía | 2026-09-12-fase2-panel-rh.md:1075-1087, :1972 |
| POST | /api/admin/credit-requests/{creditRequest}/approve | auth:sanctum + platform_admin | AdminCreditosPage | — | 200 {ok}; registra una transacción compra | 409, sin mensaje | 2026-09-12-fase2-panel-rh.md:1089-1096, :1975-1982 |
| POST | /api/admin/credit-requests/{creditRequest}/reject | auth:sanctum + platform_admin | AdminCreditosPage | — | 200 {ok} | 409, sin mensaje | 2026-09-12-fase2-panel-rh.md:1098-1104 |
| GET | /api/admin/users | auth:sanctum + platform_admin | AdminUsuariosPage | ?search&page | 200 {data:{total, current_page, last_page, items}} | En silencio | 2026-09-12-registro-login-crud-usuarios.md:647-665, :1817-1822 |
| GET | /api/admin/users/{user} | auth:sanctum + platform_admin | AdminUsuarioDetallePage | — | 200 {data: User con organization} | 404 deja «Cargando…» fijo | 2026-09-12-registro-login-crud-usuarios.md:667-670, :1893 |
| PATCH | /api/admin/users/{user} | auth:sanctum + platform_admin | AdminUsuarioDetallePage | {name, last_name, phone, position, role} | 200 {data: User} | 422, sin catch | 2026-09-12-registro-login-crud-usuarios.md:582-588, :672-676, :1895-1899 |
| DELETE | /api/admin/users/{user} | auth:sanctum + platform_admin | AdminUsuariosPage y AdminUsuarioDetallePage | — | 204 | 409 «No puedes eliminar tu propia cuenta.», sin catch | 2026-09-12-registro-login-crud-usuarios.md:678-683, :1824-1828, :1901-1905 |
| PUT | /api/admin/me | auth:sanctum + platform_admin | AdminPerfilPage | {email, current_password, password, password_confirmation} | 200 {ok} | 422, uno de ellos con formato no estándar; la UI muestra un mensaje genérico | 2026-09-12-registro-login-crud-usuarios.md:685-700, :1975-1985 |

### 1.7 Endpoints sin consumo en la UI

Todos los endpoints que dejan los planes tienen al menos un consumidor en la UI reconstruida. El CRUD /api/evaluations ya no existe (ver 1.9). Lo que queda sin consumo son partes de algunos endpoints y código cliente que nadie llama:

| Qué queda sin usar | Endpoint | Situación en la UI | Evidencia |
|---|---|---|---|
| Eventos focus y multidevice, y el campo payload | POST /api/evaluar/{token}/events | Solo se envía type blur, sin payload | 2026-09-11-fase1-nucleo.md:351, :1763-1769, :2810 |
| consented, position y allows_back | GET /api/evaluar/{token} | Se ignoran: al reabrir el enlace, el candidato repite la bienvenida y el consentimiento, y no hay botón «Atrás» | 2026-09-11-fase1-nucleo.md:1683-1695, :2799-2805 |
| Las pruebas de la segunda en adelante | GET /api/evaluar/{token}/pruebas/{testId} | Solo se carga tests[0] | 2026-09-11-fase1-nucleo.md:2815-2818 |
| Varias pruebas y el teléfono del candidato | POST /api/assessments (test_ids, `candidates.*.phone`) | El asistente fija test_ids [1] y no pide teléfono | 2026-09-11-fase1-nucleo.md:1398-1403, :2561, :2573-2577 |
| sector y company_size | POST /api/register | El formulario actual no los pide; se envían vacíos | 2026-09-12-registro-login-crud-usuarios.md:257-258, :1161-1165 |
| status, deadline y los contadores pendiente e iniciada | GET /api/assessments | La lista solo muestra nombre, puesto, completadas sobre total y fecha | 2026-09-12-fase2-panel-rh.md:597-610, :1420-1429 |
| organization y birth_date | GET /api/user/profile | /perfil no los muestra; birth_date se reenvía sin campo visible | 2026-09-12-registro-login-crud-usuarios.md:611, :1722, :1758-1763 |
| phone, position, birth_date, is_platform_admin y privacy_accepted_at; además el correo en el detalle | GET /api/admin/users y GET /api/admin/users/{id} | La lista no muestra puesto ni teléfono; el detalle no muestra correo, organización ni fecha de nacimiento | 2026-09-12-registro-login-crud-usuarios.md:649-670, :1837-1845, :1911-1928 |
| El `message` de la respuesta | POST /api/leads y POST /api/credit-requests | Se ignora y la UI escribe su propio texto fijo | 2026-09-10-sales-site.md:637, :2205; 2026-09-12-fase2-panel-rh.md:920, :1786 |
| getAssessment() de api/assessments.ts | GET /api/assessments/{id} | Nadie la usa; rh.ts tiene su propia versión con otro tipo | 2026-09-11-fase1-nucleo.md:2473-2476; 2026-09-12-fase2-panel-rh.md:1204-1206 |
| Tokens de API de Sanctum (personal_access_tokens) | — | No se usan; la autenticación es por sesión | 2026-09-11-fase1-nucleo.md:85 |
| Rutas de CORS sin prefijo (login, logout, register, user) | — | No existen rutas fuera de /api | 2026-09-11-fase1-nucleo.md:108, :1233 |

Huecos en sentido contrario: cosas que la spec o la UI piden y que no tienen endpoint. Ninguno se simula: se registran como pendientes de backend o se descartan por decisión del dueño.

- Ver las solicitudes de créditos propias y su estado: para RH solo existen GET /api/credits y POST /api/credit-requests (2026-09-12-fase2-panel-rh.md:927-931).
- «Últimas completadas» en el Resumen: la spec la pide (2026-09-12-fase2-panel-rh-design.md:75), pero GET /api/assessments solo devuelve conteos (2026-09-12-fase2-panel-rh.md:597-610).
- Fecha por candidato en el detalle: la spec la pide (2026-09-12-fase2-panel-rh-design.md:77), pero GET /api/assessments/{id} no la devuelve (2026-09-11-fase1-nucleo.md:1479-1485).
- Crear o editar la empresa desde /perfil: estaba prometido (2026-09-12-registro-login-crud-usuarios-design.md:50, :123), pero PUT /api/user/profile no lo acepta (2026-09-12-registro-login-crud-usuarios.md:515-521).
- Recuperar la contraseña: es un [PENDIENTE] declarado (2026-09-12-registro-login-crud-usuarios.md:2058). La verificación de correo tampoco existe (2026-09-11-fase1-nucleo-design.md:99; 2026-09-12-registro-login-crud-usuarios.md:288-318).
- Del prototipo: el pago y el checkout, las licencias por prueba con código y el envío del PDF por correo no tienen backend (2026-09-12-fase2-panel-rh-design.md:13, :110; Strata.dc.html:640, :961, :1824).

### 1.8 Reglas de negocio

**Sesión y permisos**
- La sesión es de Sanctum SPA por cookie: hay que pedir GET /sanctum/csrf-cookie antes del login y del registro, y todas las peticiones van con withCredentials y withXSRFToken (2026-09-11-fase1-nucleo.md:2028-2037, :2066-2076).
- /app exige sesión, y /admin exige `is_platform_admin` (si no, el backend responde 403). El candidato entra solo con su token (2026-09-11-fase1-nucleo.md:1806-1816, :2135-2140; 2026-09-12-fase2-panel-rh.md:1042-1056, :1895-1901).
- Cada organización solo ve lo suyo: el detalle, la comparativa, el reenvío y el reporte responden 403 si el recurso es de otra, y la lista y los créditos se filtran por la organización del usuario (2026-09-11-fase1-nucleo.md:1472, :1931; 2026-09-12-fase2-panel-rh.md:587, :633, :753, :899).
- `role` no da ni quita permisos, y todo usuario nuevo es admin (2026-09-12-registro-login-crud-usuarios.md:308, :587). No hay que inventar permisos por rol mientras el backend no los tenga.
- Sin organización no hay panel de RH: el login y el registro llevan a /perfil, y el menú oculta el enlace (2026-09-12-registro-login-crud-usuarios.md:1192, :1306, :1469). La spec dice que ese usuario no entra a /app (2026-09-12-registro-login-crud-usuarios-design.md:8).

**Registro y perfil**
- Registro. Obligatorios: name, last_name, email único, password de al menos 8 caracteres, password_confirmation igual y privacy_accepted. Opcionales: company_name, position, phone (hasta 30), birth_date anterior a hoy, sector y company_size (2026-09-12-registro-login-crud-usuarios.md:250-263).
- Si el registro trae empresa, se crea la organización y recibe `config('credits.free_signup')` créditos de cortesía: 10 en desarrollo; el valor real está [PENDIENTE]. Sin empresa no hay organización ni créditos. Siempre se guarda privacy_accepted_at (2026-09-12-registro-login-crud-usuarios.md:292-313; 2026-09-12-fase2-panel-rh.md:126-133).
- Perfil propio: name y last_name son obligatorios; phone, birth_date y position, opcionales. El correo y la empresa no se cambian desde aquí. Para cambiar la contraseña hay que dar la actual correcta y una nueva de al menos 8 caracteres, confirmada (2026-09-12-registro-login-crud-usuarios.md:515-521, :545-561).
- El login siempre recuerda la sesión. Si las credenciales no son válidas, responde 422 en el campo email (2026-09-11-fase1-nucleo.md:1193-1194).

**Sitio público, leads y catálogo**
- Leads: los 6 campos son obligatorios. sector: comercio, manufactura, servicios u otro. company_size: 1-10, 11-50, 51-250 o 250+. evaluations_per_month: `<10`, 10-50, 50-200 o 200+. Las etiquetas de UI de cada opción están en 2026-09-10-sales-site.md:2249-2301 y las reglas en :600-610.
- Catálogo: solo pruebas activas, sin licencia y distintas de la demo. Las categorías van en orden fijo (personalidad, razonamiento, integridad, intereses) y no se muestran si están vacías; las pruebas se ordenan por nombre. El detalle de una prueba no publicable responde 404 (2026-09-11-fase3-sitio-ventas.md:229-292). Los conteos salen siempre de la API (2026-09-11-fase3-sitio-ventas-design.md:96).
- item_count es un dato declarado: las 18 pruebas de marketing no tienen reactivos, y la única que se puede responder es la Prueba de demostración (2026-09-11-fase3-sitio-ventas-design.md:45).
- Los CTA de demo que funcionan van a /demo. SITE.calendarUrl solo se usa en el Hero, cuyo respaldo `#contacto` está roto, y en «Reservar tiempo →» (2026-09-10-sales-site.md:1277, :2325-2333; 2026-09-11-fase3-sitio-ventas.md:760, :1205).
- Los precios solo están en data/plans.ts y hoy dicen [PENDIENTE]. No hay compra en línea: los créditos llegan por cortesía o por una solicitud que se aprueba a mano (2026-09-11-fase3-sitio-ventas.md:381-409; 2026-09-12-fase2-panel-rh-design.md:110).

**Evaluaciones, invitaciones y créditos**
- 1 crédito = 1 candidato, y el saldo es la suma de los movimientos registrados. Si no alcanza, POST /api/assessments responde 422 «Créditos insuficientes: necesitas X, tienes Y» y no crea nada. La spec pide mostrar ese mensaje con un enlace a /app/creditos (2026-09-12-fase2-panel-rh.md:243-246, :417-422; 2026-09-12-fase2-panel-rh-design.md:93).
- Alta de evaluación: name obligatorio, position opcional, al menos una prueba existente, al menos un candidato con name y email válidos (phone opcional) y deadline opcional. Cada candidato genera un registro Candidate nuevo y una invitación con un token de 40 caracteres, el enlace {FRONTEND_URL}/evaluar/{token} y expires_at igual al deadline (2026-09-11-fase1-nucleo.md:1393-1405, :1448-1458).
- Estados de la invitación: pendiente → iniciada (al consentir) → completada (al terminar). El estado expirada solo se calcula cuando alguien abre un enlace vencido. Los estados se muestran con glifo y texto (2026-09-11-fase1-nucleo.md:311, :1677-1679, :1713-1715, :1784; 2026-09-12-fase2-panel-rh.md:1503-1505).
- El reenvío se permite salvo en invitaciones completadas (409); actualiza sent_at y no extiende expires_at. «Ver reporte» solo aparece en completadas, y el reporte responde 409 si no lo están (2026-09-12-fase2-panel-rh.md:633-638, :1549-1552; 2026-09-11-fase1-nucleo.md:1932).
- La comparativa solo incluye invitaciones completadas. Sus columnas son la unión de las escalas de todas las pruebas, se ordena por normalized y el CSV se genera en el navegador (2026-09-12-fase2-panel-rh.md:755-764, :1601-1633).
- Solicitud de créditos: una cantidad entera de 1 o más y una nota opcional. La validación admite 500 caracteres, pero la columna guarda 255. La solicitud nace pendiente y no cambia el saldo (2026-09-12-fase2-panel-rh.md:51, :908-918).

**Portal del candidato y reporte**
- El consentimiento es explícito y la casilla empieza sin marcar; se pide antes del primer reactivo (privacy_version v1). Hay una pregunta por pantalla y no se avanza sin responder. Cada respuesta se guarda al momento con elapsed_ms, y al volver se retoma en el primer reactivo sin respuesta (2026-09-11-fase1-nucleo.md:2815-2850, :2881, :2912; 2026-09-11-fase1-nucleo-design.md:89-95).
- Bloqueo: al abrir el enlace, si GET /api/evaluar/{token} devuelve status completada o expirada, o falla, se muestra la pantalla de bloqueo (2026-09-11-fase1-nucleo.md:2799-2805). En esos estados, POST consent, answers y complete responden 409 (:1797-1800), pero la UI no los convierte en bloqueo: consent y complete no capturan el error y answers lo ignora (:2826-2850).
- La integridad se trata como un dato neutro: cada vez que se oculta la pestaña se registra un blur, y el reporte solo lo cuenta, sin acusar (2026-09-11-fase1-nucleo.md:2807-2813, :3064; 2026-09-12-fase2-panel-rh-design.md:20). El candidato nunca ve sus resultados (2026-09-11-fase1-nucleo-design.md:93).
- /evaluar acepta una URL que contenga /evaluar/{token} o un token alfanumérico (2026-09-11-fase3-sitio-ventas.md:944-952). Un código con guion como el del prototipo, «9B2X-88K1» (Strata.dc.html:2017), no pasaría esa validación.
- Un mismo componente, Report, pinta el reporte real y los de ejemplo. Muestra la categoría en texto, el percentil, una barra, las preguntas sugeridas y el pie legal, que se conserva en el PDF generado con window.print (2026-09-11-fase1-nucleo-design.md:117; 2026-09-11-fase1-nucleo.md:3033-3081; 2026-09-12-fase2-panel-rh-design.md:80).
- El «percentil» no es normativo. El campo percentile es round(normalized) (2026-09-11-fase1-nucleo.md:980) y el baremo demo solo define umbrales de categoría (:792-801), aunque la spec lo llama «percentil aproximado» (2026-09-11-fase1-nucleo-design.md:78). No es un percentil contra una población: mientras no haya baremo real, «pc N» no debe acompañarse de textos que sugieran comparación con una norma.

**Super-admin**
- Créditos: solo se aprueban o rechazan solicitudes pendientes (si no, 409). Aprobar registra una transacción compra. La bandeja muestra las pendientes de todas las organizaciones, de la más antigua a la más reciente, con el saldo de cada una (2026-09-12-fase2-panel-rh.md:1075-1104).
- Usuarios: se buscan por nombre, apellido o correo, con 15 por página y los más recientes primero. Se pueden editar name, last_name, phone, position y role, pero no el correo, la organización ni `is_platform_admin`. Nadie puede borrarse a sí mismo (409), y el borrado es definitivo (2026-09-12-registro-login-crud-usuarios.md:582-588, :647-683).
- En /admin/me el correo no puede estar en uso por otro usuario, y siempre hay que cambiar la contraseña dando la actual (2026-09-12-registro-login-crud-usuarios.md:685-700).

**Contenido y accesibilidad heredados**
- No se inventan cifras, testimonios ni precios; lo que falta se muestra como [PENDIENTE]. No se prometen cosas como «sin sesgos» o «predice el desempeño», ni se nombran pruebas comerciales (2026-09-11-fase3-sitio-ventas-design.md:18-20).
- Hay un `:focus-visible` global y una regla global para prefers-reduced-motion (2026-09-10-sales-site.md:373-380, :403-407); varios campos sustituyen el contorno por un cambio de color del borde (2026-09-12-registro-login-crud-usuarios.md:812-815). Los botones del candidato miden al menos 44px (2026-09-11-fase1-nucleo-design.md:86; 2026-09-11-fase1-nucleo.md:2763).
- design-tokens.md:34 y la spec del panel (2026-09-12-fase2-panel-rh-design.md:19) exigen ícono y texto en éxito y error. Hoy solo lo cumplen los errores por campo de ContactSection (⚠, 2026-09-10-sales-site.md:2232) y los estados de invitación (2026-09-12-fase2-panel-rh.md:1503-1505). Los demás avisos son solo texto con color: Login, Registro, FloatingInput, Perfil, Créditos, AdminPerfil, EvaluarLanding, NuevaEvaluacion, ReporteCandidato y el éxito de leads (2026-09-12-registro-login-crud-usuarios.md:887, :1216, :1323, :1765, :1774, :1994, :1996; 2026-09-12-fase2-panel-rh.md:1786, :1830; 2026-09-11-fase3-sitio-ventas.md:981; 2026-09-11-fase1-nucleo.md:2663; 2026-09-10-sales-site.md:2203-2206). Es una regla por cumplir, no un comportamiento heredado.
- design-tokens.md:30 prohíbe el sage como color de texto (2.3:1 sobre blanco), pero Report lo usa para la categoría «bajo» (2026-09-11-fase1-nucleo.md:3027-3031, :3054).

### 1.9 Eliminado

Para no resucitarlo:

- El CRUD /api/evaluations (index, store, show, update y destroy), el modelo Evaluation y su tabla: se crearon en 2026-09-10-evaluation-module.md:117-124 y se borraron en 2026-09-11-fase1-nucleo.md:27-66. Nunca tuvieron pantalla ni cliente.
- La primera versión de `src/api/axios.ts`, con Content-Type y sin credenciales (2026-09-10-evaluation-module.md:636-648). La reemplaza 2026-09-11-fase1-nucleo.md:2023-2040.
- La página única sin router y su navegación por anclas #inicio, #catalogo, #como-funciona y #contacto (2026-09-10-sales-site.md:7, :1021-1025, :2343-2376). La sustituyen rutas reales (2026-09-10-multipage-site.md:1381-1405; 2026-09-11-fase3-sitio-ventas.md:1229-1281); las anclas del Hero siguen ahí, rotas.
- Las rutas /test, /psicometria y /nosotros, con sus páginas (2026-09-10-multipage-site.md:1397-1399). Se borran en 2026-09-11-fase3-sitio-ventas.md:1287.
- Las secciones Catalog, PackagesSection, TestInventory, Testimonials y CompanyInfo, con sus .css (2026-09-11-fase3-sitio-ventas.md:1288).
- Los datos fijos de `data/catalog.ts` (CATEGORIES, los ids p1..in5, totalTests y getTestById), `data/packages.ts` y `data/company.ts` (2026-09-11-fase3-sitio-ventas.md:1289). El catálogo pasa a la API, y los paquetes quedan fuera hasta que el psicólogo los defina (2026-09-11-fase3-sitio-ventas-design.md:13).
- El SampleReport fijo con DISC y razonamiento (2026-09-10-sales-site.md:1299-1589). Lo reemplaza Report con datos de muestra (2026-09-11-fase1-nucleo.md:3111-3153).
- ContactSection en la Home (2026-09-10-multipage-site.md:1210, :1226). Pasa a /demo (2026-09-11-fase3-sitio-ventas.md:697-710).
- El menú Inicio · Test · Psicometría · Nosotros y el CTA a `/#contacto` (2026-09-10-multipage-site.md:237-280). Lo reemplaza Pruebas · Cómo funciona · Precios · Ayuda (2026-09-11-fase3-sitio-ventas.md:1022-1027).
- El CTA «Agenda una demo» del Header, en escritorio y en móvil (2026-09-11-fase3-sitio-ventas.md:1056-1058, :1078). Lo reemplazan Entrar y Crear cuenta, o el UserDropdown (2026-09-12-registro-login-crud-usuarios.md:1532-1568). Sigue existiendo en la Home, en Precios y en /demo.
- El registro en 3 pasos, con las listas Sector y Tamaño y el texto sobre el correo de verificación, y su Auth.css (2026-09-11-fase1-nucleo.md:2167-2204, :2262-2378). Los reemplazan el formulario único y un Auth.css nuevo (2026-09-12-registro-login-crud-usuarios.md:1013-1275).
- El Login que siempre llevaba a /app/evaluaciones/nueva (2026-09-11-fase1-nucleo.md:2206-2260). Ahora lleva a /app o a /perfil (2026-09-12-registro-login-crud-usuarios.md:1306).
- El AppLayout sin navegación (2026-09-11-fase1-nucleo.md:2496-2526) y el ReporteCandidato sin PDF (:3086-3108). Los reemplazan 2026-09-12-fase2-panel-rh.md:1273-1313 y :1813-1842.
- Los enlaces `href='#'` del Footer (2026-09-10-sales-site.md:1159-1160). Ahora apuntan a las rutas legales (2026-09-11-fase3-sitio-ventas.md:1116-1122).
- Archivos anunciados que nunca se crearon: EvaluacionDetalle.tsx, cuyo papel cumple EvaluacionDetallePage, y CandidateLayout.tsx con un archivo por paso, cuyo papel cumple CandidateFlow (2026-09-11-fase1-nucleo.md:23, :2439, :2713; 2026-09-12-fase2-panel-rh.md:1472).
- Código que quedó sin uso pero no se borró; no hay que revivirlo sin decidirlo antes:
  - Trust.tsx y Trust.css (2026-09-10-sales-site.md:1890-2002), fuera de la Home desde 2026-09-10-multipage-site.md:1205-1229.
  - La regla `.header__cta` (2026-09-11-fase3-sitio-ventas.md:1108).
  - demoTo y demoHref (2026-09-12-registro-login-crud-usuarios.md:1511-1512).
  - getAssessment() de assessments.ts (2026-09-11-fase1-nucleo.md:2473-2476).
  - `.resumen__list` y `.resumen__row` (2026-09-12-fase2-panel-rh.md:1338-1339).
  - `.cand__nav` (2026-09-11-fase1-nucleo.md:2768).
  - SITE.apiBase y SITE.domain (2026-09-10-sales-site.md:171, :175).
- Contratos de backend que ya no rigen: company_name era obligatorio en el registro (2026-09-11-fase1-nucleo.md:1117) y ahora es opcional (2026-09-12-registro-login-crud-usuarios.md:256). Las credenciales del operador estaban escritas en el código (2026-09-12-fase2-panel-rh.md:1136-1146) y ahora salen de ADMIN_EMAIL y ADMIN_PASSWORD (2026-09-12-registro-login-crud-usuarios.md:93-104).

### 1.10 Riesgos

1. **No hay código real.** Los gitlinks no tienen `.gitmodules`, y evaluation-module hace `git init` dentro de frontend y backend (2026-09-10-evaluation-module.md:611, :663), que es el origen probable de los repos embebidos. Todo esto hay que verificarlo contra el repo real antes de la Fase 1 del rediseño (ver «Bloqueo»).
2. **Orden de los planes.** El orden indicado para esta auditoría pone evaluation-module después de sales-site y multipage, pero sales-site ya cuenta con su CRUD y con su cliente HTTP (2026-09-10-sales-site.md:649-653, :663, :2134; 2026-09-10-evaluation-module.md:634). Aquí se usa el orden: evaluation-module → sales-site → multipage → fase1 → fase3 → fase2 → registro-login.
3. **El código del último plan no compila tal cual**, así que el repo real tiene que ser distinto. PerfilPage usa profile.phone, birth_date y position, que el tipo de getProfile no declara (2026-09-12-registro-login-crud-usuarios.md:987-995, :1632, :1722, :1761-1762). Header declara demoTo y demoHref y no los usa (:1511-1512): con noUnusedLocals, que la plantilla react-ts de Vite trae activo (conocimiento externo), el typecheck falla. Aun así, el plan espera un build limpio (:2027).
4. **Hay al menos una desviación comprobada entre plan y código.** Fase 1 borra app/Http/Resources/EvaluationResource.php, que ningún plan crea (2026-09-11-fase1-nucleo.md:30, :37). La migración 2026_09_10_202952 que borra en el mismo paso no es una desviación: es el archivo que evaluation-module anunció como 2026_09_10_XXXXXX_create_evaluations_table.php (2026-09-10-evaluation-module.md:172). Puede haber más cambios hechos fuera de los planes.
5. **Marca.** SITE.name empieza como «Mezquit» (2026-09-10-sales-site.md:170) y fase3 asume «Mez» sin que ningún plan lo cambie (2026-09-11-fase3-sitio-ventas.md:13; 2026-09-11-fase3-sitio-ventas-design.md:10). «Mez» aparece escrito a mano en AppLayout, AdminLayout, los datos de ejemplo y Ayuda (2026-09-12-fase2-panel-rh.md:1296, :1939; 2026-09-11-fase1-nucleo.md:3124; 2026-09-11-fase3-sitio-ventas.md:586, :838). El title de index.html sigue con «Mezquit» (2026-09-10-sales-site.md:445) y el logo sale de mezquite.png (:77). El rediseño se llama STRATA (PROMPT_CLAUDE_CODE.md:1).
6. **Un archivo que no crea ningún plan.** Ningún plan crea HomePage.css, pero fase3 le agrega estilos y usa `.home-cta` y `.home-cta--tinted` sin definirlas (2026-09-11-fase3-sitio-ventas.md:1169, :1182, :1214).
7. **Archivos anunciados que no coinciden con las tareas.** multipage anuncia cambios en Footer y Hero que no hace (2026-09-10-multipage-site.md:25, :41, :1409-1411). Fase 1 anuncia EvaluacionDetalle y CandidateLayout y no los implementa (2026-09-11-fase1-nucleo.md:23, :2439). Pudieron crearse fuera del plan.
8. **No se conocen los scripts ni la configuración.** Ningún plan muestra package.json, tsconfig ni ESLint, y el commit de sales-site no incluye package.json (2026-09-10-sales-site.md:2391). Si el proyecto salió de la plantilla react-ts de create-vite (no está documentado), `build` sería `tsc -b && vite build` y habría un script `lint` con eslint (conocimiento externo); en ese caso, `npx tsc --noEmit` en la raíz no revisa nada. El brief exige build, lint y tests en verde en cada fase (PROMPT_CLAUDE_CODE.md:181) y no hay tests de frontend: hay que acordar con el dueño qué cuenta como tests.
9. **Versión de axios sin documentar.** `withXSRFToken` (2026-09-11-fase1-nucleo.md:2031) requiere axios 1.6.2 o superior (conocimiento externo).
10. **CSRF frágil en /demo (inferencia).** ContactSection nunca llama a csrf() (2026-09-10-sales-site.md:2174) y DemoPage no hace ninguna petición GET propia (2026-09-11-fase3-sitio-ventas.md:697-711). Con statefulApi (2026-09-11-fase1-nucleo.md:120), su POST /api/leads depende de que otra petición, en la práctica el GET /api/user del AuthProvider global, haya dejado antes la cookie XSRF-TOKEN (:2112-2114, :2392-2400). Si el rediseño saca /demo del AuthProvider, aparecerán errores 419 que hoy la UI no muestra. CandidateFlow no tiene ese problema: siempre hace GET /api/evaluar/{token}, y luego GET …/pruebas/{testId}, antes de su primer POST (:2799-2805, :2815-2831). Recomendación: llamar a csrf() antes de los POST públicos.
11. **Puerto de desarrollo.** sales-site espera el 5174 (2026-09-10-sales-site.md:2385), pero Sanctum y CORS solo admiten el 5173 (2026-09-11-fase1-nucleo.md:92-94, :110).
12. **Usuarios sin organización en /app.** Un usuario sin organización (2026-09-12-registro-login-crud-usuarios.md:292-307) puede abrir /app, porque RequireAuth solo revisa la sesión. Ahí, GET /api/credits llama a un método sobre una organización nula y POST /api/assessments se la pasa a CreditService::balance(), que exige una Organization: los dos responden 500. POST /api/credit-requests intenta guardar organization_id nulo en una columna que no lo admite (2026-09-12-fase2-panel-rh.md:49, :243, :412-422, :899-903, :913-918). Agregar una guarda de organización cambia el comportamiento de una ruta, así que hay que proponerla antes (PROMPT_CLAUDE_CODE.md:40).
13. **/perfil sin guarda.** Un visitante sin sesión ve «Cargando…» para siempre (2026-09-12-registro-login-crud-usuarios.md:1717, :1743, :2013).
14. **Prueba fija.** El asistente siempre envía test_ids [1] (2026-09-11-fase1-nucleo.md:2561), y que ese id sea la demo depende del orden de los seeders (2026-09-11-fase3-sitio-ventas.md:103-106). Las 18 pruebas del catálogo no tienen reactivos (2026-09-11-fase3-sitio-ventas-design.md:45) y CandidateFlow solo responde la primera prueba (2026-09-11-fase1-nucleo.md:2816). Dejar elegir pruebas, como hace el prototipo, rompería el flujo mientras el backend no lo soporte.
15. **Créditos.** El 422 por saldo insuficiente llega sin la clave errors (2026-09-12-fase2-panel-rh.md:421) y el asistente lo muestra como un error genérico (2026-09-11-fase1-nucleo.md:2591-2593). Si dos peticiones compiten, la respuesta puede ser un 500, porque InsufficientCreditsException no está mapeada (2026-09-12-fase2-panel-rh.md:259-264, :453); la spec pedía un 422 (2026-09-12-fase2-panel-rh-design.md:46).
16. **Contratos frágiles.** PUT /api/admin/me responde un 422 con el JSON serializado dentro de message y sin errors (2026-09-12-registro-login-crud-usuarios.md:694-696). Un usuario con last_name nulo recibe un 422 al guardar su perfil o cuando un admin lo edita (:517, :584, :1722, :1897). credit_requests.note admite 255 caracteres en la base de datos, pero la validación deja pasar 500 (2026-09-12-fase2-panel-rh.md:51, :910).
17. **Expiración.** El estado expirada solo se calcula cuando alguien abre GET /api/evaluar/{token} (2026-09-11-fase1-nucleo.md:1677-1679), así que RH puede ver invitaciones vencidas como pendientes o iniciadas. Además, «Evaluaciones activas» se calcula en el navegador (2026-09-12-fase2-panel-rh.md:1359).
18. **Partes de la spec que el plan no cubre**, y que el código real pudo resolver o no:
    - La verificación de correo (2026-09-11-fase1-nucleo-design.md:99).
    - Los datos mínimos, los 2 reactivos de práctica y el botón «Atrás» del candidato (2026-09-11-fase1-nucleo-design.md:90-92).
    - La bandera multidispositivo, por user_agent distinto en el mismo token (2026-09-11-fase1-nucleo-design.md:95): el cliente solo envía blur (2026-09-11-fase1-nucleo.md:2810).
    - El «Resumen» prueba × resultado global del reporte (2026-09-11-fase1-nucleo-design.md:111): Report no lo tiene (2026-09-11-fase1-nucleo.md:3033-3081).
    - Las últimas completadas y la fecha en el detalle (2026-09-12-fase2-panel-rh-design.md:75, :77).
    - El botón para reintentar la carga del catálogo (2026-09-11-fase3-sitio-ventas-design.md:87).
    - «¿Olvidaste tu contraseña?», la empresa en /perfil y la validación inmediata de la confirmación de contraseña (2026-09-12-registro-login-crud-usuarios-design.md:50, :101, :123, :155).
    - El logo de la tarjeta de auth enlazado a / (2026-09-12-registro-login-crud-usuarios-design.md:93): en el plan no es un enlace (2026-09-12-registro-login-crud-usuarios.md:1210-1213).
    - La columna «Puesto» de /admin/usuarios (2026-09-12-registro-login-crud-usuarios-design.md:133): el plan muestra «Rol» en su lugar (2026-09-12-registro-login-crud-usuarios.md:1837).
19. **Dependencias en el CSS global.** Al cambiar estilos se rompen estas dependencias:
    - AdminLayout usa `.applayout__logout`, definida en AppLayout.css (2026-09-12-fase2-panel-rh.md:1940).
    - El spinner `.btn--loading::before` vive en Auth.css, pero afecta a todos los botones con loading (2026-09-12-registro-login-crud-usuarios.md:1119-1129).
    - Al imprimir, el CSS oculta `.header`, `.applayout__bar` y `.footer` por nombre de clase (2026-09-12-fase2-panel-rh.md:1849).
    - `body` deja un margen superior de 64px en todas las rutas (2026-09-10-sales-site.md:389).
20. **Navegación entre zonas.** «Panel de RH» está en el UserDropdown y en el panel móvil; «Operación» solo en el UserDropdown, que se oculta por debajo de 768 px (2026-09-12-registro-login-crud-usuarios.md:1469-1474, :1561, :1596). AppLayout no enlaza a /admin, y AdminLayout no tiene navegación ni página de inicio (2026-09-12-fase2-panel-rh.md:1294-1306, :1936-1944, :2027-2029). Por eso el operador que entra por /login llega a /app y no ve ningún camino a /admin, y en móvil nadie puede cerrar sesión desde el sitio público.
21. **Comportamientos rotos que no hay que copiar.**
    - Las anclas `#contacto` y `#catalogo` del Hero (2026-09-10-sales-site.md:1277, :1282) ya no existen en la Home.
    - «¿Problemas con la prueba?» no lleva a ningún lado (2026-09-11-fase1-nucleo.md:2869).
    - El consentimiento menciona el aviso de privacidad, pero no lo enlaza (:2876).
    - HowItWorks promete el reporte «en tu correo», y ningún plan envía reportes por correo (2026-09-10-sales-site.md:1861).
22. **Sesión vencida.** AuthProvider solo pide GET /api/user al montar la app y ningún cliente tiene interceptores (2026-09-11-fase1-nucleo.md:2028-2033, :2112-2114). Si la sesión vence o se cierra en otra pestaña, `user` sigue lleno y las llamadas devuelven 401: el detalle de evaluación, la comparativa y el perfil se quedan en «Cargando…», y las listas se muestran vacías (2026-09-12-fase2-panel-rh.md:1407, :1513, :1524; 2026-09-12-registro-login-crud-usuarios.md:1717, :1743). Ese estado hay que diseñarlo.

## 2. Prototipo (Strata.dc.html)

**Fuente.** `Plataforma Strata de evaluaciones psicométricas/Strata.dc.html` (2,234 líneas). El markup va de `<x-dc>` a `</x-dc>` (Strata.dc.html:9-1438). La lógica está en `class Component extends DCLogic` (Strata.dc.html:1440-1775) y en `renderVals()` (Strata.dc.html:1776-2230). `state.pantalla` decide qué pantalla se ve (Strata.dc.html:1507-1508, 2011-2015), y todos los datos del `state` son ficticios (PROMPT_CLAUDE_CODE.md:20). Los puntos dudosos se comprobaron contra el archivo y están en «Comprobaciones puntuales». Los tokens de diseño están en la sección 3.

**Dos rasgos del runtime que afectan al port.** `support.js` no se porta (PROMPT_CLAUDE_CODE.md:10), pero explica dos comportamientos del prototipo:

- `style-hover`, `style-focus` y `style-active` se compilan como reglas `:hover`, `:focus` y `:active` con `!important` (support.js:417-429, 1542-1583). Por eso, en el prototipo, el hover gana a las animaciones con `fill-mode: both`. Con CSS normal pasa lo contrario.
- El atributo `style` se convierte en un objeto de estilo inline (support.js:803). Si una propiedad aparece dos veces, se queda el último valor.

**Comprobaciones puntuales**

| Tema | Duda | Resolución y evidencia |
|---|---|---|
| Centrado del toast | El estilo inline lo centra con `translateX(-50%)`; ¿se ve centrado? | `animation` aparece dos veces y gana `fadeUp .2s ease both` (Strata.dc.html:1421; support.js:803). `fadeUp` termina en `transform: translateY(0)` (Strata.dc.html:28) y, con fill `both`, pisa el `translateX(-50%)` inline: una animación gana a cualquier declaración normal. Lo más probable es que el borde izquierdo del toast quede en el 50 %. Falta verlo en el navegador. En el port, centrarlo sin depender de `transform`. |
| Transición de los enlaces de la topbar | ¿Usan la transición global de .18s? | No. Los enlaces son `<div>` (Strata.dc.html:61-64, 76-78) y la regla global solo cubre `button, a, input, td, th` (Strata.dc.html:41). El cambio es instantáneo. |
| «Total» de las tarjetas de saldo | ¿Sale del saldo actual o del inicial? | `total = t.stock + 18` usa el stock semilla y `libres = stockDe()` el saldo actual (Strata.dc.html:1862-1863). |
| Visibilidad de los halos | ¿Se ven en todas las pantallas? | La home tiene fondo opaco y halos propios (Strata.dc.html:96-99). Las demás pantallas no tienen fondo y dejan ver los halos fijos (Strata.dc.html:47-51, 332, 605, 683, 774, 874, 996, 1140, 1200). |
| Clic sobre la mascota | ¿Se puede tocar en cualquier punto de su recorrido? | No. La imagen tiene z-index 1 (Strata.dc.html:101) y el contenedor de contenido z-index 2 (Strata.dc.html:108), dentro del mismo `<main>` (Strata.dc.html:92). La mascota se pinta debajo del contenido y «Tócame» solo recibe clics fuera de la columna de 1200 px. Falta verlo en el navegador. |
| Keyframes sin uso | ¿Sobra alguno de los 14? | No. Se usan los 14 (Strata.dc.html:27-40; usos en «Animaciones y movimiento»). |
| Hover de tarjetas animadas | ¿Funciona el `translateY(-2px)` de la tarjeta del catálogo? | En el prototipo sí, gracias al `!important` del runtime. `riseIn ... both` también fija `transform` (Strata.dc.html:630), así que con CSS normal anularía el hover. |

### Pantallas por rol

En ninguna pantalla hay estados de carga ni de error. El único estado vacío diseñado es el del carrito (Strata.dc.html:1263-1268), aunque el brief exige los tres (PROMPT_CLAUDE_CODE.md:187). Todos los avisos y errores salen por toast (Strata.dc.html:1544-1548).

| Rol | Pantalla (condición) | Líneas | Propósito | Estados de UI |
|---|---|---|---|---|
| Todos | Lienzo raíz y halos globales (siempre) | Strata.dc.html:45-51, 92, 1245 | Contenedor #FAF8F5 de 100vh con tres halos radiales fijos (coral .2, celeste .2, navy .1). Equivale al PageLayout del brief (PROMPT_CLAUDE_CODE.md:88, 117). | Sin estados. Los tres halos derivan en fase con `glowDrift` 18s (Strata.dc.html:48-50). |
| Empresa / RR. HH. | TopBar de empresa (`conShell && esEmpresa`) | Strata.dc.html:52-73, 88-90 | Logo que vuelve al inicio; nav Tests · Mis licencias · Candidatos · Resultados; saldo «{n} licencias»; pastilla con iniciales y nombre de la empresa. | Enlace activo según `pantalla`: #0F172A/600 con subrayado coral de 2px; inactivo #6B6558/500 (Strata.dc.html:1770-1774, 2073, 2077). Hover sin transición. Saldo = suma del stock por test, 48 al inicio (Strata.dc.html:1781). Pastilla → aviso «fuera del alcance» (Strata.dc.html:68). |
| Super admin | TopBar de admin (`conShell && esAdmin`) | Strata.dc.html:52-58, 74-90 | Nav Test Builder · Reactivos · Algoritmos; contador fijo «14 tests publicados»; pastilla «LO · Dr. Luis Ordóñez». | Activo según `builderTab` 1-3 (Strata.dc.html:2074-2076). Pastilla → aviso «fuera del alcance» (Strata.dc.html:82, 2078). |
| Empresa y Super admin | Footer del shell (`conShell`) | Strata.dc.html:1230-1243 | Marca STRATA, lema, «Aviso de privacidad» y «Soporte» (ambos href="#") y «© 2026». | Sin estados: el color inline de los enlaces anula el `a:hover` global (Strata.dc.html:24, 1238-1239). No aparece en home, acceso, examen ni fin (Strata.dc.html:2011), aunque el brief lo pide en todas las pantallas internas (PROMPT_CLAUDE_CODE.md:99). |
| Visitante | Home · contenedor (`esHome`, pantalla inicial) | Strata.dc.html:94-108, 326-328 | Landing B2C/B2B sin topbar ni selector de rol, con fondo opaco y halos propios más intensos (.26/.24/.12). | Estado `homeModo` ('mi' o 'empresa'), `demoOpcion`, `salaN` y `salaVisible` (Strata.dc.html:1509). Contenido estático: sin carga, vacío ni error. |
| Visitante | Home · header público (no sticky) | Strata.dc.html:110-125 | Marca no clicable; nav Tests · Para empresas · Cómo funciona · Precios; «Tengo un código»; botón tinta «Comprar un test». | La nav no tiene estado activo y sus cuatro ítems muestran el aviso «fuera del alcance» (Strata.dc.html:116-119). Hover del botón: navy y −1px (Strata.dc.html:123). |
| Visitante | Home · hero con selector «Para mí (Sin registro)» / «Para mi Empresa (B2B)» | Strata.dc.html:127-166 | Eyebrow en pastilla, H1 de 52px, selector segmentado, entradilla, CTA coral con precio, enlace secundario y fila de confianza. | El modo mueve el thumb (Strata.dc.html:2018) y cambia la entradilla, el CTA (texto y precio: «$15 USD» o «desde $24 USD», Strata.dc.html:2037) y el enlace secundario (Strata.dc.html:2034-2042). No cambian el eyebrow, el H1, la acción del CTA ni los precios de las tarjetas del catálogo exprés (Strata.dc.html:131, 134, 2038, 2058-2060). |
| Visitante | Home · demo de examen en vivo | Strata.dc.html:168-225 | Tarjeta de pregunta flotante con 3 opciones y badges «Diagnóstico enviado» y «Perfil en vivo» (radar animado). | Opción seleccionada (borde #38BDF8, aro #0EA5E9 con check) o no; empieza marcada la segunda (Strata.dc.html:1509, 2047-2055). Contador y progreso fijos (Strata.dc.html:171, 178). |
| Visitante | Home · Catálogo exprés | Strata.dc.html:228-261 | Tres tarjetas de vidrio con tag, duración, reactivos, precio, «Previsualizar test» y «Comprar en 1 clic». | Hover: la tarjeta sube 5px y los botones tienen micro-hover (Strata.dc.html:239, 255-256). Lista fija `homeTests`, sin entrada escalonada (Strata.dc.html:2057-2060). |
| Visitante | Home · Cómo funciona | Strata.dc.html:263-310 | H2, insignia «Sin crear cuenta. Cero fricción.» y tres pasos con conector discontinuo. | Hover: el paso sube 4px y gana sombra (Strata.dc.html:273). |
| Visitante | Home · footer | Strata.dc.html:312-324 | Marca, lema, enlaces legales y «Acceso interno». | «Acceso interno» lleva al builder (Strata.dc.html:321, 2070). |
| Visitante | Home · mascota y burbuja | Strata.dc.html:101-106 | Salamandra animada con GSAP que nada por el borde del viewport (ver «Mascota»). | Oculta 6 s; luego entra, nada, corre o brinca. Opacidad .8, o .26 cerca del H1. Burbuja visible 5,4 s (Strata.dc.html:1625-1755, 2022-2027). |
| Super admin | Test Builder · encabezado y pasos (`esBuilder`) | Strata.dc.html:330-358, 600-601 | Eyebrow con pastilla «Borrador · v0.4», H1 de 46px, entradilla, «Guardar borrador», «Publicar al catálogo» y tres pastillas de paso. | Paso activo: fondo blanco, borde y número #0EA5E9 (Strata.dc.html:1896-1904). Se puede saltar entre pasos libremente. Guardar y publicar solo muestran un toast (Strata.dc.html:2167-2168). H1, entradilla y versión fijos (Strata.dc.html:337-340). |
| Super admin | Paso 1 · Datos generales (`builder1`) | Strata.dc.html:360-437 | Nombre, categoría, precio por licencia, n.º de reactivos, duración y descripción; dimensiones; vista previa en catálogo. | Categoría con `chipSky` (Strata.dc.html:1762-1764). Precio y reactivos solo admiten dígitos (Strata.dc.html:2141, 2143). Duración y descripción no tienen estado (Strata.dc.html:395, 400). Sin foco visible ni errores. La lista de dimensiones puede quedar vacía. |
| Super admin | Paso 2 · Diseñador de reactivos (`builder2`) | Strata.dc.html:439-526 | Lista de reactivos, editor (enunciado, tipo, dimensión y peso) y vista previa del candidato. | Fila seleccionada en #F5FCFF con marca #0EA5E9 (Strata.dc.html:1915-1921). Tipo con `radio()` y dimensión con `chipSky`. Peso entre 0.1 y 3.0 (Strata.dc.html:2150-2151). La vista previa cambia con el tipo (Strata.dc.html:1929-1933). No se puede borrar ni reordenar. |
| Super admin | Paso 3 · Algoritmo de diagnóstico (`builder3`) | Strata.dc.html:528-599 | Rangos de puntaje con etiqueta y texto de reporte, editor de la regla, variables y simulador. | Rango seleccionado en #F5FCFF y color de texto ajustado por contraste (Strata.dc.html:1940). El simulador sube o baja de 4 en 4 entre 0 y 100; si ningún rango contiene el puntaje, usa el último (Strata.dc.html:1948, 2164-2166). No valida min ≤ max ni solapes. |
| Empresa / RR. HH. | Tests · Catálogo (`esCatalogo`) | Strata.dc.html:603-679 | PageHeader «Paso 1 de 3», botón «Carrito · N», filtro por categoría y tarjetas con saldo, precio, descuento, stepper y CTA. | Filtro activo con `chip()` (Strata.dc.html:1757-1761). Cantidad mínima 1, sin máximo (Strata.dc.html:1804-1805). Saldo 0 sin estilo propio (Strata.dc.html:1447). Entrada `riseIn` escalonada de 55 ms (Strata.dc.html:630, 1802). Sin estado vacío por filtro. |
| Empresa / RR. HH. | Mis licencias · Inventario (`esInventario`) | Strata.dc.html:681-770 | PageHeader «Paso 2 de 3», CTA «Generar enlace / código», cuatro tarjetas de resumen y tabla «Códigos emitidos» con filtros. | Badges Disponible, Enviada, En uso y Consumida (Strata.dc.html:1831-1836). Acción Enviar, Reenviar o Ver reporte (Strata.dc.html:1847). No hay filtro «En uso» (Strata.dc.html:1838). Filas con `rowIn` cada 28 ms. Sin estado vacío por filtro. |
| Empresa / RR. HH. | Candidatos · Panel (`esPanel`) | Strata.dc.html:772-870 | PageHeader «Paso 3 de 3», «Asignar por email», «Generar enlace / código de invitación», cuatro tarjetas de saldo y tabla de candidatos con filtros y paginación. | Badges Completado, En proceso y Código enviado (Strata.dc.html:1866-1870). Solo Completado lleva acción destacada (Strata.dc.html:1880-1882). Padding vertical de celda de 14 o 9 px según `densidadTabla` (Strata.dc.html:836-853, 2101). «Anterior» con cursor not-allowed y «Siguiente» sin handler (Strata.dc.html:864-865). Sin estado vacío por filtro. |
| Empresa / RR. HH. | Resultados · Diagnóstico (`esResultados`) | Strata.dc.html:872-992 | Banner de estado, radar de 6 dimensiones, puntuaciones con interpretación, envío automático del PDF, «Descargar diagnóstico (PDF)» y «Ver respuestas». | Dimensión seleccionada en #F5FCFF, la segunda por defecto (Strata.dc.html:1517, 1961). Color según el puntaje: ≥80, ≥70 o <70 (Strata.dc.html:1959-1960). Interruptores on/off con un mensaje según el número de destinatarios (Strata.dc.html:1973-1974, 2225-2226). Radar e índice 76 estáticos (Strata.dc.html:900, 929). No tiene PageHeader ni H1. |
| Candidato | Acceso · marco (`esAcceso`) | Strata.dc.html:994-1011, 1122-1136 | Sin topbar ni pie: fila de marca (inicial y nombre de la empresa, «Powered by STRATA»), tarjeta blanca y enlaces inferiores. | Muestra el paso 1 o el 2 según `accesoPaso` (Strata.dc.html:2170). Sin selector de rol (Strata.dc.html:2008). Inicial «A» fija (Strata.dc.html:1001). |
| Candidato | Acceso · paso 2: licencia verificada y datos (`accesoPaso2`, inicial) | Strata.dc.html:1013-1105, 1125-1128 | Cabecera oscura #0F172A (la superficie oscura, no el navy) con la insignia «Licencia verificada: CÓDIGO», invitación de la empresa, nombre y correo con validación en vivo, consentimiento, «Iniciar Evaluación» y franja con 3 garantías. | Input neutro, con foco o válido (Strata.dc.html:1044, 1059, 2184-2185). Contador «n de 2 datos confirmados» o «Todo listo para comenzar» (Strata.dc.html:2186-2187). Consentimiento marcado por defecto (Strata.dc.html:1522, 2188-2191). No hay estado de error, y el CTA solo exige el consentimiento (Strata.dc.html:2193-2196). |
| Candidato | Acceso · paso 1: código manual (`accesoPaso1`) | Strata.dc.html:1107-1120 | Input mono grande para el código, «Validar código» y «Tengo un enlace de invitación». | Validación local: con menos de 6 caracteres alfanuméricos muestra un toast; si no, pasa al paso 2 (Strata.dc.html:2173-2178). Solo se llega desde el paso 2 (Strata.dc.html:1126, 2180). |
| Candidato | Examen en modo foco (`esExamen`) | Strata.dc.html:1138-1196 | Barra sticky translúcida (logo, test, candidato · empresa, reloj, «Guardado automático», progreso) y una pregunta Likert por vista. | Opción con `radio()` (Strata.dc.html:1952). El botón dice «Siguiente pregunta» o «Finalizar examen» (Strata.dc.html:2205). Sin respuesta, muestra un toast; el botón nunca se deshabilita (Strata.dc.html:2207). «Anterior» siempre visible (Strata.dc.html:1186). Reloj opcional (Strata.dc.html:1148, 2200). Indicador de guardado estático. Se ve el selector de rol (Strata.dc.html:2008). |
| Candidato | Fin (`esFin`) | Strata.dc.html:1198-1228 | Ícono de éxito, «¡Examen completado con éxito!», resumen en 3 tarjetas, aviso de código consumido, «Cerrar ventana» y «Conocer Strata». | Un solo estado, el de éxito. «Reactivos respondidos» se calcula con el total de preguntas, no con las respuestas (Strata.dc.html:2216). |
| Empresa / RR. HH. | Drawer de checkout (`checkoutAbierto`) | Strata.dc.html:1247-1321 | Ver «Modales y overlays». | Vacío o con líneas; método seleccionado; error por toast. |
| Empresa / RR. HH. | Modal «Enlace de invitación generado» (`invitacionAbierta`) | Strata.dc.html:1323-1374 | Ver «Modales y overlays». | Test seleccionado; sin validación. |
| Empresa / RR. HH. | Modal «Asignar test por email» (`asignarAbierto`) | Strata.dc.html:1376-1418 | Ver «Modales y overlays». | Modo y test seleccionados; sin validación. |
| Todos | Toast (`hayToast`) | Strata.dc.html:1420-1425 | Ver «Modales y overlays». | Visible 2600 ms. |
| Solo prototipo | Selector de rol (`sinOverlay`) | Strata.dc.html:1427-1435 | Cambiar de rol y de pantalla en la demo. | Oculto en home, acceso y con overlays abiertos (Strata.dc.html:2008). |

### Flujos

El prototipo no tiene URLs: la pantalla depende de `state.pantalla` y el rol lo fijan los propios handlers (Strata.dc.html:1507-1508, 2016-2072). En el port mandan las rutas del repo y el rol de la sesión (PROMPT_CLAUDE_CODE.md:21, 40).

1. **Navegación del shell.** El logo llama a `irHome`, que pone la pantalla 'home' y el rol 'visitante' (Strata.dc.html:55, 2016). Empresa: Tests → `irCatalogo`, Mis licencias → `irInventario`, Candidatos → `irPanel` y Resultados → `irResultados` (Strata.dc.html:61-64, 2065-2069); el saldo también lleva a Tests (Strata.dc.html:67). Admin: Test Builder, Reactivos y Algoritmos abren el builder con `builderTab` 1, 2 o 3 (Strata.dc.html:76-78, 2070-2072). Las pastillas de usuario muestran el aviso «fuera del alcance» (Strata.dc.html:68, 82, 2078). El candidato no tiene navegación y el logo del examen no es clicable (Strata.dc.html:1143).
2. **Interacción en la home.** El selector llama a `modoMi` o `modoEmpresa` (Strata.dc.html:138-139, 2028-2029) y cambia la entradilla, que se re-anima por `key`, el CTA y el enlace secundario. Elegir una opción de la demo cambia `demoOpcion` (Strata.dc.html:183, 2054). «Previsualizar test» muestra un toast (Strata.dc.html:255, 2062). La nav pública muestra el aviso «fuera del alcance» (Strata.dc.html:116-119). Tocar la mascota la hace brincar y abre la burbuja (Strata.dc.html:101, 2022-2027).
3. **De la home a la compra.** El CTA del hero (`heroCtaAccion`, en los dos modos), «Comprar un test» y «Ver catálogo completo →» llevan al catálogo con rol empresa (Strata.dc.html:123, 145, 234, 2038, 2065). «Comprar en 1 clic» hace lo mismo y avisa «{test} añadido — completa el pago en el carrito», pero no toca el carrito (Strata.dc.html:256, 2063).
4. **De la home al acceso del candidato.** «Tengo un código», «Ya tengo un código» (modo 'mi') y «Siguiente» de la demo abren el acceso en el paso 2, con el código '9B2X-88K1' ya validado (Strata.dc.html:122, 149, 193, 2017, 2041).
5. **De la home al portal RH o al admin.** En modo 'empresa', «Entrar al portal de RR. HH.» lleva a Candidatos (Strata.dc.html:2042). «Acceso interno», en el footer, abre el paso 1 del builder (Strata.dc.html:321, 2070).
6. **Compra de licencias.** En el catálogo: filtro (Strata.dc.html:623, 1798) → cantidad con − y + (mínimo 1; Strata.dc.html:1804-1805) → «Añadir · Comprar licencias», que suma al carrito, abre el drawer y avisa «{n licencias} de {test} en el carrito» (Strata.dc.html:671, 1806-1810). En el drawer: «Quitar» (Strata.dc.html:1817), método de pago (Strata.dc.html:1828) y cierre con el scrim o la X (Strata.dc.html:1250, 1257). «Pagar y generar códigos · {total}» llama a `confirmarCompra`. Con el carrito vacío avisa «Añade licencias antes de comprar»; si no, suma al saldo, genera hasta 4 códigos «Disponible» por línea, vacía el carrito, cierra y abre Mis licencias con el aviso «{n licencias} acreditadas · códigos generados» (Strata.dc.html:2086-2097). «Carrito · N» reabre el drawer (Strata.dc.html:613, 2084).
7. **Gestión del inventario.** Filtro (Strata.dc.html:1839) → copiar código o enlace, con toast (Strata.dc.html:738, 746, 1845-1846) → acción por fila: «Ver reporte» (Consumida) abre Resultados; «Enviar» (Disponible) y «Reenviar» (Enviada o En uso) abren el modal de invitación con el código de esa fila (Strata.dc.html:1847-1850).
8. **Invitación con enlace o código.** «Generar enlace / código» (Inventario) o «Generar enlace / código de invitación» (Candidatos) abre el modal con un código nuevo XXXX-XXXX (Strata.dc.html:690, 783, 2123, 1553-1558). Ahí se copia el enlace (Strata.dc.html:1336, 2126), se elige un test con saldo (Strata.dc.html:1981-1982) y un canal: Correo y WhatsApp solo muestran un toast; Copiar link copia (Strata.dc.html:1989-1993). «Registrar en candidatos» crea el candidato «Invitación sin abrir» y una licencia «Enviada», resta 1 del saldo, cierra y abre Candidatos con un toast (Strata.dc.html:2127-2136). «Cerrar» o el scrim cancelan (Strata.dc.html:1326, 1369).
9. **Asignación por correo.** «Asignar por email» abre el modal (Strata.dc.html:782, 2104). Se elige correo, test y modo 'email' o 'link' (Strata.dc.html:1388, 1394, 1404). «Enviar invitación» no valida nada: si el correo está vacío usa 'candidato@correo.com' y deriva el nombre del correo. Crea un candidato «Código enviado» y una licencia «Enviada», resta 1, cierra, abre Candidatos y avisa según el modo (Strata.dc.html:2108-2120). «Cancelar» o el scrim cierran (Strata.dc.html:1379, 1413).
10. **Seguimiento de candidatos.** Filtro por estado (Strata.dc.html:1872) → acción por fila: «Ver diagnóstico» (Completado) abre Resultados; «Ver avance» (En proceso) abre el examen con rol candidato; «Reenviar código» (Código enviado) copia el enlace y avisa «Código reenviado a {email}» (Strata.dc.html:1879-1887). La paginación es decorativa (Strata.dc.html:864-865).
11. **Lectura del diagnóstico.** Elegir una dimensión cambia la caja de interpretación (Strata.dc.html:935, 1962, 946-953). Los interruptores de envío cambian el mensaje de estado (Strata.dc.html:964, 1975, 2225-2226). «Descargar diagnóstico (PDF)» solo muestra un toast (Strata.dc.html:2227). «Ver respuestas» abre el examen como candidato (Strata.dc.html:986, 2068). «Volver al panel →» abre Candidatos (Strata.dc.html:884).
12. **Candidato: acceso, examen y fin.** En el paso 2 se escriben nombre y correo, con validación en vivo (Strata.dc.html:2002-2004, 2181-2187), y se acepta el consentimiento, que ya viene marcado (Strata.dc.html:1522, 2192). «Iniciar Evaluación» avisa si falta el consentimiento; si no, abre el examen con `qIndex` 0 y sin respuestas (Strata.dc.html:2193-2196). En cada pregunta: elegir opción (Strata.dc.html:1952), «Siguiente pregunta», que avisa si no hay respuesta (Strata.dc.html:2206-2210), y «Anterior» (Strata.dc.html:2211). El reloj cuenta hacia atrás (Strata.dc.html:1526-1540). «Finalizar examen» abre el fin (Strata.dc.html:2208). Ahí, «Cerrar ventana» abre Resultados con rol empresa y un toast (Strata.dc.html:2219), y «Conocer Strata» muestra el aviso «fuera del alcance» (Strata.dc.html:1224).
13. **Candidato: código manual.** En el paso 2, «Ingresar mi código manualmente» abre el paso 1 (Strata.dc.html:1126, 2180). El código se escribe en mayúsculas (Strata.dc.html:2171). «Validar código» avisa «Revisa el código: son 8 caracteres» si hay menos de 6 alfanuméricos; si no, vuelve al paso 2 con ese código y un toast (Strata.dc.html:2173-2178). «Tengo un enlace de invitación» vuelve al paso 2 con '9B2X-88K1' (Strata.dc.html:2179).
14. **Construcción de un test (Super admin).** El paso activo se cambia desde la nav o las pastillas (Strata.dc.html:353, 1899, 2070-2072). Paso 1: nombre, categoría, precio y n.º de reactivos (solo dígitos); quitar o añadir dimensiones (Strata.dc.html:2139-2145, 1905-1910). Paso 2: elegir un reactivo y editar enunciado, tipo, dimensión y peso (±0.1); añadir un reactivo, que queda seleccionado (Strata.dc.html:1916, 1922-1928, 2148-2156). Paso 3: elegir un rango y editar desde, hasta, etiqueta y texto; añadir un rango, que no queda seleccionado; usar el simulador (±4) (Strata.dc.html:1939, 1943-1948, 2157-2166). «Guardar borrador» y «Publicar al catálogo» solo muestran toasts (Strata.dc.html:2167-2168).
15. **Mascota.** Ver «Mascota».
16. **Selector de rol (solo prototipo).** Cada chip fija el rol, la pantalla, `accesoPaso` 2, el código y `qIndex` 0 (Strata.dc.html:1783-1794).

Observaciones:

- Los eyebrows «Paso 1 de 3», «Paso 2 de 3» y «Paso 3 de 3» (Strata.dc.html:608, 686, 777) cuentan el recorrido compra → inventario → asignación, pero la nav deja ir en cualquier orden.
- La demo salta de un rol a otro: «Ver avance» y «Ver respuestas» le muestran el examen a RH, y «Cerrar ventana» lleva al candidato al portal de la empresa (Strata.dc.html:1886, 2068, 2219).
- Todos los errores y las confirmaciones van por toast (Strata.dc.html:1544-1548). No hay mensajes inline ni diálogos de confirmación.

### Modales y overlays

| Overlay | Condición y líneas | Capa | Abre / cierra | Contenido y estados | Movimiento |
|---|---|---|---|---|---|
| Drawer «Resumen de compra» | `checkoutAbierto`, Strata.dc.html:1247-1321 | fixed, z-index 60; scrim rgba(15,23,42,.42) | Abre: «Añadir · Comprar licencias» y «Carrito · N» (Strata.dc.html:1808, 2084). Cierra: scrim, X o confirmación (Strata.dc.html:1250, 1257, 2095). | Panel derecho de 408 px (max 100 %). Cabecera blanca. Cuerpo con scroll: estado vacío o líneas con «Quitar», «Método de pago» con 3 tarjetas-radio y totales: «Subtotal», «Impuestos (16 %)» y «Total» (Strata.dc.html:1304-1308; tasa fija en 2082). Pie con CTA y «Pago cifrado · factura fiscal automática». El error de carrito vacío va por toast; el CTA nunca se deshabilita. | `slideIn` .26s cubic-bezier(.32,.72,0,1). El scrim no se anima. Sin salida. |
| Modal «Enlace de invitación generado» | `invitacionAbierta`, Strata.dc.html:1323-1374 | z-index 60, centrado, padding 24 | Abre con código nuevo (Strata.dc.html:690, 783, 2123) o con el de la fila (Strata.dc.html:1850). Cierra: scrim, «Cerrar» o «Registrar en candidatos» (Strata.dc.html:1326, 1369, 2133). | 540 px, radio 20, max-height 92vh con cuerpo desplazable. Tarjeta oscura con el código en mono de 30px y el enlace copiable. «Test vinculado»: tarjetas-radio con «{n} libres», solo tests con saldo, hasta 4. «Enviar por»: 3 tiles. Pie #FAF8F5 con «Vence en 14 días si no se inicia.». Sin validación ni errores. | `fadeUp` .22s ease both. |
| Modal «Asignar test por email» | `asignarAbierto`, Strata.dc.html:1376-1418 | z-index 60 | Abre: «Asignar por email» (Strata.dc.html:782). Cierra: scrim, «Cancelar» o «Enviar invitación» (Strata.dc.html:1379, 1413, 2117). | 520 px. Input de correo sin foco visible ni validación, «Test a aplicar» con tarjetas-radio, 2 tarjetas de modo y el mismo pie. El CTA dice «Enviar invitación» en los dos modos. | `fadeUp` .22s ease both. |
| Toast | `hayToast`, Strata.dc.html:1420-1425 | fixed abajo, z-index 80 | Abre con `aviso()` y `copiar()` (Strata.dc.html:1544-1552). Se cierra solo a los 2600 ms; uno nuevo reemplaza al anterior. | Caja #0F172A de radio 13 y padding 13px 20px, con un punto #38BDF8 de 7px y texto blanco de 13px/600. Sin acción, sin cierre manual y sin `aria-live`. Probablemente descentrado (ver «Comprobaciones puntuales»). | `fadeUp` .2s; el `softIn` declarado antes se pierde. Sin salida. |
| Burbuja de la mascota | `salaHablando`, Strata.dc.html:102-106 | fixed, z-index 4 dentro de `<main>` | Abre al tocar la mascota (Strata.dc.html:2022-2027). Se cierra a los 5400 ms. | 232 px, radio 16, #0F172A, texto de 12.5px, `pointer-events: none`. La posición la calcula JS (Strata.dc.html:1682-1689). | `bubbleIn` .3s con resorte. |
| Selector de rol (solo prototipo) | `sinOverlay`, Strata.dc.html:1427-1435 | fixed abajo a la derecha, z-index 70 | Visible salvo en home, en acceso y con overlays abiertos (Strata.dc.html:2008). | Cuatro chips de rol. | Ninguno. |

- Las barras sticky no son overlays, pero comparten las capas: la topbar tiene z-index 30 (Strata.dc.html:53) y la barra del examen z-index 10 (Strata.dc.html:1141).
- Ningún overlay tiene `role="dialog"` ni `aria-modal`, foco atrapado, cierre con Escape, bloqueo del scroll del body ni devolución del foco: no hay manejo de teclado en Strata.dc.html:1247-1418. El brief exige teclado y foco visible (PROMPT_CLAUDE_CODE.md:188).
- No hay animaciones de salida: `sc-if` desmonta los overlays al instante.

### Componentes que se desprenden

| Componente | Variantes | Dónde aparece | Notas para el port |
|---|---|---|---|
| PageLayout con halos | Global, fijo (coral .2, celeste .2, navy .1). Home, absoluto dentro de la pantalla (.26, .24, .12; el celeste en top 200), así que se desplaza con el contenido. | Strata.dc.html:45-51, 96-99 | El brief describe un solo juego de halos fijos (PROMPT_CLAUDE_CODE.md:88). Conservar el de la home como variante de PageLayout (por ejemplo, halos «home»); unificarlos cambiaría la apariencia aprobada de la home y requiere una decisión explícita. |
| TopBar | Empresa (nav, saldo y pastilla). Super admin (nav, contador y pastilla). Sticky, blur 16. | Strata.dc.html:52-90 | Sin borde ni sombra; sin menú móvil; el logo vuelve al inicio. |
| NavLink | Activo (#0F172A/600, subrayado #FF6B6B de 2px), inactivo (#6B6558/500) y hover. Variante pública sin activo (13.5px #5B5545). | Strata.dc.html:61-64, 76-78, 116-119, 1770-1774 | Son `div`; pasarlos a enlaces del router. |
| UserPill | Avatar de iniciales navy de 30px y nombre. | Strata.dc.html:68-71, 82-85 | En el prototipo no abre nada. |
| PublicHeader | Marca, nav, «Tengo un código» y botón tinta. | Strata.dc.html:110-125 | No es sticky. La marca no enlaza (Strata.dc.html:111-114). |
| ExamBar | Logo, título, subtítulo, reloj opcional, indicador de guardado y progreso de 4px. | Strata.dc.html:1141-1162 | Sticky, z-index 10, blur 16. |
| BrandRow del acceso | Inicial de la empresa (31px) y nombre; «Powered by», strata-mark y STRATA. | Strata.dc.html:999-1009 | La inicial está fija. |
| Footer | Del shell, de la home (con «Acceso interno») y fila de enlaces del acceso. | Strata.dc.html:1230-1243, 312-324, 1124-1132 | Enlaces con href="#". |
| PageHeader | Eyebrow, H1 de 46px, entradilla de 17px y acciones a la derecha. Variante con pastilla de estado en el builder. | Strata.dc.html:333-349, 606-618, 684-694, 775-788 | Resultados no lo usa (Strata.dc.html:874-886). |
| Button primario (coral) | Estándar de radio 12; radio 14 en builder y modales; ancho completo; CTA del hero (radio 16, con resorte); CTA del acceso (sombra y elevación); compacto de tarjeta. Admite ícono. | Strata.dc.html:145, 256, 344, 671, 690, 783, 982, 1077, 1113, 1188, 1223, 1313, 1370, 1414 | Texto blanco sobre coral: 2.78:1, no cumple AA. El brief asigna los primarios al navy (PROMPT_CLAUDE_CODE.md:63). |
| Button secundario | Borde #D6CFC2, fondo blanco, texto navy, hover con borde navy. Variante neutra «Cerrar»/«Cancelar» con texto #5B5545. Outline de tarjeta («Previsualizar»). | Strata.dc.html:255, 343, 613, 782, 986, 1186, 1224, 1369, 1413 | Radios de 12 a 14. |
| Button tinta | Pastilla #0F172A; hover navy y −1px. | Strata.dc.html:123 | Solo en el header público. |
| Link / ghost | Navy de 12.5-13.5px/600 con hover #0EA5E9. Sobre oscuro, #38BDF8 con hover blanco. | Strata.dc.html:122, 149, 234, 550, 884, 1117, 1126 | Son `span` o `div` clicables. El hover #0EA5E9 da 2.61:1 sobre #FAF8F5. |
| TableAction | Neutro (borde #D6CFC2) y destacado (borde #0EA5E9, fondo #EFF9FE, texto #0369A1). | Strata.dc.html:757, 854, 1880-1882 | — |
| IconButton | Cerrar (32px, radio 9) y copiar (24px, radio 7). | Strata.dc.html:1257, 738 | Sin etiqueta accesible. |
| Stepper | Cantidad (30×34), peso (32×38, valor en mono) y simulador sobre oscuro (30×30). | Strata.dc.html:665-669, 500-504, 582-586 | Son `div` clicables. |
| TextInput | Builder y modal (radio 14, borde #E7E2D8, fondo #FAF8F5, sin foco visible). Con prefijo de moneda. Numérico en mono (radio 10). Candidato: ícono, check de válido y anillo de foco (radio 12, borde 1.5). Código en mono de 20px, centrado. | Strata.dc.html:369, 384-387, 559, 1388, 1042-1065, 1111 | Estados neutro, foco y válido. No existe estado de error: hay que diseñarlo. |
| Textarea | 3 o 4 filas, resize vertical. | Strata.dc.html:400, 477, 571 | Sin foco visible. |
| ConsentCheckbox | Marcado y no marcado; toda la caja es clicable y lleva un enlace dentro. | Strata.dc.html:1068-1073, 2188-2192 | Usar un checkbox real; el enlace no debe alternar la casilla. |
| RadioCard | Con radio: métodos de pago, tipos de respuesta, tests asignables y opciones del examen. Sin radio: modos de envío. | Strata.dc.html:482-485, 1175-1181, 1289-1298, 1346-1350, 1394-1398, 1404-1407, 1765-1769 | Pasar a radiogroup. |
| SegmentedFilter | Chips en una pista #F1EDE4; el activo es blanco con sombra. | Strata.dc.html:621-624, 713-716, 814-817, 1757-1761 | — |
| SegmentedToggle | Thumb deslizante (translateX 0 % o 100 %). | Strata.dc.html:136-140, 2018 | Hacerlo accesible como radiogroup. |
| ChoiceChip (`chipSky`) | Activo #0EA5E9 con texto blanco (2.77:1) e inactivo. | Strata.dc.html:376, 494, 1762-1764 | Ajustar el contraste. |
| RemovableChip y AddChip | Chip celeste con «×»; chip punteado «+ Añadir». | Strata.dc.html:411-416 | — |
| StatusBadge | Pastilla con punto: 4 estados de licencia y 3 de candidato. | Strata.dc.html:751-753, 847-849, 1831-1836, 1866-1870 | Mapear a los estados del repo. |
| Tag / Pill | Tag de tarjeta (celeste, coral o navy), eyebrow con punto en vivo, «Borrador», «{n} en saldo», insignia coral, insignia verificada y etiquetas mono (código, ITEM, método, tipo, dimensión, peso). | Strata.dc.html:129-132, 240-243, 266-269, 337, 460-462, 474, 638-641, 795, 1015-1019, 1297 | — |
| Card | Vidrio (radio 24, blur 14) con variantes: elevación al hover, borde al hover, contenedor de tabla, estadística y resumen. También paso translúcido, secundaria, blanca, oscura y punteada. | Strata.dc.html:169, 239, 273, 419, 509, 511, 578, 630, 698, 708, 792, 809, 876, 888, 1014, 1170, 1210, 1264, 1270, 1303, 1333 | Ver 3.1 y 3.2 (superficies). |
| StatCard | Resumen con cuadro numérico de 38px; saldo con cifra de 27px y barra. | Strata.dc.html:698-704, 792-805 | — |
| ProgressBar | 4px en el examen (con transición), 5px en la demo, 6px en el saldo, 8px en la dimensión y 7px sobre oscuro en el simulador. | Strata.dc.html:177-179, 584, 801-803, 940-942, 1159-1161 | — |
| DataTable | Toolbar (título, subtítulo y filtros), thead tintado, filas con stagger de 28 ms y hover, scroll horizontal (min-width 900), pie con nota o paginación, padding vertical de celda de 14 o 9 px. | Strata.dc.html:708-768, 809-868, 2101 | Falta definir la versión móvil. |
| Avatar | Círculo navy de 30px (topbar), cuadrado celeste de 33px (tabla) y cuadrado navy de 31px (empresa). | Strata.dc.html:69, 83, 838, 1001 | Iniciales derivadas del nombre. |
| Modal | 540 o 520 px, radio 20; cabecera, cuerpo con scroll y pie #FAF8F5. | Strata.dc.html:1325-1372, 1378-1416 | Sin semántica de diálogo. |
| Drawer | 408 px, entra por la derecha. | Strata.dc.html:1249-1320 | — |
| Toast | Un solo tipo: caja oscura de radio 13 con punto. | Strata.dc.html:1420-1425 | Añadir `aria-live` y centrarlo sin transform. |
| ToggleSwitch row | Fila con rol, correo e interruptor de 42×24. | Strata.dc.html:964-972, 1973-1974 | Usar `role="switch"`. |
| SelectableListRow | Con marcador izquierdo de 3px (reactivos; rangos con su color) y sin marcador (dimensiones). | Strata.dc.html:455, 538, 935 | — |
| StepPills | 3 pasos numerados. | Strata.dc.html:351-358, 1896-1904 | — |
| Callout | Celeste (variables, código consumido), interpretación #FAF8F5, estado vacío punteado, banner de estado oscuro y estado del envío. | Strata.dc.html:572-575, 876-885, 946-953, 975-978, 1217-1220, 1264-1267 | — |
| CodeDisplay y CopyField | Tarjeta oscura con el código en mono de 30px y una fila con el enlace copiable. | Strata.dc.html:1333-1340 | — |
| ChannelTile | Sigla en un cuadro de 28px con su etiqueta. | Strata.dc.html:1359-1362 | — |
| TrustRow y GuaranteeStrip | Fila de 3 íconos con texto (hero) y franja de 3 garantías (acceso). | Strata.dc.html:152-165, 1085-1104 | — |
| RadarChart | Estático de 6 ejes (reporte) y mini radar animado (home). | Strata.dc.html:215-223, 894-913 | Ejes fijos; la fuente de las etiquetas no se carga. |
| DemoCard y FloatingBadge | Tarjeta flotante y dos badges. | Strata.dc.html:169-224 | Solo en la home. |
| HowItWorks | 3 tarjetas unidas por un conector discontinuo. | Strata.dc.html:271-309 | — |
| SuccessHero | Ícono de 76px, H1 y resumen en tarjetas. | Strata.dc.html:1202-1215 | — |
| Mascot y SpeechBubble | Ver «Mascota». | Strata.dc.html:101-106 | Montarla como un componente aislado (PROMPT_CLAUDE_CODE.md:168). |
| LiveDot y DotSeparator | Punto con pulso (`livePulse` o `pulseDot`), punto estático y separador de 3px. | Strata.dc.html:67, 130, 173, 212, 247, 635, 1023, 1127, 1155, 1422 | — |

### Tokens de diseño

Los valores visuales (color, tipografía, superficies, radios, sombras, espaciado, capas y movimiento) y los pares de contraste están en la sección 3.

### Animaciones y movimiento

| Keyframe | Definición | Uso (duración · curva · retardo · fill) | Evidencia |
|---|---|---|---|
| `screenIn` | opacity 0, translateY(14px) y scale(.992) → none | Entrada de cada pantalla: .5s cubic-bezier(.22,.61,.36,1) both | Strata.dc.html:31; 96, 332, 605, 683, 774, 874, 996, 1140, 1200 |
| `riseIn` | opacity 0 y translateY(9px) → none | Tarjetas del catálogo: .5s, misma curva, both, retardo i × 55 ms | Strata.dc.html:32; 630, 1802 |
| `rowIn` | opacity 0 y translateY(5px) → none | Filas de Inventario y Candidatos: .42s, misma curva, both, retardo i × 28 ms | Strata.dc.html:34; 734, 835, 1843, 1877 |
| `softIn` | opacity 0 y translateY(6px) → none | Entradilla del hero y tarjeta de pregunta: .34s, misma curva, both; se repite al cambiar `key`. En el toast queda anulada | Strata.dc.html:33; 142, 1170, 1421 |
| `fadeUp` | translateY(8px) y opacity 0 → translateY(0) y opacity 1 | Modales .22s ease both; toast .2s ease both | Strata.dc.html:28; 1327, 1380, 1421 |
| `slideIn` | translateX(24px) y opacity 0 → translateX(0) y opacity 1 | Drawer .26s cubic-bezier(.32,.72,0,1) both | Strata.dc.html:27; 1251 |
| `popIn` | scale(.86) y opacity 0 → scale(1) y opacity 1 | Checks de campo válido .3s e ícono del fin .38s, con cubic-bezier(.34,1.56,.64,1) both | Strata.dc.html:30; 1046, 1061, 1202 |
| `bubbleIn` | opacity 0, translateY(8px) y scale(.9) → none | Burbuja de la mascota .3s cubic-bezier(.34,1.4,.64,1) both | Strata.dc.html:39; 103 |
| `pulseDot` | opacity 1 → .35 → 1 | Punto «Guardado automático»: 1.8s ease-in-out infinite | Strata.dc.html:29; 1155 |
| `livePulse` | opacity .4 y scale(.82) al 50 % | Puntos en vivo: eyebrow 2s, «Guardado» 2.2s y «Perfil en vivo» 1.8s, infinite | Strata.dc.html:38; 130, 173, 212 |
| `floatCard` | translateY de 0 a -10px y de vuelta | Tarjeta demo 7.5s ease-in-out infinite | Strata.dc.html:35; 169 |
| `floatBadge` | translateY(-13px) y rotate de -.4deg a .5deg | Badges: 6.4s y 7.8s (retardo -2.6s), infinite | Strata.dc.html:36; 200, 210 |
| `polyCycle` | opacity 1 (0-27 %) → 0 (34-93 %) → 1 | Tres polígonos del radar de la home: 8.4s con retardos 0, -2.8s y -5.6s, sin fill | Strata.dc.html:37; 220-222 |
| `glowDrift` | translate3d(-18px,22px,0) y scale(1.06) al 50 % | Halos: 18s ease-in-out infinite, sin retardo (en fase) | Strata.dc.html:40; 48-50, 97-99 |

| Elemento | Transición o efecto | Evidencia |
|---|---|---|
| Regla global | background-color, border-color, color, box-shadow y opacity en .18s ease, solo en `button, a, input, td, th` | Strata.dc.html:41 |
| Selector «Para mí / Empresa» | Thumb con transform .36s cubic-bezier(.4,0,.2,1); color de las etiquetas en .2s | Strata.dc.html:137-139 |
| CTA del hero | Resorte .2s cubic-bezier(.34,1.4,.64,1). Hover: scale(1.05), fondo #F4574F y sombra mayor. Active: scale(.99) | Strata.dc.html:145 |
| «Comprar en 1 clic» / «Comprar un test» | Hover scale(1.04) con resorte de .18s / translateY(-1px) y fondo navy | Strata.dc.html:123, 256 |
| Opciones de la demo y «Siguiente» | Hover translateX(2px) en .18s | Strata.dc.html:183, 193 |
| Tarjetas de la home | Hover translateY(-5px) o (-4px) con sombra, .22s ease | Strata.dc.html:239, 273 |
| Tarjeta del catálogo | Hover translateY(-2px) y borde #CBD5E1, .18s | Strata.dc.html:630 |
| «Iniciar Evaluación» | Hover: fondo #F4574F, translateY(-1px) y sombra 0 9px 22px rgba(255,107,107,.3), todo en .18s; active translateY(1px) | Strata.dc.html:1077 |
| «Añadir · Comprar licencias» | Hover: solo cambia el fondo a #F4574F (con la transición global de .18s); active translateY(1px), sin transición de transform | Strata.dc.html:671 |
| Inputs del candidato | Borde, fondo y sombra en .18s; anillo de foco de 3px | Strata.dc.html:1044, 1059, 1111 |
| Consentimiento | Fondo y borde en .18s | Strata.dc.html:1068-1069 |
| Progreso del examen | width .35s cubic-bezier(.4,0,.2,1) | Strata.dc.html:1160 |
| Interruptor de envío | Fondo en .2s; la perilla salta de lado (justify-content) | Strata.dc.html:969-971 |
| Sin transición | Enlaces de nav (`div`), nav pública (`span`), filas (`tr`), barras de dimensión, saldo y simulador, pastillas de paso | Strata.dc.html:61-64, 116-119, 353, 584, 734, 802, 941 |

- Coinciden con el brief la entrada de pantalla de 14px en .5s, el stagger de 55 ms y las transiciones de .18s (PROMPT_CLAUDE_CODE.md:104-106). El stagger de 28 ms en filas es propio del prototipo.
- Hay re-animación por `key`: la entradilla del hero (Strata.dc.html:142) y la tarjeta de cada pregunta (Strata.dc.html:1170) se vuelven a montar. La spec del repo pedía no animar entre reactivos (2026-09-11-fase1-nucleo-design.md:92); hay que decidirlo.
- `prefers-reduced-motion` reduce animaciones y transiciones a .01ms y una sola iteración (Strata.dc.html:42), pero:
  - los retardos del stagger se mantienen;
  - `polyCycle` no tiene fill, así que los tres polígonos quedan visibles a la vez (Strata.dc.html:220-222);
  - la regla no afecta a GSAP y la mascota sigue nadando, cuando el brief pide que quede quieta u oculta (PROMPT_CLAUDE_CODE.md:107).
- No hay animaciones de salida: drawer, modales, toast, burbuja y pantallas se desmontan al instante.
- Las entradas con `fill: both` fijan `transform`. Si el hover se escribe con CSS normal (sin el `!important` del runtime), el desplazamiento desaparece. Para evitarlo, separar la animación del transform de hover: `animation-fill-mode: backwards` o un contenedor aparte.
- Hay dos curvas de resorte: (.34,1.4,.64,1) en botones y burbuja, y (.34,1.56,.64,1) en `popIn`. Unificarlas o dejarlas como dos tokens.

### Mascota

- **Asset y montaje.** `assets/mascota.png` (594 × 846, cabeza hacia arriba). `<img id="strata-mascot">` es fixed en (0,0), mide 100px de ancho, tiene z-index 1, opacidad inicial 0, `will-change: transform`, drop-shadow y `title="Tócame"` (Strata.dc.html:101). Solo existe dentro de la home (Strata.dc.html:95).
- **Librería.** GSAP 3.12.2 y MotionPathPlugin se cargan por CDN (Strata.dc.html:17-18). El brief pide instalarlos por npm y portar `iniciarMascota`, `nadarLibre`, `entrarEnEscena`, `correrHacia`, `brincarMascota`, `vigilarTitular` y `pararMascota` (PROMPT_CLAUDE_CODE.md:162-168).
- **Constantes.** `GIRO = 90` porque el PNG mira hacia arriba (Strata.dc.html:1586).
  - Claves exactas: 'tests', 'para empresas', 'cómo funciona' y 'precios'.
  - Claves parciales: 'comprar', 'tengo un código', 'para mí', 'para mi empresa', 'registrarse', 'previsualizar', 'ver catálogo' e 'iniciar evaluación' (Strata.dc.html:1587-1588).
  - Seis mensajes de burbuja en orden fijo (Strata.dc.html:1571-1578).

| Método | Qué hace | Tweens y tiempos | Timers, listeners y limpieza | Evidencia |
|---|---|---|---|---|
| `refMascota` (ref del img) | Si recibe el mismo nodo, no hace nada. Con `null` (se desmonta la home), llama a `pausarMascota`. Con un nodo nuevo: si había otro llama a `pararMascota`, guarda `mImg` y llama a `esperarGsap` | — | Función de flecha estable | Strata.dc.html:1590-1596, 2019 |
| `refBurbuja` | Guarda el nodo de la burbuja y la coloca al montarse | — | — | Strata.dc.html:103, 1597 |
| `esperarGsap` | Si existen `window.gsap` y `MotionPathPlugin`, llama a `iniciarMascota`; si no, reintenta | Reintento cada 120 ms | Timeout `mGsap`; lo limpia `pararMascota`, no `pausarMascota` | Strata.dc.html:1613-1617 |
| `iniciarMascota` | Sale si ya está activa o si no hay imagen. Marca `mOn` y `mEnt`, registra el plugin, deja la mascota fuera de pantalla y anota `mT0` | `gsap.set`: xPercent y yPercent -50, x = ancho + 160, y = 40 % del alto, rotation 90, opacity 0, origen 50 % 50 % | `mEntrada` (setTimeout de 6000 ms); `click` en window en captura (`clicGlobal`); `resize` (`recalcularRuta`); `ticker.add(tick)` tras quitarlo para no duplicarlo | Strata.dc.html:1619-1635 |
| `tick` | En cada frame: antes de la entrada comprueba si pasaron 6 s y llama a `entrarEnEscena`, una vía redundante con el timeout; después llama a `latido` | — | Ticker de GSAP | Strata.dc.html:1709-1716 |
| `entrarEnEscena` | Marca `mEntrado`, limpia `mEntrada`, despierta el ticker y lanza tres tweens | Opacidad a .8 en 1.4s power2.out (al terminar, `mEnt = false` y `mOpac = .8`). x/y al primer punto de la ruta en 2.1s power2.inOut, con `onUpdate: latido` y `onComplete: nadarLibre`. `mFlex`: scaleY 1.04 y scaleX .97 en .4s, yoyo, repeat -1, sine.inOut | Los dos primeros tweens no se guardan | Strata.dc.html:1672-1680 |
| `rutaMascota` | Devuelve 10 puntos en coordenadas de viewport: un circuito horario por el borde (baja por la derecha, cruza abajo, sube por la izquierda, cruza arriba) | bx = min(74, 7 % del ancho), by = 86 | — | Strata.dc.html:1650-1658 |
| `nadarLibre` | Mata `mNado` y crea el nado continuo | motionPath {path: ruta, curviness 1.35, autoRotate 90}, 42s, repeat -1, ease none, `onUpdate: latido` | `mNado` | Strata.dc.html:1660-1668 |
| `recalcularRuta` | En `resize`, si el nado está activo, lo recrea con la ruta nueva. Si la mascota está corriendo, ignora el resize | — | Listener de resize | Strata.dc.html:1670 |
| `latido` | Llama a `colocarBurbuja` y a `vigilarTitular`. Corre desde `tick` y desde los `onUpdate`, a veces dos veces por frame | — | — | Strata.dc.html:1707 |
| `colocarBurbuja` | Si la mascota está en la mitad izquierda, pone la burbuja a la derecha (left = r.right − 6); si no, a la izquierda (left = max(12, r.left − 226)). top = max(12, r.top − 52) | — | Escribe style.left y style.top | Strata.dc.html:1682-1689 |
| `vigilarTitular` | Cada 500 ms como mínimo mide `#strata-mascot ~ div h1`, el H1 del hero. Si el centro de la mascota cae en ese rect ampliado ±70 px en X y ±50 px en Y, la opacidad meta es .26; si no, .8 | Tween de opacidad de .7s con overwrite 'auto'. Solo actúa después de la entrada y cuando cambia la meta | — | Strata.dc.html:134, 1691-1705 |
| `clicGlobal` | Solo actúa si ya existe `mNado`: unos 8,1 s después de montar, más la carga de GSAP. Recorre el target y 3 ancestros; si el texto (sin espacios, en minúsculas, de menos de 64 caracteres) es una clave exacta o contiene una parcial, llama a `correrHacia(rect)`. No cancela el clic | — | Listener `click` en captura | Strata.dc.html:1718-1729 |
| `correrHacia` | Limpia `mVolver`, pausa `mNado` y calcula el destino (centro del elemento +66 px en X y +10 px en Y, a 70 px o más de los bordes) y el ángulo | Timeline: rotation al ángulo + 90 en .32s power2.out → x/y en 1.2s power3.inOut ('-=.1', `onUpdate: latido`) → rotation '+=360' y scale 1.12 en .8s power1.inOut → scale 1 en .3s ('-=.3') → callback | `mVolver` = setTimeout(nadarLibre, 400). La timeline no se guarda | Strata.dc.html:1731-1747 |
| `brincarMascota` | Coloca la burbuja y hace un brinco | scale 1.22 e y '-=26' en .26s back.out(2.4) → scale 1 e y '+=26' en .42s bounce.out, ambos con `onUpdate: latido` | Timeline no guardada | Strata.dc.html:1749-1755 |
| `salaTocar` (clic en el img) | Limpia `salaTimer`, brinca, suma 1 a `salaN` y muestra `salaMsgs[(salaN − 1 + 6) % 6]`; el primer toque muestra el saludo | — | `salaTimer` oculta la burbuja a los 5400 ms | Strata.dc.html:2020-2027 |
| `pausarMascota` | Al desmontarse el img (salir de la home): anula `mImg`, limpia `mEntrada` y `mVolver`, quita los listeners, saca `tick` del ticker, mata `mNado` y `mFlex` y pone `mOn = false` | — | No limpia `mGsap` ni `salaTimer`, ni mata los tweens de entrada, la atenuación ni las timelines de carrera y brinco | Strata.dc.html:1599-1611 |
| `pararMascota` | Al cambiar de img o al desmontar el componente: `mOn = false`, limpia `mEntrada`, `mGsap` y `mVolver`, quita listeners y ticker, mata `mNado` y `mFlex` | — | No anula `mImg`; las mismas timelines quedan vivas | Strata.dc.html:1637-1648 |
| `componentWillUnmount` | Limpia el reloj del examen, el toast y `salaTimer`, y llama a `pararMascota` | — | — | Strata.dc.html:1580-1583 |

Riesgos y decisiones para el port:

- **Limpieza** (PROMPT_CLAUDE_CODE.md:168, 189). Crear todos los tweens dentro de `gsap.context()` y revertirlos al desmontar, o guardar y matar cada timeline. Limpiar también `mGsap` y `salaTimer`. Quitar la doble vía de entrada, setTimeout y `tick` (Strata.dc.html:1629, 1712).
- **Movimiento reducido.** La regla CSS no afecta a GSAP (Strata.dc.html:42). Con `prefers-reduced-motion`, la mascota debe quedar quieta u oculta (PROMPT_CLAUDE_CODE.md:107).
- **Capas y clic.** Con z-index 1 frente a 2 (Strata.dc.html:101, 108), la mascota queda debajo del contenido y solo se puede tocar fuera de la columna. Además, mientras dura `screenIn`, el contenedor de la home tiene transform (Strata.dc.html:96) y hace de bloque contenedor del `position: fixed`. Montarla en un portal fuera de ancestros con transform y decidir su capa. Ojo: `vigilarTitular` encuentra el H1 con el selector de hermanos `#strata-mascot ~ div h1` (Strata.dc.html:1697), que solo funciona si la imagen es hermana anterior del contenedor del hero (Strata.dc.html:101, 108, 134). Dentro de un portal el selector devuelve null y la mascota deja de bajar a .26 sobre el H1, algo que pide el brief (PROMPT_CLAUDE_CODE.md:166). Pasar al componente una ref al H1 del hero o marcarlo con un atributo (por ejemplo, `data-mascota-titular`).
- **Detección por texto** (Strata.dc.html:1722-1723).
  - Es frágil ante cambios de copy y da falsos positivos: el H2 «Cómo funciona» (Strata.dc.html:265) coincide con una clave exacta.
  - 'registrarse' e 'iniciar evaluación' nunca coinciden mientras la mascota está montada.
  - Mejor usar un atributo explícito, por ejemplo `data-mascota-objetivo`.
- **Carrera invisible.** Si el CTA cambia de pantalla, la carrera no llega a verse, porque el clic desmonta la home (Strata.dc.html:2038, 2065). Decidir si se acepta así o si se retrasa la navegación.
- **Entrada de reversa.** Durante la entrada la rotación queda fija en 90°, con la cabeza a la derecha, mientras la mascota se desplaza hacia la izquierda (Strata.dc.html:1625, 1678). Al empezar el nado, `autoRotate` la gira de golpe (Strata.dc.html:1665).
- **Reanudación del nado** (inferido de GSAP 3.12.2, por verificar). Un motionPath con arreglo de puntos antepone la posición actual. Después de `correrHacia` o de un resize (Strata.dc.html:1670, 1746), cada vuelta de `repeat: -1` volvería a empezar desde ese punto, con un salto cada 42 s. Alternativa: volver primero al punto inicial y nadar con `fromCurrent: false`.
- **Choques de tweens** (inferencia, por verificar). El brinco anima `y` y `scale` mientras motionPath escribe x/y y `mFlex` escribe scaleX y scaleY (Strata.dc.html:1679, 1753-1754). Varios clics seguidos crean timelines superpuestas (Strata.dc.html:1741).
- **Accesibilidad.** El img tiene `onClick` sin rol ni teclado (Strata.dc.html:101), y la burbuja no tiene `aria-live` (Strata.dc.html:103).
- **Contenido.** Dos mensajes prometen funciones sin soporte: «Sin contraseñas ni registro» y «Tu informe llega en PDF a tu correo» (Strata.dc.html:1573, 1575). Revisarlos en brechas.

### Responsive

El brief pide que el diseño funcione hasta 360 px (PROMPT_CLAUDE_CODE.md:100). El prototipo solo tiene la `meta viewport` y ninguna media query de ancho; la única `@media` es la de movimiento reducido (Strata.dc.html:5, 42). Todo depende de flex-wrap y de grids auto-fit o auto-fill. La tipografía no escala: el H1 mide 46 o 52 px a cualquier ancho. Según una estimación sin verificar, palabras largas como «psicométricos» (Strata.dc.html:609) no caben en 292 px.

| Zona | Regla del prototipo | A 360 px | Evidencia |
|---|---|---|---|
| Contenedores | Padding lateral de 34 px (páginas y home), 24 px (acceso) y 28 px (examen y fin) | Ancho útil de 292, 312 y 304 px | Strata.dc.html:108, 332, 996, 1164, 1200 |
| TopBar | flex-wrap con row-gap 12; nav y bloque derecho también hacen wrap; textos nowrap; sin menú hamburguesa | Se apila en 2 o 3 filas y la barra sticky crece | Strata.dc.html:54, 60, 66, 75, 80 |
| Header público | wrap | Se apila; no hay menú móvil | Strata.dc.html:110, 115, 121 |
| Hero | grid auto-fit minmax(420px,1fr), gap 52 | Dos columnas desde unos 960 px de viewport. Por debajo de unos 488 px, la columna mínima no cabe y `overflow:hidden` la recorta | Strata.dc.html:96, 127 |
| Selector y CTA del hero | Etiquetas y CTA con nowrap | No caben en 292 px y se recortan | Strata.dc.html:138-139, 146 |
| Demo | Tarjeta al 100 % hasta 430 px; badges absolutos con offsets negativos | El overflow recorta los badges | Strata.dc.html:169, 200, 210 |
| Catálogo exprés | minmax(300px,1fr) | Desborda 8 px | Strata.dc.html:237 |
| Cómo funciona | flex-wrap con min-width 210; conector absoluto | El conector cruza las tarjetas apiladas | Strata.dc.html:271-273 |
| Builder | Paso 1 minmax(300px); paso 2 con dos columnas fijas 1.05fr/1fr; paso 3 minmax(320px) | Desborda 8 px; unos 140 y 134 px por columna; desborda 28 px | Strata.dc.html:362, 441, 530 |
| Catálogo | auto-fill minmax(292px,1fr) | Una columna exacta | Strata.dc.html:628 |
| Tarjetas de stats | minmax(190px) y minmax(206px) | Una columna | Strata.dc.html:696, 790 |
| Tablas | min-width 900 dentro de overflow-x auto | Scroll horizontal | Strata.dc.html:720-721, 821-822 |
| Resultados | minmax(320px); el radar escala al 100 % | Desborda 28 px | Strata.dc.html:887, 894 |
| Acceso | Tarjeta de hasta 600 px; franja de garantías con 3 columnas fijas | Unos 73 px por columna en la franja | Strata.dc.html:997, 1085 |
| Examen | Barra con wrap y título con min-width 150; navegación con wrap | Se apila con wrap; no hay mínimos fijos que desborden (sin verificar en navegador) | Strata.dc.html:1142-1144, 1185 |
| Fin | minmax(150px) | Una columna | Strata.dc.html:1208 |
| Drawer y modales | 408, 540 y 520 px con max-width 100 %; modales con padding 24 y altura máxima de 92vh | Drawer a pantalla completa; modales de 312 px | Strata.dc.html:1251, 1325-1327, 1378-1380 |
| Toast | Sin max-width | Un texto largo puede salirse; además, probablemente esté descentrado | Strata.dc.html:1421 |
| Mascota y burbuja | La ruta es relativa al viewport (bx = min(74, 7 % del ancho)) y se recalcula al redimensionar; la burbuja queda a 12 px o más de los bordes | bx ≈ 25 px; la burbuja de 232 px ocupa cerca del 65 % del ancho | Strata.dc.html:1650-1658, 1670, 1687-1688 |
| Selector de rol | Fijo abajo a la derecha | Tapa contenido (solo prototipo) | Strata.dc.html:1429 |

### Solo prototipo (no portar)

- **Runtime y sintaxis del editor:** `support.js`, `<x-dc>`, `<helmet data-dc-atomics>`, `<script type="text/x-dc" data-dc-script>` con `data-props`, `sc-if`, `sc-for`, `{{ }}`, `style-hover`, `style-focus`, `style-active` y `hint-placeholder-*` (Strata.dc.html:6, 9-10, 52, 182, 1438-1439; PROMPT_CLAUDE_CODE.md:10, 18).
- **Carga de GSAP por CDN** y el sondeo `esperarGsap` (Strata.dc.html:17-18, 1613-1617). Hay que instalar GSAP por npm (PROMPT_CLAUDE_CODE.md:162).
- **Selector de rol** (Strata.dc.html:1427-1435, 1783-1794) y cambios de rol dentro de los handlers (Strata.dc.html:1886, 2016-2017, 2038-2042, 2063-2072, 2219). En producción el rol sale de la sesión (PROMPT_CLAUDE_CODE.md:21).
- **Aviso «Módulo fuera del alcance de este prototipo»** (`fueraAlcance`, Strata.dc.html:2078). Lo disparan la nav pública (Strata.dc.html:116-119), las pastillas de usuario (Strata.dc.html:68, 82) y «Conocer Strata» (Strata.dc.html:1224).
- **Datos semilla:** tests, preguntas, dimensiones, reactivos, rangos, candidatos, licencias, tarjetas de la home, métodos de pago y destinatarios (Strata.dc.html:1441-1505, 1823-1827, 1966-1969, 2057-2060).
- **Valores fijos en el markup:**
  - «MR», «LO · Dr. Luis Ordóñez» y «14 tests publicados» (Strata.dc.html:69, 81-84), y la inicial «A» (Strata.dc.html:1001).
  - «Borrador · v0.4», «LID-360», y el H1 y la entradilla del builder (Strata.dc.html:337-340, 424).
  - El banner del reporte, el índice 76 y el radar (Strata.dc.html:882, 900, 929).
  - «orden LIC-2026-0914» y «actualizado hace 2 min» (Strata.dc.html:711, 812).
  - En el acceso: el test, «68 reactivos», «Escala Likert 1–5» y «~35 minutos» (Strata.dc.html:1020-1026, 1090). En el examen, el título (Strata.dc.html:1145).
  - «ayuda@strata.app» (Strata.dc.html:1131) y el dominio `strata.app/test/` (Strata.dc.html:1844, 1988).
  - Las fechas «09 sep 2026» (Strata.dc.html:2093, 2114, 2130) y el nombre del PDF (Strata.dc.html:2227).
- **Simulaciones en cliente** (la regla de oro dice que lo que no tenga backend no se simula: se registra como pendiente; PROMPT_CLAUDE_CODE.md:33):
  - Generación de códigos (Strata.dc.html:1553-1558) y validación local del código (Strata.dc.html:2175).
  - Conversión de moneda con tasas fijas (Strata.dc.html:1560-1562), la fila «Impuestos (16 %)» con una tasa fija del 16 % (Strata.dc.html:1305, 2082), y pago y acreditación (Strata.dc.html:2086-2097).
  - La «copia» del modo «Link de licencia»: avisa «Link de licencia copiado al portapapeles» sin llamar al portapapeles (Strata.dc.html:2119), a diferencia de `copiar()` (Strata.dc.html:1549-1552).
  - «Comprar en 1 clic» y «Previsualizar test» (Strata.dc.html:2062-2063).
  - Guardar y publicar en el builder (Strata.dc.html:2167-2168).
  - Descarga del PDF (Strata.dc.html:2227) y envío automático (Strata.dc.html:1966-1978).
  - `total = stock + 18` (Strata.dc.html:1863) y la cuenta regresiva desde 1421 s (Strata.dc.html:1515, 1529-1540).
- **UX que sí se puede portar sin backend:** los canales «Correo» y «WhatsApp» del modal de invitación solo muestran un toast en el prototipo (Strata.dc.html:1990-1991), pero en producción se pueden implementar en el navegador con un enlace `mailto:` y con `https://wa.me/?text=` usando el enlace real de cada invitación, que ya devuelve POST /api/assessments (2026-09-11-fase1-nucleo.md:1458-1460). No equivalen al correo automático que envía el backend al crear la evaluación (:1459). Si se ofrecen o no lo decide [D-10](decisiones.md#d-10).
- **Saltos narrativos de la demo:**
  - «Ver avance» y «Ver respuestas» le abren el examen a RH (Strata.dc.html:1886, 2068).
  - «Cerrar ventana» lleva al candidato al portal de la empresa (Strata.dc.html:2219).
  - Los accesos desde la home entran con el código '9B2X-88K1' ya validado (Strata.dc.html:2017, 2041, 2179).
  - «Acceso interno» lleva directo al builder (Strata.dc.html:321).
- **Valores calculados que no se usan:** `rolEtiqueta`, `conTopbar`, `carritoTexto` y `avisosAcceso` (Strata.dc.html:1995-2000, 2009, 2012, 2081, 2197), y los campos `tests[].tinte` y `licencias[].creada` (Strata.dc.html:1442-1447, 1498-1504).
- **Enlaces y fuente sin efecto:** los `href="#"` (Strata.dc.html:319-320, 1072, 1129, 1238-1239) y la fuente «Plus Jakarta Sans», que nunca se carga (Strata.dc.html:21, 907-912).
- **Precios escritos a mano en la home**, sin `fmt()` (Strata.dc.html:2037, 2058-2060).

#### Props editables (data-props)

| Prop | Editor y valor por defecto | Efecto en el prototipo | En producción |
|---|---|---|---|
| `nombreEmpresa` | text, «Acme Talento», sección Cuenta (Strata.dc.html:1439) | Alimenta `empresa` (Strata.dc.html:1779): pastilla de la topbar, acceso, examen y resumen del fin (Strata.dc.html:70, 1002, 1020, 1110, 1146, 2217) | No es una prop. En el portal RH es la organización del usuario: GET /api/user/profile carga `organization` (2026-09-12-registro-login-crud-usuarios.md:611, 709). En el flujo del candidato es el campo `organization` de GET /api/evaluar/{token} (2026-09-11-fase1-nucleo.md:1685, 2724). |
| `moneda` | enum USD/MXN/EUR, «USD», sección Cuenta | `tasa()`, `simbolo()` y `fmt()` convierten con tasas fijas (USD 1, MXN 18, EUR 0.92) en el catálogo, el carrito, los totales y la vista previa del builder; la home la ignora (Strata.dc.html:1560-1562, 2037) | Planes y specs no tienen moneda ni precio por test: buscar «currency», «moneda» y «MXN» no da resultados, y los precios siguen en «[PENDIENTE: precio]» (2026-09-11-fase3-sitio-ventas.md:386, 399). Queda pendiente de backend; no portar la conversión. |
| `densidadTabla` | enum Cómoda/Compacta, «Cómoda», sección Panel B2B | `padFila`, el padding vertical de celda, vale 14 o 9 px, solo en la tabla de candidatos (Strata.dc.html:836-853, 1780, 2101) | No tiene equivalente en el repo. Fijar la densidad cómoda o, si se decide, guardarla como preferencia local. |
| `mostrarTemporizador` | boolean, true, sección Examen | Muestra u oculta el reloj; el intervalo sigue corriendo (Strata.dc.html:1148, 1526-1540, 2200) | El repo no tiene límite de tiempo: solo `duration_min` estimado (2026-09-11-fase1-nucleo-design.md:45) y `elapsed_ms` por respuesta (2026-09-11-fase1-nucleo.md:341). Hay que decidir entre ocultarlo, mostrar el tiempo transcurrido o registrar un pendiente de backend. |

## 3. Sistema de diseño extraído

El brief fija unos valores base y manda tomar cualquier otro directamente del prototipo (PROMPT_CLAUDE_CODE.md:56-58). Se implementan como custom properties dentro del CSS vanilla del repo, no como estilos inline copiados (PROMPT_CLAUDE_CODE.md:39, 58). Sustituyen la paleta y las fuentes Mezquit de docs/design-tokens.md:5-26 y de tokens.css y typography.css (2026-09-10-sales-site.md:263-350); la regla de ícono y texto en éxito y error sigue vigente (design-tokens.md:34). Los contrastes son cálculo propio con la fórmula de WCAG 2.x.

### 3.1 Tokens del brief y cómo los usa el prototipo

| Token | Valor del brief | Uso en el prototipo | Diferencias o notas | Evidencia |
|---|---|---|---|---|
| Fondo de página | #FAF8F5 | Lienzo raíz y home; también inputs del builder y de los modales, pies de modal y franjas | — | PROMPT_CLAUDE_CODE.md:62; Strata.dc.html:45, 96, 369, 1085, 1367 |
| Beige secundario | #F7F5F0 | Fondo de `body` (casi nunca se ve), hover del botón cerrar y, al 60 %, el thead | — | PROMPT_CLAUDE_CODE.md:62; Strata.dc.html:21, 723, 1257 |
| Navy | #1E3A8A | Enlaces, texto de botones secundarios, precios, avatares, rango alto y badges Disponible y Completado | El brief lo asigna a los botones primarios; el prototipo los pinta de coral | PROMPT_CLAUDE_CODE.md:63; Strata.dc.html:23, 69, 343, 660, 1481, 1832 |
| Tinta | #0F172A | Títulos y texto base; también es la superficie oscura (vista previa, simulador, banner, cabecera del acceso, toast y burbuja) | El brief solo la define como tinta de títulos | PROMPT_CLAUDE_CODE.md:63; Strata.dc.html:21, 419, 876, 1014, 1421 |
| Celeste | #38BDF8 | Puntos, progreso, check del fin, enlaces sobre oscuro y opción activa de la demo | — | PROMPT_CLAUDE_CODE.md:64; Strata.dc.html:67, 884, 1160, 1203, 2051 |
| Celeste para texto | #0369A1 | Eyebrows, mono, íconos y acción destacada de tabla | — | PROMPT_CLAUDE_CODE.md:64; Strata.dc.html:154, 608, 745, 1882 |
| Hover | #0EA5E9 | Hover de enlaces, y además selección, foco, progreso, radios, chips activos y el polígono del radar | Como texto, o con texto blanco encima, no llega a 4.5:1 (3.3) | PROMPT_CLAUDE_CODE.md:64; Strata.dc.html:24, 900, 1044, 1763, 1767 |
| Coral | #FF6B6B | Subrayado del enlace activo y todos los CTA primarios | El brief lo limita a «indicador activo y acentos»; con texto blanco da 2.78:1 | PROMPT_CLAUDE_CODE.md:65; Strata.dc.html:145, 671, 1772 |
| Texto secundario | #5B5545 | Entradillas, labels y texto de apoyo | 7.00:1 sobre #FAF8F5 | PROMPT_CLAUDE_CODE.md:66; Strata.dc.html:142, 340, 368 |
| Texto terciario | #6B6558 | Ayudas, th, notas y enlaces inactivos | 5.46:1 sobre #FAF8F5 y 4.95:1 sobre #F0EDE5 | PROMPT_CLAUDE_CODE.md:66; Strata.dc.html:365, 724, 1773, 1835 |
| Placeholder | #756D5C | `::placeholder` global | 4.83:1 sobre #FAF8F5 | PROMPT_CLAUDE_CODE.md:66; Strata.dc.html:26 |
| Bordes | #EBE5DA, #EFE9DF y #E7E2D8 | Pastillas y separadores; tarjeta secundaria, demo y badges; controles e inputs | El prototipo usa además nueve tonos neutros de borde, más los de estado (3.2) | PROMPT_CLAUDE_CODE.md:67; Strata.dc.html:68, 169, 369 |
| Contraste mínimo | 4.5:1 para texto normal | — | Varios pares no cumplen (3.3) | PROMPT_CLAUDE_CODE.md:68 |
| Títulos | Satoshi, tracking −0.02em | Regla global de h1-h4 y textos de marca; pesos 400 a 800 | — | PROMPT_CLAUDE_CODE.md:72; Strata.dc.html:13, 22, 57 |
| H1 de página | 46px, line-height 1.06, tracking −0.03em, `text-wrap: balance` | Builder, catálogo, inventario y panel | Hero 52px; acceso 25 y 24px; fin 32px/800; Resultados no tiene H1 | PROMPT_CLAUDE_CODE.md:72; Strata.dc.html:339, 609, 687, 778, 134, 1020, 1109, 1205 |
| Texto | General Sans | Cuerpo (`body`), pesos 400 a 700 | La segunda opción, «Plus Jakarta Sans», nunca se carga | PROMPT_CLAUDE_CODE.md:73; Strata.dc.html:14, 21 |
| Códigos | JetBrains Mono | Códigos, números, reloj y valores; pesos 400, 500 y 700 | — | PROMPT_CLAUDE_CODE.md:74; Strata.dc.html:16, 737, 1151 |
| Eyebrow | 11px, 700, mayúsculas, .13em, #0369A1 | Encabezados de página y de sección | Variantes de 11.5px/.1em (examen) y 10.5px/.12em sobre oscuro (3.2) | PROMPT_CLAUDE_CODE.md:76; Strata.dc.html:231, 608 |
| Entradilla | 17px, #5B5545 | Encabezados de página y hero | line-height de 1.55 a 1.6 | PROMPT_CLAUDE_CODE.md:78; Strata.dc.html:142, 340, 610 |
| Tarjeta de vidrio | Fondo rgba(255,255,255,.72), blur 14px, borde 1px rgba(255,255,255,.92), radio 24px, sombra 0 20px 44px -28px rgba(15,23,42,.28) | Tarjetas principales del catálogo, builder, stats, tablas y fin | En la home, hover con elevación y sombra 0 32px 60px -28px rgba(15,23,42,.34) | PROMPT_CLAUDE_CODE.md:82-85; Strata.dc.html:239, 363, 630, 1210 |
| Tarjeta secundaria | Fondo rgba(255,255,255,.85), borde #EFE9DF, radio 18px | Vista previa del candidato, líneas y totales del carrito | — | PROMPT_CLAUDE_CODE.md:86; Strata.dc.html:511, 1270, 1303 |
| Radios | 14px en controles y 999px en pastillas | 14 en inputs del builder, modales y botones del builder; 999 en pastillas y badges | Inputs y CTA del candidato usan 12; stepper y chips de dimensión, 10; acción de tabla y chips de categoría, 9; chip segmentado, 8 (3.2) | PROMPT_CLAUDE_CODE.md:87; Strata.dc.html:369, 68, 1044, 665, 757, 623 |
| Halos de fondo | Tres halos radiales fijos: coral 20 %, celeste 20 % y navy 10 %, deriva de 18s | Lienzo raíz, en fase y con `glowDrift` | La home tiene su propio juego: absoluto, .26/.24/.12 y el celeste en top 200 | PROMPT_CLAUDE_CODE.md:88; Strata.dc.html:47-50, 97-99 |
| Contenido | Centrado, máximo 1200px, padding 48px 34px 88px | Pantallas internas | Home 0 34px 72px; acceso 48px 24px; examen 44px 28px 64px; fin 48px 28px | PROMPT_CLAUDE_CODE.md:93; Strata.dc.html:332, 108, 996, 1164, 1200 |
| Barra superior | Sticky, rgba(250,248,245,.78), blur 16px | TopBar de empresa y de admin, z-index 30 | Sin borde ni sombra. La barra del examen usa .8 | PROMPT_CLAUDE_CODE.md:95; Strata.dc.html:53, 1141 |
| Logo | Salamandra que regresa al inicio | Topbar del shell | No enlaza en el header de la home ni en la barra del examen | PROMPT_CLAUDE_CODE.md:96; Strata.dc.html:55-56, 111-114, 1143 |
| Enlace activo | Subrayado coral de 2px | `nav()`: activo #0F172A/600, inactivo #6B6558/500 | — | PROMPT_CLAUDE_CODE.md:97; Strata.dc.html:1770-1774 |
| Pastilla de usuario | A la derecha, con el usuario o la empresa | Avatar de iniciales y nombre | En el prototipo no abre nada | PROMPT_CLAUDE_CODE.md:98; Strata.dc.html:68-71, 82-85 |
| Pie de página | En todas las pantallas internas | Solo en el shell (catálogo, inventario, panel, resultados y builder) | Falta en acceso, examen y fin; la home tiene el suyo | PROMPT_CLAUDE_CODE.md:99; Strata.dc.html:1230, 2011, 312-324 |
| Adaptación | Desktop-first, usable hasta 360px | Solo flex-wrap y grids auto-fit | No hay media queries de ancho (ver «Responsive») | PROMPT_CLAUDE_CODE.md:100; Strata.dc.html:42 |
| Entrada de pantalla | Fade y elevación de 14px en 0.5s | `screenIn` | Añade scale(.992) y la curva cubic-bezier(.22,.61,.36,1) | PROMPT_CLAUDE_CODE.md:104; Strata.dc.html:31, 332 |
| Escalonado | 55ms entre tarjetas | `riseIn` del catálogo | Las filas de tabla usan 28 ms | PROMPT_CLAUDE_CODE.md:105; Strata.dc.html:1802, 1843 |
| Transición de hover y estado | 0.18s | Regla global en `button, a, input, td, th` | Algunos elementos usan .2 o .22s | PROMPT_CLAUDE_CODE.md:106; Strata.dc.html:41, 137, 239 |
| Movimiento reducido | Animaciones desactivadas y mascota quieta u oculta | Regla global de .01ms | No afecta a GSAP ni a los retardos del escalonado | PROMPT_CLAUDE_CODE.md:107; Strata.dc.html:42 |

### 3.2 Valores adicionales del prototipo

| Grupo | Valor | Uso | Evidencia |
|---|---|---|---|
| Color · superficie | #FFFFFF | Tarjetas blancas, inputs con foco y botones secundarios | Strata.dc.html:343, 888, 1011, 1044 |
| Color · superficie | #FCFBF9 / #FDFCFA | Input neutro del candidato y opción apagada de la demo / hover de fila y pie de tabla | Strata.dc.html:1111, 2051, 2184 / 455, 734, 764 |
| Color · superficie | #F1EDE4 | Pista de los controles segmentados | Strata.dc.html:136, 621, 713, 814 |
| Color · superficie | rgba(15,23,42,.42) | Scrim del drawer y de los modales | Strata.dc.html:1250, 1326, 1379 |
| Color · texto | #3D3A33 | Celdas de tabla, labels del candidato y valores de totales | Strata.dc.html:749, 1039, 1304 |
| Color · texto | #857A66 | Números «01» a «03» de los pasos | Strata.dc.html:278, 290, 302 |
| Color · texto | #475569 / #8B8574 | Texto de la pastilla de saldo / trazo de los íconos de input y del reloj | Strata.dc.html:640 / 647, 1043, 1150 |
| Color · texto sobre oscuro | #FFFFFF, #CBD5E1, #B6C4DC, #8FA3C4, #7DA2D9, #475569 | Títulos, metadatos, rótulos, eyebrows y separadores sobre #0F172A | Strata.dc.html:420, 581, 881-882, 1023-1024 |
| Color · marca | #DBEAFE | Iniciales sobre el avatar navy | Strata.dc.html:69, 83 |
| Color · acento | #F4574F | Hover de los CTA coral («×» y «Quitar» usan #FF6B6B en hover) | Strata.dc.html:145, 671, 1077, 413, 1278 |
| Color · tinte celeste | #EFF9FE, #E6F6FE, #F5FCFF, #F2FAFE, #BAE6FD | Fondos de selección, En uso y Enviada, chips de código, filas seleccionadas, consentimiento activo y bordes informativos | Strata.dc.html:411, 1767, 1833, 1917, 2188 |
| Color · tinte celeste (texto) | #075985, #0C4A6E | Texto sobre celeste; niveles 70-79 y <70 | Strata.dc.html:412, 1940, 1960 |
| Color · tinte navy | #E8ECF7 | Disponible y Completado, chip de peso y tag navy | Strata.dc.html:462, 1832, 2060 |
| Color · tinte coral | #FFF1F1, #FFD9D9, #B93A34 | Insignia «Sin crear cuenta», tag coral y fondo del ícono del badge | Strata.dc.html:201, 266-268, 2059 |
| Color · neutro cálido | #F0EDE5 / #A8A296 | Consumida y Código enviado, divisores de fila y pistas / punto neutro y rango bajo | Strata.dc.html:734, 940, 1835 / 1484 |
| Color · borde | #E5E0D8 | Tarjeta del acceso, input neutro del candidato y segmentados | Strata.dc.html:621, 1011, 2184 |
| Color · borde | #EDE9E0 | Divisores de cabecera y pie de tarjetas y modales | Strata.dc.html:443, 709, 1328 |
| Color · borde | #D6CFC2 | Botones secundarios, aro de radio y bordes punteados | Strata.dc.html:343, 1264, 1768 |
| Color · borde | #E2E8F0 / #CBD5E1 | Tarjetas blancas del reporte y de la pregunta / hover de la tarjeta del catálogo | Strata.dc.html:888, 1170 / 630 |
| Color · borde | #E0D9CB, #DCD5C8, #C9C2B4, #D2CBBD | Borde de «Previsualizar», conector, puntos separadores y casilla inactiva, puntos separadores del acceso | Strata.dc.html:255, 272, 247, 2190, 1127 |
| Color · estado válido | #A7D8B8, #FAFDFB, #16A34A | Borde y fondo del input válido, check y «Todo listo para comenzar» | Strata.dc.html:1047, 2184-2187 |
| Color · estado verificado | #22C55E, #BBF7D0, rgba(134,239,172,.34), rgba(22,163,74,.18) | Insignia «Licencia verificada» y punto «Guardado» de la demo | Strata.dc.html:173, 1015-1017 |
| Color · halos de la home | rgba(255,107,107,.26), rgba(56,189,248,.24), rgba(30,58,138,.12) | Juego propio de la home, con gradientes transparentes al 70 % | Strata.dc.html:97-99 |
| Color · datos | Polígono #0EA5E9 con relleno rgba(14,165,233,.20), vértices #1E3A8A, retícula #E7E2D8, hexágono #F7FBFE/#DCE6EF; barras ≥80 #1E3A8A, ≥70 #0EA5E9, <70 #38BDF8 | Radar y barras del reporte | Strata.dc.html:895-906, 1959 |
| Superficie | Paso translúcido: rgba(255,255,255,.66), borde 1px rgba(255,255,255,.9), radio 22, sin blur | Pasos de «Cómo funciona» | Strata.dc.html:273 |
| Superficie | Blanca: #fff, borde 1px #E2E8F0 (o #E5E0D8), radio 18; la demo usa radio 26 | Reporte, pregunta, acceso y demo | Strata.dc.html:169, 888, 1011, 1170 |
| Superficie | Oscura: #0F172A, radio 18 (o 16) | Vista previa, simulador, banner y tarjeta de código | Strata.dc.html:419, 578, 876, 1333 |
| Superficie | Punteada: #FAF8F5 (o #fff) con borde 1px dashed #D6CFC2 | Vista previa del candidato, carrito vacío y «+ Añadir dimensión» | Strata.dc.html:416, 509, 1264 |
| Superficie | Pastilla: rgba(255,255,255,.8), borde 1px #EBE5DA, radio 999 | Pastilla de usuario y eyebrow del hero | Strata.dc.html:68, 129 |
| Radio | 99 (barras) · 50 % (puntos, avatares, radios) | Formas redondas | Strata.dc.html:69, 177 |
| Radio | 26 · 24 · 22 · 20 · 18 · 16 | Demo e ícono del fin · vidrio · pasos · modal y badge · tarjetas blancas, secundarias y oscuras · CTA del hero, burbuja y banner | Strata.dc.html:103, 145, 169, 239, 273, 888, 1202, 1327 |
| Radio | 13 · 12 · 10 · 9 · 8 · 7 · 6 · 5 | Opciones del examen y toast · CTA y controles del candidato · stepper y chips de dimensión · acción de tabla y chips de categoría · chip segmentado y paginación · copiar · etiquetas y casilla · chip de código | Strata.dc.html:376, 411, 460, 500, 623, 738, 757, 795, 864, 1044, 1069, 1077, 1175, 1421 |
| Sombra | Hover del vidrio 0 32px 60px -28px rgba(15,23,42,.34); paso 0 22px 44px -26px rgba(15,23,42,.28) | Elevación al hover | Strata.dc.html:239, 273 |
| Sombra | 0 40px 80px -34px rgba(15,23,42,.32), 0 10px 26px -18px rgba(15,23,42,.16) · 0 22px 44px -22px rgba(15,23,42,.3) · 0 24px 48px -22px rgba(15,23,42,.32) | Tarjeta demo y badges | Strata.dc.html:169, 200, 210 |
| Sombra | Modal 0 24px 60px rgba(15,23,42,.24) · drawer -14px 0 40px rgba(15,23,42,.18) · toast 0 12px 34px rgba(15,23,42,.3) · burbuja 0 18px 38px -18px rgba(15,23,42,.5) | Overlays | Strata.dc.html:103, 1251, 1327, 1421 |
| Sombra | 0 1px 2px rgba(15,23,42,.07) · 0 3px 10px -3px rgba(15,23,42,.18) · 0 6px 18px -12px rgba(15,23,42,.2) · 0 4px 12px -6px rgba(15,23,42,.18) · 0 1px 3px rgba(15,23,42,.28) | Chip activo, thumb, eyebrow, caja de ícono y perilla | Strata.dc.html:129, 137, 275, 970, 1759 |
| Sombra coral | 0 12px 30px -12px rgba(255,107,107,.75), en hover 0 18px 40px -12px rgba(255,107,107,.85) · 0 10px 24px -14px rgba(255,107,107,.9) · 0 6px 18px rgba(255,107,107,.24), en hover 0 9px 22px rgba(255,107,107,.3) | CTA del hero, «Comprar en 1 clic» y CTA del acceso | Strata.dc.html:145, 256, 1077, 1113 |
| Foco | Borde #0EA5E9, fondo #fff y 0 0 0 3px rgba(56,189,248,.16) | Único foco diseñado (inputs del candidato); ver 3.4 | Strata.dc.html:1044, 1059, 1111 |
| Filtro | drop-shadow(0 14px 22px rgba(15,23,42,.2)) | Mascota | Strata.dc.html:101 |
| Tipografía · familia | «Plus Jakarta Sans» (no se carga) | Segunda opción del cuerpo y etiquetas del radar, sin fallback genérico | Strata.dc.html:21, 907-912 |
| Tipografía · peso | 500 · 600 · 700 · 800 | Inactivo y cuerpo · activo, botones y labels · títulos y énfasis · cifras. El 800 de General Sans no se carga y se ve como 700; solo el H1 del fin usa Satoshi 800 | Strata.dc.html:22, 660, 1205, 1772, 1773 |
| Tipografía · escala | 52 / 1.06 / -.03em | Display del hero | Strata.dc.html:134 |
| Tipografía · escala | 34 / 1.15 y 30 / 1.2, ambos -.025em | H2 de la home | Strata.dc.html:232, 265 |
| Tipografía · escala | 32/800/1.2 · 25/1.32 · 24/1.3 · 23/1.4/-.015em | H1 del fin, H1 del acceso (pasos 2 y 1) y pregunta del examen | Strata.dc.html:1020, 1109, 1172, 1205 |
| Tipografía · escala | 20/1.35 · 19/1.28 · 18/-.01em · 16.5/1.3 · 16 · 15.5 | H3 de la demo, tarjeta de la home, título de modal, paso y tarjeta del catálogo, H3 de builder y reporte | Strata.dc.html:180, 244, 281, 364, 445, 643, 1329 |
| Tipografía · escala | 15 · 14.5 · 14 · 13.5 · 13 | Cuerpo y botones | Strata.dc.html:61, 116, 145, 343, 1044 |
| Tipografía · escala | 12.5 · 12 · 11.5 · 11 · 10.5 · 10 · 9.5 | Metadatos, ayudas, labels, notas, micro-rótulos, th y categorías | Strata.dc.html:171, 192, 246, 368, 634, 724, 1236 |
| Tipografía · eyebrow | 11.5/.1em, 10.5/.12em sobre oscuro y 10.5/.13em | Variantes del eyebrow del brief | Strata.dc.html:420, 1167, 1334 |
| Tipografía · mono | 30/700/.16em · 20/700/.14em · 13/700/.04em · 10.5/700/.1em | Código grande, input de código, código en tabla y contador | Strata.dc.html:171, 737, 1111, 1335 |
| Tipografía · cifras | 29/700 Satoshi · 29/800 · 27/800 · 23/800 · 21/800 · 20/800 · 15/800 | Precio de la home, índice, saldo, precio del catálogo, vista previa, total y resumen | Strata.dc.html:251, 429, 660, 699, 798, 929, 1308 |
| Tipografía · tracking | -.03 · -.025 · -.02 · -.015 · -.01 · .01 · .02 · .04 · .06 · .08 · .1 · .12 · .13 · .14 · .16 em | Del display a mayúsculas pequeñas y códigos | Strata.dc.html:22, 134, 231, 232, 315, 420, 541, 724, 737, 1018, 1039, 1111, 1172, 1329, 1335 |
| Tipografía · line-height | 1 · 1.06 · 1.15 · 1.2 · 1.28 · 1.3 · 1.32 · 1.35 · 1.4 · 1.45 · 1.5 · 1.55 · 1.6 | De cifras a párrafos | Strata.dc.html:134, 142, 180, 187, 232, 244, 281, 340, 798, 1020, 1072, 1172, 1205 |
| Espaciado · home | 0 34px 72px; secciones de 64/40, 56 y 64; footer +64 | Home | Strata.dc.html:108, 127, 228, 263, 312 |
| Espaciado · barras | Topbar 20px 34px, gap 30, row-gap 12, nav 24; examen 15px 28px | Barras | Strata.dc.html:54, 60, 1142 |
| Espaciado · encabezado | gap 20-24; margin-bottom 22-24; eyebrow con mb 7; entradilla con mt 14 | PageHeader | Strata.dc.html:333, 606, 608, 610 |
| Espaciado · grids | 18 (catálogo, builder, reporte) · 14 (stats) · 20 (home) · 52 (hero) · 12 (fin) | Separación entre tarjetas | Strata.dc.html:127, 237, 362, 628, 696, 887, 1208 |
| Espaciado · tarjetas | 24 (estándar) · 16 (stats) · 26 (demo) · 34 (pregunta) · 22 (punteada) · 14 (línea del carrito) | Padding interno | Strata.dc.html:169, 363, 509, 698, 1170, 1270 |
| Espaciado · overlays | Modal 22px 24px 18px / 22px 24px / 18px 24px; drawer 20px 22px | Cabecera, cuerpo y pie | Strata.dc.html:1252, 1261, 1328, 1332, 1367 |
| Espaciado · controles | Input 12px 14px (builder) y 14px 42px 14px 40px (candidato); botón 12-13px 17-19px; CTA 14-16px 22-28px; th 11px 14-18px; td 13px 14-18px (panel: 14 o 9 de padding vertical) | Controles y tablas | Strata.dc.html:145, 343, 369, 690, 724, 735, 1044, 2101 |
| Ancho | 1200 · 1080 · 900 · 760 · 600 · 560 · 540 · 520 · 470 · 440 · 430 · 408 · 330 · 232 · 100 | Página, topbar y footer · reporte · barra del examen y min-width de tablas · cuerpo del examen · acceso · fin · modales (540 y 520) · entradilla del hero · texto del fin · demo · drawer · radar · burbuja · mascota | Strata.dc.html:54, 101, 103, 142, 169, 721, 875, 894, 997, 1142, 1165, 1201, 1206, 1251, 1327, 1380 |
| Ancho · mínimos de grid | 420 · 320 · 300 · 292 · 206 · 190 · 150 | Hero · paso 3 y reporte · catálogo exprés y paso 1 · catálogo · saldos · resumen · fin | Strata.dc.html:127, 237, 362, 530, 628, 696, 790, 887, 1208 |
| z-index | 0 halos · 1 main · 1 mascota · 2 contenido de la home · 4 burbuja · 10 barra del examen · 30 topbar · 60 drawer y modales · 70 selector de rol · 80 toast | Capas | Strata.dc.html:47, 53, 92, 101, 103, 108, 1141, 1249, 1325, 1378, 1421, 1429 |
| Movimiento · duración | .18 · .2 · .22 · .26 · .3 · .34 · .35 · .36 · .38 · .42 · .5 s | Hover y estado · CTA, color, switch y toast · elevación y modales · drawer · `popIn` y `bubbleIn` · `softIn` · progreso · thumb · `popIn` del fin · `rowIn` · `screenIn` y `riseIn` | Strata.dc.html:41, 137, 142, 145, 239, 332, 734, 1046, 1160, 1202, 1251, 1327 |
| Movimiento · curva | cubic-bezier(.22,.61,.36,1) de entrada · (.34,1.4,.64,1) y (.34,1.56,.64,1) de resorte · (.4,0,.2,1) estándar · (.32,.72,0,1) del drawer · ease e ease-in-out | Entradas, rebotes, toggles, drawer y bucles | Strata.dc.html:48, 96, 137, 145, 1046, 1251 |
| Movimiento · escalonado de filas | 28 ms | `rowIn` en Inventario y Candidatos | Strata.dc.html:1843, 1877 |
| Assets | strata-salamandra.png (barra, examen y pies), strata-mark.png (acceso) y mascota.png (home). strata-logo.png está en assets/ pero el prototipo no lo usa | Marca | Strata.dc.html:56, 314, 1006, 1143, 101; PROMPT_CLAUDE_CODE.md:11 |

### 3.3 Contraste

| Par | Contraste | ¿Cumple 4.5:1? | Dónde | Evidencia |
|---|---|---|---|---|
| Texto blanco sobre coral #FF6B6B | 2.78:1 | No | CTA primarios | Strata.dc.html:145, 671, 690, 1077, 1313 |
| Texto blanco sobre #F4574F (hover) | 3.32:1 | No | Hover de los CTA | Strata.dc.html:145, 671 |
| Texto blanco sobre #0EA5E9 | 2.77:1 | No | Chips activos (`chipSky`) y número del paso activo | Strata.dc.html:1763, 1902 |
| #0EA5E9 como texto sobre #FAF8F5 / sobre blanco | 2.61:1 / 2.77:1 | No | Hover de enlaces | Strata.dc.html:24, 149, 234 |
| #857A66 sobre #FAF8F5 | 3.98:1 | No | Números «01» a «03» de «Cómo funciona» | Strata.dc.html:278 |
| #16A34A sobre blanco | 3.30:1 | No | «Todo listo para comenzar» | Strata.dc.html:2187 |
| #6B6558 sobre #FAF8F5 / sobre #F0EDE5 | 5.46:1 / 4.95:1 | Sí | Texto terciario y badges Consumida y Código enviado | Strata.dc.html:365, 1835 |
| #756D5C sobre #FAF8F5 | 4.83:1 | Sí | Placeholder | Strata.dc.html:26 |
| #5B5545 sobre #FAF8F5 | 7.00:1 | Sí | Texto secundario | Strata.dc.html:142 |
| #3D3A33 sobre blanco | 11.34:1 | Sí | Celdas de tabla y labels | Strata.dc.html:749 |
| #0369A1 sobre blanco | 5.93:1 | Sí | Celeste para texto | Strata.dc.html:745 |
| Texto blanco sobre navy #1E3A8A | unos 10.4:1 | Sí | Alternativa del brief para los primarios | PROMPT_CLAUDE_CODE.md:63 |
| Tinta #0F172A sobre coral | unos 6.4:1 | Sí | Alternativa para conservar el coral | Strata.dc.html:145 |
| Bordes #E7E2D8 y #D6CFC2 sobre blanco | 1.29:1 y 1.55:1 | No aplica a texto; los bordes funcionales piden 3:1 | Inputs, stepper y aros de radio | Strata.dc.html:369, 665, 1768; design-tokens.md:3 |

### 3.4 Huecos del sistema

| Hueco | Situación en el prototipo | Referencia útil en el repo o el brief | Evidencia |
|---|---|---|---|
| Color y estado de error | No existen: ningún input tiene estado de error y los errores van por toast | El repo define `--color-error` #B3261E y exige ícono y texto | Strata.dc.html:1544-1548, 2184-2187; 2026-09-10-sales-site.md:279; design-tokens.md:18, :34 |
| Foco visible | Solo está diseñado en los inputs del candidato. Los botones y enlaces nativos dependen del anillo del navegador; los inputs y textareas del builder y del modal de asignación lo anulan con outline:none; los controles hechos con div o span (nav, pasos, stepper, chips, radios) no se pueden enfocar | El repo tiene un `:focus-visible` global; el brief exige foco visible | Strata.dc.html:1044, 1059, 1111, 369, 1388, 61-64, 353, 665-668; 2026-09-10-sales-site.md:403-407; PROMPT_CLAUDE_CODE.md:188 |
| Estado deshabilitado | Ningún botón se deshabilita: «Siguiente pregunta», «Iniciar Evaluación» y «Pagar y generar códigos» validan con un toast. Solo «Anterior» de la paginación tiene cursor not-allowed | El repo deshabilita los botones sin consentimiento o sin respuesta | Strata.dc.html:2087, 2194, 2207, 864; 2026-09-11-fase1-nucleo.md:2881, :2912 |
| Carga | No hay spinners, esqueletos ni estados de carga en ninguna pantalla | El repo tiene el spinner de botón btn--loading y textos «Cargando…» | Strata.dc.html:9-1438; 2026-09-12-registro-login-crud-usuarios.md:1119-1129 |
| Vacío | Solo el carrito vacío | El brief exige carga, vacío y error en cada pantalla con API | Strata.dc.html:1263-1268; PROMPT_CLAUDE_CODE.md:187 |
| Navegación móvil | Sin menú: las barras solo hacen flex-wrap | El repo tiene menú hamburguesa | Strata.dc.html:54, 110; 2026-09-12-registro-login-crud-usuarios.md:1545-1570 |
| Breakpoints | Ninguna media query de ancho; la tipografía no escala | El brief pide que funcione hasta 360px | Strata.dc.html:42; PROMPT_CLAUDE_CODE.md:100 |
| Color del primario | Coral con texto blanco (2.78:1) | El brief asigna los primarios al navy | Strata.dc.html:145; PROMPT_CLAUDE_CODE.md:63, :68 |
