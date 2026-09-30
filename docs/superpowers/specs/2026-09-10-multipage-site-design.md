# Mezquit — Sitio multi-página: Diseño

**Fecha:** 2026-09-10
**Estado:** Aprobado por el usuario
**Alcance:** Convertir el sitio de ventas single-page en un sitio multi-página con React Router: Inicio, Test, Psicometría, Nosotros.

---

## Objetivo

Reorganizar el sitio de una sola página (scroll) en cuatro páginas navegables, reutilizando el sistema de diseño y los componentes existentes. Inicio actúa como resumen que enlaza a tres páginas de profundización.

## Decisiones aprobadas

1. **Rol del Inicio:** Resumen que enlaza. La homepage muestra adelantos de cada tema y enlaza a la página dedicada.
2. **Routing:** React Router (`react-router-dom`). URLs limpias, navegación SPA, scroll-to-top automático.
3. **Experiencias en Psicometría:** Estructura completa lista con datos marcados `[PENDIENTE: testimonio real]`. Cero fabricación.
4. **Página Test:** Paquetes (bundles) + inventario completo, con estructura de precio como `[PENDIENTE: precio]`.
5. **Nosotros:** Estructura lista con misión/visión/valores/protocolo como `[PENDIENTE]` (empresa aún no registrada).
6. **Formulario de contacto:** Solo en Inicio (cierre). Nosotros muestra datos de contacto + enlace ancla al formulario de Inicio.

## Restricciones heredadas (del brief original)

- Paleta y reglas de `docs/design-tokens.md` obligatorias.
- Prohibido inventar cifras de clientes, testimonios, premios, precios. Donde falte dato real → `[PENDIENTE: descripción]` visible.
- Español de México, tuteo, frases cortas.
- No nombrar pruebas comerciales (Cleaver, 16PF, etc.). Usar categorías.
- Nombre siempre "Mezquit".
- Accesibilidad AA, teclado, `prefers-reduced-motion`.
- No instalar librerías de animación/WebGL/scroll suave.

---

## Arquitectura de routing

```
RootLayout (Header + <Outlet/> + Footer + ScrollToTop)
├── /              → HomePage
├── /test          → TestPage
├── /psicometria   → PsicometriaPage
├── /nosotros      → NosotrosPage
└── *              → NotFoundPage (mensaje + link a Inicio)
```

- **RootLayout**: renderiza `Header` y `Footer` una sola vez; el contenido de la ruta va en `<Outlet />`.
- **ScrollToTop**: componente que escucha cambios de `pathname` y hace `window.scrollTo(0,0)`. Respeta que la navegación por ancla dentro de una página siga funcionando.
- **Header**: migra de anclas `#...` a `<NavLink>` de router. Nav: Inicio · Test · Psicometría · Nosotros + CTA "Agenda una demo". El `NavLink` activo recibe estilo (subrayado hunter). El efecto hover-slide se conserva.
- **Footer**: los links legales y de navegación migran a `<Link>` donde apliquen.

### Navegación entre páginas y anclas

- Enlaces a secciones dentro de otra página usan `/ruta#ancla` (ej. "Agenda una demo" → `/#contacto`). Un helper en ScrollToTop maneja el scroll al hash tras navegar.

---

## Páginas

### HomePage (`/`)

Reutiliza componentes existentes como adelantos:

1. `Hero` — sin cambios.
2. **Adelanto de reporte** — reutiliza `SampleReport` tal cual (ya es suficientemente compacto) + un botón debajo "Ver cómo funciona" → `/psicometria`. No se crea variante `compact`.
3. **Adelanto de catálogo** — reutiliza el componente `Catalog` existente tal cual (ya muestra las 4 categorías con conteos, no pruebas individuales) + un botón "Ver todas las pruebas" → `/test`. El inventario detallado de pruebas individuales vive solo en TestPage.
4. `HowItWorks` — sin cambios.
5. `ContactSection` — sin cambios (form POST a `/api/leads`).

### TestPage (`/test`)

1. **Encabezado** de página (título + intro corta).
2. **Paquetes** — desde `data/packages.ts`. Cada paquete: nombre, descripción, pruebas incluidas (referencias a IDs de `catalog.ts`), duración total (calculada), precio `[PENDIENTE: precio]`. Card por paquete.
3. **Inventario completo** — las 18 pruebas individuales agrupadas por categoría, con nombre, qué mide (description), duración. Reutiliza y amplía la data de `catalog.ts`. Filtro por categoría (como el `Catalog` actual pero mostrando pruebas individuales, no solo el resumen de categoría).

### PsicometriaPage (`/psicometria`)

