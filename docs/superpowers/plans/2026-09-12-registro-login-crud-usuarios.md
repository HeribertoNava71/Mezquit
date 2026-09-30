# Mez — Registro/Login premium + CRUD de usuarios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar registro/login con campos de perfil completos y animaciones CSS, agregar links de auth al header público, y crear el CRUD de usuarios para el super-admin.

**Architecture:** Backend: migración de nuevos campos de perfil, actualización de RegisterRequest/Controller, nuevos endpoints de perfil y admin CRUD de usuarios. Frontend: formulario de una sola pantalla con floating labels y animaciones CSS puras (sin librerías), header adaptivo por estado de sesión, páginas de perfil y admin.

**Tech Stack:** Laravel 13, PHP 8.4, React 19, TypeScript, React Router v7, CSS vanilla.

**Spec:** `docs/superpowers/specs/2026-09-12-registro-login-crud-usuarios-design.md`

**Convenciones:** `#[Fillable]`, migraciones anónimas, `RefreshDatabase`. Animaciones solo con `@keyframes` CSS, sin instalar librerías. `prefers-reduced-motion` respetado.

---

## Task 1: Migración + modelos — campos de perfil

**Files:**
- Create: `backend/database/migrations/XXXX_add_profile_fields_to_users_table.php`
- Modify: `backend/app/Models/User.php`
- Modify: `backend/.env.example`, `backend/database/seeders/PlatformAdminSeeder.php`

- [ ] **Step 1: Generar migración**

```bash
cd C:\Users\geova\Documents\Mezquit\backend
php artisan make:migration add_profile_fields_to_users_table
```

Reemplazar el cuerpo del archivo generado:

```php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('last_name')->nullable()->after('name');
        $table->string('phone', 30)->nullable()->after('last_name');
        $table->date('birth_date')->nullable()->after('phone');
        $table->string('position')->nullable()->after('birth_date');
        $table->timestamp('privacy_accepted_at')->nullable()->after('position');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['last_name', 'phone', 'birth_date', 'position', 'privacy_accepted_at']);
    });
}
```

- [ ] **Step 2: Actualizar User.php**

Reemplazar el atributo `#[Fillable]` en `backend/app/Models/User.php`:

```php
#[Fillable(['name', 'last_name', 'email', 'password', 'organization_id', 'role', 'is_platform_admin', 'phone', 'birth_date', 'position', 'privacy_accepted_at'])]
```

Y en `casts()`:
```php
protected function casts(): array
{
    return [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_platform_admin' => 'boolean',
        'birth_date' => 'date',
        'privacy_accepted_at' => 'datetime',
    ];
}
```

- [ ] **Step 3: Actualizar PlatformAdminSeeder para usar .env**

Reemplazar `backend/database/seeders/PlatformAdminSeeder.php`:

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
            ['email' => env('ADMIN_EMAIL', 'admin@mez.dev')],
            [
                'name' => 'Operador',
                'last_name' => 'Mez',
                'password' => Hash::make(env('ADMIN_PASSWORD', 'password')),
                'organization_id' => $org->id,
                'role' => 'admin',
                'is_platform_admin' => true,
            ]
        );
    }
}
```

- [ ] **Step 4: Documentar en .env.example**

Añadir al final de `backend/.env.example`:

```ini
# Super-admin del sistema (operador Mez)
ADMIN_EMAIL=admin@mez.dev
ADMIN_PASSWORD=password
```

- [ ] **Step 5: Migrar y verificar**

```bash
php artisan migrate:fresh --seed
php artisan test
```

Expected: suite verde, columnas nuevas en la tabla users.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add profile fields to users table and env-based admin seeder"
```

---

## Task 2: Backend — Registro actualizado (TDD)

**Files:**
- Modify: `backend/app/Http/Requests/RegisterRequest.php`
- Modify: `backend/app/Http/Controllers/Auth/RegisterController.php`
- Test: `backend/tests/Feature/RegistroTest.php`

- [ ] **Step 1: Escribir el test que falla**

Crear `backend/tests/Feature/RegistroTest.php`:

```php
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistroTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Ana',
            'last_name' => 'López',
            'email' => 'ana@empresa.com',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
            'company_name' => 'Empresa SA',
            'sector' => 'comercio',
            'company_size' => '11-50',
            'phone' => '8121234567',
            'birth_date' => '1990-05-15',
            'position' => 'Directora de RH',
            'privacy_accepted' => true,
        ], $overrides);
    }

    public function test_register_saves_profile_fields(): void
    {
        $this->postJson('/api/register', $this->payload())->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'email' => 'ana@empresa.com',
            'last_name' => 'López',
            'phone' => '8121234567',
            'position' => 'Directora de RH',
        ]);
        $this->assertNotNull(\App\Models\User::where('email', 'ana@empresa.com')->first()->privacy_accepted_at);
    }

    public function test_register_requires_last_name(): void
    {
        $this->postJson('/api/register', $this->payload(['last_name' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['last_name']);
    }

    public function test_register_requires_privacy_accepted(): void
    {
        $this->postJson('/api/register', $this->payload(['privacy_accepted' => false]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['privacy_accepted']);
    }

    public function test_register_requires_password_confirmation(): void
    {
        $this->postJson('/api/register', $this->payload(['password_confirmation' => 'diferente']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['password_confirmation']);
    }

    public function test_register_without_company_creates_user_without_org(): void
    {
        $payload = $this->payload(['company_name' => null]);
        unset($payload['company_name'], $payload['sector'], $payload['company_size']);

        $this->postJson('/api/register', $payload)->assertStatus(201);

        $user = \App\Models\User::where('email', 'ana@empresa.com')->first();
        $this->assertNull($user->organization_id);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/RegistroTest.php
```

Expected: FAIL — campos no validados ni guardados.

- [ ] **Step 3: Actualizar RegisterRequest**

