# Mez — Fase 2: Panel de RH — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Panel de RH: lista/detalle de evaluaciones, reenvío, tabla comparativa (con CSV), reporte a PDF, y ledger de créditos con solicitud + aprobación por super-admin.

**Architecture:** Backend Laravel: ledger `credit_transactions` (saldo = suma), `CreditService`, consumo bloqueante al crear evaluación, endpoints RH y de super-admin (`is_platform_admin`). Frontend React: nuevas páginas `/app` (resumen, lista, detalle, comparativa, créditos), PDF vía print CSS, y `/admin/creditos`.

**Tech Stack:** Laravel 13, PHP 8.4, Sanctum, PHPUnit, React 19, TS, React Router v7, Axios.

**Spec:** `docs/superpowers/specs/2026-09-12-fase2-panel-rh-design.md`

**Convenciones:** `#[Fillable]`, migraciones anónimas, `RefreshDatabase`. Créditos: 1 = 1 candidato.

---

## Task 1: Migraciones, modelos y config de créditos

**Files:**
- Create: migraciones `create_credit_transactions_table`, `create_credit_requests_table`, `add_is_platform_admin_to_users_table`; modelos `CreditTransaction`, `CreditRequest`; `backend/config/credits.php`
- Modify: `backend/app/Models/User.php`, `Organization.php`

- [ ] **Step 1: Generar migraciones**

```bash
cd C:\Users\geova\Documents\Mezquit\backend
php artisan make:migration create_credit_transactions_table
php artisan make:migration create_credit_requests_table
php artisan make:migration add_is_platform_admin_to_users_table
```

`create_credit_transactions_table` up():
```php
Schema::create('credit_transactions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
    $table->string('type'); // compra|consumo|cortesia|ajuste
    $table->integer('amount'); // negativo = consumo
    $table->string('reference')->nullable();
    $table->json('meta')->nullable();
    $table->timestamp('created_at')->nullable();
});
```

`create_credit_requests_table` up():
```php
Schema::create('credit_requests', function (Blueprint $table) {
    $table->id();
    $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
    $table->integer('requested_amount');
    $table->string('note')->nullable();
    $table->string('status')->default('pendiente'); // pendiente|aprobada|rechazada
    $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('resolved_at')->nullable();
    $table->timestamps();
});
```

`add_is_platform_admin_to_users_table` up():
```php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('is_platform_admin')->default(false)->after('role');
});
```
down():
```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn('is_platform_admin');
});
```

- [ ] **Step 2: Crear modelos**

`backend/app/Models/CreditTransaction.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['organization_id', 'type', 'amount', 'reference', 'meta', 'created_at'])]
class CreditTransaction extends Model
{
    public $timestamps = false;
    protected function casts(): array { return ['meta' => 'array', 'created_at' => 'datetime']; }
}
```

`backend/app/Models/CreditRequest.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['organization_id', 'requested_amount', 'note', 'status', 'resolved_by', 'resolved_at'])]
class CreditRequest extends Model
{
    protected function casts(): array { return ['resolved_at' => 'datetime']; }
    public function organization() { return $this->belongsTo(Organization::class); }
}
```

- [ ] **Step 3: Actualizar User y Organization**

En `backend/app/Models/User.php`, cambiar el atributo Fillable para incluir `is_platform_admin` y agregar el cast:
```php
#[Fillable(['name', 'email', 'password', 'organization_id', 'role', 'is_platform_admin'])]
```
Y en `casts()` agregar `'is_platform_admin' => 'boolean',`.

En `backend/app/Models/Organization.php`, agregar relaciones dentro de la clase:
```php
public function creditTransactions(): \Illuminate\Database\Eloquent\Relations\HasMany
{
    return $this->hasMany(CreditTransaction::class);
}
public function creditRequests(): \Illuminate\Database\Eloquent\Relations\HasMany
{
    return $this->hasMany(CreditRequest::class);
}
```

- [ ] **Step 4: Config de créditos**

Crear `backend/config/credits.php`:
```php
<?php
return [
    // [PENDIENTE: número de créditos de cortesía] — valor de desarrollo
    'free_signup' => (int) env('CREDITS_FREE_SIGNUP', 10),
];
```

- [ ] **Step 5: Migrar y verificar**

```bash
php artisan migrate:fresh --seed
php artisan test
```
Expected: tablas creadas; suite existente verde.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: credit ledger schema, models, and config"
```

---

## Task 2: CreditService (TDD)

**Files:**
- Create: `backend/app/Services/CreditService.php`, `backend/app/Exceptions/InsufficientCreditsException.php`
- Test: `backend/tests/Feature/CreditServiceTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/CreditServiceTest.php`:
```php
<?php

namespace Tests\Feature;

