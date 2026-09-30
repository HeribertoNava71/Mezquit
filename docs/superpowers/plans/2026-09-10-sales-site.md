# Mezquit — Sales Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el sitio de ventas de Mezquit: página única con hero, reporte de ejemplo, catálogo, flujo, confianza y formulario de contacto que POST a `/api/leads`.

**Architecture:** Single-page en React 19 + TypeScript + Vite. CSS vanilla con custom properties. Tipografía Cormorant Garamond (títulos) + DM Sans Variable (cuerpo), autohospedadas vía @fontsource. Textura SVG animada de veta. Formulario POST a endpoint Laravel. Sin React Router — una sola página con anclas.

**Tech Stack:** React 19, TypeScript 6, Vite 8, CSS vanilla, `@fontsource/cormorant-garamond`, `@fontsource-variable/dm-sans`, `sharp` (devDep, favicons), Laravel 13

**Decisiones aprobadas:** Tipografía A · Textura SVG animada · Catálogo en `data/catalog.ts` · Formulario a endpoint Laravel · Token `--mezquit-surface-secondary` incluido

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Crear | `docs/design-tokens.md` | Fuente de verdad de color |
| Crear | `frontend/public/logo.png` | Copia del logo |
| Crear | `frontend/public/favicon-16.png` | Favicon 16px |
| Crear | `frontend/public/favicon-32.png` | Favicon 32px |
| Crear | `frontend/public/apple-touch-icon.png` | 180×180 |
| Crear | `frontend/public/og-image.png` | Open Graph 1200×630 |
| Crear | `frontend/src/config/site.ts` | Config central |
| Crear | `frontend/src/data/catalog.ts` | Catálogo de pruebas |
| Crear | `frontend/src/styles/tokens.css` | Custom properties |
| Crear | `frontend/src/styles/typography.css` | @import fontsource + escala |
| Crear | `frontend/src/styles/global.css` | Reset + base |
| Modificar | `frontend/index.html` | lang, title, meta OG, favicons |
| Modificar | `frontend/vite.config.ts` | Alias `@` |
| Modificar | `frontend/src/main.tsx` | Import global.css |
| Modificar | `frontend/src/App.tsx` | Página completa |
| Crear | `frontend/src/components/ui/Button.tsx` + `.css` | Botón primario/ghost |
| Crear | `frontend/src/components/ui/GrainTexture.tsx` + `.css` | SVG veta animada |
| Crear | `frontend/src/components/layout/Header.tsx` + `.css` | Nav con hover slide |
| Crear | `frontend/src/components/layout/Footer.tsx` + `.css` | Footer |
| Crear | `frontend/src/sections/Hero.tsx` + `.css` | Sección 1 |
| Crear | `frontend/src/sections/SampleReport.tsx` + `.css` | Sección 2 |
| Crear | `frontend/src/sections/Catalog.tsx` + `.css` | Sección 3 |
| Crear | `frontend/src/sections/HowItWorks.tsx` + `.css` | Sección 4 |
| Crear | `frontend/src/sections/Trust.tsx` + `.css` | Sección 5 |
| Crear | `frontend/src/sections/ContactSection.tsx` + `.css` | Sección 6 |
| Crear | `backend/database/migrations/XXXX_create_leads_table.php` | Schema leads |
| Crear | `backend/app/Models/Lead.php` | Modelo Lead |
| Crear | `backend/app/Http/Requests/StoreLeadRequest.php` | Validación form |
| Crear | `backend/app/Http/Controllers/LeadController.php` | Endpoint POST |
| Modificar | `backend/routes/api.php` | Ruta POST /leads |

---

## Task 0: Instalar dependencias npm + generar favicons

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/scripts/generate-favicons.mjs`
- Create: `frontend/public/logo.png`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png`

- [ ] **Step 1: Instalar fuentes y sharp**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npm install @fontsource/cormorant-garamond @fontsource-variable/dm-sans
npm install --save-dev sharp
```

Expected: paquetes en `node_modules/`.

- [ ] **Step 2: Crear script de favicons**

Crear `C:\Users\geova\Documents\Mezquit\frontend\scripts\generate-favicons.mjs`:

```js
import sharp from 'sharp'
import { mkdirSync } from 'fs'

const SRC = '../backend/img/mezquite.png'
const OUT = './public'

mkdirSync(OUT, { recursive: true })

// Copiar logo a public (para referencia en CSS/JS)
await sharp(SRC).toFile(`${OUT}/logo.png`)

// Favicons
await sharp(SRC).resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(`${OUT}/favicon-16.png`)
await sharp(SRC).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(`${OUT}/favicon-32.png`)
await sharp(SRC).resize(180, 180, { fit: 'contain', background: { r: 218, g: 215, b: 205, alpha: 1 } }).toFile(`${OUT}/apple-touch-icon.png`)

// OG image 1200×630 fondo timberwolf + logo centrado
const logoBuffer = await sharp(SRC).resize(380, 257, { fit: 'inside' }).toBuffer()
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: { r: 218, g: 215, b: 205, alpha: 1 } }
}).composite([{ input: logoBuffer, gravity: 'centre' }]).png().toFile(`${OUT}/og-image.png`)

console.log('Favicons generados en public/')
```

- [ ] **Step 3: Ejecutar script**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
node scripts/generate-favicons.mjs
```

Expected: `Favicons generados en public/` y archivos visibles en `frontend/public/`.

---

## Task 1: Crear docs/design-tokens.md

**Files:**
- Create: `C:\Users\geova\Documents\Mezquit\docs\design-tokens.md`

- [ ] **Step 1: Crear el archivo**

Crear `C:\Users\geova\Documents\Mezquit\docs\design-tokens.md`:

````markdown
# Mezquit — Tokens de color y reglas de uso

Contrastes calculados con WCAG 2.x. AA exige 4.5:1 texto normal, 3:1 texto grande y bordes funcionales.

```css
:root {
  --mezquit-sage:             #A3B18A; /* SOLO decorativo */
  --mezquit-timberwolf:       #DAD7CD; /* superficies secundarias */
  --mezquit-fern:             #567F55; /* hover acción primaria (4.60:1 con blanco) */
  --mezquit-hunter:           #3A5A40; /* acción primaria (7.7:1 con blanco) */
  --mezquit-brunswick:        #344E41; /* títulos (9.1:1 sobre blanco) */
  --mezquit-surface:          #FFFFFF;
  --mezquit-surface-secondary:#F7F6F4; /* entre blanco y timberwolf */
  --mezquit-ink:              #1E2B24; /* cuerpo (14.7:1 sobre blanco) */
  --mezquit-border:           #7E8C74; /* solo sobre blanco */
  --mezquit-accent:           #E0A526; /* polocote: solo relleno, texto ink encima */
  --mezquit-success:          #2E6B3F;
  --mezquit-error:            #B3261E;
  --mezquit-warning:          #B45309;
  --mezquit-info:             #2B5F8A;
  --disc-d: #B84A3E;
  --disc-i: #D9A33A;
  --disc-s: #588157;
  --disc-c: #3F6E96;
}
```

