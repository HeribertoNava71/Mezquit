# Decisiones del rediseño

Decisiones tomadas a partir del brief, decisiones abiertas que necesitan aprobación del dueño y plan por fases. Citas en formato archivo:línea, igual que en [mapa.md](mapa.md); dentro de una celda o de una viñeta, «:NNN» repite el último archivo citado.

> El frontend se reconstruyó desde los planes porque `frontend/` y `backend/` son gitlinks vacíos. Varias decisiones dependen de validar ese inventario contra el código real (D-01, [PB-01](pendientes-backend.md#pb-01)).

## Decisiones tomadas

| ID | Decisión | Motivo | Evidencia |
|---|---|---|---|
| T-01 | Se conservan React 19, TypeScript, Vite y react-router-dom v7 en modo declarativo. | Regla 2: no cambiar stack, framework ni router. | PROMPT_CLAUDE_CODE.md:38; 2026-09-10-sales-site.md:9; 2026-09-10-multipage-site.md:51-78 |
| T-02 | Se conservan las URLs y los contratos de datos. Toda ruta nueva o cambio de comportamiento de una ruta se propone antes (D-07). | Regla 4. | PROMPT_CLAUDE_CODE.md:40 |
| T-03 | No se modifica el backend. Lo que falte va a pendientes-backend.md. | Regla 1. | PROMPT_CLAUDE_CODE.md:37 |
| T-04 | Los tokens son CSS custom properties en `src/styles/tokens.css`, dentro del CSS vanilla actual (un .css por componente). Sin Tailwind ni CSS-in-JS. | El brief pide variables CSS o el mecanismo del stack y prohíbe copiar estilos inline. | PROMPT_CLAUDE_CODE.md:39, :58; 2026-09-10-sales-site.md:263-328 |
| T-05 | La paleta Mezquit (sage, hunter, brunswick…) y las fuentes Cormorant Garamond y DM Sans se reemplazan por la paleta STRATA y por Satoshi, General Sans y JetBrains Mono. docs/design-tokens.md se actualiza. | El sistema de diseño del brief sustituye al anterior. | PROMPT_CLAUDE_CODE.md:60-78; docs/design-tokens.md:1-40; 2026-09-10-sales-site.md:336-350 |
| T-06 | GSAP 3.12 y MotionPathPlugin se instalan por npm y solo se usan en la mascota. | GSAP ya está aprobado; no por CDN. | PROMPT_CLAUDE_CODE.md:38, :162 |
| T-07 | Se trabaja en la rama feat/rediseno-strata con un commit por fase o por pantalla. | Regla 6. | PROMPT_CLAUDE_CODE.md:42 |
| T-08 | El rol sale de la sesión: visitante (sin user), usuario sin organización, RR. HH. (organization_id), super admin (is_platform_admin) y candidato (token). No se portan el selector de rol ni los avisos «fuera del alcance». | El selector es solo del prototipo. | PROMPT_CLAUDE_CODE.md:21; 2026-09-12-registro-login-crud-usuarios.md:1469-1474; 2026-09-12-fase2-panel-rh.md:1895-1901 |
| T-09 | Ningún flujo sin backend se simula: nada de carrito, pagos, códigos generados en el cliente, envíos ficticios ni descargas falsas. | Regla de oro. | PROMPT_CLAUDE_CODE.md:33 |
| T-10 | Los datos del state y los valores fijos del prototipo no se portan; todo dato sale de la API o del código actual. | Son ficticios. | PROMPT_CLAUDE_CODE.md:20 |
| T-11 | En datos, validaciones y reglas gana el repo: consentimiento sin premarcar y guardado antes del primer reactivo; no se avanza sin responder; «Atrás» solo con allows_back; categorías y conteos del catálogo desde la API; 1 crédito = 1 candidato; ningún texto promete resultados al candidato mientras el backend no los entregue. | Regla de oro y regla 5. | PROMPT_CLAUDE_CODE.md:28-33, :41; 2026-09-11-fase1-nucleo-design.md:89, :92-93; 2026-09-11-fase3-sitio-ventas-design.md:96; 2026-09-12-fase2-panel-rh-design.md:12 |
| T-12 | En apariencia, layout, componentes, navegación, estados de UI, microcopy y animación gana el prototipo, salvo que choque con T-11 o con AA. | Regla de oro. | PROMPT_CLAUDE_CODE.md:31 |
| T-13 | Primero los componentes base (Button, Input, Select, Card, Table, Badge, Toast, Modal, TopBar, Footer, PageHeader, PageLayout) y después las pantallas. | Orden del brief. | PROMPT_CLAUDE_CODE.md:109-117, :172 |
| T-14 | Toda pantalla que consume la API tiene estados de carga, vacío y error. | Criterio de aceptación. | PROMPT_CLAUDE_CODE.md:187 |
| T-15 | Contraste AA, teclado y foco visible; éxito y error con ícono y texto. | Criterio de aceptación. La regla de ícono y texto viene de docs/design-tokens.md:34, pero hoy solo la cumplen los errores por campo de /demo (⚠) y los estados de invitación (glifo y texto); el resto de avisos es solo texto con color. | PROMPT_CLAUDE_CODE.md:68, :188; docs/design-tokens.md:34; 2026-09-10-sales-site.md:2232; 2026-09-12-fase2-panel-rh.md:1503-1505 |
| T-16 | Sitio sin sidebar, contenido centrado a 1200 px con padding de 48/34/88 px; desktop-first y usable a 360 px. | Layout del brief. | PROMPT_CLAUDE_CODE.md:92-93, :100 |
| T-17 | Con prefers-reduced-motion se desactivan las animaciones y la mascota queda quieta u oculta. | Movimiento del brief. | PROMPT_CLAUDE_CODE.md:107 |
| T-18 | La mascota es un componente que limpia tweens, ticker y listeners al desmontarse. | Sin fugas al cambiar de ruta. | PROMPT_CLAUDE_CODE.md:168, :189 |
| T-19 | support.js y la sintaxis del editor no se portan. | Runtime del prototipo. | PROMPT_CLAUDE_CODE.md:10, :18 |
| T-20 | No se elimina ninguna función ni campo del frontend actual; lo que el prototipo no cubre se diseña con el mismo sistema. | Regla 5 y Fase 7. | PROMPT_CLAUDE_CODE.md:33, :41, :178 |
| T-21 | Cada fase cierra con build, lint y pruebas en verde y un resumen breve al dueño. | Brief. | PROMPT_CLAUDE_CODE.md:181 |
| T-22 | docs/rediseno/ contiene mapa, brechas, pendientes y decisiones, y se actualiza en cada fase. | Criterio de aceptación. | PROMPT_CLAUDE_CODE.md:191 |
| T-23 | Se conservan los dos juegos de halos del prototipo: el global, fijo (coral .2, celeste .2 y navy .1), y el de la home, absoluto y más intenso (.26/.24/.12, celeste en top 200 px). PageLayout tiene una variante `home`. | El prototipo manda en apariencia; el brief describe el juego global. | Strata.dc.html:47-50, :96-99; PROMPT_CLAUDE_CODE.md:31, :88 |

## Decisiones abiertas

Necesitan aprobación del dueño (PROMPT_CLAUDE_CODE.md:54).

> **Estado (2026-10-01).** El dueño aprobó todas las recomendaciones y pidió ejecutar las fases sin más preguntas («dale con las fases a full, no preguntes solo ejecuta»). La columna «Recomendación» pasa a ser la decisión vigente, con dos ajustes:
>
> - **D-04 se resuelve con la opción B.** No se pudo verificar que la licencia de Fontshare permita publicar los archivos de Satoshi y General Sans en un repo público. Por eso se cargan desde el CDN de Fontshare. JetBrains Mono se autohospeda con `@fontsource/jetbrains-mono` (licencia OFL).
> - **D-26 (nueva) · Frontend reconstruido como base.** PB-01 sigue abierto: el código real no apareció en el remoto ni en la máquina. Para no detener el rediseño, el frontend se reconstruye desde los planes de `docs/superpowers/plans` en la carpeta nueva `frontend-strata/`, en un commit separado (`chore(frontend): reconstruir…`), y el rediseño se construye encima. No se usa `frontend/` porque quitar su gitlink necesita aprobación explícita; reemplazarlo queda para la migración final (D-01). Las desviaciones de la reconstrucción quedan en [reconstruccion.md](reconstruccion.md). Cuando llegue el código real: diff contra ese commit base y portar las diferencias. El gitlink de `backend/` no se toca (regla 1).

| ID | Tema | Recomendación | Bloquea |
|---|---|---|---|
| D-01 | Código real | Monorepo | Fase 1 |
| D-02 | Prototipo en diseno/ | Mover y versionar sin uploads/ | — |
| D-03 | Marca | Strata | Fase 2 |
| D-04 | Fuentes | Autohospedar (verificar licencia) | Fase 1 |
| D-05 | Lint y pruebas | Vitest y Testing Library; Playwright en la Fase 8 | Fase 1 |
| D-06 | Navegación por rol | Opción A | Fase 2 |
| D-07 | Rutas nuevas y guardas | Aprobar 2 a 6 y 8; 1 con D-06 A | Fase 2 |
| D-08 | Licencias o créditos | Créditos | Fase 4 |
| D-09 | Checkout o solicitud | Solicitud de créditos | Fase 4 |
| D-10 | Asignación | Asistente como página y canales para compartir | Fase 4 |
| D-11 | Formulario del candidato | Sin formulario | Fase 3 |
| D-12 | Temporizador | Oculto | Fase 3 |
| D-13 | B2C | Selector orientado al candidato invitado | Fase 6 |
| D-14 | Reporte | Diseño del prototipo con datos reales, una sección por prueba | Fase 4 |
| D-15 | Test Builder | Posponer la Fase 5 | Fase 5 |
| D-16 | Resultados al candidato | Mantener la regla del repo | Fases 3 y 6 |
| D-17 | Props del prototipo | Propuesta de D-17 | — |
| D-18 | Afirmaciones de marketing | [PENDIENTE] u omitir | Fases 6 y 7 |
| D-19 | Primario y contraste | Navy | Fase 1 |
| D-20 | Transición de tokens | Alias temporales | Fase 1 |
| D-21 | Animación entre reactivos | softIn del prototipo | Fase 3 |
| D-22 | Toast e inline | Inline y toast de confirmación | Fase 1 |
| D-23 | Tablas en móvil | Tarjetas bajo 640 px | Fase 4 |
| D-24 | Ejemplo en la home | Quitarlo de la home | Fase 6 |
| D-25 | Eventos de integridad | Solo blur | Fase 3 |

<a id="d-01"></a>
### D-01 · Cómo obtener el código real

- **Contexto.** `frontend/` y `backend/` son gitlinks (modo 160000) sin `.gitmodules`; las carpetas están vacías y el código no está en GitHub. El plan evaluation-module hizo `git init` dentro de cada carpeta (2026-09-10-evaluation-module.md:611, :663), probable origen de los repos embebidos. Sin el código no se puede validar este inventario ni empezar la Fase 1.
- **Opciones.** A) Monorepo: quitar los gitlinks (`git rm --cached frontend backend`), copiar el código sin sus `.git` internos y versionarlo aquí. B) Submódulos: publicar los dos repos y agregar `.gitmodules` con `path` y `url`, fijados en los commits actuales. C) Trabajar sobre una copia local sin versionar.
- **Recomendación.** A. Un solo historial y una sola rama (feat/rediseno-strata); los commits por fase quedan completos; los planes ya tratan `frontend/` y `backend/` como carpetas del mismo repo. Lo ejecuta el compañero porque toca `backend/` ([PB-01](pendientes-backend.md#pb-01)).
- **Impacto.** Bloquea la Fase 1. Con B, cada fase necesita un commit en el repo del frontend y otro en este para mover el puntero.
- **Seguridad.** El plan versionó `backend/.env` y `frontend/.env` dentro de los repos embebidos (2026-09-10-evaluation-module.md:611, :664), y el repo Mezquit es público. Con B, publicar esos repos expondría su historial con las credenciales; con A, ese historial no viaja. Detalle en [PB-01](pendientes-backend.md#pb-01).

<a id="d-02"></a>
### D-02 · Mover el prototipo a `diseno/` y versionarlo

- **Contexto.** El brief cita `diseno/Strata.dc.html`, `diseno/support.js`, `diseno/assets/` y `diseno/uploads/`, y propone `npx serve diseno` (PROMPT_CLAUDE_CODE.md:7-14). Hoy el prototipo está sin versionar en «Plataforma Strata de evaluaciones psicométricas/», junto con el brief.
- **Opciones.** A) Mover a `diseno/` y versionar Strata.dc.html, support.js, assets/ y el brief, sin uploads/ (excluida en .gitignore). B) Dejarlo fuera del repo. C) Versionarlo completo.
- **Recomendación.** A. Coincide con las rutas del brief, mantiene estables las referencias por número de línea de estos documentos y excluye uploads/, que no va a producción (PROMPT_CLAUDE_CODE.md:12). Las imágenes que use el frontend (mascota.png, strata-salamandra.png, strata-logo.png y strata-mark.png, :11) se copian a `frontend/public/` o `src/assets/`.
- **Impacto.** Un commit `chore(diseno): versionar el prototipo aprobado`. Las rutas relativas `assets/…` del prototipo siguen funcionando.

