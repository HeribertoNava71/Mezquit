# Mez — Fase 3: Sitio de ventas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestructurar el sitio de ventas a la IA del documento Mettl, con el catálogo real desde la BD y el componente `Report` compartido.

**Architecture:** Backend Laravel expone un catálogo público read-only (`GET /api/catalog`, `/api/catalog/{slug}`) desde la tabla `tests` sembrada con las pruebas de marketing. El frontend React Router adopta la IA Mettl: 9 páginas nuevas, catálogo desde API, menú móvil, y elimina `/test`, `/psicometria`, `/nosotros`.

**Tech Stack:** Laravel 13, PHP 8.4, PHPUnit, React 19, TypeScript, React Router v7, Axios, CSS vanilla.

**Spec:** `docs/superpowers/specs/2026-09-11-fase3-sitio-ventas-design.md`

**Convenciones:** `#[Fillable]` en modelos, migraciones de clase anónima, tests con `RefreshDatabase`. Nombre = **Mez** (`SITE.name`). Corchetes `[ ]` solo para cantidades. Sin librerías nuevas.

---

## Mapa de archivos

**Backend — crear:** `database/seeders/CatalogSeeder.php`, `app/Http/Controllers/CatalogController.php`, `tests/Feature/CatalogTest.php`. **Modificar:** `database/seeders/DatabaseSeeder.php`, `routes/api.php`.

**Frontend — crear:** `src/api/catalog.ts`, `src/data/plans.ts`, `src/pages/PruebasPage.tsx`+css, `src/pages/PruebaDetallePage.tsx`+css, `src/pages/ComoFuncionaPage.tsx`, `src/pages/PreciosPage.tsx`+css, `src/pages/DemoPage.tsx`, `src/pages/AyudaPage.tsx`+css, `src/pages/AvisoPrivacidadPage.tsx`, `src/pages/TerminosPage.tsx`, `src/pages/candidate/EvaluarLanding.tsx`+css, `src/pages/legal/LegalPage.tsx`+css`.

**Frontend — modificar:** `src/components/layout/Header.tsx`+css (nav + menú móvil), `src/components/layout/Footer.tsx`, `src/pages/HomePage.tsx`, `src/App.tsx`.

**Frontend — eliminar:** `src/pages/TestPage.tsx`, `PsicometriaPage.tsx`, `NosotrosPage.tsx`, `src/sections/CompanyInfo.*`, `Testimonials.*`, `PackagesSection.*`, `TestInventory.*`, `Catalog.*`, `src/data/catalog.ts`, `packages.ts`, `company.ts`.

---

## Task 1: Backend — CatalogSeeder

**Files:**
- Create: `backend/database/seeders/CatalogSeeder.php`
- Modify: `backend/database/seeders/DatabaseSeeder.php`

- [ ] **Step 1: Crear CatalogSeeder**

Crear `backend/database/seeders/CatalogSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Test;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            'personalidad' => [
                ['Perfil de conducta', 'Evalúa cuatro dimensiones de comportamiento en el trabajo.', 15, 24],
                ['Rasgos de personalidad', 'Mide estabilidad emocional, apertura y conciencia.', 20, 40],
                ['Estilos de trabajo', 'Identifica preferencias en ambientes colaborativos.', 12, 20],
                ['Orientación a resultados', 'Mide tendencia al logro y tolerancia a la presión.', 10, 18],
                ['Adaptabilidad', 'Evalúa flexibilidad ante cambios organizacionales.', 10, 18],
                ['Trabajo en equipo', 'Mide preferencias de colaboración y roles grupales.', 12, 20],
            ],
            'razonamiento' => [
                ['Razonamiento abstracto', 'Evalúa la capacidad de identificar patrones y relaciones.', 25, 30],
                ['Razonamiento numérico', 'Mide habilidad para interpretar datos cuantitativos.', 20, 25],
                ['Razonamiento verbal', 'Evalúa comprensión de texto y argumentación lógica.', 20, 25],
                ['Atención y concentración', 'Mide la capacidad de mantener el foco en tareas repetitivas.', 15, 40],
            ],
            'integridad' => [
                ['Honestidad laboral', 'Evalúa actitudes hacia normas y conducta en el trabajo.', 15, 30],
                ['Confiabilidad', 'Mide consistencia y cumplimiento de compromisos.', 12, 24],
                ['Ética en el trabajo', 'Evalúa toma de decisiones en situaciones de dilema.', 18, 20],
            ],
            'intereses' => [
                ['Intereses vocacionales', 'Identifica áreas de motivación y afinidad profesional.', 20, 45],
                ['Orientación de carrera', 'Mapea preferencias hacia áreas técnicas, sociales o gerenciales.', 15, 30],
                ['Motivadores laborales', 'Evalúa qué factores impulsan el desempeño individual.', 12, 24],
                ['Ajuste cultural', 'Compara los valores del candidato con los de la organización.', 15, 28],
                ['Estilo de liderazgo', 'Mide preferencias de dirección y toma de decisiones.', 18, 30],
            ],
        ];

        foreach ($catalog as $category => $tests) {
            foreach ($tests as [$name, $description, $duration, $itemCount]) {
                Test::updateOrCreate(
                    ['slug' => Str::slug($name)],
                    [
                        'name' => $name,
                        'category' => $category,
                        'description' => $description,
                        'duration_min' => $duration,
                        'item_count' => $itemCount,
                        'requires_license' => false,
                        'active' => true,
                    ]
                );
            }
        }
    }
}
```

- [ ] **Step 2: Registrar en DatabaseSeeder**

En `backend/database/seeders/DatabaseSeeder.php`, dentro de `run()`, después de la llamada a `DemoTestSeeder`, agregar:

```php
$this->call(CatalogSeeder::class);
```

- [ ] **Step 3: Ejecutar y verificar**

```bash
cd C:\Users\geova\Documents\Mezquit\backend
php artisan migrate:fresh --seed
php artisan tinker --execute "echo App\Models\Test::where('active',true)->where('requires_license',false)->where('slug','!=','prueba-de-demostracion')->count();"
```

Expected: imprime `18`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: seed marketing catalog (18 tests) into tests table"
```

---

## Task 2: Backend — CatalogController + endpoints (TDD)