## Reglas obligatorias

- Sage: nunca como texto ni borde funcional.
- Accent: nunca como texto; como relleno usar ink encima.
- Hunter + brunswick: nunca para distinguir estados/categorías (contraste 1.17:1).
- Inputs: siempre sobre surface.
- Éxito/error: siempre ícono + texto, nunca solo color.
````

---

## Task 2: Config central + datos del catálogo

**Files:**
- Create: `frontend/src/config/site.ts`
- Create: `frontend/src/data/catalog.ts`

- [ ] **Step 1: Crear site.ts**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\config\site.ts`:

```ts
export const SITE = {
  name: 'Mezquit',
  domain: '[PENDIENTE: dominio]',
  email: '[PENDIENTE: correo de contacto]',
  calendarUrl: '[PENDIENTE: enlace de agenda]',
  tagline: 'Mide la raíz, no la corteza.',
  apiBase: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
} as const
```

- [ ] **Step 2: Crear catalog.ts**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\data\catalog.ts`:

```ts
export type CategoryId = 'personalidad' | 'razonamiento' | 'integridad' | 'intereses'

export interface Test {
  id: string
  name: string
  description: string
  durationMin: number
  category: CategoryId
}

export interface Category {
  id: CategoryId
  label: string
  tests: Test[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'personalidad',
    label: 'Personalidad',
    tests: [
      { id: 'p1', name: 'Perfil de conducta', description: 'Evalúa cuatro dimensiones de comportamiento en el trabajo.', durationMin: 15, category: 'personalidad' },
      { id: 'p2', name: 'Rasgos de personalidad', description: 'Mide estabilidad emocional, apertura y conciencia.', durationMin: 20, category: 'personalidad' },
      { id: 'p3', name: 'Estilos de trabajo', description: 'Identifica preferencias en ambientes colaborativos.', durationMin: 12, category: 'personalidad' },
      { id: 'p4', name: 'Orientación a resultados', description: 'Mide tendencia al logro y tolerancia a la presión.', durationMin: 10, category: 'personalidad' },
      { id: 'p5', name: 'Adaptabilidad', description: 'Evalúa flexibilidad ante cambios organizacionales.', durationMin: 10, category: 'personalidad' },
      { id: 'p6', name: 'Trabajo en equipo', description: 'Mide preferencias de colaboración y roles grupales.', durationMin: 12, category: 'personalidad' },
    ],
  },
  {
    id: 'razonamiento',
    label: 'Razonamiento',
    tests: [
      { id: 'r1', name: 'Razonamiento abstracto', description: 'Evalúa la capacidad de identificar patrones y relaciones.', durationMin: 25, category: 'razonamiento' },
      { id: 'r2', name: 'Razonamiento numérico', description: 'Mide habilidad para interpretar datos cuantitativos.', durationMin: 20, category: 'razonamiento' },
      { id: 'r3', name: 'Razonamiento verbal', description: 'Evalúa comprensión de texto y argumentación lógica.', durationMin: 20, category: 'razonamiento' },
      { id: 'r4', name: 'Atención y concentración', description: 'Mide la capacidad de mantener el foco en tareas repetitivas.', durationMin: 15, category: 'razonamiento' },
    ],
  },
  {
    id: 'integridad',
    label: 'Integridad',
    tests: [
      { id: 'i1', name: 'Honestidad laboral', description: 'Evalúa actitudes hacia normas y conducta en el trabajo.', durationMin: 15, category: 'integridad' },
      { id: 'i2', name: 'Confiabilidad', description: 'Mide consistencia y cumplimiento de compromisos.', durationMin: 12, category: 'integridad' },
      { id: 'i3', name: 'Ética en el trabajo', description: 'Evalúa toma de decisiones en situaciones de dilema.', durationMin: 18, category: 'integridad' },
    ],
  },
  {
    id: 'intereses',
    label: 'Intereses',
    tests: [
      { id: 'in1', name: 'Intereses vocacionales', description: 'Identifica áreas de motivación y afinidad profesional.', durationMin: 20, category: 'intereses' },
      { id: 'in2', name: 'Orientación de carrera', description: 'Mapea preferencias hacia áreas técnicas, sociales o gerenciales.', durationMin: 15, category: 'intereses' },
      { id: 'in3', name: 'Motivadores laborales', description: 'Evalúa qué factores impulsan el desempeño individual.', durationMin: 12, category: 'intereses' },
      { id: 'in4', name: 'Ajuste cultural', description: 'Compara los valores del candidato con los de la organización.', durationMin: 15, category: 'intereses' },
      { id: 'in5', name: 'Estilo de liderazgo', description: 'Mide preferencias de dirección y toma de decisiones.', durationMin: 18, category: 'intereses' },
    ],
  },
]

export function totalTests(): number {
  return CATEGORIES.reduce((acc, cat) => acc + cat.tests.length, 0)
}
```

---

## Task 3: CSS — tokens, tipografía y reset global

**Files:**
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/typography.css`
- Create: `frontend/src/styles/global.css`

- [ ] **Step 1: Crear tokens.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\styles\tokens.css`:

```css
:root {
  /* Marca */
  --color-sage:             #A3B18A;
  --color-timberwolf:       #DAD7CD;
  --color-fern:             #567F55;
  --color-hunter:           #3A5A40;
  --color-brunswick:        #344E41;
  --color-surface:          #FFFFFF;
  --color-surface-secondary:#F7F6F4;
  --color-ink:              #1E2B24;
  --color-border:           #7E8C74;
  --color-accent:           #E0A526;

  /* Semánticos */
  --color-success: #2E6B3F;
  --color-error:   #B3261E;
  --color-warning: #B45309;
  --color-info:    #2B5F8A;

  /* DISC */
  --disc-d: #B84A3E;
  --disc-i: #D9A33A;
  --disc-s: #588157;
  --disc-c: #3F6E96;

  /* Escala tipográfica fluida */
  --text-xs:   clamp(0.75rem,  0.7rem  + 0.25vw, 0.875rem);
  --text-sm:   clamp(0.875rem, 0.825rem + 0.25vw, 1rem);
  --text-base: clamp(1rem,     0.975rem + 0.125vw, 1.0625rem);
  --text-lg:   clamp(1.125rem, 1.05rem  + 0.375vw, 1.3125rem);
  --text-xl:   clamp(1.25rem,  1.15rem  + 0.5vw,   1.5rem);
  --text-2xl:  clamp(1.5rem,   1.3rem   + 1vw,     2rem);
  --text-3xl:  clamp(1.875rem, 1.55rem  + 1.625vw, 2.625rem);
  --text-4xl:  clamp(2.25rem,  1.75rem  + 2.5vw,   3.5rem);
  --text-hero: clamp(2.75rem,  1.5rem   + 6.25vw,  6rem);

  /* Espaciado */
  --sp-1:  0.25rem;
  --sp-2:  0.5rem;
  --sp-3:  0.75rem;
  --sp-4:  1rem;
  --sp-5:  1.25rem;
  --sp-6:  1.5rem;
  --sp-8:  2rem;
  --sp-10: 2.5rem;
  --sp-12: 3rem;
  --sp-16: 4rem;
  --sp-20: 5rem;
  --sp-24: 6rem;

  /* Layout */
  --max-width:   1200px;
  --section-px:  clamp(1rem, 5vw, 4rem);
  --section-py:  clamp(3rem, 8vw, 6rem);
  --header-h:    64px;

  /* Radio */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Transiciones */
  --t-fast: 150ms ease;
  --t-base: 250ms ease;
}
```

- [ ] **Step 2: Crear typography.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\styles\typography.css`:

```css
/* Cormorant Garamond — pesos usados: 400, 600, 700 */
@import '@fontsource/cormorant-garamond/400.css';
@import '@fontsource/cormorant-garamond/600.css';
@import '@fontsource/cormorant-garamond/700.css';
@import '@fontsource/cormorant-garamond/400-italic.css';
@import '@fontsource/cormorant-garamond/600-italic.css';

/* DM Sans — variable font (incluye todos los pesos) */
@import '@fontsource-variable/dm-sans';

/* Variables de fuente */
:root {
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body:    'DM Sans Variable', 'DM Sans', system-ui, sans-serif;
}
```

- [ ] **Step 3: Crear global.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\styles\global.css`:

```css
@import './tokens.css';
@import './typography.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-ink);
  background-color: var(--color-surface);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  padding-top: var(--header-h);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  color: var(--color-brunswick);
  line-height: 1.15;
  font-weight: 600;
}

img, svg { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
button { cursor: pointer; font-family: inherit; font-size: inherit; border: none; background: none; }

:focus-visible {
  outline: 2px solid var(--color-hunter);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.section-inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
}
```

---

## Task 4: Actualizar index.html y vite.config.ts

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Reemplazar index.html**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mezquit — Pruebas psicométricas para empresas</title>
    <meta name="description" content="Selecciona candidatos con pruebas estandarizadas. Reportes con interpretación en minutos." />

    <!-- Favicons -->
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Mezquit — Pruebas psicométricas para empresas" />
    <meta property="og:description" content="Selecciona candidatos con pruebas estandarizadas. Reportes con interpretación en minutos." />
    <meta property="og:image" content="/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Actualizar vite.config.ts**

```ts
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Actualizar main.tsx**

```tsx
import '@/styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## Task 5: Backend — endpoint POST /api/leads

**Files:**
- Create: `backend/database/migrations/XXXX_create_leads_table.php`
- Create: `backend/app/Models/Lead.php`
- Create: `backend/app/Http/Requests/StoreLeadRequest.php`
- Create: `backend/app/Http/Controllers/LeadController.php`
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Crear migration**

```bash
cd C:\Users\geova\Documents\Mezquit\backend
php artisan make:migration create_leads_table
```

Reemplazar el contenido del archivo generado:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company');
            $table->string('email');
            $table->enum('sector', ['comercio', 'manufactura', 'servicios', 'otro']);
            $table->enum('company_size', ['1-10', '11-50', '51-250', '250+']);
            $table->enum('evaluations_per_month', ['<10', '10-50', '50-200', '200+']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
```

Ejecutar:

```bash
php artisan migrate
```

Expected: `Migrated: XXXX_create_leads_table`.

- [ ] **Step 2: Crear modelo Lead**

Crear `backend/app/Models/Lead.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'company', 'email', 'sector', 'company_size', 'evaluations_per_month'])]
class Lead extends Model
{
    /** @use HasFactory<\Database\Factories\LeadFactory> */
    use HasFactory;
}
```

- [ ] **Step 3: Crear StoreLeadRequest**

```bash
php artisan make:request StoreLeadRequest
```

Reemplazar contenido:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'company' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'sector' => ['required', 'in:comercio,manufactura,servicios,otro'],
            'company_size' => ['required', 'in:1-10,11-50,51-250,250+'],
            'evaluations_per_month' => ['required', 'in:<10,10-50,50-200,200+'],
        ];
    }
}
```

- [ ] **Step 4: Crear LeadController**

```bash
php artisan make:controller LeadController
```

Reemplazar contenido:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeadRequest;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;

class LeadController extends Controller
{
    public function store(StoreLeadRequest $request): JsonResponse
    {
        Lead::create($request->validated());

        return response()->json(['message' => 'Tu solicitud fue recibida. Te contactamos en un día hábil.'], 201);
    }
}
```

- [ ] **Step 5: Registrar ruta**

Abrir `backend/routes/api.php` y agregar la ruta de leads:

```php
<?php

use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;

Route::apiResource('evaluations', EvaluationController::class);
Route::post('leads', [LeadController::class, 'store']);
```

- [ ] **Step 6: Verificar**

```bash
php artisan route:list --path=api
```

Expected: aparece `POST api/leads` junto a las rutas de evaluations.

- [ ] **Step 7: Commit backend**

```bash
cd C:\Users\geova\Documents\Mezquit\backend
git add database/migrations/ app/Models/Lead.php app/Http/Requests/StoreLeadRequest.php app/Http/Controllers/LeadController.php routes/api.php
git commit -m "feat: add Lead model and POST /api/leads endpoint"
```

---

## Task 6: Componente Button

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/Button.css`