<a id="d-03"></a>
### D-03 · Marca: Strata o Mez

- **Contexto.** El brief llama al producto STRATA (PROMPT_CLAUDE_CODE.md:1, :5) y el prototipo usa «Strata» y sus logos (Strata.dc.html:56-57, :1006-1007). El frontend usa SITE.name «Mezquit» o «Mez» (2026-09-10-sales-site.md:170; 2026-09-11-fase3-sitio-ventas-design.md:10), «Mez» escrito a mano en AppLayout, AdminLayout, el reporte de ejemplo y Ayuda (2026-09-12-fase2-panel-rh.md:1296, :1939; 2026-09-11-fase1-nucleo.md:3124; 2026-09-11-fase3-sitio-ventas.md:838), un title «Mezquit — Pruebas psicométricas para empresas» (2026-09-10-sales-site.md:445) y un logo generado desde backend/img/mezquite.png (:71-106). En el backend se siembran la organización «Mez (operación)» y el operador «Operador Mez» con admin@mez.dev (2026-09-12-registro-login-crud-usuarios.md:93-98, :114-116).
- **Opciones.** A) Strata en todo el frontend. B) Mantener Mez. C) Strata como producto y Mez como titular legal en el pie.
- **Recomendación.** A, con SITE.name como única fuente y sin nombres escritos a mano. Los datos sembrados en el backend se verían en la pastilla y en /admin/usuarios: renombrarlos y revisar los textos de los correos es del compañero ([PB-33](pendientes-backend.md#pb-33)). Mientras tanto, el frontend muestra esos datos tal como llegan.
- **Impacto.** Cambian title, OG, favicons (el script de favicons necesita otro origen), textos, alt y logos. La razón social sigue como [PENDIENTE].

<a id="d-04"></a>
### D-04 · Fuentes

- **Contexto.** Satoshi y General Sans son de Fontshare (PROMPT_CLAUDE_CODE.md:72-73); el prototipo las carga del CDN de Fontshare y JetBrains Mono de Google Fonts (Strata.dc.html:11-16). El frontend autohospeda sus fuentes con @fontsource (2026-09-10-sales-site.md:336-350; 2026-09-11-fase3-sitio-ventas-design.md:23).
- **Opciones.** A) Autohospedar Satoshi (400-800) y General Sans (400-700) con @font-face y archivos woff2 en el repo; JetBrains Mono con @fontsource/jetbrains-mono (400, 500 y 700). B) CDN de Fontshare para Satoshi y General Sans; @fontsource para JetBrains Mono. C) Todo por CDN.
- **Recomendación.** A: mantiene la política actual (sin terceros al cargar la página, funciona sin red en desarrollo) y permite preload. Las fuentes no dicen si la licencia de Fontshare permite autohospedar; hay que verificarlo antes de versionar los archivos. Si no lo permite, B.
- **Impacto.** Una dependencia pequeña nueva (@fontsource/jetbrains-mono); se retiran @fontsource/cormorant-garamond y @fontsource-variable/dm-sans (2026-09-10-sales-site.md:61-65).

