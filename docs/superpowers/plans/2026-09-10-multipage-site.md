# Mezquit — Sitio multi-página Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el sitio single-page en un sitio multi-página con React Router: Inicio (resumen), Test, Psicometría, Nosotros + 404.

**Architecture:** React Router con un layout route (`RootLayout`) que renderiza Header/Footer una vez y las páginas en `<Outlet/>`. `ScrollToTop` sube el scroll al navegar y maneja anclas cross-page. Se reutilizan los componentes de sección existentes; se agregan páginas y secciones nuevas. Datos estáticos desde `data/*`.

**Tech Stack:** React 19, TypeScript 6, Vite 8, react-router-dom v7, CSS vanilla

**Spec:** `docs/superpowers/specs/2026-09-10-multipage-site-design.md`

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Instalar | `react-router-dom` | Routing |
| Modificar | `src/main.tsx` | Envolver en `<BrowserRouter>` |
| Modificar | `src/App.tsx` | Definir `<Routes>` |
| Crear | `src/components/layout/RootLayout.tsx` | Header + Outlet + Footer |
| Crear | `src/components/layout/ScrollToTop.tsx` | Scroll on navigation + hash |
| Modificar | `src/components/layout/Header.tsx` | NavLink en vez de anclas |
| Modificar | `src/components/layout/Footer.tsx` | Link donde aplique |
| Modificar | `src/components/ui/Button.tsx` | Soporte `to` (router Link) |
| Crear | `src/pages/HomePage.tsx` | Ensambla adelantos |
| Crear | `src/pages/TestPage.tsx` | Paquetes + inventario |
| Crear | `src/pages/PsicometriaPage.tsx` | Metodología + reporte + testimonios |
| Crear | `src/pages/NosotrosPage.tsx` | Empresa |
| Crear | `src/pages/NotFoundPage.tsx` + `.css` | 404 |
| Modificar | `src/data/catalog.ts` | Helper `getTestById` |
| Crear | `src/data/packages.ts` | Paquetes (bundles) |
| Crear | `src/data/company.ts` | Misión/visión/valores/protocolo |
| Crear | `src/sections/PackagesSection.tsx` + `.css` | Cards de paquetes |
| Crear | `src/sections/TestInventory.tsx` + `.css` | Inventario detallado |
| Crear | `src/sections/Methodology.tsx` + `.css` | Cómo se construyen las pruebas |
| Crear | `src/sections/Testimonials.tsx` + `.css` | Experiencias [PENDIENTE] |
| Crear | `src/sections/CompanyInfo.tsx` + `.css` | Nosotros |
| Crear | `src/sections/PageHeader.tsx` + `.css` | Encabezado reutilizable de páginas |
| Modificar | `src/sections/Hero.tsx` | CTA usa router `to` |

---

## Task 1: Instalar react-router-dom y envolver la app

**Files:**
- Install: `react-router-dom`
- Modify: `src/main.tsx`

- [ ] **Step 1: Instalar react-router-dom**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npm install react-router-dom
```

Expected: `react-router-dom` en dependencies (v7.x).

- [ ] **Step 2: Envolver App en BrowserRouter**

Reemplazar `C:\Users\geova\Documents\Mezquit\frontend\src\main.tsx`:

```tsx
import '@/styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 3: Verificar que instala y compila**

```bash
npx tsc --noEmit
```

Expected: sin errores nuevos (App.tsx aún es el viejo, sigue compilando).

---

## Task 2: Actualizar Button para soportar router Link

**Files:**
- Modify: `src/components/ui/Button.tsx`

- [ ] **Step 1: Añadir prop `to` y renderizar Link**

Reemplazar `C:\Users\geova\Documents\Mezquit\frontend\src\components\ui\Button.tsx`:

```tsx
import { Link } from 'react-router-dom'
import './Button.css'

interface ButtonProps {
  variant?: 'primary' | 'ghost'
  size?: 'md' | 'lg'
  href?: string
  to?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  to,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  children,
  onClick,
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'lg' ? 'btn--lg' : '',
    loading ? 'btn--loading' : '',
    className,
  ].filter(Boolean).join(' ')

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      onClick={onClick}
    >
      {loading ? 'Enviando…' : children}
    </button>
  )
}
```

