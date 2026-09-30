# Mez — Fase 1: Núcleo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebanada vertical end-to-end: RH crea una evaluación → invita candidatos por token → candidato responde desde el móvil → el sistema califica → RH ve el reporte individual.

**Architecture:** Laravel 13 API-only (Sanctum SPA cookie auth) + React 19 SPA. Reactivos/reglas/baremos en BD. `ScoringService` versionado. Portal del candidato como árbol de rutas separado sin login.

**Tech Stack:** Laravel 13, PHP 8.4, Sanctum, MySQL (dev) / SQLite in-memory (tests), PHPUnit 12, React 19, TypeScript, React Router v7, Axios.

**Spec:** `docs/superpowers/specs/2026-09-11-fase1-nucleo-design.md`

**Convenciones:** Modelos con atributo `#[Fillable([...])]` (ver `User.php`). Migraciones con clase anónima. Tests feature con `RefreshDatabase`.

---

## Mapa de archivos (resumen)

**Backend — eliminar:** `app/Models/Evaluation.php`, `app/Http/Controllers/EvaluationController.php`, `app/Http/Requests/StoreEvaluationRequest.php`, `UpdateEvaluationRequest.php`, `tests/Feature/EvaluationTest.php`, migración `..._create_evaluations_table.php`, ruta en `routes/api.php`.

**Backend — crear:** migraciones (org/users update/tests/scales/items/item_options/scoring_rules/norms/assessments/assessment_test/candidates/invitations/attempts/answers/attempt_events/scores/consents), modelos correspondientes, `Database\Seeders\DemoTestSeeder`, `App\Services\ScoringService`, controladores `Auth\RegisterController`, `Auth\SessionController`, `AssessmentController`, `CandidatePortalController`, `ReportController`, Form Requests, rutas.

**Frontend — crear:** `src/api/auth.ts`, `src/context/AuthContext.tsx`, `src/components/RequireAuth.tsx`, páginas `pages/auth/Registro.tsx`, `Login.tsx`, `pages/app/AppLayout.tsx`, `NuevaEvaluacion.tsx`, `EvaluacionDetalle.tsx`, `pages/candidate/CandidateLayout.tsx` + pasos, `sections/Report.tsx`.

---

## Task 1: Eliminar el módulo Evaluation viejo

**Files:**
- Delete: `backend/app/Models/Evaluation.php`, `EvaluationController.php`, `StoreEvaluationRequest.php`, `UpdateEvaluationRequest.php`, `EvaluationResource.php`, `tests/Feature/EvaluationTest.php`, `database/factories/EvaluationFactory.php`, migración de evaluations
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Borrar archivos del módulo**

```bash
cd C:\Users\geova\Documents\Mezquit\backend
rm app/Models/Evaluation.php app/Http/Controllers/EvaluationController.php app/Http/Requests/StoreEvaluationRequest.php app/Http/Requests/UpdateEvaluationRequest.php app/Http/Resources/EvaluationResource.php tests/Feature/EvaluationTest.php database/factories/EvaluationFactory.php database/migrations/2026_09_10_202952_create_evaluations_table.php
```

- [ ] **Step 2: Limpiar routes/api.php**

Reemplazar `backend/routes/api.php`:

```php
<?php

use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;

Route::post('leads', [LeadController::class, 'store']);
```

- [ ] **Step 3: Recrear la base de datos y correr tests restantes**

```bash
php artisan migrate:fresh
php artisan test
```

