# Rediseño completo del frontend de STRATA

## Contexto

Este repositorio es STRATA, una plataforma de evaluaciones psicométricas B2B y B2C. Mi compañero construyó el backend y un frontend sencillo, pensado solo para probar funcionalidades. Ese frontend se va a reemplazar por completo: diseño visual, colores, tipografía, componentes, layout, navegación, animaciones y flujos de UX.

La carpeta `diseno/` contiene el prototipo aprobado:

- `diseno/Strata.dc.html`: prototipo navegable con todas las pantallas y los tres roles. Es la referencia de diseño y de UX.
- `diseno/support.js`: runtime del prototipo. Solo sirve para abrirlo en el navegador; no lo portes.
- `diseno/assets/`: `mascota.png` (salamandra animada del inicio), `strata-salamandra.png` (logo de la barra superior), `strata-logo.png` y `strata-mark.png`.
- `diseno/uploads/`: imágenes de referencia. No van a producción.

Para verlo, corre `npx serve diseno` y abre `Strata.dc.html`.

### Cómo leer el prototipo

- El markup está entre `<x-dc>` y `</x-dc>`. Es HTML con estilos inline, variables `{{ nombre }}`, `<sc-if>` para condicionales y `<sc-for>` para listas.
- La lógica está en `class Component extends DCLogic`, dentro de `<script data-dc-script>`. `state.pantalla` define qué pantalla se muestra y `renderVals()` entrega datos y handlers al markup.
- Los datos del `state` son ficticios: empresas, candidatos, precios, códigos, nombres de usuario y contadores. Solo ilustran el diseño. Los datos reales vienen del backend.
- El selector de roles y los avisos "fuera del alcance de este prototipo" existen solo en el prototipo. No los portes. En producción, el rol sale de la sesión.
- El archivo tiene unas 2,300 líneas. Léelo por partes: primero el markup y después la clase de lógica.

## Objetivo

Reemplazar la capa de presentación completa por el diseño del prototipo y conservar todo lo que el backend y el frontend actual ya hacen.

Cada fuente manda en lo suyo:

- **Repositorio actual:** datos, entidades, campos, endpoints, validaciones, permisos, reglas de negocio y funcionalidades. Nada de esto se pierde.
- **Prototipo:** apariencia, layout, componentes, navegación, flujos, estados de interfaz, microcopy y animaciones.

Si una funcionalidad existe en el repo pero no en el prototipo, se conserva y se diseña con el mismo sistema visual. Si un flujo del prototipo no tiene soporte en el backend, no lo simules: regístralo como pendiente.

## Reglas

1. No modifiques el backend: rutas de API, controladores, modelos, migraciones, base de datos, autenticación, variables de entorno ni sus tests. Si el rediseño necesita algo del backend, anótalo en `docs/rediseno/pendientes-backend.md` para mi compañero.
2. Conserva el stack, el framework y el router del frontend actual. Pregúntame antes de agregar dependencias grandes, como Tailwind o librerías de componentes. GSAP ya está aprobado para la mascota.
3. No copies los estilos inline del prototipo tal cual. Conviértelos en tokens y componentes reutilizables con el sistema de estilos del repo.
4. Conserva las URLs y los contratos de datos existentes. Si una ruta tiene que cambiar para seguir el flujo del prototipo, propónmelo primero.
5. No elimines funciones ni campos del frontend actual. Si el prototipo simplificó algo y el backend exige más, conserva lo que exige el backend y avísame. Por ejemplo, el formulario del candidato del prototipo solo pide nombre y correo.
6. Trabaja en la rama `feat/rediseno-strata` y haz un commit por fase o por pantalla.

## Fase 0 · Auditoría y plan (detente al terminar)

Antes de tocar código:

1. Identifica el stack del frontend: framework, router, manejo de estado, estilos, cliente HTTP y cómo se resuelven la sesión y los roles.
2. Lista las pantallas, rutas y componentes del frontend actual, y los endpoints que consume.
3. Lee el prototipo completo y lista sus pantallas, flujos y estados.
4. Crea `docs/rediseno/mapa.md` con una tabla que relacione la pantalla del prototipo, la ruta o componente actual, los endpoints, las diferencias y la acción propuesta.
5. Crea `docs/rediseno/brechas.md` con lo que hay en el repo sin diseño y lo que hay en el prototipo sin backend.

Muéstrame el plan y espera mi aprobación antes de seguir.

## Sistema de diseño

Implementa los tokens como variables CSS o con el mecanismo equivalente del stack. Estos son los valores base. Cualquier otro valor lo tomas directamente del prototipo.

### Color

- Fondo de página: `#FAF8F5`. Beige secundario: `#F7F5F0`.
- Navy (marca y botones primarios): `#1E3A8A`. Tinta de títulos: `#0F172A`.
- Celeste (acento e indicadores): `#38BDF8`. Celeste para texto sobre fondo claro: `#0369A1`. Hover: `#0EA5E9`.
- Coral (indicador activo y acentos): `#FF6B6B`.
- Texto secundario: `#5B5545`. Texto terciario: `#6B6558`. Placeholder: `#756D5C`.
- Bordes: `#EBE5DA`, `#EFE9DF` y `#E7E2D8`.
- Contraste WCAG AA: el texto normal debe tener al menos 4.5:1.

### Tipografía

- Títulos: Satoshi (Fontshare) con tracking de −0.02em. El H1 de página mide 46px, con line-height 1.06, tracking de −0.03em y `text-wrap: balance`.
- Texto: General Sans (Fontshare).
- Códigos de licencia: JetBrains Mono.
- Encabezado de página, de arriba abajo:
  1. Eyebrow: 11px, peso 700, mayúsculas, tracking de .13em, color `#0369A1`.
  2. H1.
  3. Entradilla: 17px, color `#5B5545`.