**Files:**
- Create: `backend/app/Http/Controllers/CatalogController.php`, `backend/tests/Feature/CatalogTest.php`
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/CatalogTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Test as TestModel;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DemoTestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_groups_by_category_with_counts(): void
    {
        $this->seed(DemoTestSeeder::class);
        $this->seed(CatalogSeeder::class);

        $res = $this->getJson('/api/catalog')->assertStatus(200);

        $data = $res->json('data');
        $labels = array_column($data, 'label');
        $this->assertContains('Personalidad', $labels);

        $personalidad = collect($data)->firstWhere('id', 'personalidad');
        $this->assertEquals(6, $personalidad['count']);
        $this->assertCount(6, $personalidad['tests']);
    }

    public function test_catalog_excludes_demo_and_licensed(): void
    {
        $this->seed(DemoTestSeeder::class);
        $this->seed(CatalogSeeder::class);
        TestModel::where('slug', 'perfil-de-conducta')->update(['requires_license' => true]);

        $data = $this->getJson('/api/catalog')->json('data');
        $allSlugs = collect($data)->pluck('tests')->flatten(1)->pluck('slug');

        $this->assertNotContains('prueba-de-demostracion', $allSlugs);
        $this->assertNotContains('perfil-de-conducta', $allSlugs); // licensed hidden
        $this->assertContains('adaptabilidad', $allSlugs);
    }

    public function test_test_detail_by_slug(): void
    {
        $this->seed(CatalogSeeder::class);

        $this->getJson('/api/catalog/adaptabilidad')
            ->assertStatus(200)
            ->assertJsonPath('data.slug', 'adaptabilidad')
            ->assertJsonPath('data.name', 'Adaptabilidad')
            ->assertJsonPath('data.category', 'personalidad');
    }

    public function test_unknown_slug_is_404(): void
    {
        $this->getJson('/api/catalog/no-existe')->assertStatus(404);
    }

    public function test_demo_slug_detail_is_404(): void
    {
        $this->seed(DemoTestSeeder::class);
        $this->getJson('/api/catalog/prueba-de-demostracion')->assertStatus(404);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/CatalogTest.php
```

Expected: FAIL (rutas 404 / controlador ausente).

- [ ] **Step 3: Crear CatalogController**

Crear `backend/app/Http/Controllers/CatalogController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Test;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
    private const DEMO_SLUG = 'prueba-de-demostracion';

    private const CATEGORY_LABELS = [
        'personalidad' => 'Personalidad',
        'razonamiento' => 'Razonamiento',
        'integridad' => 'Integridad',
        'intereses' => 'Intereses',
    ];

    public function index(): JsonResponse
    {
        $tests = Test::query()
            ->where('active', true)
            ->where('requires_license', false)
            ->where('slug', '!=', self::DEMO_SLUG)
            ->orderBy('name')
            ->get(['id', 'slug', 'name', 'description', 'duration_min', 'item_count', 'category']);

        $data = [];
        foreach (self::CATEGORY_LABELS as $id => $label) {
            $inCategory = $tests->where('category', $id)->values();
            if ($inCategory->isEmpty()) {
                continue;
            }
            $data[] = [
                'id' => $id,
                'label' => $label,
                'count' => $inCategory->count(),
                'tests' => $inCategory->map(fn ($t) => [
                    'id' => $t->id,
                    'slug' => $t->slug,
                    'name' => $t->name,
                    'description' => $t->description,
                    'duration_min' => $t->duration_min,
                    'item_count' => $t->item_count,
                ])->all(),
            ];
        }

        return response()->json(['data' => $data]);
    }

    public function show(string $slug): JsonResponse
    {
        $test = Test::query()
            ->where('active', true)
            ->where('requires_license', false)
            ->where('slug', '!=', self::DEMO_SLUG)
            ->where('slug', $slug)
            ->first();

        abort_if($test === null, 404);

        return response()->json(['data' => [
            'id' => $test->id,
            'slug' => $test->slug,
            'name' => $test->name,
            'category' => $test->category,
            'category_label' => self::CATEGORY_LABELS[$test->category] ?? $test->category,
            'description' => $test->description,
            'duration_min' => $test->duration_min,
            'item_count' => $test->item_count,
        ]]);
    }
}
```

- [ ] **Step 4: Registrar rutas públicas**

En `backend/routes/api.php`, agregar (fuera de cualquier grupo auth), junto a la ruta de leads:

```php
Route::get('catalog', [\App\Http\Controllers\CatalogController::class, 'index']);
Route::get('catalog/{slug}', [\App\Http\Controllers\CatalogController::class, 'show']);
```

- [ ] **Step 5: Correr y ver pasar**

```bash
php artisan test tests/Feature/CatalogTest.php
php artisan test
```

Expected: CatalogTest PASS (5 tests); suite completa verde.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: public catalog API (grouped by category, excludes demo and licensed)"
```

---

## Task 3: Frontend — cliente de catálogo + data de planes

**Files:**
- Create: `frontend/src/api/catalog.ts`, `frontend/src/data/plans.ts`

- [ ] **Step 1: Cliente de catálogo**

Crear `frontend/src/api/catalog.ts`:

```ts
import api from './axios'

export interface CatalogTest {
  id: number
  slug: string
  name: string
  description: string
  duration_min: number
  item_count: number
}

export interface CatalogCategory {
  id: string
  label: string
  count: number
  tests: CatalogTest[]
}

export interface TestDetail extends CatalogTest {
  category: string
  category_label: string
}

export async function getCatalog(): Promise<CatalogCategory[]> {
  const { data } = await api.get('/api/catalog')
  return data.data
}

export async function getTest(slug: string): Promise<TestDetail> {
  const { data } = await api.get(`/api/catalog/${slug}`)
  return data.data
}
```

- [ ] **Step 2: Data de planes**

Crear `frontend/src/data/plans.ts`:

```ts
export interface Plan {
  id: string
  name: string
  model: 'creditos' | 'suscripcion'
  price: string
  cadence: string
  includes: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'creditos',
    name: 'Paquete de créditos',
    model: 'creditos',
    price: '[PENDIENTE: precio]',
    cadence: 'Pago único, sin vencimiento',
    includes: [
      'Evaluaciones prepagadas',
      'Reportes con interpretación',
      'Reporte comparativo',
      'Exportación',
    ],
  },
  {
    id: 'suscripcion',
    name: 'Suscripción mensual',
    model: 'suscripcion',
    price: '[PENDIENTE: precio]',
    cadence: 'Al mes',
    includes: [
      'Evaluaciones al mes',
      'Usuarios del equipo',
      'Reporte comparativo',
      'Exportación',
      'Soporte por correo',
    ],
  },
]
```