Expected: sin errores; solo pasan los tests que no sean de Evaluation (ExampleTest). `evaluations` ya no existe.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove placeholder Evaluation module (superseded by assessments)"
```

---

## Task 2: Instalar y configurar Sanctum (SPA)

**Files:**
- Install: `laravel/sanctum`
- Modify: `backend/bootstrap/app.php`, `backend/config/cors.php` (crear si falta), `backend/.env`

- [ ] **Step 1: Instalar Sanctum**

```bash
cd C:\Users\geova\Documents\Mezquit\backend
composer require laravel/sanctum
php artisan install:api
```

Expected: crea `config/sanctum.php`, migración de `personal_access_tokens`, y `routes/api.php` (si lo regenera, restaurar el contenido del Task 1 Step 2 más las rutas que se agregan luego).

- [ ] **Step 2: Configurar stateful domains y CORS en .env**

Añadir/ajustar en `backend/.env`:

```ini
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:5173
```

- [ ] **Step 3: Habilitar CORS con credenciales**

Publicar config de CORS si no existe:

```bash
php artisan config:publish cors
```

En `backend/config/cors.php`, asegurar:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register', 'user'],
'allowed_methods' => ['*'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

- [ ] **Step 4: Habilitar middleware stateful de Sanctum para API**

En `backend/bootstrap/app.php`, dentro de `->withMiddleware(function (Middleware $middleware): void {`:

```php
$middleware->statefulApi();
```

- [ ] **Step 5: Verificar**

```bash
php artisan migrate:fresh
php artisan test
```

Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: install and configure Sanctum SPA authentication"
```

---

## Task 3: Migraciones de Fase 1

**Files:**
- Create: varias migraciones en `backend/database/migrations/`

- [ ] **Step 1: Generar y escribir las migraciones**

Generar los archivos:

```bash
cd C:\Users\geova\Documents\Mezquit\backend
php artisan make:migration create_organizations_table
php artisan make:migration add_organization_and_role_to_users_table
php artisan make:migration create_tests_table
php artisan make:migration create_scales_table
php artisan make:migration create_items_table
php artisan make:migration create_item_options_table
php artisan make:migration create_scoring_rules_table
php artisan make:migration create_norms_table
php artisan make:migration create_assessments_table
php artisan make:migration create_assessment_test_table
php artisan make:migration create_candidates_table
php artisan make:migration create_invitations_table
php artisan make:migration create_attempts_table
php artisan make:migration create_answers_table
php artisan make:migration create_attempt_events_table
php artisan make:migration create_scores_table
php artisan make:migration create_consents_table
```

Reemplazar el cuerpo de cada `up()` con lo siguiente (cada archivo mantiene su clase anónima; solo se muestra el `Schema::create`/`Schema::table` de cada uno).

`create_organizations_table`:
```php
Schema::create('organizations', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('sector')->nullable();
    $table->string('size')->nullable();
    $table->timestamps();
});
```

`add_organization_and_role_to_users_table`:
```php
Schema::table('users', function (Blueprint $table) {
    $table->foreignId('organization_id')->nullable()->after('id')->constrained()->nullOnDelete();
    $table->string('role')->default('admin')->after('password');
});
```
Y su `down()`:
```php
Schema::table('users', function (Blueprint $table) {
    $table->dropConstrainedForeignId('organization_id');
    $table->dropColumn('role');
});
```

`create_tests_table`:
```php
Schema::create('tests', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    $table->string('name');
    $table->string('category');
    $table->text('description')->nullable();
    $table->unsignedSmallInteger('duration_min')->default(0);
    $table->unsignedSmallInteger('item_count')->default(0);
    $table->boolean('allows_back')->default(true);
    $table->boolean('requires_license')->default(false);
    $table->boolean('active')->default(true);
    $table->timestamps();
});
```

`create_scales_table`:
```php
Schema::create('scales', function (Blueprint $table) {
    $table->id();
    $table->foreignId('test_id')->constrained()->cascadeOnDelete();
    $table->string('code');
    $table->string('name');
});
```

`create_items_table`:
```php
Schema::create('items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('test_id')->constrained()->cascadeOnDelete();
    $table->unsignedSmallInteger('order');
    $table->text('prompt');
    $table->foreignId('scale_id')->constrained()->cascadeOnDelete();
    $table->boolean('reverse_scored')->default(false);
});
```

`create_item_options_table`:
```php
Schema::create('item_options', function (Blueprint $table) {
    $table->id();
    $table->foreignId('item_id')->constrained()->cascadeOnDelete();
    $table->string('label');
    $table->integer('value');
});
```

`create_scoring_rules_table`:
```php
Schema::create('scoring_rules', function (Blueprint $table) {
    $table->id();
    $table->foreignId('test_id')->constrained()->cascadeOnDelete();
    $table->unsignedInteger('version');
    $table->json('algorithm');
    $table->timestamps();
});
```

`create_norms_table`:
```php
Schema::create('norms', function (Blueprint $table) {
    $table->id();
    $table->foreignId('test_id')->constrained()->cascadeOnDelete();
    $table->unsignedInteger('version');
    $table->json('data');
    $table->timestamps();
});
```

`create_assessments_table`:
```php
Schema::create('assessments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('position')->nullable();
    $table->date('deadline')->nullable();
    $table->string('status')->default('activa');
    $table->timestamps();
});
```

`create_assessment_test_table`:
```php
Schema::create('assessment_test', function (Blueprint $table) {
    $table->id();
    $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
    $table->foreignId('test_id')->constrained()->cascadeOnDelete();
    $table->unsignedSmallInteger('order')->default(0);
});
```

`create_candidates_table`:
```php
Schema::create('candidates', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email');
    $table->string('phone')->nullable();
    $table->timestamps();
});
```

`create_invitations_table`:
```php
Schema::create('invitations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
    $table->foreignId('candidate_id')->constrained()->cascadeOnDelete();
    $table->string('token', 64)->unique();
    $table->string('status')->default('pendiente'); // pendiente|iniciada|completada|expirada
    $table->timestamp('sent_at')->nullable();
    $table->timestamp('opened_at')->nullable();
    $table->timestamp('completed_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
});
```

`create_attempts_table`:
```php
Schema::create('attempts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('invitation_id')->constrained()->cascadeOnDelete();
    $table->foreignId('test_id')->constrained()->cascadeOnDelete();
    $table->timestamp('started_at')->nullable();
    $table->timestamp('finished_at')->nullable();
    $table->string('status')->default('en_progreso'); // en_progreso|completada
    $table->timestamps();
});
```

`create_answers_table`:
```php
Schema::create('answers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('attempt_id')->constrained()->cascadeOnDelete();
    $table->foreignId('item_id')->constrained()->cascadeOnDelete();
    $table->integer('value');
    $table->timestamp('responded_at')->nullable();
    $table->unsignedInteger('elapsed_ms')->default(0);
    $table->unique(['attempt_id', 'item_id']);
});
```

`create_attempt_events_table`:
```php
Schema::create('attempt_events', function (Blueprint $table) {
    $table->id();
    $table->foreignId('attempt_id')->constrained()->cascadeOnDelete();
    $table->string('type'); // blur|focus|multidevice
    $table->json('payload')->nullable();
    $table->timestamp('created_at')->nullable();
});
```

`create_scores_table`:
```php
Schema::create('scores', function (Blueprint $table) {
    $table->id();
    $table->foreignId('attempt_id')->constrained()->cascadeOnDelete();
    $table->foreignId('scale_id')->constrained()->cascadeOnDelete();
    $table->integer('raw');
    $table->float('normalized');
    $table->unsignedSmallInteger('percentile')->nullable();
    $table->string('category'); // bajo|medio|alto
    $table->unsignedInteger('scoring_rule_version');
    $table->unsignedInteger('norm_version');
    $table->timestamps();
});
```

`create_consents_table`:
```php
Schema::create('consents', function (Blueprint $table) {
    $table->id();
    $table->foreignId('invitation_id')->constrained()->cascadeOnDelete();
    $table->timestamp('accepted_at');
    $table->string('ip', 45)->nullable();
    $table->string('user_agent')->nullable();
    $table->string('privacy_version')->default('v1');
});
```

- [ ] **Step 2: Migrar y verificar**

```bash
php artisan migrate:fresh
php artisan test
```

Expected: todas las tablas creadas, tests existentes pasan.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Fase 1 database schema"
```

---

## Task 4: Modelos Eloquent

**Files:**
- Modify: `backend/app/Models/User.php`
- Create: modelos en `backend/app/Models/`

- [ ] **Step 1: Actualizar User con organización, rol y relación**

En `backend/app/Models/User.php`, cambiar el atributo Fillable a incluir organización y rol y añadir la relación:

```php
#[Fillable(['name', 'email', 'password', 'organization_id', 'role'])]
```

Y dentro de la clase, agregar:

```php
public function organization(): \Illuminate\Database\Eloquent\Relations\BelongsTo
{
    return $this->belongsTo(Organization::class);
}
```

- [ ] **Step 2: Crear los modelos**

Cada archivo en `backend/app/Models/`. Todos usan `#[Fillable]`.

`Organization.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'sector', 'size'])]
class Organization extends Model
{
    public function users(): HasMany { return $this->hasMany(User::class); }
    public function assessments(): HasMany { return $this->hasMany(Assessment::class); }
}
```

`Test.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug','name','category','description','duration_min','item_count','allows_back','requires_license','active'])]
class Test extends Model
{
    protected function casts(): array
    {
        return ['allows_back' => 'boolean', 'requires_license' => 'boolean', 'active' => 'boolean'];
    }
    public function scales(): HasMany { return $this->hasMany(Scale::class); }
    public function items(): HasMany { return $this->hasMany(Item::class)->orderBy('order'); }
    public function scoringRules(): HasMany { return $this->hasMany(ScoringRule::class); }
    public function norms(): HasMany { return $this->hasMany(Norm::class); }
    public function latestScoringRule(): ?ScoringRule { return $this->scoringRules()->orderByDesc('version')->first(); }
    public function latestNorm(): ?Norm { return $this->norms()->orderByDesc('version')->first(); }
}
```

`Scale.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['test_id','code','name'])]
class Scale extends Model
{
    public $timestamps = false;
    public function items() { return $this->hasMany(Item::class); }
}
```

`Item.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['test_id','order','prompt','scale_id','reverse_scored'])]
class Item extends Model
{
    public $timestamps = false;
    protected function casts(): array { return ['reverse_scored' => 'boolean']; }
    public function options() { return $this->hasMany(ItemOption::class)->orderBy('value'); }
    public function scale() { return $this->belongsTo(Scale::class); }
}
```

`ItemOption.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['item_id','label','value'])]
class ItemOption extends Model { public $timestamps = false; }
```

`ScoringRule.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['test_id','version','algorithm'])]
class ScoringRule extends Model
{
    protected function casts(): array { return ['algorithm' => 'array']; }
}
```

`Norm.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['test_id','version','data'])]
class Norm extends Model
{
    protected function casts(): array { return ['data' => 'array']; }
}
```

`Assessment.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['organization_id','name','position','deadline','status'])]
class Assessment extends Model
{
    protected function casts(): array { return ['deadline' => 'date']; }
    public function tests(): BelongsToMany { return $this->belongsToMany(Test::class)->withPivot('order')->orderBy('order'); }
    public function invitations(): HasMany { return $this->hasMany(Invitation::class); }
    public function organization() { return $this->belongsTo(Organization::class); }
}
```

`Candidate.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name','email','phone'])]
class Candidate extends Model {}
```

`Invitation.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['assessment_id','candidate_id','token','status','sent_at','opened_at','completed_at','expires_at'])]
class Invitation extends Model
{
    protected function casts(): array
    {
        return ['sent_at'=>'datetime','opened_at'=>'datetime','completed_at'=>'datetime','expires_at'=>'datetime'];
    }
    public function assessment() { return $this->belongsTo(Assessment::class); }
    public function candidate() { return $this->belongsTo(Candidate::class); }
    public function attempts(): HasMany { return $this->hasMany(Attempt::class); }
    public function consent() { return $this->hasOne(Consent::class); }
}
```

`Attempt.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['invitation_id','test_id','started_at','finished_at','status'])]
class Attempt extends Model
{
    protected function casts(): array { return ['started_at'=>'datetime','finished_at'=>'datetime']; }
    public function answers(): HasMany { return $this->hasMany(Answer::class); }
    public function events(): HasMany { return $this->hasMany(AttemptEvent::class); }
    public function scores(): HasMany { return $this->hasMany(Score::class); }
    public function test() { return $this->belongsTo(Test::class); }
    public function invitation() { return $this->belongsTo(Invitation::class); }
}
```

`Answer.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['attempt_id','item_id','value','responded_at','elapsed_ms'])]
class Answer extends Model
{
    public $timestamps = false;
    protected function casts(): array { return ['responded_at' => 'datetime']; }
}
```

`AttemptEvent.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['attempt_id','type','payload','created_at'])]
class AttemptEvent extends Model
{
    public $timestamps = false;
    protected function casts(): array { return ['payload' => 'array', 'created_at' => 'datetime']; }
}
```

`Score.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['attempt_id','scale_id','raw','normalized','percentile','category','scoring_rule_version','norm_version'])]
class Score extends Model
{
    public function scale() { return $this->belongsTo(Scale::class); }
}
```

`Consent.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['invitation_id','accepted_at','ip','user_agent','privacy_version'])]
class Consent extends Model
{
    public $timestamps = false;
    protected function casts(): array { return ['accepted_at' => 'datetime']; }
}
```

- [ ] **Step 3: Verificar carga de modelos**

```bash
php artisan test
php artisan tinker --execute 'echo App\Models\Test::count();'
```

Expected: sin errores de clase.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Fase 1 Eloquent models"
```

---

## Task 5: Seeder de la prueba de demostración

**Files:**
- Create: `backend/database/seeders/DemoTestSeeder.php`
- Modify: `backend/database/seeders/DatabaseSeeder.php`

- [ ] **Step 1: Crear DemoTestSeeder**

Crear `backend/database/seeders/DemoTestSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\ItemOption;
use App\Models\Norm;
use App\Models\Scale;
use App\Models\ScoringRule;
use App\Models\Test;
use Illuminate\Database\Seeder;

class DemoTestSeeder extends Seeder
{
    public function run(): void
    {
        $test = Test::updateOrCreate(
            ['slug' => 'prueba-de-demostracion'],
            [
                'name' => 'Prueba de demostración',
                'category' => 'personalidad',
                'description' => 'Prueba ficticia para desarrollo. No es un instrumento real.',
                'duration_min' => 5,
                'item_count' => 12,
                'allows_back' => true,
                'requires_license' => false,
                'active' => true,
            ]
        );

        $scales = [
            'RES' => 'Orientación a resultados',
            'COL' => 'Colaboración',
            'ADA' => 'Adaptabilidad',
        ];
        $scaleModels = [];
        foreach ($scales as $code => $name) {
            $scaleModels[$code] = Scale::updateOrCreate(
                ['test_id' => $test->id, 'code' => $code],
                ['name' => $name]
            );
        }

        // 12 reactivos: 4 por escala, algunos invertidos
        $items = [
            ['RES', 'Me fijo metas ambiciosas en el trabajo.', false],
            ['RES', 'Disfruto medir mi avance con indicadores.', false],
            ['RES', 'Pospongo las tareas difíciles.', true],
            ['RES', 'Persisto aunque el resultado tarde.', false],
            ['COL', 'Comparto información con mi equipo sin que me la pidan.', false],
            ['COL', 'Prefiero trabajar solo que en equipo.', true],
            ['COL', 'Escucho las ideas de mis compañeros antes de decidir.', false],
            ['COL', 'Me cuesta pedir ayuda.', true],
            ['ADA', 'Me adapto rápido a cambios de prioridad.', false],
            ['ADA', 'Los cambios de última hora me estresan mucho.', true],
            ['ADA', 'Pruebo formas nuevas de hacer las cosas.', false],
            ['ADA', 'Prefiero que todo siga igual.', true],
        ];

        foreach ($items as $index => [$scaleCode, $prompt, $reverse]) {
            $item = Item::updateOrCreate(
                ['test_id' => $test->id, 'order' => $index + 1],
                ['prompt' => $prompt, 'scale_id' => $scaleModels[$scaleCode]->id, 'reverse_scored' => $reverse]
            );
            $labels = [
                1 => 'Totalmente en desacuerdo',
                2 => 'En desacuerdo',
                3 => 'Neutral',
                4 => 'De acuerdo',
                5 => 'Totalmente de acuerdo',
            ];
            foreach ($labels as $value => $label) {
                ItemOption::updateOrCreate(
                    ['item_id' => $item->id, 'value' => $value],
                    ['label' => $label]
                );
            }
        }

        // Regla de calificación v1: suma por escala (invierte reverse: 6 - value), normaliza 4..20 -> 0..100
        ScoringRule::updateOrCreate(
            ['test_id' => $test->id, 'version' => 1],
            ['algorithm' => [
                'type' => 'likert_sum',
                'min_raw' => 4,
                'max_raw' => 20,
                'reverse_base' => 6,
            ]]
        );

        // Baremo v1: umbrales de normalized -> categoría; percentil por interpolación lineal simple
        Norm::updateOrCreate(
            ['test_id' => $test->id, 'version' => 1],
            ['data' => [
                'thresholds' => [
                    ['max' => 33.999, 'category' => 'bajo'],
                    ['max' => 66.0, 'category' => 'medio'],
                    ['max' => 100.0, 'category' => 'alto'],
                ],
            ]]
        );
    }
}
```

- [ ] **Step 2: Registrar en DatabaseSeeder**

En `backend/database/seeders/DatabaseSeeder.php`, dentro de `run()`, agregar:

```php
$this->call(DemoTestSeeder::class);
```

- [ ] **Step 3: Ejecutar y verificar**

```bash
php artisan migrate:fresh --seed
php artisan tinker --execute 'echo App\Models\Test::first()->items()->count();'
```

Expected: imprime `12`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add demo test seeder (12 items, 3 scales, scoring rule v1, norm v1)"
```

---

## Task 6: ScoringService (TDD)

**Files:**
- Create: `backend/app/Services/ScoringService.php`
- Test: `backend/tests/Feature/ScoringServiceTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/ScoringServiceTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Answer;
use App\Models\Attempt;
use App\Models\Candidate;
use App\Models\Assessment;
use App\Models\Invitation;
use App\Models\Organization;
use App\Models\Test as TestModel;
use App\Services\ScoringService;
use Database\Seeders\DemoTestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScoringServiceTest extends TestCase
{
    use RefreshDatabase;

    private function completedAttemptAllFives(): Attempt
    {
        $this->seed(DemoTestSeeder::class);
        $test = TestModel::first();
        $org = Organization::create(['name' => 'ACME']);
        $assessment = Assessment::create(['organization_id' => $org->id, 'name' => 'Ventas']);
        $assessment->tests()->attach($test->id, ['order' => 1]);
        $candidate = Candidate::create(['name' => 'Juan', 'email' => 'j@a.com']);
        $inv = Invitation::create([
            'assessment_id' => $assessment->id,
            'candidate_id' => $candidate->id,
            'token' => str()->random(40),
        ]);
        $attempt = Attempt::create(['invitation_id' => $inv->id, 'test_id' => $test->id, 'status' => 'en_progreso']);
        foreach ($test->items as $item) {
            Answer::create(['attempt_id' => $attempt->id, 'item_id' => $item->id, 'value' => 5, 'responded_at' => now()]);
        }
        return $attempt;
    }

    public function test_scores_all_fives_gives_extreme_values_respecting_reverse(): void
    {
        $attempt = $this->completedAttemptAllFives();

        app(ScoringService::class)->score($attempt);

        // Cada escala tiene 4 reactivos, 2 directos (5) y 2 inversos (6-5=1) en RES? Verificamos por escala real.
        $scores = $attempt->scores()->with('scale')->get()->keyBy(fn ($s) => $s->scale->code);

        // RES: items reverse = [item3]; directos 3, inverso 1 -> raw = 5+5+1+5 = 16
        $this->assertEquals(16, $scores['RES']->raw);
        // COL: reverse = 2 (item6,item8); directos 2 -> raw = 5+1+5+1 = 12
        $this->assertEquals(12, $scores['COL']->raw);
        // ADA: reverse = 2 (item10,item12); directos 2 -> raw = 5+1+5+1 = 12
        $this->assertEquals(12, $scores['ADA']->raw);

        // normalized RES = (16-4)/16*100 = 75 -> categoría alto
        $this->assertEqualsWithDelta(75.0, $scores['RES']->normalized, 0.01);
        $this->assertEquals('alto', $scores['RES']->category);
        // versiones persistidas
        $this->assertEquals(1, $scores['RES']->scoring_rule_version);
        $this->assertEquals(1, $scores['RES']->norm_version);
    }

    public function test_scores_do_not_change_when_norm_version_added_later(): void
    {
        $attempt = $this->completedAttemptAllFives();
        app(ScoringService::class)->score($attempt);
        $before = $attempt->scores()->where('scoring_rule_version', 1)->count();

        // Agregar un baremo v2 no debe recalcular scores existentes
        \App\Models\Norm::create(['test_id' => TestModel::first()->id, 'version' => 2, 'data' => ['thresholds' => []]]);

        $this->assertEquals(3, $before);
        $this->assertEquals(1, $attempt->scores()->first()->norm_version);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/ScoringServiceTest.php
```

Expected: FAIL — `Class App\Services\ScoringService not found`.

- [ ] **Step 3: Implementar ScoringService**

Crear `backend/app/Services/ScoringService.php`:

```php
<?php

namespace App\Services;

use App\Models\Attempt;
use App\Models\Score;

class ScoringService
{
    public function score(Attempt $attempt): void
    {
        $test = $attempt->test()->with(['scales', 'items'])->first();
        $rule = $test->latestScoringRule();
        $norm = $test->latestNorm();
        $reverseBase = $rule->algorithm['reverse_base'] ?? 6;
        $minRaw = $rule->algorithm['min_raw'] ?? 4;
        $maxRaw = $rule->algorithm['max_raw'] ?? 20;

        $answers = $attempt->answers()->get()->keyBy('item_id');
        $items = $test->items;

        // Agrupar reactivos por escala
        $byScale = [];
        foreach ($items as $item) {
            $answer = $answers->get($item->id);
            if (! $answer) {
                continue;
            }
            $value = $item->reverse_scored ? ($reverseBase - $answer->value) : $answer->value;
            $byScale[$item->scale_id][] = $value;
        }

        foreach ($test->scales as $scale) {
            $values = $byScale[$scale->id] ?? [];
            $raw = array_sum($values);
            $normalized = $maxRaw > $minRaw
                ? max(0.0, min(100.0, ($raw - $minRaw) / ($maxRaw - $minRaw) * 100))
                : 0.0;
            $category = $this->category($normalized, $norm->data['thresholds'] ?? []);

            Score::updateOrCreate(
                ['attempt_id' => $attempt->id, 'scale_id' => $scale->id],
                [
                    'raw' => $raw,
                    'normalized' => round($normalized, 2),
                    'percentile' => (int) round($normalized),
                    'category' => $category,
                    'scoring_rule_version' => $rule->version,
                    'norm_version' => $norm->version,
                ]
            );
        }
    }

    private function category(float $normalized, array $thresholds): string
    {
        foreach ($thresholds as $t) {
            if ($normalized <= $t['max']) {
                return $t['category'];
            }
        }
        return $thresholds ? end($thresholds)['category'] : 'medio';
    }
}
```

- [ ] **Step 4: Correr y ver pasar**

```bash
php artisan test tests/Feature/ScoringServiceTest.php
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add versioned ScoringService with tests"
```

---

## Task 7: Endpoints de autenticación (registro/login)

**Files:**
- Create: `backend/app/Http/Controllers/Auth/RegisterController.php`, `SessionController.php`, `backend/app/Http/Requests/RegisterRequest.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/AuthTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/AuthTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_organization_and_admin(): void
    {
        $res = $this->postJson('/register', [
            'name' => 'Ana',
            'email' => 'ana@empresa.com',
            'password' => 'secret123',
            'company_name' => 'Empresa SA',
            'sector' => 'comercio',
            'company_size' => '11-50',
        ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('organizations', ['name' => 'Empresa SA']);
        $user = User::where('email', 'ana@empresa.com')->first();
        $this->assertNotNull($user->organization_id);
        $this->assertEquals('admin', $user->role);
    }

    public function test_register_requires_email(): void
    {
        $this->postJson('/register', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password', 'company_name']);
    }

    public function test_login_and_user_endpoint(): void
    {
        $this->postJson('/register', [
            'name' => 'Ana', 'email' => 'ana@empresa.com', 'password' => 'secret123',
            'company_name' => 'Empresa SA', 'sector' => 'comercio', 'company_size' => '11-50',
        ])->assertStatus(201);

        $this->postJson('/login', ['email' => 'ana@empresa.com', 'password' => 'secret123'])
            ->assertStatus(200);

        $this->getJson('/user')->assertStatus(200)->assertJsonPath('email', 'ana@empresa.com');
    }

    public function test_login_rejects_bad_credentials(): void
    {
        $this->postJson('/login', ['email' => 'x@y.com', 'password' => 'nope'])
            ->assertStatus(422);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/AuthTest.php
```

Expected: FAIL — rutas 404.

- [ ] **Step 3: Crear RegisterRequest**

Crear `backend/app/Http/Requests/RegisterRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'company_name' => ['required', 'string', 'max:255'],
            'sector' => ['nullable', 'in:comercio,manufactura,servicios,otro'],
            'company_size' => ['nullable', 'in:1-10,11-50,51-250,250+'],
        ];
    }
}
```

- [ ] **Step 4: Crear RegisterController**

Crear `backend/app/Http/Controllers/Auth/RegisterController.php`:

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class RegisterController extends Controller
{
    public function store(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $org = Organization::create([
            'name' => $data['company_name'],
            'sector' => $data['sector'] ?? null,
            'size' => $data['company_size'] ?? null,
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'organization_id' => $org->id,
            'role' => 'admin',
        ]);

        Auth::login($user);

        return response()->json(['user' => $user], 201);
    }
}
```

- [ ] **Step 5: Crear SessionController**

Crear `backend/app/Http/Controllers/Auth/SessionController.php`:

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class SessionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, true)) {
            throw ValidationException::withMessages(['email' => 'Credenciales incorrectas.']);
        }

        $request->session()->regenerate();

        return response()->json(['user' => Auth::user()]);
    }

    public function destroy(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(null, 204);
    }
}
```

- [ ] **Step 6: Registrar rutas**

Reemplazar `backend/routes/api.php`:

```php
<?php

use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\SessionController;
use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;

Route::post('leads', [LeadController::class, 'store']);

Route::post('register', [RegisterController::class, 'store']);
Route::post('login', [SessionController::class, 'store']);
Route::post('logout', [SessionController::class, 'destroy']);
Route::middleware('auth:sanctum')->get('user', fn (\Illuminate\Http\Request $r) => $r->user());
```

Nota: estas rutas viven en `routes/api.php` que Sanctum sirve con prefijo `/api` salvo que se registren aparte. Para que las URLs sean `/register`, `/login`, `/user` (sin `/api`), registrarlas en `routes/web.php` en su lugar **si** se requiere sin prefijo. Para Fase 1 se usan con prefijo: el frontend llamará `/api/register`, `/api/login`, `/api/user`, `/api/logout`. Actualizar los tests para usar `/api/...`:

En `AuthTest.php`, cambiar `/register`→`/api/register`, `/login`→`/api/login`, `/user`→`/api/user`.

- [ ] **Step 7: Correr y ver pasar**

```bash
php artisan test tests/Feature/AuthTest.php
```

Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add register/login/logout endpoints (Sanctum session)"
```

---

## Task 8: Creación de evaluación (TDD)

**Files:**
- Create: `backend/app/Http/Controllers/AssessmentController.php`, `backend/app/Http/Requests/StoreAssessmentRequest.php`, `backend/app/Notifications/InvitationNotification.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/AssessmentTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/AssessmentTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Test as TestModel;
use App\Models\User;
use Database\Seeders\DemoTestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AssessmentTest extends TestCase
{
    use RefreshDatabase;

    private function actingUser(): User
    {
        $org = Organization::create(['name' => 'ACME']);
        $user = User::create(['name' => 'A', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
        $this->actingAs($user);
        return $user;
    }

    public function test_creates_assessment_with_invitations_and_tokens(): void
    {
        Notification::fake();
        $this->seed(DemoTestSeeder::class);
        $this->actingUser();
        $test = TestModel::first();

        $res = $this->postJson('/api/assessments', [
            'name' => 'Vendedores Q4',
            'position' => 'Ejecutivo de ventas',
            'test_ids' => [$test->id],
            'candidates' => [
                ['name' => 'Juan Pérez', 'email' => 'juan@x.com'],
                ['name' => 'Ana López', 'email' => 'ana@x.com'],
            ],
            'deadline' => '2026-12-01',
        ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('assessments', ['name' => 'Vendedores Q4']);
        $this->assertDatabaseCount('invitations', 2);
        $res->assertJsonCount(2, 'data.invitations');
        $res->assertJsonPath('data.invitations.0.link', fn ($link) => str_contains($link, '/evaluar/'));
    }

    public function test_requires_candidates_and_tests(): void
    {
        $this->actingUser();
        $this->postJson('/api/assessments', ['name' => 'X'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['test_ids', 'candidates']);
    }

    public function test_unauthenticated_cannot_create(): void
    {
        $this->postJson('/api/assessments', [])->assertStatus(401);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/AssessmentTest.php
```

Expected: FAIL — ruta/controlador ausente.

- [ ] **Step 3: Crear la notificación de invitación**

```bash
php artisan make:notification InvitationNotification
```

Reemplazar `backend/app/Notifications/InvitationNotification.php`:

```php
<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvitationNotification extends Notification
{
    use Queueable;

    public function __construct(public Invitation $invitation, public string $link) {}

    public function via(object $notifiable): array { return ['mail']; }

    public function toMail(object $notifiable): MailMessage
    {
        $assessment = $this->invitation->assessment;
        return (new MailMessage)
            ->subject("Te invitaron a una evaluación — {$assessment->organization->name}")
            ->greeting('Hola')
            ->line("La empresa {$assessment->organization->name} te invita a responder una evaluación.")
            ->line('Puedes responder desde tu celular. Toma unos minutos.')
            ->action('Responder evaluación', $this->link)
            ->line($this->invitation->expires_at ? "Fecha límite: {$this->invitation->expires_at->format('d/m/Y')}" : '');
    }
}
```

- [ ] **Step 4: Crear StoreAssessmentRequest**

Crear `backend/app/Http/Requests/StoreAssessmentRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssessmentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'test_ids' => ['required', 'array', 'min:1'],
            'test_ids.*' => ['integer', 'exists:tests,id'],
            'candidates' => ['required', 'array', 'min:1'],
            'candidates.*.name' => ['required', 'string', 'max:255'],
            'candidates.*.email' => ['required', 'email', 'max:255'],
            'candidates.*.phone' => ['nullable', 'string', 'max:30'],
            'deadline' => ['nullable', 'date'],
        ];
    }
}
```

- [ ] **Step 5: Crear AssessmentController**

Crear `backend/app/Http/Controllers/AssessmentController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAssessmentRequest;
use App\Models\Assessment;
use App\Models\Candidate;
use App\Models\Invitation;
use App\Notifications\InvitationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class AssessmentController extends Controller
{
    public function store(StoreAssessmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $assessment = Assessment::create([
            'organization_id' => $user->organization_id,
            'name' => $data['name'],
            'position' => $data['position'] ?? null,
            'deadline' => $data['deadline'] ?? null,
            'status' => 'activa',
        ]);

        foreach ($data['test_ids'] as $order => $testId) {
            $assessment->tests()->attach($testId, ['order' => $order + 1]);
        }

        $invitations = [];
        foreach ($data['candidates'] as $c) {
            $candidate = Candidate::create(['name' => $c['name'], 'email' => $c['email'], 'phone' => $c['phone'] ?? null]);
            $invitation = Invitation::create([
                'assessment_id' => $assessment->id,
                'candidate_id' => $candidate->id,
                'token' => Str::random(40),
                'status' => 'pendiente',
                'sent_at' => now(),
                'expires_at' => $data['deadline'] ?? null,
            ]);
            $link = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/')."/evaluar/{$invitation->token}";
            Notification::route('mail', $candidate->email)->notify(new InvitationNotification($invitation, $link));
            $invitations[] = ['id' => $invitation->id, 'candidate' => $candidate->name, 'email' => $candidate->email, 'status' => $invitation->status, 'link' => $link];
        }

        return response()->json(['data' => [
            'id' => $assessment->id,
            'name' => $assessment->name,
            'invitations' => $invitations,
        ]], 201);
    }

    public function show(Assessment $assessment): JsonResponse
    {
        abort_unless($assessment->organization_id === request()->user()->organization_id, 403);
        $assessment->load(['invitations.candidate', 'tests']);
        $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        return response()->json(['data' => [
            'id' => $assessment->id,
            'name' => $assessment->name,
            'position' => $assessment->position,
            'invitations' => $assessment->invitations->map(fn ($inv) => [
                'id' => $inv->id,
                'candidate' => $inv->candidate->name,
                'email' => $inv->candidate->email,
                'status' => $inv->status,
                'link' => "{$frontend}/evaluar/{$inv->token}",
            ]),
        ]]);
    }
}
```

- [ ] **Step 6: Registrar rutas protegidas**

En `backend/routes/api.php`, agregar dentro de un grupo `auth:sanctum` (junto a `user`):

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', fn (\Illuminate\Http\Request $r) => $r->user());
    Route::post('assessments', [\App\Http\Controllers\AssessmentController::class, 'store']);
    Route::get('assessments/{assessment}', [\App\Http\Controllers\AssessmentController::class, 'show']);
});
```

(Quitar la línea suelta de `user` del Task 7 para no duplicarla.)

- [ ] **Step 7: Añadir frontend_url a config/app.php**

En `backend/config/app.php`, agregar en el array de retorno:

```php
'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
```

- [ ] **Step 8: Correr y ver pasar**

```bash
php artisan test tests/Feature/AssessmentTest.php
```

Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: assessment creation with invitations, tokens, and email"
```

---

## Task 9: API del portal del candidato (TDD)

**Files:**
- Create: `backend/app/Http/Controllers/CandidatePortalController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/CandidatePortalTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/CandidatePortalTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Candidate;
use App\Models\Invitation;
use App\Models\Organization;
use App\Models\Test as TestModel;
use Database\Seeders\DemoTestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CandidatePortalTest extends TestCase
{
    use RefreshDatabase;

    private function makeInvitation(): Invitation
    {
        $this->seed(DemoTestSeeder::class);
        $test = TestModel::first();
        $org = Organization::create(['name' => 'ACME']);
        $assessment = Assessment::create(['organization_id' => $org->id, 'name' => 'Ventas']);
        $assessment->tests()->attach($test->id, ['order' => 1]);
        $candidate = Candidate::create(['name' => 'Juan', 'email' => 'j@a.com']);
        return Invitation::create([
            'assessment_id' => $assessment->id,
            'candidate_id' => $candidate->id,
            'token' => 'TESTTOKEN123',
            'status' => 'pendiente',
        ]);
    }

    public function test_get_by_token_returns_welcome_payload(): void
    {
        $this->makeInvitation();
        $this->getJson('/api/evaluar/TESTTOKEN123')
            ->assertStatus(200)
            ->assertJsonPath('data.organization', 'ACME')
            ->assertJsonPath('data.status', 'pendiente')
            ->assertJsonCount(1, 'data.tests');
    }

    public function test_unknown_token_returns_404(): void
    {
        $this->getJson('/api/evaluar/NOPE')->assertStatus(404);
    }

    public function test_consent_then_answers_then_complete_scores(): void
    {
        $inv = $this->makeInvitation();
        $test = TestModel::first();

        $this->postJson("/api/evaluar/{$inv->token}/consent", ['privacy_version' => 'v1'])
            ->assertStatus(201);
        $this->assertDatabaseHas('consents', ['invitation_id' => $inv->id]);

        // responder los 12 reactivos
        foreach ($test->items as $item) {
            $this->postJson("/api/evaluar/{$inv->token}/answers", [
                'test_id' => $test->id,
                'item_id' => $item->id,
                'value' => 4,
                'elapsed_ms' => 1200,
            ])->assertStatus(200);
        }

        $this->postJson("/api/evaluar/{$inv->token}/complete")->assertStatus(200);

        $inv->refresh();
        $this->assertEquals('completada', $inv->status);
        $this->assertDatabaseCount('scores', 3); // 3 escalas
    }

    public function test_completed_token_cannot_answer_again(): void
    {
        $inv = $this->makeInvitation();
        $inv->update(['status' => 'completada', 'completed_at' => now()]);

        $this->postJson("/api/evaluar/{$inv->token}/answers", [
            'test_id' => TestModel::first()->id, 'item_id' => 1, 'value' => 3,
        ])->assertStatus(409);
    }

    public function test_autosave_is_idempotent_per_item(): void
    {
        $inv = $this->makeInvitation();
        $test = TestModel::first();
        $item = $test->items->first();
        $this->postJson("/api/evaluar/{$inv->token}/consent", ['privacy_version' => 'v1']);

        $this->postJson("/api/evaluar/{$inv->token}/answers", ['test_id' => $test->id, 'item_id' => $item->id, 'value' => 2]);
        $this->postJson("/api/evaluar/{$inv->token}/answers", ['test_id' => $test->id, 'item_id' => $item->id, 'value' => 5]);

        $this->assertDatabaseCount('answers', 1);
        $this->assertDatabaseHas('answers', ['item_id' => $item->id, 'value' => 5]);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/CandidatePortalTest.php
```

Expected: FAIL — rutas ausentes.

- [ ] **Step 3: Crear CandidatePortalController**

Crear `backend/app/Http/Controllers/CandidatePortalController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Consent;
use App\Models\Invitation;
use App\Services\ScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidatePortalController extends Controller
{
    private function resolve(string $token): Invitation
    {
        return Invitation::where('token', $token)->firstOrFail();
    }

    public function show(string $token): JsonResponse
    {
        $inv = $this->resolve($token);

        if ($inv->expires_at && $inv->expires_at->isPast() && $inv->status !== 'completada') {
            $inv->update(['status' => 'expirada']);
        }

        $inv->load(['assessment.organization', 'assessment.tests']);

        return response()->json(['data' => [
            'status' => $inv->status,
            'organization' => $inv->assessment->organization->name,
            'position' => $inv->assessment->position,
            'tests' => $inv->assessment->tests->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'duration_min' => $t->duration_min,
                'item_count' => $t->item_count,
                'allows_back' => $t->allows_back,
            ]),
            'consented' => $inv->consent()->exists(),
        ]]);
    }

    public function consent(Request $request, string $token): JsonResponse
    {
        $inv = $this->resolve($token);
        $this->assertAnswerable($inv);

        Consent::updateOrCreate(
            ['invitation_id' => $inv->id],
            [
                'accepted_at' => now(),
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
                'privacy_version' => $request->input('privacy_version', 'v1'),
            ]
        );

        if ($inv->status === 'pendiente') {
            $inv->update(['status' => 'iniciada', 'opened_at' => now()]);
        }

        return response()->json(['ok' => true], 201);
    }

    public function items(string $token, int $testId): JsonResponse
    {
        $inv = $this->resolve($token);
        $test = $inv->assessment->tests()->where('tests.id', $testId)->firstOrFail();
        $test->load('items.options');
        $attempt = $this->currentAttempt($inv, $testId);
        $answered = $attempt->answers()->pluck('value', 'item_id');

        return response()->json(['data' => [
            'test' => ['id' => $test->id, 'name' => $test->name, 'allows_back' => $test->allows_back],
            'items' => $test->items->map(fn ($it) => [
                'id' => $it->id,
                'order' => $it->order,
                'prompt' => $it->prompt,
                'options' => $it->options->map(fn ($o) => ['label' => $o->label, 'value' => $o->value]),
                'answered' => $answered[$it->id] ?? null,
            ]),
        ]]);
    }

    public function answer(Request $request, string $token): JsonResponse
    {
        $inv = $this->resolve($token);
        $this->assertAnswerable($inv);
        $data = $request->validate([
            'test_id' => ['required', 'integer'],
            'item_id' => ['required', 'integer'],
            'value' => ['required', 'integer'],
            'elapsed_ms' => ['nullable', 'integer', 'min:0'],
        ]);

        $attempt = $this->currentAttempt($inv, $data['test_id']);
        $attempt->answers()->updateOrCreate(
            ['item_id' => $data['item_id']],
            ['value' => $data['value'], 'responded_at' => now(), 'elapsed_ms' => $data['elapsed_ms'] ?? 0]
        );

        return response()->json(['ok' => true]);
    }

    public function event(Request $request, string $token): JsonResponse
    {
        $inv = $this->resolve($token);
        $data = $request->validate([
            'test_id' => ['required', 'integer'],
            'type' => ['required', 'string', 'max:30'],
            'payload' => ['nullable', 'array'],
        ]);
        $attempt = $this->currentAttempt($inv, $data['test_id']);
        $attempt->events()->create(['type' => $data['type'], 'payload' => $data['payload'] ?? null, 'created_at' => now()]);

        return response()->json(['ok' => true], 201);
    }

    public function complete(string $token, ScoringService $scoring): JsonResponse
    {
        $inv = $this->resolve($token);
        $this->assertAnswerable($inv);

        foreach ($inv->attempts()->where('status', 'en_progreso')->get() as $attempt) {
            $attempt->update(['status' => 'completada', 'finished_at' => now()]);
            $scoring->score($attempt);
        }

        $inv->update(['status' => 'completada', 'completed_at' => now()]);

        return response()->json(['ok' => true]);
    }

    private function currentAttempt(Invitation $inv, int $testId): Attempt
    {
        return $inv->attempts()->firstOrCreate(
            ['test_id' => $testId],
            ['status' => 'en_progreso', 'started_at' => now()]
        );
    }

    private function assertAnswerable(Invitation $inv): void
    {
        abort_if(in_array($inv->status, ['completada', 'expirada'], true), 409, 'La evaluación ya no admite respuestas.');
    }
}
```

- [ ] **Step 4: Registrar rutas públicas del portal**

En `backend/routes/api.php`, agregar (fuera del grupo auth):

```php
Route::prefix('evaluar')->group(function () {
    Route::get('{token}', [\App\Http\Controllers\CandidatePortalController::class, 'show']);
    Route::get('{token}/pruebas/{testId}', [\App\Http\Controllers\CandidatePortalController::class, 'items']);
    Route::post('{token}/consent', [\App\Http\Controllers\CandidatePortalController::class, 'consent']);
    Route::post('{token}/answers', [\App\Http\Controllers\CandidatePortalController::class, 'answer']);
    Route::post('{token}/events', [\App\Http\Controllers\CandidatePortalController::class, 'event']);
    Route::post('{token}/complete', [\App\Http\Controllers\CandidatePortalController::class, 'complete']);
});
```

- [ ] **Step 5: Correr y ver pasar**

```bash
php artisan test tests/Feature/CandidatePortalTest.php
```

Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: candidate portal API (token flow, consent, autosave, scoring on complete)"
```

---

## Task 10: Endpoint de datos del reporte (TDD)

**Files:**
- Create: `backend/app/Http/Controllers/ReportController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/ReportTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/ReportTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Candidate;
use App\Models\Invitation;
use App\Models\Organization;
use App\Models\Test as TestModel;
use App\Models\User;
use App\Services\ScoringService;
use Database\Seeders\DemoTestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_returns_scales_and_categories(): void
    {
        $this->seed(DemoTestSeeder::class);
        $test = TestModel::first();
        $org = Organization::create(['name' => 'ACME']);
        $user = User::create(['name' => 'A', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
        $assessment = Assessment::create(['organization_id' => $org->id, 'name' => 'Ventas', 'position' => 'Vendedor']);
        $assessment->tests()->attach($test->id, ['order' => 1]);
        $candidate = Candidate::create(['name' => 'Juan', 'email' => 'j@a.com']);
        $inv = Invitation::create(['assessment_id' => $assessment->id, 'candidate_id' => $candidate->id, 'token' => 'T', 'status' => 'completada']);
        $attempt = $inv->attempts()->create(['test_id' => $test->id, 'status' => 'completada']);
        foreach ($test->items as $item) {
            $attempt->answers()->create(['item_id' => $item->id, 'value' => 4, 'responded_at' => now()]);
        }
        app(ScoringService::class)->score($attempt);

        $this->actingAs($user)
            ->getJson("/api/invitations/{$inv->id}/report")
            ->assertStatus(200)
            ->assertJsonPath('data.candidate', 'Juan')
            ->assertJsonPath('data.position', 'Vendedor')
            ->assertJsonCount(1, 'data.tests')
            ->assertJsonCount(3, 'data.tests.0.scales');
    }

    public function test_incomplete_invitation_report_is_409(): void
    {
        $org = Organization::create(['name' => 'ACME']);
        $user = User::create(['name' => 'A', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
        $assessment = Assessment::create(['organization_id' => $org->id, 'name' => 'V']);
        $candidate = Candidate::create(['name' => 'Juan', 'email' => 'j@a.com']);
        $inv = Invitation::create(['assessment_id' => $assessment->id, 'candidate_id' => $candidate->id, 'token' => 'T2', 'status' => 'pendiente']);

        $this->actingAs($user)->getJson("/api/invitations/{$inv->id}/report")->assertStatus(409);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/ReportTest.php
```

Expected: FAIL — ruta ausente.

- [ ] **Step 3: Crear ReportController**

Crear `backend/app/Http/Controllers/ReportController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function show(Request $request, Invitation $invitation): JsonResponse
    {
        $invitation->load('assessment.organization', 'candidate', 'attempts.test.scales', 'attempts.scores.scale', 'attempts.events');
        abort_unless($invitation->assessment->organization_id === $request->user()->organization_id, 403);
        abort_unless($invitation->status === 'completada', 409, 'La evaluación no está completada.');

        $tests = $invitation->attempts->map(function ($attempt) {
            $scoresByScale = $attempt->scores->keyBy('scale_id');
            return [
                'name' => $attempt->test->name,
                'integrity' => [
                    'blur_count' => $attempt->events->where('type', 'blur')->count(),
                ],
                'scales' => $attempt->test->scales->map(function ($scale) use ($scoresByScale) {
                    $score = $scoresByScale->get($scale->id);
                    return [
                        'code' => $scale->code,
                        'name' => $scale->name,
                        'normalized' => $score?->normalized,
                        'percentile' => $score?->percentile,
                        'category' => $score?->category,
                        'interpretation' => $this->interpret($scale->name, $score?->category),
                    ];
                })->values(),
            ];
        });

        // Preguntas de entrevista: escalas con categoría extrema
        $questions = [];
        foreach ($invitation->attempts as $attempt) {
            foreach ($attempt->scores as $score) {
                if (in_array($score->category, ['bajo', 'alto'], true)) {
                    $scaleName = $attempt->test->scales->firstWhere('id', $score->scale_id)?->name;
                    $questions[] = "Cuéntame de una situación reciente relacionada con «{$scaleName}».";
                }
            }
        }

        return response()->json(['data' => [
            'candidate' => $invitation->candidate->name,
            'position' => $invitation->assessment->position,
            'assessment' => $invitation->assessment->name,
            'organization' => $invitation->assessment->organization->name,
            'completed_at' => $invitation->completed_at?->format('d/m/Y'),
            'tests' => $tests,
            'interview_questions' => array_values(array_unique($questions)),
        ]]);
    }

    private function interpret(string $scale, ?string $category): string
    {
        return match ($category) {
            'alto' => "Puntaje alto en {$scale}: es una fortaleza marcada del candidato.",
            'medio' => "Puntaje medio en {$scale}: dentro del promedio esperado.",
            'bajo' => "Puntaje bajo en {$scale}: podría ser un área a explorar en entrevista.",
            default => 'Sin datos suficientes.',
        };
    }
}
```

- [ ] **Step 4: Registrar ruta**

En `backend/routes/api.php`, dentro del grupo `auth:sanctum`:

```php
Route::get('invitations/{invitation}/report', [\App\Http\Controllers\ReportController::class, 'show']);
```

- [ ] **Step 5: Correr y ver pasar**

```bash
php artisan test tests/Feature/ReportTest.php
php artisan test
```

Expected: PASS (todos los tests de la suite).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: individual report data endpoint with interview questions"
```

---

## Task 11: Frontend — Sanctum axios + contexto de auth

**Files:**
- Modify: `frontend/src/api/axios.ts`
- Create: `frontend/src/api/auth.ts`, `frontend/src/context/AuthContext.tsx`, `frontend/src/components/RequireAuth.tsx`

- [ ] **Step 1: Axios con credenciales y CSRF**

Reemplazar `frontend/src/api/axios.ts`:

```ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
})

export async function csrf(): Promise<void> {
  await api.get('/sanctum/csrf-cookie')
}

export default api
```

- [ ] **Step 2: Funciones de auth**

Crear `frontend/src/api/auth.ts`:

```ts
import api, { csrf } from './axios'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  organization_id: number
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  company_name: string
  sector: string
  company_size: string
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  await csrf()
  const { data } = await api.post('/api/register', payload)
  return data.user
}

export async function login(email: string, password: string): Promise<AuthUser> {
  await csrf()
  const { data } = await api.post('/api/login', { email, password })
  return data.user
}

export async function logout(): Promise<void> {
  await api.post('/api/logout')
}

export async function fetchUser(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get('/api/user')
    return data
  } catch {
    return null
  }
}
```

- [ ] **Step 3: AuthContext**

Crear `frontend/src/context/AuthContext.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchUser, type AuthUser } from '@/api/auth'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  setUser: (u: AuthUser | null) => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser().then(u => { setUser(u); setLoading(false) })
  }, [])

  return <AuthContext.Provider value={{ user, loading, setUser }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
```

- [ ] **Step 4: RequireAuth**

Crear `frontend/src/components/RequireAuth.tsx`:

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { ReactNode } from 'react'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ padding: '2rem' }}>Cargando…</p>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 5: Verificar compila**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: frontend Sanctum axios, auth context and route guard"
```

---

## Task 12: Frontend — páginas Registro y Login

**Files:**
- Create: `frontend/src/pages/auth/Registro.tsx`, `Login.tsx`, `frontend/src/pages/auth/Auth.css`
- Modify: `frontend/src/App.tsx`, `frontend/src/main.tsx`

- [ ] **Step 1: CSS de auth**

Crear `frontend/src/pages/auth/Auth.css`:

```css
.auth {
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: var(--sp-6);
  background-color: var(--color-surface-secondary);
}
.auth__card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border: 1px solid var(--color-timberwolf);
  border-radius: var(--radius-md);
  padding: var(--sp-8);
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}
.auth__title { font-size: var(--text-2xl); color: var(--color-brunswick); }
.auth__field { display: flex; flex-direction: column; gap: var(--sp-2); }
.auth__label { font-size: var(--text-sm); font-weight: 500; color: var(--color-brunswick); }
.auth__input, .auth__select {
  padding: var(--sp-3) var(--sp-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-base);
}
.auth__input:focus, .auth__select:focus { border-color: var(--color-hunter); outline: none; }
.auth__error { font-size: var(--text-xs); color: var(--color-error); }
.auth__foot { font-size: var(--text-sm); color: var(--color-ink); }
.auth__steps { font-size: var(--text-xs); color: var(--color-ink); opacity: 0.7; }
```

- [ ] **Step 2: Página Login**

Crear `frontend/src/pages/auth/Login.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import './Auth.css'

export default function Login() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(email, password)
      setUser(user)
      navigate('/app/evaluaciones/nueva')
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSubmit}>
        <h1 className="auth__title">Entrar</h1>
        <div className="auth__field">
          <label className="auth__label" htmlFor="email">Correo</label>
          <input id="email" className="auth__input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="auth__field">
          <label className="auth__label" htmlFor="password">Contraseña</label>
          <input id="password" className="auth__input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p className="auth__error" role="alert">{error}</p>}
        <Button type="submit" loading={loading}>Entrar</Button>
        <p className="auth__foot">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Página Registro (3 pasos)**

Crear `frontend/src/pages/auth/Registro.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import './Auth.css'

export default function Registro() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    company_name: '', sector: '', company_size: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const user = await register(form)
      setUser(user)
      navigate('/app/evaluaciones/nueva')
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { errors?: Record<string, string[]> } } }).response
      if (resp?.data?.errors) {
        const mapped: Record<string, string> = {}
        for (const k in resp.data.errors) mapped[k] = resp.data.errors[k][0]
        setErrors(mapped)
        if (mapped.email || mapped.password) setStep(1)
        else if (mapped.company_name) setStep(2)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={submit}>
        <h1 className="auth__title">Crear cuenta</h1>
        <p className="auth__steps">Paso {step} de 3</p>

        {step === 1 && (
          <>
            <div className="auth__field">
              <label className="auth__label" htmlFor="name">Tu nombre</label>
              <input id="name" className="auth__input" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="auth__field">
              <label className="auth__label" htmlFor="email">Correo</label>
              <input id="email" className="auth__input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
              {errors.email && <span className="auth__error">{errors.email}</span>}
            </div>
            <div className="auth__field">
              <label className="auth__label" htmlFor="password">Contraseña (mín. 8)</label>
              <input id="password" className="auth__input" type="password" value={form.password} onChange={e => set('password', e.target.value)} required />
              {errors.password && <span className="auth__error">{errors.password}</span>}
            </div>
            <Button type="button" onClick={() => setStep(2)}>Siguiente</Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="auth__field">
              <label className="auth__label" htmlFor="company_name">Empresa</label>
              <input id="company_name" className="auth__input" value={form.company_name} onChange={e => set('company_name', e.target.value)} required />
              {errors.company_name && <span className="auth__error">{errors.company_name}</span>}
            </div>
            <div className="auth__field">
              <label className="auth__label" htmlFor="sector">Sector</label>
              <select id="sector" className="auth__select" value={form.sector} onChange={e => set('sector', e.target.value)}>
                <option value="">Selecciona…</option>
                <option value="comercio">Comercio</option>
                <option value="manufactura">Manufactura o maquila</option>
                <option value="servicios">Servicios</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="auth__field">
              <label className="auth__label" htmlFor="company_size">Tamaño</label>
              <select id="company_size" className="auth__select" value={form.company_size} onChange={e => set('company_size', e.target.value)}>
                <option value="">Selecciona…</option>
                <option value="1-10">1 – 10</option>
                <option value="11-50">11 – 50</option>
                <option value="51-250">51 – 250</option>
                <option value="250+">Más de 250</option>
              </select>
            </div>
            <Button type="button" onClick={() => setStep(3)}>Siguiente</Button>
          </>
        )}

        {step === 3 && (
          <>
            <p className="auth__foot">Al crear la cuenta te enviaremos un correo de verificación. Puedes empezar a usar Mez de inmediato.</p>
            <Button type="submit" loading={loading}>Crear cuenta</Button>
          </>
        )}

        <p className="auth__foot">¿Ya tienes cuenta? <Link to="/login">Entra</Link></p>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Envolver la app en AuthProvider**

En `frontend/src/main.tsx`, envolver `<App/>` con `<AuthProvider>` dentro de `<BrowserRouter>`:

```tsx
import '@/styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 5: Agregar rutas de auth en App.tsx**

En `frontend/src/App.tsx`, agregar rutas fuera del RootLayout (sin header del sitio):

```tsx
import Login from '@/pages/auth/Login'
import Registro from '@/pages/auth/Registro'
```

Y dentro de `<Routes>`, antes del `<Route element={<RootLayout />}>`:

```tsx
<Route path="/login" element={<Login />} />
<Route path="/registro" element={<Registro />} />
```

- [ ] **Step 6: Verificar compila**

```bash
npx tsc --noEmit && npm run build
```

Expected: build limpio.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: registro (3 steps) and login pages"
```

---

## Task 13: Frontend — layout /app y asistente de creación

**Files:**
- Create: `frontend/src/pages/app/AppLayout.tsx` + `.css`, `NuevaEvaluacion.tsx` + `.css`, `EvaluacionDetalle.tsx`
- Create: `frontend/src/api/assessments.ts`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: API de evaluaciones**

Crear `frontend/src/api/assessments.ts`:

```ts
import api from './axios'

export interface CandidateInput { name: string; email: string; phone?: string }

export interface CreateAssessmentPayload {
  name: string
  position: string
  test_ids: number[]
  candidates: CandidateInput[]
  deadline: string | null
}

export interface InvitationLink {
  id: number
  candidate: string
  email: string
  status: string
  link: string
}

export async function createAssessment(payload: CreateAssessmentPayload): Promise<{ id: number; name: string; invitations: InvitationLink[] }> {
  const { data } = await api.post('/api/assessments', payload)
  return data.data
}

export async function getAssessment(id: number): Promise<{ id: number; name: string; position: string; invitations: InvitationLink[] }> {
  const { data } = await api.get(`/api/assessments/${id}`)
  return data.data
}
```

- [ ] **Step 2: AppLayout**

Crear `frontend/src/pages/app/AppLayout.css`:

```css
.applayout { min-height: 100svh; display: flex; flex-direction: column; }
.applayout__bar {
  height: var(--header-h);
  border-bottom: 1px solid var(--color-timberwolf);
  display: flex; align-items: center; justify-content: space-between;
  padding-inline: var(--section-px);
}
.applayout__brand { font-family: var(--font-display); font-size: var(--text-xl); color: var(--color-brunswick); font-weight: 600; }
.applayout__main { flex: 1; padding: var(--sp-8) var(--section-px); max-width: 960px; margin-inline: auto; width: 100%; }
.applayout__logout { font-size: var(--text-sm); color: var(--color-hunter); background: none; }
```

Crear `frontend/src/pages/app/AppLayout.tsx`:

```tsx
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import './AppLayout.css'

export default function AppLayout() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    setUser(null)
    navigate('/login')
  }

  return (
    <div className="applayout">
      <header className="applayout__bar">
        <Link to="/app/evaluaciones/nueva" className="applayout__brand">Mez</Link>
        <button className="applayout__logout" onClick={handleLogout}>Salir</button>
      </header>
      <main className="applayout__main">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: NuevaEvaluacion (asistente 4 pasos)**

Crear `frontend/src/pages/app/NuevaEvaluacion.css`:

```css
.wizard { display: flex; flex-direction: column; gap: var(--sp-6); }
.wizard__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.wizard__step { font-size: var(--text-xs); opacity: 0.7; }
.wizard__field { display: flex; flex-direction: column; gap: var(--sp-2); }
.wizard__label { font-size: var(--text-sm); font-weight: 500; color: var(--color-brunswick); }
.wizard__input, .wizard__textarea {
  padding: var(--sp-3) var(--sp-4); border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-base);
}
.wizard__textarea { min-height: 120px; resize: vertical; }
.wizard__actions { display: flex; gap: var(--sp-3); }
.wizard__links { display: flex; flex-direction: column; gap: var(--sp-3); }
.wizard__link-row {
  display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3);
  padding: var(--sp-4); border: 1px solid var(--color-timberwolf); border-radius: var(--radius-sm);
}
.wizard__copy { font-size: var(--text-sm); color: var(--color-hunter); background: none; }
.wizard__demo { font-size: var(--text-sm); color: var(--color-ink); opacity: 0.8; }
```

Crear `frontend/src/pages/app/NuevaEvaluacion.tsx`:

```tsx
import { useState } from 'react'
import { createAssessment, type InvitationLink } from '@/api/assessments'
import Button from '@/components/ui/Button'
import './NuevaEvaluacion.css'