use App\Exceptions\InsufficientCreditsException;
use App\Models\Organization;
use App\Services\CreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreditServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_balance_is_sum_of_transactions(): void
    {
        $org = Organization::create(['name' => 'ACME']);
        $svc = app(CreditService::class);
        $svc->grant($org, 10, 'cortesia', 'registro');
        $svc->consume($org, 3, 'assessment:1');

        $this->assertEquals(7, $svc->balance($org));
        $this->assertDatabaseHas('credit_transactions', ['organization_id' => $org->id, 'amount' => -3, 'type' => 'consumo']);
    }

    public function test_consume_throws_when_insufficient(): void
    {
        $org = Organization::create(['name' => 'ACME']);
        $svc = app(CreditService::class);
        $svc->grant($org, 2, 'cortesia', 'registro');

        $this->expectException(InsufficientCreditsException::class);
        $svc->consume($org, 5, 'assessment:1');
    }

    public function test_insufficient_does_not_record_transaction(): void
    {
        $org = Organization::create(['name' => 'ACME']);
        $svc = app(CreditService::class);
        $svc->grant($org, 2, 'cortesia', 'registro');

        try { $svc->consume($org, 5, 'x'); } catch (InsufficientCreditsException) {}

        $this->assertEquals(2, $svc->balance($org));
        $this->assertDatabaseMissing('credit_transactions', ['type' => 'consumo']);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/CreditServiceTest.php
```
Expected: FAIL — clases ausentes.

- [ ] **Step 3: Crear la excepción**

Crear `backend/app/Exceptions/InsufficientCreditsException.php`:
```php
<?php
namespace App\Exceptions;
use RuntimeException;

class InsufficientCreditsException extends RuntimeException {}
```

- [ ] **Step 4: Crear CreditService**

Crear `backend/app/Services/CreditService.php`:
```php
<?php

namespace App\Services;

use App\Exceptions\InsufficientCreditsException;
use App\Models\CreditTransaction;
use App\Models\Organization;

class CreditService
{
    public function balance(Organization $organization): int
    {
        return (int) $organization->creditTransactions()->sum('amount');
    }

    public function grant(Organization $organization, int $amount, string $type, ?string $reference = null): CreditTransaction
    {
        return CreditTransaction::create([
            'organization_id' => $organization->id,
            'type' => $type,
            'amount' => abs($amount),
            'reference' => $reference,
            'created_at' => now(),
        ]);
    }

    public function consume(Organization $organization, int $amount, ?string $reference = null): void
    {
        $balance = $this->balance($organization);
        if ($balance < $amount) {
            throw new InsufficientCreditsException("Créditos insuficientes: necesitas {$amount}, tienes {$balance}");
        }
        CreditTransaction::create([
            'organization_id' => $organization->id,
            'type' => 'consumo',
            'amount' => -abs($amount),
            'reference' => $reference,
            'created_at' => now(),
        ]);
    }
}
```

- [ ] **Step 5: Correr y ver pasar**

```bash
php artisan test tests/Feature/CreditServiceTest.php
```
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: CreditService with balance/grant/consume and tests"
```

---

## Task 3: Cortesía en registro + consumo bloqueante al crear evaluación (TDD)

**Files:**
- Modify: `backend/app/Http/Controllers/Auth/RegisterController.php`, `AssessmentController.php`, `tests/Feature/AssessmentTest.php`
- Test: `backend/tests/Feature/CreditFlowTest.php`

- [ ] **Step 1: Escribir tests nuevos**

Crear `backend/tests/Feature/CreditFlowTest.php`:
```php
<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Test as TestModel;
use App\Models\User;
use App\Services\CreditService;
use Database\Seeders\DemoTestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CreditFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_grants_courtesy_credits(): void
    {
        config()->set('credits.free_signup', 10);
        $this->postJson('/api/register', [
            'name' => 'Ana', 'email' => 'ana@e.com', 'password' => 'secret123',
            'company_name' => 'Empresa', 'sector' => 'comercio', 'company_size' => '11-50',
        ])->assertStatus(201);

        $org = Organization::first();
        $this->assertEquals(10, app(CreditService::class)->balance($org));
    }

    public function test_creating_assessment_consumes_one_credit_per_candidate(): void
    {
        Notification::fake();
        $this->seed(DemoTestSeeder::class);
        $org = Organization::create(['name' => 'ACME']);
        app(CreditService::class)->grant($org, 5, 'cortesia', 'registro');
        $user = User::create(['name' => 'A', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
        $this->actingAs($user);
        $test = TestModel::first();

        $this->postJson('/api/assessments', [
            'name' => 'V', 'test_ids' => [$test->id],
            'candidates' => [['name' => 'A', 'email' => 'a@x.com'], ['name' => 'B', 'email' => 'b@x.com']],
        ])->assertStatus(201);

        $this->assertEquals(3, app(CreditService::class)->balance($org)); // 5 - 2
    }

    public function test_creating_assessment_blocked_when_insufficient(): void
    {
        Notification::fake();
        $this->seed(DemoTestSeeder::class);
        $org = Organization::create(['name' => 'ACME']);
        app(CreditService::class)->grant($org, 1, 'cortesia', 'registro');
        $user = User::create(['name' => 'A', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
        $this->actingAs($user);
        $test = TestModel::first();

        $this->postJson('/api/assessments', [
            'name' => 'V', 'test_ids' => [$test->id],
            'candidates' => [['name' => 'A', 'email' => 'a@x.com'], ['name' => 'B', 'email' => 'b@x.com']],
        ])->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'insuficientes'));

        $this->assertDatabaseCount('assessments', 0);
        Notification::assertNothingSent();
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/CreditFlowTest.php
```
Expected: FAIL (registro no otorga; no hay bloqueo).

- [ ] **Step 3: Otorgar cortesía en registro**

En `backend/app/Http/Controllers/Auth/RegisterController.php`, inyectar el servicio y otorgar tras crear la org. Reemplazar el método `store`:
```php
public function store(RegisterRequest $request, \App\Services\CreditService $credits): JsonResponse
{
    $data = $request->validated();

    $org = Organization::create([
        'name' => $data['company_name'],
        'sector' => $data['sector'] ?? null,
        'size' => $data['company_size'] ?? null,
    ]);

    $credits->grant($org, (int) config('credits.free_signup'), 'cortesia', 'registro');

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
```

- [ ] **Step 4: Consumo bloqueante en AssessmentController::store**

Reemplazar `backend/app/Http/Controllers/AssessmentController.php` método `store` para (a) pre-verificar saldo, (b) crear dentro de `DB::transaction`, (c) consumir referenciando el assessment. Añadir imports `use Illuminate\Support\Facades\DB;` y `use App\Services\CreditService;`.

```php
public function store(StoreAssessmentRequest $request, CreditService $credits): JsonResponse
{
    $data = $request->validated();
    $user = $request->user();
    $org = $user->organization;
    $count = count($data['candidates']);

    $balance = $credits->balance($org);
    if ($balance < $count) {
        return response()->json(['message' => "Créditos insuficientes: necesitas {$count}, tienes {$balance}"], 422);
    }

    $result = DB::transaction(function () use ($data, $user, $org, $count, $credits) {
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

        $credits->consume($org, $count, "assessment:{$assessment->id}");

        return ['id' => $assessment->id, 'name' => $assessment->name, 'invitations' => $invitations];
    });

    return response()->json(['data' => $result], 201);
}
```

- [ ] **Step 5: Actualizar el AssessmentTest de Fase 1**

En `backend/tests/Feature/AssessmentTest.php`, el helper `actingUser()` crea una org sin créditos. Darle cortesía. Reemplazar el método `actingUser`:
```php
private function actingUser(): User
{
    $org = Organization::create(['name' => 'ACME']);
    app(\App\Services\CreditService::class)->grant($org, 50, 'cortesia', 'registro');
    $user = User::create(['name' => 'A', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
    $this->actingAs($user);
    return $user;
}
```

- [ ] **Step 6: Correr y ver pasar**

```bash
php artisan test tests/Feature/CreditFlowTest.php
php artisan test
```
Expected: CreditFlowTest PASS (3); suite completa verde (incluye AuthTest de registro y AssessmentTest actualizados).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: courtesy credits on register, blocking consumption on assessment creation"
```

---

## Task 4: Lista de evaluaciones + reenvío (TDD)

**Files:**
- Modify: `backend/app/Http/Controllers/AssessmentController.php`, `routes/api.php`
- Create: `backend/app/Http/Controllers/InvitationController.php`
- Test: `backend/tests/Feature/AssessmentListTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/AssessmentListTest.php`:
```php
<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Candidate;
use App\Models\Invitation;
use App\Models\Organization;
use App\Models\User;
use App\Notifications\InvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AssessmentListTest extends TestCase
{
    use RefreshDatabase;

    private function orgUser(): User
    {
        $org = Organization::create(['name' => 'ACME']);
        return User::create(['name' => 'A', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
    }

    public function test_index_lists_org_assessments_with_counts(): void
    {
        $user = $this->orgUser();
        $a = Assessment::create(['organization_id' => $user->organization_id, 'name' => 'V', 'status' => 'activa']);
        $c1 = Candidate::create(['name' => 'A', 'email' => 'a@x.com']);
        $c2 = Candidate::create(['name' => 'B', 'email' => 'b@x.com']);
        Invitation::create(['assessment_id' => $a->id, 'candidate_id' => $c1->id, 'token' => 't1', 'status' => 'completada']);
        Invitation::create(['assessment_id' => $a->id, 'candidate_id' => $c2->id, 'token' => 't2', 'status' => 'pendiente']);

        // otra org no debe verse
        $other = Organization::create(['name' => 'OTRA']);
        Assessment::create(['organization_id' => $other->id, 'name' => 'X', 'status' => 'activa']);

        $this->actingAs($user)->getJson('/api/assessments')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.counts.total', 2)
            ->assertJsonPath('data.0.counts.completada', 1);
    }

    public function test_resend_updates_sent_at(): void
    {
        Notification::fake();
        $user = $this->orgUser();
        $a = Assessment::create(['organization_id' => $user->organization_id, 'name' => 'V', 'status' => 'activa']);
        $c = Candidate::create(['name' => 'A', 'email' => 'a@x.com']);
        $inv = Invitation::create(['assessment_id' => $a->id, 'candidate_id' => $c->id, 'token' => 't1', 'status' => 'pendiente']);

        $this->actingAs($user)->postJson("/api/invitations/{$inv->id}/resend")->assertStatus(200);
        Notification::assertSentOnDemand(InvitationNotification::class);
        $this->assertNotNull($inv->fresh()->sent_at);
    }

    public function test_resend_rejected_when_completed(): void
    {
        $user = $this->orgUser();
        $a = Assessment::create(['organization_id' => $user->organization_id, 'name' => 'V', 'status' => 'activa']);
        $c = Candidate::create(['name' => 'A', 'email' => 'a@x.com']);
        $inv = Invitation::create(['assessment_id' => $a->id, 'candidate_id' => $c->id, 'token' => 't1', 'status' => 'completada']);

        $this->actingAs($user)->postJson("/api/invitations/{$inv->id}/resend")->assertStatus(409);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/AssessmentListTest.php
```
Expected: FAIL.

- [ ] **Step 3: Agregar index a AssessmentController**

Añadir el método `index` a `backend/app/Http/Controllers/AssessmentController.php`:
```php
public function index(\Illuminate\Http\Request $request): JsonResponse
{
    $assessments = Assessment::query()
        ->where('organization_id', $request->user()->organization_id)
        ->withCount([
            'invitations as total' => fn ($q) => $q,
            'invitations as pendiente' => fn ($q) => $q->where('status', 'pendiente'),
            'invitations as iniciada' => fn ($q) => $q->where('status', 'iniciada'),
            'invitations as completada' => fn ($q) => $q->where('status', 'completada'),
        ])
        ->orderByDesc('created_at')
        ->get();

    return response()->json(['data' => $assessments->map(fn ($a) => [
        'id' => $a->id,
        'name' => $a->name,
        'position' => $a->position,
        'deadline' => $a->deadline?->format('Y-m-d'),
        'status' => $a->status,
        'counts' => [
            'total' => (int) $a->total,
            'pendiente' => (int) $a->pendiente,
            'iniciada' => (int) $a->iniciada,
            'completada' => (int) $a->completada,
        ],
        'created_at' => $a->created_at?->format('Y-m-d'),
    ])]);
}
```

- [ ] **Step 4: Crear InvitationController (resend)**

Crear `backend/app/Http/Controllers/InvitationController.php`:
```php
<?php

namespace App\Http\Controllers;

use App\Models\Invitation;
use App\Notifications\InvitationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class InvitationController extends Controller
{
    public function resend(Request $request, Invitation $invitation): JsonResponse
    {
        $invitation->load('assessment', 'candidate');
        abort_unless($invitation->assessment->organization_id === $request->user()->organization_id, 403);
        abort_if($invitation->status === 'completada', 409, 'La evaluación ya fue completada.');

        $link = rtrim(config('app.frontend_url'), '/')."/evaluar/{$invitation->token}";
        Notification::route('mail', $invitation->candidate->email)->notify(new InvitationNotification($invitation, $link));
        $invitation->update(['sent_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 5: Registrar rutas**

En `backend/routes/api.php`, dentro del grupo `auth:sanctum`, agregar:
```php
Route::get('assessments', [AssessmentController::class, 'index']);
Route::post('invitations/{invitation}/resend', [\App\Http\Controllers\InvitationController::class, 'resend']);
```
(Mantener las rutas existentes `POST assessments`, `GET assessments/{assessment}`, `GET invitations/{invitation}/report`.)

- [ ] **Step 6: Correr y ver pasar**

```bash
php artisan test tests/Feature/AssessmentListTest.php
php artisan test
```
Expected: PASS; suite verde.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: assessment list with status counts and invitation resend"
```

---

## Task 5: Tabla comparativa (TDD)

**Files:**
- Modify: `backend/app/Http/Controllers/AssessmentController.php`, `routes/api.php`
- Test: `backend/tests/Feature/CompareTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/CompareTest.php`:
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

class CompareTest extends TestCase
{
    use RefreshDatabase;

    public function test_compare_returns_scales_and_rows_for_completed(): void
    {
        $this->seed(DemoTestSeeder::class);
        $test = TestModel::first();
        $org = Organization::create(['name' => 'ACME']);
        $user = User::create(['name' => 'A', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
        $assessment = Assessment::create(['organization_id' => $org->id, 'name' => 'V']);
        $assessment->tests()->attach($test->id, ['order' => 1]);

        // candidato completado
        $c1 = Candidate::create(['name' => 'Juan', 'email' => 'j@x.com']);
        $inv1 = Invitation::create(['assessment_id' => $assessment->id, 'candidate_id' => $c1->id, 'token' => 't1', 'status' => 'completada']);
        $att = $inv1->attempts()->create(['test_id' => $test->id, 'status' => 'completada']);
        foreach ($test->items as $item) { $att->answers()->create(['item_id' => $item->id, 'value' => 4, 'responded_at' => now()]); }
        app(ScoringService::class)->score($att);

        // candidato pendiente (no debe aparecer)
        $c2 = Candidate::create(['name' => 'Ana', 'email' => 'a@x.com']);
        Invitation::create(['assessment_id' => $assessment->id, 'candidate_id' => $c2->id, 'token' => 't2', 'status' => 'pendiente']);

        $res = $this->actingAs($user)->getJson("/api/assessments/{$assessment->id}/compare")->assertStatus(200);

        $res->assertJsonCount(3, 'data.scales'); // RES/COL/ADA
        $res->assertJsonCount(1, 'data.rows');
        $res->assertJsonPath('data.rows.0.candidate', 'Juan');
        $this->assertArrayHasKey('RES', $res->json('data.rows.0.scores'));
    }

    public function test_compare_forbidden_for_other_org(): void
    {
        $org = Organization::create(['name' => 'ACME']);
        $assessment = Assessment::create(['organization_id' => $org->id, 'name' => 'V']);
        $other = Organization::create(['name' => 'OTRA']);
        $user = User::create(['name' => 'B', 'email' => 'b@b.com', 'password' => bcrypt('x'), 'organization_id' => $other->id, 'role' => 'admin']);

        $this->actingAs($user)->getJson("/api/assessments/{$assessment->id}/compare")->assertStatus(403);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/CompareTest.php
```
Expected: FAIL.

- [ ] **Step 3: Agregar compare a AssessmentController**

Añadir el método `compare`:
```php
public function compare(\Illuminate\Http\Request $request, Assessment $assessment): JsonResponse
{
    abort_unless($assessment->organization_id === $request->user()->organization_id, 403);

    $assessment->load(['tests.scales']);
    $scales = $assessment->tests->flatMap->scales
        ->unique('id')
        ->map(fn ($s) => ['code' => $s->code, 'name' => $s->name])
        ->values();

    $invitations = $assessment->invitations()
        ->where('status', 'completada')
        ->with(['candidate', 'attempts.scores.scale'])
        ->get();

    $rows = $invitations->map(function ($inv) {
        $scores = [];
        foreach ($inv->attempts as $attempt) {
            foreach ($attempt->scores as $score) {
                $scores[$score->scale->code] = [
                    'category' => $score->category,
                    'percentile' => $score->percentile,
                    'normalized' => $score->normalized,
                ];
            }
        }
        return [
            'invitation_id' => $inv->id,
            'candidate' => $inv->candidate->name,
            'status' => $inv->status,
            'scores' => $scores,
        ];
    });

    return response()->json(['data' => [
        'assessment' => ['id' => $assessment->id, 'name' => $assessment->name],
        'scales' => $scales,
        'rows' => $rows,
    ]]);
}
```

- [ ] **Step 4: Registrar ruta**

En `backend/routes/api.php`, dentro del grupo `auth:sanctum`:
```php
Route::get('assessments/{assessment}/compare', [AssessmentController::class, 'compare']);
```

- [ ] **Step 5: Correr y ver pasar**

```bash
php artisan test tests/Feature/CompareTest.php
php artisan test
```
Expected: PASS; suite verde.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: assessment comparison endpoint (candidates x scales)"
```

---

## Task 6: Créditos — saldo/historial + solicitud (TDD)

**Files:**
- Create: `backend/app/Http/Controllers/CreditController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/CreditEndpointTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/CreditEndpointTest.php`:
```php
<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use App\Services\CreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreditEndpointTest extends TestCase
{
    use RefreshDatabase;

    private function orgUser(int $credits = 0): User
    {
        $org = Organization::create(['name' => 'ACME']);
        if ($credits > 0) app(CreditService::class)->grant($org, $credits, 'cortesia', 'registro');
        return User::create(['name' => 'A', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
    }

    public function test_credits_returns_balance_and_history(): void
    {
        $user = $this->orgUser(10);
        $this->actingAs($user)->getJson('/api/credits')
            ->assertStatus(200)
            ->assertJsonPath('data.balance', 10)
            ->assertJsonCount(1, 'data.transactions');
    }

    public function test_credit_request_creates_pending(): void
    {
        $user = $this->orgUser();
        $this->actingAs($user)->postJson('/api/credit-requests', ['requested_amount' => 50, 'note' => 'Para Q4'])
            ->assertStatus(201);
        $this->assertDatabaseHas('credit_requests', ['organization_id' => $user->organization_id, 'requested_amount' => 50, 'status' => 'pendiente']);
    }

    public function test_credit_request_validates_amount(): void
    {
        $user = $this->orgUser();
        $this->actingAs($user)->postJson('/api/credit-requests', ['requested_amount' => 0])
            ->assertStatus(422)->assertJsonValidationErrors(['requested_amount']);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/CreditEndpointTest.php
```
Expected: FAIL.

- [ ] **Step 3: Crear CreditController**

Crear `backend/app/Http/Controllers/CreditController.php`:
```php
<?php

namespace App\Http\Controllers;

use App\Models\CreditRequest;
use App\Services\CreditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreditController extends Controller
{
    public function index(Request $request, CreditService $credits): JsonResponse
    {
        $org = $request->user()->organization;
        $transactions = $org->creditTransactions()->orderByDesc('created_at')->get()
            ->map(fn ($t) => ['type' => $t->type, 'amount' => $t->amount, 'reference' => $t->reference, 'created_at' => $t->created_at?->format('Y-m-d H:i')]);

        return response()->json(['data' => ['balance' => $credits->balance($org), 'transactions' => $transactions]]);
    }

    public function requestCredits(Request $request): JsonResponse
    {
        $data = $request->validate([
            'requested_amount' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        CreditRequest::create([
            'organization_id' => $request->user()->organization_id,
            'requested_amount' => $data['requested_amount'],
            'note' => $data['note'] ?? null,
            'status' => 'pendiente',
        ]);

        return response()->json(['message' => 'Solicitud registrada. Un asesor la revisará.'], 201);
    }
}
```

- [ ] **Step 4: Registrar rutas**

En `backend/routes/api.php`, dentro del grupo `auth:sanctum`:
```php
Route::get('credits', [\App\Http\Controllers\CreditController::class, 'index']);
Route::post('credit-requests', [\App\Http\Controllers\CreditController::class, 'requestCredits']);
```

- [ ] **Step 5: Correr y ver pasar**

```bash
php artisan test tests/Feature/CreditEndpointTest.php
php artisan test
```
Expected: PASS; suite verde.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: credits balance/history endpoint and credit request"
```

---

## Task 7: Super-admin — middleware + aprobación + seeder (TDD)

**Files:**
- Create: `backend/app/Http/Middleware/EnsurePlatformAdmin.php`, `backend/app/Http/Controllers/Admin/CreditRequestController.php`, `backend/database/seeders/PlatformAdminSeeder.php`
- Modify: `backend/bootstrap/app.php`, `routes/api.php`, `DatabaseSeeder.php`
- Test: `backend/tests/Feature/AdminCreditTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/AdminCreditTest.php`:
```php
<?php

namespace Tests\Feature;

use App\Models\CreditRequest;
use App\Models\Organization;
use App\Models\User;
use App\Services\CreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCreditTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $org = Organization::create(['name' => 'MEZ']);
        return User::create(['name' => 'Op', 'email' => 'op@mez.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin', 'is_platform_admin' => true]);
    }

    public function test_non_admin_forbidden(): void
    {
        $org = Organization::create(['name' => 'ACME']);
        $user = User::create(['name' => 'A', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
        $this->actingAs($user)->getJson('/api/admin/credit-requests')->assertStatus(403);
    }

    public function test_admin_lists_pending_requests(): void
    {
        $org = Organization::create(['name' => 'ACME']);
        CreditRequest::create(['organization_id' => $org->id, 'requested_amount' => 20, 'status' => 'pendiente']);

        $this->actingAs($this->admin())->getJson('/api/admin/credit-requests')
            ->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_approve_grants_purchase_and_raises_balance(): void
    {
        $org = Organization::create(['name' => 'ACME']);
        $req = CreditRequest::create(['organization_id' => $org->id, 'requested_amount' => 20, 'status' => 'pendiente']);

        $this->actingAs($this->admin())->postJson("/api/admin/credit-requests/{$req->id}/approve")->assertStatus(200);

        $this->assertEquals('aprobada', $req->fresh()->status);
        $this->assertEquals(20, app(CreditService::class)->balance($org));
        $this->assertDatabaseHas('credit_transactions', ['organization_id' => $org->id, 'type' => 'compra', 'amount' => 20]);
    }

    public function test_reject_does_not_change_balance(): void
    {
        $org = Organization::create(['name' => 'ACME']);
        $req = CreditRequest::create(['organization_id' => $org->id, 'requested_amount' => 20, 'status' => 'pendiente']);

        $this->actingAs($this->admin())->postJson("/api/admin/credit-requests/{$req->id}/reject")->assertStatus(200);

        $this->assertEquals('rechazada', $req->fresh()->status);
        $this->assertEquals(0, app(CreditService::class)->balance($org));
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/AdminCreditTest.php
```
Expected: FAIL.

- [ ] **Step 3: Crear el middleware**

Crear `backend/app/Http/Middleware/EnsurePlatformAdmin.php`:
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless((bool) $request->user()?->is_platform_admin, 403);
        return $next($request);
    }
}
```

- [ ] **Step 4: Registrar alias del middleware**

En `backend/bootstrap/app.php`, dentro de `->withMiddleware(function (Middleware $middleware): void {`, junto a `statefulApi()`, agregar:
```php
$middleware->alias(['platform_admin' => \App\Http\Middleware\EnsurePlatformAdmin::class]);
```

- [ ] **Step 5: Crear el controlador de admin**

Crear `backend/app/Http/Controllers/Admin/CreditRequestController.php`:
```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditRequest;
use App\Services\CreditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreditRequestController extends Controller
{
    public function index(CreditService $credits): JsonResponse
    {
        $requests = CreditRequest::where('status', 'pendiente')->with('organization')->orderBy('created_at')->get();

        return response()->json(['data' => $requests->map(fn ($r) => [
            'id' => $r->id,
            'organization' => $r->organization->name,
            'organization_balance' => $credits->balance($r->organization),
            'requested_amount' => $r->requested_amount,
            'note' => $r->note,
            'created_at' => $r->created_at?->format('Y-m-d H:i'),
        ])]);
    }

    public function approve(Request $request, CreditRequest $creditRequest, CreditService $credits): JsonResponse
    {
        abort_unless($creditRequest->status === 'pendiente', 409);
        $credits->grant($creditRequest->organization, $creditRequest->requested_amount, 'compra', "request:{$creditRequest->id}");
        $creditRequest->update(['status' => 'aprobada', 'resolved_by' => $request->user()->id, 'resolved_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function reject(Request $request, CreditRequest $creditRequest): JsonResponse
    {
        abort_unless($creditRequest->status === 'pendiente', 409);
        $creditRequest->update(['status' => 'rechazada', 'resolved_by' => $request->user()->id, 'resolved_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 6: Registrar rutas de admin**

En `backend/routes/api.php`, agregar un grupo nuevo:
```php
Route::middleware(['auth:sanctum', 'platform_admin'])->prefix('admin')->group(function () {
    Route::get('credit-requests', [\App\Http\Controllers\Admin\CreditRequestController::class, 'index']);
    Route::post('credit-requests/{creditRequest}/approve', [\App\Http\Controllers\Admin\CreditRequestController::class, 'approve']);
    Route::post('credit-requests/{creditRequest}/reject', [\App\Http\Controllers\Admin\CreditRequestController::class, 'reject']);
});
```

- [ ] **Step 7: Seeder del operador**

Crear `backend/database/seeders/PlatformAdminSeeder.php`:
```php
<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlatformAdminSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::updateOrCreate(['name' => 'Mez (operación)'], []);
        User::updateOrCreate(
            ['email' => 'admin@mez.dev'],
            [
                'name' => 'Operador Mez',
                'password' => Hash::make('password'), // [PENDIENTE: credenciales reales]
                'organization_id' => $org->id,
                'role' => 'admin',
                'is_platform_admin' => true,
            ]
        );
    }
}
```

Registrar en `DatabaseSeeder.php` (después de los demás):
```php
$this->call(PlatformAdminSeeder::class);
```

- [ ] **Step 8: Correr y ver pasar**

```bash
php artisan test tests/Feature/AdminCreditTest.php
php artisan test
```
Expected: PASS; suite completa verde.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: super-admin credit request approval with platform_admin guard and seeder"
```

---

## Task 8: Frontend — clientes API (RH + admin)

**Files:**
- Create: `frontend/src/api/rh.ts`, `frontend/src/api/admin.ts`

- [ ] **Step 1: Cliente RH**

Crear `frontend/src/api/rh.ts`:
```ts
import api from './axios'

export interface AssessmentSummary {
  id: number
  name: string
  position: string | null
  deadline: string | null
  status: string
  counts: { total: number; pendiente: number; iniciada: number; completada: number }
  created_at: string | null
}
export interface InvitationRow { id: number; candidate: string; email: string; status: string; link: string }
export interface AssessmentDetail { id: number; name: string; position: string | null; invitations: InvitationRow[] }
export interface CompareScale { code: string; name: string }
export interface CompareRow { invitation_id: number; candidate: string; status: string; scores: Record<string, { category: string; percentile: number | null; normalized: number | null }> }
export interface CompareData { assessment: { id: number; name: string }; scales: CompareScale[]; rows: CompareRow[] }
export interface CreditTx { type: string; amount: number; reference: string | null; created_at: string | null }
export interface CreditsData { balance: number; transactions: CreditTx[] }

export async function listAssessments(): Promise<AssessmentSummary[]> {
  const { data } = await api.get('/api/assessments'); return data.data
}
export async function getAssessment(id: number): Promise<AssessmentDetail> {
  const { data } = await api.get(`/api/assessments/${id}`); return data.data
}
export async function resendInvitation(id: number): Promise<void> {
  await api.post(`/api/invitations/${id}/resend`)
}
export async function compareAssessment(id: number): Promise<CompareData> {
  const { data } = await api.get(`/api/assessments/${id}/compare`); return data.data
}
export async function getCredits(): Promise<CreditsData> {
  const { data } = await api.get('/api/credits'); return data.data
}
export async function requestCredits(amount: number, note: string): Promise<void> {
  await api.post('/api/credit-requests', { requested_amount: amount, note })
}
```

- [ ] **Step 2: Cliente admin**

Crear `frontend/src/api/admin.ts`:
```ts
import api from './axios'

export interface PendingRequest {
  id: number
  organization: string
  organization_balance: number
  requested_amount: number
  note: string | null
  created_at: string | null
}

export async function listCreditRequests(): Promise<PendingRequest[]> {
  const { data } = await api.get('/api/admin/credit-requests'); return data.data
}
export async function approveRequest(id: number): Promise<void> {
  await api.post(`/api/admin/credit-requests/${id}/approve`)
}
export async function rejectRequest(id: number): Promise<void> {
  await api.post(`/api/admin/credit-requests/${id}/reject`)
}
```

- [ ] **Step 3: Verificar compila**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npx tsc --noEmit
```
Expected: sin errores en los dos archivos.

- [ ] **Step 4: Commit**

```bash
git add src/api/rh.ts src/api/admin.ts
git commit -m "feat: RH and admin API clients"
```

---

## Task 9: Frontend — AppLayout nav + Resumen + Lista

**Files:**
- Modify: `frontend/src/pages/app/AppLayout.tsx`, `AppLayout.css`
- Create: `frontend/src/pages/app/ResumenPage.tsx` + `.css`, `frontend/src/pages/app/EvaluacionesPage.tsx` + `.css`
- Modify: `frontend/src/App.tsx` (rutas)

- [ ] **Step 1: AppLayout con nav y saldo**

Reemplazar `frontend/src/pages/app/AppLayout.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { getCredits } from '@/api/rh'
import './AppLayout.css'

export default function AppLayout() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => { getCredits().then(c => setBalance(c.balance)).catch(() => setBalance(null)) }, [])

  async function handleLogout() {
    await logout(); setUser(null); navigate('/login')
  }

  return (
    <div className="applayout">
      <header className="applayout__bar">
        <Link to="/app" className="applayout__brand">Mez</Link>
        <nav className="applayout__nav" aria-label="Panel">
          <NavLink to="/app" end className={({ isActive }) => `applayout__link${isActive ? ' applayout__link--active' : ''}`}>Resumen</NavLink>
          <NavLink to="/app/evaluaciones" className={({ isActive }) => `applayout__link${isActive ? ' applayout__link--active' : ''}`}>Evaluaciones</NavLink>
          <NavLink to="/app/creditos" className={({ isActive }) => `applayout__link${isActive ? ' applayout__link--active' : ''}`}>Créditos</NavLink>
        </nav>
        <div className="applayout__right">
          {balance !== null && <span className="applayout__balance">Créditos: {balance}</span>}
          <button className="applayout__logout" onClick={handleLogout}>Salir</button>
        </div>
      </header>
      <main className="applayout__main">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Estilos de nav**

Añadir al final de `frontend/src/pages/app/AppLayout.css`:
```css
.applayout__nav { display: flex; gap: var(--sp-5); flex: 1; margin-inline: var(--sp-8); }
.applayout__link { font-size: var(--text-sm); font-weight: 500; color: var(--color-ink); }
.applayout__link--active { color: var(--color-hunter); border-bottom: 2px solid var(--color-hunter); }
.applayout__right { display: flex; align-items: center; gap: var(--sp-4); }
.applayout__balance { font-size: var(--text-sm); font-weight: 600; color: var(--color-brunswick); font-variant-numeric: tabular-nums; }
@media (max-width: 640px) { .applayout__nav { gap: var(--sp-3); margin-inline: var(--sp-3); } .applayout__balance { display: none; } }
```

- [ ] **Step 3: ResumenPage**

Crear `frontend/src/pages/app/ResumenPage.css`:
```css
.resumen { display: flex; flex-direction: column; gap: var(--sp-8); }
.resumen__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.resumen__cards { display: grid; grid-template-columns: 1fr; gap: var(--sp-4); }
@media (min-width: 640px) { .resumen__cards { grid-template-columns: 1fr 1fr; } }
.resumen__card { padding: var(--sp-6); border: 1px solid var(--color-timberwolf); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: var(--sp-2); }
.resumen__card-label { font-size: var(--text-sm); color: var(--color-ink); opacity: 0.7; }
.resumen__card-value { font-family: var(--font-display); font-size: var(--text-3xl); color: var(--color-brunswick); font-variant-numeric: tabular-nums; }
.resumen__list { display: flex; flex-direction: column; gap: var(--sp-2); }
.resumen__row { display: flex; justify-content: space-between; padding: var(--sp-3) 0; border-top: 1px solid var(--color-timberwolf); font-size: var(--text-sm); }
.resumen__link { color: var(--color-hunter); }
```

Crear `frontend/src/pages/app/ResumenPage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCredits, listAssessments, type AssessmentSummary } from '@/api/rh'
import './ResumenPage.css'

export default function ResumenPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([])

  useEffect(() => {
    getCredits().then(c => setBalance(c.balance)).catch(() => {})
    listAssessments().then(setAssessments).catch(() => {})
  }, [])

  const activas = assessments.filter(a => a.counts.completada < a.counts.total).length

  return (
    <div className="resumen">
      <h1 className="resumen__title">Resumen</h1>
      <div className="resumen__cards">
        <div className="resumen__card">
          <span className="resumen__card-label">Créditos disponibles</span>
          <span className="resumen__card-value">{balance ?? '—'}</span>
          <Link to="/app/creditos" className="resumen__link">Ver créditos</Link>
        </div>
        <div className="resumen__card">
          <span className="resumen__card-label">Evaluaciones activas</span>
          <span className="resumen__card-value">{activas}</span>
          <Link to="/app/evaluaciones" className="resumen__link">Ver evaluaciones</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: EvaluacionesPage (lista)**

Crear `frontend/src/pages/app/EvaluacionesPage.css`:
```css
.evals { display: flex; flex-direction: column; gap: var(--sp-6); }
.evals__head { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-4); flex-wrap: wrap; }
.evals__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.evals__table { width: 100%; border-collapse: collapse; }
.evals__table th, .evals__table td { text-align: left; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--color-timberwolf); font-size: var(--text-sm); }
.evals__table th { color: var(--color-ink); opacity: 0.6; font-weight: 600; }
.evals__progress { font-variant-numeric: tabular-nums; }
.evals__link { color: var(--color-hunter); font-weight: 500; }
.evals__empty { font-size: var(--text-base); opacity: 0.7; }
```

Crear `frontend/src/pages/app/EvaluacionesPage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAssessments, type AssessmentSummary } from '@/api/rh'
import Button from '@/components/ui/Button'
import './EvaluacionesPage.css'

export default function EvaluacionesPage() {
  const [items, setItems] = useState<AssessmentSummary[] | null>(null)

  useEffect(() => { listAssessments().then(setItems).catch(() => setItems([])) }, [])

  return (
    <div className="evals">
      <div className="evals__head">
        <h1 className="evals__title">Evaluaciones</h1>
        <Button to="/app/evaluaciones/nueva">Nueva evaluación</Button>
      </div>
      {items === null && <p className="evals__empty">Cargando…</p>}
      {items && items.length === 0 && <p className="evals__empty">Aún no tienes evaluaciones. Crea la primera.</p>}
      {items && items.length > 0 && (
        <table className="evals__table">
          <thead>
            <tr><th>Nombre</th><th>Puesto</th><th>Avance</th><th>Fecha</th><th></th></tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.position ?? '—'}</td>
                <td className="evals__progress">{a.counts.completada} de {a.counts.total} completadas</td>
                <td>{a.created_at ?? '—'}</td>
                <td><Link to={`/app/evaluaciones/${a.id}`} className="evals__link">Ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Rutas**

En `frontend/src/App.tsx`, importar y agregar dentro del `<Route path="/app" ...>` (junto a las existentes):
```tsx
import ResumenPage from '@/pages/app/ResumenPage'
import EvaluacionesPage from '@/pages/app/EvaluacionesPage'
```
```tsx
<Route index element={<ResumenPage />} />
<Route path="evaluaciones" element={<EvaluacionesPage />} />
```
(Mantener `evaluaciones/nueva` y `candidatos/:invitationId/reporte`.)

- [ ] **Step 6: Verificar compila y build**

```bash
npx tsc --noEmit && npm run build
```
Expected: limpio.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: app nav with balance, resumen dashboard, assessments list"
```

---

## Task 10: Frontend — Detalle de evaluación + Comparativa (CSV)

**Files:**
- Create: `frontend/src/pages/app/EvaluacionDetallePage.tsx` + `.css`, `frontend/src/pages/app/CompararPage.tsx` + `.css`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: EvaluacionDetallePage.css**

Crear `frontend/src/pages/app/EvaluacionDetallePage.css`:
```css
.evdet { display: flex; flex-direction: column; gap: var(--sp-6); }
.evdet__head { display: flex; justify-content: space-between; align-items: baseline; gap: var(--sp-4); flex-wrap: wrap; }
.evdet__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.evdet__sub { font-size: var(--text-sm); opacity: 0.7; }
.evdet__table { width: 100%; border-collapse: collapse; }
.evdet__table th, .evdet__table td { text-align: left; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--color-timberwolf); font-size: var(--text-sm); }
.evdet__table th { opacity: 0.6; font-weight: 600; }
.evdet__status { display: inline-flex; align-items: center; gap: var(--sp-1); font-weight: 600; }
.evdet__actions { display: flex; gap: var(--sp-3); flex-wrap: wrap; }
.evdet__btn { font-size: var(--text-sm); color: var(--color-hunter); background: none; }
.evdet__btn:disabled { opacity: 0.4; }
.evdet__link { font-size: var(--text-sm); color: var(--color-hunter); font-weight: 500; }
```

- [ ] **Step 2: EvaluacionDetallePage.tsx**

Crear `frontend/src/pages/app/EvaluacionDetallePage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAssessment, resendInvitation, type AssessmentDetail } from '@/api/rh'
import Button from '@/components/ui/Button'
import './EvaluacionDetallePage.css'

const STATUS_LABEL: Record<string, string> = {
  pendiente: '○ Pendiente', iniciada: '◐ Iniciada', completada: '● Completada', expirada: '× Expirada',
}

export default function EvaluacionDetallePage() {
  const { id } = useParams()
  const [data, setData] = useState<AssessmentDetail | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => { getAssessment(Number(id)).then(setData).catch(() => setData(null)) }, [id])

  async function resend(invId: number) {
    setBusy(invId)
    try { await resendInvitation(invId) } finally { setBusy(null) }
  }

  function copy(link: string, invId: number) {
    navigator.clipboard.writeText(link); setCopied(invId); setTimeout(() => setCopied(null), 1500)
  }

  if (!data) return <p>Cargando…</p>

  return (
    <div className="evdet">
      <div className="evdet__head">
        <div>
          <h1 className="evdet__title">{data.name}</h1>
          <p className="evdet__sub">{data.position ?? 'Sin puesto'}</p>
        </div>
        <Button to={`/app/evaluaciones/${data.id}/comparar`} variant="ghost">Comparar candidatos</Button>
      </div>

      <table className="evdet__table">
        <thead>
          <tr><th>Candidato</th><th>Correo</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {data.invitations.map(inv => (
            <tr key={inv.id}>
              <td>{inv.candidate}</td>
              <td>{inv.email}</td>
              <td><span className="evdet__status">{STATUS_LABEL[inv.status] ?? inv.status}</span></td>
              <td>
                <div className="evdet__actions">
                  <button className="evdet__btn" onClick={() => copy(inv.link, inv.id)}>{copied === inv.id ? 'Copiado' : 'Copiar enlace'}</button>
                  <button className="evdet__btn" disabled={inv.status === 'completada' || busy === inv.id} onClick={() => resend(inv.id)}>
                    {busy === inv.id ? 'Enviando…' : 'Reenviar'}
                  </button>
                  {inv.status === 'completada' && (
                    <Link className="evdet__link" to={`/app/candidatos/${inv.id}/reporte`}>Ver reporte</Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: CompararPage.css**

Crear `frontend/src/pages/app/CompararPage.css`:
```css
.comparar { display: flex; flex-direction: column; gap: var(--sp-6); }
.comparar__head { display: flex; justify-content: space-between; align-items: baseline; gap: var(--sp-4); flex-wrap: wrap; }
.comparar__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.comparar__wrap { overflow-x: auto; }
.comparar__table { width: 100%; border-collapse: collapse; min-width: 480px; }
.comparar__table th, .comparar__table td { text-align: left; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--color-timberwolf); font-size: var(--text-sm); white-space: nowrap; }
.comparar__th { cursor: pointer; user-select: none; color: var(--color-brunswick); font-weight: 600; }
.comparar__th:hover { color: var(--color-hunter); }
.comparar__cell { font-variant-numeric: tabular-nums; }
.comparar__cat { font-weight: 600; }
.comparar__empty { opacity: 0.7; }
```

- [ ] **Step 4: CompararPage.tsx (ordenable + CSV)**

Crear `frontend/src/pages/app/CompararPage.tsx`:
```tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { compareAssessment, type CompareData } from '@/api/rh'
import Button from '@/components/ui/Button'
import './CompararPage.css'

export default function CompararPage() {
  const { id } = useParams()
  const [data, setData] = useState<CompareData | null>(null)
  const [sortScale, setSortScale] = useState<string | null>(null)
  const [asc, setAsc] = useState(false)

  useEffect(() => { compareAssessment(Number(id)).then(setData).catch(() => setData(null)) }, [id])

  const rows = useMemo(() => {
    if (!data) return []
    if (!sortScale) return data.rows
    const sorted = [...data.rows].sort((a, b) => {
      const va = a.scores[sortScale]?.normalized ?? -1
      const vb = b.scores[sortScale]?.normalized ?? -1
      return asc ? va - vb : vb - va
    })
    return sorted
  }, [data, sortScale, asc])

  function toggleSort(code: string) {
    if (sortScale === code) setAsc(v => !v)
    else { setSortScale(code); setAsc(false) }
  }

  function exportCsv() {
    if (!data) return
    const header = ['Candidato', ...data.scales.map(s => s.name)]
    const lines = [header.join(',')]
    for (const row of rows) {
      const cells = [row.candidate, ...data.scales.map(s => {
        const sc = row.scores[s.code]
        return sc ? `${sc.category} (${sc.percentile ?? ''})` : ''
      })]
      lines.push(cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `comparativa-${data.assessment.name}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!data) return <p>Cargando…</p>

  return (
    <div className="comparar">
      <div className="comparar__head">
        <h1 className="comparar__title">Comparar · {data.assessment.name}</h1>
        {data.rows.length > 0 && <Button variant="ghost" onClick={exportCsv}>Exportar CSV</Button>}
      </div>

      {data.rows.length === 0 ? (
        <p className="comparar__empty">Aún no hay candidatos que hayan completado esta evaluación.</p>
      ) : (
        <div className="comparar__wrap">
          <table className="comparar__table">
            <thead>
              <tr>
                <th>Candidato</th>
                {data.scales.map(s => (
                  <th key={s.code} className="comparar__th" onClick={() => toggleSort(s.code)}>
                    {s.name}{sortScale === s.code ? (asc ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.invitation_id}>
                  <td>{row.candidate}</td>
                  {data.scales.map(s => {
                    const sc = row.scores[s.code]
                    return (
                      <td key={s.code} className="comparar__cell">
                        {sc ? <><span className="comparar__cat">{sc.category}</span> · pc {sc.percentile ?? '—'}</> : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

> Nota: aquí la flecha `↑/↓` indica el orden activo de la columna (affordance funcional de tabla ordenable), no decoración en botón/enlace.

- [ ] **Step 5: Rutas**

En `frontend/src/App.tsx`, importar y agregar dentro de `/app`:
```tsx
import EvaluacionDetallePage from '@/pages/app/EvaluacionDetallePage'
import CompararPage from '@/pages/app/CompararPage'
```
```tsx
<Route path="evaluaciones/:id" element={<EvaluacionDetallePage />} />
<Route path="evaluaciones/:id/comparar" element={<CompararPage />} />
```

- [ ] **Step 6: Verificar compila y build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: assessment detail (resend/copy/report) and comparison table with CSV export"
```

---

## Task 11: Frontend — Créditos + PDF del reporte

**Files:**
- Create: `frontend/src/pages/app/CreditosPage.tsx` + `.css`
- Modify: `frontend/src/pages/app/ReporteCandidato.tsx`, `frontend/src/sections/Report.css`, `frontend/src/App.tsx`

- [ ] **Step 1: CreditosPage.css**

Crear `frontend/src/pages/app/CreditosPage.css`:
```css
.creditos { display: flex; flex-direction: column; gap: var(--sp-8); }
.creditos__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.creditos__balance { font-family: var(--font-display); font-size: var(--text-4xl); color: var(--color-brunswick); font-variant-numeric: tabular-nums; }
.creditos__section-title { font-family: var(--font-display); font-size: var(--text-xl); color: var(--color-brunswick); }
.creditos__table { width: 100%; border-collapse: collapse; }
.creditos__table th, .creditos__table td { text-align: left; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--color-timberwolf); font-size: var(--text-sm); }
.creditos__amount { font-variant-numeric: tabular-nums; font-weight: 600; }
.creditos__amount--pos { color: var(--color-success); }
.creditos__amount--neg { color: var(--color-ink); }
.creditos__form { display: flex; flex-direction: column; gap: var(--sp-4); max-width: 420px; }
.creditos__field { display: flex; flex-direction: column; gap: var(--sp-2); }
.creditos__label { font-size: var(--text-sm); font-weight: 500; color: var(--color-brunswick); }
.creditos__input, .creditos__textarea { padding: var(--sp-3) var(--sp-4); border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-base); }
.creditos__input:focus, .creditos__textarea:focus { border-color: var(--color-hunter); outline: none; }
.creditos__ok { color: var(--color-success); font-size: var(--text-sm); }
```

- [ ] **Step 2: CreditosPage.tsx**

Crear `frontend/src/pages/app/CreditosPage.tsx`:
```tsx
import { useEffect, useState, type FormEvent } from 'react'
import { getCredits, requestCredits, type CreditsData } from '@/api/rh'
import Button from '@/components/ui/Button'
import './CreditosPage.css'

const TYPE_LABEL: Record<string, string> = {
  compra: 'Compra', consumo: 'Consumo', cortesia: 'Cortesía', ajuste: 'Ajuste',
}

export default function CreditosPage() {
  const [data, setData] = useState<CreditsData | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  function load() { getCredits().then(setData).catch(() => {}) }
  useEffect(load, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try { await requestCredits(Number(amount), note); setSent(true); setAmount(''); setNote('') } finally { setLoading(false) }
  }

  return (
    <div className="creditos">
      <div>
        <h1 className="creditos__title">Créditos</h1>
        <p className="creditos__balance">{data?.balance ?? '—'}</p>
      </div>

      <div>
        <h2 className="creditos__section-title">Solicitar más créditos</h2>
        <form className="creditos__form" onSubmit={submit}>
          <div className="creditos__field">
            <label className="creditos__label" htmlFor="amount">Cantidad</label>
            <input id="amount" className="creditos__input" type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div className="creditos__field">
            <label className="creditos__label" htmlFor="note">Nota (opcional)</label>
            <textarea id="note" className="creditos__textarea" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <Button type="submit" loading={loading}>Enviar solicitud</Button>
          {sent && <p className="creditos__ok">Solicitud registrada. Un asesor la revisará.</p>}
        </form>
      </div>

      <div>
        <h2 className="creditos__section-title">Historial</h2>
        <table className="creditos__table">
          <thead><tr><th>Tipo</th><th>Monto</th><th>Referencia</th><th>Fecha</th></tr></thead>
          <tbody>
            {(data?.transactions ?? []).map((t, i) => (
              <tr key={i}>
                <td>{TYPE_LABEL[t.type] ?? t.type}</td>
                <td className={`creditos__amount ${t.amount >= 0 ? 'creditos__amount--pos' : 'creditos__amount--neg'}`}>{t.amount >= 0 ? `+${t.amount}` : t.amount}</td>
                <td>{t.reference ?? '—'}</td>
                <td>{t.created_at ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Botón PDF en ReporteCandidato**

Reemplazar `frontend/src/pages/app/ReporteCandidato.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getReport, type ReportData } from '@/api/report'
import Report from '@/sections/Report'
import Button from '@/components/ui/Button'

export default function ReporteCandidato() {
  const { invitationId } = useParams()
  const [data, setData] = useState<ReportData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getReport(Number(invitationId)).then(setData).catch(() => setError('No se pudo cargar el reporte (¿la evaluación está completada?).'))
  }, [invitationId])

  if (error) return <p>{error}</p>
  if (!data) return <p>Cargando reporte…</p>

  return (
    <div>
      <div className="report-toolbar no-print" style={{ marginBottom: 'var(--sp-6)' }}>
        <Button variant="ghost" onClick={() => window.print()}>Descargar PDF</Button>
      </div>
      <Report data={data} />
    </div>
  )
}
```

- [ ] **Step 4: CSS de impresión**

Añadir al final de `frontend/src/sections/Report.css`:
```css
@media print {
  .no-print, .header, .applayout__bar, .footer { display: none !important; }
  body { padding-top: 0 !important; }
  .applayout__main { padding: 0 !important; }
  .report { gap: 1rem; }
}
```

- [ ] **Step 5: Ruta de créditos**

En `frontend/src/App.tsx`, importar y agregar dentro de `/app`:
```tsx
import CreditosPage from '@/pages/app/CreditosPage'
```
```tsx
<Route path="creditos" element={<CreditosPage />} />
```

- [ ] **Step 6: Verificar compila y build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: credits page (balance/history/request) and report PDF via print CSS"
```

---

## Task 12: Frontend — Super-admin (/admin/creditos)

**Files:**
- Create: `frontend/src/pages/admin/AdminLayout.tsx` + `.css`, `frontend/src/pages/admin/AdminCreditosPage.tsx` + `.css`, `frontend/src/components/RequirePlatformAdmin.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: RequirePlatformAdmin**

Crear `frontend/src/components/RequirePlatformAdmin.tsx`:
```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { ReactNode } from 'react'

export default function RequirePlatformAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ padding: '2rem' }}>Cargando…</p>
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_platform_admin) return <Navigate to="/app" replace />
  return <>{children}</>
}
```

> Requiere que `AuthUser` tenga `is_platform_admin`. En `frontend/src/api/auth.ts`, agregar `is_platform_admin?: boolean` a la interfaz `AuthUser`.

- [ ] **Step 2: Agregar is_platform_admin al tipo AuthUser**

En `frontend/src/api/auth.ts`, en la interfaz `AuthUser`, agregar la propiedad:
```ts
  is_platform_admin?: boolean
```

- [ ] **Step 3: AdminLayout**

Crear `frontend/src/pages/admin/AdminLayout.css`:
```css
.admin { min-height: 100svh; display: flex; flex-direction: column; }
.admin__bar { height: var(--header-h); border-bottom: 1px solid var(--color-timberwolf); display: flex; align-items: center; justify-content: space-between; padding-inline: var(--section-px); }
.admin__brand { font-family: var(--font-display); font-size: var(--text-xl); color: var(--color-brunswick); font-weight: 600; }
.admin__tag { font-size: var(--text-xs); color: var(--color-ink); opacity: 0.6; }
.admin__main { flex: 1; padding: var(--sp-8) var(--section-px); max-width: 960px; margin-inline: auto; width: 100%; }
```

Crear `frontend/src/pages/admin/AdminLayout.tsx`:
```tsx
import { Outlet, useNavigate } from 'react-router-dom'
import { logout } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import './AdminLayout.css'

export default function AdminLayout() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  async function handleLogout() { await logout(); setUser(null); navigate('/login') }

  return (
    <div className="admin">
      <header className="admin__bar">
        <span className="admin__brand">Mez <span className="admin__tag">· operación</span></span>
        <button className="applayout__logout" onClick={handleLogout}>Salir</button>
      </header>
      <main className="admin__main"><Outlet /></main>
    </div>
  )
}
```

- [ ] **Step 4: AdminCreditosPage**

Crear `frontend/src/pages/admin/AdminCreditosPage.css`:
```css
.admincred { display: flex; flex-direction: column; gap: var(--sp-6); }
.admincred__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.admincred__table { width: 100%; border-collapse: collapse; }
.admincred__table th, .admincred__table td { text-align: left; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--color-timberwolf); font-size: var(--text-sm); }
.admincred__actions { display: flex; gap: var(--sp-3); }
.admincred__approve { color: var(--color-success); font-weight: 600; background: none; }
.admincred__reject { color: var(--color-error); font-weight: 600; background: none; }
.admincred__empty { opacity: 0.7; }
```

Crear `frontend/src/pages/admin/AdminCreditosPage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { listCreditRequests, approveRequest, rejectRequest, type PendingRequest } from '@/api/admin'
import './AdminCreditosPage.css'

export default function AdminCreditosPage() {
  const [items, setItems] = useState<PendingRequest[] | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  function load() { listCreditRequests().then(setItems).catch(() => setItems([])) }
  useEffect(load, [])

  async function act(id: number, action: 'approve' | 'reject') {
    setBusy(id)
    try {
      if (action === 'approve') await approveRequest(id)
      else await rejectRequest(id)
      setItems(prev => (prev ?? []).filter(r => r.id !== id))
    } finally { setBusy(null) }
  }

  return (
    <div className="admincred">
      <h1 className="admincred__title">Solicitudes de créditos</h1>
      {items === null && <p className="admincred__empty">Cargando…</p>}
      {items && items.length === 0 && <p className="admincred__empty">No hay solicitudes pendientes.</p>}
      {items && items.length > 0 && (
        <table className="admincred__table">
          <thead>
            <tr><th>Empresa</th><th>Saldo actual</th><th>Solicita</th><th>Nota</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id}>
                <td>{r.organization}</td>
                <td>{r.organization_balance}</td>
                <td>{r.requested_amount}</td>
                <td>{r.note ?? '—'}</td>
                <td>{r.created_at ?? '—'}</td>
                <td>
                  <div className="admincred__actions">
                    <button className="admincred__approve" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}>Aprobar</button>
                    <button className="admincred__reject" disabled={busy === r.id} onClick={() => act(r.id, 'reject')}>Rechazar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Rutas de admin**

En `frontend/src/App.tsx`, importar y agregar un árbol nuevo (fuera de `/app`):
```tsx
import RequirePlatformAdmin from '@/components/RequirePlatformAdmin'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminCreditosPage from '@/pages/admin/AdminCreditosPage'
```
```tsx
<Route path="/admin" element={<RequirePlatformAdmin><AdminLayout /></RequirePlatformAdmin>}>
  <Route path="creditos" element={<AdminCreditosPage />} />
</Route>
```

- [ ] **Step 6: Verificar compila y build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: super-admin surface for credit request approval"
```

---

## Task 13: Verificación end-to-end

**Files:** (solo verificación)

- [ ] **Step 1: Preparar backend**

```bash
cd C:\Users\geova\Documents\Mezquit\backend
php artisan migrate:fresh --seed
php artisan test
php artisan serve --port=8000
```
Expected: toda la suite verde.

- [ ] **Step 2: Frontend**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npm run dev
```

- [ ] **Step 3: Flujo manual**

1. Registrarse → `/app` muestra saldo 10 (cortesía).
2. Crear evaluación con 2 candidatos → saldo baja a 8; enlaces copiables.
3. `/app/evaluaciones` lista la evaluación con avance.
4. Completar un candidato (abrir su enlace y responder) → en detalle, "Ver reporte" activo; reporte con botón "Descargar PDF" (probar `window.print`).
5. `/app/evaluaciones/:id/comparar` muestra la fila; ordenar por columna; "Exportar CSV" descarga.
6. `/app/creditos`: historial (cortesía + consumo); solicitar 50 créditos.
7. Entrar como operador (`admin@mez.dev` / `password`) → `/admin/creditos` muestra la solicitud; aprobar → saldo de la org sube 50.

- [ ] **Step 4: Screenshots**

```bash
npx playwright screenshot --browser chromium --viewport-size "1440,900" --full-page "http://localhost:5173/app/evaluaciones" "C:/Users/geova/AppData/Local/Temp/f2-lista.png"
npx playwright screenshot --browser chromium --viewport-size "1440,900" --full-page "http://localhost:5173/app/creditos" "C:/Users/geova/AppData/Local/Temp/f2-creditos.png"
```

- [ ] **Step 5: Revisar y reportar**

Verificar: nav con saldo, lista con avance, detalle con estados (ícono+texto), comparativa ordenable + CSV, créditos con historial, admin con aprobar/rechazar. Panel denso y sobrio. Reportar issues.

---

## Self-review

- [ ] Saldo = suma de transacciones (Task 2), nunca editable.
- [ ] Bloqueo por saldo insuficiente al crear evaluación (Task 3).
- [ ] Lista con conteos, reenvío con 409 en completada (Task 4).
- [ ] Comparativa solo completadas, ordenable + CSV (Task 5, 10).
- [ ] Créditos: historial + solicitud (Task 6, 11).
- [ ] Super-admin guard 403 + aprobación registra `compra` (Task 7, 12).
- [ ] PDF desde el mismo `Report` con print CSS (Task 11).
- [ ] Aislamiento por organización en todos los endpoints RH.

## Lista de [PENDIENTE]

1. `[PENDIENTE: número de créditos de cortesía]` (`config/credits.php`)
2. Credenciales reales del operador super-admin (dev: `admin@mez.dev` / `password`)
3. Precios de planes (siguen en `data/plans.ts`)