- [ ] **Step 3: Verificar compila**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npx tsc --noEmit
```

Expected: sin errores nuevos (los archivos aún no se usan; puede haber errores por páginas viejas, se resuelven en tareas siguientes — solo confirmar que estos dos archivos no tienen errores propios).

- [ ] **Step 4: Commit**

```bash
git add src/api/catalog.ts src/data/plans.ts
git commit -m "feat: catalog API client and plans data source"
```

---

## Task 4: Frontend — PruebasPage y PruebaDetallePage

**Files:**
- Create: `frontend/src/pages/PruebasPage.tsx` + `.css`, `frontend/src/pages/PruebaDetallePage.tsx` + `.css`

- [ ] **Step 1: PruebasPage.css**

Crear `frontend/src/pages/PruebasPage.css`:

```css
.pruebas { padding-block: var(--section-py); }
.pruebas__inner { max-width: var(--max-width); margin-inline: auto; padding-inline: var(--section-px); display: flex; flex-direction: column; gap: var(--sp-8); }
.pruebas__title { font-size: var(--text-4xl); }
.pruebas__controls { display: flex; flex-wrap: wrap; gap: var(--sp-4); align-items: center; justify-content: space-between; }
.pruebas__filters { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.pruebas__filter { padding: var(--sp-2) var(--sp-4); border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: 500; border: 1.5px solid var(--color-border); background: transparent; color: var(--color-ink); cursor: pointer; transition: background-color var(--t-fast), border-color var(--t-fast), color var(--t-fast); }
.pruebas__filter:hover, .pruebas__filter[aria-pressed='true'] { background: var(--color-hunter); border-color: var(--color-hunter); color: #fff; }
.pruebas__search { padding: var(--sp-2) var(--sp-4); border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-base); min-width: 220px; }
.pruebas__search:focus { border-color: var(--color-hunter); outline: none; }
.pruebas__group { display: flex; flex-direction: column; gap: var(--sp-4); }
.pruebas__group-title { font-family: var(--font-display); font-size: var(--text-xl); color: var(--color-brunswick); font-weight: 600; }
.pruebas__grid { display: grid; grid-template-columns: 1fr; gap: var(--sp-4); }
@media (min-width: 640px) { .pruebas__grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1024px) { .pruebas__grid { grid-template-columns: repeat(3, 1fr); } }
.prueba-card { display: flex; flex-direction: column; gap: var(--sp-2); padding: var(--sp-5); border: 1px solid var(--color-timberwolf); border-radius: var(--radius-md); background: var(--color-surface); transition: border-color var(--t-fast); }
.prueba-card:hover { border-color: var(--color-hunter); }
.prueba-card__name { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 600; color: var(--color-brunswick); }
.prueba-card__desc { font-size: var(--text-sm); color: var(--color-ink); opacity: 0.75; line-height: 1.5; flex-grow: 1; }
.prueba-card__meta { font-size: var(--text-xs); color: var(--color-hunter); font-weight: 600; font-variant-numeric: tabular-nums; }
.pruebas__state { font-size: var(--text-base); color: var(--color-ink); opacity: 0.7; }
```

- [ ] **Step 2: PruebasPage.tsx**

Crear `frontend/src/pages/PruebasPage.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCatalog, type CatalogCategory } from '@/api/catalog'
import PageHeader from '@/sections/PageHeader'
import './PruebasPage.css'

const ALL = 'todas'