Reemplazar `backend/app/Http/Requests/RegisterRequest.php`:

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
            'name'                  => ['required', 'string', 'max:255'],
            'last_name'             => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'              => ['required', 'string', 'min:8'],
            'password_confirmation' => ['required', 'same:password'],
            'company_name'          => ['nullable', 'string', 'max:255'],
            'sector'                => ['nullable', 'in:comercio,manufactura,servicios,otro'],
            'company_size'          => ['nullable', 'in:1-10,11-50,51-250,250+'],
            'phone'                 => ['nullable', 'string', 'max:30'],
            'birth_date'            => ['nullable', 'date', 'before:today'],
            'position'              => ['nullable', 'string', 'max:255'],
            'privacy_accepted'      => ['required', 'accepted'],
        ];
    }
}
```

- [ ] **Step 4: Actualizar RegisterController**

Reemplazar `backend/app/Http/Controllers/Auth/RegisterController.php`:

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Models\Organization;
use App\Models\User;
use App\Services\CreditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class RegisterController extends Controller
{
    public function store(RegisterRequest $request, CreditService $credits): JsonResponse
    {
        $data = $request->validated();

        $org = null;
        if (! empty($data['company_name'])) {
            $org = Organization::create([
                'name'   => $data['company_name'],
                'sector' => $data['sector'] ?? null,
                'size'   => $data['company_size'] ?? null,
            ]);
            $credits->grant($org, (int) config('credits.free_signup'), 'cortesia', 'registro');
        }

        $user = User::create([
            'name'                => $data['name'],
            'last_name'           => $data['last_name'],
            'email'               => $data['email'],
            'password'            => Hash::make($data['password']),
            'organization_id'     => $org?->id,
            'role'                => 'admin',
            'phone'               => $data['phone'] ?? null,
            'birth_date'          => $data['birth_date'] ?? null,
            'position'            => $data['position'] ?? null,
            'privacy_accepted_at' => now(),
        ]);

        Auth::login($user);

        return response()->json(['user' => $user], 201);
    }
}
```

- [ ] **Step 5: Correr y ver pasar**

```bash
php artisan test tests/Feature/RegistroTest.php
php artisan test
```

Expected: 5 nuevos tests pasan; suite completa verde.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: updated register with profile fields, password confirmation, and optional org"
```

---

## Task 3: Backend — Endpoints de perfil y CRUD de admin (TDD)

**Files:**
- Create: `backend/app/Http/Controllers/ProfileController.php`
- Create: `backend/app/Http/Controllers/Admin/UserController.php`
- Create: `backend/app/Http/Requests/UpdateProfileRequest.php`
- Create: `backend/app/Http/Requests/UpdatePasswordRequest.php`
- Create: `backend/app/Http/Requests/AdminUpdateUserRequest.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/ProfileTest.php`, `AdminUserTest.php`

- [ ] **Step 1: Escribir ProfileTest**

Crear `backend/tests/Feature/ProfileTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        $org = Organization::create(['name' => 'ACME']);
        $u = User::create(['name' => 'Ana', 'last_name' => 'López', 'email' => 'a@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
        $this->actingAs($u);
        return $u;
    }

    public function test_get_profile(): void
    {
        $user = $this->user();
        $this->getJson('/api/user/profile')
            ->assertStatus(200)
            ->assertJsonPath('data.email', 'a@a.com')
            ->assertJsonPath('data.last_name', 'López');
    }

    public function test_update_profile(): void
    {
        $this->user();
        $this->putJson('/api/user/profile', [
            'name' => 'Ana', 'last_name' => 'García', 'phone' => '8121234567', 'position' => 'Directora',
        ])->assertStatus(200);
        $this->assertDatabaseHas('users', ['last_name' => 'García', 'phone' => '8121234567']);
    }

    public function test_change_password_requires_current(): void
    {
        $this->user();
        $this->putJson('/api/user/password', [
            'current_password' => 'wrong', 'password' => 'NewPass123!', 'password_confirmation' => 'NewPass123!',
        ])->assertStatus(422)->assertJsonValidationErrors(['current_password']);
    }
}
```

Crear `backend/tests/Feature/AdminUserTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $org = Organization::create(['name' => 'Mez']);
        $u = User::create(['name' => 'Op', 'email' => 'op@mez.dev', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin', 'is_platform_admin' => true]);
        $this->actingAs($u);
        return $u;
    }

    public function test_list_users(): void
    {
        $this->admin();
        Organization::create(['name' => 'ACME']);
        $org = Organization::where('name', 'ACME')->first();
        User::create(['name' => 'Juan', 'email' => 'j@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);

        $this->getJson('/api/admin/users')
            ->assertStatus(200)
            ->assertJsonPath('data.total', fn ($v) => $v >= 2);
    }

    public function test_update_user(): void
    {
        $admin = $this->admin();
        $org = Organization::create(['name' => 'ACME']);
        $user = User::create(['name' => 'Juan', 'email' => 'j@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);

        $this->patchJson("/api/admin/users/{$user->id}", ['last_name' => 'Pérez', 'role' => 'recruiter'])
            ->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'last_name' => 'Pérez', 'role' => 'recruiter']);
    }

    public function test_delete_user(): void
    {
        $admin = $this->admin();
        $org = Organization::create(['name' => 'ACME']);
        $user = User::create(['name' => 'Juan', 'email' => 'j@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);

        $this->deleteJson("/api/admin/users/{$user->id}")->assertStatus(204);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_cannot_delete_itself(): void
    {
        $admin = $this->admin();
        $this->deleteJson("/api/admin/users/{$admin->id}")->assertStatus(409);
    }

    public function test_non_admin_forbidden(): void
    {
        $org = Organization::create(['name' => 'ACME']);
        $user = User::create(['name' => 'Juan', 'email' => 'j@a.com', 'password' => bcrypt('x'), 'organization_id' => $org->id, 'role' => 'admin']);
        $this->actingAs($user);
        $this->getJson('/api/admin/users')->assertStatus(403);
    }

    public function test_admin_update_own_credentials(): void
    {
        $admin = $this->admin();
        $this->putJson('/api/admin/me', [
            'email' => 'nuevo@mez.dev',
            'current_password' => 'x',
            'password' => 'NuevoPass1!',
            'password_confirmation' => 'NuevoPass1!',
        ])->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'email' => 'nuevo@mez.dev']);
    }
}
```

- [ ] **Step 2: Correr y ver fallar**

```bash
php artisan test tests/Feature/ProfileTest.php tests/Feature/AdminUserTest.php
```

Expected: FAIL — rutas ausentes.

- [ ] **Step 3: Crear UpdateProfileRequest**

Crear `backend/app/Http/Requests/UpdateProfileRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'       => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'position'   => ['nullable', 'string', 'max:255'],
        ];
    }
}
```

- [ ] **Step 4: Crear UpdatePasswordRequest**

Crear `backend/app/Http/Requests/UpdatePasswordRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Validator;

