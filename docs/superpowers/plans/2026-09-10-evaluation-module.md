# Evaluation Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un API REST CRUD completo para el recurso `Evaluation` en Laravel, siguiendo las convenciones PHP 8.3 del proyecto.

**Architecture:** API REST bajo `/api/evaluations` con 5 endpoints estándar (index, store, show, update, destroy), respaldados por un modelo Eloquent y Form Requests para validación. Sin autenticación en esta fase.

**Tech Stack:** Laravel 13, PHP 8.3, MySQL 8.4 (Docker), PHPUnit 12, React 19, TypeScript, Axios

---

## Mapa de Archivos

| Acción  | Archivo | Responsabilidad |
|---------|---------|-----------------|
| Instalar | `backend/` (Laravel Boost) | Genera AGENTS.md con guías del proyecto |
| Modificar | `backend/bootstrap/app.php` | Registrar routes/api.php |
| Crear | `backend/routes/api.php` | Definición de rutas API |
| Modificar | `backend/.env` | Conexión MySQL |
| Crear | `backend/database/migrations/XXXX_create_evaluations_table.php` | Esquema de BD |
| Crear | `backend/app/Models/Evaluation.php` | Modelo Eloquent |
| Crear | `backend/database/factories/EvaluationFactory.php` | Datos de prueba |
| Crear | `backend/app/Http/Requests/StoreEvaluationRequest.php` | Validación creación |
| Crear | `backend/app/Http/Requests/UpdateEvaluationRequest.php` | Validación actualización |
| Crear | `backend/app/Http/Controllers/EvaluationController.php` | Controlador CRUD |
| Crear | `backend/tests/Feature/EvaluationTest.php` | Tests de feature |
| Modificar | `frontend/src/api/axios.ts` | Configurar cliente HTTP |
| Crear | `frontend/.env` | URL base de la API |

---

## Task 0: Prerequisito — Laravel Boost

**Files:**
- Modify: `backend/CLAUDE.md` → se auto-reemplaza con `AGENTS.md`

El `CLAUDE.md` del proyecto requiere instalar Laravel Boost antes de cualquier cambio. Boost genera guías específicas del proyecto en `AGENTS.md`.

- [ ] **Step 1: Instalar Laravel Boost**

```bash
cd backend
composer require laravel/boost --dev
php artisan boost:install
```

Expected: Se crea `backend/AGENTS.md` con guías específicas de la app.

- [ ] **Step 2: Leer AGENTS.md y verificar si contradice este plan**

```bash
cat backend/AGENTS.md
```

Expected: Si AGENTS.md define convenciones distintas (ej. sin PHP attributes, distinto response format), ajustar los Tasks siguientes. Si está vacío o confirma las convenciones actuales, continuar.

- [ ] **Step 3: Verificar PHP y Composer disponibles**

```bash
php -v
composer -V
```

Expected: PHP 8.3+ y Composer 2.x.

---

## Task 1: Configurar Conexión MySQL

**Files:**
- Modify: `backend/.env`

- [ ] **Step 1: Actualizar .env para MySQL**

Abrir `backend/.env` y reemplazar las líneas `DB_*`:

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=Mezquit
DB_USERNAME=mezquit
DB_PASSWORD=mezquit
```

- [ ] **Step 2: Levantar MySQL con Docker**

```bash
docker compose up -d
docker compose ps
```

Expected: Contenedor `mi_mysql` con estado `Up`.

- [ ] **Step 3: Verificar conexión**

```bash
cd backend
php artisan db:show
```

Expected: Muestra MySQL 8.4 conectado a base de datos `Mezquit`.

---

## Task 2: Registrar routes/api.php

**Files:**
- Create: `backend/routes/api.php`
- Modify: `backend/bootstrap/app.php`

- [ ] **Step 1: Crear el archivo de rutas API**

Crear `backend/routes/api.php`:

```php
<?php

use App\Http\Controllers\EvaluationController;
use Illuminate\Support\Facades\Route;