<a id="d-05"></a>
### D-05 · Lint y pruebas del frontend

- **Contexto.** El brief exige build, lint y pruebas en verde por fase (PROMPT_CLAUDE_CODE.md:181). Los planes solo usan `npx tsc --noEmit` y `npm run build`, y ninguno muestra package.json, ESLint ni un runner de pruebas (2026-09-11-fase3-sitio-ventas.md:1295-1303). Las capturas usan `npx playwright screenshot` sin declararlo (2026-09-10-multipage-site.md:1449-1458). Si el proyecto salió de la plantilla react-ts de Vite, ya tendría ESLint (conocimiento externo, sin evidencia).
- **Opciones.** A) Vitest, @testing-library/react y jsdom para componentes base y lógica pura (extracción del token, mapeo de estados, CSV, referencias del ledger), más ESLint si falta. B) Solo tsc, build y lint. C) A más Playwright para recorridos contra el backend real.
- **Recomendación.** A desde la Fase 1 y C en la Fase 8. Son devDependencies, pero el brief pide preguntar antes de agregar dependencias grandes (PROMPT_CLAUDE_CODE.md:38).
- **Impacto.** Scripts `lint`, `test` y `typecheck` en package.json; un commit de configuración al inicio de la Fase 1.

<a id="d-06"></a>
### D-06 · Navegación y barra superior por rol

- **Contexto.** Prototipo: RR. HH. con Tests · Mis licencias · Candidatos · Resultados (Strata.dc.html:61-64); super admin con Test Builder · Reactivos · Algoritmos (:76-78); nav pública sin destinos (:116-119). Repo: AppLayout con Resumen · Evaluaciones · Créditos (2026-09-12-fase2-panel-rh.md:1298-1300); AdminLayout sin navegación (:1936-1944); Header público con Pruebas · Cómo funciona · Precios · Ayuda (2026-09-12-registro-login-crud-usuarios.md:1497-1502). «Panel de RH» está en el menú de usuario y en el panel móvil del Header público; «Operación» y «Salir», solo en el menú de usuario, que se oculta por debajo de 768 px (:1469-1474, :1558-1562, :1596). AppLayout no enlaza a /admin (2026-09-12-fase2-panel-rh.md:1294-1306): el operador que entra por /login cae en /app sin camino a /admin, y en móvil no hay «Salir» desde el sitio público.
- **Opciones.**
  - A) Estructura del prototipo con destinos reales. RR. HH.: Tests → /app/pruebas (ruta nueva), Créditos (en lugar de «Mis licencias») → /app/creditos, Candidatos → /app/evaluaciones, Resultados → /app. Super admin: Solicitudes → /admin/creditos, Usuarios → /admin/usuarios. Pública: Tests → /pruebas, Para empresas → /demo, Cómo funciona → /como-funciona, Precios → /precios; Ayuda pasa al pie y al menú móvil.
  - B) Igual que A, pero Tests → /pruebas (sin ruta nueva; el usuario sale del panel).
  - C) Navegación actual del repo con el estilo del prototipo.
- **Recomendación.** A. Conserva la navegación aprobada y todas las rutas, y la pastilla con menú en las tres barras da el camino entre zonas. El menú móvil incluye Salir y Operación. «Mis licencias» cambia de nombre porque no hay licencias (D-08). La barra pública es sticky y translúcida en las páginas públicas (PROMPT_CLAUDE_CODE.md:94-95) y, en la home, va dentro del contenido como en el prototipo (Strata.dc.html:110). Detalle en la sección 3 de [mapa.md](mapa.md).
- **Impacto.** Cambian Header, AppLayout y AdminLayout (Fase 2). /app pasa a ser «Resultados», con estadísticas y últimas completadas (PB-05 o agregación limitada).

<a id="d-07"></a>
### D-07 · Rutas nuevas y cambios de comportamiento de rutas