class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'current_password'  => ['required', 'string'],
            'password'          => ['required', 'string', 'min:8'],
            'password_confirmation' => ['required', 'same:password'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if (! Hash::check($this->current_password, $this->user()->password)) {
                    $validator->errors()->add('current_password', 'La contraseña actual es incorrecta.');
                }
            },
        ];
    }
}
```

- [ ] **Step 5: Crear AdminUpdateUserRequest**

Crear `backend/app/Http/Requests/AdminUpdateUserRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminUpdateUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'       => ['sometimes', 'string', 'max:255'],
            'last_name'  => ['sometimes', 'string', 'max:255'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'position'   => ['nullable', 'string', 'max:255'],
            'role'       => ['sometimes', 'in:admin,recruiter,viewer'],
        ];
    }
}
```

- [ ] **Step 6: Crear ProfileController**

Crear `backend/app/Http/Controllers/ProfileController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->load('organization')]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $request->user()->update($request->validated());
        return response()->json(['data' => $request->user()->fresh()]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $request->user()->update(['password' => bcrypt($request->password)]);
        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 7: Crear Admin/UserController**

Crear `backend/app/Http/Controllers/Admin/UserController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminUpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = User::with('organization')->orderByDesc('created_at');
        if ($s = $request->query('search')) {
            $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")
                ->orWhere('last_name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%"));
        }
        $users = $q->paginate(15);

        return response()->json([
            'data' => [
                'total' => $users->total(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'items' => $users->items(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(['data' => $user->load('organization')]);
    }

    public function update(AdminUpdateUserRequest $request, User $user): JsonResponse
    {
        $user->update($request->validated());
        return response()->json(['data' => $user->fresh()]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_if($user->id === $request->user()->id, 409, 'No puedes eliminar tu propia cuenta.');
        $user->delete();
        return response()->json(null, 204);
    }

    public function updateMe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'                 => ['required', 'email', Rule::unique('users', 'email')->ignore($request->user()->id)],
            'current_password'      => ['required', 'string'],
            'password'              => ['required', 'string', 'min:8'],
            'password_confirmation' => ['required', 'same:password'],
        ]);

        abort_unless(Hash::check($data['current_password'], $request->user()->password), 422,
            json_encode(['message' => 'La contraseña actual es incorrecta.', 'errors' => ['current_password' => ['La contraseña actual es incorrecta.']]])
        );

        $request->user()->update(['email' => $data['email'], 'password' => bcrypt($data['password'])]);
        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 8: Registrar rutas**

En `backend/routes/api.php`, dentro del grupo `auth:sanctum` existente, añadir:

```php
Route::get('user/profile', [\App\Http\Controllers\ProfileController::class, 'show']);
Route::put('user/profile', [\App\Http\Controllers\ProfileController::class, 'update']);
Route::put('user/password', [\App\Http\Controllers\ProfileController::class, 'updatePassword']);
```

Y en el grupo `admin` existente (`middleware(['auth:sanctum','platform_admin'])->prefix('admin')`), añadir:

```php
Route::get('users', [\App\Http\Controllers\Admin\UserController::class, 'index']);
Route::get('users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'show']);
Route::patch('users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'update']);
Route::delete('users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'destroy']);
Route::put('me', [\App\Http\Controllers\Admin\UserController::class, 'updateMe']);
```

- [ ] **Step 9: Correr y ver pasar**

```bash
php artisan test tests/Feature/ProfileTest.php tests/Feature/AdminUserTest.php
php artisan test
```

Expected: todos pasan; suite completa verde.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: profile endpoints and admin user CRUD"
```

---

## Task 4: Frontend — Animaciones CSS y FloatingInput

**Files:**
- Create: `frontend/src/styles/animations.css`
- Create: `frontend/src/components/ui/FloatingInput.tsx` + `FloatingInput.css`
- Create: `frontend/src/components/ui/PasswordStrength.tsx` + `PasswordStrength.css`
- Modify: `frontend/src/styles/global.css`

- [ ] **Step 1: Crear animations.css**

Crear `frontend/src/styles/animations.css`:

```css
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: none; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60%  { transform: translateX(-6px); }
  40%, 80%  { transform: translateX(6px); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes slideInUp { from { opacity: 0; } to { opacity: 1; } }
  @keyframes shake     { 0%, 100% { transform: none; } }
  @keyframes spin      { to { transform: none; } }
}
```

- [ ] **Step 2: Importar en global.css**

Añadir al inicio de `frontend/src/styles/global.css` (después de las otras importaciones):

```css
@import './animations.css';
```

- [ ] **Step 3: Crear FloatingInput.css**

Crear `frontend/src/components/ui/FloatingInput.css`:

```css
.float {
  position: relative;
}

.float__input {
  width: 100%;
  padding: var(--sp-5) var(--sp-4) var(--sp-2);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-ink);
  background: var(--color-surface);
  transition: border-color var(--t-base);
  appearance: none;
}

.float__input:focus {
  border-color: var(--color-hunter);
  outline: none;
}

.float__input.float__input--error {
  border-color: var(--color-error);
  animation: shake 0.35s ease;
}

.float__label {
  position: absolute;
  left: var(--sp-4);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-base);
  color: var(--color-border);
  pointer-events: none;
  transform-origin: left top;
  transition: transform 180ms ease, font-size 180ms ease, color 180ms ease, top 180ms ease;
}

/* Label flotante: cuando tiene foco o valor */
.float__input:focus + .float__label,
.float__input:not(:placeholder-shown) + .float__label {
  top: var(--sp-2);
  transform: translateY(0) scale(0.75);
  font-size: var(--text-xs);
  color: var(--color-hunter);
}

.float__input--error:focus + .float__label,
.float__input--error:not(:placeholder-shown) + .float__label {
  color: var(--color-error);
}

.float__error {
  font-size: var(--text-xs);
  color: var(--color-error);
  margin-top: var(--sp-1);
  animation: fadeIn 200ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .float__label { transition: none; }
  .float__input--error { animation: none; }
}
```

- [ ] **Step 4: Crear FloatingInput.tsx**

Crear `frontend/src/components/ui/FloatingInput.tsx`:

```tsx
import type { InputHTMLAttributes } from 'react'
import './FloatingInput.css'

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  id: string
}

export default function FloatingInput({ label, error, id, className = '', ...props }: FloatingInputProps) {
  return (
    <div className="float">
      <input
        id={id}
        placeholder=" "
        className={`float__input${error ? ' float__input--error' : ''} ${className}`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      <label htmlFor={id} className="float__label">{label}</label>
      {error && <span id={`${id}-error`} className="float__error" role="alert">{error}</span>}
    </div>
  )
}
```

- [ ] **Step 5: Crear PasswordStrength.css**

Crear `frontend/src/components/ui/PasswordStrength.css`:

```css
.pstrength {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-1);
}

.pstrength__bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--color-timberwolf);
  transition: background-color 250ms ease;
}

.pstrength__bar--active-0 { background: var(--color-error); }
.pstrength__bar--active-1 { background: var(--color-accent); }
.pstrength__bar--active-2 { background: var(--color-fern); }

.pstrength__label {
  font-size: var(--text-xs);
  color: var(--color-ink);
  opacity: 0.7;
  margin-top: var(--sp-1);
}
```

- [ ] **Step 6: Crear PasswordStrength.tsx**

Crear `frontend/src/components/ui/PasswordStrength.tsx`:

```tsx
import './PasswordStrength.css'

function score(pw: string): number {
  if (pw.length < 8) return 0
  let s = 1
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  return Math.min(s, 2)
}

const LABELS = ['Débil', 'Media', 'Fuerte']

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const s = score(password)
  return (
    <div>
      <div className="pstrength">
        {[0, 1, 2].map(i => (
          <div key={i} className={`pstrength__bar${i <= s ? ` pstrength__bar--active-${s}` : ''}`} />
        ))}
      </div>
      <p className="pstrength__label">{LABELS[s]}</p>
    </div>
  )
}
```

- [ ] **Step 7: Verificar compila**

```bash
cd C:\Users\geova\Documents\Mezquit\frontend
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add src/styles/animations.css src/styles/global.css src/components/ui/FloatingInput.tsx src/components/ui/FloatingInput.css src/components/ui/PasswordStrength.tsx src/components/ui/PasswordStrength.css
git commit -m "feat: CSS animations, FloatingInput with floating labels, PasswordStrength"
```

---

## Task 5: Frontend — Rediseño de Registro y Login

**Files:**
- Modify: `frontend/src/pages/auth/Registro.tsx`, `Auth.css`
- Modify: `frontend/src/pages/auth/Login.tsx`
- Modify: `frontend/src/api/auth.ts`

- [ ] **Step 1: Actualizar AuthUser + register payload en auth.ts**

En `frontend/src/api/auth.ts`, añadir `last_name` y demás campos al tipo `AuthUser` y a `RegisterPayload`:

```ts
export interface AuthUser {
  id: number
  name: string
  last_name?: string
  email: string
  role: string
  organization_id: number | null
  is_platform_admin?: boolean
}

export interface RegisterPayload {
  name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  company_name?: string
  sector?: string
  company_size?: string
  phone?: string
  birth_date?: string
  position?: string
  privacy_accepted: boolean
}
```

- [ ] **Step 2: Reemplazar Auth.css completamente**

Reemplazar `frontend/src/pages/auth/Auth.css`:

```css
/* Layout */
.auth {
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: var(--sp-8) var(--sp-4);
  background: var(--color-surface-secondary);
}

/* Card */
.auth__card {
  width: 100%;
  max-width: 680px;
  background: var(--color-surface);
  border: 1px solid var(--color-timberwolf);
  border-radius: var(--radius-lg);
  padding: var(--sp-10) var(--sp-10);
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
  animation: slideInUp 350ms ease both;
}

@media (max-width: 640px) {
  .auth__card { padding: var(--sp-8) var(--sp-5); }
}

/* Logo header */
.auth__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}
.auth__logo { height: 40px; width: auto; }
.auth__brand-name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  color: var(--color-brunswick);
  font-weight: 600;
}

/* Title */
.auth__title {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--color-brunswick);
  text-align: center;
}

/* Grid de campos 2 columnas */
.auth__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
}
@media (max-width: 560px) {
  .auth__grid { grid-template-columns: 1fr; }
}
.auth__grid--full {
  grid-column: 1 / -1;
}

/* Separador sección */
.auth__section {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-brunswick);
  opacity: 0.5;
  padding-top: var(--sp-2);
  border-top: 1px solid var(--color-timberwolf);
}

/* Privacy check */
.auth__privacy {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  font-size: var(--text-sm);
  color: var(--color-ink);
  line-height: 1.5;
}
.auth__privacy-check {
  margin-top: 2px;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  accent-color: var(--color-hunter);
}
.auth__privacy a {
  color: var(--color-hunter);
  text-decoration: underline;
}

/* Submit button loading */
.auth__submit-wrap { display: flex; flex-direction: column; gap: var(--sp-3); }

/* Spinner en botón */
.btn--loading::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin-right: var(--sp-2);
}

/* Footer links */
.auth__foot { font-size: var(--text-sm); color: var(--color-ink); text-align: center; }
.auth__foot a { color: var(--color-hunter); font-weight: 500; }

/* Error global */
.auth__error-global {
  background: rgba(179, 38, 30, 0.06);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-sm);
  padding: var(--sp-3) var(--sp-4);
  font-size: var(--text-sm);
  color: var(--color-error);
}
```

- [ ] **Step 3: Reemplazar Registro.tsx**

Reemplazar `frontend/src/pages/auth/Registro.tsx`:

```tsx
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, type RegisterPayload } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import FloatingInput from '@/components/ui/FloatingInput'
import PasswordStrength from '@/components/ui/PasswordStrength'
import { SITE } from '@/config/site'
import './Auth.css'

const EMPTY: RegisterPayload = {
  name: '', last_name: '', email: '', password: '', password_confirmation: '',
  company_name: '', sector: '', company_size: '', phone: '', birth_date: '', position: '',
  privacy_accepted: false,
}

export default function Registro() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterPayload>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterPayload, string>>>({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')

  function set(k: keyof RegisterPayload, v: string | boolean) {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }))
  }

  function str(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    set(e.target.name as keyof RegisterPayload, e.target.value)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setGlobalError('')
    setErrors({})
    try {
      const user = await register(form)
      setUser(user)
      navigate(user.organization_id ? '/app/evaluaciones/nueva' : '/perfil')
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }).response
      if (resp?.data?.errors) {
        const mapped: Partial<Record<keyof RegisterPayload, string>> = {}
        for (const k in resp.data.errors) mapped[k as keyof RegisterPayload] = resp.data.errors[k][0]
        setErrors(mapped)
      } else {
        setGlobalError('Ocurrió un error. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={submit} noValidate>
        <div className="auth__brand">
          <img src="/logo.png" alt={SITE.name} className="auth__logo" />
          <span className="auth__brand-name">{SITE.name}</span>
        </div>
        <h1 className="auth__title">Crear cuenta</h1>

        {globalError && <p className="auth__error-global">{globalError}</p>}

        <p className="auth__section">Datos personales</p>
        <div className="auth__grid">
          <FloatingInput id="name" name="name" label="Nombre" autoComplete="given-name"
            value={form.name} onChange={str} error={errors.name} required />
          <FloatingInput id="last_name" name="last_name" label="Apellido" autoComplete="family-name"
            value={form.last_name} onChange={str} error={errors.last_name} required />
          <div className="auth__grid--full">
            <FloatingInput id="email" name="email" type="email" label="Correo electrónico" autoComplete="email"
              value={form.email} onChange={str} error={errors.email} required />
          </div>
          <div>
            <FloatingInput id="password" name="password" type="password" label="Contraseña (mín. 8 caracteres)" autoComplete="new-password"
              value={form.password} onChange={str} error={errors.password} required />
            <PasswordStrength password={form.password} />
          </div>
          <FloatingInput id="password_confirmation" name="password_confirmation" type="password" label="Confirmar contraseña" autoComplete="new-password"
            value={form.password_confirmation} onChange={str} error={errors.password_confirmation} required />
          <FloatingInput id="birth_date" name="birth_date" type="date" label="Fecha de nacimiento" autoComplete="bday"
            value={form.birth_date ?? ''} onChange={str} error={errors.birth_date} />
          <FloatingInput id="phone" name="phone" type="tel" label="Teléfono" autoComplete="tel"
            value={form.phone ?? ''} onChange={str} error={errors.phone} />
        </div>

        <p className="auth__section">Empresa (opcional)</p>
        <div className="auth__grid">
          <FloatingInput id="company_name" name="company_name" label="Empresa / Organización" autoComplete="organization"
            value={form.company_name ?? ''} onChange={str} error={errors.company_name} />
          <FloatingInput id="position" name="position" label="Puesto" autoComplete="organization-title"
            value={form.position ?? ''} onChange={str} error={errors.position} />
        </div>

        <label className="auth__privacy">
          <input
            type="checkbox"
            className="auth__privacy-check"
            checked={form.privacy_accepted}
            onChange={e => set('privacy_accepted', e.target.checked)}
            aria-describedby={errors.privacy_accepted ? 'privacy-error' : undefined}
          />
          <span>
            Acepto el{' '}
            <Link to="/aviso-de-privacidad" target="_blank">aviso de privacidad</Link>
            {' '}y el uso de mis datos para la evaluación de candidatos.
            {errors.privacy_accepted && (
              <span id="privacy-error" style={{ display: 'block', color: 'var(--color-error)', fontSize: 'var(--text-xs)' }}>
                {errors.privacy_accepted}
              </span>
            )}
          </span>
        </label>

        <Button type="submit" loading={loading} size="lg">Crear cuenta</Button>
        <p className="auth__foot">¿Ya tienes cuenta? <Link to="/login">Entra aquí</Link></p>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Rediseñar Login.tsx**

Reemplazar `frontend/src/pages/auth/Login.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import FloatingInput from '@/components/ui/FloatingInput'
import { SITE } from '@/config/site'
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
      navigate(user.organization_id ? '/app' : '/perfil')
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSubmit} style={{ maxWidth: '440px' }}>
        <div className="auth__brand">
          <img src="/logo.png" alt={SITE.name} className="auth__logo" />
          <span className="auth__brand-name">{SITE.name}</span>
        </div>
        <h1 className="auth__title">Entrar</h1>

        {error && <p className="auth__error-global">{error}</p>}

        <FloatingInput id="email" type="email" label="Correo electrónico" autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)} required />
        <FloatingInput id="password" type="password" label="Contraseña" autoComplete="current-password"
          value={password} onChange={e => setPassword(e.target.value)} required />

        <Button type="submit" loading={loading} size="lg">Entrar</Button>
        <p className="auth__foot">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Verificar compila y build**

```bash
npx tsc --noEmit && npm run build
```

Expected: limpio.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: redesigned register (floating labels, animations, all profile fields) and login"
```

---

## Task 6: Frontend — Header adaptivo por estado de sesión + UserDropdown

**Files:**
- Create: `frontend/src/components/ui/UserDropdown.tsx` + `.css`
- Modify: `frontend/src/components/layout/Header.tsx`, `Header.css`

- [ ] **Step 1: Crear UserDropdown.css**

Crear `frontend/src/components/ui/UserDropdown.css`:

```css
.udrop {
  position: relative;
}

.udrop__trigger {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-brunswick);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius-sm);
  transition: background-color var(--t-fast);
}
.udrop__trigger:hover { background: var(--color-surface-secondary); }

