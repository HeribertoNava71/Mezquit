# STRATA · Tokens de diseño y reglas de uso

Sistema de diseño del rediseño STRATA, definido en la Fase 1. Reemplaza la paleta y las fuentes Mezquit (T-05).

- **Dónde están.** En `frontend-strata/src/styles/tokens.css`: custom properties en `:root` (los alias temporales de D-20 se retiraron en la Fase 8; ver «Nombres del sistema anterior»). `global.css` aplica la base: fondo, tipografía, transición de estado, foco visible y movimiento reducido. `animations.css` contiene los keyframes `st-*`.
- **De dónde salen.** Del brief del dueño (PROMPT_CLAUDE_CODE.md, secciones «Sistema de diseño», «Layout» y «Movimiento») y del prototipo aprobado (Strata.dc.html), resumidos en [auditoria.md §3](rediseno/auditoria.md). Aplican las decisiones D-04 (fuentes), D-19 (primario y contraste), D-20 (alias) y D-22 (avisos) de [decisiones.md](rediseno/decisiones.md).
- **Contraste.** Es cálculo propio con la fórmula de WCAG 2.x (luminancia relativa). AA pide 4.5:1 en texto normal y 3:1 en texto grande (24 px, o 18.66 px en negrita). También pide 3:1 en componentes de interfaz, indicadores de foco y gráficos que transmiten información (criterio 1.4.11). Los fondos translúcidos se componen sobre #FAF8F5; «vidrio» es rgba(255,255,255,.72) sobre #FAF8F5.
- **Nombres.** Son semánticos, en inglés y con el prefijo de su grupo: `--color-*`, `--fs-*`, `--space-*`, `--radius-*`, etc. Ningún nombre STRATA coincide con uno del sistema anterior; así, en la Fase 8 los alias se borraron sin tocar ningún token STRATA. `src/styles/tokens.test.ts` falla si alguna `var(--x)` sin respaldo no está definida en ningún lado.

## Reglas de uso

