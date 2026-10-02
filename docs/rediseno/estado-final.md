# Estado final del rediseño

Cierre del rediseño STRATA al 2026-10-02, en la rama feat/rediseno-strata. Está escrito para el dueño y para el compañero de backend. Las citas siguen el formato archivo:línea de [decisiones.md](decisiones.md), y las rutas de código son relativas a `frontend-strata/`.

## Resumen

- **Dónde está.** El frontend rediseñado vive en `frontend-strata/`, sobre una reconstrucción del frontend original hecha desde los planes de `docs/superpowers/plans` ([D-26](decisiones.md#d-26)), porque `frontend/` y `backend/` siguen siendo gitlinks vacíos ([PB-01](pendientes-backend.md#pb-01)). No cambió ninguna URL, endpoint ni contrato de datos, y el backend no se tocó.
- **Qué está hecho.** Las Fases 1, 2, 3, 4, 6, 7 y 8. La Fase 5 (Test Builder) está bloqueada por [PB-20](pendientes-backend.md#pb-20) ([D-15](decisiones.md#d-15)).
- **Nada se simula.** Lo que el prototipo muestra sin backend se ocultó o se adaptó a un flujo real. La columna «Estado» de [mapa.md](mapa.md) y de [brechas.md](brechas.md) lo detalla fila por fila: en mapa.md, 4 pantallas quedaron hechas, 26 adaptadas (12 con una parte que espera backend), 5 esperan backend y 7 elementos del prototipo no se portaron; las 17 rutas del repo sin pantalla en el prototipo están hechas.
- **Calidad al cierre.** Build, lint y typecheck sin errores; 1159 pruebas unitarias en 145 archivos y 19 recorridos de extremo a extremo en verde; axe sin violaciones en 49 rutas a 1440 y 360 px, más 37 estados con algo abierto; 43 de 43 pasos de teclado con foco visible; ningún desborde horizontal a 360, 768 y 1440 px; sin fugas de animación en 20 ciclos de la mascota; Lighthouse móvil de la home en 82, con accesibilidad 100.
- **Qué falta.** Lo que necesita el código real o una decisión: la regresión contra el backend real y la migración a `frontend/` (PB-01), el Lighthouse de 90 (prerender o SSR), los halos animados, el microcopy, los datos [PENDIENTE], las preguntas para el psicólogo y la propuesta de limpieza. Todo está en [Qué quedó pendiente](#pendiente).

## Qué se hizo por fase

| Fase | Estado | Commit |
|---|---|---|
| 0 · Auditoría y plan | Hecha | 1c9e116 |
| Base · Reconstrucción del frontend | Hecha | 817a5df |
| 1 · Tokens, fuentes, estilos y componentes base | Hecha | f43a2d6 y 8ba6e6d |
| 2 · Layout: barras por rol, pie, halos, transición, guardas y sesión | Hecha | 4d68302 |
| 3 · Candidato: acceso, examen y fin | Hecha | eb70a3e |
| 4 · Portal de RR. HH. | Hecha | d06b6c5 |
| 5 · Test Builder | Bloqueada por PB-20 | — |
| 6 · Inicio y mascota | Hecha | 0dd3050 |
| 7 · Pantallas del repo sin prototipo | Hecha | 6f557cb |
| 8 · QA final | Hecha, salvo la regresión contra el backend real | Commit de cierre |

### Fase 0 · Auditoría y plan

- [auditoria.md](auditoria.md) (frontend, prototipo y sistema de diseño extraído), [mapa.md](mapa.md), [brechas.md](brechas.md), [pendientes-backend.md](pendientes-backend.md) (PB-01 a PB-34) y [decisiones.md](decisiones.md) con 25 decisiones abiertas y el plan por fases.
- El dueño aprobó todas las recomendaciones el 2026-10-01. D-04 se resolvió con la opción B (Fontshare por CDN) y se agregó D-26.

### Base · Reconstrucción del frontend (D-26)

- El código real no apareció, así que el frontend se reconstruyó aplicando en orden los 7 planes: 104 archivos en `src/`, las mismas 26 rutas con página más `/admin`, y build y lint en verde.
- Las 9 desviaciones de la reconstrucción y las supresiones de lint están en [reconstruccion.md](reconstruccion.md). Ese commit es la base para comparar con el código real ([Migración](#migracion)).

### Fase 1 · Tokens, fuentes, estilos y componentes base

- `src/styles/tokens.css` con la paleta, la tipografía, las superficies, los radios, las sombras, las capas y el movimiento del prototipo, con los contrastes calculados y los alias temporales de D-20. Los tokens de accesibilidad de [D-29](decisiones.md#d-29): foco #0284C7, borde funcional #8B8574, éxito #157A3A y advertencia #A84E07.
- Satoshi y General Sans desde Fontshare y JetBrains Mono con @fontsource (D-04, opción B). global.css (foco visible y movimiento reducido) y los keyframes `st-*`.
- 38 componentes base en `src/components/ui` (lista en el [README](../../frontend-strata/README.md#componentes-base)), creados aquí o en las fases siguientes: Button primario navy (D-19), campos, selección, tarjetas, DataTable con modo tarjeta (D-23), badges, Toast (D-22), Modal, Drawer, Callout y los estados de carga, vacío y error.
- Vitest y Testing Library (203 pruebas), Playwright, `scripts/captura.mjs` y la galería de desarrollo (`showcase.html`). [design-tokens.md](../design-tokens.md) reescrito para STRATA.
- QA visual (8ba6e6d): 182 pares de elementos comparados con el prototipo por estilos computados.

### Fase 2 · Layout

- PageLayout con los halos globales y la variante de la home (T-23), enlace para saltar al contenido, entrada de pantalla (screenIn) y ScrollToTop en todos los layouts. Sin padding-top global: las barras son sticky.
- Tres barras por rol (D-06): pública, RR. HH. (con saldo y organización) y super admin (con el contador de solicitudes). La pastilla abre un menú accesible, y el menú móvil incluye Salir y Operación.
- Pie común con los cinco enlaces del repo y variante compacta para el candidato. Marca Strata con SITE.name como única fuente (D-03), con title, Open Graph y favicons generados desde strata-mark.png.
- Rutas y guardas de D-07: /app/pruebas, índice de /admin, guarda de organización en /app, guarda de sesión en /perfil, redirección de /login y /registro con sesión, vuelta a la ruta de origen y sesión vencida (interceptor 401 y 419, y SessionWatcher). csrf() antes de POST /api/leads.
- Mocks de la API por rol en `e2e/mocks`, para capturas y pruebas sin backend. 416 pruebas.

### Fase 3 · Candidato

- /evaluar con un solo campo «Enlace o código» y error en línea. /evaluar/:token reescrito sobre una máquina de estados (`useCandidateFlow.ts`).
- Acceso con «Invitación verificada», organización, puesto y pruebas reales; consentimiento sin marcar y guardado antes del primer reactivo; sin formulario de datos (D-11).
- Examen en modo foco: recorre todas las pruebas de tests[] (S-19), guarda cada respuesta con su estado real, muestra «Anterior» solo con allows_back, no avanza sin responder, no tiene temporizador (D-12), anima cada reactivo con softIn (D-21) y registra la pérdida de foco (D-25).
- Fin sin promesas de resultados (D-16) y bloqueos para completada, expirada, 404 y error de red. Un 409 en consent, answers o complete lleva al bloqueo, y los reintentos no pierden respuestas. 547 pruebas; `src/api/candidate.ts` conservó sus rutas y payloads.

### Fase 4 · Portal de RR. HH.

- Catálogo en /pruebas y /app/pruebas: filtros con los conteos de la API, búsqueda sin acentos y tarjetas sin precio ni compra.
- Créditos (D-08, D-09): saldo, recibidos y consumidos; movimientos con referencias legibles; drawer «Solicitar créditos» que no cambia el saldo.
- Candidatos (D-10): lista de evaluaciones con avance; detalle con filtro por los cuatro estados, Copiar, Compartir (mailto y wa.me con el enlace real), Reenviar con su 409 y Ver reporte.
- Asistente de nueva evaluación en 4 pasos con el payload exacto de POST /api/assessments, errores 422 por campo, aviso de saldo insuficiente con enlace a créditos y pantalla de enlaces.
- Reporte (D-14): una sección por prueba con escalas, interpretación, radar solo con 3 escalas o más e integridad; impresión con pie legal; 403, 409 y 404 con mensajes distintos. Resultados (/app) con estadísticas y últimas completadas (agregación limitada, PB-05).

### Fase 5 · Test Builder

- Bloqueada: no hay API de edición de pruebas ([PB-20](pendientes-backend.md#pb-20)). No hay pantalla ni enlace del builder. StepPills, Stepper y SelectableListRow ya existen en `src/components/ui`.

### Fase 6 · Inicio y mascota

- Home con la variante home de PageLayout: halos intensos, barra dentro del contenido y pie con «Acceso interno».
- Hero con el selector «Para mí» / «Para mi empresa» (D-13), fila de confianza con el rango de duración de GET /api/catalog (D-18), demo de examen interactiva con radios nativos, catálogo exprés con pruebas reales y «Cómo funciona» en 3 pasos fieles al flujo real. Sin reporte de ejemplo en la home (D-24). El hero va a dos columnas desde 1180 px ([D-30](decisiones.md#d-30)).
- Mascota con gsap 3.12 y MotionPathPlugin por npm, gsap.context() y limpieza completa al desmontar, montada en un portal, con objetivos por atributo, opacidad sobre el H1, burbuja con aria-live y movimiento reducido respetado.

### Fase 7 · Pantallas del repo sin prototipo

- /login y /registro con el marco del acceso, validación inmediata de la confirmación, 422 por campo, sector y tamaño de empresa, y sin «¿Olvidaste tu contraseña?» ni promesas de verificación (PB-23, PB-32).
- /perfil y /admin/perfil con fecha de nacimiento, empresa en solo lectura (PB-22) y cambio de contraseña; el perfil del operador actualiza la sesión.
- Cómo funciona, precios con [PENDIENTE], demo con los errores de red, 419 y 500 visibles, ayuda, legales, 404 y detalle de prueba con reporte de ejemplo.
- Comparativa ordenable con teclado y CSV idéntico al anterior. Solicitudes de créditos con confirmación en modal (S-15). Usuarios con búsqueda con retardo, paginación, rol traducido y eliminación con confirmación y 409.
- PB-35 nuevo. 1119 pruebas en verde.

### Fase 8 · QA final

- **QA** (detalle en decisiones.md, Fase 8): axe con WCAG 2.0 a 2.2 AA en 49 rutas y 37 estados abiertos (de 22 serias a 0), teclado, contraste medido sobre el fondo real, responsive, movimiento reducido, consola y fugas de la mascota. Correcciones: [D-27](decisiones.md#d-27) (mascota), [D-28](decisiones.md#d-28) (rendimiento: de 63 a 82 en Lighthouse móvil) y [D-31](decisiones.md#d-31) (barra, menú móvil, tablas, toast y badge).
- **Pruebas de extremo a extremo**: `npm run test:e2e`, 19 recorridos con Playwright y la API simulada (candidato, RR. HH., créditos, super admin, sesión vencida y guardas). No apareció ningún bug funcional.
- **Limpieza**: se retiraron los alias de D-20 y los `--disc-*`, sin cambio visual, y `src/styles/tokens.test.ts` vigila que ninguna variable quede sin definir. La [propuesta de limpieza](#limpieza) del código muerto espera al dueño.
- **Documentación**: este documento, el [README](../../frontend-strata/README.md) de `frontend-strata/`, la columna «Estado» de mapa.md y brechas.md, PB-36 y PB-37, y en decisiones.md D-26, D-29 a D-31, el [microcopy por aprobar](decisiones.md#microcopy) y las [preguntas para el psicólogo](decisiones.md#psicologo).

<a id="pendiente"></a>
## Qué quedó pendiente y por qué

### Necesita el código real o el backend

| Pendiente | Por qué | Qué hace hoy el frontend |
|---|---|---|
| Regresión contra el backend real | `frontend/` y `backend/` son gitlinks vacíos ([PB-01](pendientes-backend.md#pb-01)). Todas las pruebas usan mocks que siguen los contratos de los planes | Funciona contra cualquier backend con esos contratos. Lista de llamadas y recorrido mínimo en [Cómo correr contra el backend real](#backend-real) |
| Migración de `frontend-strata/` a `frontend/` | Quitar el gitlink necesita el código real y la aprobación explícita del dueño (D-26) | Guía en [Migración](#migracion) |
| Fase 5 · Test Builder | Sin API de edición de pruebas ([PB-20](pendientes-backend.md#pb-20), D-15) | Sin pantalla ni enlace |
| Crear la empresa desde /perfil | [PB-22](pendientes-backend.md#pb-22), prioridad alta | El aviso remite a soporte, sin pedir un campo que no existe |
| Fecha límite que vence al empezar el día | [PB-36](pendientes-backend.md#pb-36), nuevo | El asistente solo acepta fechas posteriores a hoy y el mensaje dice «Responde antes del…» |
| Funciones del prototipo y del repo que esperan backend | PB-02 a PB-19, PB-21, PB-23 a PB-35 y PB-37, cada uno con su prioridad | Ocultas o adaptadas, nunca simuladas: columna «Estado» de [brechas.md](brechas.md) y de [mapa.md](mapa.md); el «Mientras no exista» de cada ítem |

Prioridades del backend: alta, PB-01, PB-22 y PB-20 (esta solo para la Fase 5); media, PB-03 a PB-08, PB-13, PB-14, PB-23, PB-35 y PB-36. El resto es baja y casi todo depende de decisiones de producto.

<a id="decisiones-del-dueno"></a>
### Decisiones del dueño

1. **Microcopy.** 25 textos nuevos de la home y del candidato, con el texto del prototipo al lado: [MC-01 a MC-25](decisiones.md#microcopy).
2. **Datos [PENDIENTE].** En `src/config/site.ts`: razón social (`legalName`), lema verificable (`claim`, D-18), dominio (`domain`, para la og:image absoluta), correo de contacto (`email`) y enlace de agenda (`calendarUrl`). En `src/data/plans.ts`, los precios. Y el contenido del aviso de privacidad (LFPDPPP) y de los términos. Mientras falten, el sitio muestra el marcador, sin enlaces a direcciones que no existen.
3. **Validación visual.** El primario navy (D-19) y los bordes de control #8B8574 (D-29) se ven más marcados que en el prototipo.
4. **Rendimiento.** Lighthouse móvil de la home en 82 contra la meta de 90 de la spec. Llegar a 90 pide prerenderizar la home (SSG) o renderizar en el servidor, un cambio de stack ([D-28](decisiones.md#d-28)).
5. **Halos animados.** La animación infinita de los tres halos de fondo (igual al prototipo) ocupa cerca de un núcleo de CPU por pestaña en equipos que dibujan sin GPU, como máquinas virtuales y escritorios remotos. Opciones medidas: animarlos por pasos (28 %), detenerlos tras unos segundos o no animarlos (1 %). Hoy siguen como el prototipo.
6. **Propuesta de limpieza.** L-01 a L-22, en la [sección de abajo](#limpieza).
7. **Integración continua.** El repo no tiene workflow de CI. Si se agrega, conviene correr `npm run build`, `npm run lint`, `npm test` y `npm run test:e2e`; la configuración de Playwright ya activa reintento, forbidOnly y reporte HTML cuando existe la variable CI.
8. **Pesos de Satoshi.** El CDN de Fontshare no sirve Satoshi en 600 ni en 800, así que esos pesos se pintan en 700 en los títulos, igual que en el prototipo. Para unas cifras más gruesas habría que pedir Satoshi 900 ([design-tokens.md](../design-tokens.md), «Pendientes»).

### Preguntas para el psicólogo

- [PS-01](decisiones.md#psicologo): la animación softIn entre reactivos (D-21) y si el tiempo por reactivo debe empezar al terminar la animación.
- [PS-02](decisiones.md#psicologo): la redacción de las instrucciones, hoy fijas para todas las pruebas.
- [PS-03](decisiones.md#psicologo): criterios ya registrados (reactivos de práctica, sección del reactivo, presentación del puntaje sin baremo real e integridad). Los baremos reales siguen pendientes ([PB-18](pendientes-backend.md#pb-18)).

### Pendientes técnicos del frontend

- **Impresión del reporte.** Las reglas `@media print` y el pie legal existen desde la Fase 4, y una prueba de extremo a extremo comprueba que «Descargar PDF» llama una sola vez a window.print con el título del documento. Falta revisar la vista previa de impresión en Chrome, Edge, Firefox y Safari con un reporte de varias pruebas: saltos de página, radar y pie legal.
- **Tablas entre 641 px y el ancho de la tabla.** Al cargar o al cambiar el ancho, puede verse un cuadro en modo tabla antes de pasar a tarjetas: el ResizeObserver decide después del primer pintado.
- **Halo coral de la home.** En su centro exacto, el texto terciario bajaría a 4.24:1. Hoy no hay texto suelto ahí, pero no conviene poner texto terciario, de éxito o de advertencia directo sobre el lienzo en esa zona (regla 13 de design-tokens.md).
- **Scripts de QA.** `e2e/*.mjs` (a11y, recorrido, barras, tablas, teclado, contraste, toast-overlay, fugas-mascota y capturas) se corren a mano; no están en los scripts de npm. La suite `npm run test:e2e` solo tiene el proyecto Chromium de escritorio; a 360 px se verificó una vez. Para fijarla, basta un proyecto con `devices['Pixel 5']`.

<a id="desviaciones"></a>
## Desviaciones del prototipo

El prototipo manda en apariencia, layout, navegación, flujos, estados, microcopy y animación, salvo que choque con los datos y las reglas del repo o con AA (T-11, T-12). Estas son las diferencias visibles y su motivo.

| Qué cambia frente al prototipo | Motivo | Decisión |
|---|---|---|
| Botones primarios navy con texto blanco; el coral queda para acentos y el subrayado activo | Coral con texto blanco da 2.78:1 | [D-19](decisiones.md#d-19) |
| Foco #0284C7, bordes de control #8B8574, texto de éxito #157A3A y advertencia #A84E07 | Los valores del prototipo no llegan a AA | [D-29](decisiones.md#d-29) |
| Barra superior a .92 de opacidad (prototipo, .78) | Contraste sobre el banner oscuro del reporte | [D-31](decisiones.md#d-31) |
| Navegación con destinos reales por rol: Tests, Créditos, Candidatos y Resultados en RR. HH.; Solicitudes y Usuarios en super admin; pastilla con menú; Entrar y Crear cuenta en la pública | Rutas del repo y funciones que el prototipo no tiene | [D-06](decisiones.md#d-06), [D-07](decisiones.md#d-07) |
| Menú móvil hasta 960 px (pública y home) y 900 px (RR. HH.); el prototipo solo hace wrap | Las barras se partían en dos filas | [D-31](decisiones.md#d-31) |
| «Mis licencias» pasa a «Créditos»: saldo y movimientos, sin códigos | El repo tiene un saldo de créditos | [D-08](decisiones.md#d-08) |
| Carrito y checkout pasan a un drawer «Solicitar créditos» sin precios, impuestos ni pago | No hay pasarela de pago | [D-09](decisiones.md#d-09) |
| Los modales «Asignar test por email» y «Generar enlace / código» pasan al asistente /app/evaluaciones/nueva y a enlaces por candidato con Correo, WhatsApp y Copiar | Evaluaciones con varias pruebas y candidatos; los canales usan el enlace real | [D-10](decisiones.md#d-10) |
| Acceso del candidato sin formulario de datos y con la casilla sin marcar | El backend no recibe datos del candidato y pide consentimiento explícito | [D-11](decisiones.md#d-11), S-02 |
| Examen sin temporizador ni «Sección»; «Anterior» solo con allows_back; «Siguiente» deshabilitado sin respuesta; varias pruebas por invitación | Reglas del repo | [D-12](decisiones.md#d-12), S-03, S-04, S-19, PB-29 |
| /evaluar acepta el enlace o el código de 40 caracteres, sin forzar mayúsculas | No hay código corto | CA-3 en mapa.md, [PB-11](pendientes-backend.md#pb-11) |
| «Para mí» del hero lleva a «Tengo un código»; sin precios | No hay compra individual | [D-13](decisiones.md#d-13) |
| Hero en una columna por debajo de 1180 px (el prototipo pasa a dos desde 960 px) | La insignia del radar taparía «Siguiente» | [D-30](decisiones.md#d-30) |
| Reporte con una sección por prueba, sin índice global, rango esperado ni «norma LATAM»; color por categoría | Datos reales del reporte | [D-14](decisiones.md#d-14) |
| Sin Test Builder | Sin API de edición | [D-15](decisiones.md#d-15) |
| Ningún texto promete resultados ni correos al candidato: hero, demo, cómo funciona, fin y mascota | Regla del repo | [D-16](decisiones.md#d-16) |
| Afirmaciones sin respaldo como [PENDIENTE] u omitidas: lema del pie, «Datos cifrados», AES-256, «validada para Latinoamérica» | Sin respaldo verificable | [D-18](decisiones.md#d-18) |
| Errores en línea con ícono y texto; el toast solo confirma, con aria-live, y se recoloca con un modal o un drawer abierto | Accesibilidad y errores por campo del repo | [D-22](decisiones.md#d-22), [D-31](decisiones.md#d-31) |
| Tablas como tarjetas a 640 px o menos y cuando no caben | Usable a 360 px, sin desplazamiento lateral | [D-23](decisiones.md#d-23), [D-31](decisiones.md#d-31) |
| Badges con los cuatro estados de invitación, incluida «Expirada» | El repo tiene cuatro estados | RH-7 en mapa.md, S-17 |
| Mascota sobre el contenido, en un portal, con zona táctil sobre el cuerpo y «Ocultar mascota»; se descarga después de la carga | Tapaba clics; WCAG 2.2.2; rendimiento | [D-27](decisiones.md#d-27), [D-28](decisiones.md#d-28) |
| Pie con los cinco enlaces del repo, en todas las pantallas internas; Contacto y Soporte con [PENDIENTE] y sin mailto | Regla 5 y brief | V-7 y TR-3 en mapa.md |

<a id="limpieza"></a>
## Propuesta de limpieza

Las citas siguen el formato archivo:línea de [decisiones.md](decisiones.md); las rutas son relativas a `frontend-strata/`. Las búsquedas se hicieron el 2026-10-02, después de retirar los alias.

**Cómo aprobarla.** Responde con los IDs aprobados (por ejemplo, «L-01 a L-07, L-09, L-16 a L-20»). Todo lo aprobado entra en un solo commit `chore(limpieza): …` que borra los archivos y símbolos, actualiza los comentarios que los mencionan (ui/index.ts:4-9, controles.ts:2-3 y animations.css:1) y, si se borran tokens (L-21), design-tokens.md. Antes del commit: `npm run build`, `npm run lint`, `npm test` y `npm run test:e2e` en verde. Nada de esta lista cambia URLs, contratos ni lo que ve el usuario.

### Ya retirado en la Fase 8

Estaba aprobado en D-20 y en el plan de la Fase 8, así que no espera aprobación:

- **Alias temporales de tokens** (bloque «Alias temporales (D-20)» de `src/styles/tokens.css`): `--color-hunter`, `--color-fern`, `--color-sage`, `--color-brunswick`, `--color-ink`, `--color-timberwolf`, `--color-surface`, `--color-surface-secondary`, `--color-border`, `--color-accent`, `--color-success`, `--color-error`, `--color-warning` y `--color-info`; `--font-display` y `--font-body`; `--text-xs` a `--text-hero`; `--sp-1` a `--sp-24`; `--radius-sm`, `--radius-md` y `--radius-lg`; `--t-fast` y `--t-base`; `--max-width`, `--section-px`, `--section-py` y `--header-h`.
  - Los últimos usos se migraron a su equivalente (tabla en [design-tokens.md](../design-tokens.md), «Nombres del sistema anterior»): FloatingInput.css, UserDropdown.css, GrainTexture.css, Trust.css y `.section-inner` de global.css. Todos son código sin uso (L-01 a L-04 y L-16).
  - Se quitó `--section-px: 0px` de `.st-page__content` (PageLayout.css), que solo existía para los contenedores viejos.
- **`--disc-d`, `--disc-i`, `--disc-s` y `--disc-c`**: sin uso (antes de retirarlos, Grep `--disc-` solo encontraba su definición en tokens.css).
- **Fuentes anteriores**: @fontsource/cormorant-garamond y @fontsource-variable/dm-sans ya se habían desinstalado en la QA de la Fase 8 (D-28). Se confirmó: `npm ls` no las encuentra, package-lock.json y src no las mencionan, y typography.css solo importa JetBrains Mono.
- **Verificación**:
  - Ninguna `var(--x)` queda sin definir: 428 variables usadas y 440 definidas. Lo revisa `src/styles/tokens.test.ts`, que falla si un nombre viejo vuelve (se probó con `--color-hunter`). Para leer las hojas en Vitest, vite.config.ts suma `test.css.include` solo para `.css?raw`.
  - Capturas de 5 rutas elegidas al azar (`scripts/captura.mjs`, a 1440, 768 y 360 px), dos veces antes y dos después: /app/evaluaciones/13/comparar y /app/evaluaciones/13 (rh), /app (rh-vacio), el fin del candidato (candidato-completada) y la 404 (visitante). En 14 de las 15 capturas, una de antes y una de después coinciden píxel a píxel. En la que queda (el fin del candidato a 1440 px), 5 píxeles difieren en 1 de 255, en el borde de unas letras. Es menos que el ruido entre las dos capturas de antes (16 píxeles, hasta 2 de 255), que también mueve la salamandra de 20 px del pie de una corrida a otra.

### Para aprobar

Ninguno de estos elementos se borró: cada uno espera la aprobación del dueño. La evidencia combina una búsqueda con Grep en `src` (ts, tsx y css) por cada nombre y tres revisiones automáticas:

- Alcance de módulos desde `src/main.tsx` y `src/dev/Showcase.tsx`, siguiendo `import`, `export … from`, `import()` y `@import`.
- Referencias de los 935 exports de `src`, con el servicio de lenguaje de TypeScript.
- Cruce de cada clase de los .css con el código, ya sea literal o con un prefijo dinámico `…${`.

#### Archivos sin uso

| ID | Archivo | Evidencia | Propuesta |
|---|---|---|---|
| L-01 | `src/sections/Trust.tsx` y `Trust.css` | Grep `Trust` (ts, tsx): solo Trust.tsx:2 y :27. Está fuera de la home desde 2026-09-10-multipage-site.md:1205-1229 (auditoria.md 1.9). Además, «Resultados en minutos» y «Pruebas estandarizadas» son afirmaciones sin respaldo (D-18). | Borrar los dos. |
| L-02 | `src/components/ui/GrainTexture.tsx` y `.css` | Grep `GrainTexture`: solo su archivo y el comentario de ui/index.ts:6. El Hero de la Fase 6 ya no lo monta. | Borrar y quitarlo del comentario de ui/index.ts. |
| L-03 | `src/components/ui/FloatingInput.tsx` y `.css` | Grep `FloatingInput`: solo su archivo y ui/index.ts:6. Login y Registro usan Input desde la Fase 7. Su etiqueta da 3.68:1 (design-tokens.md, «Pendientes»). | Borrar. |
| L-04 | `src/components/ui/UserDropdown.tsx` y `.css` | Grep `UserDropdown`: solo su archivo y ui/index.ts:7. Está marcado `@deprecated` (UserDropdown.tsx:7-12): lo reemplaza UserMenu (`components/layout/topbar/UserMenu.tsx`), con las mismas opciones. | Borrar. |
| L-05 | `src/sections/PageHeader.tsx` | Grep `sections/PageHeader` y `from '@/sections/PageHeader'`: ningún importador. Está marcado `@deprecated` (:17): todas las páginas usan PageHeader de `@/components/ui`. | Borrar. |
| L-06 | Barriles `src/components/layout/index.ts`, `src/components/layout/topbar/index.ts` y `src/components/mascota/index.ts` | Grep `from '@/components/layout'`, `'@/components/layout/topbar'`, `'@/components/mascota'` y sus rutas relativas: ningún importador; todo se importa por ruta. No entran al bundle. | Usarlos o borrarlos. Si se usan, el de la mascota no debe exportar Mascota.tsx: lo metería en el bundle principal (D-28). |
| L-07 | `public/logo.png` (46 KB) y su generación en `scripts/generate-favicons.mjs` (:9, :39-42 y :55) | Grep `logo.png` en src, index.html y scripts: solo el script que lo genera, cuyo comentario dice que lo usan «las pantallas que aún no se rediseñan». Login y Registro usan Marca desde la Fase 7. | Borrar el archivo y esas líneas del script. |
| L-08 | `public/brand/strata-logo.png` (83 KB) y `SITE.brand.logo` (config/site.ts:26) | Grep `brand.logo` y `strata-logo`: solo site.ts. | Borrar, o conservar como activo de marca (decide el dueño). |

#### Símbolos sin uso

| ID | Símbolo | Evidencia | Propuesta |
|---|---|---|---|
| L-09 | `getAssessment()` de `src/api/assessments.ts:26` (duplicado) | Grep `getAssessment`: los consumidores (pages/app/evaluaciones/useEvaluacion.ts:2 y :115, y pages/app/resultados/useResultados.ts:2 y :134) importan el de rh.ts:23, que devuelve AssessmentDetail. El de assessments.ts no tiene importadores (auditoria.md 1.7 y 1.9). Los dos piden GET /api/assessments/{id}. | Borrar el de assessments.ts. |
| L-10 | `demoTo` y `demoHref` (Header.tsx) | Grep: ningún resultado. Se borraron al reconstruir porque rompían noUnusedLocals (reconstruccion.md, desviación 7). | Nada: cerrar el punto de auditoria.md 1.9. |
| L-11 | `llevaRadar()` de `src/sections/report/escalas.ts:73` | Grep `llevaRadar`: solo escalas.test.ts:8 y :98-103. SeccionPrueba.tsx:31-32 repite la regla en línea (`conPuntaje.length >= MINIMO_ESCALAS_RADAR`). | Usarla en SeccionPrueba, para tener la regla en un solo lugar, o borrarla junto con su prueba. |
| L-12 | `export default Button` (`src/components/ui/Button.tsx:241`) | Grep de imports por defecto: solo Button.test.tsx:6. Los comentarios de ui/index.ts:4-5 y controles.ts:2-3 dicen que lo importan «las pantallas viejas», y ya no queda ninguna. | Quitar el default, su prueba y esos comentarios. |
| L-13 | `SITE.apiBase` (`src/config/site.ts:30`) | Grep `apiBase`: nadie lo lee, y axios.ts:4 repite `import.meta.env.VITE_API_URL ?? 'http://localhost:8000'` (auditoria.md 1.9). | Borrarlo, o que axios.ts lo lea para tener una sola fuente. |
| L-14 | `SITE.domain` (`src/config/site.ts:15`) | Grep `SITE.domain`: nadie lo lee. index.html:36 lo nombra porque og:image será absoluta cuando exista el dominio. | Conservarlo hasta tener el dominio ([PENDIENTE]); entonces, usarlo o borrarlo. |
| L-15 | `SITE.tagline` (`src/config/site.ts:18`, «Mide la raíz, no la corteza.») | Grep `tagline`: nadie lo lee. Lo usaba el Hero anterior (2026-09-10-sales-site.md:1273); el de la Fase 6 sigue el prototipo. | Borrarlo o reutilizarlo (decide el dueño). |

#### CSS sin uso

| ID | Regla | Evidencia | Propuesta |
|---|---|---|---|
| L-16 | `.section-inner` (`src/styles/global.css:111`) | Grep `section-inner`: solo su regla. Era el contenedor de las páginas anteriores. Al retirar los alias pasó a `--layout-max` y `--layout-page-pad-x`, y ya no vale 0 dentro de `.st-page__content`: si alguien la reusa ahí, duplica el margen lateral. | Borrar. |
| L-17 | `.sr-only` (`src/styles/global.css:79`) | Grep `sr-only`: solo su regla. El código usa VisuallyHidden (`.st-visually-hidden`). | Borrar. |
| L-18 | Modificador `.st-topbar__link--active` (`src/components/layout/TopBar.css:63` y `:110`) | Grep `link--active`: solo TopBar.css. El enlace activo se marca con `aria-current="page"` (NavLinks.tsx:16-19 y :28), también en los casos que se calculan a mano. | Quitarlo de los dos selectores y del comentario de :61-62. |
| L-19 | Keyframes del sistema anterior (`src/styles/animations.css:1-26`): `slideInUp`, `spin`, `shake` y `fadeIn`, más sus versiones con movimiento reducido | Grep: `slideInUp` y `spin` (sin el prefijo st-) no se usan. `shake` solo aparece en FloatingInput.css:25, y `fadeIn` en FloatingInput.css:58 y UserDropdown.css:38 (L-03 y L-04). El comentario de la línea 1 («siguen en uso en pantallas sin rediseñar») ya no es cierto. | Borrar el bloque junto con L-03 y L-04. |
| L-20 | `.header__cta`, `.resumen__list`, `.resumen__row`, `.cand__nav` y la clase sin estilos `.report-toolbar` | Grep: ningún resultado. Desaparecieron cuando se reescribieron Header.css (Fase 2) y las pantallas del candidato y de RR. HH. (Fases 3 y 4). | Nada: cerrar los puntos de auditoria.md 1.9 y de reconstruccion.md. |

#### Tokens STRATA sin uso

| ID | Tokens | Evidencia | Propuesta |
|---|---|---|---|
| L-21 | `--color-on-dark-tertiary` (tokens.css:126), `--color-radar-range-fill` y `--color-radar-range-stroke` (:205-206), `--fs-figure` (:242), `--space-0` (:302), `--space-72` (:339), `--shadow-knob` (:418), `--shadow-primary-sm` (:422), `--z-mascot`, `--z-home-content` y `--z-bubble` (:436-438) y `--width-radar` (:543) | Grep `var(--nombre)` en src: ningún uso, ni con respaldo. Salen del prototipo (auditoria.md §3). `--space-72` solo lo usaba el alias `--sp-20`, que tampoco se usaba. `--z-mascot`, `--z-bubble` y `--z-home-content` quedaron sin uso desde que la Fase 6 creó `--z-mascot-layer`. | Conservarlos como catálogo del sistema, o borrar los que ya no aplican (por ejemplo, los tres `--z-*`). En los dos casos, actualizar design-tokens.md. |

#### Restos de la reconstrucción

| ID | Qué | Evidencia | Propuesta |
|---|---|---|---|
| L-22 | La única supresión de ESLint que queda de la reconstrucción: `react-refresh/only-export-components` en `src/context/AuthContext.tsx:87` | El plan exporta el hook `useAuth` en el mismo archivo que `AuthProvider` (reconstruccion.md, «Reglas de ESLint desactivadas»). Las otras cuatro supresiones desaparecieron al reescribir sus pantallas. La regla solo afecta al Fast Refresh en desarrollo. | Mover `useAuth` a `src/context/useAuth.ts` cambia el import en 13 archivos de código y la referencia en 17 archivos de pruebas. Conviene hacerlo al portar el código real (PB-01), por si AuthContext difiere. |

#### Revisado y fuera de la propuesta

- **Exports que solo usan las pruebas, a propósito**: `reiniciarPreferenciaMascota()` (components/mascota/preferencia.ts:81, documentado como «Solo pruebas») y `src/test/comparativaAnterior.ts` (QA de la Fase 8).
- **Exports que solo se usan en su propio archivo**: 187, casi todos tipos de props y constantes que las pruebas importan. Exportarlos no agrega código al bundle.
- **Pantallas con carga perezosa**: las 27 que App.tsx carga con `lazy(() => import(…))` no tienen importadores estáticos, pero se usan (por ejemplo, DemoPage en App.tsx:20 y :80).
- **Galería de desarrollo** (`showcase.html` y `src/dev/`): solo corre en desarrollo y `vite build` no la publica.
- **`@testing-library/dom`**: ningún archivo lo importa, pero @testing-library/react 16 lo pide como dependencia par.
- **Comentarios que cambian con la limpieza**: ui/index.ts:4-9 (L-02 a L-04 y L-12), controles.ts:2-3 (L-12), animations.css:1 (L-19) y la nota de typography.css:9-12, que queda como historia.

<a id="backend-real"></a>
## Cómo correr el frontend contra el backend real

Sin backend, el sitio carga, pero fallan el catálogo, la demo, el login, el panel y el portal del candidato. Las pruebas automáticas no lo necesitan: simulan la API con los mocks de `e2e/mocks`. Para probar con datos reales:

### 1. Backend

Lo prepara el compañero con el código real (PB-01). Según los planes:

- En `backend/.env`, que no se versiona (2026-09-11-fase1-nucleo.md:92-94):

  ```ini
  SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
  SESSION_DOMAIN=localhost
  FRONTEND_URL=http://localhost:5173
  ```

  CORS admite solo `FRONTEND_URL` y envía credenciales (:110). `FRONTEND_URL` también arma los enlaces de invitación (:1458).
- Con la base de datos lista (el `docker-compose.yml` de la raíz levanta MySQL 8.4 con la base `Mezquit`):

  ```bash
  docker compose up -d mysql
  cd backend
  php artisan migrate:fresh --seed
  php artisan serve --port=8000
  ```

- Usuarios: el operador se siembra como `admin@mez.dev` con la contraseña `password` (`ADMIN_EMAIL` y `ADMIN_PASSWORD`; 2026-09-12-registro-login-crud-usuarios.md:95-99; renombrarlo es PB-33). Una empresa se crea en /registro y recibe créditos de cortesía.

### 2. Frontend

```bash
cd frontend-strata
cp .env.example .env          # VITE_API_URL=http://localhost:8000
npm install
npx vite --port 5173 --strictPort
```

- **El puerto tiene que ser 5173**: Sanctum y CORS solo admiten ese origen. `npm run dev` también usa 5173, pero si está ocupado Vite toma el siguiente puerto libre y el login falla por CORS. Con `--strictPort`, Vite se detiene en lugar de cambiar de puerto.
- **Abre http://localhost:5173, no 127.0.0.1:5173**: la cookie de sesión es del dominio `localhost` (`SESSION_DOMAIN`) y CORS solo admite `FRONTEND_URL`.
- `.env` está en .gitignore. Sin él, el cliente usa http://localhost:8000. Si la API vive en otro lado, cambia `VITE_API_URL` y agrega el origen del frontend a `SANCTUM_STATEFUL_DOMAINS` y a `FRONTEND_URL`.

### 3. Recorrido mínimo de regresión

Adaptado de las pruebas manuales de los planes (2026-09-11-fase1-nucleo.md:3213-3220; 2026-09-12-fase2-panel-rh.md:2066-2072):

1. En /registro, crea una cuenta con empresa: termina en /app/evaluaciones/nueva y la barra muestra el saldo de cortesía (sin empresa, termina en /perfil).
2. En el asistente, crea una evaluación con 2 candidatos (uno con teléfono) y fecha límite: aparece la pantalla de enlaces y el saldo baja 2.
3. Abre un enlace en una ventana privada: invitación verificada, consentimiento y la mitad de las respuestas; cierra, vuelve a abrir (retoma en el primer reactivo sin respuesta) y termina.
4. Abre otra vez el mismo enlace: bloqueo «Esta evaluación ya se completó».
5. En /app/evaluaciones/:id: Copiar, Compartir, Reenviar (deshabilitado en la completada) y Ver reporte. En el reporte, «Descargar PDF» abre la vista previa de impresión con el pie legal.
6. «Comparar candidatos»: ordena con el teclado y exporta el CSV.
7. En /app/creditos, solicita créditos: el saldo no cambia.
8. Entra como operador: en /admin/creditos aprueba la solicitud (el saldo de la empresa sube); en /admin/usuarios busca, edita y prueba a eliminarte (409); en /admin/perfil cambia el correo.
9. Cierra la sesión en otra pestaña y haz una acción en /app: lleva a /login con el aviso y, al entrar, vuelve a la misma ruta.
10. Envía /demo con datos válidos e inválidos (201 y 422), y entra con un usuario sin empresa: /app lleva a /perfil con el aviso.

### 4. Llamadas a la API

Son las 33 llamadas del frontend (auditoria.md 1.6), todas en `src/api/*` salvo POST /api/leads (`sections/ContactSection.tsx`). Si una respuesta real difiere de su mock en `e2e/mocks`, manda el backend: se ajustan el cliente o la pantalla, el mock y su prueba (T-11).

| Área | Llamada | Dónde se usa | Qué revisar |
|---|---|---|---|
| Sesión | GET /sanctum/csrf-cookie | Antes de login, registro, leads y el primer POST del portal | Cookie XSRF-TOKEN; un 419 se reintenta una vez |
| Sesión | POST /api/register | /registro | 422 por campo; termina en /app/evaluaciones/nueva, o en /perfil sin empresa |
| Sesión | POST /api/login | /login | Redirección según la organización y vuelta a la ruta de origen |
| Sesión | POST /api/logout | Salir, en la pastilla y en el menú móvil | Vuelve al sitio público sin sesión |
| Sesión | GET /api/user | Al cargar la app | 401 sin sesión; organization_id e is_platform_admin |
| Perfil | GET /api/user/profile | /perfil y la pastilla de RR. HH. | Nombre de la organización (PB-02) |
| Perfil | PUT /api/user/profile | /perfil | 422 por campo; fecha de nacimiento |
| Perfil | PUT /api/user/password | /perfil | Contraseña actual incorrecta; confirmación |
| Catálogo | GET /api/catalog | /, /pruebas y /app/pruebas | Categorías, conteos y rango de duración |
| Catálogo | GET /api/catalog/{slug} | /pruebas/:slug | 404 distinto del error de red |
| Leads | POST /api/leads | /demo | 201, 422 por campo, 419 y 500 |
| Candidato | GET /api/evaluar/{token} | /evaluar/:token | Pendiente, iniciada, completada, expirada y 404 |
| Candidato | GET /api/evaluar/{token}/pruebas/{testId} | Examen | Reactivos, `answered` y allows_back |
| Candidato | POST /api/evaluar/{token}/consent | Acceso | Se guarda antes del primer reactivo; 409 |
| Candidato | POST /api/evaluar/{token}/answers | Examen | Una por respuesta, con elapsed_ms; 409 |
| Candidato | POST /api/evaluar/{token}/events | Examen | blur al perder el foco |
| Candidato | POST /api/evaluar/{token}/complete | Último reactivo | Una sola vez; un 409 lleva al bloqueo |
| RR. HH. | GET /api/assessments | /app y /app/evaluaciones | Conteos por estado |
| RR. HH. | POST /api/assessments | Asistente | Payload, 422 por campo y 422 por saldo |
| RR. HH. | GET /api/assessments/{id} | Detalle de la evaluación y Resultados | Enlaces; 403 de otra organización |
| RR. HH. | GET /api/assessments/{id}/compare | Comparativa | Orden y CSV |
| RR. HH. | POST /api/invitations/{id}/resend | Detalle | Reenvía el correo; un 409 (ya completada) se muestra en la fila |
| RR. HH. | GET /api/invitations/{id}/report | Reporte | Una sección por prueba; 403, 409 y 404 |
| RR. HH. | GET /api/credits | Barra de RR. HH. y /app/creditos | Saldo y movimientos con referencia |
| RR. HH. | POST /api/credit-requests | Drawer «Solicitar créditos» | 201 y 422 |
| Super admin | GET /api/admin/credit-requests | Barra del operador y /admin/creditos | Contador de pendientes |
| Super admin | POST /api/admin/credit-requests/{id}/approve | /admin/creditos | Confirmación; 409 si ya se resolvió |
| Super admin | POST /api/admin/credit-requests/{id}/reject | /admin/creditos | Confirmación; 409 si ya se resolvió |
| Super admin | GET /api/admin/users | /admin/usuarios | Búsqueda y páginas de 15 |
| Super admin | GET /api/admin/users/{id} | /admin/usuarios/:id | Campos de solo lectura |
| Super admin | PATCH /api/admin/users/{id} | /admin/usuarios/:id | 422 por campo; apellido vacío (PB-27) |
| Super admin | DELETE /api/admin/users/{id} | /admin/usuarios y el detalle | 409 al eliminarse a sí mismo |
| Super admin | PUT /api/admin/me | /admin/perfil | El correo nuevo pasa a la sesión; error genérico (PB-24) |

<a id="pruebas"></a>
## Cómo correr las pruebas y las capturas

Desde `frontend-strata/`, con Node 22.12 o superior (lo pide Vitest 5) y `npm install`. Para Playwright, la primera vez: `npx playwright install chromium`. El detalle de cada script está en el [README](../../frontend-strata/README.md#scripts).

| Comando | Qué hace |
|---|---|
| `npm run typecheck` | TypeScript del código de la app, sin emitir |
| `npm run lint` | ESLint en todo el proyecto |
| `npm test` | Vitest y Testing Library: 145 archivos, 1159 pruebas (unos 4 min). Un archivo: `npx vitest run src/components/ui/Button.test.tsx` |
| `npm run build` | `tsc -b` (app, configuración y pruebas de extremo a extremo) y `vite build` |
| `npm run test:e2e` | Playwright: 19 recorridos en Chromium, con la API simulada y movimiento reducido. Levanta Vite en el puerto 5189 y no necesita backend (alrededor de 1 min). Un archivo: `npx playwright test admin` |

**Scripts de QA de la Fase 8.** Se corren a mano con el sitio en el puerto 5188 y guardan su evidencia en `.capturas/`, que git ignora:

```bash
npx vite --port 5188 --strictPort      # en otra terminal
node e2e/a11y.mjs                       # axe en 49 rutas a 1440 y 360 px, más estados abiertos
node e2e/recorrido.mjs --abrir-menus    # desborde, consola y movimiento
node e2e/barras.mjs                     # ancho mínimo de una fila por barra
node e2e/tablas.mjs                     # desplazamiento lateral de las tablas, de 600 a 1000 px
node e2e/teclado.mjs                    # 8 recorridos de teclado con foco visible
node e2e/contraste.mjs --pagina         # pares de tokens y, después de a11y.mjs, los nodos que axe no decide
node e2e/toast-overlay.mjs              # toast con el modal y el drawer abiertos
node e2e/fugas-mascota.mjs              # 20 ciclos sin fugas; --solo fugas|reducido|titular|clics|ocultar
node e2e/capturas.mjs                   # todas las rutas a 360, 768 y 1440 px
```

En Git Bash, las opciones con rutas necesitan `MSYS_NO_PATHCONV=1`; por ejemplo, `MSYS_NO_PATHCONV=1 node e2e/a11y.mjs --ruta /app`.

**Capturas sueltas.** `node scripts/captura.mjs http://localhost:5188/app rh-resumen 1440,768,360 --mock e2e/mocks/rh.json` guarda `.capturas/rh-resumen-<ancho>.png`, y `node scripts/captura.mjs --validar` revisa los mocks sin abrir el navegador. La galería de componentes está en `/showcase.html` con `npm run dev`.

**Lighthouse.** Las cifras de D-28 son de Lighthouse 13 en perfil móvil sobre el build (`npm run build` y `npx vite preview`), con tres corridas y su mediana. Lighthouse no es dependencia del proyecto.

<a id="migracion"></a>
## Migración de `frontend-strata/` a `frontend/`

Para cuando aparezca el código real del frontend ([PB-01](pendientes-backend.md#pb-01)). Sigue [D-01](decisiones.md#d-01) (monorepo) y [D-26](decisiones.md#d-26), y amplía «Cómo comparar con el código real» de [reconstruccion.md](reconstruccion.md). La idea: aplicar el código real como un commit sobre la base de la reconstrucción y fusionarlo con el rediseño, para que git porte solo lo que los planes no describen.

### Antes de empezar

- **El código real**: el repo embebido en `c61e7333efe547698d2c17cc5926fbea65e0d5f5` o un commit posterior, sin `.git`, `node_modules/`, `dist/` ni `.env`. Su historial versionó `.env`, así que no se publica (PB-01, «Seguridad»).
- **Aprobación**: quitar el gitlink de `frontend/` necesita la aprobación explícita del dueño (D-26).
- **La base**: el commit 817a5df (`chore(frontend): reconstruir frontend desde docs/superpowers (base del rediseño)`). Para confirmarlo: `git log --diff-filter=A --format="%h %s" -- frontend-strata/package.json`.
- **El rediseño, completo en git**: feat/rediseno-strata con el cierre de la Fase 8 ya en un commit.

### 1. El código real, como commit sobre la base

```bash
git switch -c frontend-real 817a5df
git rm -r -q frontend-strata
# copiar aquí el código real dentro de frontend-strata/
git add frontend-strata
git commit -m "chore(frontend): código real sobre la reconstrucción"
```

### 2. Revisar el diff contra la base

```bash
git diff --stat 817a5df frontend-real -- frontend-strata
git diff --ignore-cr-at-eol 817a5df frontend-real -- frontend-strata/src
```

Cada diferencia es algo que los planes no describen o una de las 9 desviaciones de reconstruccion.md. Conviene revisarlas en este orden:

1. **`src/api/*`, `src/context/AuthContext.tsx` y las guardas**: contratos y sesión; manda el código real. Desde la base, el rediseño solo cambió `axios.ts` (interceptor de sesión vencida y de 419, y `asegurarCsrf`) y `candidate.ts` (`asegurarCsrf` antes de cada POST del portal); los otros 8 clientes siguen idénticos, así que sus cambios entran sin conflicto. AuthContext, RequireAuth y RequirePlatformAdmin sí cambiaron, por la sesión vencida y la ruta de origen (D-07, puntos 6 y 8).
2. **Las 9 desviaciones de la reconstrucción**: confirmar qué hace el código real en cada una.
3. **Validaciones, permisos y reglas de negocio** de las pantallas: se portan al componente que hoy tiene esa lógica (tabla del paso 3).
4. **package.json**: se toman las versiones del código real y se conservan las dependencias del rediseño (gsap, @fontsource/jetbrains-mono, Vitest, Testing Library, jsdom, @playwright/test y @axe-core/playwright).
5. **Estilos y markup**: manda el rediseño.

### 3. Fusionar con el rediseño

```bash
git switch feat/rediseno-strata
git merge frontend-real
```

- Habrá conflictos en casi todas las pantallas, porque el rediseño las reescribió en su mismo archivo. En cada uno: la apariencia del rediseño, y los datos, las validaciones, los permisos y las reglas del código real (T-11, T-12; reglas 1 y 5 del dueño).
- `pages/app/AppLayout.css`, `pages/admin/AdminLayout.css` y `pages/candidate/CandidateFlow.css` ya no existen. Si el código real los cambió, git avisa con un conflicto «modify/delete»: no se restauran; lo que hagan se lleva al componente nuevo.
- Dónde quedó la lógica de los archivos de los planes:

| Archivo de los planes | Dónde está ahora la lógica |
|---|---|
| `pages/app/AppLayout.tsx` y `pages/admin/AdminLayout.tsx` | Solo montan PageLayout; la barra está en `components/layout/topbar/BarraRh.tsx` y `BarraAdmin.tsx` |
| `components/layout/Header.tsx` y `components/ui/UserDropdown.tsx` | Header usa TopBar con `topbar/NavLinks.tsx`, `UserMenu.tsx` y `MobileMenu.tsx`; UserDropdown quedó sin uso (L-04) |
| `pages/candidate/CandidateFlow.tsx` | `pages/candidate/useCandidateFlow.ts` (estado y llamadas) y las vistas AccesoVerificado, ExamenFoco, FinEvaluacion y BloqueoCandidato |
| `pages/app/NuevaEvaluacion.tsx` | `pages/app/nueva/` (modelo.ts y estadoAsistente.ts tienen las reglas) |
| `pages/app/EvaluacionesPage.tsx` y `EvaluacionDetallePage.tsx` | `pages/app/evaluaciones/` y `pages/app/invitaciones/` |
| `pages/app/CreditosPage.tsx` | `pages/app/creditos/` |
| `pages/app/ResumenPage.tsx` | `pages/app/resultados/` |
| `pages/app/CompararPage.tsx` | `pages/app/comparar/` |
| `sections/Report.tsx` | `sections/report/` (una sección por prueba) |
| `pages/PerfilPage.tsx` | `pages/perfil/` |
| `pages/auth/Login.tsx` y `Registro.tsx` | AuthFrame, `validacion.ts`, `fallas.ts` y `opcionesEmpresa.ts`, en `pages/auth/` |
| `pages/admin/AdminCreditosPage.tsx`, `AdminUsuariosPage.tsx` y `AdminUsuarioDetallePage.tsx` | `pages/admin/creditos/` y `pages/admin/usuarios/` |
| `pages/PruebasPage.tsx` y `PruebaDetallePage.tsx` | `pages/catalogo/` y `pages/publicas/` |
| `pages/HomePage.tsx` | `pages/home/`, `sections/Hero.tsx` y `sections/HowItWorks.tsx` |
| `components/ui/FloatingInput.tsx` y `GrainTexture.tsx` | Sin uso: los reemplazan Input y la home nueva (L-02, L-03) |

### 4. Verificar

```bash
cd frontend-strata
npm install
npm run build && npm run lint && npm test && npm run test:e2e
```

- `src/styles/tokens.test.ts` falla si el código real trae nombres de tokens viejos: cámbialos por su equivalente ([design-tokens.md](../design-tokens.md), «Nombres del sistema anterior»).
- Si un contrato real difiere de su mock en `e2e/mocks`, corrige el mock y la prueba: manda el backend.
- Corre el [recorrido contra el backend real](#backend-real) y la QA de accesibilidad (`node e2e/a11y.mjs`).
- Corrige la sección 1 de auditoria.md donde el código real difiera y anota el cierre en reconstruccion.md.

### 5. Reemplazar el gitlink, en un commit aparte

```bash
git rm --cached frontend
rmdir frontend
git mv frontend-strata frontend
git commit -m "chore(frontend): frontend-strata pasa a frontend (D-01)"
```

- Después, cambia `frontend-strata` por `frontend` en el README de la carpeta, en los comentarios de uso de `e2e/*.mjs` y en estos documentos. Las rutas del código son relativas y no cambian. El paquete de package.json se llama `frontend-strata`; renombrarlo es opcional.
- Si la carpeta se mueve antes de que llegue el código real, git suele detectar el renombre al fusionar; si no lo detecta, el paso 1 se hace directamente sobre `frontend/`.
- El gitlink de `backend/` lo reemplaza el compañero de la misma forma (`git rm --cached backend` y el código sin `.git` ni `.env`), y rota la APP_KEY y las credenciales si ese historial llegó a algún remoto (PB-01).