1. **Encabezado** + intro.
2. **Cómo se construyen las pruebas** — contenido educativo real (sin cifras inventadas): validez, confiabilidad, estandarización, baremos/normas. Definiciones generales de psicometría. Bloques de texto con títulos.
3. **Reporte de ejemplo** — reutiliza `SampleReport` completo (badge "Ejemplo").
4. **Experiencias / calificaciones** — componente `Testimonials` con estructura completa (nombre, empresa, rol, cita, calificación) pero con datos `[PENDIENTE: testimonio real]`. Diseño listo para rellenar.

### NosotrosPage (`/nosotros`)

Desde `data/company.ts` (con marcadores):

1. **Encabezado** + intro empresarial `[PENDIENTE]`.
2. **Misión / Visión / Valores** — `[PENDIENTE]` cada uno.
3. **Estructura empresarial / Protocolo** — `[PENDIENTE]`.
4. **Contacto** — reutiliza datos de `SITE` (email, etc.) + botón "Solicitar información" → `/#contacto`.

### NotFoundPage (`*`)

Mensaje breve + `<Link to="/">Volver al inicio</Link>`.

---

## Datos (fuentes de verdad)

- **`data/catalog.ts`** (existe) — 4 categorías, 18 pruebas. Se reutiliza. Se le puede agregar un helper `getTestById(id)` para que packages referencie pruebas sin duplicar.
- **`data/packages.ts`** (nuevo) — array de paquetes. Cada uno: `id`, `name`, `description`, `testIds: string[]` (referencia a catalog), `price: string` (`'[PENDIENTE: precio]'`). Helper `packageDuration(pkg)` suma duraciones desde catalog.
- **`data/company.ts`** (nuevo) — `mission`, `vision`, `values[]`, `structure`/`protocol`, todos con `[PENDIENTE]`.

Ningún dato numérico se escribe a mano en componentes: todo sale del data source (conteos, duraciones, precios).

---

## Componentes (estructura de archivos)

```
src/
├── main.tsx                 (envolver App en <BrowserRouter>)
├── App.tsx                  (define <Routes> con RootLayout)
├── components/
│   ├── layout/
│   │   ├── RootLayout.tsx   (nuevo — Header + Outlet + Footer)
│   │   ├── ScrollToTop.tsx  (nuevo)
│   │   ├── Header.tsx       (modificar — NavLink en vez de anclas)
│   │   └── Footer.tsx       (modificar — Link donde aplique)
│   └── ui/                  (sin cambios: Button, GrainTexture)
├── pages/
│   ├── HomePage.tsx         (nuevo — ensambla adelantos)
│   ├── TestPage.tsx         (nuevo)
│   ├── PsicometriaPage.tsx  (nuevo)
│   ├── NosotrosPage.tsx     (nuevo)
│   └── NotFoundPage.tsx     (nuevo)
├── sections/                (existentes: Hero, SampleReport, Catalog, HowItWorks, Trust, ContactSection)
│   ├── PackagesSection.tsx  (nuevo — para TestPage)
│   ├── TestInventory.tsx    (nuevo — inventario detallado)
│   ├── Methodology.tsx      (nuevo — Psicometría)
│   ├── Testimonials.tsx     (nuevo — experiencias con [PENDIENTE])
│   └── CompanyInfo.tsx      (nuevo — Nosotros)
└── data/
    ├── catalog.ts           (existe — añadir getTestById)
    ├── packages.ts          (nuevo)
    └── company.ts           (nuevo)
```

`Button` recibe soporte para actuar como `<Link>` de router cuando el destino es interno (prop `to`), manteniendo `href` para enlaces externos (agenda).

---

## Flujo de datos

- Navegación: usuario hace click en NavLink → React Router cambia `pathname` → RootLayout renderiza la página correspondiente en `<Outlet/>` → ScrollToTop sube el scroll.
- Datos: los componentes importan de `data/*` en tiempo de build (estático). Sin fetch, salvo el POST del formulario a `/api/leads` (sin cambios).

## Manejo de errores

- Rutas desconocidas → NotFoundPage.
- El formulario mantiene su manejo de errores 422 actual.

## Testing / verificación

- `npx tsc --noEmit` y `npm run build` limpios.
- Navegación manual entre las 4 páginas + 404.
- Screenshots a 375px y 1440px de cada página.
- Verificar que los conteos/duraciones/precios salen del data source.
- Verificar foco de teclado y NavLink activo.

## Fuera de alcance

- Panel de RH / dashboard de reportes (tercera superficie, futuro módulo).
- Flujo del candidato.
- Precios reales, testimonios reales, datos de empresa reales (van como `[PENDIENTE]`).
- Páginas legales completas (aviso de privacidad, términos) — quedan como `[PENDIENTE]`.

## Lista de [PENDIENTE] que generará esta implementación

Además de los del sitio de ventas ya existentes:
1. `packages.ts` — precio de cada paquete
2. `company.ts` — misión, visión, valores, estructura/protocolo, intro empresarial
3. `Testimonials` — cada testimonio real (nombre, empresa, rol, cita, calificación)
4. Psicometría — revisar/aprobar el contenido educativo de metodología