.udrop__chevron {
  font-size: 10px;
  opacity: 0.5;
  transition: transform var(--t-fast);
}
.udrop__chevron--open { transform: rotate(180deg); }

.udrop__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--color-surface);
  border: 1px solid var(--color-timberwolf);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  overflow: hidden;
  animation: fadeIn 150ms ease;
  z-index: 200;
}

.udrop__item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--sp-3) var(--sp-4);
  font-size: var(--text-sm);
  color: var(--color-ink);
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color var(--t-fast);
}
.udrop__item:hover { background: var(--color-surface-secondary); }
.udrop__item--danger { color: var(--color-error); }
.udrop__divider { height: 1px; background: var(--color-timberwolf); margin: var(--sp-1) 0; }
```

- [ ] **Step 2: Crear UserDropdown.tsx**

Crear `frontend/src/components/ui/UserDropdown.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { logout } from '@/api/auth'
import './UserDropdown.css'

export default function UserDropdown() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleLogout() {
    await logout()
    setUser(null)
    navigate('/')
    setOpen(false)
  }

  if (!user) return null

  const displayName = user.last_name ? `${user.name} ${user.last_name}` : user.name

  return (
    <div className="udrop" ref={ref}>
      <button className="udrop__trigger" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        {displayName}
        <span className={`udrop__chevron${open ? ' udrop__chevron--open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="udrop__menu" role="menu">
          <Link to="/perfil" className="udrop__item" role="menuitem" onClick={() => setOpen(false)}>Mi perfil</Link>
          {user.organization_id && (
            <Link to="/app" className="udrop__item" role="menuitem" onClick={() => setOpen(false)}>Panel de RH</Link>
          )}
          {user.is_platform_admin && (
            <Link to="/admin/creditos" className="udrop__item" role="menuitem" onClick={() => setOpen(false)}>Operación</Link>
          )}
          <div className="udrop__divider" />
          <button className="udrop__item udrop__item--danger" role="menuitem" onClick={handleLogout}>Salir</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Actualizar Header.tsx**

Reemplazar `frontend/src/components/layout/Header.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { SITE } from '@/config/site'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import UserDropdown from '@/components/ui/UserDropdown'
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
  const { user, loading } = useAuth()

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

        {!loading && (
          <div className="header__auth">
            {user ? (
              <UserDropdown />
            ) : (
              <>
                <Link to="/login" className="header__login">Entrar</Link>
                <Button to="/registro">Crear cuenta</Button>
              </>
            )}
          </div>
        )}

        <button className="header__burger" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(v => !v)}>
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
          {!loading && user ? (
            <>
              <Link to="/perfil" className="header__mobile-link">Mi perfil</Link>
              {user.organization_id && <Link to="/app" className="header__mobile-link">Panel de RH</Link>}
            </>
          ) : (
            <>
              <Link to="/login" className="header__mobile-link">Entrar</Link>
              <Button to="/registro">Crear cuenta</Button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 4: Añadir CSS de auth links al Header**

Añadir al final de `frontend/src/components/layout/Header.css`:

```css
.header__auth {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  flex-shrink: 0;
}

.header__login {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-brunswick);
  transition: color var(--t-fast);
}
.header__login:hover { color: var(--color-hunter); }

@media (max-width: 767px) { .header__auth { display: none; } }
```

- [ ] **Step 5: Verificar compila**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: adaptive header (Entrar/Crear cuenta when logged out, user dropdown when logged in)"
```

---

## Task 7: Frontend — Página de perfil + admin usuarios + admin perfil

**Files:**
- Create: `frontend/src/pages/PerfilPage.tsx` + `.css`
- Create: `frontend/src/api/profile.ts`, `frontend/src/api/adminUsers.ts`
- Create: `frontend/src/pages/admin/AdminUsuariosPage.tsx` + `.css`
- Create: `frontend/src/pages/admin/AdminUsuarioDetallePage.tsx`
- Create: `frontend/src/pages/admin/AdminPerfilPage.tsx` + `.css`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Crear api/profile.ts**

Crear `frontend/src/api/profile.ts`:

```ts
import api from './axios'
import type { AuthUser } from './auth'

export async function getProfile(): Promise<AuthUser & { organization?: { name: string } }> {
  const { data } = await api.get('/api/user/profile')
  return data.data
}

export async function updateProfile(payload: {
  name: string; last_name: string; phone?: string; birth_date?: string; position?: string
}): Promise<void> {
  await api.put('/api/user/profile', payload)
}

export async function updatePassword(payload: {
  current_password: string; password: string; password_confirmation: string
}): Promise<void> {
  await api.put('/api/user/password', payload)
}
```

- [ ] **Step 2: Crear api/adminUsers.ts**

Crear `frontend/src/api/adminUsers.ts`:

```ts
import api from './axios'

export interface AdminUser {
  id: number; name: string; last_name?: string; email: string; phone?: string
  birth_date?: string; position?: string; role: string; created_at: string
  organization?: { name: string }
}
export interface UserList { total: number; current_page: number; last_page: number; items: AdminUser[] }

export async function listUsers(search?: string, page = 1): Promise<UserList> {
  const { data } = await api.get('/api/admin/users', { params: { search, page } })
  return data.data
}
export async function getUser(id: number): Promise<AdminUser> {
  const { data } = await api.get(`/api/admin/users/${id}`)
  return data.data
}
export async function updateUser(id: number, payload: Partial<AdminUser>): Promise<void> {
  await api.patch(`/api/admin/users/${id}`, payload)
}
export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/api/admin/users/${id}`)
}
export async function updateAdminMe(payload: {
  email: string; current_password: string; password: string; password_confirmation: string
}): Promise<void> {
  await api.put('/api/admin/me', payload)
}
```

- [ ] **Step 3: Crear PerfilPage.tsx + css**

Crear `frontend/src/pages/PerfilPage.css`:

```css
.perfil { padding-block: var(--section-py); }
.perfil__inner { max-width: 680px; margin-inline: auto; padding-inline: var(--section-px); display: flex; flex-direction: column; gap: var(--sp-8); }
.perfil__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.perfil__card { background: var(--color-surface); border: 1px solid var(--color-timberwolf); border-radius: var(--radius-md); padding: var(--sp-8); display: flex; flex-direction: column; gap: var(--sp-5); }
.perfil__card-title { font-family: var(--font-display); font-size: var(--text-xl); color: var(--color-brunswick); }
.perfil__grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-4); }
@media (max-width: 560px) { .perfil__grid { grid-template-columns: 1fr; } }
.perfil__ok { font-size: var(--text-sm); color: var(--color-success); animation: fadeIn 300ms ease; }
.perfil__no-org { background: var(--color-surface-secondary); border-radius: var(--radius-sm); padding: var(--sp-4); font-size: var(--text-sm); color: var(--color-ink); }
```

Crear `frontend/src/pages/PerfilPage.tsx`:

```tsx
import { useEffect, useState, type FormEvent } from 'react'
import { getProfile, updateProfile, updatePassword } from '@/api/profile'
import FloatingInput from '@/components/ui/FloatingInput'
import Button from '@/components/ui/Button'
import './PerfilPage.css'

export default function PerfilPage() {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getProfile>> | null>(null)
  const [saved, setSaved] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { getProfile().then(setProfile).catch(() => {}) }, [])

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    await updateProfile({ name: profile.name, last_name: profile.last_name ?? '', phone: profile.phone, birth_date: profile.birth_date, position: profile.position })
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    try {
      await updatePassword(pw)
      setPwSaved(true); setTimeout(() => setPwSaved(false), 3000)
      setPw({ current_password: '', password: '', password_confirmation: '' })
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { errors?: Record<string, string[]> } } }).response
      if (resp?.data?.errors) {
        const m: Record<string, string> = {}
        for (const k in resp.data.errors) m[k] = resp.data.errors[k][0]
        setErrors(m)
      }
    }
  }

  if (!profile) return <p style={{ padding: 'var(--sp-8)' }}>Cargando…</p>

  return (
    <section className="perfil">
      <div className="perfil__inner">
        <h1 className="perfil__title">Mi perfil</h1>

        {!profile.organization_id && (
          <div className="perfil__no-org">
            No tienes una empresa registrada. Para usar el panel de RH y crear evaluaciones, completa el campo "Empresa" y guarda tu perfil.
          </div>
        )}

        <form className="perfil__card" onSubmit={saveProfile}>
          <h2 className="perfil__card-title">Datos personales</h2>
          <div className="perfil__grid">
            <FloatingInput id="p-name" label="Nombre" value={profile.name} onChange={e => setProfile(p => p ? { ...p, name: e.target.value } : p)} required />
            <FloatingInput id="p-last" label="Apellido" value={profile.last_name ?? ''} onChange={e => setProfile(p => p ? { ...p, last_name: e.target.value } : p)} />
            <FloatingInput id="p-phone" type="tel" label="Teléfono" value={profile.phone ?? ''} onChange={e => setProfile(p => p ? { ...p, phone: e.target.value } : p)} />
            <FloatingInput id="p-position" label="Puesto" value={profile.position ?? ''} onChange={e => setProfile(p => p ? { ...p, position: e.target.value } : p)} />
          </div>
          <Button type="submit">Guardar cambios</Button>
          {saved && <p className="perfil__ok">Perfil guardado correctamente.</p>}
        </form>

        <form className="perfil__card" onSubmit={savePassword}>
          <h2 className="perfil__card-title">Cambiar contraseña</h2>
          <FloatingInput id="cur-pw" type="password" label="Contraseña actual" value={pw.current_password} onChange={e => setPw(p => ({ ...p, current_password: e.target.value }))} error={errors.current_password} required />
          <FloatingInput id="new-pw" type="password" label="Nueva contraseña" value={pw.password} onChange={e => setPw(p => ({ ...p, password: e.target.value }))} required />
          <FloatingInput id="new-pw2" type="password" label="Confirmar nueva contraseña" value={pw.password_confirmation} onChange={e => setPw(p => ({ ...p, password_confirmation: e.target.value }))} required />
          <Button type="submit" variant="ghost">Cambiar contraseña</Button>
          {pwSaved && <p className="perfil__ok">Contraseña actualizada.</p>}
        </form>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Crear AdminUsuariosPage**

Crear `frontend/src/pages/admin/AdminUsuariosPage.css`:

```css
.ausuarios { display: flex; flex-direction: column; gap: var(--sp-6); }
.ausuarios__head { display: flex; gap: var(--sp-4); align-items: center; flex-wrap: wrap; justify-content: space-between; }
.ausuarios__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.ausuarios__search { padding: var(--sp-2) var(--sp-4); border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-base); min-width: 220px; }
.ausuarios__table { width: 100%; border-collapse: collapse; }
.ausuarios__table th, .ausuarios__table td { text-align: left; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--color-timberwolf); font-size: var(--text-sm); }
.ausuarios__table th { opacity: 0.6; font-weight: 600; }
.ausuarios__actions { display: flex; gap: var(--sp-3); }
.ausuarios__link { color: var(--color-hunter); }
.ausuarios__del { color: var(--color-error); background: none; font-size: var(--text-sm); }
.ausuarios__confirm { font-size: var(--text-xs); color: var(--color-error); }
.ausuarios__pages { display: flex; gap: var(--sp-3); align-items: center; font-size: var(--text-sm); }
```

Crear `frontend/src/pages/admin/AdminUsuariosPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listUsers, deleteUser, type AdminUser } from '@/api/adminUsers'
import './AdminUsuariosPage.css'