const DEMO_TEST_ID = 1 // la prueba de demostración es el primer test sembrado

export default function NuevaEvaluacion() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [candidatesText, setCandidatesText] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InvitationLink[] | null>(null)
  const [error, setError] = useState('')

  function parseCandidates() {
    return candidatesText.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
      const [n, email] = line.split(',').map(s => s.trim())
      return { name: n ?? '', email: email ?? '' }
    })
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const candidates = parseCandidates()
      const res = await createAssessment({
        name, position, test_ids: [DEMO_TEST_ID], candidates,
        deadline: deadline || null,
      })
      setResult(res.invitations)
      setStep(5)
    } catch {
      setError('Revisa los datos: nombre, al menos un candidato con "nombre, correo".')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="wizard">
        <h1 className="wizard__title">Evaluación creada</h1>
        <p>Comparte estos enlaces con los candidatos (correo o WhatsApp):</p>
        <div className="wizard__links">
          {result.map(inv => (
            <div key={inv.id} className="wizard__link-row">
              <span>{inv.candidate} — {inv.email}</span>
              <button className="wizard__copy" onClick={() => navigator.clipboard.writeText(inv.link)}>Copiar enlace</button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="wizard">
      <h1 className="wizard__title">Nueva evaluación</h1>
      <p className="wizard__step">Paso {step} de 4</p>

      {step === 1 && (
        <>
          <div className="wizard__field">
            <label className="wizard__label" htmlFor="name">Nombre de la evaluación</label>
            <input id="name" className="wizard__input" value={name} onChange={e => setName(e.target.value)} placeholder="Vendedores Q4" />
          </div>
          <div className="wizard__field">
            <label className="wizard__label" htmlFor="position">Puesto</label>
            <input id="position" className="wizard__input" value={position} onChange={e => setPosition(e.target.value)} placeholder="Ejecutivo de ventas" />
          </div>
          <div className="wizard__actions"><Button onClick={() => setStep(2)}>Siguiente</Button></div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="wizard__demo">Prueba incluida: <strong>Prueba de demostración</strong> (12 reactivos, 3 escalas). En esta fase solo está disponible la prueba demo.</p>
          <div className="wizard__actions">
            <Button variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
            <Button onClick={() => setStep(3)}>Siguiente</Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="wizard__field">
            <label className="wizard__label" htmlFor="cands">Candidatos (una línea por candidato: nombre, correo)</label>
            <textarea id="cands" className="wizard__textarea" value={candidatesText} onChange={e => setCandidatesText(e.target.value)} placeholder={'Juan Pérez, juan@correo.com\nAna López, ana@correo.com'} />
          </div>
          <div className="wizard__actions">
            <Button variant="ghost" onClick={() => setStep(2)}>Atrás</Button>
            <Button onClick={() => setStep(4)}>Siguiente</Button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div className="wizard__field">
            <label className="wizard__label" htmlFor="deadline">Fecha límite (opcional)</label>
            <input id="deadline" className="wizard__input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>}
          <div className="wizard__actions">
            <Button variant="ghost" onClick={() => setStep(3)}>Atrás</Button>
            <Button onClick={submit} loading={loading}>Crear y enviar</Button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rutas de /app en App.tsx**

En `frontend/src/App.tsx`, importar y agregar:

```tsx
import RequireAuth from '@/components/RequireAuth'
import AppLayout from '@/pages/app/AppLayout'
import NuevaEvaluacion from '@/pages/app/NuevaEvaluacion'
```

Dentro de `<Routes>`, agregar:

```tsx
<Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
  <Route path="evaluaciones/nueva" element={<NuevaEvaluacion />} />
</Route>
```

- [ ] **Step 5: Verificar compila**

```bash
npx tsc --noEmit && npm run build
```

Expected: build limpio.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: /app layout and new-assessment wizard with copyable links"
```

---

## Task 14: Frontend — portal del candidato

**Files:**
- Create: `frontend/src/api/candidate.ts`, `frontend/src/pages/candidate/CandidateFlow.tsx` + `.css`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: API del candidato**

Crear `frontend/src/api/candidate.ts`:

```ts
import api from './axios'

export interface PortalTest { id: number; name: string; duration_min: number; item_count: number; allows_back: boolean }
export interface PortalState { status: string; organization: string; position: string | null; tests: PortalTest[]; consented: boolean }
export interface PortalItem { id: number; order: number; prompt: string; options: { label: string; value: number }[]; answered: number | null }

export async function getPortal(token: string): Promise<PortalState> {
  const { data } = await api.get(`/api/evaluar/${token}`)
  return data.data
}
export async function getItems(token: string, testId: number): Promise<{ test: { id: number; name: string; allows_back: boolean }; items: PortalItem[] }> {
  const { data } = await api.get(`/api/evaluar/${token}/pruebas/${testId}`)
  return data.data
}
export async function sendConsent(token: string): Promise<void> {
  await api.post(`/api/evaluar/${token}/consent`, { privacy_version: 'v1' })
}
export async function saveAnswer(token: string, testId: number, itemId: number, value: number, elapsedMs: number): Promise<void> {
  await api.post(`/api/evaluar/${token}/answers`, { test_id: testId, item_id: itemId, value, elapsed_ms: elapsedMs })
}
export async function sendEvent(token: string, testId: number, type: string): Promise<void> {
  await api.post(`/api/evaluar/${token}/events`, { test_id: testId, type })
}
export async function complete(token: string): Promise<void> {
  await api.post(`/api/evaluar/${token}/complete`)
}
```

- [ ] **Step 2: CSS del portal**

Crear `frontend/src/pages/candidate/CandidateFlow.css`:

```css
.cand { min-height: 100svh; background: var(--color-surface); display: flex; flex-direction: column; }
.cand__inner { flex: 1; width: 100%; max-width: 560px; margin-inline: auto; padding: var(--sp-8) var(--sp-5); display: flex; flex-direction: column; gap: var(--sp-6); }
.cand__title { font-size: var(--text-2xl); color: var(--color-brunswick); }
.cand__text { font-size: var(--text-base); color: var(--color-ink); line-height: 1.6; }
.cand__progress { height: 6px; background: var(--color-timberwolf); border-radius: 99px; overflow: hidden; }
.cand__progress-fill { height: 100%; background: var(--color-hunter); transition: width var(--t-base); }
.cand__consent { display: flex; gap: var(--sp-3); align-items: flex-start; font-size: var(--text-sm); }
.cand__options { display: flex; flex-direction: column; gap: var(--sp-3); }
.cand__option {
  display: flex; align-items: center; gap: var(--sp-3); min-height: 44px;
  padding: var(--sp-3) var(--sp-4); border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm); font-size: var(--text-base); cursor: pointer; text-align: left; background: var(--color-surface);
}
.cand__option--selected { border-color: var(--color-hunter); background: var(--color-surface-secondary); }
.cand__nav { display: flex; justify-content: space-between; gap: var(--sp-3); }
.cand__help { font-size: var(--text-xs); color: var(--color-hunter); }
```

- [ ] **Step 3: Flujo del candidato**

Crear `frontend/src/pages/candidate/CandidateFlow.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getPortal, getItems, sendConsent, saveAnswer, sendEvent, complete,
  type PortalState, type PortalItem,
} from '@/api/candidate'
import Button from '@/components/ui/Button'
import './CandidateFlow.css'

type Stage = 'loading' | 'blocked' | 'welcome' | 'consent' | 'instructions' | 'items' | 'done'

export default function CandidateFlow() {
  const { token = '' } = useParams()
  const [stage, setStage] = useState<Stage>('loading')
  const [portal, setPortal] = useState<PortalState | null>(null)
  const [items, setItems] = useState<PortalItem[]>([])
  const [testId, setTestId] = useState<number | null>(null)
  const [idx, setIdx] = useState(0)
  const [consentChecked, setConsentChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const itemShownAt = useRef<number>(Date.now())

  useEffect(() => {
    getPortal(token).then(p => {
      setPortal(p)
      if (p.status === 'completada' || p.status === 'expirada') setStage('blocked')
      else setStage('welcome')
    }).catch(() => setStage('blocked'))
  }, [token])

  // Registro de pérdida de foco
  useEffect(() => {
    if (stage !== 'items' || testId == null) return
    function onVis() { if (document.hidden) sendEvent(token, testId!, 'blur').catch(() => {}) }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [stage, testId, token])

  const loadItems = useCallback(async () => {
    const firstTest = portal!.tests[0]
    setTestId(firstTest.id)
    const data = await getItems(token, firstTest.id)
    setItems(data.items)
    const firstUnanswered = data.items.findIndex(i => i.answered == null)
    setIdx(firstUnanswered === -1 ? data.items.length - 1 : firstUnanswered)
    itemShownAt.current = Date.now()
    setStage('items')
  }, [portal, token])

  async function acceptConsent() {
    setBusy(true)
    await sendConsent(token)
    setBusy(false)
    setStage('instructions')
  }

  async function choose(value: number) {
    const item = items[idx]
    const elapsed = Date.now() - itemShownAt.current
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, answered: value } : it))
    await saveAnswer(token, testId!, item.id, value, elapsed).catch(() => {})
  }

  async function next() {
    if (idx < items.length - 1) {
      setIdx(idx + 1)
      itemShownAt.current = Date.now()
    } else {
      setBusy(true)
      await complete(token)
      setBusy(false)
      setStage('done')
    }
  }

  if (stage === 'loading') return <div className="cand"><div className="cand__inner"><p className="cand__text">Cargando…</p></div></div>

  if (stage === 'blocked') return (
    <div className="cand"><div className="cand__inner">
      <h1 className="cand__title">Este enlace ya no está disponible</h1>
      <p className="cand__text">La evaluación fue completada o su fecha límite pasó. Si crees que es un error, contacta a la empresa que te invitó.</p>
    </div></div>
  )

  if (stage === 'welcome' && portal) return (
    <div className="cand"><div className="cand__inner">
      <h1 className="cand__title">Evaluación de {portal.organization}</h1>
      <p className="cand__text">
        Te invitaron a responder {portal.tests.length} prueba(s), alrededor de {portal.tests.reduce((a, t) => a + t.duration_min, 0)} minutos.
        Puedes pausar y volver con el mismo enlace.
      </p>
      <Button onClick={() => setStage('consent')}>Comenzar</Button>
      <a className="cand__help" href="#" onClick={e => e.preventDefault()}>¿Problemas con la prueba?</a>
    </div></div>
  )

  if (stage === 'consent') return (
    <div className="cand"><div className="cand__inner">
      <h1 className="cand__title">Consentimiento</h1>
      <p className="cand__text">Recabamos tus respuestas para generar un reporte que verá la empresa que te invitó. Se conservan de forma confidencial. Consulta el aviso de privacidad.</p>
      <label className="cand__consent">
        <input type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)} />
        Acepto que mis respuestas se usen para esta evaluación.
      </label>
      <Button disabled={!consentChecked} loading={busy} onClick={acceptConsent}>Continuar</Button>
    </div></div>
  )

  if (stage === 'instructions') return (
    <div className="cand"><div className="cand__inner">
      <h1 className="cand__title">Instrucciones</h1>
      <p className="cand__text">Responde con sinceridad; no hay respuestas correctas o incorrectas. Una pregunta por pantalla. Tus respuestas se guardan solas.</p>
      <Button loading={busy} onClick={loadItems}>Empezar</Button>
    </div></div>
  )

  if (stage === 'items' && items.length > 0) {
    const item = items[idx]
    const progress = Math.round(((idx) / items.length) * 100)
    return (
      <div className="cand"><div className="cand__inner">
        <div className="cand__progress"><div className="cand__progress-fill" style={{ width: `${progress}%` }} /></div>
        <p className="cand__text">Pregunta {idx + 1} de {items.length}</p>
        <h1 className="cand__title">{item.prompt}</h1>
        <div className="cand__options">
          {item.options.map(o => (
            <button
              key={o.value}
              className={`cand__option${item.answered === o.value ? ' cand__option--selected' : ''}`}
              onClick={() => choose(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <Button disabled={item.answered == null} loading={busy} onClick={next}>
          {idx < items.length - 1 ? 'Siguiente' : 'Terminar'}
        </Button>
      </div></div>
    )
  }

  if (stage === 'done') return (
    <div className="cand"><div className="cand__inner">
      <h1 className="cand__title">¡Gracias!</h1>
      <p className="cand__text">Tus respuestas se enviaron. La empresa se pondrá en contacto contigo.</p>
    </div></div>
  )

  return null
}
```

- [ ] **Step 4: Ruta del candidato en App.tsx**

En `frontend/src/App.tsx`, importar y agregar una ruta suelta (sin layouts del sitio ni de app):

```tsx
import CandidateFlow from '@/pages/candidate/CandidateFlow'
```

Dentro de `<Routes>`:

```tsx
<Route path="/evaluar/:token" element={<CandidateFlow />} />
```

- [ ] **Step 5: Verificar compila**

```bash
npx tsc --noEmit && npm run build
```

Expected: build limpio.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: candidate portal flow (welcome, consent, items, autosave, resume, finish)"
```

---

## Task 15: Frontend — componente de reporte reutilizable

**Files:**
- Create: `frontend/src/sections/Report.tsx` + `Report.css`, `frontend/src/api/report.ts`, `frontend/src/pages/app/ReporteCandidato.tsx`
- Modify: `frontend/src/App.tsx`, y `frontend/src/sections/SampleReport.tsx` para reusar `Report`

- [ ] **Step 1: Tipo y API del reporte**

Crear `frontend/src/api/report.ts`:

```ts
import api from './axios'

export interface ReportScale { code: string; name: string; normalized: number | null; percentile: number | null; category: string | null; interpretation: string }
export interface ReportTest { name: string; integrity: { blur_count: number }; scales: ReportScale[] }
export interface ReportData {
  candidate: string
  position: string | null
  assessment: string
  organization: string
  completed_at: string | null
  tests: ReportTest[]
  interview_questions: string[]
  sample?: boolean
}

export async function getReport(invitationId: number): Promise<ReportData> {
  const { data } = await api.get(`/api/invitations/${invitationId}/report`)
  return data.data
}
```

- [ ] **Step 2: Componente Report**

Crear `frontend/src/sections/Report.css`:

```css
.report { display: flex; flex-direction: column; gap: var(--sp-8); }
.report__header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--sp-4); align-items: baseline; }
.report__candidate { font-family: var(--font-display); font-size: var(--text-2xl); color: var(--color-brunswick); }
.report__meta { font-size: var(--text-sm); color: var(--color-ink); opacity: 0.75; }
.report__badge { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-ink); background: var(--color-surface-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--sp-1) var(--sp-3); }
.report__test { display: flex; flex-direction: column; gap: var(--sp-4); }
.report__test-title { font-family: var(--font-display); font-size: var(--text-xl); color: var(--color-brunswick); }
.report__scale { display: flex; flex-direction: column; gap: var(--sp-2); padding-block: var(--sp-3); border-top: 1px solid var(--color-timberwolf); }
.report__scale-head { display: flex; justify-content: space-between; gap: var(--sp-3); align-items: baseline; }
.report__scale-name { font-weight: 600; color: var(--color-brunswick); }
.report__scale-cat { font-size: var(--text-sm); font-weight: 600; font-variant-numeric: tabular-nums; }
.report__bar-track { height: 8px; background: var(--color-timberwolf); border-radius: 99px; overflow: hidden; }
.report__bar-fill { height: 100%; border-radius: 99px; }
.report__interp { font-size: var(--text-sm); color: var(--color-ink); opacity: 0.85; }
.report__questions { display: flex; flex-direction: column; gap: var(--sp-2); }
.report__q { font-size: var(--text-sm); color: var(--color-ink); }
.report__foot { font-size: var(--text-xs); color: var(--color-ink); opacity: 0.7; line-height: 1.6; border-top: 1px solid var(--color-timberwolf); padding-top: var(--sp-4); }

@media print {
  .report__badge { border-color: #000; }
}
```

Crear `frontend/src/sections/Report.tsx`:

```tsx
import type { ReportData } from '@/api/report'
import './Report.css'

const CATEGORY_COLOR: Record<string, string> = {
  bajo: 'var(--color-sage)',
  medio: 'var(--color-fern)',
  alto: 'var(--color-hunter)',
}

export default function Report({ data }: { data: ReportData }) {
  return (
    <div className="report">
      <div className="report__header">
        <div>
          <p className="report__candidate">{data.candidate}</p>
          <p className="report__meta">
            {data.position ?? 'Sin puesto'} · {data.assessment} · {data.organization}
            {data.completed_at ? ` · ${data.completed_at}` : ''}
          </p>
        </div>
        {data.sample && <span className="report__badge">Ejemplo</span>}
      </div>

      {data.tests.map((test, ti) => (
        <div key={ti} className="report__test">
          <h3 className="report__test-title">{test.name}</h3>
          {test.scales.map(scale => (
            <div key={scale.code} className="report__scale">
              <div className="report__scale-head">
                <span className="report__scale-name">{scale.name}</span>
                <span className="report__scale-cat" style={{ color: CATEGORY_COLOR[scale.category ?? 'medio'] }}>
                  {scale.category ?? '—'}{scale.percentile != null ? ` · pc ${scale.percentile}` : ''}
                </span>
              </div>
              <div className="report__bar-track">
                <div className="report__bar-fill" style={{ width: `${scale.normalized ?? 0}%`, backgroundColor: CATEGORY_COLOR[scale.category ?? 'medio'] }} />
              </div>
              <p className="report__interp">{scale.interpretation}</p>
            </div>
          ))}
          <p className="report__meta">Integridad de respuesta: {test.integrity.blur_count} vez(ces) que la pantalla perdió el foco.</p>
        </div>
      ))}

      {data.interview_questions.length > 0 && (
        <div className="report__questions">
          <h3 className="report__test-title">Preguntas sugeridas para entrevista</h3>
          {data.interview_questions.map((q, i) => <p key={i} className="report__q">· {q}</p>)}
        </div>
      )}

      <p className="report__foot">
        Este reporte describe tendencias medidas por la prueba; no mide todas las dimensiones de una persona.
        Apoya la decisión de contratación, no la sustituye.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Página ReporteCandidato**

Crear `frontend/src/pages/app/ReporteCandidato.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getReport, type ReportData } from '@/api/report'
import Report from '@/sections/Report'

export default function ReporteCandidato() {
  const { invitationId } = useParams()
  const [data, setData] = useState<ReportData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getReport(Number(invitationId))
      .then(setData)
      .catch(() => setError('No se pudo cargar el reporte (¿la evaluación está completada?).'))
  }, [invitationId])

  if (error) return <p>{error}</p>
  if (!data) return <p>Cargando reporte…</p>
  return <Report data={data} />
}
```

- [ ] **Step 4: Reusar Report en el SampleReport del sitio**

Reemplazar `frontend/src/sections/SampleReport.tsx` para que use el mismo componente con datos de ejemplo:

```tsx
import Report from '@/sections/Report'
import type { ReportData } from '@/api/report'
import './SampleReport.css'

const SAMPLE: ReportData = {
  candidate: 'Ejemplo · Candidato',
  position: 'Ejecutivo de ventas',
  assessment: 'Evaluación de muestra',
  organization: 'Mez',
  completed_at: 'Sep 2026',
  sample: true,
  interview_questions: ['Cuéntame de una situación reciente relacionada con «Orientación a resultados».'],
  tests: [{
    name: 'Perfil de conducta',
    integrity: { blur_count: 0 },
    scales: [
      { code: 'RES', name: 'Orientación a resultados', normalized: 78, percentile: 78, category: 'alto', interpretation: 'Puntaje alto: es una fortaleza marcada del candidato.' },
      { code: 'COL', name: 'Colaboración', normalized: 55, percentile: 55, category: 'medio', interpretation: 'Puntaje medio: dentro del promedio esperado.' },
      { code: 'ADA', name: 'Adaptabilidad', normalized: 30, percentile: 30, category: 'bajo', interpretation: 'Puntaje bajo: podría ser un área a explorar en entrevista.' },
    ],
  }],
}

export default function SampleReport() {
  return (
    <section className="sample-report" aria-labelledby="sample-title">
      <div className="sample-report__inner">
        <div className="sample-report__heading">
          <h2 className="sample-report__title" id="sample-title">Este es el reporte que recibes</h2>
        </div>
        <div className="report-card" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-8)' }}>
          <Report data={SAMPLE} />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Ruta del reporte en /app**

En `frontend/src/App.tsx`, importar y añadir dentro del `<Route path="/app" ...>`:

```tsx
import ReporteCandidato from '@/pages/app/ReporteCandidato'
```

```tsx
<Route path="candidatos/:invitationId/reporte" element={<ReporteCandidato />} />
```

- [ ] **Step 6: Verificar compila y build**

```bash
npx tsc --noEmit && npm run build
```

Expected: build limpio. (El `SampleReport.css` viejo puede tener clases sin usar; es inofensivo.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: shared Report component reused by candidate report and public sample"
```

---

## Task 16: Verificación end-to-end

**Files:** (solo verificación)

- [ ] **Step 1: Preparar backend con datos**

```bash
cd C:\Users\geova\Documents\Mezquit\backend
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

- [ ] **Step 2: Correr toda la suite de backend**

```bash
php artisan test
```

Expected: todos los tests pasan (Auth, Scoring, Assessment, CandidatePortal, Report, Lead).

- [ ] **Step 3: Arrancar frontend**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npm run dev
```

- [ ] **Step 4: Flujo manual (documentar resultado)**

1. Ir a `http://localhost:5173/registro`, crear cuenta → redirige a `/app/evaluaciones/nueva`.
2. Crear evaluación con 1 candidato ("Juan, juan@test.com"). Copiar el enlace generado.
3. Abrir el enlace `/evaluar/{token}` en una ventana privada. Recorrer: bienvenida → consentimiento (casilla) → instrucciones → responder 12 reactivos → fin.
4. Cerrar a la mitad y reabrir el mismo enlace: debe continuar donde iba.
5. Volver a `/app`, ir a `/app/candidatos/{invitationId}/reporte` y confirmar el reporte con 3 escalas.
6. Reabrir el enlace del candidato ya completado: debe mostrar "ya no está disponible".

- [ ] **Step 5: Screenshots**

```bash
npx playwright screenshot --browser chromium --viewport-size "375,812" "http://localhost:5173/evaluar/TOKEN" "C:/Users/geova/AppData/Local/Temp/mez-candidate.png"
```

(Reemplazar TOKEN por uno real.) Revisar que los botones sean ≥44px y una pregunta por pantalla.

- [ ] **Step 6: Commit final**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend && git add -A && git commit -m "chore: Fase 1 end-to-end verification" || echo "nada que commitear"
```

---

## Self-review

- [ ] Candidato responde en móvil, cierra a la mitad, reabre y termina (Task 14 reanuda por `firstUnanswered`; Task 9 `updateOrCreate` autosave).
- [ ] Token completado/expirado no admite responder (Task 9 `assertAnswerable` → 409; Task 14 `blocked`).
- [ ] Score no cambia al cambiar baremo (Task 6 persiste versiones; test lo cubre).
- [ ] Reporte individual y "Ejemplo" usan el mismo componente `Report` (Task 15).
- [ ] Eventos de integridad se muestran como dato neutro (Task 15 texto).
- [ ] Consentimiento con fecha/IP antes del primer reactivo (Task 9 consent → status iniciada; Task 14 exige casilla antes de items).

## Lista de [PENDIENTE]

1. `[PENDIENTE: proveedor de correo]` — SMTP real (dev usa driver log/array).
2. `[PENDIENTE: número de evaluaciones gratis]` — config de registro (sin efecto en Fase 1).
3. `[PENDIENTE: aviso de privacidad]` — texto legal enlazado en el consentimiento.
4. `[PENDIENTE: reactivos, claves y baremos reales]` — entrega del psicólogo; hoy la Prueba de demostración.