- [ ] **Step 1: Crear Button.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\components\ui\Button.css`:

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-6);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--t-base), color var(--t-base), opacity var(--t-base);
  text-decoration: none;
  border: none;
}

.btn:disabled,
.btn--loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Variante primaria */
.btn--primary {
  background-color: var(--color-hunter);
  color: #ffffff;
}
.btn--primary:hover:not(:disabled) {
  background-color: var(--color-fern);
}

/* Variante ghost (sin relleno, solo borde) */
.btn--ghost {
  background-color: transparent;
  color: var(--color-hunter);
  border: 1.5px solid var(--color-hunter);
}
.btn--ghost:hover:not(:disabled) {
  background-color: var(--color-hunter);
  color: #ffffff;
}

/* Tamaño large */
.btn--lg {
  padding: var(--sp-4) var(--sp-8);
  font-size: var(--text-lg);
}
```

- [ ] **Step 2: Crear Button.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\components\ui\Button.tsx`:

```tsx
import './Button.css'

interface ButtonProps {
  variant?: 'primary' | 'ghost'
  size?: 'md' | 'lg'
  href?: string
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

---

## Task 7: Componente GrainTexture (SVG veta de mezquite)

**Files:**
- Create: `frontend/src/components/ui/GrainTexture.tsx`
- Create: `frontend/src/components/ui/GrainTexture.css`

- [ ] **Step 1: Crear GrainTexture.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\components\ui\GrainTexture.css`:

```css
.grain {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.grain__path {
  fill: none;
  stroke: var(--color-sage);
  stroke-width: 1.5;
  stroke-linecap: round;
}

.grain__path--animate {
  stroke-dasharray: 870;
  stroke-dashoffset: 870;
  animation: drawGrain 1.2s ease forwards;
}

.grain__path--delay-1 { animation-delay: 0.12s; }
.grain__path--delay-2 { animation-delay: 0.24s; }
.grain__path--delay-3 { animation-delay: 0.36s; }
.grain__path--delay-4 { animation-delay: 0.48s; }
.grain__path--delay-5 { animation-delay: 0.60s; }

@keyframes drawGrain {
  to { stroke-dashoffset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .grain__path--animate {
    stroke-dashoffset: 0;
    animation: none;
  }
}

/* Variante separadora — muy tenue */
.grain--divider .grain__path {
  stroke: var(--color-sage);
  stroke-width: 1;
  opacity: 0.35;
}
```

- [ ] **Step 2: Crear GrainTexture.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\components\ui\GrainTexture.tsx`:

```tsx
import './GrainTexture.css'

const PATHS = [
  'M -10 90  C 110 68  260 112 430 88  C 590 66  700 104 870 82',
  'M -10 200 C 100 178 250 220 420 196 C 580 174 700 212 870 190',
  'M -10 320 C 130 295 280 345 460 318 C 620 294 730 335 870 310',
  'M -10 445 C 105 420 255 464 435 438 C 605 414 715 455 870 430',
  'M -10 568 C 120 544 265 590 445 562 C 615 537 720 578 870 552',
  'M -10 675 C 135 652 285 695 465 668 C 635 643 740 684 870 658',
]

interface GrainTextureProps {
  className?: string
  divider?: boolean
  animated?: boolean
}

export default function GrainTexture({
  className = '',
  divider = false,
  animated = true,
}: GrainTextureProps) {
  const svgClass = [
    'grain',
    divider ? 'grain--divider' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <svg
      className={svgClass}
      viewBox="0 0 860 760"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          className={[
            'grain__path',
            animated ? 'grain__path--animate' : '',
            i > 0 ? `grain__path--delay-${i}` : '',
          ].filter(Boolean).join(' ')}
        />
      ))}
    </svg>
  )
}
```

---

## Task 8: Header

**Files:**
- Create: `frontend/src/components/layout/Header.tsx`
- Create: `frontend/src/components/layout/Header.css`

- [ ] **Step 1: Crear Header.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\components\layout\Header.css`:

```css
.header {
  position: fixed;
  top: 0;
  inset-inline: 0;
  height: var(--header-h);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-timberwolf);
  z-index: 100;
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  gap: var(--sp-8);
}

/* Logo */
.header__logo-link {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  flex-shrink: 0;
}
.header__logo-img {
  height: 36px;
  width: auto;
}
.header__logo-name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-brunswick);
  line-height: 1;
}

/* Nav */
.header__nav {
  display: none;
  align-items: center;
  gap: var(--sp-8);
}

@media (min-width: 768px) {
  .header__nav { display: flex; }
}

/* Nav link con hover slide */
.header__nav-link {
  position: relative;
  display: inline-block;
  overflow: hidden;
  height: 1.3em;
  line-height: 1.3;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-ink);
}
.header__nav-text,
.header__nav-text--hover {
  display: block;
  transition: transform var(--t-base);
}
.header__nav-text--hover {
  position: absolute;
  top: 100%;
  left: 0;
  color: var(--color-hunter);
}
.header__nav-link:hover .header__nav-text,
.header__nav-link:hover .header__nav-text--hover {
  transform: translateY(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .header__nav-text,
  .header__nav-text--hover { transition: none; }
  .header__nav-text--hover { display: none; }
}

/* CTA agenda */
.header__cta {
  flex-shrink: 0;
}
```

- [ ] **Step 2: Crear Header.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\components\layout\Header.tsx`:

```tsx
import { SITE } from '@/config/site'
import Button from '@/components/ui/Button'
import './Header.css'

const NAV_LINKS = [
  { href: '#catalogo', label: 'Catálogo' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#contacto', label: 'Contacto' },
]

export default function Header() {
  return (
    <header className="header" role="banner">
      <div className="header__inner">
        <a href="#inicio" className="header__logo-link" aria-label={`${SITE.name} — inicio`}>
          <img
            src="/logo.png"
            alt={SITE.name}
            className="header__logo-img"
            width={53}
            height={36}
          />
          <span className="header__logo-name" aria-hidden="true">{SITE.name}</span>
        </a>

        <nav className="header__nav" aria-label="Navegación principal">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="header__nav-link">
              <span className="header__nav-text" aria-hidden="true">{label}</span>
              <span className="header__nav-text--hover" aria-hidden="true">{label}</span>
              <span className="sr-only">{label}</span>
            </a>
          ))}
        </nav>

        <div className="header__cta">
          {SITE.calendarUrl !== '[PENDIENTE: enlace de agenda]' ? (
            <Button href={SITE.calendarUrl} size="md">Agenda una demo</Button>
          ) : (
            <Button href="#contacto" size="md">Agenda una demo</Button>
          )}
        </div>
      </div>
    </header>
  )
}
```

---

## Task 9: Footer

**Files:**
- Create: `frontend/src/components/layout/Footer.tsx`
- Create: `frontend/src/components/layout/Footer.css`

- [ ] **Step 1: Crear Footer.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\components\layout\Footer.css`:

```css
.footer {
  background-color: var(--color-brunswick);
  color: #ffffff;
  padding-block: var(--sp-12);
}

.footer__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
}