- **Contexto.** La regla 4 pide proponer cualquier cambio de ruta (PROMPT_CLAUDE_CODE.md:40). Ninguna propuesta cambia una URL existente.
- **Propuestas (aprobar una por una).**
  1. `/app/pruebas`: catálogo dentro del panel con GET /api/catalog (solo con D-06 A).
  2. Índice de `/admin` → redirige a `/admin/creditos` (hoy muestra el layout vacío, 2026-09-12-fase2-panel-rh.md:2027-2029).
  3. Guarda de organización en `/app/*`: sin organization_id → `/perfil` con aviso. Lo pide la spec (2026-09-12-registro-login-crud-usuarios-design.md:8) y evita los 500 de GET /api/credits y POST /api/assessments con organización nula (2026-09-12-fase2-panel-rh.md:899-900, :243, :412-422; PB-03); hoy RequireAuth solo revisa la sesión (2026-09-11-fase1-nucleo.md:2135-2140).
  4. Guarda de sesión en `/perfil`: sin sesión → `/login` (hoy queda «Cargando…» sin fin, 2026-09-12-registro-login-crud-usuarios.md:1743, :2013).
  5. `/login` y `/registro` con sesión activa → `/app` o `/perfil`.
  6. RequireAuth recuerda la ruta de origen y vuelve a ella tras el login (hoy no, 2026-09-11-fase1-nucleo.md:2138).
  7. Ruta de restablecimiento de contraseña, solo cuando exista PB-23.
  8. Sesión vencida. Hoy el cliente `api` no tiene interceptores (2026-09-11-fase1-nucleo.md:2028-2033) y AuthProvider solo pide GET /api/user al montar (:2112-2114): si la sesión expira o se cierra en otra pestaña, `user` sigue lleno, las llamadas responden 401 y las pantallas se quedan en «Cargando…» o vacías (2026-09-12-fase2-panel-rh.md:1513, :1524; 2026-09-12-registro-login-crud-usuarios.md:1717, :1743). Propuesta: ante un 401 o 419 en /app, /admin o /perfil, limpiar `user` y redirigir a /login conservando la ruta de origen (punto 6), con el aviso «Tu sesión expiró. Vuelve a entrar.»; un 419 en un POST público se reintenta una vez después de llamar a csrf().
- **Recomendación.** Aprobar 2 a 6 y 8; 1 si se elige D-06 A; 7 cuando el backend lo tenga.
- **Impacto.** Cambios en App.tsx, en las guardas y en el cliente `api` (Fase 2), y pruebas de navegación.

<a id="d-08"></a>
### D-08 · Licencias por código o créditos (C-01)

- **Contexto.** Ver [C-01](brechas.md#c-01).
- **Opciones.** A) Modelo del repo en la UI: «Créditos», movimientos y estados de invitación. B) Licencias por prueba con códigos (PB-10, PB-11, PB-12). C) Inventario de invitaciones mostradas como códigos.
- **Recomendación.** A.
- **Impacto.** «Mis licencias» pasa a «Créditos»; el inventario muestra movimientos; los badges usan los cuatro estados de invitación. Con B, el backend cambia el ledger y el consumo.

<a id="d-09"></a>
### D-09 · Carrito y checkout o solicitud de créditos (C-02)

- **Contexto.** Ver [C-02](brechas.md#c-02).
- **Opciones.** A) Drawer «Solicitar créditos» (cantidad y nota). B) Pago en línea (PB-09) y precios (PB-10). C) Adquisición solo por /demo.
- **Recomendación.** A.
- **Impacto.** El drawer del prototipo se usa sin métodos de pago, impuestos ni total; /precios conserva «[PENDIENTE: precio]».

<a id="d-10"></a>
### D-10 · Asignación de un test o evaluaciones (C-03)

- **Contexto.** Ver [C-03](brechas.md#c-03). Canales del modal «Enlace de invitación generado» (Strata.dc.html:1355-1365): «Correo» representa abrir un borrador en el cliente de correo de RR. HH. y «WhatsApp», preparar un mensaje (en el prototipo solo muestran un toast que lo anuncia, :1990-1991); «Copiar link» sí usa el portapapeles (:1992). No son el correo automático del backend: ese se envía siempre al crear la evaluación (2026-09-11-fase1-nucleo.md:1459) y equivale al modo «Invitación por email» del modal de asignación (Strata.dc.html:1984). La pantalla actual de enlaces ya pide compartirlos «por correo o WhatsApp» (2026-09-11-fase1-nucleo.md:2602), igual que HowItWorks (2026-09-10-sales-site.md:1853).
- **Opciones.** A) Asistente en /app/evaluaciones/nueva como página, con el lenguaje del modal. B) El mismo asistente como modal sobre /app/evaluaciones, conservando la URL. C) Además de A, una «asignación rápida» de un candidato con nombre de evaluación generado.
- **Recomendación.** A: es enlazable (el registro redirige ahí, 2026-09-12-registro-login-crud-usuarios.md:1192), accesible y simple. Subdecisiones:
  - Agregar el teléfono opcional del candidato, que el backend ya acepta (2026-09-11-fase1-nucleo.md:1403).
  - Canales para compartir, como decisión de producto: a) portar los tres tiles en la pantalla de enlaces y en el detalle de la evaluación, con el enlace real de cada invitación, que devuelven POST /api/assessments y GET /api/assessments/{id} (2026-09-11-fase1-nucleo.md:1460, :1484). Correo = `mailto:{correo}?subject=…&body={enlace}`, WhatsApp = `https://wa.me/?text={enlace}`, Copiar = portapapeles. No necesitan backend ni simulan nada. b) Ofrecer solo «Copiar enlace», como hoy. Recomendación: a), con microcopy que aclare que la invitación ya se envió por correo.
- **Impacto.** «Asignar por email» y «Generar enlace / código» se unen en un solo CTA, «Invitar candidatos». Con la opción a) de canales, el CopyField de la pantalla de enlaces y del detalle lleva los tres tiles.

<a id="d-11"></a>
### D-11 · Formulario del candidato (C-04)

- **Contexto.** Ver [C-04](brechas.md#c-04).
- **Opciones.** A) Sin formulario. B) Formulario que no guarda (simulación; descartada). C) Mostrar y confirmar el nombre con PB-14.
- **Recomendación.** A ahora; C cuando exista PB-14.
- **Impacto.** El paso 2 del acceso queda en invitación verificada, consentimiento e instrucciones.

<a id="d-12"></a>
### D-12 · Temporizador del examen (C-05)

- **Contexto.** Ver [C-05](brechas.md#c-05).
- **Opciones.** A) Ocultarlo. B) Tiempo transcurrido, solo informativo. C) Límite real con PB-15.
- **Recomendación.** A; B si el dueño quiere un reloj visible. La prop `mostrarTemporizador` no se porta.
- **Impacto.** La barra del examen muestra prueba, organización, guardado y progreso.

<a id="d-13"></a>
### D-13 · B2C «Para mí» (C-06)

- **Contexto.** Ver [C-06](brechas.md#c-06).
- **Opciones.** A) Ocultar el selector. B) Selector con «Para mí» orientado al candidato invitado. C) B2C real (PB-21, PB-09 y cambio de C-09).
- **Recomendación.** B. Modo Empresa: CTA «Crear cuenta de empresa» (/registro) y enlace «Entrar al portal de RR. HH.» (/login o /app). Modo Para mí: CTA «Tengo un código» (/evaluar) y enlace «Cómo funciona». Las tarjetas del catálogo exprés no cambian de precio porque no hay precios.
- **Impacto.** Se conserva el selector del brief (PROMPT_CLAUDE_CODE.md:123) sin prometer compras.

<a id="d-14"></a>
### D-14 · Reporte por dimensiones o por escalas (C-07)