Route::apiResource('evaluations', EvaluationController::class);
```

- [ ] **Step 2: Registrar api.php en bootstrap/app.php**

Abrir `backend/bootstrap/app.php`. El `->withRouting(` actualmente es:

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

Reemplazar con:

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    api: __DIR__.'/../routes/api.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

- [ ] **Step 3: Verificar que las rutas se registraron**

```bash
cd backend
php artisan route:list --path=api
```

Expected: 5 rutas bajo `api/evaluations` (index, store, show, update, destroy). Si el controlador no existe aún, puede mostrar error — es normal en este punto.

---

## Task 3: Crear Migration

**Files:**
- Create: `backend/database/migrations/XXXX_create_evaluations_table.php`

- [ ] **Step 1: Generar la migration**

```bash
cd backend
php artisan make:migration create_evaluations_table
```

Expected: Archivo creado en `database/migrations/` con nombre tipo `2026_09_10_XXXXXX_create_evaluations_table.php`.

- [ ] **Step 2: Implementar el esquema**

Abrir el archivo recién creado y reemplazar su contenido completo:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
```

- [ ] **Step 3: Ejecutar la migration**

```bash
cd backend
php artisan migrate
```

Expected: `Migrated: 2026_09_10_XXXXXX_create_evaluations_table`.

---

## Task 4: Crear Modelo Evaluation y Factory

**Files:**
- Create: `backend/app/Models/Evaluation.php`
- Create: `backend/database/factories/EvaluationFactory.php`

- [ ] **Step 1: Crear el modelo**

Crear `backend/app/Models/Evaluation.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['title', 'description', 'status', 'starts_at', 'ends_at', 'user_id'])]
class Evaluation extends Model
{
    use HasFactory;

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];
}
```

> Nota: Sigue la convención del proyecto (`User.php`) usando `#[Fillable]` PHP 8 attribute en lugar de `protected $fillable = [...]`.

- [ ] **Step 2: Crear la factory**

Crear `backend/database/factories/EvaluationFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\Evaluation;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvaluationFactory extends Factory
{
    protected $model = Evaluation::class;

    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('now', '+1 month');
        $end = $this->faker->dateTimeBetween($start, '+2 months');

        return [
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['draft', 'published', 'closed']),
            'starts_at' => $start,
            'ends_at' => $end,
            'user_id' => null,
        ];
    }
}
```

---

## Task 5: Escribir Tests de Feature (TDD — escribir ANTES del controller)

**Files:**
- Create: `backend/tests/Feature/EvaluationTest.php`

- [ ] **Step 1: Crear el archivo de tests**

Crear `backend/tests/Feature/EvaluationTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Evaluation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EvaluationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_evaluations(): void
    {
        Evaluation::factory()->count(3)->create();

        $this->getJson('/api/evaluations')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_evaluation(): void
    {
        $payload = [
            'title' => 'Evaluación de Matemáticas',
            'description' => 'Primer parcial del semestre',
            'status' => 'draft',
            'starts_at' => '2026-09-15 08:00:00',
            'ends_at' => '2026-09-15 10:00:00',
        ];

        $this->postJson('/api/evaluations', $payload)
            ->assertStatus(201)
            ->assertJsonFragment(['title' => 'Evaluación de Matemáticas'])
            ->assertJsonFragment(['status' => 'draft']);
    }

    public function test_create_evaluation_requires_title(): void
    {
        $this->postJson('/api/evaluations', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    }

    public function test_create_evaluation_rejects_invalid_status(): void
    {
        $this->postJson('/api/evaluations', [
            'title' => 'Test',
            'status' => 'invalido',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['status']);
    }

    public function test_can_show_evaluation(): void
    {
        $evaluation = Evaluation::factory()->create();

        $this->getJson("/api/evaluations/{$evaluation->id}")
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $evaluation->id])
            ->assertJsonFragment(['title' => $evaluation->title]);
    }

    public function test_show_returns_404_for_nonexistent_evaluation(): void
    {
        $this->getJson('/api/evaluations/9999')
            ->assertStatus(404);
    }

    public function test_can_update_evaluation(): void
    {
        $evaluation = Evaluation::factory()->create(['title' => 'Original', 'status' => 'draft']);

        $this->putJson("/api/evaluations/{$evaluation->id}", [
            'title' => 'Actualizado',
            'status' => 'published',
        ])->assertStatus(200)
          ->assertJsonFragment(['title' => 'Actualizado'])
          ->assertJsonFragment(['status' => 'published']);
    }

    public function test_update_rejects_invalid_status(): void
    {
        $evaluation = Evaluation::factory()->create();

        $this->putJson("/api/evaluations/{$evaluation->id}", [
            'status' => 'no-valido',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['status']);
    }

    public function test_can_delete_evaluation(): void
    {
        $evaluation = Evaluation::factory()->create();

        $this->deleteJson("/api/evaluations/{$evaluation->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('evaluations', ['id' => $evaluation->id]);
    }

    public function test_delete_returns_404_for_nonexistent_evaluation(): void
    {
        $this->deleteJson('/api/evaluations/9999')
            ->assertStatus(404);
    }
}
```

- [ ] **Step 2: Ejecutar tests — deben FALLAR**

```bash
cd backend
php artisan test tests/Feature/EvaluationTest.php
```

Expected: Todos fallan con errores como "Class App\Http\Controllers\EvaluationController not found". Esto confirma que los tests son válidos y están listos para guiar la implementación.

---

## Task 6: Crear StoreEvaluationRequest

**Files:**
- Create: `backend/app/Http/Requests/StoreEvaluationRequest.php`

- [ ] **Step 1: Generar el Form Request**

```bash
cd backend
php artisan make:request StoreEvaluationRequest
```

- [ ] **Step 2: Implementar reglas de validación**

Abrir `backend/app/Http/Requests/StoreEvaluationRequest.php` y reemplazar su contenido:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status'      => ['nullable', 'in:draft,published,closed'],
            'starts_at'   => ['nullable', 'date'],
            'ends_at'     => ['nullable', 'date', 'after:starts_at'],
            'user_id'     => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
```

---

## Task 7: Crear UpdateEvaluationRequest

**Files:**
- Create: `backend/app/Http/Requests/UpdateEvaluationRequest.php`

- [ ] **Step 1: Generar el Form Request**

```bash
cd backend
php artisan make:request UpdateEvaluationRequest
```

- [ ] **Step 2: Implementar reglas de validación**

Abrir `backend/app/Http/Requests/UpdateEvaluationRequest.php` y reemplazar su contenido:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status'      => ['sometimes', 'in:draft,published,closed'],
            'starts_at'   => ['nullable', 'date'],
            'ends_at'     => ['nullable', 'date', 'after:starts_at'],
            'user_id'     => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
```

> Nota: `sometimes` permite omitir campos en PATCH — solo valida si el campo está presente en el request.

---

## Task 8: Crear EvaluationController

**Files:**
- Create: `backend/app/Http/Controllers/EvaluationController.php`

- [ ] **Step 1: Generar el controlador API**

```bash
cd backend
php artisan make:controller EvaluationController --api
```

- [ ] **Step 2: Implementar todos los métodos CRUD**

Abrir `backend/app/Http/Controllers/EvaluationController.php` y reemplazar su contenido:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEvaluationRequest;
use App\Http\Requests\UpdateEvaluationRequest;
use App\Models\Evaluation;
use Illuminate\Http\JsonResponse;

class EvaluationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Evaluation::all()]);
    }

    public function store(StoreEvaluationRequest $request): JsonResponse
    {
        $evaluation = Evaluation::create($request->validated());

        return response()->json($evaluation, 201);
    }

    public function show(Evaluation $evaluation): JsonResponse
    {
        return response()->json($evaluation);
    }

    public function update(UpdateEvaluationRequest $request, Evaluation $evaluation): JsonResponse
    {
        $evaluation->update($request->validated());

        return response()->json($evaluation);
    }

    public function destroy(Evaluation $evaluation): JsonResponse
    {
        $evaluation->delete();

        return response()->json(null, 204);
    }
}
```

---

## Task 9: Ejecutar Tests y Verificar

**Files:** (solo verificación)

- [ ] **Step 1: Correr todos los tests**

```bash
cd backend
php artisan test
```

Expected: Todos los tests pasan, incluyendo los 9 de `EvaluationTest` y los 2 existentes de Laravel (`ExampleTest`).

```
Tests:  11 passed
```

- [ ] **Step 2: Verificar rutas disponibles**

```bash
cd backend
php artisan route:list --path=api
```

Expected:
```
GET|HEAD   api/evaluations                evaluations.index    EvaluationController@index
POST       api/evaluations                evaluations.store    EvaluationController@store
GET|HEAD   api/evaluations/{evaluation}   evaluations.show     EvaluationController@show
PUT|PATCH  api/evaluations/{evaluation}   evaluations.update   EvaluationController@update
DELETE     api/evaluations/{evaluation}   evaluations.destroy  EvaluationController@destroy
```

- [ ] **Step 3: Commit del módulo backend**

```bash
cd backend
git init
git add routes/api.php bootstrap/app.php database/migrations/ app/Models/Evaluation.php database/factories/EvaluationFactory.php app/Http/Requests/StoreEvaluationRequest.php app/Http/Requests/UpdateEvaluationRequest.php app/Http/Controllers/EvaluationController.php tests/Feature/EvaluationTest.php .env
git commit -m "feat: add Evaluation CRUD API with validation and feature tests"
```

---

## Task 10: Configurar Cliente Axios en Frontend

**Files:**
- Modify: `frontend/src/api/axios.ts`
- Create: `frontend/.env`

- [ ] **Step 1: Crear .env del frontend**

Crear `frontend/.env`:

```ini
VITE_API_URL=http://localhost:8000
```

- [ ] **Step 2: Configurar el cliente Axios**

Reemplazar el contenido vacío de `frontend/src/api/axios.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export default api;
```

- [ ] **Step 3: Verificar que TypeScript compila**

```bash
cd frontend
npm run build
```

Expected: Sin errores de TypeScript. El archivo `axios.ts` usa `import.meta.env.VITE_API_URL` que Vite tipea correctamente.

- [ ] **Step 4: Commit del frontend**

```bash
cd frontend
git init
git add src/api/axios.ts .env
git commit -m "feat: configure Axios client pointing to Laravel API"
```

---

## Endpoints Resultantes

| Método | URL | Descripción | Body requerido |
|--------|-----|-------------|----------------|
| GET | `/api/evaluations` | Lista todas las evaluaciones | — |
| POST | `/api/evaluations` | Crea una evaluación | `title` (req), `description`, `status`, `starts_at`, `ends_at` |
| GET | `/api/evaluations/{id}` | Muestra una evaluación | — |
| PUT/PATCH | `/api/evaluations/{id}` | Actualiza una evaluación | cualquier campo |
| DELETE | `/api/evaluations/{id}` | Elimina una evaluación | — |

## Campos del Modelo Evaluation

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| `title` | string | Sí | max 255 caracteres |
| `description` | text | No | |
| `status` | enum | No | `draft` (default), `published`, `closed` |
| `starts_at` | timestamp | No | |
| `ends_at` | timestamp | No | debe ser después de `starts_at` |
| `user_id` | FK users | No | null on delete |