@media (min-width: 768px) {
  .footer__inner {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}

.footer__brand {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.footer__logo {
  height: 32px;
  width: auto;
  filter: brightness(0) invert(1);
  opacity: 0.8;
}
.footer__name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: #ffffff;
}

.footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4) var(--sp-6);
  list-style: none;
}
.footer__link {
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.75);
  transition: color var(--t-fast);
}
.footer__link:hover { color: #ffffff; }

.footer__legal {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}
```

- [ ] **Step 2: Crear Footer.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\components\layout\Footer.tsx`:

```tsx
import { SITE } from '@/config/site'
import './Footer.css'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <img src="/logo.png" alt={SITE.name} className="footer__logo" width={47} height={32} />
          <span className="footer__name">{SITE.name}</span>
        </div>

        <ul className="footer__links">
          <li><a href="#" className="footer__link">Aviso de privacidad</a></li>
          <li><a href="#" className="footer__link">Términos y condiciones</a></li>
          <li><a href={`mailto:${SITE.email}`} className="footer__link">Contacto</a></li>
        </ul>

        <p className="footer__legal">
          © {YEAR} [PENDIENTE: razón social del titular]<br />
          {SITE.email}
        </p>
      </div>
    </footer>
  )
}
```

---

## Task 10: Sección Hero

**Files:**
- Create: `frontend/src/sections/Hero.tsx`
- Create: `frontend/src/sections/Hero.css`

- [ ] **Step 1: Crear Hero.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Hero.css`:

```css
.hero {
  position: relative;
  min-height: calc(100svh - var(--header-h));
  display: grid;
  align-content: center;
  padding-block: var(--section-py);
  overflow: hidden;
}

.hero__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-12);
  align-items: center;
}

@media (min-width: 1024px) {
  .hero__inner {
    grid-template-columns: 1fr 1fr;
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
  max-width: 560px;
}

.hero__title {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 700;
  color: var(--color-brunswick);
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4);
  align-items: center;
}

.hero__link-secondary {
  font-size: var(--text-base);
  color: var(--color-hunter);
  font-weight: 500;
  border-bottom: 1px solid currentColor;
  padding-bottom: 1px;
  transition: opacity var(--t-fast);
}
.hero__link-secondary:hover { opacity: 0.75; }

.hero__texture {
  width: 100%;
  max-width: 480px;
  aspect-ratio: 860 / 760;
  justify-self: center;
}

@media (min-width: 1024px) {
  .hero__texture { justify-self: end; }
}
```

- [ ] **Step 2: Crear Hero.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Hero.tsx`:

```tsx
import { SITE } from '@/config/site'
import Button from '@/components/ui/Button'
import GrainTexture from '@/components/ui/GrainTexture'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero" id="inicio" aria-labelledby="hero-title">
      <div className="hero__inner">
        <div className="hero__content">
          <h1 className="hero__title" id="hero-title">
            {SITE.tagline}
          </h1>
          <div className="hero__actions">
            <Button
              href={SITE.calendarUrl !== '[PENDIENTE: enlace de agenda]' ? SITE.calendarUrl : '#contacto'}
              size="lg"
            >
              Agenda una demo
            </Button>
            <a href="#catalogo" className="hero__link-secondary">
              Ver catálogo ↓
            </a>
          </div>
        </div>

        <div className="hero__texture" aria-hidden="true">
          <GrainTexture animated />
        </div>
      </div>
    </section>
  )
}
```

---

## Task 11: Sección Reporte de Ejemplo

**Files:**
- Create: `frontend/src/sections/SampleReport.tsx`
- Create: `frontend/src/sections/SampleReport.css`

- [ ] **Step 1: Crear SampleReport.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\SampleReport.css`:

```css
.sample-report {
  background-color: var(--color-timberwolf);
  padding-block: var(--section-py);
}

.sample-report__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
}

.sample-report__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sp-4);
}

.sample-report__title {
  font-size: var(--text-3xl);
}

.sample-report__badge {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-ink);
  background-color: var(--color-surface-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--sp-1) var(--sp-3);
}

/* Tarjeta del reporte */
.report-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.report-card__header {
  background-color: var(--color-brunswick);
  color: #ffffff;
  padding: var(--sp-6) var(--sp-8);
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4);
  justify-content: space-between;
  align-items: flex-end;
}

.report-card__candidate-name {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: #ffffff;
}
.report-card__candidate-meta {
  font-size: var(--text-sm);
  opacity: 0.75;
  margin-top: var(--sp-1);
}

.report-card__body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1px;
  background-color: var(--color-timberwolf);
}

@media (min-width: 768px) {
  .report-card__body { grid-template-columns: 1fr 1fr; }
}

/* Módulo DISC */
.report-module {
  background-color: var(--color-surface);
  padding: var(--sp-6) var(--sp-8);
}

.report-module__title {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-brunswick);
  margin-bottom: var(--sp-5);
}