- **Contexto.** Ver [C-07](brechas.md#c-07). Además:
  - El campo `percentile` es `round(normalized)` (2026-09-11-fase1-nucleo.md:980) y el baremo demo solo define umbrales de categoría (:792-801); los baremos reales están [PENDIENTE] (2026-09-11-fase1-nucleo-design.md:164). No es un percentil contra una población.
  - El reporte se agrupa por prueba: cada elemento de `tests[]` trae su nombre, sus escalas y su `integrity.blur_count` (2026-09-11-fase1-nucleo.md:1934-1953, :2975-2976), y Report pinta un título y un dato de integridad por prueba (:3047-3066). CA-4 prevé responder todas las pruebas de `tests[]`, así que el reporte tendrá más de una.
  - La spec pedía un «Resumen» prueba × resultado global (2026-09-11-fase1-nucleo-design.md:111) que el plan no implementó; el backend no calcula un resultado global por prueba.
- **Opciones.** A) Diseño del prototipo con datos reales (sin índice ni rango esperado; radar solo con 3 o más escalas; color por categoría) más las secciones del repo. B) Solo barras, sin radar. C) Esperar PB-18.
- **Recomendación.** A:
  - Una sección por prueba de `tests[]` (título = `test.name`) con sus escalas seleccionables, su interpretación, su radar (solo con 3 o más escalas, usando `normalized`) y su integridad («N vez(ces) que la pantalla perdió el foco»). Las preguntas de entrevista y el pie legal van una sola vez, al final.
  - El puntaje se muestra como en el prototipo, «{normalized} · {categoría}» y «{normalized}/100» (Strata.dc.html:938, :950). Si el dueño prefiere conservar «pc N», como hoy (2026-09-11-fase1-nucleo.md:3055; 2026-09-12-fase2-panel-rh.md:1667), va sin ningún texto que sugiera comparación con una población («Percentiles vs. norma LATAM», Strata.dc.html:891) mientras no haya baremo real. El valor es el mismo en los dos casos, así que no se pierde ningún dato.
  - El color sigue la categoría del backend (bajo, medio, alto), no los umbrales 80/70 del prototipo (Strata.dc.html:1957-1960).
  - Se quitan «índice global», «rango esperado del puesto» y «norma LATAM» (PB-18). El «Resumen» de la spec también espera a PB-18.
- **Impacto.** Un solo componente Report para el reporte real, el ejemplo público y la impresión. La comparativa usa el mismo formato de celda; el CSV conserva sus columnas.

<a id="d-15"></a>
### D-15 · Test Builder y Fase 5 (C-08)

- **Contexto.** Ver [C-08](brechas.md#c-08).
- **Opciones.** A) Posponer la Fase 5 hasta PB-20. B) UI sin persistencia (descartada por PROMPT_CLAUDE_CODE.md:33). C) Visor de solo lectura (tampoco hay endpoint de administración de pruebas).
- **Recomendación.** A, y acordar el contrato de PB-20 con el compañero y el psicólogo en paralelo. Los componentes del builder que sirven en otras pantallas (StepPills, Stepper, ChoiceChip) se construyen en las Fases 1 y 4.
- **Impacto.** La Fase 5 no entrega pantallas; la barra del super admin no muestra el builder.

<a id="d-16"></a>
### D-16 · Resultados para el candidato (C-09)

- **Contexto.** Ver [C-09](brechas.md#c-09).
- **Opciones.** A) Mantener la regla del repo y ajustar los textos. B) Cambiar la regla con PB-19, el psicólogo y el aviso de privacidad.
- **Recomendación.** A.
- **Impacto.** Cambia el microcopy de hero, demo, acceso, fin, cómo funciona y mascota.

<a id="d-17"></a>
### D-17 · Props del prototipo

- **Contexto.** `data-props` define nombreEmpresa, moneda, densidadTabla y mostrarTemporizador (Strata.dc.html:1439).
- **Propuesta.**
  - nombreEmpresa: no es prop. En el panel es la organización de la sesión (GET /api/user/profile, 2026-09-12-registro-login-crud-usuarios.md:609-612) y en el portal, `organization` del token (2026-09-11-fase1-nucleo.md:1685).
  - moneda: no se porta; no hay precios ni moneda en el backend (PB-10).
  - densidadTabla: densidad cómoda fija, es decir, padding vertical de celda de 14 px (9 px en la compacta; Strata.dc.html:836-853, :2101). Como opción, preferencia por usuario en localStorage.
  - mostrarTemporizador: según D-12.
- **Recomendación.** Aprobar la propuesta.
- **Impacto.** Ninguna configuración nueva.

<a id="d-18"></a>
### D-18 · Afirmaciones y textos de marketing

- **Contexto.** El microcopy del prototipo incluye afirmaciones sin respaldo en el repo: «Psicometría validada para Latinoamérica» (Strata.dc.html:317, :1236), «Instrumentos validados y baremados para población latinoamericana» (:610), «Percentiles vs. norma LATAM» (:891), «Códigos cifrados AES-256 · un solo uso · trazabilidad completa» (:766), «Datos cifrados» y «Tus datos viajan cifrados» (:163, :1102), «Pago cifrado · factura fiscal automática» (:1316), el rango «15–35 min» (:155) y nombres de pruebas comerciales en los datos de ejemplo (EQ-i 2.0 y DISC, :1443, :1445). El repo prohíbe inventar cifras y promesas y nombrar pruebas comerciales (2026-09-11-fase3-sitio-ventas-design.md:18-20; 2026-09-10-multipage-site-design.md:27), y su baremo demo es aproximado (2026-09-11-fase1-nucleo-design.md:78).
- **Opciones.** A) Mostrar «[PENDIENTE: afirmación verificable]» hasta que el psicólogo o el compañero las respalden. B) Omitirlas. C) Usarlas tal cual.
- **Recomendación.** A para el lema y la propuesta de valor; B para las técnicas (AES-256, factura, pago cifrado). Los rangos de duración se calculan desde GET /api/catalog.
- **Impacto.** Microcopy de la home, el pie, el catálogo y el reporte.

<a id="d-19"></a>
### D-19 · Color del botón primario, colores de estado y contraste

- **Contexto.** El brief asigna el navy a «marca y botones primarios» y el coral a «indicador activo y acentos» (PROMPT_CLAUDE_CODE.md:63, :65), y exige 4.5:1 (:68). El prototipo pinta los CTA primarios de coral con texto blanco (Strata.dc.html:145, :671, :690, :1077, :1313): 2.78:1. Otros pares que no cumplen: #0EA5E9 como texto (2.61:1 sobre #FAF8F5), #857A66 (3.98:1, :278) y #16A34A como texto (3.30:1, :2187). El prototipo no define color de error.
- **Opciones.** A) Primario navy con texto blanco (unos 10.4:1; cálculo propio con la fórmula de WCAG 2.x); coral solo para el subrayado activo y los acentos. B) Coral con texto tinta #0F172A (unos 6.4:1, cálculo propio). C) Un coral más oscuro con texto blanco, a calcular.
- **Recomendación.** A, que además sigue el brief. Estados: conservar el rojo de error #B3261E de docs/design-tokens.md:18 (unos 6.5:1 sobre blanco, cálculo propio) y usar #16A34A solo en íconos.
- **Impacto.** Los CTA se verán navy en lugar de coral. Conviene validarlo visualmente antes de la Fase 1.

<a id="d-20"></a>
### D-20 · Transición de tokens