- [ ] **Step 2: Verificar compila**

```bash
npx tsc --noEmit
```

Expected: sin errores.

---

## Task 3: Crear ScrollToTop

**Files:**
- Create: `src/components/layout/ScrollToTop.tsx`

- [ ] **Step 1: Crear el componente**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\components\layout\ScrollToTop.tsx`:

```tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Al cambiar de ruta, sube el scroll al inicio.
 * Si la URL trae un hash (#seccion), hace scroll a ese elemento en su lugar.
 * Respeta prefers-reduced-motion usando scroll instantáneo.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
```

- [ ] **Step 2: Verificar compila**

```bash
npx tsc --noEmit
```

Expected: sin errores.

---

## Task 4: Actualizar Header con NavLink

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Header.css`

- [ ] **Step 1: Reemplazar Header.tsx**

Reemplazar `C:\Users\geova\Documents\Mezquit\frontend\src\components\layout\Header.tsx`:

```tsx
import { Link, NavLink } from 'react-router-dom'
import { SITE } from '@/config/site'
import Button from '@/components/ui/Button'
import './Header.css'

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/test', label: 'Test' },
  { to: '/psicometria', label: 'Psicometría' },
  { to: '/nosotros', label: 'Nosotros' },
]

export default function Header() {
  return (
    <header className="header" role="banner">
      <div className="header__inner">
        <Link to="/" className="header__logo-link" aria-label={`${SITE.name} — inicio`}>
          <img
            src="/logo.png"
            alt={SITE.name}
            className="header__logo-img"
            width={53}
            height={36}
          />
          <span className="header__logo-name" aria-hidden="true">{SITE.name}</span>
        </Link>

        <nav className="header__nav" aria-label="Navegación principal">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `header__nav-link${isActive ? ' header__nav-link--active' : ''}`
              }
            >
              <span className="header__nav-text" aria-hidden="true">{label}</span>
              <span className="header__nav-text--hover" aria-hidden="true">{label}</span>
              <span className="sr-only">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="header__cta">
          <Button
            href={SITE.calendarUrl !== '[PENDIENTE: enlace de agenda]' ? SITE.calendarUrl : undefined}
            to={SITE.calendarUrl !== '[PENDIENTE: enlace de agenda]' ? undefined : '/#contacto'}
          >
            Agenda una demo
          </Button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Añadir estilo de link activo**

Al final de `C:\Users\geova\Documents\Mezquit\frontend\src\components\layout\Header.css`, agregar:

```css
.header__nav-link--active .header__nav-text {
  color: var(--color-hunter);
  border-bottom: 2px solid var(--color-hunter);
}
```

- [ ] **Step 3: Verificar compila**

```bash
npx tsc --noEmit
```

Expected: sin errores.

---

## Task 5: Componente PageHeader reutilizable

**Files:**
- Create: `src/sections/PageHeader.tsx`
- Create: `src/sections/PageHeader.css`

- [ ] **Step 1: Crear PageHeader.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\PageHeader.css`:

```css
.page-header {
  padding-block: var(--section-py) var(--sp-8);
}
.page-header__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  max-width: 760px;
}
.page-header__title {
  font-size: var(--text-4xl);
  color: var(--color-brunswick);
}
.page-header__intro {
  font-size: var(--text-lg);
  color: var(--color-ink);
  opacity: 0.8;
  line-height: 1.5;
}
```

- [ ] **Step 2: Crear PageHeader.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\PageHeader.tsx`:

```tsx
import './PageHeader.css'

interface PageHeaderProps {
  title: string
  intro?: string
}

export default function PageHeader({ title, intro }: PageHeaderProps) {
  return (
    <section className="page-header">
      <div className="page-header__inner">
        <h1 className="page-header__title">{title}</h1>
        {intro && <p className="page-header__intro">{intro}</p>}
      </div>
    </section>
  )
}
```

---

## Task 6: Data — catalog helper, packages, company

**Files:**
- Modify: `src/data/catalog.ts`
- Create: `src/data/packages.ts`
- Create: `src/data/company.ts`

- [ ] **Step 1: Añadir helper getTestById a catalog.ts**

Al final de `C:\Users\geova\Documents\Mezquit\frontend\src\data\catalog.ts` (después de `totalTests`), agregar:

```ts
const ALL_TESTS: Test[] = CATEGORIES.flatMap(cat => cat.tests)

export function getTestById(id: string): Test | undefined {
  return ALL_TESTS.find(t => t.id === id)
}
```

- [ ] **Step 2: Crear packages.ts**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\data\packages.ts`:

```ts
import { getTestById } from './catalog'

export interface Package {
  id: string
  name: string
  description: string
  testIds: string[]
  price: string
}

export const PACKAGES: Package[] = [
  {
    id: 'ventas',
    name: 'Paquete Ventas',
    description: 'Evalúa candidatos a puestos comerciales: conducta, razonamiento e integridad.',
    testIds: ['p1', 'r2', 'i1'],
    price: '[PENDIENTE: precio]',
  },
  {
    id: 'operaciones',
    name: 'Paquete Operaciones',
    description: 'Para personal de piso, producción y maquila: atención, confiabilidad y adaptabilidad.',
    testIds: ['r4', 'i2', 'p5'],
    price: '[PENDIENTE: precio]',
  },
  {
    id: 'liderazgo',
    name: 'Paquete Liderazgo',
    description: 'Para mandos medios y gerenciales: perfil de conducta, razonamiento y estilo de liderazgo.',
    testIds: ['p1', 'r1', 'in5'],
    price: '[PENDIENTE: precio]',
  },
  {
    id: 'integral',
    name: 'Paquete Integral',
    description: 'Evaluación completa: personalidad, razonamiento, integridad e intereses.',
    testIds: ['p2', 'r1', 'i3', 'in1'],
    price: '[PENDIENTE: precio]',
  },
]

/** Suma la duración (min) de las pruebas del paquete desde el catálogo. */
export function packageDuration(pkg: Package): number {
  return pkg.testIds.reduce((total, id) => {
    const test = getTestById(id)
    return total + (test?.durationMin ?? 0)
  }, 0)
}
```

- [ ] **Step 3: Crear company.ts**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\data\company.ts`:

```ts
export interface CompanyValue {
  title: string
  description: string
}

export const COMPANY = {
  intro: '[PENDIENTE: descripción general de la empresa]',
  mission: '[PENDIENTE: misión]',
  vision: '[PENDIENTE: visión]',
  values: [
    { title: '[PENDIENTE: valor 1]', description: '[PENDIENTE: descripción del valor 1]' },
    { title: '[PENDIENTE: valor 2]', description: '[PENDIENTE: descripción del valor 2]' },
    { title: '[PENDIENTE: valor 3]', description: '[PENDIENTE: descripción del valor 3]' },
  ] as CompanyValue[],
  protocol: '[PENDIENTE: estructura empresarial y protocolo]',
} as const
```

- [ ] **Step 4: Verificar compila**

```bash
npx tsc --noEmit
```

Expected: sin errores.

---

## Task 7: Sección PackagesSection

**Files:**
- Create: `src/sections/PackagesSection.tsx`
- Create: `src/sections/PackagesSection.css`

- [ ] **Step 1: Crear PackagesSection.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\PackagesSection.css`:

```css
.packages {
  padding-block: var(--section-py);
}
.packages__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
}
.packages__title { font-size: var(--text-3xl); }

.packages__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-6);
}
@media (min-width: 768px) {
  .packages__grid { grid-template-columns: 1fr 1fr; }
}

.package-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-timberwolf);
  border-radius: var(--radius-md);
  padding: var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
.package-card__name {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-brunswick);
}
.package-card__desc {
  font-size: var(--text-base);
  color: var(--color-ink);
  opacity: 0.8;
  line-height: 1.5;
}
.package-card__tests {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding-top: var(--sp-2);
  border-top: 1px solid var(--color-timberwolf);
}
.package-card__test {
  font-size: var(--text-sm);
  color: var(--color-ink);
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
}
.package-card__test-dot {
  color: var(--color-hunter);
  font-weight: 700;
}
.package-card__footer {
  margin-top: auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-4);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--color-timberwolf);
}
.package-card__duration {
  font-size: var(--text-sm);
  color: var(--color-ink);
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
.package-card__price {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-brunswick);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 2: Crear PackagesSection.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\PackagesSection.tsx`:

```tsx
import { PACKAGES, packageDuration } from '@/data/packages'
import { getTestById } from '@/data/catalog'
import './PackagesSection.css'

export default function PackagesSection() {
  return (
    <section className="packages" id="paquetes" aria-labelledby="packages-title">
      <div className="packages__inner">
        <h2 className="packages__title" id="packages-title">Paquetes</h2>
        <div className="packages__grid">
          {PACKAGES.map(pkg => (
            <article key={pkg.id} className="package-card">
              <h3 className="package-card__name">{pkg.name}</h3>
              <p className="package-card__desc">{pkg.description}</p>
              <ul className="package-card__tests">
                {pkg.testIds.map(id => {
                  const test = getTestById(id)
                  return (
                    <li key={id} className="package-card__test">
                      <span className="package-card__test-dot" aria-hidden="true">›</span>
                      {test ? test.name : id}
                    </li>
                  )
                })}
              </ul>
              <div className="package-card__footer">
                <span className="package-card__duration">
                  {packageDuration(pkg)} min aprox.
                </span>
                <span className="package-card__price">{pkg.price}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## Task 8: Sección TestInventory

**Files:**
- Create: `src/sections/TestInventory.tsx`
- Create: `src/sections/TestInventory.css`

- [ ] **Step 1: Crear TestInventory.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\TestInventory.css`:

```css
.inventory {
  padding-block: var(--section-py);
  background-color: var(--color-surface-secondary);
}
.inventory__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
}
.inventory__title { font-size: var(--text-3xl); }

.inventory__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.inventory__filter-btn {
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  border: 1.5px solid var(--color-border);
  background-color: transparent;
  color: var(--color-ink);
  cursor: pointer;
  transition: background-color var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}
.inventory__filter-btn:hover,
.inventory__filter-btn[aria-pressed='true'] {
  background-color: var(--color-hunter);
  border-color: var(--color-hunter);
  color: #ffffff;
}

.inventory__group { display: flex; flex-direction: column; gap: var(--sp-4); }
.inventory__group-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-brunswick);
}
.inventory__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-4);
}
@media (min-width: 640px) {
  .inventory__grid { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1024px) {
  .inventory__grid { grid-template-columns: repeat(3, 1fr); }
}

.test-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-timberwolf);
  border-radius: var(--radius-md);
  padding: var(--sp-5);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.test-card__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-brunswick);
}
.test-card__desc {
  font-size: var(--text-sm);
  color: var(--color-ink);
  opacity: 0.75;
  line-height: 1.5;
  flex-grow: 1;
}
.test-card__duration {
  font-size: var(--text-xs);
  color: var(--color-hunter);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 2: Crear TestInventory.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\TestInventory.tsx`:

```tsx
import { useState } from 'react'
import { CATEGORIES, type CategoryId } from '@/data/catalog'
import './TestInventory.css'

const ALL_FILTER = 'todas' as const
type FilterValue = CategoryId | typeof ALL_FILTER

export default function TestInventory() {
  const [active, setActive] = useState<FilterValue>(ALL_FILTER)

  const visible = active === ALL_FILTER
    ? CATEGORIES
    : CATEGORIES.filter(c => c.id === active)

  return (
    <section className="inventory" id="inventario" aria-labelledby="inventory-title">
      <div className="inventory__inner">
        <h2 className="inventory__title" id="inventory-title">Inventario de pruebas</h2>

        <div className="inventory__filters" role="group" aria-label="Filtrar por categoría">
          <button
            className="inventory__filter-btn"
            aria-pressed={active === ALL_FILTER}
            onClick={() => setActive(ALL_FILTER)}
          >
            Todas
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className="inventory__filter-btn"
              aria-pressed={active === cat.id}
              onClick={() => setActive(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {visible.map(cat => (
          <div key={cat.id} className="inventory__group">
            <h3 className="inventory__group-title">
              {cat.label} <span aria-hidden="true">·</span> {cat.tests.length}
            </h3>
            <div className="inventory__grid">
              {cat.tests.map(test => (
                <article key={test.id} className="test-card">
                  <h4 className="test-card__name">{test.name}</h4>
                  <p className="test-card__desc">{test.description}</p>
                  <span className="test-card__duration">{test.durationMin} min</span>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

---

## Task 9: Sección Methodology

**Files:**
- Create: `src/sections/Methodology.tsx`
- Create: `src/sections/Methodology.css`

- [ ] **Step 1: Crear Methodology.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Methodology.css`:

```css
.methodology {
  padding-block: var(--section-py);
}
.methodology__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-10);
}
.methodology__title { font-size: var(--text-3xl); }

.methodology__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-6);
}
@media (min-width: 768px) {
  .methodology__grid { grid-template-columns: 1fr 1fr; }
}

.method-card {
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius-md);
  padding: var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.method-card__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-brunswick);
}
.method-card__body {
  font-size: var(--text-base);
  color: var(--color-ink);
  opacity: 0.85;
  line-height: 1.6;
}
```

- [ ] **Step 2: Crear Methodology.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Methodology.tsx`:

```tsx
import './Methodology.css'

const CONCEPTS = [
  {
    title: 'Validez',
    body: 'Una prueba es válida cuando mide lo que dice medir. Cada instrumento se construye a partir de un marco teórico claro y se revisa para que sus reactivos correspondan al rasgo que se evalúa.',
  },
  {
    title: 'Confiabilidad',
    body: 'La confiabilidad es la consistencia de los resultados: si una persona responde en condiciones similares, el puntaje debe ser estable. Se cuida con reactivos redundantes y controles internos.',
  },
  {
    title: 'Estandarización',
    body: 'Todos los candidatos responden en las mismas condiciones: mismo orden, mismas instrucciones, sin distracciones. Esto permite comparar resultados de forma justa.',
  },
  {
    title: 'Baremos y normas',
    body: 'Un puntaje directo cobra sentido al compararse con un grupo de referencia. Los baremos convierten el puntaje en un percentil, para ubicar a la persona respecto a una población.',
  },
]

export default function Methodology() {
  return (
    <section className="methodology" id="metodologia" aria-labelledby="method-title">
      <div className="methodology__inner">
        <h2 className="methodology__title" id="method-title">Cómo se construyen las pruebas</h2>
        <div className="methodology__grid">
          {CONCEPTS.map(c => (
            <div key={c.title} className="method-card">
              <h3 className="method-card__title">{c.title}</h3>
              <p className="method-card__body">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## Task 10: Sección Testimonials

**Files:**
- Create: `src/sections/Testimonials.tsx`
- Create: `src/sections/Testimonials.css`

- [ ] **Step 1: Crear Testimonials.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Testimonials.css`:

```css
.testimonials {
  padding-block: var(--section-py);
  background-color: var(--color-timberwolf);
}
.testimonials__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
}
.testimonials__title { font-size: var(--text-3xl); }

.testimonials__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-6);
}
@media (min-width: 768px) {
  .testimonials__grid { grid-template-columns: repeat(3, 1fr); }
}

.testimonial-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
.testimonial-card__rating {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-hunter);
  font-variant-numeric: tabular-nums;
}
.testimonial-card__quote {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  color: var(--color-brunswick);
  line-height: 1.4;
  flex-grow: 1;
}
.testimonial-card__author {
  font-size: var(--text-sm);
  color: var(--color-ink);
}
.testimonial-card__author-name { font-weight: 600; }
.testimonial-card__author-role { opacity: 0.7; }
```

- [ ] **Step 2: Crear Testimonials.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Testimonials.tsx`:

```tsx
import './Testimonials.css'

interface Testimonial {
  quote: string
  rating: string
  name: string
  role: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: '[PENDIENTE: testimonio real]',
    rating: '[PENDIENTE: calificación]',
    name: '[PENDIENTE: nombre]',
    role: '[PENDIENTE: puesto y empresa]',
  },
  {
    quote: '[PENDIENTE: testimonio real]',
    rating: '[PENDIENTE: calificación]',
    name: '[PENDIENTE: nombre]',
    role: '[PENDIENTE: puesto y empresa]',
  },
  {
    quote: '[PENDIENTE: testimonio real]',
    rating: '[PENDIENTE: calificación]',
    name: '[PENDIENTE: nombre]',
    role: '[PENDIENTE: puesto y empresa]',
  },
]

export default function Testimonials() {
  return (
    <section className="testimonials" id="experiencias" aria-labelledby="testimonials-title">
      <div className="testimonials__inner">
        <h2 className="testimonials__title" id="testimonials-title">Experiencias</h2>
        <div className="testimonials__grid">
          {TESTIMONIALS.map((t, i) => (
            <blockquote key={i} className="testimonial-card">
              <p className="testimonial-card__rating">{t.rating}</p>
              <p className="testimonial-card__quote">{t.quote}</p>
              <footer className="testimonial-card__author">
                <span className="testimonial-card__author-name">{t.name}</span>
                <br />
                <span className="testimonial-card__author-role">{t.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## Task 11: Sección CompanyInfo

**Files:**
- Create: `src/sections/CompanyInfo.tsx`
- Create: `src/sections/CompanyInfo.css`

- [ ] **Step 1: Crear CompanyInfo.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\CompanyInfo.css`:

```css
.company {
  padding-block: var(--section-py);
}
.company__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-12);
}

.company__mv {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-6);
}
@media (min-width: 768px) {
  .company__mv { grid-template-columns: 1fr 1fr; }
}
.company__block {
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius-md);
  padding: var(--sp-8);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.company__block-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-brunswick);
}
.company__block-body {
  font-size: var(--text-base);
  color: var(--color-ink);
  opacity: 0.85;
  line-height: 1.6;
}

.company__values {
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}
.company__section-title { font-size: var(--text-3xl); }
.company__values-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-4);
}
@media (min-width: 768px) {
  .company__values-grid { grid-template-columns: repeat(3, 1fr); }
}
.company__value {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-5);
  border: 1px solid var(--color-timberwolf);
  border-radius: var(--radius-md);
}
.company__value-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-brunswick);
}
.company__value-desc {
  font-size: var(--text-sm);
  color: var(--color-ink);
  opacity: 0.75;
}

.company__protocol {
  background-color: var(--color-brunswick);
  color: #ffffff;
  border-radius: var(--radius-md);
  padding: var(--sp-8);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.company__protocol-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: #ffffff;
}
.company__protocol-body {
  font-size: var(--text-base);
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
}

.company__contact {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  align-items: flex-start;
}
.company__contact-title { font-size: var(--text-2xl); }
.company__contact-email {
  font-size: var(--text-lg);
  color: var(--color-hunter);
  font-weight: 500;
}
```

- [ ] **Step 2: Crear CompanyInfo.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\CompanyInfo.tsx`:

```tsx
import { COMPANY } from '@/data/company'
import { SITE } from '@/config/site'
import Button from '@/components/ui/Button'
import './CompanyInfo.css'

export default function CompanyInfo() {
  return (
    <section className="company" aria-label="Información de la empresa">
      <div className="company__inner">
        <div className="company__mv">
          <div className="company__block">
            <h2 className="company__block-title">Misión</h2>
            <p className="company__block-body">{COMPANY.mission}</p>
          </div>
          <div className="company__block">
            <h2 className="company__block-title">Visión</h2>
            <p className="company__block-body">{COMPANY.vision}</p>
          </div>
        </div>

        <div className="company__values">
          <h2 className="company__section-title">Valores</h2>
          <div className="company__values-grid">
            {COMPANY.values.map((v, i) => (
              <div key={i} className="company__value">
                <h3 className="company__value-title">{v.title}</h3>
                <p className="company__value-desc">{v.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="company__protocol">
          <h2 className="company__protocol-title">Estructura y protocolo</h2>
          <p className="company__protocol-body">{COMPANY.protocol}</p>
        </div>

        <div className="company__contact" id="contacto-empresa">
          <h2 className="company__contact-title">Contacto</h2>
          <a className="company__contact-email" href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
          <Button to="/#contacto">Solicitar información</Button>
        </div>
      </div>
    </section>
  )
}
```

---

## Task 12: Páginas

**Files:**
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/TestPage.tsx`
- Create: `src/pages/PsicometriaPage.tsx`
- Create: `src/pages/NosotrosPage.tsx`
- Create: `src/pages/NotFoundPage.tsx`
- Create: `src/pages/NotFoundPage.css`

- [ ] **Step 1: Crear HomePage.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\pages\HomePage.tsx`:

```tsx
import Hero from '@/sections/Hero'
import SampleReport from '@/sections/SampleReport'
import Catalog from '@/sections/Catalog'
import HowItWorks from '@/sections/HowItWorks'
import ContactSection from '@/sections/ContactSection'
import Button from '@/components/ui/Button'

export default function HomePage() {
  return (
    <>
      <Hero />
      <SampleReport />
      <div style={{ textAlign: 'center', paddingBottom: 'var(--section-py)', background: 'var(--color-timberwolf)' }}>
        <Button to="/psicometria" variant="ghost">Ver cómo funciona</Button>
      </div>
      <Catalog />
      <div style={{ textAlign: 'center', paddingBottom: 'var(--section-py)' }}>
        <Button to="/test">Ver todas las pruebas</Button>
      </div>
      <HowItWorks />
      <ContactSection />
    </>
  )
}
```

- [ ] **Step 2: Crear TestPage.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\pages\TestPage.tsx`:

```tsx
import PageHeader from '@/sections/PageHeader'
import PackagesSection from '@/sections/PackagesSection'
import TestInventory from '@/sections/TestInventory'

export default function TestPage() {
  return (
    <>
      <PageHeader
        title="Test"
        intro="Elige un paquete listo para tu tipo de puesto o arma tu evaluación desde el inventario completo de pruebas."
      />
      <PackagesSection />
      <TestInventory />
    </>
  )
}
```

- [ ] **Step 3: Crear PsicometriaPage.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\pages\PsicometriaPage.tsx`:

```tsx
import PageHeader from '@/sections/PageHeader'
import Methodology from '@/sections/Methodology'
import SampleReport from '@/sections/SampleReport'
import Testimonials from '@/sections/Testimonials'

export default function PsicometriaPage() {
  return (
    <>
      <PageHeader
        title="Psicometría"
        intro="Qué mide una prueba psicométrica, cómo se construye y cómo se lee un reporte."
      />
      <Methodology />
      <SampleReport />
      <Testimonials />
    </>
  )
}
```

- [ ] **Step 4: Crear NosotrosPage.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\pages\NosotrosPage.tsx`:

```tsx
import PageHeader from '@/sections/PageHeader'
import CompanyInfo from '@/sections/CompanyInfo'
import { COMPANY } from '@/data/company'

export default function NosotrosPage() {
  return (
    <>
      <PageHeader title="Nosotros" intro={COMPANY.intro} />
      <CompanyInfo />
    </>
  )
}
```

- [ ] **Step 5: Crear NotFoundPage.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\pages\NotFoundPage.css`:

```css
.notfound {
  min-height: calc(100svh - var(--header-h));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-6);
  padding-inline: var(--section-px);
  text-align: center;
}
.notfound__code {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  color: var(--color-brunswick);
  line-height: 1;
}
.notfound__msg {
  font-size: var(--text-lg);
  color: var(--color-ink);
  opacity: 0.8;
}
```

- [ ] **Step 6: Crear NotFoundPage.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\pages\NotFoundPage.tsx`:

```tsx
import Button from '@/components/ui/Button'
import './NotFoundPage.css'

export default function NotFoundPage() {
  return (
    <div className="notfound">
      <p className="notfound__code">404</p>
      <p className="notfound__msg">Esta página no existe o fue movida.</p>
      <Button to="/">Volver al inicio</Button>
    </div>
  )
}
```

---

## Task 13: RootLayout y App con Routes

**Files:**
- Create: `src/components/layout/RootLayout.tsx`
- Modify: `src/App.tsx`
- Modify: `src/sections/Hero.tsx`

- [ ] **Step 1: Crear RootLayout.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\components\layout\RootLayout.tsx`:

```tsx
import { Outlet } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/layout/ScrollToTop'

export default function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Reemplazar App.tsx**

Reemplazar `C:\Users\geova\Documents\Mezquit\frontend\src\App.tsx`:

```tsx
import { Routes, Route } from 'react-router-dom'
import RootLayout from '@/components/layout/RootLayout'
import HomePage from '@/pages/HomePage'
import TestPage from '@/pages/TestPage'
import PsicometriaPage from '@/pages/PsicometriaPage'
import NosotrosPage from '@/pages/NosotrosPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="test" element={<TestPage />} />
        <Route path="psicometria" element={<PsicometriaPage />} />
        <Route path="nosotros" element={<NosotrosPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 3: Actualizar el CTA secundario del Hero para usar router**

En `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Hero.tsx`, el CTA primario "Agenda una demo" usa `href` a `#contacto`. Como el Hero solo vive en HomePage, el ancla `#contacto` funciona en la misma página. Dejar el `href` del botón primario como está (apunta a `#contacto` en la misma page o al calendario). El enlace secundario "Ver catálogo ↓" apunta a `#catalogo` (también en HomePage) — dejarlo como está. No requiere cambios si ambos anclas viven en HomePage.

Verificar leyendo el archivo: si el botón primario usa `href={SITE.calendarUrl !== ... ? ... : '#contacto'}`, está bien. No modificar.

- [ ] **Step 4: Verificar compila y build**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npx tsc --noEmit
npm run build
```

Expected: sin errores de TypeScript, build exitoso.

- [ ] **Step 5: Commit**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
git add src/ package.json package-lock.json
git commit -m "feat: convert to multi-page site with React Router (Inicio, Test, Psicometría, Nosotros)"
```

---

## Task 14: Verificación visual

**Files:** (solo verificación)

- [ ] **Step 1: Arrancar dev server**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npm run dev
```

Expected: server en http://localhost:5173 (o 5174).

- [ ] **Step 2: Screenshots de las 4 páginas a 1440px**

```bash
npx playwright screenshot --browser chromium --viewport-size "1440,900" --full-page "http://localhost:5173/" "C:/Users/geova/AppData/Local/Temp/mp-home.png"
npx playwright screenshot --browser chromium --viewport-size "1440,900" --full-page "http://localhost:5173/test" "C:/Users/geova/AppData/Local/Temp/mp-test.png"
npx playwright screenshot --browser chromium --viewport-size "1440,900" --full-page "http://localhost:5173/psicometria" "C:/Users/geova/AppData/Local/Temp/mp-psico.png"
npx playwright screenshot --browser chromium --viewport-size "1440,900" --full-page "http://localhost:5173/nosotros" "C:/Users/geova/AppData/Local/Temp/mp-nosotros.png"
```

- [ ] **Step 3: Screenshot móvil de home a 375px**

```bash
npx playwright screenshot --browser chromium --viewport-size "375,812" --full-page "http://localhost:5173/" "C:/Users/geova/AppData/Local/Temp/mp-home-mobile.png"
```

- [ ] **Step 4: Revisar las 5 capturas y reportar issues**

Leer cada PNG y verificar:
- Header con nav de 4 links (Inicio, Test, Psicometría, Nosotros) + link activo resaltado
- Home: hero + reporte + botón "Ver cómo funciona" + catálogo + botón "Ver todas las pruebas" + cómo funciona + formulario
- Test: paquetes (4 cards con precio [PENDIENTE: precio]) + inventario filtrable
- Psicometría: metodología (4 conceptos) + reporte de ejemplo + testimonios [PENDIENTE]
- Nosotros: misión/visión + valores + protocolo + contacto
- Sin desbordamiento en móvil, contraste correcto

Reportar cualquier problema encontrado.

---

## Self-review checklist

- [ ] Navegación entre las 4 páginas + 404 funciona
- [ ] Conteos, duraciones y precios salen de `data/*` (nada hardcoded en componentes)
- [ ] Todos los `[PENDIENTE]` son visibles
- [ ] `prefers-reduced-motion` respetado (ScrollToTop usa scroll instantáneo por defecto)
- [ ] Foco de teclado y NavLink activo

## Lista de [PENDIENTE] que genera este plan

1. `packages.ts` — precio de cada uno de los 4 paquetes
2. `company.ts` — intro, misión, visión, 3 valores, protocolo
3. `Testimonials.tsx` — 3 testimonios (cita, calificación, nombre, rol)
4. Revisar/aprobar el contenido educativo de `Methodology.tsx`