### Superficies

- **Tarjeta de vidrio:**
  - Fondo `rgba(255,255,255,.72)` y `backdrop-filter: blur(14px)`.
  - Borde `1px solid rgba(255,255,255,.92)` y radio de 24px.
  - Sombra `0 20px 44px -28px rgba(15,23,42,.28)`.
- **Tarjeta secundaria:** fondo `rgba(255,255,255,.85)`, borde `#EFE9DF` y radio de 18px.
- **Radios:** 14px en controles y 999px en pastillas.
- **Fondo:** tres halos radiales fijos (coral al 20%, celeste al 20% y navy al 10%) con una deriva lenta de 18s.

### Layout

- Debe sentirse como un sitio web, no como un panel SaaS. No lleva sidebar.
- El contenido va centrado, con un ancho máximo de 1200px y padding de `48px 34px 88px`.
- **Barra superior:**
  - Es sticky y translúcida: `rgba(250,248,245,.78)` con blur de 16px.
  - A la izquierda va el logo salamandra, que regresa al inicio.
  - Los enlaces son de texto. El activo lleva un subrayado coral de 2px.
  - A la derecha va una pastilla con el usuario o la empresa.
- El pie de página aparece en todas las pantallas internas.
- El diseño es desktop-first, pero debe adaptarse hasta 360px de ancho.

### Movimiento

- Entrada de pantalla: fade y elevación de 14px en 0.5s.
- Tarjetas: aparecen escalonadas, con 55ms entre una y otra.
- Hover y cambios de estado: transiciones de 0.18s.
- Con `prefers-reduced-motion` se desactivan las animaciones y la mascota queda quieta u oculta.

### Componentes base (constrúyelos primero)

- **Controles:** Button (primario, secundario y ghost), Input con estados de validación y Select.
- **Contenido:** Card, Table y Badge de estado.
- **Retroalimentación:** Toast y Modal.
- **Estructura:**
  - TopBar por rol y Footer.
  - PageHeader (eyebrow, H1 y entradilla).
  - PageLayout con los halos de fondo.

## Pantallas y flujos del prototipo

### Visitante: Inicio

- Selector "Para mí" (B2C) / "Para mi empresa" (B2B) que cambia el hero, el CTA y los precios.
- Demo de examen en vivo.
- Catálogo en tarjetas de vidrio, con acciones para previsualizar y comprar.
- Sección "Cómo funciona".
- Mascota.

### Empresa / RR. HH.

La navegación es Tests · Mis licencias · Candidatos · Resultados. La barra muestra el saldo de licencias y la pastilla de la empresa.

- **Tests:** catálogo con filtros, carrito y checkout. Al pagar se acreditan las licencias, se generan los códigos y se redirige a Mis licencias.
- **Mis licencias:** inventario de códigos por estado (Disponible, Enviada y Consumida), con las acciones Enviar, Reenviar y Ver reporte.
- **Candidatos:**
  - Seguimiento por estado.
  - Asignación de test por correo o por enlace.
  - Invitación con código generado.
  - Reenvío de la invitación.
- **Resultados:** reporte del candidato por dimensiones.

### Super admin

La navegación es Test Builder · Reactivos · Algoritmos. El constructor de tests tiene tres pasos: datos generales, reactivos y algoritmo de calificación.

### Candidato

No tiene navegación; solo aparece el logo.

- **Acceso:**
  - Validación automática del enlace mágico o del código.
  - Formulario mínimo con validación en vivo.
  - Aceptación del aviso de privacidad.
- **Examen:**
  - Barra superior translúcida con el progreso y el tiempo.
  - Una pregunta por vista.
  - No se puede avanzar sin responder.
- **Fin:** confirmación de que el reporte se envió a la empresa.

## Mascota (inicio)

- Es la salamandra de `assets/mascota.png`, animada con GSAP 3.12 y MotionPathPlugin. Instálalos por npm, no por CDN.
- Porta el comportamiento de los métodos de mascota del prototipo: `iniciarMascota`, `nadarLibre`, `entrarEnEscena`, `correrHacia`, `brincarMascota`, `vigilarTitular` y `pararMascota`.
  - Entra en escena tras un retardo y nada en bucle.
  - Corre hacia los CTA y los enlaces del menú cuando se hace clic en ellos.
  - Baja su opacidad cuando pasa sobre el H1.
  - Al tocarla, muestra una burbuja de diálogo.
- Encapsúlala en un componente que, al desmontarse, limpie los tweens, el ticker y los listeners. No debe haber fugas al cambiar de ruta.

## Fases de implementación

1. Tokens, fuentes, estilos globales y componentes base.
2. Layout: barra superior por rol, pie de página, halos y transición entre pantallas.
3. Flujo del candidato: Acceso, Examen y Fin.
4. Portal de RR. HH.: Tests, Mis licencias, Candidatos y Resultados.
5. Test Builder.
6. Inicio y mascota.
7. Pantallas del repo que no tienen equivalente en el prototipo, con el mismo sistema visual.
8. QA final.

Al terminar cada fase, build, lint y tests deben pasar. Después, dame un resumen breve de lo que hiciste y lo que queda pendiente.

## Criterios de aceptación

- Todas las funciones del frontend original siguen operando contra el backend real.
- No se modificó ningún archivo del backend.
- Cada pantalla que consume la API tiene diseñados sus estados de carga, vacío y error.
- Se puede navegar con teclado, el foco es visible y el contraste cumple AA.
- No hay errores en consola ni fugas de animación.
- La interfaz coincide con el prototipo en color, tipografía, espaciado y movimiento.
- `docs/rediseno/` contiene el mapa, las brechas, los pendientes de backend y las decisiones tomadas.