.disc-bars {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.disc-bar {
  display: grid;
  grid-template-columns: 1.5rem 1fr 3rem;
  gap: var(--sp-3);
  align-items: center;
}

.disc-bar__label {
  font-size: var(--text-sm);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.disc-bar__track {
  height: 6px;
  background-color: var(--color-timberwolf);
  border-radius: 99px;
  overflow: hidden;
}

.disc-bar__fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s ease;
}

.disc-bar__score {
  font-size: var(--text-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--color-ink);
}

/* Módulo razonamiento */
.reasoning-score {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.score-metric {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.score-metric__label {
  font-size: var(--text-sm);
  color: var(--color-ink);
  opacity: 0.7;
}

.score-metric__value {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-brunswick);
  font-variant-numeric: tabular-nums;
}

.score-metric__bracket {
  font-size: var(--text-lg);
  font-weight: 400;
  opacity: 0.5;
}

.score-bar {
  height: 8px;
  background-color: var(--color-timberwolf);
  border-radius: 99px;
  overflow: hidden;
}

.score-bar__fill {
  height: 100%;
  background-color: var(--color-hunter);
  border-radius: 99px;
}
```

- [ ] **Step 2: Crear SampleReport.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\SampleReport.tsx`:

```tsx
import './SampleReport.css'

const DISC = [
  { factor: 'D', score: 65, color: 'var(--disc-d)', label: 'Dominancia' },
  { factor: 'I', score: 78, color: 'var(--disc-i)', label: 'Influencia' },
  { factor: 'S', score: 42, color: 'var(--disc-s)', label: 'Estabilidad' },
  { factor: 'C', score: 61, color: 'var(--disc-c)', label: 'Cumplimiento' },
] as const

export default function SampleReport() {
  return (
    <section className="sample-report" aria-labelledby="sample-title">
      <div className="sample-report__inner">
        <div className="sample-report__heading">
          <h2 className="sample-report__title" id="sample-title">
            Este es el reporte que recibes
          </h2>
          <span className="sample-report__badge" aria-label="Datos ficticios de ejemplo">
            Ejemplo
          </span>
        </div>

        <div className="report-card" role="img" aria-label="Reporte de ejemplo con datos ficticios">
          <div className="report-card__header">
            <div>
              <p className="report-card__candidate-name">Ejemplo · Candidato</p>
              <p className="report-card__candidate-meta">Ejecutivo de Ventas · Sep 2026</p>
            </div>
          </div>

          <div className="report-card__body">
            {/* Módulo DISC */}
            <div className="report-module">
              <p className="report-module__title">Perfil de conducta</p>
              <div className="disc-bars">
                {DISC.map(({ factor, score, color, label }) => (
                  <div key={factor} className="disc-bar">
                    <span
                      className="disc-bar__label"
                      style={{ color }}
                      aria-label={label}
                    >
                      {factor}
                    </span>
                    <div className="disc-bar__track" role="presentation">
                      <div
                        className="disc-bar__fill"
                        style={{ width: `${score}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="disc-bar__score" aria-label={`Puntaje ${score}`}>
                      [ {score} ]
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Módulo razonamiento */}
            <div className="report-module">
              <p className="report-module__title">Razonamiento</p>
              <div className="reasoning-score">
                <div className="score-metric">
                  <span className="score-metric__label">Puntaje directo</span>
                  <span className="score-metric__value">
                    <span className="score-metric__bracket">[ </span>
                    68
                    <span className="score-metric__bracket"> ]</span>
                  </span>
                  <div className="score-bar">
                    <div className="score-bar__fill" style={{ width: '68%' }} />
                  </div>
                </div>
                <div className="score-metric">
                  <span className="score-metric__label">Percentil normativo</span>
                  <span className="score-metric__value">
                    <span className="score-metric__bracket">[ </span>
                    72°
                    <span className="score-metric__bracket"> ]</span>
                  </span>
                  <div className="score-bar">
                    <div className="score-bar__fill" style={{ width: '72%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

---

## Task 12: Sección Catálogo

**Files:**
- Create: `frontend/src/sections/Catalog.tsx`
- Create: `frontend/src/sections/Catalog.css`

- [ ] **Step 1: Crear Catalog.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Catalog.css`:

```css
.catalog {
  padding-block: var(--section-py);
}

.catalog__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-10);
}

.catalog__title { font-size: var(--text-4xl); }

.catalog__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.catalog__filter-btn {
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
.catalog__filter-btn:hover,
.catalog__filter-btn[aria-pressed='true'] {
  background-color: var(--color-hunter);
  border-color: var(--color-hunter);
  color: #ffffff;
}

.catalog__list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background-color: var(--color-timberwolf);
  border: 1px solid var(--color-timberwolf);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.catalog-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--sp-4);
  align-items: center;
  background-color: var(--color-surface);
  padding: var(--sp-5) var(--sp-6);
  transition: background-color var(--t-fast);
}
.catalog-row:hover { background-color: var(--color-surface-secondary); }

.catalog-row__name {
  font-size: var(--text-lg);
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-brunswick);
}
.catalog-row__desc {
  font-size: var(--text-sm);
  color: var(--color-ink);
  opacity: 0.7;
  margin-top: var(--sp-1);
}

.catalog-row__count {
  font-size: var(--text-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-hunter);
  white-space: nowrap;
}
```

- [ ] **Step 2: Crear Catalog.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Catalog.tsx`:

```tsx
import { useState } from 'react'
import { CATEGORIES, type CategoryId } from '@/data/catalog'
import './Catalog.css'

const ALL_FILTER = 'todas' as const
type FilterValue = CategoryId | typeof ALL_FILTER

export default function Catalog() {
  const [active, setActive] = useState<FilterValue>(ALL_FILTER)

  const visible = active === ALL_FILTER
    ? CATEGORIES
    : CATEGORIES.filter(c => c.id === active)

  return (
    <section className="catalog" id="catalogo" aria-labelledby="catalog-title">
      <div className="catalog__inner">
        <h2 className="catalog__title" id="catalog-title">Pruebas disponibles</h2>

        <div className="catalog__filters" role="group" aria-label="Filtrar por categoría">
          <button
            className="catalog__filter-btn"
            aria-pressed={active === ALL_FILTER}
            onClick={() => setActive(ALL_FILTER)}
          >
            Todas
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className="catalog__filter-btn"
              aria-pressed={active === cat.id}
              onClick={() => setActive(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="catalog__list">
          {visible.map(cat => (
            <div key={cat.id} className="catalog-row">
              <div>
                <p className="catalog-row__name">{cat.label}</p>
                <p className="catalog-row__desc">
                  {cat.tests.map(t => t.name).join(' · ')}
                </p>
              </div>
              <span className="catalog-row__count" aria-label={`${cat.tests.length} pruebas`}>
                [ {cat.tests.length} pruebas ]
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## Task 13: Sección Cómo Funciona

**Files:**
- Create: `frontend/src/sections/HowItWorks.tsx`
- Create: `frontend/src/sections/HowItWorks.css`

- [ ] **Step 1: Crear HowItWorks.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\HowItWorks.css`:

```css
.how-it-works {
  background-color: var(--color-surface-secondary);
  padding-block: var(--section-py);
}

.how-it-works__inner {
  max-width: 720px;
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-12);
}

.how-it-works__title { font-size: var(--text-4xl); }

.steps {
  display: flex;
  flex-direction: column;
  position: relative;
}

.steps::before {
  content: '';
  position: absolute;
  left: 1.25rem;
  top: 2.5rem;
  bottom: 2.5rem;
  width: 1px;
  background-color: var(--color-timberwolf);
}

.step {
  display: grid;
  grid-template-columns: 2.5rem 1fr;
  gap: var(--sp-6);
  padding-block: var(--sp-6);
  align-items: flex-start;
}

.step__number {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--color-hunter);
  color: #ffffff;
  font-size: var(--text-sm);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.step__content { padding-top: 0.4rem; }

.step__title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-brunswick);
  line-height: 1.2;
}

.step__desc {
  font-size: var(--text-base);
  color: var(--color-ink);
  margin-top: var(--sp-2);
  opacity: 0.8;
}
```

