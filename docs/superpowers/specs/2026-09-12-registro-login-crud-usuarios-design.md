# Mez — Registro/Login premium + CRUD de usuarios (diseño)

**Fecha:** 2026-09-12
**Estado:** Aprobado por el usuario

## Decisiones aprobadas

1. **Coexisten dos tipos de usuario.** El nuevo formulario `/registro` reemplaza el wizard de 3 pasos y sirve a todos. El campo "empresa/organización" crea la `Organization`. Usuario sin org creada → puede iniciar sesión y ver el sitio público pero no accede a `/app` (aviso de "completa tu perfil de empresa").
2. **CRUD en `/admin/usuarios`** — solo super-admin (`is_platform_admin`).
3. **Admin editable desde UI.** El operador cambia su correo y contraseña en `/admin/perfil`. Credenciales iniciales desde `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
4. **Animaciones CSS puras** — sin librerías nuevas.

---

## A. Modelo de datos

Nueva migración `add_profile_fields_to_users_table`:

```
users + last_name          VARCHAR(255)
      + phone              VARCHAR(30)  nullable
      + birth_date         DATE         nullable
      + position           VARCHAR(255) nullable  (puesto en la empresa)
      + privacy_accepted_at TIMESTAMP  nullable
```

`company_name` en el registro sigue creando `Organization.name`. `sector` y `company_size` del wizard antiguo se vuelven opcionales (se mantienen en el payload para compatibilidad pero no son requeridos). Los usuarios existentes mantienen sus nuevos campos como `NULL`.

---

## B. Backend

### Cambios a registro (`RegisterRequest` + `RegisterController`)

**`RegisterRequest`** — nuevas reglas:
- `last_name`: required, string, max:255
- `password_confirmation`: required, same:password
- `phone`: nullable, string, max:30
- `birth_date`: nullable, date, before:today
- `position`: nullable, string, max:255
- `privacy_accepted`: required, accepted (must be true)
- `company_name`: now nullable (si está vacío, no se crea org; usuario queda sin `organization_id`)
- `sector`, `company_size`: nullable (opcionales)

**`RegisterController::store`** guarda: `last_name`, `phone`, `birth_date`, `position`, `privacy_accepted_at = now()`. Si `company_name` presente → crea org + asigna `organization_id`. Si no → usuario queda sin org.

### Nuevos endpoints RH (`auth:sanctum`)

- `GET /api/user/profile` — devuelve perfil completo del usuario autenticado
- `PUT /api/user/profile` — actualiza name, last_name, phone, birth_date, position, company (actualiza org.name si existe)
- `PUT /api/user/password` — cambia contraseña: requiere current_password + password + password_confirmation

### Nuevos endpoints super-admin (`platform_admin`)

- `GET /api/admin/users?search=&page=` — lista paginada (15/página): id, name, last_name, email, org.name, role, created_at
- `GET /api/admin/users/{id}` — detalle completo
- `PATCH /api/admin/users/{id}` — editar campos de perfil + role; no permite cambiar `is_platform_admin` desde aquí
- `DELETE /api/admin/users/{id}` — eliminar (no puede eliminarse a sí mismo)
- `PUT /api/admin/me` — el operador actualiza su propio email + password (requiere current_password)

### Seeder actualizado

`PlatformAdminSeeder` lee `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`. Default de desarrollo: `admin@mez.dev` / `password`. El `.env.example` documenta ambas variables.

---

## C. Frontend — Registro y Login

### Animaciones CSS (sin librerías)

En `src/styles/animations.css` (nuevo archivo importado en `global.css`):

```css
@keyframes slideInUp   { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes shake        { 0%,100% { transform: none; } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
@keyframes fadeIn       { from { opacity: 0; } to { opacity: 1; } }
```

### `/registro` — nuevo formulario

- Tarjeta centrada, entrada con `slideInUp` al montar (200ms)
- **Floating labels**: el `label` está dentro del campo, se mueve arriba con `transform: translateY` + escala al 75% cuando el input tiene foco o valor. Solo CSS (`:focus` + `:not(:placeholder-shown)`)
- **Layout**: 2 columnas en ≥768px, 1 en móvil
  - Fila 1: Nombre · Apellido
  - Fila 2: Correo electrónico (ancho completo)
  - Fila 3: Contraseña · Confirmar contraseña
  - Fila 4: Fecha de nacimiento · Teléfono
  - Fila 5: Empresa/Organización · Puesto
  - Fila 6: Check aviso de privacidad (unchecked default)
  - Botón "Crear cuenta"
- **Indicador de fuerza de contraseña**: 3 barras CSS (`débil` sage / `media` fern / `fuerte` hunter), calculado por longitud + mayúscula + número
- **Error state**: borde rojo + mensaje + animación `shake` en el campo
- Logo de Mez arriba (enlaza a `/`), "¿Ya tienes cuenta? Entra" abajo
- Sin pasos. Un solo formulario que envía y muestra todos los errores inline

### `/login` — rediseño

- Misma tarjeta animada, mismas floating labels
- Campos: correo + contraseña
- Botón loading animado (spinner CSS)
- "¿No tienes cuenta? Regístrate" + "¿Olvidaste tu contraseña?" (enlace sin función por ahora, `[PENDIENTE]`)

### Header público — links de auth

Cuando el usuario **no** está autenticado:
```
[Logo] Pruebas · Cómo funciona · Precios · Ayuda    [Entrar]  [Crear cuenta]
```
- "Entrar" → link a `/login` (ghost/texto, sin botón primario)
- "Crear cuenta" → botón primario hunter → `/registro`
- En móvil: ambos van al final del panel hamburguesa

Cuando el usuario **sí** está autenticado:
```
[Logo] Pruebas · Cómo funciona · Precios · Ayuda    [@nombre ▾]
```
- Click en `@nombre` abre un pequeño dropdown: "Mi perfil" → `/perfil`, "Panel de RH" → `/app` (solo si tiene org), "Salir"
- Si el usuario no tiene organización, "Panel de RH" no aparece en el dropdown

### `/perfil` — perfil del usuario autenticado

Página pública (dentro del RootLayout), accesible para cualquier usuario logueado:
- Formulario con todos los campos de perfil (nombre, apellido, teléfono, fecha, puesto, empresa)
- Sección separada para cambiar contraseña
- Botón guardar con feedback de éxito/error

---

## D. CRUD de usuarios (`/admin`)

### `/admin/usuarios` — lista

- Tabla: Nombre completo · Correo · Organización · Puesto · Fecha de registro · Acciones (ver, eliminar)
- Búsqueda por nombre o correo (filtra en servidor)
- Paginación (15 por página), botones anterior/siguiente
- Fila eliminar: confirmación inline antes de ejecutar

### `/admin/usuarios/:id` — detalle/editar

- Formulario con todos los campos del perfil del usuario
- Select de `role` (admin, recruiter, viewer) — no muestra `is_platform_admin`
- Botón "Guardar cambios"
- Botón "Eliminar usuario" (rojo, con confirmación)

### `/admin/perfil` — perfil del operador

- Formulario: correo + contraseña actual + nueva contraseña + confirmar nueva contraseña
- Guarda en `PUT /api/admin/me`
- Feedback de éxito inline

---

## E. Seguridad y accesibilidad

- Contraseña confirmada tanto en frontend (validación inmediata) como en backend (`same:password`)
- `privacy_accepted` guardado con timestamp e IP en `privacy_accepted_at` (solo timestamp; IP ya está en `consents` de evaluaciones)
- Floating labels mantienen `<label>` en el DOM para accesibilidad (`aria-labelledby` no necesario, el label está presente)
- Inputs con `autocomplete` apropiado: `email`, `new-password`, `given-name`, `family-name`, `tel`, `bday`, `organization`, `organization-title`
- Animaciones desactivadas con `prefers-reduced-motion` (la regla global ya existe en `global.css`)
- No se bloquea el zoom (`maximum-scale` no se usa)
- Foco visible en todos los inputs y botones

---

## F. Archivos a crear/modificar

**Backend:**
- Create: migración `add_profile_fields_to_users_table`
- Modify: `app/Models/User.php` (#[Fillable]), `RegisterRequest.php`, `RegisterController.php`
- Create: `app/Http/Requests/UpdateProfileRequest.php`, `UpdatePasswordRequest.php`, `UpdateAdminMeRequest.php`, `AdminUserRequest.php`
- Create: `app/Http/Controllers/ProfileController.php`, `Admin/UserController.php`
- Modify: `routes/api.php`, `database/seeders/PlatformAdminSeeder.php`, `.env.example`
- Test: `tests/Feature/RegistroTest.php`, `ProfileTest.php`, `AdminUserTest.php`

**Frontend:**
- Create: `src/styles/animations.css`, `src/components/ui/FloatingInput.tsx`+css, `src/components/ui/PasswordStrength.tsx`+css, `src/components/ui/UserDropdown.tsx`+css
- Modify: `src/pages/auth/Registro.tsx`, `Login.tsx`, `Auth.css`
- Modify: `src/components/layout/Header.tsx`, `Header.css`
- Create: `src/pages/PerfilPage.tsx`+css
- Create: `src/pages/admin/AdminUsuariosPage.tsx`+css, `AdminUsuarioDetallePage.tsx`+css, `AdminPerfilPage.tsx`+css
- Modify: `src/App.tsx` (rutas `/perfil`, `/admin/usuarios`, `/admin/usuarios/:id`, `/admin/perfil`)
- Create: `src/api/profile.ts`, `src/api/adminUsers.ts`

---

## G. [PENDIENTE]

1. Recuperación de contraseña ("¿Olvidaste tu contraseña?") — flujo completo con email de reset
2. `ADMIN_EMAIL` y `ADMIN_PASSWORD` reales en `.env` de producción