- **Contexto.** Los .css del frontend usan los tokens de tokens.css: --color-*, --disc-*, --text-*, --sp-*, --radius-*, --t-* y los de layout --max-width, --section-px, --section-py y --header-h (2026-09-10-sales-site.md:263-328). Las variables de fuente --font-display y --font-body están en typography.css (:346-350), y `body` usa --header-h como padding-top (:389). Reemplazarlos de golpe deja mal pintadas las pantallas que todavía no se rediseñan.
- **Opciones.** A) Reemplazo directo en la Fase 1. B) Tokens STRATA nuevos y alias temporales de los nombres viejos apuntando a valores STRATA; los alias se retiran en la Fase 8.
- **Recomendación.** B:
  - Alias para --color-* y --font-*.
  - --text-*, --sp-*, --radius-* y --t-* se remapean a la escala STRATA o se sustituyen por sus equivalentes al rediseñar cada pantalla.
  - Los de layout se conservan o se remapean: --max-width ya vale 1200 px (2026-09-10-sales-site.md:315), igual que el prototipo; --header-h deja de usarse cuando la Fase 2 retire el padding-top global.
  - --disc-* no necesita alias: quedó sin uso cuando Report reemplazó al SampleReport DISC (2026-09-10-sales-site.md:1500-1503; 2026-09-11-fase1-nucleo.md:3111-3153) y se retira en la Fase 8.
- **Impacto.** Fase 1 sin regresiones visibles graves; limpieza en la Fase 8.

<a id="d-21"></a>
### D-21 · Animación entre reactivos

- **Contexto.** El prototipo vuelve a animar la tarjeta en cada pregunta (softIn de 0,34 s, Strata.dc.html:1170). La spec del portal pedía no animar entre reactivos (2026-09-11-fase1-nucleo-design.md:92).
- **Opciones.** A) Sin animación (spec). B) softIn del prototipo, desactivada con reduced-motion.
- **Recomendación.** B, porque el prototipo manda en movimiento; conviene confirmarlo con el psicólogo por la estandarización de la aplicación.
- **Impacto.** Solo en el examen.

<a id="d-22"></a>
### D-22 · Avisos: toast e inline

- **Contexto.** En el prototipo todo aviso y error es un toast de 2,6 s sin aria-live (Strata.dc.html:1420-1425, :1544-1548). El repo muestra errores por campo y pide ícono más texto (docs/design-tokens.md:34).
- **Opciones.** A) Todo por toast. B) Errores inline con ícono y texto; toast con aria-live solo para confirmaciones (copiar, reenviar, solicitud enviada, guardado).
- **Recomendación.** B.
- **Impacto.** El Toast se construye en la Fase 1 junto con Callout e Input con estado de error.

<a id="d-23"></a>
### D-23 · Tablas en móvil

- **Contexto.** Las tablas del prototipo tienen min-width de 900 px con scroll horizontal (Strata.dc.html:720-721, :821-822); el brief pide 360 px (PROMPT_CLAUDE_CODE.md:100).
- **Opciones.** A) Scroll horizontal en todas. B) Por debajo de 640 px, cada fila como tarjeta; scroll horizontal solo en la comparativa.
- **Recomendación.** B.
- **Impacto.** DataTable con modo tarjeta.

<a id="d-24"></a>
### D-24 · Reporte de ejemplo en la home

- **Contexto.** La home actual muestra SampleReport (2026-09-11-fase3-sitio-ventas.md:1181); la del prototipo no. El repo exige que el ejemplo y el real usen el mismo componente (2026-09-11-fase3-sitio-ventas-design.md:95), lo que ya cumple /pruebas/:slug.
- **Opciones.** A) Quitarlo de la home y mostrarlo en /pruebas/:slug y /como-funciona. B) Mantenerlo en la home, debajo de «Cómo funciona».
- **Recomendación.** A.
- **Impacto.** La home sigue el prototipo y ningún contenido se pierde.

<a id="d-25"></a>
### D-25 · Eventos de integridad del candidato