- [ ] **Step 2: Crear HowItWorks.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\HowItWorks.tsx`:

```tsx
import './HowItWorks.css'

const STEPS = [
  {
    title: 'Elige las pruebas',
    desc: 'Selecciona las pruebas adecuadas para el puesto desde el catálogo.',
  },
  {
    title: 'Envía el enlace al candidato',
    desc: 'El sistema genera un enlace único. Lo envías por correo o WhatsApp.',
  },
  {
    title: 'El candidato responde desde su celular',
    desc: 'Interfaz ligera, optimizada para móvil. Sin descargas ni registro previo.',
  },
  {
    title: 'Recibes el reporte',
    desc: 'Resultados con interpretación listos en minutos, en tu correo y en el panel.',
  },
] as const

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="como-funciona" aria-labelledby="how-title">
      <div className="how-it-works__inner">
        <h2 className="how-it-works__title" id="how-title">Cómo funciona</h2>

        <ol className="steps" aria-label="Pasos del proceso">
          {STEPS.map((step, i) => (
            <li key={i} className="step">
              <span className="step__number" aria-hidden="true">{i + 1}</span>
              <div className="step__content">
                <h3 className="step__title">{step.title}</h3>
                <p className="step__desc">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
```

---

## Task 14: Sección Confianza

**Files:**
- Create: `frontend/src/sections/Trust.tsx`
- Create: `frontend/src/sections/Trust.css`

- [ ] **Step 1: Crear Trust.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Trust.css`:

```css
.trust {
  padding-block: var(--section-py);
}

.trust__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-10);
}

.trust__title { font-size: var(--text-4xl); }

.trust__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-4);
}

@media (min-width: 768px) {
  .trust__grid { grid-template-columns: 1fr 1fr; }
}

@media (min-width: 1024px) {
  .trust__grid { grid-template-columns: repeat(3, 1fr); }
}

.trust-card {
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius-md);
  padding: var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.trust-card__statement {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-brunswick);
  line-height: 1.25;
}

.trust-card__detail {
  font-size: var(--text-sm);
  color: var(--color-ink);
  opacity: 0.75;
  line-height: 1.5;
}
```

- [ ] **Step 2: Crear Trust.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\Trust.tsx`:

```tsx
import './Trust.css'

const CLAIMS = [
  {
    statement: 'Pruebas estandarizadas',
    detail: 'Instrumentos con normas de calificación definidas, aplicados en condiciones idénticas para todos los candidatos.',
  },
  {
    statement: 'Reportes con interpretación',
    detail: 'Cada reporte incluye el contexto para leer los resultados, sin requerir formación en psicometría.',
  },
  {
    statement: 'Resultados en minutos',
    detail: 'El reporte está disponible en cuanto el candidato termina la evaluación.',
  },
  {
    statement: '[PENDIENTE: afirmación verificable #1]',
    detail: '[PENDIENTE: descripción de la afirmación]',
  },
  {
    statement: '[PENDIENTE: afirmación verificable #2]',
    detail: '[PENDIENTE: descripción de la afirmación]',
  },
] as const

export default function Trust() {
  return (
    <section className="trust" aria-labelledby="trust-title">
      <div className="trust__inner">
        <h2 className="trust__title" id="trust-title">Por qué Mezquit</h2>
        <div className="trust__grid">
          {CLAIMS.map((claim, i) => (
            <div key={i} className="trust-card">
              <p className="trust-card__statement">{claim.statement}</p>
              <p className="trust-card__detail">{claim.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## Task 15: Sección Contacto

**Files:**
- Create: `frontend/src/sections/ContactSection.tsx`
- Create: `frontend/src/sections/ContactSection.css`

- [ ] **Step 1: Crear ContactSection.css**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\ContactSection.css`:

```css
.contact {
  background-color: var(--color-timberwolf);
  padding-block: var(--section-py);
}

.contact__inner {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--section-px);
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-12);
}

@media (min-width: 1024px) {
  .contact__inner { grid-template-columns: 1fr 1fr; }
}

/* Formulario */
.contact__form-side { display: flex; flex-direction: column; gap: var(--sp-8); }
.contact__title { font-size: var(--text-4xl); }

.contact-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-brunswick);
}

.form-input,
.form-select {
  width: 100%;
  padding: var(--sp-3) var(--sp-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-ink);
  transition: border-color var(--t-fast);
  appearance: none;
}

.form-input:focus,
.form-select:focus { border-color: var(--color-hunter); outline: none; }

.form-input.form-input--error,
.form-select.form-input--error { border-color: var(--color-error); }

.form-error {
  font-size: var(--text-xs);
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}

.contact__reply-note {
  font-size: var(--text-sm);
  color: var(--color-ink);
  opacity: 0.7;
}

/* Estado de éxito */
.contact__success {
  padding: var(--sp-8);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-success);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.contact__success-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--color-brunswick);
}

/* Lado agenda */
.contact__agenda-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--sp-6);
}

.contact__agenda-title {
  font-size: var(--text-3xl);
}

.contact__agenda-desc {
  font-size: var(--text-base);
  color: var(--color-ink);
  opacity: 0.8;
}
```

- [ ] **Step 2: Crear ContactSection.tsx**

Crear `C:\Users\geova\Documents\Mezquit\frontend\src\sections\ContactSection.tsx`:

```tsx
import { useState, type FormEvent, type ChangeEvent } from 'react'
import { SITE } from '@/config/site'
import Button from '@/components/ui/Button'
import api from '@/api/axios'
import './ContactSection.css'

interface FormState {
  name: string
  company: string
  email: string
  sector: string
  company_size: string
  evaluations_per_month: string
}

const EMPTY: FormState = {
  name: '',
  company: '',
  email: '',
  sector: '',
  company_size: '',
  evaluations_per_month: '',
}

export default function ContactSection() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await api.post('/api/leads', form)
      setSent(true)
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } }).response?.status === 422
      ) {
        const apiErrors = (err as { response: { data: { errors: Record<string, string[]> } } }).response.data.errors
        const mapped: Partial<Record<keyof FormState, string>> = {}
        for (const key in apiErrors) {
          mapped[key as keyof FormState] = apiErrors[key][0]
        }
        setErrors(mapped)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="contact" id="contacto" aria-labelledby="contact-title">
      <div className="contact__inner">
        {/* Formulario */}
        <div className="contact__form-side">
          <h2 className="contact__title" id="contact-title">¿Listo para medir?</h2>

          {sent ? (
            <div className="contact__success" role="status">
              <p className="contact__success-title">¡Gracias!</p>
              <p>Tu solicitud fue recibida. Te contactamos en un día hábil.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              {(
                [
                  { name: 'name', label: 'Nombre', type: 'text', placeholder: 'Tu nombre' },
                  { name: 'company', label: 'Empresa', type: 'text', placeholder: 'Nombre de la empresa' },
                  { name: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'tu@empresa.com' },
                ] as const
              ).map(({ name, label, type, placeholder }) => (
                <div key={name} className="form-field">
                  <label className="form-label" htmlFor={name}>{label}</label>
                  <input
                    id={name}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange}
                    className={`form-input${errors[name] ? ' form-input--error' : ''}`}
                    aria-invalid={!!errors[name]}
                    aria-describedby={errors[name] ? `${name}-error` : undefined}
                    required
                  />
                  {errors[name] && (
                    <span id={`${name}-error`} className="form-error" role="alert">
                      <span aria-hidden="true">⚠</span> {errors[name]}
                    </span>
                  )}
                </div>
              ))}

              <div className="form-field">
                <label className="form-label" htmlFor="sector">Sector</label>
                <select
                  id="sector"
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className={`form-select${errors.sector ? ' form-input--error' : ''}`}
                  aria-invalid={!!errors.sector}
                  required
                >
                  <option value="">Selecciona…</option>
                  <option value="comercio">Comercio</option>
                  <option value="manufactura">Manufactura o maquila</option>
                  <option value="servicios">Servicios</option>
                  <option value="otro">Otro</option>
                </select>
                {errors.sector && (
                  <span id="sector-error" className="form-error" role="alert">
                    <span aria-hidden="true">⚠</span> {errors.sector}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="company_size">Tamaño de empresa</label>
                <select
                  id="company_size"
                  name="company_size"
                  value={form.company_size}
                  onChange={handleChange}
                  className={`form-select${errors.company_size ? ' form-input--error' : ''}`}
                  aria-invalid={!!errors.company_size}
                  required
                >
                  <option value="">Selecciona…</option>
                  <option value="1-10">1 – 10 personas</option>
                  <option value="11-50">11 – 50 personas</option>
                  <option value="51-250">51 – 250 personas</option>
                  <option value="250+">Más de 250</option>
                </select>
                {errors.company_size && (
                  <span className="form-error" role="alert">
                    <span aria-hidden="true">⚠</span> {errors.company_size}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="evaluations_per_month">Evaluaciones al mes</label>
                <select
                  id="evaluations_per_month"
                  name="evaluations_per_month"
                  value={form.evaluations_per_month}
                  onChange={handleChange}
                  className={`form-select${errors.evaluations_per_month ? ' form-input--error' : ''}`}
                  aria-invalid={!!errors.evaluations_per_month}
                  required
                >
                  <option value="">Selecciona…</option>
                  <option value="<10">Menos de 10</option>
                  <option value="10-50">10 – 50</option>
                  <option value="50-200">50 – 200</option>
                  <option value="200+">Más de 200</option>
                </select>
                {errors.evaluations_per_month && (
                  <span className="form-error" role="alert">
                    <span aria-hidden="true">⚠</span> {errors.evaluations_per_month}
                  </span>
                )}
              </div>

              <Button type="submit" loading={loading}>
                Solicitar información
              </Button>
            </form>
          )}

          <p className="contact__reply-note">Te respondemos en un día hábil.</p>
        </div>

        {/* Agenda */}
        <div className="contact__agenda-side">
          <h3 className="contact__agenda-title">Agenda una demo de 30 minutos</h3>
          <p className="contact__agenda-desc">
            Muéstrame el sistema en acción y resuelve tus dudas antes de decidir.
          </p>
          {SITE.calendarUrl !== '[PENDIENTE: enlace de agenda]' ? (
            <Button href={SITE.calendarUrl} variant="ghost" size="lg">
              Reservar tiempo →
            </Button>
          ) : (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)', opacity: 0.6 }}>
              [PENDIENTE: enlace de agenda]
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
```

---

## Task 16: Ensamblar App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Reemplazar App.tsx**

```tsx
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/sections/Hero'
import SampleReport from '@/sections/SampleReport'
import Catalog from '@/sections/Catalog'
import HowItWorks from '@/sections/HowItWorks'
import Trust from '@/sections/Trust'
import ContactSection from '@/sections/ContactSection'

export default function App() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <SampleReport />
        <Catalog />
        <HowItWorks />
        <Trust />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Verificar que el dev server compila sin errores**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npm run dev
```

Expected: sin errores en consola, página visible en `http://localhost:5174`.

- [ ] **Step 3: Commit frontend**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
git add src/ public/ index.html vite.config.ts scripts/
git commit -m "feat: add Mezquit sales site — hero, report, catalog, form"
```

---

## Task 17: Verificación y screenshots

- [ ] **Step 1: Tomar screenshot móvil (375px)**

```bash
npx playwright screenshot --browser chromium --viewport-size "375,812" "http://localhost:5174" "C:/Users/geova/AppData/Local/Temp/mezquit-375.png"
```

- [ ] **Step 2: Tomar screenshot desktop (1440px)**

```bash
npx playwright screenshot --browser chromium --viewport-size "1440,900" "http://localhost:5174" "C:/Users/geova/AppData/Local/Temp/mezquit-1440.png"
```

- [ ] **Step 3: Revisar y reportar issues**

Leer ambas capturas e identificar:
- Texto ilegible o con contraste insuficiente
- Elementos cortados o desbordados en móvil
- Secciones sin espaciado correcto
- Textura SVG no visible o mal posicionada
- El logo aparece en header y footer

Reportar todos los issues encontrados al coordinador antes de continuar.

---

## Lista de [PENDIENTE] generada por este plan

1. `SITE.domain` — dominio del sitio
2. `SITE.email` — correo de contacto
3. `SITE.calendarUrl` — enlace de agenda (Calendly, Cal.com, etc.)
4. `footer__legal` — razón social del titular
5. `trust` — afirmación verificable #1 y su descripción
6. `trust` — afirmación verificable #2 y su descripción
7. Enlace `/` en `footer__link` Aviso de privacidad — página por crear
8. Enlace `/` en `footer__link` Términos y condiciones — página por crear