export default function AdminUsuariosPage() {
  const [items, setItems] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [search, setSearch] = useState('')
  const [confirming, setConfirming] = useState<number | null>(null)

  function load(p = page, s = search) {
    listUsers(s || undefined, p).then(d => { setItems(d.items); setTotal(d.total); setLastPage(d.last_page) }).catch(() => {})
  }

  useEffect(() => { load(1, search) }, [search])
  useEffect(() => { load() }, [page])

  async function remove(id: number) {
    await deleteUser(id)
    setConfirming(null)
    load()
  }

  return (
    <div className="ausuarios">
      <div className="ausuarios__head">
        <h1 className="ausuarios__title">Usuarios ({total})</h1>
        <input className="ausuarios__search" placeholder="Buscar por nombre o correo…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>
      <table className="ausuarios__table">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Organización</th><th>Rol</th><th>Registro</th><th></th></tr></thead>
        <tbody>
          {items.map(u => (
            <tr key={u.id}>
              <td>{u.name} {u.last_name ?? ''}</td>
              <td>{u.email}</td>
              <td>{u.organization?.name ?? '—'}</td>
              <td>{u.role}</td>
              <td>{u.created_at?.slice(0, 10)}</td>
              <td>
                <div className="ausuarios__actions">
                  <Link to={`/admin/usuarios/${u.id}`} className="ausuarios__link">Editar</Link>
                  {confirming === u.id ? (
                    <span className="ausuarios__confirm">
                      ¿Eliminar? <button onClick={() => remove(u.id)} style={{ color: 'var(--color-error)', background: 'none' }}>Sí</button>{' · '}
                      <button onClick={() => setConfirming(null)} style={{ background: 'none' }}>No</button>
                    </span>
                  ) : (
                    <button className="ausuarios__del" onClick={() => setConfirming(u.id)}>Eliminar</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lastPage > 1 && (
        <div className="ausuarios__pages">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span>Página {page} de {lastPage}</span>
          <button disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Crear AdminUsuarioDetallePage**

Crear `frontend/src/pages/admin/AdminUsuarioDetallePage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUser, updateUser, deleteUser, type AdminUser } from '@/api/adminUsers'
import FloatingInput from '@/components/ui/FloatingInput'
import Button from '@/components/ui/Button'

export default function AdminUsuarioDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => { getUser(Number(id)).then(setUser).catch(() => {}) }, [id])

  async function save() {
    if (!user) return
    await updateUser(user.id, { name: user.name, last_name: user.last_name, phone: user.phone, position: user.position, role: user.role })
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  async function remove() {
    if (!user) return
    await deleteUser(user.id)
    navigate('/admin/usuarios')
  }

  if (!user) return <p>Cargando…</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', maxWidth: 680 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', color: 'var(--color-brunswick)' }}>
        {user.name} {user.last_name ?? ''}
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
        <FloatingInput id="u-name" label="Nombre" value={user.name} onChange={e => setUser(p => p ? { ...p, name: e.target.value } : p)} />
        <FloatingInput id="u-last" label="Apellido" value={user.last_name ?? ''} onChange={e => setUser(p => p ? { ...p, last_name: e.target.value } : p)} />
        <FloatingInput id="u-phone" label="Teléfono" value={user.phone ?? ''} onChange={e => setUser(p => p ? { ...p, phone: e.target.value } : p)} />
        <FloatingInput id="u-pos" label="Puesto" value={user.position ?? ''} onChange={e => setUser(p => p ? { ...p, position: e.target.value } : p)} />
      </div>
      <div>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-brunswick)' }}>Rol</label>
        <select value={user.role} onChange={e => setUser(p => p ? { ...p, role: e.target.value } : p)}
          style={{ display: 'block', marginTop: 'var(--sp-2)', padding: 'var(--sp-3) var(--sp-4)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)' }}>
          <option value="admin">Admin</option>
          <option value="recruiter">Reclutador</option>
          <option value="viewer">Visualizador</option>
        </select>
      </div>
      <Button onClick={save}>Guardar cambios</Button>
      {saved && <p style={{ color: 'var(--color-success)', fontSize: 'var(--text-sm)' }}>Guardado.</p>}
      <div style={{ borderTop: '1px solid var(--color-timberwolf)', paddingTop: 'var(--sp-4)' }}>
        {confirming ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>
            ¿Eliminar a {user.name}? Esta acción no se puede deshacer.{' '}
            <button onClick={remove} style={{ color: 'var(--color-error)', background: 'none', fontWeight: 600 }}>Sí, eliminar</button>{' · '}
            <button onClick={() => setConfirming(false)} style={{ background: 'none' }}>Cancelar</button>
          </p>
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)}>Eliminar usuario</Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Crear AdminPerfilPage**

Crear `frontend/src/pages/admin/AdminPerfilPage.css`:

```css
.adminperfil { display: flex; flex-direction: column; gap: var(--sp-6); max-width: 480px; }
.adminperfil__title { font-size: var(--text-3xl); color: var(--color-brunswick); }
.adminperfil__ok { font-size: var(--text-sm); color: var(--color-success); animation: fadeIn 300ms ease; }
.adminperfil__error { font-size: var(--text-sm); color: var(--color-error); }
```

Crear `frontend/src/pages/admin/AdminPerfilPage.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { updateAdminMe } from '@/api/adminUsers'
import FloatingInput from '@/components/ui/FloatingInput'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import './AdminPerfilPage.css'

export default function AdminPerfilPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email ?? '')
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await updateAdminMe({ email, ...pw })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
      setPw({ current_password: '', password: '', password_confirmation: '' })
    } catch {
      setError('La contraseña actual es incorrecta o el correo ya está en uso.')
    }
  }

  return (
    <form className="adminperfil" onSubmit={submit}>
      <h1 className="adminperfil__title">Mi perfil de operador</h1>
      <FloatingInput id="ap-email" type="email" label="Correo" value={email} onChange={e => setEmail(e.target.value)} required />
      <FloatingInput id="ap-cur" type="password" label="Contraseña actual" value={pw.current_password} onChange={e => setPw(p => ({ ...p, current_password: e.target.value }))} required />
      <FloatingInput id="ap-new" type="password" label="Nueva contraseña" value={pw.password} onChange={e => setPw(p => ({ ...p, password: e.target.value }))} required />
      <FloatingInput id="ap-new2" type="password" label="Confirmar nueva contraseña" value={pw.password_confirmation} onChange={e => setPw(p => ({ ...p, password_confirmation: e.target.value }))} required />
      {error && <p className="adminperfil__error">{error}</p>}
      <Button type="submit">Guardar</Button>
      {saved && <p className="adminperfil__ok">Credenciales actualizadas.</p>}
    </form>
  )
}
```

- [ ] **Step 7: Añadir rutas en App.tsx**

En `frontend/src/App.tsx`, importar e integrar:

```tsx
import PerfilPage from '@/pages/PerfilPage'
import AdminUsuariosPage from '@/pages/admin/AdminUsuariosPage'
import AdminUsuarioDetallePage from '@/pages/admin/AdminUsuarioDetallePage'
import AdminPerfilPage from '@/pages/admin/AdminPerfilPage'
```

- Dentro del `<Route element={<RootLayout />}>` (público), añadir: `<Route path="perfil" element={<PerfilPage />} />`
- Dentro del `<Route path="/admin" ...>` existente, añadir:
```tsx
<Route path="usuarios" element={<AdminUsuariosPage />} />
<Route path="usuarios/:id" element={<AdminUsuarioDetallePage />} />
<Route path="perfil" element={<AdminPerfilPage />} />
```

- [ ] **Step 8: Verificar build completo**

```bash
npx tsc --noEmit && npm run build
```

Expected: build limpio.

- [ ] **Step 9: Commit final**

```bash
git add -A
git commit -m "feat: user profile page, admin user CRUD, and admin profile editor"
```

---

## Self-review

- ✅ Spec: campos de perfil en migración y modelo (Task 1)
- ✅ Spec: registro con password_confirmation, privacy_accepted, last_name requeridos (Task 2)
- ✅ Spec: usuario sin company_name queda sin org; aviso en perfil (Task 2 + Task 7)
- ✅ Spec: endpoints perfil + admin CRUD con tests (Task 3)
- ✅ Spec: animaciones CSS puras — slideInUp, shake, fadeIn, spin (Task 4)
- ✅ Spec: floating labels con CSS puro (Task 4)
- ✅ Spec: PasswordStrength CSS (Task 4)
- ✅ Spec: registro con 2 columnas, secciones, todos los campos (Task 5)
- ✅ Spec: login rediseñado con misma tarjeta animada (Task 5)
- ✅ Spec: header con Entrar/Crear cuenta sin sesión, dropdown con sesión (Task 6)
- ✅ Spec: /perfil para cualquier usuario logueado (Task 7)
- ✅ Spec: /admin/usuarios con búsqueda, paginación, editar, eliminar con confirmación (Task 7)
- ✅ Spec: /admin/perfil para el operador (Task 7)
- ✅ Spec: seeder lee ADMIN_EMAIL/ADMIN_PASSWORD del .env (Task 1)
- ✅ Spec: prefers-reduced-motion — animations.css tiene overrides; global.css ya tiene la regla base

## [PENDIENTE]

1. Recuperación de contraseña ("¿Olvidaste tu contraseña?")
2. `ADMIN_EMAIL` y `ADMIN_PASSWORD` reales en producción