- **Contexto.** La spec del portal registra como integridad el tiempo por reactivo, la pérdida de foco (`visibilitychange`) y una bandera multidispositivo (user agent distinto en el mismo token), y la muestra a RR. HH. como dato, nunca como acusación (2026-09-11-fase1-nucleo-design.md:95). La tabla `attempt_events` admite los tipos blur, focus y multidevice (2026-09-11-fase1-nucleo.md:351) y POST /api/evaluar/{token}/events acepta `type` y `payload` (:1763-1769). Hoy el cliente solo envía blur, sin payload (:2810), y el reporte solo cuenta blur (:1939). El tiempo por reactivo ya se guarda como elapsed_ms (:1754). La bandera multidispositivo no se puede detectar desde el navegador: requiere comparar en el servidor el user agent de cada petición con el que se guardó al consentir (:1708).
- **Opciones.** A) Solo blur, como hoy. B) Además, focus al volver a la pestaña, con `payload: {hidden_ms}`. C) B más la bandera multidispositivo, que es trabajo de backend ([PB-34](pendientes-backend.md#pb-34)).
- **Recomendación.** A en la Fase 3: B registra datos que el reporte no muestra. La bandera multidispositivo depende de PB-34; cuando exista, el reporte la muestra junto a las pérdidas de foco, como dato neutro.
- **Impacto.** En la Fase 3 solo se conserva blur; el texto de integridad del reporte sigue siendo neutro (2026-09-12-fase2-panel-rh-design.md:20).

## Plan de implementación por fases

Sigue las fases del brief (PROMPT_CLAUDE_CODE.md:170-179), ajustadas a los hallazgos. Cada fase termina con un resumen breve al dueño (:181).

### Antes de la Fase 1

- Aprobación de este plan y de las decisiones que bloquean la Fase 1: D-01, D-04, D-05, D-19, D-20 y D-22 (D-03 puede esperar a la Fase 2).
- Código real disponible (PB-01).
- Validar mapa.md y brechas.md contra el código real y corregir los documentos antes de tocar código:
  - package.json: scripts y versiones; axios debe ser 1.6.2 o superior por withXSRFToken (conocimiento externo).
  - tsconfig: si declara `paths` para el alias `@`, que los planes solo muestran en vite.config.ts (2026-09-10-sales-site.md:467-482).
  - ESLint, App.tsx, layouts y componentes.
- Commit de la Fase 0: `docs(rediseno): auditoría y plan`.

### Riesgos que condicionan el plan

- El código del último plan no compila tal cual (PerfilPage usa phone, birth_date y position, que AuthUser no declara; Header declara demoTo y demoHref sin usarlos): el código real difiere (2026-09-12-registro-login-crud-usuarios.md:987-995, :1511-1512, :1722).
- CSRF (inferencia). Solo ContactSection (/demo) depende de que otra petición haya dejado la cookie XSRF-TOKEN, hoy el GET /api/user del AuthProvider: DemoPage no hace ningún GET (2026-09-11-fase3-sitio-ventas.md:697-711) y ContactSection hace el POST sin csrf() (2026-09-10-sales-site.md:2174). CandidateFlow hace GET /api/evaluar/{token} antes de su primer POST (2026-09-11-fase1-nucleo.md:2799-2805, :2826-2831). Recomendación: llamar a csrf() antes de los POST públicos.
- El portal del candidato hoy no captura los errores de consentimiento, carga de reactivos y cierre (2026-09-11-fase1-nucleo.md:2815-2850); la Fase 3 los diseña.
- CSS global con dependencias cruzadas: AdminLayout usa `.applayout__logout` (2026-09-12-fase2-panel-rh.md:1940); el spinner de carga vive en Auth.css (2026-09-12-registro-login-crud-usuarios.md:1119-1129); @media print oculta barras por nombre de clase (2026-09-12-fase2-panel-rh.md:1849); body tiene padding-top de 64 px (2026-09-10-sales-site.md:389).
- Sanctum y CORS solo admiten el puerto 5173 (2026-09-11-fase1-nucleo.md:92-94).
- La prueba fija id 1 depende del orden de los seeders (2026-09-11-fase1-nucleo.md:2561; PB-04).

### Criterios de salida comunes

- `npm run build` sin errores (si el script no ejecuta tsc, además `npx tsc --noEmit`).
- `npm run lint` y `npm test` en verde (D-05).
- Backend intacto: `git diff --stat main -- backend` vacío (o el puntero del submódulo sin cambios).
- Prueba manual contra el backend real (`php artisan migrate:fresh --seed`, `php artisan serve --port=8000`, `npm run dev` en el puerto 5173) de cada pantalla tocada, con sus estados de carga, vacío y error, y con la sesión expirada (D-07, punto 8).
- Consola sin errores; capturas a 360 y 1440 px; navegación por teclado de lo nuevo.
- docs/rediseno/ actualizado.

### Fase 1 · Tokens, fuentes, estilos globales y componentes base

- **Entregables.** Tokens STRATA (color, tipografía, superficies, radios, sombras, blur, z-index, duraciones y curvas) en tokens.css, con alias temporales (D-20). Fuentes (D-04). global.css: fondo, foco visible, reduced-motion. animations.css con los keyframes del prototipo (Strata.dc.html:27-40). Componentes: Button (primario, secundario, ghost, tinta, peligro; conserva `to`, `href` y `loading`), Input (neutro, foco, válido, error), Select, Textarea, Checkbox, RadioGroup y RadioCard, SegmentedFilter, Card (vidrio, secundaria, blanca, oscura), StatCard, DataTable, Badge de estado, Tag, Toast con proveedor, Modal y Drawer accesibles, PageHeader, Callout, EstadoCarga, EstadoVacío, EstadoError, Stepper, StepPills y CopyField. El spinner de carga pasa a Button. docs/design-tokens.md actualizado.
- **Pantallas y rutas.** Ninguna cambia de flujo; todas siguen funcionando gracias a los alias.
- **Dependencias o bloqueos.** PB-01, D-04, D-05, D-19, D-20 y D-22.
- **Criterios de salida.** Comunes, más: contraste AA de cada par texto/fondo de los tokens; pruebas de teclado de Modal, Drawer, RadioGroup y SegmentedFilter.
- **Commits previstos.** `chore(calidad): scripts de lint y pruebas`, `feat(estilos): tokens y fuentes STRATA`, `feat(ui): controles base`, `feat(ui): tarjetas, tabla y badges`, `feat(ui): toast, modal y drawer`, `feat(ui): estados de carga, vacío y error`.

### Fase 2 · Layout: barra superior por rol, pie, halos y transición

- **Entregables.**
  - PageLayout con el juego global de halos y la variante de la home (T-23; mapa.md, TR-1).
  - Transición screenIn al cambiar de ruta y ScrollToTop en todos los layouts (hoy solo en RootLayout, 2026-09-10-multipage-site.md:1365-1376).
  - TopBar por rol con pastilla y menú accesible, y menú móvil con Salir y Operación (mapa.md, sección 3).
  - Footer común con los cinco enlaces actuales (mapa.md, V-7).
  - @media print con las clases nuevas; se retira el padding-top global; AdminLayout deja de depender de AppLayout.css.
  - Manejo de sesión vencida en el cliente `api` (D-07, punto 8).
- **Pantallas y rutas.** RootLayout (todas las rutas públicas, /perfil y 404), /app/* y /admin/*. Las rutas y guardas aprobadas en D-07 (índice de /admin, guardas de /app y /perfil, redirecciones de /login y /registro, ruta de origen y sesión vencida).
- **Datos.** GET /api/user; GET /api/user/profile; GET /api/credits solo con organization_id; GET /api/admin/credit-requests solo con is_platform_admin.
- **Dependencias o bloqueos.** D-03, D-06 y D-07; PB-02 y PB-03 son opcionales.
- **Criterios de salida.** Comunes, más: menú de la pastilla y menú móvil operables con teclado (Escape devuelve el foco); el operador llega a /admin desde /app; en móvil se puede salir desde el sitio público; ninguna llamada a /api/credits sin organización; con la sesión cerrada en otra pestaña, una acción en /app lleva a /login con aviso y vuelve a la ruta de origen tras entrar.
- **Commits previstos.** `feat(layout): PageLayout con halos y transición`, `feat(layout): barra superior por rol`, `feat(layout): pie común`, `feat(rutas): índice de /admin, guardas y sesión vencida`.

### Fase 3 · Flujo del candidato: acceso, examen y fin

- **Entregables.** Marco de acceso; /evaluar con «Enlace o código»; /evaluar/:token con carga, bloqueo (completada, expirada, 404 y error de red con reintento), invitación verificada con consentimiento e instrucciones, examen en modo foco (todas las pruebas de tests[], allows_back, guardado con estado real, blur) y fin con «Cerrar ventana» (mapa.md, CA-5). Estados de error por llamada del portal, que hoy no se capturan (2026-09-11-fase1-nucleo.md:2815-2850):
  - POST consent: un 409 muestra la pantalla de bloqueo; un error de red, un mensaje inline con «Reintentar», y el botón sale del estado de carga.
  - GET …/pruebas/{testId}: EstadoError con «Reintentar».
  - POST answers: indicador «no se pudo guardar» con reintento; un 409 lleva al bloqueo.
  - POST complete: un 409 lleva al bloqueo; un error de red muestra «Reintentar» sin perder las respuestas guardadas.
  - Prueba sin reactivos (items vacío): EstadoVacío con contacto a la empresa en lugar de la pantalla en blanco actual (2026-09-11-fase1-nucleo.md:2893, :2926), ligado a PB-04.
  - csrf() antes del primer POST del portal, como defensa; hoy el GET del portal ya deja la cookie (ver riesgos).
- **Pantallas y rutas.** /evaluar y /evaluar/:token, sin cambio de URL. Endpoints: los seis del portal.
- **Dependencias o bloqueos.** D-11, D-12, D-16, D-21 y D-25; PB-14 y PB-31 son opcionales.
- **Criterios de salida.** Comunes, más, con la prueba demo: responder, cerrar a la mitad y reabrir (retoma en el primer reactivo sin respuesta); un enlace completado o vencido muestra el bloqueo; el consentimiento se guarda antes del primer reactivo; el blur queda registrado; 360 px y botones de 44 px o más; opciones operables con teclado. Además: simular fallo de red en el consentimiento, en la carga de reactivos y en el cierre; completar la evaluación en otra pestaña y comprobar que la primera pasa al bloqueo con el 409.
- **Commits previstos.** `feat(candidato): acceso e invitación verificada`, `feat(candidato): examen en modo foco`, `feat(candidato): fin, errores y estados de bloqueo`.

### Fase 4 · Portal de RR. HH.: Tests, Créditos, Candidatos y Resultados

- **Entregables.**
  - Catálogo: /pruebas con el diseño del prototipo y /app/pruebas si se aprueba, con reintento en el error.
  - Créditos: /app/creditos con resumen, movimientos con referencias legibles y drawer de solicitud.
  - Candidatos: /app/evaluaciones, /app/evaluaciones/:id (con «Comparar candidatos») y /app/evaluaciones/nueva con la pantalla de enlaces y los canales de D-10.
  - Resultados: /app con estadísticas y últimas completadas, y /app/candidatos/:invitationId/reporte con el Report nuevo (una sección por prueba, D-14) e impresión.
  - El Report nuevo también se usa en SampleReport y PruebaDetallePage con el badge «Ejemplo».
- **Pantallas y rutas.** Las anteriores; las URL no cambian (salvo /app/pruebas, si se aprueba).
- **Dependencias o bloqueos.** D-06 a D-10, D-14 y D-23; PB-04 a PB-08, PB-13, PB-17 y PB-34 son opcionales.
- **Criterios de salida.** Comunes, más: crear una evaluación (incluido el 422 por saldo con enlace a créditos); copiar enlace; reenviar (y el 409); ver el reporte (y 403, 409 y 404 con mensajes distintos); solicitar créditos (y el 422); imprimir el reporte con su pie legal; un usuario de otra organización ve el estado 403; «Comparar candidatos» lleva a la comparativa; créditos, evaluaciones, detalle y resumen muestran carga, vacío y error por separado.
- **Commits previstos.** `feat(rh): catálogo de pruebas`, `feat(rh): créditos y solicitud`, `feat(rh): evaluaciones y candidatos`, `feat(rh): asistente de nueva evaluación`, `feat(rh): reporte del candidato`, `feat(rh): resultados`.

### Fase 5 · Test Builder

- **Entregables.** Ninguna pantalla: la fase está bloqueada por PB-20 (D-15). Los componentes derivados del builder (StepPills, Stepper, ChoiceChip, SelectableListRow) se entregan en las Fases 1 y 4.
- **Pantallas y rutas.** Ninguna.
- **Dependencias o bloqueos.** PB-20 y un contrato acordado con el compañero y el psicólogo.
- **Criterios de salida.** PB-20 resuelto o pospuesto de forma explícita. Si llega el contrato, se planea la fase.
- **Commits previstos.** Ninguno, salvo `docs(rediseno): contrato del Test Builder` si se acuerda.

### Fase 6 · Inicio y mascota

- **Entregables.** `/` con header público, hero con selector (D-13), demo interactiva sin API, catálogo exprés desde GET /api/catalog, cómo funciona y pie. Mascota con gsap 3.12 y MotionPathPlugin por npm, gsap.context() y revert al desmontar, montada en un portal fuera de ancestros con transform, con una ref al H1 del hero (o `data-mascota-titular`) en lugar del selector de hermanos `#strata-mascot ~ div h1` (Strata.dc.html:1697), objetivos por atributo data-*, quieta u oculta con reduced-motion, burbuja con aria-live y control accesible.
- **Pantallas y rutas.** `/`.
- **Dependencias o bloqueos.** D-13, D-16, D-18 y D-24. GSAP ya está aprobado (PROMPT_CLAUDE_CODE.md:38).
- **Criterios de salida.** Comunes, más: entrar y salir de `/` veinte veces sin listeners, ticker ni tweens vivos (verificable con gsap.globalTimeline.getChildren()); la mascota baja su opacidad sobre el H1; objetivo de Lighthouse móvil de la spec: rendimiento de 90 o más y accesibilidad de 95 o más (2026-09-11-fase3-sitio-ventas-design.md:99).
- **Commits previstos.** `feat(inicio): home STRATA`, `feat(inicio): mascota con GSAP`.

### Fase 7 · Pantallas del repo sin equivalente en el prototipo

- **Entregables.** /login, /registro, /perfil, /como-funciona, /precios, /demo, /ayuda, /aviso-de-privacidad, /terminos, 404, /pruebas/:slug, /app/evaluaciones/:id/comparar, /admin/creditos, /admin/usuarios, /admin/usuarios/:id y /admin/perfil (mapa.md, sección 2). Incluye:
  - /demo llama a csrf() antes de POST /api/leads y muestra los errores de red, 419 y 500, además de los 422 por campo.
  - Validación inmediata de la confirmación de contraseña en /registro, /perfil y /admin/perfil (2026-09-12-registro-login-crud-usuarios-design.md:155).
  - Logo de la tarjeta de auth enlazado a `/` (2026-09-12-registro-login-crud-usuarios-design.md:93).
  - /perfil con fecha de nacimiento y empresa en solo lectura (2026-09-12-registro-login-crud-usuarios-design.md:123).
  - /admin/usuarios con columna Puesto (2026-09-12-registro-login-crud-usuarios-design.md:133) y /admin/usuarios/:id con correo, organización y fechas en solo lectura (:140).
- **Pantallas y rutas.** Las anteriores, sin cambio de URL.
- **Dependencias o bloqueos.** D-07 y D-18; PB-22, PB-23, PB-24, PB-27 y PB-32 mejoran estas pantallas pero no las bloquean.
- **Criterios de salida.** Comunes, más: registro con todos sus campos y errores 422 por campo; login con redirección por organización; perfil con errores por campo; leads con los 6 campos; comparativa ordenable con teclado y CSV; admin: aprobar y rechazar (y el 409), usuarios con búsqueda, paginación y 409 al borrarse a sí mismo, y perfil del operador que actualiza el correo en la sesión.
- **Commits previstos.** `feat(auth): login y registro`, `feat(perfil): mi perfil`, `feat(sitio): páginas públicas`, `feat(rh): comparativa`, `feat(admin): solicitudes, usuarios y perfil`.

### Fase 8 · QA final

- **Entregables.** Auditoría AA y de teclado en todas las rutas; responsive a 360, 768 y 1440 px; reduced-motion; consola limpia; sin fugas de animación; regresión funcional contra el backend real con una lista de todos los endpoints consumidos; impresión del reporte; retiro de alias de tokens y fuentes anteriores; propuesta de limpieza del código muerto (Trust.tsx, .header__cta, demoTo y demoHref, getAssessment duplicado, tokens --disc-*) para que el dueño la apruebe; recorridos con Playwright si se aprueba D-05 C.
- **Pantallas y rutas.** Todas.
- **Dependencias o bloqueos.** Fases 1 a 7 cerradas.
- **Criterios de salida.** Todos los criterios de aceptación del brief (PROMPT_CLAUDE_CODE.md:183-191).
- **Commits previstos.** `fix(a11y): …`, `chore(estilos): retirar tokens y fuentes anteriores`, `docs(rediseno): cierre del rediseño`.