export default function PruebasPage() {
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null)
  const [error, setError] = useState(false)
  const [active, setActive] = useState<string>(ALL)
  const [query, setQuery] = useState('')

  useEffect(() => {
    getCatalog().then(setCategories).catch(() => setError(true))
  }, [])

  const visible = useMemo(() => {
    if (!categories) return []
    const q = query.trim().toLowerCase()
    return categories
      .filter(c => active === ALL || c.id === active)
      .map(c => ({
        ...c,
        tests: q ? c.tests.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) : c.tests,
      }))
      .filter(c => c.tests.length > 0)
  }, [categories, active, query])

  return (
    <>
      <PageHeader title="Pruebas" intro="Explora el catálogo por categoría o busca por nombre. Cada prueba mide un aspecto distinto del candidato." />
      <section className="pruebas">
        <div className="pruebas__inner">
          {error && <p className="pruebas__state">No pudimos cargar el catálogo. Recarga la página.</p>}
          {!error && !categories && <p className="pruebas__state">Cargando catálogo…</p>}

          {categories && (
            <>
              <div className="pruebas__controls">
                <div className="pruebas__filters" role="group" aria-label="Filtrar por categoría">
                  <button className="pruebas__filter" aria-pressed={active === ALL} onClick={() => setActive(ALL)}>Todas</button>
                  {categories.map(c => (
                    <button key={c.id} className="pruebas__filter" aria-pressed={active === c.id} onClick={() => setActive(c.id)}>
                      {c.label} [ {c.count} ]
                    </button>
                  ))}
                </div>
                <input
                  className="pruebas__search"
                  type="search"
                  placeholder="Buscar prueba…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label="Buscar prueba"
                />
              </div>

              {visible.map(c => (
                <div key={c.id} className="pruebas__group">
                  <h2 className="pruebas__group-title">{c.label} <span aria-hidden="true">·</span> {c.tests.length}</h2>
                  <div className="pruebas__grid">
                    {c.tests.map(t => (
                      <Link key={t.slug} to={`/pruebas/${t.slug}`} className="prueba-card">
                        <h3 className="prueba-card__name">{t.name}</h3>
                        <p className="prueba-card__desc">{t.description}</p>
                        <span className="prueba-card__meta">{t.duration_min} min · [ {t.item_count} reactivos ]</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {visible.length === 0 && <p className="pruebas__state">No hay pruebas que coincidan con tu búsqueda.</p>}
            </>
          )}
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 3: PruebaDetallePage.css**

Crear `frontend/src/pages/PruebaDetallePage.css`:

```css
.detalle { padding-block: var(--section-py); }
.detalle__inner { max-width: var(--max-width); margin-inline: auto; padding-inline: var(--section-px); display: flex; flex-direction: column; gap: var(--sp-8); }
.detalle__back { font-size: var(--text-sm); color: var(--color-hunter); }
.detalle__title { font-size: var(--text-4xl); }
.detalle__cat { font-size: var(--text-sm); color: var(--color-ink); opacity: 0.7; }
.detalle__desc { font-size: var(--text-lg); color: var(--color-ink); line-height: 1.6; max-width: 720px; }
.detalle__facts { display: flex; flex-wrap: wrap; gap: var(--sp-6); }
.detalle__fact { display: flex; flex-direction: column; gap: var(--sp-1); }
.detalle__fact-label { font-size: var(--text-xs); color: var(--color-ink); opacity: 0.6; }
.detalle__fact-value { font-family: var(--font-display); font-size: var(--text-2xl); color: var(--color-brunswick); font-variant-numeric: tabular-nums; }
.detalle__report { background: var(--color-timberwolf); border-radius: var(--radius-md); padding: var(--sp-8); }
.detalle__report-intro { font-size: var(--text-base); color: var(--color-ink); margin-bottom: var(--sp-6); }
.detalle__state { font-size: var(--text-base); opacity: 0.7; }
```

- [ ] **Step 4: PruebaDetallePage.tsx**

Crear `frontend/src/pages/PruebaDetallePage.tsx`. Reusa el componente `Report` con datos de muestra (badge "Ejemplo").

```tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTest, type TestDetail } from '@/api/catalog'
import Report from '@/sections/Report'
import type { ReportData } from '@/api/report'
import './PruebaDetallePage.css'

const SAMPLE: ReportData = {
  candidate: 'Ejemplo · Candidato',
  position: 'Puesto de referencia',
  assessment: 'Evaluación de muestra',
  organization: 'Mez',
  completed_at: 'Sep 2026',
  sample: true,
  interview_questions: ['Cuéntame de una situación reciente relacionada con «Orientación a resultados».'],
  tests: [{
    name: 'Resultado de ejemplo',
    integrity: { blur_count: 0 },
    scales: [
      { code: 'A', name: 'Escala A', normalized: 74, percentile: 74, category: 'alto', interpretation: 'Puntaje alto: es una fortaleza marcada del candidato.' },
      { code: 'B', name: 'Escala B', normalized: 52, percentile: 52, category: 'medio', interpretation: 'Puntaje medio: dentro del promedio esperado.' },
      { code: 'C', name: 'Escala C', normalized: 28, percentile: 28, category: 'bajo', interpretation: 'Puntaje bajo: podría ser un área a explorar en entrevista.' },
    ],
  }],
}

export default function PruebaDetallePage() {
  const { slug = '' } = useParams()
  const [test, setTest] = useState<TestDetail | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setTest(null)
    setError(false)
    getTest(slug).then(setTest).catch(() => setError(true))
  }, [slug])

  if (error) return (
    <section className="detalle"><div className="detalle__inner">
      <Link to="/pruebas" className="detalle__back">← Volver al catálogo</Link>
      <h1 className="detalle__title">Prueba no encontrada</h1>
      <p className="detalle__state">Esta prueba no existe o no está disponible.</p>
    </div></section>
  )

  if (!test) return (
    <section className="detalle"><div className="detalle__inner"><p className="detalle__state">Cargando…</p></div></section>
  )

  return (
    <section className="detalle">
      <div className="detalle__inner">
        <Link to="/pruebas" className="detalle__back">← Volver al catálogo</Link>
        <div>
          <p className="detalle__cat">{test.category_label}</p>
          <h1 className="detalle__title">{test.name}</h1>
        </div>
        <p className="detalle__desc">{test.description}</p>
        <div className="detalle__facts">
          <div className="detalle__fact">
            <span className="detalle__fact-label">Duración estimada</span>
            <span className="detalle__fact-value">{test.duration_min} min</span>
          </div>
          <div className="detalle__fact">
            <span className="detalle__fact-label">Reactivos</span>
            <span className="detalle__fact-value">[ {test.item_count} ]</span>
          </div>
        </div>
        <div className="detalle__report">
          <p className="detalle__report-intro">Así se ve un reporte de esta categoría:</p>
          <Report data={SAMPLE} />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Verificar compila**

```bash
npx tsc --noEmit
```

Expected: sin errores en los dos archivos nuevos (puede haber errores por rutas viejas en App.tsx, se arreglan en Task 8).

- [ ] **Step 6: Commit**

```bash
git add src/pages/PruebasPage.tsx src/pages/PruebasPage.css src/pages/PruebaDetallePage.tsx src/pages/PruebaDetallePage.css
git commit -m "feat: /pruebas catalog (API) and /pruebas/:slug detail with sample report"
```

---

## Task 5: Frontend — ComoFunciona, Demo, Precios

**Files:**
- Create: `frontend/src/pages/ComoFuncionaPage.tsx`, `frontend/src/pages/DemoPage.tsx`, `frontend/src/pages/PreciosPage.tsx` + `.css`

- [ ] **Step 1: ComoFuncionaPage**

Crear `frontend/src/pages/ComoFuncionaPage.tsx` (reusa `HowItWorks` y `Methodology`):

```tsx
import PageHeader from '@/sections/PageHeader'
import HowItWorks from '@/sections/HowItWorks'
import Methodology from '@/sections/Methodology'

export default function ComoFuncionaPage() {
  return (
    <>
      <PageHeader title="Cómo funciona" intro="Del catálogo al reporte en cuatro pasos, y cómo se construyen las pruebas que aplicamos." />
      <HowItWorks />
      <Methodology />
    </>
  )
}
```

- [ ] **Step 2: DemoPage**

Crear `frontend/src/pages/DemoPage.tsx` (reusa `ContactSection`):

```tsx
import PageHeader from '@/sections/PageHeader'
import ContactSection from '@/sections/ContactSection'

export default function DemoPage() {
  return (
    <>
      <PageHeader title="Agenda una demo" intro="Cuéntanos de tu empresa y te mostramos el sistema en acción. Te respondemos en un día hábil." />
      <ContactSection />
    </>
  )
}
```

- [ ] **Step 3: PreciosPage.css**

Crear `frontend/src/pages/PreciosPage.css`:

```css
.precios { padding-block: var(--section-py); }
.precios__inner { max-width: var(--max-width); margin-inline: auto; padding-inline: var(--section-px); display: flex; flex-direction: column; gap: var(--sp-8); }
.precios__grid { display: grid; grid-template-columns: 1fr; gap: var(--sp-6); }
@media (min-width: 768px) { .precios__grid { grid-template-columns: 1fr 1fr; } }
.plan { display: flex; flex-direction: column; gap: var(--sp-4); padding: var(--sp-8); border: 1px solid var(--color-timberwolf); border-radius: var(--radius-md); background: var(--color-surface); }
.plan__name { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 600; color: var(--color-brunswick); }
.plan__price { font-family: var(--font-display); font-size: var(--text-3xl); color: var(--color-brunswick); font-variant-numeric: tabular-nums; }
.plan__cadence { font-size: var(--text-sm); color: var(--color-ink); opacity: 0.7; }
.plan__includes { list-style: none; display: flex; flex-direction: column; gap: var(--sp-2); }
.plan__item { font-size: var(--text-sm); color: var(--color-ink); display: flex; gap: var(--sp-2); align-items: baseline; }
.plan__dot { color: var(--color-hunter); font-weight: 700; }
.precios__enterprise { background: var(--color-surface-secondary); border-radius: var(--radius-md); padding: var(--sp-8); display: flex; flex-direction: column; gap: var(--sp-3); align-items: flex-start; }
.precios__enterprise-title { font-family: var(--font-display); font-size: var(--text-2xl); color: var(--color-brunswick); }
```

- [ ] **Step 4: PreciosPage.tsx**

Crear `frontend/src/pages/PreciosPage.tsx`:

```tsx
import PageHeader from '@/sections/PageHeader'
import Button from '@/components/ui/Button'
import { PLANS } from '@/data/plans'
import './PreciosPage.css'

export default function PreciosPage() {
  return (
    <>
      <PageHeader title="Precios" intro="Elige el modelo que se ajuste a tu volumen de evaluaciones." />
      <section className="precios">
        <div className="precios__inner">
          <div className="precios__grid">
            {PLANS.map(plan => (
              <div key={plan.id} className="plan">
                <h2 className="plan__name">{plan.name}</h2>
                <p className="plan__price">{plan.price}</p>
                <p className="plan__cadence">{plan.cadence}</p>
                <ul className="plan__includes">
                  {plan.includes.map((item, i) => (
                    <li key={i} className="plan__item"><span className="plan__dot" aria-hidden="true">›</span>{item}</li>
                  ))}
                </ul>
                <Button to="/demo">Agenda una demo</Button>
              </div>
            ))}
          </div>
          <div className="precios__enterprise">
            <h2 className="precios__enterprise-title">¿Más de 200 evaluaciones al mes?</h2>
            <p>Armamos un plan a tu medida.</p>
            <Button to="/demo" variant="ghost">Hablar con nosotros</Button>
          </div>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 5: Verificar compila**

```bash
npx tsc --noEmit
```

Expected: sin errores en los archivos nuevos.

- [ ] **Step 6: Commit**

```bash
git add src/pages/ComoFuncionaPage.tsx src/pages/DemoPage.tsx src/pages/PreciosPage.tsx src/pages/PreciosPage.css
git commit -m "feat: /como-funciona, /demo, /precios pages"
```

---

## Task 6: Frontend — Ayuda, legales, /evaluar landing

**Files:**
- Create: `frontend/src/pages/AyudaPage.tsx` + `.css`, `frontend/src/pages/legal/LegalPage.tsx` + `.css`, `frontend/src/pages/AvisoPrivacidadPage.tsx`, `frontend/src/pages/TerminosPage.tsx`, `frontend/src/pages/candidate/EvaluarLanding.tsx` + `.css`

- [ ] **Step 1: AyudaPage.css**

Crear `frontend/src/pages/AyudaPage.css`:

```css
.ayuda { padding-block: var(--section-py); }
.ayuda__inner { max-width: 820px; margin-inline: auto; padding-inline: var(--section-px); display: flex; flex-direction: column; gap: var(--sp-12); }
.ayuda__group { display: flex; flex-direction: column; gap: var(--sp-5); }
.ayuda__group-title { font-family: var(--font-display); font-size: var(--text-2xl); color: var(--color-brunswick); }
.ayuda__q { display: flex; flex-direction: column; gap: var(--sp-2); padding-block: var(--sp-4); border-top: 1px solid var(--color-timberwolf); }
.ayuda__q-title { font-weight: 600; color: var(--color-brunswick); }
.ayuda__q-body { font-size: var(--text-base); color: var(--color-ink); opacity: 0.85; line-height: 1.6; }
.ayuda__cta { font-size: var(--text-sm); color: var(--color-hunter); }
```

- [ ] **Step 2: AyudaPage.tsx**

Crear `frontend/src/pages/AyudaPage.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { SITE } from '@/config/site'
import PageHeader from '@/sections/PageHeader'
import './AyudaPage.css'

const CANDIDATO = [
  { q: 'No me llegó el enlace de la evaluación', a: 'Revisa tu carpeta de spam. Si tienes el código, pégalo en la página de acceso a tu evaluación.' },
  { q: 'Se me cerró la prueba a la mitad', a: 'Vuelve a abrir el mismo enlace: tus respuestas se guardan y continúas donde ibas.' },
  { q: 'Me pide datos que no quiero dar', a: 'Solo pedimos lo mínimo para generar tu reporte. El consentimiento es explícito antes de empezar.' },
]

const EMPRESA = [
  { q: '¿Cómo invito candidatos?', a: 'Desde tu panel creas una evaluación, agregas los correos y el sistema genera un enlace por candidato.' },
  { q: '¿Cómo leo el reporte?', a: 'Cada reporte incluye la interpretación de cada escala y preguntas sugeridas para la entrevista.' },
  { q: '¿Cómo funciona la facturación?', a: 'Se factura por paquetes de créditos o suscripción. Escríbenos para los detalles.' },
]

export default function AyudaPage() {
  return (
    <>
      <PageHeader title="Ayuda" intro="Encuentra respuestas según cómo usas Mez." />
      <section className="ayuda">
        <div className="ayuda__inner">
          <div className="ayuda__group">
            <h2 className="ayuda__group-title">Soy candidato</h2>
            {CANDIDATO.map((item, i) => (
              <div key={i} className="ayuda__q">
                <p className="ayuda__q-title">{item.q}</p>
                <p className="ayuda__q-body">{item.a}</p>
              </div>
            ))}
            <Link to="/evaluar" className="ayuda__cta">¿Te invitaron a una evaluación? Accede aquí →</Link>
          </div>
          <div className="ayuda__group">
            <h2 className="ayuda__group-title">Soy empresa</h2>
            {EMPRESA.map((item, i) => (
              <div key={i} className="ayuda__q">
                <p className="ayuda__q-title">{item.q}</p>
                <p className="ayuda__q-body">{item.a}</p>
              </div>
            ))}
            <a href={`mailto:${SITE.email}`} className="ayuda__cta">Escríbenos: {SITE.email}</a>
          </div>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 3: LegalPage (reutilizable)**

Crear `frontend/src/pages/legal/LegalPage.css`:

```css
.legal { padding-block: var(--section-py); }
.legal__inner { max-width: 720px; margin-inline: auto; padding-inline: var(--section-px); display: flex; flex-direction: column; gap: var(--sp-6); }
.legal__body { font-size: var(--text-base); color: var(--color-ink); line-height: 1.7; }
```

Crear `frontend/src/pages/legal/LegalPage.tsx`:

```tsx
import PageHeader from '@/sections/PageHeader'
import './LegalPage.css'

export default function LegalPage({ title, body }: { title: string; body: string }) {
  return (
    <>
      <PageHeader title={title} />
      <section className="legal">
        <div className="legal__inner">
          <p className="legal__body">{body}</p>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 4: Páginas legales**

Crear `frontend/src/pages/AvisoPrivacidadPage.tsx`:

```tsx
import LegalPage from '@/pages/legal/LegalPage'

export default function AvisoPrivacidadPage() {
  return <LegalPage title="Aviso de privacidad" body="[PENDIENTE: contenido del aviso de privacidad conforme a la LFPDPPP]" />
}
```

Crear `frontend/src/pages/TerminosPage.tsx`:

```tsx
import LegalPage from '@/pages/legal/LegalPage'

export default function TerminosPage() {
  return <LegalPage title="Términos y condiciones" body="[PENDIENTE: contenido de términos y condiciones]" />
}
```

- [ ] **Step 5: EvaluarLanding.css**

Crear `frontend/src/pages/candidate/EvaluarLanding.css`:

```css
.evaluar-landing { min-height: 100svh; display: grid; place-items: center; padding: var(--sp-6); background: var(--color-surface); }
.evaluar-landing__card { width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: var(--sp-5); }
.evaluar-landing__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.evaluar-landing__text { font-size: var(--text-base); color: var(--color-ink); opacity: 0.85; }
.evaluar-landing__input { padding: var(--sp-3) var(--sp-4); border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-base); }
.evaluar-landing__input:focus { border-color: var(--color-hunter); outline: none; }
.evaluar-landing__error { font-size: var(--text-sm); color: var(--color-error); }
```

- [ ] **Step 6: EvaluarLanding.tsx**

Crear `frontend/src/pages/candidate/EvaluarLanding.tsx`. Acepta un token pelón o una URL que contenga `/evaluar/{token}`.

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import './EvaluarLanding.css'

function extractToken(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const match = trimmed.match(/\/evaluar\/([^/?#\s]+)/)
  if (match) return match[1]
  // token pelón: sin espacios ni barras
  if (/^[A-Za-z0-9]+$/.test(trimmed)) return trimmed
  return null
}

export default function EvaluarLanding() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const token = extractToken(value)
    if (!token) {
      setError('Pega el enlace completo o el código que te dieron.')
      return
    }
    navigate(`/evaluar/${token}`)
  }

  return (
    <div className="evaluar-landing">
      <form className="evaluar-landing__card" onSubmit={submit}>
        <h1 className="evaluar-landing__title">¿Te invitaron a una evaluación?</h1>
        <p className="evaluar-landing__text">Pega el enlace o el código que te envió la empresa para comenzar.</p>
        <input
          className="evaluar-landing__input"
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          placeholder="Enlace o código"
          aria-label="Enlace o código de la evaluación"
        />
        {error && <p className="evaluar-landing__error" role="alert">{error}</p>}
        <Button type="submit">Continuar</Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 7: Verificar compila**

```bash
npx tsc --noEmit
```

Expected: sin errores en los archivos nuevos.

- [ ] **Step 8: Commit**

```bash
git add src/pages/AyudaPage.tsx src/pages/AyudaPage.css src/pages/legal/ src/pages/AvisoPrivacidadPage.tsx src/pages/TerminosPage.tsx src/pages/candidate/EvaluarLanding.tsx src/pages/candidate/EvaluarLanding.css
git commit -m "feat: /ayuda, legal pages, and /evaluar landing"
```

---

## Task 7: Frontend — Header con menú móvil + Footer

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx`, `Header.css`, `Footer.tsx`

- [ ] **Step 1: Header.tsx**

Reemplazar `frontend/src/components/layout/Header.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { SITE } from '@/config/site'
import Button from '@/components/ui/Button'
import './Header.css'

const NAV_LINKS = [
  { to: '/pruebas', label: 'Pruebas' },
  { to: '/como-funciona', label: 'Cómo funciona' },
  { to: '/precios', label: 'Precios' },
  { to: '/ayuda', label: 'Ayuda' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => { setOpen(false) }, [pathname])

  const demoTo = SITE.calendarUrl !== '[PENDIENTE: enlace de agenda]' ? undefined : '/demo'
  const demoHref = SITE.calendarUrl !== '[PENDIENTE: enlace de agenda]' ? SITE.calendarUrl : undefined

  return (
    <header className="header" role="banner">
      <div className="header__inner">
        <Link to="/" className="header__logo-link" aria-label={`${SITE.name} — inicio`}>
          <img src="/logo.png" alt={SITE.name} className="header__logo-img" width={53} height={36} />
          <span className="header__logo-name" aria-hidden="true">{SITE.name}</span>
        </Link>

        <nav className="header__nav" aria-label="Navegación principal">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`}>
              <span className="header__nav-text" aria-hidden="true">{label}</span>
              <span className="header__nav-text--hover" aria-hidden="true">{label}</span>
              <span className="sr-only">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="header__cta">
          <Button href={demoHref} to={demoTo}>Agenda una demo</Button>
        </div>

        <button
          className="header__burger"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <span className="header__burger-bar" />
          <span className="header__burger-bar" />
          <span className="header__burger-bar" />
        </button>
      </div>

      {open && (
        <div className="header__mobile" role="dialog" aria-label="Menú">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className="header__mobile-link">{label}</NavLink>
          ))}
          <Link to="/evaluar" className="header__mobile-link header__mobile-link--muted">¿Te invitaron a una evaluación?</Link>
          <Button href={demoHref} to={demoTo}>Agenda una demo</Button>
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Header.css (agregar burger + panel móvil)**

Añadir al final de `frontend/src/components/layout/Header.css`:

```css
/* Menú móvil */
.header__burger { display: inline-flex; flex-direction: column; gap: 5px; width: 44px; height: 44px; align-items: center; justify-content: center; }
.header__burger-bar { width: 22px; height: 2px; background: var(--color-brunswick); border-radius: 2px; }
@media (min-width: 768px) { .header__burger { display: none; } }

.header__mobile { display: flex; flex-direction: column; gap: var(--sp-2); padding: var(--sp-4) var(--section-px) var(--sp-6); background: var(--color-surface); border-bottom: 1px solid var(--color-timberwolf); animation: mobileDrop 200ms ease; }
.header__mobile-link { padding: var(--sp-3) 0; font-size: var(--text-lg); font-weight: 500; color: var(--color-ink); border-bottom: 1px solid var(--color-timberwolf); }
.header__mobile-link--muted { color: var(--color-hunter); font-size: var(--text-base); }
@media (min-width: 768px) { .header__mobile { display: none; } }

@keyframes mobileDrop { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .header__mobile { animation: none; } }
```

Además, el `.header__cta` debe ocultarse en móvil (el CTA vive en el panel). Añadir:

```css
@media (max-width: 767px) { .header__cta { display: none; } }
```

- [ ] **Step 3: Footer.tsx**

Reemplazar los enlaces del footer para que apunten a las rutas reales. En `frontend/src/components/layout/Footer.tsx`, reemplazar la lista `footer__links` por:

```tsx
        <ul className="footer__links">
          <li><Link to="/aviso-de-privacidad" className="footer__link">Aviso de privacidad</Link></li>
          <li><Link to="/terminos" className="footer__link">Términos y condiciones</Link></li>
          <li><Link to="/ayuda" className="footer__link">Ayuda</Link></li>
          <li><Link to="/evaluar" className="footer__link">¿Te invitaron a una evaluación?</Link></li>
          <li><a href={`mailto:${SITE.email}`} className="footer__link">Contacto</a></li>
        </ul>
```

Y asegurar los imports al inicio del archivo:

```tsx
import { Link } from 'react-router-dom'
import { SITE } from '@/config/site'
```

(Mantener el resto del Footer: marca, `[PENDIENTE: razón social del titular]`, año.)

- [ ] **Step 4: Verificar compila**

```bash
npx tsc --noEmit
```

Expected: sin errores en Header/Footer.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/Header.css src/components/layout/Footer.tsx
git commit -m "feat: Mettl nav + mobile menu, footer legal links and candidate access"
```

---

## Task 8: Frontend — HomePage, rutas y limpieza

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`, `frontend/src/App.tsx`
- Delete: páginas y secciones obsoletas + data estática

- [ ] **Step 1: HomePage con adelanto de catálogo desde API**

Reemplazar `frontend/src/pages/HomePage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '@/sections/Hero'
import SampleReport from '@/sections/SampleReport'
import HowItWorks from '@/sections/HowItWorks'
import Button from '@/components/ui/Button'
import { getCatalog, type CatalogCategory } from '@/api/catalog'
import './HomePage.css'

export default function HomePage() {
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null)

  useEffect(() => {
    getCatalog().then(setCategories).catch(() => setCategories([]))
  }, [])

  return (
    <>
      <Hero />
      <SampleReport />
      <div className="home-cta home-cta--tinted">
        <Button to="/como-funciona" variant="ghost">Ver cómo funciona</Button>
      </div>

      <section className="home-catalog" aria-labelledby="home-catalog-title">
        <div className="home-catalog__inner">
          <h2 className="home-catalog__title" id="home-catalog-title">Pruebas por categoría</h2>
          <div className="home-catalog__grid">
            {(categories ?? []).map(c => (
              <Link key={c.id} to="/pruebas" className="home-catalog__cat">
                <span className="home-catalog__cat-name">{c.label}</span>
                <span className="home-catalog__cat-count">[ {c.count} pruebas ]</span>
              </Link>
            ))}
          </div>
          <div className="home-cta">
            <Button to="/pruebas">Ver todas las pruebas</Button>
          </div>
        </div>
      </section>

      <HowItWorks />
      <div className="home-cta home-cta--tinted">
        <Button to="/demo">Agenda una demo</Button>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Añadir estilos del adelanto de catálogo**

Añadir al final de `frontend/src/pages/HomePage.css`:

```css
.home-catalog { padding-block: var(--section-py); }
.home-catalog__inner { max-width: var(--max-width); margin-inline: auto; padding-inline: var(--section-px); display: flex; flex-direction: column; gap: var(--sp-8); }
.home-catalog__title { font-size: var(--text-3xl); }
.home-catalog__grid { display: grid; grid-template-columns: 1fr; gap: var(--sp-4); }
@media (min-width: 640px) { .home-catalog__grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1024px) { .home-catalog__grid { grid-template-columns: repeat(4, 1fr); } }
.home-catalog__cat { display: flex; flex-direction: column; gap: var(--sp-2); padding: var(--sp-6); border: 1px solid var(--color-timberwolf); border-radius: var(--radius-md); transition: border-color var(--t-fast); }
.home-catalog__cat:hover { border-color: var(--color-hunter); }
.home-catalog__cat-name { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 600; color: var(--color-brunswick); }
.home-catalog__cat-count { font-size: var(--text-sm); color: var(--color-hunter); font-weight: 600; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 3: Reescribir App.tsx con la IA nueva**

Reemplazar `frontend/src/App.tsx`:

```tsx
import { Routes, Route } from 'react-router-dom'
import RootLayout from '@/components/layout/RootLayout'
import HomePage from '@/pages/HomePage'
import PruebasPage from '@/pages/PruebasPage'
import PruebaDetallePage from '@/pages/PruebaDetallePage'
import ComoFuncionaPage from '@/pages/ComoFuncionaPage'
import PreciosPage from '@/pages/PreciosPage'
import DemoPage from '@/pages/DemoPage'
import AyudaPage from '@/pages/AyudaPage'
import AvisoPrivacidadPage from '@/pages/AvisoPrivacidadPage'
import TerminosPage from '@/pages/TerminosPage'
import NotFoundPage from '@/pages/NotFoundPage'
import Login from '@/pages/auth/Login'
import Registro from '@/pages/auth/Registro'
import RequireAuth from '@/components/RequireAuth'
import AppLayout from '@/pages/app/AppLayout'
import NuevaEvaluacion from '@/pages/app/NuevaEvaluacion'
import ReporteCandidato from '@/pages/app/ReporteCandidato'
import CandidateFlow from '@/pages/candidate/CandidateFlow'
import EvaluarLanding from '@/pages/candidate/EvaluarLanding'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/evaluar" element={<EvaluarLanding />} />
      <Route path="/evaluar/:token" element={<CandidateFlow />} />
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="pruebas" element={<PruebasPage />} />
        <Route path="pruebas/:slug" element={<PruebaDetallePage />} />
        <Route path="como-funciona" element={<ComoFuncionaPage />} />
        <Route path="precios" element={<PreciosPage />} />
        <Route path="demo" element={<DemoPage />} />
        <Route path="ayuda" element={<AyudaPage />} />
        <Route path="aviso-de-privacidad" element={<AvisoPrivacidadPage />} />
        <Route path="terminos" element={<TerminosPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="evaluaciones/nueva" element={<NuevaEvaluacion />} />
        <Route path="candidatos/:invitationId/reporte" element={<ReporteCandidato />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 4: Eliminar páginas, secciones y data obsoletas**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
rm src/pages/TestPage.tsx src/pages/PsicometriaPage.tsx src/pages/NosotrosPage.tsx
rm src/sections/CompanyInfo.tsx src/sections/CompanyInfo.css src/sections/Testimonials.tsx src/sections/Testimonials.css src/sections/PackagesSection.tsx src/sections/PackagesSection.css src/sections/TestInventory.tsx src/sections/TestInventory.css src/sections/Catalog.tsx src/sections/Catalog.css
rm src/data/catalog.ts src/data/packages.ts src/data/company.ts
```

- [ ] **Step 5: Verificar que no queden imports colgados**

```bash
npx tsc --noEmit
```

Expected: **cero errores**. Si algún archivo aún importa de los borrados (p. ej. `SampleReport` importaba de `@/api/report`, no de catalog — revisar), corregir. `SampleReport.tsx` ya usa `Report` y datos propios, no depende de los borrados.

- [ ] **Step 6: Build**

```bash
npm run build
```

Expected: build exitoso.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: adopt Mettl IA — homepage catalog preview, routes, remove /test /psicometria /nosotros"
```

---

## Task 9: Verificación visual

**Files:** (solo verificación)

- [ ] **Step 1: Arrancar backend y frontend**

```bash
# backend
cd C:\Users\geova\Documents\Mezquit\backend && php artisan migrate:fresh --seed && php artisan serve --port=8000
# frontend (otra terminal)
cd C:\Users\geova\Documents\Mezquit\frontend && npm run dev
```

- [ ] **Step 2: Screenshots de páginas clave a 1440px y 375px**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npx playwright screenshot --browser chromium --viewport-size "1440,900" --full-page "http://localhost:5173/" "C:/Users/geova/AppData/Local/Temp/f3-home.png"
npx playwright screenshot --browser chromium --viewport-size "1440,900" --full-page "http://localhost:5173/pruebas" "C:/Users/geova/AppData/Local/Temp/f3-pruebas.png"
npx playwright screenshot --browser chromium --viewport-size "1440,900" --full-page "http://localhost:5173/pruebas/adaptabilidad" "C:/Users/geova/AppData/Local/Temp/f3-detalle.png"
npx playwright screenshot --browser chromium --viewport-size "1440,900" --full-page "http://localhost:5173/precios" "C:/Users/geova/AppData/Local/Temp/f3-precios.png"
npx playwright screenshot --browser chromium --viewport-size "375,812" --full-page "http://localhost:5173/pruebas" "C:/Users/geova/AppData/Local/Temp/f3-pruebas-mobile.png"
```

- [ ] **Step 3: Revisar capturas y reportar**

Leer cada PNG y verificar:
- Header nav = Pruebas · Cómo funciona · Precios · Ayuda + CTA; en móvil, hamburguesa funcional.
- `/pruebas`: 4 categorías con conteos `[ N ]` desde la API, tarjetas con duración y reactivos, búsqueda.
- `/pruebas/adaptabilidad`: detalle + reporte de ejemplo (componente Report, badge "Ejemplo").
- `/precios`: dos planes con `[PENDIENTE: precio]` + bloque enterprise.
- Home: adelanto de catálogo con conteos desde API + CTAs.
- Sin desbordes en móvil; contraste correcto; corchetes solo en cantidades.

Reportar issues encontrados.

---

## Self-review

- [ ] Catálogo y conteos salen de la API/BD (Task 1-2, PruebasPage, HomePage).
- [ ] Reporte de ejemplo usa el componente `Report` compartido (PruebaDetallePage, SampleReport).
- [ ] IA Mettl completa; `/test`, `/psicometria`, `/nosotros` eliminadas (Task 8).
- [ ] Menú móvil con `prefers-reduced-motion` (Task 7).
- [ ] `/evaluar` landing extrae token de enlace o código (Task 6).
- [ ] Corchetes solo en cantidades; sin datos inventados; precios `[PENDIENTE]`.

## Lista de [PENDIENTE]

1. Precios de cada plan (`data/plans.ts`)
2. `SITE.calendarUrl` (enlace de agenda)
3. `SITE.email` (correo de contacto)
4. Razón social del titular (footer)
5. Contenido legal de `/aviso-de-privacidad` y `/terminos`
6. Baterías/paquetes por puesto (definir con el psicólogo)
7. Afirmaciones verificables de confianza (si se reintroduce el bloque)