1. **Solo tokens.** En los .css de componentes no hay colores sueltos: todo va con `var(--…)`. Si falta un valor, agrégalo a tokens.css y a este documento. Los estilos en línea solo llevan valores dinámicos: anchos de barras, posiciones calculadas y el índice `--i` del escalonado.
2. **Primario navy (D-19).**
   - Botón primario: fondo `--color-primary` (#1E3A8A) con texto `--color-on-primary` (10.36:1). Hover y presionado: `--color-primary-hover` (#172554). Sombras: `--shadow-primary*`.
   - Variante tinta: fondo `--color-text` y hover `--color-navy`, como «Comprar un test» en el prototipo.
   - Variante de peligro: `--color-error-text`, con hover `--color-error-hover`.
3. **Coral solo para acentos** y para el subrayado de 2 px del enlace activo (`--color-indicator-active`). Nunca como fondo de texto (con blanco da 2.78:1) ni como texto (2.62:1 sobre #FAF8F5). Los CTA coral del prototipo pasan a navy.
4. **#0EA5E9 nunca es texto ni fondo de texto.** `--color-sky-strong` da 2.77:1 con blanco. Úsalo en bordes de hover y de selección, aros y puntos de radio, progreso y radar. Un chip o paso activo con texto lleva fondo `--color-navy` con texto blanco, o fondo `--color-sky-tint` con texto `--color-sky-deep`.
5. **#38BDF8 nunca es texto sobre fondo claro.** `--color-sky` da 2.14:1. Úsalo en puntos, progreso y acentos sobre oscuro.
6. **Enlaces.** Color `--color-link` (navy); en hover, `--color-link-hover` (#0369A1). El hover #0EA5E9 del prototipo no cumple como texto.
7. **Éxito y error siempre con ícono y texto**, nunca solo con color (D-22).
   - Los errores van inline, junto al campo o a la sección.
   - El campo con error lleva `aria-invalid` y `aria-describedby`.
   - El toast solo confirma acciones (copiar, reenviar, solicitud enviada, guardado) y lleva `role="status"` (aria-live polite).
8. **Verde de éxito.** El texto usa `--color-success-text` (#157A3A). El verde del prototipo, #16A34A (`--color-success-icon`), solo va en íconos, checks y bordes de control válido: da 3.30:1 con blanco, suficiente para gráficos pero no para texto.
9. **Bordes funcionales.** Input, select, textarea, casilla y aro de radio sin marcar usan `--color-border-control` (#8B8574): 3.68:1 sobre blanco y 3.47:1 sobre #FAF8F5. Los bordes claros del prototipo (#E7E2D8, #E5E0D8, #D6CFC2 y #C9C2B4, de 1.29 a 1.77:1) quedan para tarjetas, divisores y botones, que se reconocen por su texto. Estados del control:
   - Error: borde `--color-error-text` y fondo `--color-error-bg`.
   - Válido: borde `--color-success-icon` y fondo `--color-success-bg-subtle`.
   - Foco: borde `--color-focus` y `box-shadow: var(--focus-ring)`; con error, borde `--color-error-text` y `var(--focus-ring-error)`.
   - Marcado (casilla, radio y opción elegida): `--color-control-checked`, el mismo celeste de interfaz que el foco (`--color-sky-ui`).
10. **Foco siempre visible.** La regla global de `:focus-visible` dibuja un outline de 2 px en `--color-focus`, separado 2 px del control.
    - No uses `outline: none`.
    - Si el control usa su propio anillo (`--focus-ring`), deja `outline: 2px solid transparent` para que el foco se siga viendo en modo de alto contraste.
    - Dentro de una superficie tinta o navy, agrega la clase `st-on-dark` al contenedor: cambia el foco a #38BDF8.
11. **Sobre oscuro** solo se usan los `--color-on-dark-*` (6.84:1 o más). `--color-dot-on-dark` (#475569, 2.36:1) solo sirve como separador.
12. **Datos.** Las barras y el radar siempre llevan su valor en texto, y el texto de cada nivel usa `--color-data-*-text`, nunca el color de la barra. Los puntos decorativos (`--color-dot*`) nunca son lo único que transmite la información.
13. **Texto sobre halos.** Los mensajes de estado van dentro de una superficie (vidrio, blanca o Callout), no directo sobre un halo. En el centro del halo coral, por ejemplo, #157A3A baja a 4.21:1.
14. **Tipografía.**
    - Títulos con `--font-heading` (Satoshi), texto con `--font-text` (General Sans) y códigos con `--font-mono` (JetBrains Mono). Las cifras de datos (saldo, resumen, totales) van en General Sans, como en el prototipo, que las hereda del body; Satoshi solo en cifras de marca como el precio de la home (Strata.dc.html:251). Fontshare no sirve el peso 800 de ninguna de las dos: se pinta en 700, igual que en el prototipo.
    - Los cuatro títulos mayores (`--fs-display`, `--fs-h1`, `--fs-h2` y `--fs-h2-sm`) son fluidos: desde unos 1100 px valen lo del prototipo y a 360 px bajan a 34, 32, 26 y 24 px.
15. **Movimiento.**
    - Las entradas usan los `--anim-*`, con fill «backwards» para no fijar `transform` y no romper el hover.
    - El escalonado se escribe `animation-delay: calc(var(--i) * var(--stagger-card))` (o `--stagger-row`), con `style={{ '--i': index }}`.
    - Con prefers-reduced-motion, la regla global anula animaciones, transiciones y retardos. Lo que se anima con JS consulta `useReducedMotion()`; la mascota queda quieta u oculta.
16. **Capas.** Solo `--z-*`. Los menús de la barra usan `--z-dropdown`; modales, drawer y su fondo, `--z-overlay`. El toast queda encima de todo.
17. **Móvil (640 px o menos).** Los tokens de layout se reducen solos, por pasos: el padding de página pasa de 48/34/88 a 32/20/64 px y, a 400 px o menos, a 24/16/56 px (margen lateral de 16 px en teléfonos chicos). A 640 px o menos, las tablas pasan a tarjetas (D-23), y también más ancho cuando la tabla no cabe en su contenedor (DataTable, clase `st-table--tarjetas`, Fase 8). Los breakpoints no pueden ser variables CSS: son 400 px, 640 px y el corte del menú móvil de cada barra: 768 px (super admin), 900 px (RR. HH.) y 960 px (pública), medidos en la Fase 8 con `e2e/barras.mjs` (topbar/cortes.ts y TopBar.css).

## Recetas

Son ejemplos; los nombres de clase son ilustrativos.

```css
/* Tarjeta de vidrio */
.st-card--glass {
  background: var(--surface-glass-bg);
  border: var(--surface-glass-border);
  border-radius: var(--surface-glass-radius);
  box-shadow: var(--shadow-glass);
  backdrop-filter: blur(var(--blur-glass));
}

/* Botón primario */
.st-btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: var(--radius-control);
  font-size: var(--fs-ui);
  font-weight: var(--fw-semibold);
  box-shadow: var(--shadow-primary);
}
.st-btn--primary:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-primary-hover);
}

/* Input: reposo, foco, error y válido */
.st-input {
  border: var(--border-width) solid var(--color-border-control);
  border-radius: var(--radius-control);
  background: var(--color-bg);
  color: var(--color-text);
}
.st-input:focus-visible {
  outline: var(--focus-outline-width) solid transparent;
  border-color: var(--color-focus);
  background: var(--color-surface-white);
  box-shadow: var(--focus-ring);
}
.st-input[aria-invalid='true'] { border-color: var(--color-error-text); background: var(--color-error-bg); }
.st-input--valid { border-color: var(--color-success-icon); background: var(--color-success-bg-subtle); }

/* Encabezado de página: eyebrow, H1 y entradilla */
.st-page-header__eyebrow {
  font-size: var(--fs-eyebrow);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--color-eyebrow);
}
.st-page-header__title {
  font-size: var(--fs-h1);
  line-height: var(--lh-display);
  letter-spacing: var(--tracking-display);
  text-wrap: balance;
}
.st-page-header__lead {
  font-size: var(--fs-lead);
  line-height: var(--lh-relaxed);
  color: var(--color-lead);
}

/* Tarjetas escalonadas, con style={{ '--i': index }} */
.st-grid__item {
  animation: var(--anim-rise-in);
  animation-delay: calc(var(--i, 0) * var(--stagger-card));
}
```

## Tokens

### Color · fondos y superficies

| Token | Valor | Uso | Contraste (WCAG 2.x) |
|---|---|---|---|
| `--color-bg` | `#FAF8F5` | Fondo de página; inputs del builder y modales; pies de modal | Fondo: tinta 16.84:1 · secundario 7.00:1 · terciario 5.46:1 · placeholder 4.83:1 · eyebrow 5.60:1 |
| `--color-bg-alt` | `#F7F5F0` | Beige secundario: hover de «cerrar», base del thead | Fondo: tinta 16.39:1 · terciario 5.31:1 |
| `--color-bg-thead` | `rgba(247, 245, 240, 0.6)` | Cabecera de tabla (beige al 60 %) | Fondo (sobre blanco): terciario 5.50:1 |
| `--color-surface-white` | `#FFFFFF` | Tarjetas blancas, inputs con foco, botones secundarios | Fondo: tinta 17.85:1 · datos 11.34:1 · secundario 7.42:1 · terciario 5.79:1 |
| `--color-surface-soft` | `#FCFBF9` | Input neutro del candidato, opción apagada | Fondo: placeholder 4.95:1 · borde de control 3.56:1 |
| `--color-surface-hover` | `#FDFCFA` | Hover de fila y pie de tabla | Fondo: datos 11.06:1 · foco 3.99:1 |
| `--color-surface-track` | `#F1EDE4` | Pista de los controles segmentados | Fondo: tinta 15.28:1 · terciario 4.95:1 · foco 3.51:1 |
| `--color-surface-muted` | `#F0EDE5` | Badges neutros (Consumida), pistas de barras, divisores de fila | Fondo: terciario 4.95:1 · secundario 6.34:1 |
| `--color-surface-dark` | `#0F172A` | Superficie oscura: vista previa, banner, toast, burbuja | Fondo: ver «Sobre oscuro» |
| `--color-surface-pill` | `rgba(255, 255, 255, 0.8)` | Pastilla de usuario y eyebrow del hero | Fondo: tinta 17.65:1 · secundario 7.33:1 · saldo 7.49:1 |
| `--color-surface-ghost` | `rgba(255, 255, 255, 0.9)` | Botón secundario sobre vidrio («Previsualizar») | Fondo: navy 10.30:1 |
| `--color-scrim` | `rgba(15, 23, 42, 0.42)` | Fondo detrás de modales y drawer | Decorativo |
| `--color-topbar-bg` | `rgba(250, 248, 245, 0.92)` | Barra superior translúcida. El prototipo usa .78; con el banner oscuro del reporte debajo, el enlace inactivo bajaba a 3.4:1 (Fase 8) | Fondo: tinta 16.84:1 · terciario 5.46:1 · con #0F172A debajo, terciario 4.63:1 |
| `--color-exam-bar-bg` | `rgba(250, 248, 245, 0.8)` | Barra del examen | Fondo: tinta 16.84:1 · terciario 5.46:1 |

### Color · texto

| Token | Valor | Uso | Contraste (WCAG 2.x) |
|---|---|---|---|
| `--color-text` | `#0F172A` | Tinta: títulos y texto base | 17.85:1 blanco, 16.84:1 #FAF8F5 |
| `--color-text-data` | `#3D3A33` | Celdas, labels del candidato, valores de totales | 11.34:1 blanco |
| `--color-text-secondary` | `#5B5545` | Entradillas, labels, apoyo | 7.42:1 blanco, 7.00:1 #FAF8F5 |
| `--color-text-tertiary` | `#6B6558` | Ayudas, th, notas, nav inactiva | 5.46:1 #FAF8F5, 4.95:1 #F0EDE5 |
| `--color-text-placeholder` | `#756D5C` | ::placeholder | 4.83:1 #FAF8F5, 4.95:1 #FCFBF9 |
| `--color-text-slate` | `#475569` | Texto de la pastilla de saldo | 7.58:1 blanco |
| `--color-icon-muted` | `#8B8574` | Trazo de íconos de input y reloj (gráfico, ≥3:1) | 3.47:1 #FAF8F5 |
| `--color-eyebrow` | `var(--color-sky-text)` = `#0369A1` | Eyebrow de 11 px | 5.93:1 blanco · 5.60:1 #FAF8F5 · 5.84:1 vidrio |
| `--color-lead` | `var(--color-text-secondary)` = `#5B5545` | Entradilla de 17 px | 7.00:1 #FAF8F5 · 7.30:1 vidrio |
| `--color-link` | `var(--color-navy)` = `#1E3A8A` | Enlaces de texto | 10.36:1 blanco · 9.77:1 #FAF8F5 |
| `--color-link-hover` | `var(--color-sky-text)` = `#0369A1` | El #0EA5E9 del prototipo no cumple como texto | 5.93:1 blanco · 5.60:1 #FAF8F5 |
| `--color-selection` | `#BAE6FD` | ::selection, con tinta encima | 13.45:1 |

### Color · marca y acentos

| Token | Valor | Uso | Contraste (WCAG 2.x) |
|---|---|---|---|
| `--color-navy` | `#1E3A8A` | Marca, primario, enlaces, precios | 10.36:1 con blanco |
| `--color-navy-hover` | `#172554` | Hover y presionado del primario | 14.69:1 con blanco |
| `--color-navy-tint` | `#E8ECF7` | Fondo de Disponible/Completado, chip de peso, tag navy | Fondo: navy 8.77:1 · foco 3.47:1 |
| `--color-on-navy` | `#FFFFFF` | Texto sobre navy | 10.36:1 sobre navy · 14.69:1 sobre el hover |
| `--color-on-navy-muted` | `#DBEAFE` | Iniciales del avatar navy | 8.49:1 |
| `--color-primary` | `var(--color-navy)` = `#1E3A8A` | Botón primario (D-19) | Blanco encima 10.36:1 |
| `--color-primary-hover` | `var(--color-navy-hover)` = `#172554` | Hover y presionado del botón primario | Blanco encima 14.69:1 |
| `--color-on-primary` | `var(--color-on-navy)` = `#FFFFFF` | Texto del botón primario | 10.36:1 |
| `--color-sky` | `#38BDF8` | Celeste: puntos, progreso, check, acento sobre oscuro. Nunca texto sobre claro (2.14:1) | 2.14:1 blanco (no texto) · 8.33:1 sobre tinta |
| `--color-sky-text` | `#0369A1` | Celeste para texto: eyebrows, mono, íconos | 5.93:1 blanco, 5.60:1 #FAF8F5 |
| `--color-sky-strong` | `#0EA5E9` | Selección, radios y chips activos, bordes de hover, radar. Nunca texto (2.77:1) | 2.77:1 blanco · blanco encima 2.77:1: ni texto ni fondo de texto |
| `--color-sky-ui` | `#0284C7` | Celeste de interfaz: base de `--color-focus` y `--color-control-checked`. No es texto normal (no llega a 4.5:1) | Gráfico: 4.10:1 blanco · 3.86:1 #FAF8F5 · 3.83:1 #EFF9FE · 3.51:1 #F1EDE4 · 3.47:1 #E8ECF7 · 4.36:1 tinta |
| `--color-sky-deep` | `#075985` | Texto sobre tintes celeste | 7.08:1 #EFF9FE |
| `--color-sky-deeper` | `#0C4A6E` | Texto del nivel bajo del reporte | 9.46:1 blanco |
| `--color-sky-tint` | `#EFF9FE` | Selección, En uso, hover de stepper, callout informativo | Fondo: sky-deep 7.08:1 · sky-text 5.55:1 · foco 3.83:1 |
| `--color-sky-tint-strong` | `#E6F6FE` | Enviada/En proceso, chips de código, caja de ícono | Fondo: sky-deep 6.83:1 · sky-text 5.36:1 |
| `--color-sky-tint-soft` | `#F2FAFE` | Consentimiento activo, opción activa de la demo | Fondo: secundario 7.02:1 · tinta 16.90:1 |
| `--color-sky-tint-subtle` | `#F5FCFF` | Fila o elemento seleccionado | Fondo: tinta 17.22:1 · sky-deeper 9.12:1 · foco 3.95:1 |
| `--color-sky-border` | `#BAE6FD` | Bordes informativos y de selección suave | Decorativo (1.33:1 sobre blanco) |
| `--color-coral` | `#FF6B6B` | Solo acentos y subrayado activo (D-19). Nunca fondo de texto (2.78:1) | 2.62:1 #FAF8F5 · blanco encima 2.78:1 · tinta encima 6.43:1 |
| `--color-coral-strong` | `#F4574F` | Hover de acentos coral | Blanco encima 3.32:1: nunca fondo de texto |
| `--color-coral-tint` | `#FFF1F1` | Insignia y tag coral | Fondo: coral-text 5.14:1 |
| `--color-coral-border` | `#FFD9D9` | Borde de la insignia coral | Decorativo |
| `--color-coral-text` | `#B93A34` | Texto sobre tinte coral | 5.14:1 #FFF1F1 |
| `--color-slate-tint` | `#EEF2F6` | Fondo del badge slate (neutro frío): «Ajuste» de Créditos, que en coral se confundía con un error (Fase 8) | Fondo: `--color-text-slate` 6.74:1 |
| `--color-slate-dot` | `#64748B` | Punto del badge slate | Decorativo: siempre con texto |
| `--color-indicator-active` | `var(--color-coral)` = `#FF6B6B` | Subrayado de 2 px del enlace activo | Gráfico 2.62:1 sobre #FAF8F5: complementa el color y el peso del enlace activo, y aria-current |

### Color · bordes y puntos

| Token | Valor | Uso | Contraste (WCAG 2.x) |
|---|---|---|---|
| `--color-border-control` | `#8B8574` | Borde funcional (≥3:1): input, select, textarea, casilla y radio | 3.68:1 blanco, 3.47:1 #FAF8F5 · 3.33:1 #FCF1F0 |
| `--color-control-checked` | `var(--color-sky-ui)` = `#0284C7` | Casilla y radio marcados, borde de la opción elegida y pastilla de orden activa de DataTable. El #0EA5E9 del prototipo da 2.59:1 sobre #EFF9FE | 4.10:1 blanco · 3.83:1 #EFF9FE · 3.88:1 #F2FAFE · 3.86:1 #FAF8F5 · palomita blanca encima 4.10:1 |
| `--color-border-neutral` | `#E7E2D8` | Bordes neutros: chips, filas de opción, divisores de drawer, retícula | Decorativo (1.29:1 sobre blanco) |
| `--color-border-subtle` | `#EBE5DA` | Pastillas y separadores de sección | Decorativo (1.25:1) |
| `--color-border-card` | `#EFE9DF` | Tarjeta secundaria, demo y badges flotantes | Decorativo (1.21:1) |
| `--color-border-warm` | `#E5E0D8` | Tarjeta del acceso, segmentados, caja de ícono | Decorativo (1.31:1) |
| `--color-border-divider` | `#EDE9E0` | Divisores de cabecera y pie de tarjetas y modales; pista de progreso | Decorativo (1.21:1) |
| `--color-border-strong` | `#D6CFC2` | Botones secundarios y bordes punteados | Decorativo (1.55:1); los botones se identifican por su texto |
| `--color-border-ghost` | `#E0D9CB` | Botón secundario sobre vidrio («Previsualizar») | Decorativo (1.40:1) |
| `--color-border-cool` | `#E2E8F0` | Tarjetas blancas del reporte y de la pregunta | Decorativo (1.23:1) |
| `--color-border-cool-hover` | `#CBD5E1` | Hover de la tarjeta del catálogo | Decorativo (1.48:1) |
| `--color-border-glass` | `rgba(255, 255, 255, 0.92)` | Borde del vidrio | Decorativo |
| `--color-border-step` | `rgba(255, 255, 255, 0.9)` | Borde del paso translúcido | Decorativo |
| `--color-connector` | `#DCD5C8` | Conector punteado entre pasos | Decorativo |
| `--color-dot` | `#C9C2B4` | Separador entre metadatos | Decorativo (1.77:1) |
| `--color-dot-soft` | `#D2CBBD` | Separador del acceso | Decorativo |
| `--color-dot-neutral` | `#A8A296` | Punto de badge neutro y rango bajo (2.54:1: nunca solo) | 2.54:1 sobre blanco: solo junto a texto |
| `--color-dot-on-dark` | `#475569` | Separador sobre oscuro | 2.36:1 sobre tinta: solo separador |

### Color · sobre oscuro (#0F172A)

| Token | Valor | Uso | Contraste (WCAG 2.x) |
|---|---|---|---|
| `--color-on-dark` | `#FFFFFF` | Títulos y texto principal | 17.85:1 |
| `--color-on-dark-secondary` | `#CBD5E1` | Metadatos | 12.02:1 |
| `--color-on-dark-tertiary` | `#B6C4DC` | Rótulos | 10.13:1 |
| `--color-on-dark-muted` | `#8FA3C4` | Metadatos secundarios | 6.97:1 |
| `--color-on-dark-eyebrow` | `#7DA2D9` | Eyebrow sobre oscuro | 6.84:1 |
| `--color-on-dark-link` | `#38BDF8` | Enlaces y acentos sobre oscuro | 8.33:1 |
| `--color-on-dark-surface` | `rgba(255, 255, 255, 0.07)` | Fila interactiva dentro de superficie oscura | Fondo: blanco 14.86:1 · foco 6.94:1 |
| `--color-on-dark-control` | `rgba(255, 255, 255, 0.09)` | Botones ± del simulador | Fondo de control sobre oscuro |
| `--color-on-dark-border` | `rgba(255, 255, 255, 0.12)` | Borde dentro de superficie oscura | Decorativo |
| `--color-on-dark-track` | `rgba(255, 255, 255, 0.14)` | Pista de barra sobre oscuro | Decorativo |
| `--color-on-dark-icon-bg` | `rgba(56, 189, 248, 0.16)` | Círculo del ícono del banner oscuro (Callout dark, Strata.dc.html:877) | Compone #16324B · #38BDF8 encima 6.16:1 |

### Color · estados

| Token | Valor | Uso | Contraste (WCAG 2.x) |
|---|---|---|---|
| `--color-error-text` | `#B3261E` | Texto, ícono y borde de control con error | 6.54:1 blanco, 6.17:1 #FAF8F5 |
| `--color-error-hover` | `#8E1F18` | Hover del botón de peligro | 8.90:1 con blanco |
| `--color-error-bg` | `#FCF1F0` | Fondo de Callout e input con error | texto 5.91:1 |
| `--color-error-border` | `#F0C6C2` | Borde de Callout de error (decorativo) | Decorativo |
| `--color-error-halo` | `rgba(179, 38, 30, 0.14)` | Halo del anillo de foco de un campo con error (`--focus-ring-error`) | Decorativo |
| `--color-error-on-dark` | `#F87171` | Ícono de error del toast y error de CopyField sobre oscuro | 6.45:1 tinta · 5.37:1 fila oscura (#202739) |
| `--color-success-text` | `#157A3A` | Texto de éxito | 5.42:1 blanco, 5.11:1 #FAF8F5, 5.04:1 #F0F9F3 |
| `--color-success-icon` | `#16A34A` | Ícono, check y borde de control válido (≥3:1) | 3.30:1 blanco. Nunca texto |
| `--color-success-bright` | `#22C55E` | Punto en vivo y check sobre oscuro (7.83:1 sobre #0F172A) | 2.28:1 sobre blanco: en claro, solo decorativo |
| `--color-success-bg` | `#F0F9F3` | Fondo de Callout de éxito | Fondo: texto 5.04:1 · ícono 3.07:1 |
| `--color-success-bg-subtle` | `#FAFDFB` | Fondo de input válido | Fondo: ícono y borde válido 3.22:1 |
| `--color-success-border` | `#A7D8B8` | Borde de Callout de éxito (decorativo) | Decorativo |
| `--color-success-on-dark` | `#BBF7D0` | Texto de éxito sobre oscuro | 11.62:1 sobre su fondo |
| `--color-success-on-dark-bg` | `rgba(22, 163, 74, 0.18)` | Fondo de la insignia «verificada» sobre oscuro (compone #103030) | Fondo: texto 11.62:1 · ícono 6.18:1 |
| `--color-success-on-dark-border` | `rgba(134, 239, 172, 0.34)` | Borde de la insignia «verificada» sobre oscuro | Decorativo |
| `--color-warning-text` | `#A84E07` | Texto e ícono de advertencia | 5.59:1 blanco, 5.27:1 #FAF8F5, 5.21:1 #FEF6E9 |
| `--color-warning-bg` | `#FEF6E9` | Fondo de Callout de advertencia | Fondo: texto 5.21:1 |
| `--color-warning-border` | `#EFCF9F` | Borde de Callout de advertencia | Decorativo |
| `--color-info-text` | `var(--color-sky-deep)` = `#075985` | Texto de Callout informativo | 7.08:1 sobre #EFF9FE |
| `--color-info-icon` | `var(--color-sky-text)` = `#0369A1` | Ícono informativo | 5.55:1 sobre #EFF9FE |
| `--color-info-bg` | `var(--color-sky-tint)` = `#EFF9FE` | Fondo de Callout informativo | Fondo: texto 7.08:1 · ícono 5.55:1 |
| `--color-info-border` | `var(--color-sky-border)` = `#BAE6FD` | Borde de Callout informativo | Decorativo |

### Foco

| Token | Valor | Uso | Contraste (WCAG 2.x) |
|---|---|---|---|
| `--color-focus` | `var(--color-sky-ui)` = `#0284C7` | Indicador de foco (outline y anillo) sobre fondos claros | 4.10:1 blanco · 3.86:1 #FAF8F5 · 4.03:1 vidrio · 3.51:1 #F1EDE4 · 3.47:1 #E8ECF7 · 4.36:1 tinta |
| `--color-focus-on-dark` | `#38BDF8` | Indicador de foco sobre tinta o navy (clase st-on-dark) | 8.33:1 tinta · 4.84:1 navy · 6.94:1 fila oscura |
| `--color-focus-halo` | `rgba(56, 189, 248, 0.16)` | Halo suave del prototipo (decorativo, no cuenta para contraste) | Decorativo (no cuenta para el contraste del foco) |
| `--color-focus-halo-on-dark` | `rgba(56, 189, 248, 0.28)` | Halo del foco sobre oscuro | Decorativo |
| `--focus-outline-width` | `2px` | Grosor del outline de foco | Línea de 2 px: perímetro visible además del contraste |
| `--focus-outline-offset` | `2px` | Separación entre el control y el outline | El hueco deja el outline sobre el fondo de la página |
| `--focus-ring` | `0 0 0 1px var(--color-focus), 0 0 0 4px var(--color-focus-halo)` | Anillo de controles con borde, junto con border-color: var(--color-focus) | Mismo contraste que --color-focus (≥ 3.47:1 en fondos claros) |
| `--focus-ring-on-dark` | `0 0 0 1px var(--color-focus-on-dark), 0 0 0 4px var(--color-focus-halo-on-dark)` | Anillo sobre oscuro (lo aplica .st-on-dark) | Mismo contraste que --color-focus-on-dark (≥ 4.84:1) |
| `--focus-ring-error` | `0 0 0 1px var(--color-error-text), 0 0 0 4px var(--color-error-halo)` | Campo con error y foco: conserva el rojo, con border-color: var(--color-error-text) | 6.17:1 #FAF8F5 · 6.54:1 blanco |

### Color · datos y halos

| Token | Valor | Uso | Contraste (WCAG 2.x) |
|---|---|---|---|
| `--color-data-high` | `var(--color-navy)` = `#1E3A8A` | Categoría «alto» del backend (D-14; no los umbrales 80/70 del prototipo) | Gráfico 8.85:1 sobre la pista |
| `--color-data-mid` | `var(--color-sky-strong)` = `#0EA5E9` | Categoría «medio» | Gráfico 2.37:1 sobre la pista: siempre con su valor en texto |
| `--color-data-low` | `var(--color-sky)` = `#38BDF8` | Categoría «bajo» | Gráfico 1.83:1 sobre la pista: siempre con su valor en texto |
| `--color-data-neutral` | `var(--color-dot-neutral)` = `#A8A296` | Rango neutro o bajo | Gráfico 2.17:1: siempre con texto |
| `--color-data-high-text` | `var(--color-navy)` = `#1E3A8A` | Texto de «alto» | 10.36:1 blanco |
| `--color-data-mid-text` | `var(--color-sky-deep)` = `#075985` | Texto de «medio» | 7.56:1 blanco |
| `--color-data-low-text` | `var(--color-sky-deeper)` = `#0C4A6E` | Texto de «bajo» | 9.46:1 blanco |
| `--color-data-neutral-text` | `var(--color-text-secondary)` = `#5B5545` | Texto del rango neutro | 7.42:1 blanco |
| `--color-data-track` | `var(--color-surface-muted)` = `#F0EDE5` | Pista de las barras | Fondo de la barra |
| `--color-radar-stroke` | `var(--color-sky-strong)` = `#0EA5E9` | Contorno del polígono del radar | Gráfico 2.77:1 sobre blanco: el radar lleva sus valores en texto |
| `--color-radar-fill` | `rgba(14, 165, 233, 0.2)` | Relleno del polígono del reporte | Decorativo |
| `--color-radar-fill-home` | `rgba(56, 189, 248, 0.22)` | Relleno de los polígonos de la home | Decorativo |
| `--color-radar-vertex` | `var(--color-navy)` = `#1E3A8A` | Vértices del radar | Gráfico 10.36:1 |
| `--color-radar-grid` | `var(--color-border-neutral)` = `#E7E2D8` | Retícula del radar | Decorativo |
| `--color-radar-range-fill` | `#F7FBFE` | Hexágono del rango: relleno | Decorativo |
| `--color-radar-range-stroke` | `#DCE6EF` | Hexágono del rango: borde | Decorativo |
| `--halo-coral` | `rgba(255, 107, 107, 0.2)` | Halo coral del lienzo (20 %) | Decorativo |
| `--halo-sky` | `rgba(56, 189, 248, 0.2)` | Halo celeste del lienzo (20 %) | Decorativo |
| `--halo-navy` | `rgba(30, 58, 138, 0.1)` | Halo navy del lienzo (10 %) | Decorativo |
| `--halo-coral-home` | `rgba(255, 107, 107, 0.26)` | Halo coral de la home (26 %) | Decorativo |
| `--halo-sky-home` | `rgba(56, 189, 248, 0.24)` | Halo celeste de la home (24 %) | Decorativo |
| `--halo-navy-home` | `rgba(30, 58, 138, 0.12)` | Halo navy de la home (12 %) | Decorativo |

### Tipografía · familias

| Token | Valor | Uso |
|---|---|---|
| `--font-heading` | `'Satoshi', 'General Sans', system-ui, -apple-system, 'Segoe UI', sans-serif` | Satoshi: títulos (h1–h4), marca y cifras de marca (precio de la home) |
| `--font-text` | `'General Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | General Sans: cuerpo, controles y cifras de datos (StatCard) |
| `--font-mono` | `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | JetBrains Mono: códigos, contadores y reloj |

### Tipografía · tamaños

| Token | Valor | Uso |
|---|---|---|
| `--fs-display` | `clamp(2.125rem, 1.578rem + 2.432vw, 3.25rem)` | 52 px (mín. 34): hero |
| `--fs-h1` | `clamp(2rem, 1.574rem + 1.892vw, 2.875rem)` | 46 px (mín. 32): H1 de página |
| `--fs-h2` | `clamp(1.625rem, 1.382rem + 1.081vw, 2.125rem)` | 34 px (mín. 26): H2 de sección |
| `--fs-h2-sm` | `clamp(1.5rem, 1.318rem + 0.811vw, 1.875rem)` | 30 px (mín. 24): H2 secundario |
| `--fs-title-xl` | `2rem` | 32 px: H1 del fin |
| `--fs-title-lg` | `1.5625rem` | 25 px: H1 del acceso (24–25) |
| `--fs-title` | `1.4375rem` | 23 px: pregunta del examen |
| `--fs-h3` | `1.25rem` | 20 px: H3 destacado, total |
| `--fs-h3-sm` | `1.1875rem` | 19 px: título de tarjeta destacada |
| `--fs-title-sm` | `1.125rem` | 18 px: título de modal y drawer |
| `--fs-h4` | `1.03125rem` | 16.5 px: título de tarjeta y de paso |
| `--fs-h5` | `0.96875rem` | 15.5 px: título compacto (builder, reporte) |
| `--fs-figure-xl` | `1.8125rem` | 29 px: precio de la home, índice |
| `--fs-figure-lg` | `1.6875rem` | 27 px: saldo |
| `--fs-figure` | `1.4375rem` | 23 px: precio del catálogo |
| `--fs-figure-sm` | `1.3125rem` | 21 px: vista previa |
| `--fs-brand` | `1.0625rem` | 17 px: nombre de la marca en las barras (Strata.dc.html:57) |
| `--fs-lead` | `1.0625rem` | 17 px: entradilla |
| `--fs-body` | `1rem` | 16 px: cuerpo base del documento |
| `--fs-body-sm` | `0.9375rem` | 15 px: cuerpo compacto, CTA grande |
| `--fs-ui-lg` | `0.90625rem` | 14.5 px: CTA y controles del candidato |
| `--fs-ui-md` | `0.875rem` | 14 px: nav, texto de interfaz |
| `--fs-ui` | `0.84375rem` | 13.5 px: inputs y botones |
| `--fs-ui-sm` | `0.8125rem` | 13 px: botones secundarios, párrafos de tarjeta, toast |
| `--fs-meta` | `0.78125rem` | 12.5 px: metadatos, celdas, callouts |
| `--fs-small` | `0.75rem` | 12 px: ayudas y notas |
| `--fs-label` | `0.71875rem` | 11.5 px: labels y notas al pie |
| `--fs-eyebrow` | `0.6875rem` | 11 px: eyebrow |
| `--fs-micro` | `0.65625rem` | 10.5 px: micro-rótulos y badges |
| `--fs-micro-sm` | `0.625rem` | 10 px: th, chips de código |
| `--fs-nano` | `0.59375rem` | 9.5 px: categorías en mayúsculas |
| `--fs-code-xl` | `1.875rem` | 30 px: código grande (mono) |
| `--fs-code-lg` | `1.25rem` | 20 px: input de código (mono); también el «Enlace o código» de /evaluar (Input variant="token") |

### Tipografía · pesos, interlineado y tracking

| Token | Valor | Uso |
|---|---|---|
| `--fw-regular` | `400` | Texto corrido |
| `--fw-medium` | `500` | Nav inactiva, celdas |
| `--fw-semibold` | `600` | Activo, botones y labels |
| `--fw-bold` | `700` | Títulos, eyebrow y énfasis |
| `--fw-extrabold` | `800` | Cifras y H1 del fin (solo Satoshi) |
| `--lh-none` | `1` | Cifras |
| `--lh-display` | `1.06` | Display y H1 |
| `--lh-heading` | `1.15` | H2 y títulos por defecto |
| `--lh-heading-sm` | `1.2` | H2 secundario, H1 del fin |
| `--lh-title` | `1.3` | Títulos de tarjeta (1.28–1.35) |
| `--lh-snug` | `1.4` | Pregunta del examen |
| `--lh-normal` | `1.5` | Texto de interfaz |
| `--lh-paragraph` | `1.55` | Párrafos de tarjeta |
| `--lh-relaxed` | `1.6` | Entradilla y cuerpo |
| `--tracking-display` | `-0.03em` | Display y H1 |
| `--tracking-h2` | `-0.025em` | H2 |
| `--tracking-heading` | `-0.02em` | h1–h4 por defecto, marca, cifras |
| `--tracking-snug` | `-0.015em` | Pregunta del examen |
| `--tracking-title` | `-0.01em` | Título de modal |
| `--tracking-label` | `0.01em` | Labels del candidato |
| `--tracking-code-sm` | `0.02em` | Código chico; input del enlace o código del candidato (Input variant="token", sin mayúsculas: el token las distingue) |
| `--tracking-code` | `0.04em` | Código en tabla |
| `--tracking-caps-sm` | `0.06em` | Mayúsculas pequeñas, marca «STRATA» |
| `--tracking-caps` | `0.1em` | th y contadores en mayúsculas |
| `--tracking-caps-lg` | `0.12em` | Eyebrow sobre oscuro, categorías |
| `--tracking-eyebrow` | `0.13em` | Eyebrow |
| `--tracking-code-lg` | `0.14em` | Input de código |
| `--tracking-code-xl` | `0.16em` | Código grande |

### Bordes y tamaños mínimos

| Token | Valor | Uso |
|---|---|---|
| `--border-width` | `1px` | Borde estándar |
| `--border-width-control` | `1.5px` | Inputs del candidato y opciones del examen |
| `--border-width-thick` | `2px` | Aro de radio, subrayado activo |
| `--size-target` | `44px` | Objetivo táctil mínimo en el flujo del candidato |
| `--size-avatar` | `30px` | Avatar de iniciales de la barra y marca de la empresa (Strata.dc.html:69, 1001) |
| `--size-topbar-row` | `40px` | Alto mínimo de la fila de acciones de la barra: el de la pastilla (avatar de 30 px, 4 px arriba y abajo y borde de 1 px; Strata.dc.html:68). Las tres barras miden 80 px, también sin sesión y mientras carga GET /api/user (QA de la Fase 2) |
| `--size-logo` | `30px` | Salamandra de las barras (Strata.dc.html:56, 1144) |
| `--size-logo-sm` | `20px` | Salamandra del pie (Strata.dc.html:314, 1232) |
| `--size-avatar-lg` | `33px` | Avatar cuadrado de la tabla de candidatos (Strata.dc.html:838) |
| `--size-stat-badge` | `38px` | Cuadro numérico de la tarjeta de resumen (Strata.dc.html:699) |
| `--size-end-icon` | `76px` | Ícono del fin del examen: cuadro tinta con radio `--radius-hero` y palomita celeste (Strata.dc.html:1201; Fase 3) |

### Radios

| Token | Valor | Uso |
|---|---|---|
| `--radius-hero` | `26px` | Tarjeta demo, ícono del fin |
| `--radius-glass` | `24px` | Tarjeta de vidrio |
| `--radius-step` | `22px` | Paso translúcido |
| `--radius-modal` | `20px` | Modal, badge flotante |
| `--radius-card` | `18px` | Tarjetas blanca, secundaria, oscura y punteada |
| `--radius-feature` | `16px` | CTA del hero, burbuja, banner |
| `--radius-control` | `14px` | Controles: input, select, botón, segmentado |
| `--radius-option` | `13px` | Opciones del examen, toast |
| `--radius-control-candidate` | `12px` | Inputs y CTA del candidato |
| `--radius-chip` | `10px` | Stepper, chips de dimensión, callout chico |
| `--radius-chip-sm` | `9px` | Acción de tabla, chips de categoría, cerrar |
| `--radius-tab` | `8px` | Opción del segmentado, paginación |
| `--radius-icon-btn` | `7px` | Botón de ícono (copiar) |
| `--radius-tag` | `6px` | Etiquetas, casilla |
| `--radius-code` | `5px` | Chip de código |
| `--radius-pill` | `999px` | Pastillas, badges, barras |
| `--radius-round` | `50%` | Puntos, avatares, radios |

### Superficies (recetas)

| Token | Valor | Uso |
|---|---|---|
| `--surface-glass-bg` | `rgba(255, 255, 255, 0.72)` | Tarjeta de vidrio: fondo, con backdrop-filter blur(var(--blur-glass)) y sombra var(--shadow-glass) |
| `--surface-glass-border` | `1px solid var(--color-border-glass)` | Tarjeta de vidrio: borde |
| `--surface-glass-radius` | `var(--radius-glass)` = `24px` | Tarjeta de vidrio: radio |
| `--surface-secondary-bg` | `rgba(255, 255, 255, 0.85)` | Tarjeta secundaria (vista previa, líneas y totales): fondo |
| `--surface-secondary-border` | `1px solid var(--color-border-card)` | Tarjeta secundaria: borde |
| `--surface-secondary-radius` | `var(--radius-card)` = `18px` | Tarjeta secundaria: radio |
| `--surface-white-bg` | `var(--color-surface-white)` = `#FFFFFF` | Tarjeta blanca: fondo |
| `--surface-white-border` | `1px solid var(--color-border-cool)` | Reporte y pregunta |
| `--surface-white-border-warm` | `1px solid var(--color-border-warm)` | Tarjeta del acceso |
| `--surface-white-radius` | `var(--radius-card)` = `18px` | Tarjeta blanca: radio |
| `--surface-dark-bg` | `var(--color-surface-dark)` = `#0F172A` | Tarjeta oscura (vista previa, simulador, banner, código): fondo; agrega .st-on-dark |
| `--surface-dark-radius` | `var(--radius-card)` = `18px` | Tarjeta oscura: radio (16 en la tarjeta de código) |
| `--surface-dashed-bg` | `var(--color-bg)` = `#FAF8F5` | Superficie punteada (vacío, «+ Añadir»): fondo; blanco en el carrito vacío |
| `--surface-dashed-border` | `1px dashed var(--color-border-strong)` | Superficie punteada: borde |
| `--surface-dashed-radius` | `var(--radius-card)` = `18px` | Superficie punteada: radio (14 en el carrito vacío) |
| `--surface-step-bg` | `rgba(255, 255, 255, 0.66)` | Paso translúcido: fondo (sin blur) |
| `--surface-step-border` | `1px solid var(--color-border-step)` | Paso translúcido: borde |
| `--surface-step-radius` | `var(--radius-step)` = `22px` | Paso translúcido: radio |
| `--surface-pill-bg` | `var(--color-surface-pill)` = `rgba(255, 255, 255, 0.8)` | Pastilla: fondo |
| `--surface-pill-border` | `1px solid var(--color-border-subtle)` | Pastilla: borde |
| `--surface-pill-radius` | `var(--radius-pill)` = `999px` | Pastilla: radio |

### Sombras, filtros y desenfoque

| Token | Valor | Uso |
|---|---|---|
| `--shadow-glass` | `0 20px 44px -28px rgba(15, 23, 42, 0.28)` | Tarjeta de vidrio |
| `--shadow-glass-hover` | `0 32px 60px -28px rgba(15, 23, 42, 0.34)` | Tarjeta de vidrio en hover (con translateY(-4 a -5px)) |
| `--shadow-step-hover` | `0 22px 44px -26px rgba(15, 23, 42, 0.28)` | Paso translúcido en hover |
| `--shadow-demo` | `0 40px 80px -34px rgba(15, 23, 42, 0.32), 0 10px 26px -18px rgba(15, 23, 42, 0.16)` | Tarjeta demo de la home |
| `--shadow-float` | `0 22px 44px -22px rgba(15, 23, 42, 0.3)` | Badge flotante |
| `--shadow-float-lg` | `0 24px 48px -22px rgba(15, 23, 42, 0.32)` | Badge flotante grande |
| `--shadow-modal` | `0 24px 60px rgba(15, 23, 42, 0.24)` | Modal |
| `--shadow-drawer` | `-14px 0 40px rgba(15, 23, 42, 0.18)` | Drawer |
| `--shadow-toast` | `0 12px 34px rgba(15, 23, 42, 0.3)` | Toast |
| `--shadow-bubble` | `0 18px 38px -18px rgba(15, 23, 42, 0.5)` | Burbuja de la mascota |
| `--shadow-chip` | `0 1px 2px rgba(15, 23, 42, 0.07)` | Opción activa del segmentado |
| `--shadow-thumb` | `0 3px 10px -3px rgba(15, 23, 42, 0.18)` | Thumb del selector |
| `--shadow-pill` | `0 6px 18px -12px rgba(15, 23, 42, 0.2)` | Eyebrow del hero |
| `--shadow-icon-box` | `0 4px 12px -6px rgba(15, 23, 42, 0.18)` | Caja de ícono de los pasos |
| `--shadow-knob` | `0 1px 3px rgba(15, 23, 42, 0.28)` | Perilla del interruptor |
| `--shadow-primary` | `0 6px 18px rgba(30, 58, 138, 0.22)` | Botón primario (geometría del CTA del acceso) |
| `--shadow-primary-hover` | `0 9px 22px rgba(30, 58, 138, 0.28)` | Botón primario en hover |
| `--shadow-primary-sm` | `0 10px 24px -14px rgba(30, 58, 138, 0.6)` | Botón primario chico (tarjeta de la home) |
| `--shadow-primary-lg` | `0 12px 30px -12px rgba(30, 58, 138, 0.55)` | CTA grande del hero |
| `--shadow-primary-lg-hover` | `0 18px 40px -12px rgba(30, 58, 138, 0.6)` | CTA grande del hero en hover |
| `--filter-mascot` | `drop-shadow(0 14px 22px rgba(15, 23, 42, 0.2))` | Sombra de la mascota (filter) |
| `--blur-glass` | `14px` | backdrop-filter del vidrio |
| `--blur-topbar` | `16px` | backdrop-filter de la barra superior y la del examen |

### Capas (z-index)

| Token | Valor | Uso |
|---|---|---|
| `--z-halos` | `0` | Halos de fondo |
| `--z-content` | `1` | Main |
| `--z-mascot` | `1` | Mascota en el prototipo, debajo del contenido. Sin uso: la mascota va en `--z-mascot-layer` |
| `--z-home-content` | `2` | Contenido de la home en el prototipo. Sin uso desde la Fase 6: el marco de la home va con z-index auto para que los menús de la barra queden sobre la mascota |
| `--z-bubble` | `4` | Burbuja de la mascota en el prototipo. Sin uso: la burbuja va dentro de `--z-mascot-layer` |
| `--z-exam-bar` | `10` | Barra del examen (sticky) |
| `--z-mascot-layer` | `20` | Capa de la mascota (portal en el body; Fase 6): sobre el contenido de la home y bajo la barra, los menús, los overlays y el toast |
| `--z-demo` | `25` | Pastilla del modo demo (solo con `npm run dev:mock`): sobre la mascota y bajo la barra con su menú móvil, los overlays y el toast |
| `--z-topbar` | `30` | Barra superior (sticky) |
| `--z-dropdown` | `40` | Menú de la pastilla y menú móvil (no están en el prototipo) |
| `--z-overlay` | `60` | Drawer, modales y su scrim |
| `--z-toast` | `80` | Toast |
| `--z-skip-link` | `90` | Enlace para saltar al contenido |

### Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--dur-state` | `0.18s` | Hover y cambios de estado (regla global) |
| `--dur-toggle` | `0.2s` | CTA, color de etiquetas, interruptor, entrada del toast |
| `--dur-lift` | `0.22s` | Elevación de tarjetas, entrada de modales |
| `--dur-drawer` | `0.26s` | Entrada del drawer |
| `--dur-pop` | `0.3s` | popIn y burbuja |
| `--dur-soft` | `0.34s` | softIn |
| `--dur-progress` | `0.35s` | Ancho de la barra de progreso |
| `--dur-thumb` | `0.36s` | Thumb del selector |
| `--dur-pop-lg` | `0.38s` | Ícono del fin |
| `--dur-row` | `0.42s` | rowIn |
| `--dur-screen` | `0.5s` | screenIn y riseIn |
| `--dur-pulse` | `1.8s` | Punto «Guardado automático» |
| `--dur-live` | `2s` | Punto en vivo del eyebrow |
| `--dur-live-alt` | `2.2s` | Punto «Guardado» de la demo |
| `--dur-float-badge` | `6.4s` | Badge flotante |
| `--dur-float-card` | `7.5s` | Tarjeta demo |
| `--dur-float-badge-alt` | `7.8s` | Segundo badge (retardo -2.6s) |
| `--dur-poly` | `8.4s` | Ciclo de polígonos del radar de la home |
| `--dur-glow` | `18s` | Deriva de los halos |
| `--ease-base` | `ease` | Hover y estado |
| `--ease-out` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Entradas |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Selector y progreso |
| `--ease-spring` | `cubic-bezier(0.34, 1.4, 0.64, 1)` | CTA y burbuja |
| `--ease-spring-pop` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | popIn |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Drawer |
| `--ease-loop` | `ease-in-out` | Bucles |
| `--stagger-card` | `55ms` | Entre tarjetas |
| `--stagger-row` | `28ms` | Entre filas de tabla |
| `--transition-state` | `background-color var(--dur-state) var(--ease-base), border-color var(--dur-state) var(--ease-base), color var(--dur-state) var(--ease-base), box-shadow var(--dur-state) var(--ease-base), opacity var(--dur-state) var(--ease-base)` | Transición de hover y estado (regla global en button, a, input, td y th) |
| `--anim-screen-in` | `st-screen-in var(--dur-screen) var(--ease-out) backwards` | Entrada de pantalla |
| `--anim-fade-in` | `st-fade-in var(--dur-screen) var(--ease-out) backwards` | Entrada de una pantalla que llega con #ancla: solo fundido, para que el salto al ancla no se corra (RouteTransition) |
| `--anim-rise-in` | `st-rise-in var(--dur-screen) var(--ease-out) backwards` | Tarjetas escalonadas (retardo i × --stagger-card) |
| `--anim-soft-in` | `st-soft-in var(--dur-soft) var(--ease-out) backwards` | Entradilla del hero y tarjeta de pregunta |
| `--anim-row-in` | `st-row-in var(--dur-row) var(--ease-out) backwards` | Filas de tabla (retardo i × --stagger-row) |
| `--anim-fade-up` | `st-fade-up var(--dur-lift) var(--ease-base) backwards` | Entrada de modales |
| `--anim-toast-in` | `st-fade-up var(--dur-toggle) var(--ease-base) backwards` | Entrada del toast |
| `--anim-slide-in` | `st-slide-in var(--dur-drawer) var(--ease-drawer) backwards` | Entrada del drawer |
| `--anim-pop-in` | `st-pop-in var(--dur-pop) var(--ease-spring-pop) backwards` | Check de campo válido e ícono del fin |
| `--anim-bubble-in` | `st-bubble-in var(--dur-pop) var(--ease-spring) backwards` | Burbuja de la mascota |
| `--anim-live-pulse` | `st-live-pulse var(--dur-live) var(--ease-loop) infinite` | Puntos en vivo |
| `--anim-pulse-dot` | `st-pulse-dot var(--dur-pulse) var(--ease-loop) infinite` | Punto «Guardado automático» |
| `--anim-glow-drift` | `st-glow-drift var(--dur-glow) var(--ease-loop) infinite` | Halos de fondo |
| `--anim-float-card` | `st-float-card var(--dur-float-card) var(--ease-loop) infinite` | Tarjeta demo |
| `--anim-float-badge` | `st-float-badge var(--dur-float-badge) var(--ease-loop) infinite` | Badges flotantes |
| `--dur-spinner` | `0.8s` | Vuelta del spinner de carga |
| `--anim-spin` | `st-spin var(--dur-spinner) linear infinite` | Spinner de Button y de EstadoCarga (con movimiento reducido queda quieto; el texto explica el estado) |

### Layout y anchos

| Token | Valor | Uso |
|---|---|---|
| `--layout-max` | `1200px` | Ancho máximo de página, barra y pie |
| `--layout-page-pad-top` | `48px` · ≤640 px: `32px` · ≤400 px: `24px` | Padding superior de página interna |
| `--layout-page-pad-x` | `34px` · ≤640 px: `20px` · ≤400 px: `16px` | Padding lateral de página, home y pie |
| `--layout-page-pad-bottom` | `88px` · ≤640 px: `64px` · ≤400 px: `56px` | Padding inferior de página interna |
| `--layout-page-padding` | `var(--layout-page-pad-top) var(--layout-page-pad-x) var(--layout-page-pad-bottom)` | Padding de página interna (48 34 88) |
| `--layout-topbar-pad-y` | `20px` · móvil (≤640 px): `14px` | Padding vertical de la barra |
| `--layout-topbar-pad-x` | `34px` · ≤640 px: `20px` · ≤400 px: `16px` | Padding lateral de la barra |
| `--layout-topbar-padding` | `var(--layout-topbar-pad-y) var(--layout-topbar-pad-x)` | Padding de la barra (20 34) |
| `--layout-home-padding` | `0 var(--layout-page-pad-x) 72px` | Padding de la home |
| `--layout-section-pad-y` | `64px` · móvil (≤640 px): `48px` | Separación entre secciones de la home |
| `--layout-access-padding` | `48px 24px` · ≤640 px: `32px 20px` · ≤400 px: `24px 16px` | Padding del acceso del candidato |
| `--layout-exam-padding` | `44px 28px 64px` · ≤640 px: `32px 20px 48px` · ≤400 px: `24px 16px 40px` | Padding del cuerpo del examen |
| `--layout-exam-bar-padding` | `15px 28px` · ≤640 px: `12px 20px` · ≤400 px: `12px 16px` | Padding de la barra del examen |
| `--layout-end-padding` | `48px 28px` · ≤640 px: `32px 20px` · ≤400 px: `24px 16px` | Padding de la pantalla de fin |
| `--layout-scroll-offset` | `96px` | scroll-padding-top: anclas y foco no quedan bajo la barra sticky |
| `--width-report` | `1080px` | Reporte |
| `--width-exam-bar` | `900px` | Barra del examen |
| `--width-table-min` | `900px` | Tabla en modo tabla; por debajo de 640 px pasa a tarjetas (D-23) |
| `--width-exam` | `760px` | Cuerpo del examen |
| `--width-access` | `600px` | Tarjeta del acceso |
| `--width-end` | `560px` | Pantalla de fin |
| `--width-modal` | `540px` | Modal de enlace o código |
| `--width-modal-sm` | `520px` | Modal de asignar |
| `--width-lead` | `470px` | Entradilla del hero |
| `--width-end-text` | `440px` | Texto del fin |
| `--width-demo` | `430px` | Tarjeta demo |
| `--width-drawer` | `408px` | Drawer |
| `--width-radar` | `330px` | Radar |
| `--width-bubble` | `232px` | Burbuja de la mascota |
| `--width-mascot` | `100px` | Mascota |
| `--width-page-title-min` | `260px` | Columna del título del PageHeader antes de que las acciones bajen |
| `--width-page-lede` | `600px` | Entradilla del PageHeader (560–600 px en Strata.dc.html:610, 688) |
| `--width-toast` | `560px` | Ancho máximo del toast (en el prototipo crece hasta la mitad de la ventana) |
| `--width-hero-copy` | `600px` | Columna de texto del hero de la home cuando va en una sola columna (por debajo de 1180 px; Fase 6, [D-30](rediseno/decisiones.md#d-30)) |
| `--width-demo-stage` | `540px` | Escenario de la demo de la home: la columna del prototipo a 1200 px (Strata.dc.html:168; Fase 6) |
| `--height-modal-max` | `92dvh` | Alto máximo de los modales (92vh en el prototipo; dvh descuenta la barra del navegador móvil) |
| `--height-demo-stage` | `430px` | Alto mínimo del escenario de la demo de la home (Strata.dc.html:168; Fase 6) |

### Espaciado

`--space-N` vale N px. Existen del 0 al 20, de uno en uno, y después 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 48, 52, 56, 64, 72 y 88. Son los pasos del prototipo, que usa con frecuencia valores de 1 px como 7, 9, 11 y 13. El 38 es el alto de los botones del stepper del builder (Strata.dc.html:501).

Separación entre tarjetas en el prototipo: 18 px en catálogo, builder y reporte; 14 en tarjetas de saldo; 20 en la home; 52 en el hero y 12 en el fin.

## Equivalencias del prototipo

Para pasar un estilo en línea de Strata.dc.html a tokens.

### Color

| Prototipo | Token | Nota |
|---|---|---|
| #FAF8F5 | `--color-bg` | También `--surface-dashed-bg`. |
| #F7F5F0 | `--color-bg-alt` | rgba(247,245,240,.6) es `--color-bg-thead`. |
| #FFFFFF / #fff | `--color-surface-white` (fondo) · `--color-on-dark` / `--color-on-navy` (texto) | |
| #FCFBF9 | `--color-surface-soft` | |
| #FDFCFA | `--color-surface-hover` | |
| #F1EDE4 | `--color-surface-track` | |
| #F0EDE5 | `--color-surface-muted` | También `--color-data-track`. |
| #0F172A | `--color-text` (texto) · `--color-surface-dark` (fondo) | |
| #3D3A33 | `--color-text-data` | |
| #5B5545 | `--color-text-secondary` | También `--color-lead`. |
| #6B6558 | `--color-text-tertiary` | |
| #756D5C | `--color-text-placeholder` | |
| #857A66 | `--color-text-tertiary` | #857A66 da 3.98:1 y no cumple. |
| #475569 | `--color-text-slate` (texto sobre claro) · `--color-dot-on-dark` (separador sobre oscuro) | |
| #8B8574 | `--color-icon-muted` (íconos) · `--color-border-control` (bordes de control) | |
| #1E3A8A | `--color-navy` | También `--color-primary`, `--color-link` y `--color-data-high`. |
| #E8ECF7 | `--color-navy-tint` | |
| #DBEAFE | `--color-on-navy-muted` | |
| #38BDF8 | `--color-sky` | También `--color-data-low`, `--color-on-dark-link` y `--color-focus-on-dark`. |
| #0369A1 | `--color-sky-text` | También `--color-eyebrow`, `--color-link-hover` y `--color-info-icon`. |
| #0EA5E9 | `--color-sky-strong` | Como texto: `--color-link-hover`. Como foco: `--color-focus`. En casilla, radio u opción marcados: `--color-control-checked`. Como fondo de chip con texto: ver la regla 4. |
| #075985 | `--color-sky-deep` | También `--color-info-text` y `--color-data-mid-text`. |
| #0C4A6E | `--color-sky-deeper` | También `--color-data-low-text`. |
| #EFF9FE | `--color-sky-tint` | También `--color-info-bg`. |
| #E6F6FE | `--color-sky-tint-strong` | |
| #F2FAFE | `--color-sky-tint-soft` | |
| #F5FCFF | `--color-sky-tint-subtle` | |
| #BAE6FD | `--color-sky-border` | También `--color-info-border` y `--color-selection`. |
| #FF6B6B | `--color-coral` | Solo acentos y `--color-indicator-active`. En los CTA: `--color-primary`. |
| #F4574F | `--color-coral-strong` | En el hover de los CTA: `--color-primary-hover`. |
| #FFF1F1 · #FFD9D9 · #B93A34 | `--color-coral-tint` · `--color-coral-border` · `--color-coral-text` | |
| #EBE5DA | `--color-border-subtle` | |
| #EFE9DF | `--color-border-card` | |
| #E7E2D8 | `--color-border-neutral` | En inputs, selects y radios: `--color-border-control`. |
| #E5E0D8 | `--color-border-warm` | En el input del candidato: `--color-border-control`. |
| #EDE9E0 | `--color-border-divider` | |
| #D6CFC2 | `--color-border-strong` | En el aro del radio: `--color-border-control`. |
| #E0D9CB | `--color-border-ghost` | |
| #E2E8F0 · #CBD5E1 | `--color-border-cool` · `--color-border-cool-hover` | Sobre oscuro, #CBD5E1 es `--color-on-dark-secondary`. |
| #DCD5C8 | `--color-connector` | |
| #C9C2B4 · #D2CBBD · #A8A296 | `--color-dot` · `--color-dot-soft` · `--color-dot-neutral` | Casilla inactiva: `--color-border-control`. |
| #B6C4DC · #8FA3C4 · #7DA2D9 | `--color-on-dark-tertiary` · `--color-on-dark-muted` · `--color-on-dark-eyebrow` | |
| rgba(255,255,255,.07 / .09 / .12 / .14) | `--color-on-dark-surface` · `--color-on-dark-control` · `--color-on-dark-border` · `--color-on-dark-track` | |
| #B3261E (repo) | `--color-error-text` | El prototipo no tiene error. |
| #16A34A | `--color-success-icon` | Como texto: `--color-success-text`. |
| #A7D8B8 · #FAFDFB | `--color-success-border` · `--color-success-bg-subtle` | |
| #22C55E · #BBF7D0 | `--color-success-bright` · `--color-success-on-dark` | |
| rgba(22,163,74,.18) · rgba(134,239,172,.34) | `--color-success-on-dark-bg` · `--color-success-on-dark-border` | |
| rgba(56,189,248,.16) | `--color-focus-halo` | En el círculo del ícono del banner oscuro: `--color-on-dark-icon-bg`. |
| rgba(14,165,233,.20) · rgba(56,189,248,.22) | `--color-radar-fill` · `--color-radar-fill-home` | |
| #F7FBFE · #DCE6EF | `--color-radar-range-fill` · `--color-radar-range-stroke` | |
| rgba(255,255,255,.72 / .85 / .66 / .8 / .9) | `--surface-glass-bg` · `--surface-secondary-bg` · `--surface-step-bg` · `--color-surface-pill` · `--color-surface-ghost` | rgba(255,255,255,.9) como borde: `--color-border-step`. |
| rgba(255,255,255,.92) | `--color-border-glass` | |
| rgba(15,23,42,.42) | `--color-scrim` | |
| rgba(250,248,245,.78) · rgba(250,248,245,.8) | `--color-topbar-bg` · `--color-exam-bar-bg` | La barra superior pasa a .92 por contraste (Fase 8) |
| rgba(255,107,107,.2) · rgba(56,189,248,.2) · rgba(30,58,138,.1) | `--halo-coral` · `--halo-sky` · `--halo-navy` | En la home: `--halo-*-home` (.26, .24 y .12). El extremo transparente del gradiente es `transparent`. |
| rgba(15,23,42,…) en sombras | `--shadow-*` | Ver la tabla de sombras. |
| rgba(255,107,107,…) en sombras de CTA | `--shadow-primary*` | Navy por D-19. |
| rgba(15,23,42,.94) · rgba(255,255,255,.08) | — | Selector de rol: no se porta. |

### Tipografía

| Prototipo | Token |
|---|---|
| 52 · 46 · 34 · 30 px | `--fs-display` · `--fs-h1` · `--fs-h2` · `--fs-h2-sm` |
| 32 · 25–24 · 23 · 20 · 19 · 18 px (títulos) | `--fs-title-xl` · `--fs-title-lg` · `--fs-title` · `--fs-h3` · `--fs-h3-sm` · `--fs-title-sm` |
| 16.5 · 15.5 px (títulos) | `--fs-h4` · `--fs-h5` |
| 29 · 27 · 23 · 21 px (cifras); 20 y 15 px en cifras | `--fs-figure-xl` · `--fs-figure-lg` · `--fs-figure` · `--fs-figure-sm`; `--fs-h3` y `--fs-body-sm` |
| 30 · 20 px (mono) | `--fs-code-xl` · `--fs-code-lg` |
| 17 · 16 · 15 · 14.5 · 14 px | `--fs-lead` · `--fs-body` · `--fs-body-sm` · `--fs-ui-lg` · `--fs-ui-md` |
| 13.5 · 13 · 12.5 · 12 px | `--fs-ui` · `--fs-ui-sm` · `--fs-meta` · `--fs-small` |
| 11.5 · 11 · 10.5 · 10 · 9.5 px | `--fs-label` · `--fs-eyebrow` · `--fs-micro` · `--fs-micro-sm` · `--fs-nano` |
| line-height 1.28, 1.32 y 1.35 | `--lh-title` |
| line-height 1.45 | `--lh-snug` o `--lh-normal`, el más cercano al contexto |
| letter-spacing .08em | `--tracking-caps` |
| font-family 'Plus Jakarta Sans' (no se carga) | `--font-text` |

## Nombres del sistema anterior (alias retirados en la Fase 8)

Entre las Fases 1 y 7, los nombres del sistema anterior siguieron definidos como alias temporales (D-20) que apuntaban a su equivalente STRATA, para que las pantallas aún sin rediseñar se vieran coherentes. En la Fase 8 (2026-10-02) se retiraron junto con los `--disc-*`:

- Los últimos usos estaban en código sin uso (FloatingInput.css, UserDropdown.css, GrainTexture.css y Trust.css) y en la clase `.section-inner` de global.css, que ningún componente pone. Se migraron al equivalente de esta tabla; esos archivos quedan en la propuesta de limpieza de [rediseno/estado-final.md](rediseno/estado-final.md).
- Se quitó también `--section-px: 0px` de `.st-page__content` (PageLayout.css), que solo existía para los contenedores viejos.
- Capturas antes y después de 5 rutas al azar, a 1440, 768 y 360 px: sin cambio visual (14 de 15 idénticas píxel a píxel; la otra, dentro del ruido entre corridas).
- Cormorant Garamond y DM Sans ya se habían retirado en la QA de la Fase 8 (D-28): ningún token las usaba y sus `@font-face` pesaban en la hoja que bloquea el primer pintado.

La tabla queda como referencia por si un nombre viejo vuelve a aparecer (por ejemplo, al portar el código real, [PB-01](rediseno/pendientes-backend.md#pb-01)): ya no está definido, así que hay que cambiarlo por su equivalente. `src/styles/tokens.test.ts` lo detecta.

| Nombre anterior | Valor anterior | Equivalente STRATA | Motivo |
|---|---|---|---|
| `--color-hunter` | #3A5A40 | `--color-navy` (#1E3A8A) | El primario viejo pasa a navy (D-19); también cubre enlaces, foco viejo y nivel «alto». |
| `--color-fern` | #567F55 | `--color-sky-deep` (#075985) | Era el hover del primario (blanco encima: 7.56:1) y el nivel «medio» del reporte. |
| `--color-sage` | #A3B18A | `--color-sky-text` (#0369A1) | Trazos decorativos (GrainTexture) y nivel «bajo». Como texto, el viejo daba unos 2.3:1; el equivalente, 5.93:1. |
| `--color-brunswick` | #344E41 | `--color-text` (#0F172A) | Títulos, pie y cabecera del reporte de ejemplo. |
| `--color-ink` | #1E2B24 | `--color-text` (#0F172A) | Texto de cuerpo. |
| `--color-timberwolf` | #DAD7CD | `--color-border-neutral` (#E7E2D8) | Bordes tenues, bandas de sección y pistas. |
| `--color-surface` | #FFFFFF | `--color-surface-white` | Tarjetas. |
| `--color-surface-secondary` | #F7F6F4 | `--color-bg-alt` (#F7F5F0) | Hovers y bandas. |
| `--color-border` | #7E8C74 | `--color-border-control` (#8B8574) | Borde funcional de inputs (3:1 o más). |
| `--color-accent` | #E0A526 | `--color-coral` | Acento. |
| `--color-success` | #2E6B3F | `--color-success-text` (#157A3A) | |
| `--color-error` | #B3261E | `--color-error-text` (#B3261E) | Mismo valor. |
| `--color-warning` | #B45309 | `--color-warning-text` (#A84E07) | Ya no tenía uso al retirarse. |
| `--color-info` | #2B5F8A | `--color-info-text` (#075985) | Ya no tenía uso al retirarse. |
| `--font-display` | Cormorant Garamond | `--font-heading` (Satoshi) | |
| `--font-body` | DM Sans | `--font-text` (General Sans) | |
| `--text-xs` · `--text-sm` · `--text-base` · `--text-lg` | Escala fluida de 12–14 a 18–21 px | `--fs-small` · `--fs-ui-md` · `--fs-body` · `--fs-lead` | 12, 14, 16 y 17 px. |
| `--text-xl` · `--text-2xl` · `--text-3xl` · `--text-4xl` · `--text-hero` | Escala fluida de 20–24 a 44–96 px | `--fs-h3` · `--fs-h2-sm` · `--fs-h2` · `--fs-h1` · `--fs-display` | Los títulos STRATA siguen siendo fluidos. |
| `--sp-1` … `--sp-24` | N × 4 px | `--space-4` … `--space-88` | sp-20 y sp-24 (sin uso) van a 72 y 88 px. |
| `--radius-sm` · `--radius-md` · `--radius-lg` | 4 · 8 · 16 px | `--radius-control` (14) · `--radius-card` (18) · `--radius-glass` (24) | Botones e inputs, tarjetas, tarjeta de auth. |
| `--t-fast` · `--t-base` | 150 ms · 250 ms ease | `--dur-state` (.18s) · `--dur-lift` (.22s), ambos con `--ease-base` | |
| `--max-width` · `--section-px` · `--section-py` | 1200 px · fluido · fluido | `--layout-max` · `--layout-page-pad-x` · `--layout-section-pad-y` | Dentro de `.st-page__content` (PageLayout), `--section-px` valía 0 para que las pantallas viejas no duplicaran el margen lateral del contenedor nuevo; esa regla se retiró con los alias. |
| `--header-h` | 64 px | — | Sin equivalente. Lo usaban el padding-top del body, retirado en la Fase 2 (las barras son sticky), y los min-height de Hero.css y NotFoundPage.css, que dejaron de usarlo al rediseñarse (Fases 6 y 7). Se retiró sin uso. |
| `--disc-d` · `--disc-i` · `--disc-s` · `--disc-c` | #B84A3E · #D9A33A · #588157 · #3F6E96 | — | Sin uso desde que Report reemplazó al reporte DISC. Se retiraron sin equivalente. |

## Decisiones de la Fase 1

Registradas como [D-29](rediseno/decisiones.md#d-29) en decisiones.md.

- **Foco.** El borde #0EA5E9 del prototipo da 2.77:1 sobre blanco, y su anillo rgba(56,189,248,.16) es casi invisible. El foco usa #0284C7, un celeste un tono más oscuro: 4.10:1 sobre blanco, 3.86:1 sobre #FAF8F5, 3.51:1 sobre #F1EDE4, 3.47:1 sobre #E8ECF7 y 4.36:1 sobre tinta. Se dibuja como outline de 2 px separado 2 px, o, en controles con borde, como borde más anillo de 1 px con el halo del prototipo por fuera. Sobre navy, #0284C7 da 2.53:1; por eso `st-on-dark` cambia a #38BDF8 (4.84:1 sobre navy y 8.33:1 sobre tinta).
- **Estados.**
  - Error: #B3261E, el del repo (6.54:1 sobre blanco y 6.17:1 sobre #FAF8F5).
  - Éxito: #157A3A (5.42:1 sobre blanco, 5.11:1 sobre #FAF8F5 y 5.04:1 sobre su fondo #F0F9F3). Se descartó #15803D: queda en 4.60:1 sobre #F7F5F0 y en 4.47:1 sobre tintes verdes más fuertes.
  - Advertencia: #A84E07, más margen que el #B45309 anterior (5.59:1 sobre blanco, 5.27:1 sobre #FAF8F5 y 5.21:1 sobre #FEF6E9).
  - Información: los tintes celeste del prototipo, con texto #075985 (7.08:1).
- **Bordes de control.** Se toma #8B8574, el tono de los íconos de input del prototipo, porque los bordes del prototipo no llegan a 3:1. Es más marcado que el diseño; hay que validarlo en pantalla.
- **Primario y sombras.** Navy, por D-19. Las sombras de los CTA conservan la geometría de las sombras coral del prototipo, en navy.
- **Tipografía y layout.**
  - Los títulos grandes son fluidos para que palabras como «psicométricos» quepan a 360 px.
  - Por debajo de 640 px, el padding lateral baja de 34 a 20 px.
  - `html` usa font-size 100% para respetar el tamaño de letra del navegador.
- **Integración de los grupos (verificación de la Fase 1).**
  - El celeste #0284C7 estaba escrito dos veces: en el foco y en el control marcado. Ahora vive en `--color-sky-ui`, y `--color-focus` y `--color-control-checked` apuntan a él, así que el foco y la selección cambian juntos si el dueño ajusta el tono.
  - `--space-38` pasó a su lugar en la escala. Los tokens que agregaron los grupos de componentes quedaron documentados en sus tablas: control marcado, halo y anillo de error, ícono y error sobre oscuro, tamaños de avatar y de cuadro numérico, anchos del PageHeader y del toast, alto máximo de modal y spinner.
  - La auditoría en Chromium recorrió todos los componentes con sus variantes, a 1440 y 360 px y con el modal y el drawer abiertos. No hubo ningún texto activo bajo 4.5:1 (el par más bajo es el placeholder sobre #FAF8F5, con 4.83:1), y las 93 paradas de Tab muestran un indicador de 3:1 o más (el más bajo es el foco sobre la pista #F1EDE4, con 3.51:1).

## Pendientes

- Validar en pantalla, con el dueño, el primario navy (D-19) y los bordes de control #8B8574.
- La etiqueta en reposo de FloatingInput (antes `--color-border`, ahora `--color-border-control`) da 3.68:1, menos de 4.5:1. Ya no se ve en ninguna pantalla: login y registro usan Input desde la Fase 7 y FloatingInput quedó sin uso (propuesta de limpieza en [rediseno/estado-final.md](rediseno/estado-final.md)). Si se revive, hay que corregirla.
- ~~polyCycle con movimiento reducido deja visibles los tres polígonos del radar de la home; la Fase 6 debe ocultar dos.~~ Resuelto en la Fase 6: con movimiento reducido, DemoExamen.css oculta dos perfiles y deja uno quieto.
- Halos de la home (Fase 6). En el centro del halo coral de la home (rgba(255,107,107,.26) sobre #FAF8F5, que compone #FBD3D1), el texto terciario baja a 4.24:1, el de éxito a 3.97:1 y el foco a 3.00:1. El secundario se mantiene en 5.44:1. Esos textos van dentro de una superficie o en secundario (regla 13).
- Pesos de Satoshi. El CDN de Fontshare solo trae 300, 400, 500, 700 y 900, así que `--fw-semibold` y `--fw-extrabold` se pintan en 700 en los títulos, igual que en el prototipo. Las cifras de datos van en General Sans, que llega hasta 700 (QA visual de la Fase 1). Si se quiere un peso más grueso para las cifras, hay que pedir Satoshi 900 (decisión del dueño).
- El enlace para saltar al contenido (`.st-skip-link`) lo monta PageLayout desde la Fase 2, cuando la pantalla tiene barra superior. Su capa (`--z-skip-link`, 90) queda por encima de las tres barras, que ya son `.st-topbar` (`--z-topbar`, 30); la barra fija vieja (z-index 100) ya no existe.
- El padding-top del body se retiró en la Fase 2. En la Fase 8 se retiraron los alias (también `--header-h`, que ya nadie usaba) y los `--disc-*`; las fuentes Cormorant Garamond y DM Sans ya se habían retirado en la QA de la misma fase (D-28). Ver «Nombres del sistema anterior».
- Fuentes (QA de la Fase 8, D-28): las hojas de Fontshare se precargan y se aplican al llegar, sin bloquear el primer pintado (`display=swap`), y Vite ya no incrusta en base64 los subconjuntos chicos de JetBrains Mono dentro del CSS (`build.assetsInlineLimit` en vite.config.ts).
