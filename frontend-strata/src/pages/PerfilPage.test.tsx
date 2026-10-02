import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/api/auth'
import { getProfile, updatePassword, updateProfile } from '@/api/profile'
import { AVISO_SIN_ORGANIZACION } from '@/components/rutasDeSesion'
import { ToastProvider } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { TITULO_SIN_EMPRESA } from './perfil/AvisoCuenta'
import { EXITO_CONTRASENA } from './perfil/FormularioContrasena'
import { EXITO_DATOS, type Perfil } from './perfil/FormularioDatos'
import { diaAnterior, fechaLocal } from './perfil/validacion'
import PerfilPage from './PerfilPage'

// /perfil con src/api/profile y la sesión simulados. Formas de ProfileController
// (2026-09-12-registro-login-crud-usuarios.md:595-622): GET devuelve el usuario
// con su organización; birth_date llega en ISO 8601 porque el modelo la convierte.

vi.mock('@/api/profile', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
}))

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }))

// SITE.email se puede cambiar por prueba: el aviso lo lee al dibujarse.
const CORREO_PENDIENTE = '[PENDIENTE: correo de contacto]'
const sitio = vi.hoisted(() => ({ email: '[PENDIENTE: correo de contacto]' }))
vi.mock('@/config/site', async (importOriginal) => {
  const { SITE } = await importOriginal<typeof import('@/config/site')>()
  return {
    SITE: {
      ...SITE,
      get email() {
        return sitio.email
      },
    },
  }
})

const SESION: AuthUser = {
  id: 1,
  name: 'Ana',
  last_name: 'López',
  email: 'ana@empresa.mx',
  role: 'admin',
  organization_id: 7,
}

const PERFIL: Perfil = {
  ...SESION,
  phone: '5512345678',
  birth_date: '1990-05-15T00:00:00.000000Z',
  position: 'Gerente de RR. HH.',
  organization: { name: 'Comercializadora Río Claro' },
}

const SIN_EMPRESA: Perfil = { ...PERFIL, organization_id: null, organization: undefined }

/** Error de axios con el código y el cuerpo dados; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

const setUser = vi.fn()

function sesion(user: AuthUser = SESION) {
  vi.mocked(useAuth).mockReturnValue({ user, loading: false, setUser })
}

function montar(state?: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/perfil', state }]}>
      <ToastProvider>
        <PerfilPage />
      </ToastProvider>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

type Usuario = ReturnType<typeof userEvent.setup>

/** Escribe un texto de una vez (pegar): un solo evento de cambio por campo, rápido con la máquina cargada. */
async function escribir(user: Usuario, elemento: HTMLElement, texto: string) {
  await user.click(elemento)
  await user.paste(texto)
}

const formulario = (nombre: string) => screen.getByRole('form', { name: nombre })
const campo = (etiqueta: RegExp) => screen.getByLabelText(etiqueta) as HTMLInputElement
const toaster = () => document.querySelector('.st-toaster') as HTMLElement

async function esperarFormulario() {
  return screen.findByRole('form', { name: 'Datos personales' })
}

// Margen para correr junto a otras suites en paralelo; una prueba colgada igual falla.
describe('PerfilPage', { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(getProfile).mockReset()
    vi.mocked(updateProfile).mockReset()
    vi.mocked(updatePassword).mockReset()
    vi.mocked(useAuth).mockReset()
    setUser.mockReset()
    sitio.email = CORREO_PENDIENTE
    sesion()
  })

  describe('carga', () => {
    it('muestra la carga y después los datos, con correo y empresa en solo lectura', async () => {
      let responder: (perfil: Perfil) => void = () => {}
      vi.mocked(getProfile).mockReturnValue(new Promise<Perfil>((resolve) => (responder = resolve)))
      montar()

      expect(screen.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeInTheDocument()
      // El toaster también es role="status": se busca el texto de la carga.
      expect(screen.getByText('Cargando tu perfil…').closest('[role="status"]')).toBeInTheDocument()

      responder(PERFIL)
      const datos = await esperarFormulario()
      expect(within(datos).getByRole('textbox', { name: 'Nombre' })).toHaveValue('Ana')
      expect(within(datos).getByRole('textbox', { name: 'Apellido' })).toHaveValue('López')
      expect(within(datos).getByRole('textbox', { name: 'Teléfono' })).toHaveValue('5512345678')
      expect(within(datos).getByRole('textbox', { name: 'Puesto' })).toHaveValue('Gerente de RR. HH.')
      // La fecha llega en ISO y se muestra como día; antes se reenviaba sin campo visible.
      expect(campo(/^Fecha de nacimiento/)).toHaveValue('1990-05-15')
      expect(campo(/^Fecha de nacimiento/)).toHaveAttribute('max', diaAnterior(fechaLocal(new Date())))

      // Correo y empresa: datos, no controles editables (PB-22).
      expect(within(datos).getByText('ana@empresa.mx').tagName).toBe('DD')
      expect(within(datos).getByText('Comercializadora Río Claro').tagName).toBe('DD')
      expect(within(datos).queryByRole('textbox', { name: /Empresa/ })).not.toBeInTheDocument()

      expect(formulario('Cambiar contraseña')).toBeInTheDocument()
      expect(screen.queryByText('Cargando tu perfil…')).not.toBeInTheDocument()
      // Con empresa no hay aviso de cuenta.
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.queryByText(TITULO_SIN_EMPRESA)).not.toBeInTheDocument()
    })

    it('si falla, muestra un error distinto de la carga con Reintentar y vuelve a pedir el perfil', async () => {
      vi.mocked(getProfile).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce(PERFIL)
      const user = montar()

      const error = await screen.findByRole('alert')
      expect(within(error).getByRole('heading', { level: 2, name: 'No pudimos cargar tu perfil' })).toBeInTheDocument()
      expect(error).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')
      expect(screen.queryByRole('form', { name: 'Datos personales' })).not.toBeInTheDocument()

      await user.click(within(error).getByRole('button', { name: 'Reintentar' }))
      expect(await esperarFormulario()).toBeInTheDocument()
      expect(getProfile).toHaveBeenCalledTimes(2)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('datos personales', () => {
    it('Guardar cambios envía el payload de siempre, confirma con toast y aviso, y actualiza la sesión', async () => {
      vi.mocked(getProfile).mockResolvedValue(PERFIL)
      vi.mocked(updateProfile).mockResolvedValue()
      const user = montar()
      const datos = await esperarFormulario()

      const nombre = within(datos).getByRole('textbox', { name: 'Nombre' })
      await user.clear(nombre)
      await escribir(user, nombre, 'Ana María')
      await user.clear(within(datos).getByRole('textbox', { name: 'Teléfono' }))
      await user.click(within(datos).getByRole('button', { name: 'Guardar cambios' }))

      expect(updateProfile).toHaveBeenCalledTimes(1)
      expect(updateProfile).toHaveBeenCalledWith({
        name: 'Ana María',
        last_name: 'López',
        phone: '',
        birth_date: '1990-05-15',
        position: 'Gerente de RR. HH.',
      })
      expect(await within(toaster()).findByText(EXITO_DATOS)).toBeInTheDocument()
      expect(within(datos).getByText(EXITO_DATOS)).toBeInTheDocument()
      // La barra superior lee el nombre de la sesión.
      expect(setUser).toHaveBeenCalledWith({ ...SESION, name: 'Ana María', last_name: 'López' })

      // El aviso en línea se va en cuanto se vuelve a editar.
      await user.type(nombre, ' R.')
      expect(within(datos).queryByText(EXITO_DATOS)).not.toBeInTheDocument()
    })

    it('el apellido es obligatorio aunque venga nulo (PB-27)', async () => {
      vi.mocked(getProfile).mockResolvedValue({ ...PERFIL, last_name: undefined, phone: undefined })
      vi.mocked(updateProfile).mockResolvedValue()
      const user = montar()
      const datos = await esperarFormulario()

      const apellido = within(datos).getByRole('textbox', { name: 'Apellido' })
      expect(apellido).toHaveValue('')
      expect(apellido).toBeRequired()
      expect(apellido).toHaveAccessibleDescription('Complétalo para poder guardar')

      await user.click(within(datos).getByRole('button', { name: 'Guardar cambios' }))
      expect(updateProfile).not.toHaveBeenCalled()
      expect(apellido).toHaveAttribute('aria-invalid', 'true')
      expect(apellido).toHaveAccessibleDescription(/Escribe tu apellido\./)
      expect(apellido).toHaveFocus()

      await escribir(user, apellido, 'López')
      expect(apellido).not.toHaveAttribute('aria-invalid')
      await user.click(within(datos).getByRole('button', { name: 'Guardar cambios' }))
      expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ last_name: 'López', phone: '' }))
    })

    it('la fecha de nacimiento debe ser anterior a hoy; el error se ve al elegirla', async () => {
      vi.mocked(getProfile).mockResolvedValue(PERFIL)
      const user = montar()
      const datos = await esperarFormulario()

      const fecha = campo(/^Fecha de nacimiento/)
      fireEvent.change(fecha, { target: { value: '2999-01-01' } })
      expect(fecha).toHaveAttribute('aria-invalid', 'true')
      expect(within(datos).getByText('La fecha de nacimiento debe ser anterior a hoy.')).toBeInTheDocument()

      await user.click(within(datos).getByRole('button', { name: 'Guardar cambios' }))
      expect(updateProfile).not.toHaveBeenCalled()
      expect(fecha).toHaveFocus()
    })

    it('muestra los errores 422 del servidor en su campo y los quita al editarlo', async () => {
      vi.mocked(getProfile).mockResolvedValue(PERFIL)
      vi.mocked(updateProfile).mockRejectedValue(
        errorHttp(422, { message: 'Datos inválidos.', errors: { phone: ['El teléfono no debe tener más de 30 caracteres.'] } }),
      )
      const user = montar()
      const datos = await esperarFormulario()

      await user.click(within(datos).getByRole('button', { name: 'Guardar cambios' }))
      const telefono = within(datos).getByRole('textbox', { name: 'Teléfono' })
      expect(await within(datos).findByText('El teléfono no debe tener más de 30 caracteres.')).toBeInTheDocument()
      expect(telefono).toHaveAttribute('aria-invalid', 'true')
      expect(telefono).toHaveFocus()
      // Un error por campo no repite un aviso general ni confirma nada.
      expect(within(datos).queryByText('No pudimos guardar tus cambios')).not.toBeInTheDocument()
      expect(setUser).not.toHaveBeenCalled()

      await user.type(telefono, '1')
      expect(within(datos).queryByText('El teléfono no debe tener más de 30 caracteres.')).not.toBeInTheDocument()
    })

    it('un error de red al guardar se muestra en línea y conserva lo escrito', async () => {
      vi.mocked(getProfile).mockResolvedValue(PERFIL)
      vi.mocked(updateProfile).mockRejectedValue(errorHttp())
      const user = montar()
      const datos = await esperarFormulario()

      const puesto = within(datos).getByRole('textbox', { name: 'Puesto' })
      await user.clear(puesto)
      await escribir(user, puesto, 'Directora')
      await user.click(within(datos).getByRole('button', { name: 'Guardar cambios' }))

      const aviso = await within(datos).findByRole('alert')
      expect(aviso).toHaveTextContent('No pudimos guardar tus cambios')
      expect(aviso).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')
      expect(puesto).toHaveValue('Directora')
      expect(setUser).not.toHaveBeenCalled()
      expect(within(toaster()).queryByText(EXITO_DATOS)).not.toBeInTheDocument()
    })
  })

  describe('cambiar contraseña', () => {
    it('valida la confirmación al momento, con los estados de error y válido', async () => {
      vi.mocked(getProfile).mockResolvedValue(PERFIL)
      const user = montar()
      await esperarFormulario()

      await escribir(user, campo(/^Nueva contraseña/), 'secreta123')
      const confirmacion = campo(/^Confirmar nueva contraseña/)
      // Mientras la confirmación es más corta que la nueva, todavía no avisa.
      await escribir(user, confirmacion, 'secreta12')
      expect(confirmacion).not.toHaveAttribute('aria-invalid')

      // La tecla que la iguala en largo ya muestra la diferencia, sin salir del campo.
      await user.keyboard('4')
      expect(confirmacion).toHaveAttribute('aria-invalid', 'true')
      expect(confirmacion).toHaveAccessibleDescription(/Las contraseñas no coinciden\./)

      await user.keyboard('{Backspace}3')
      expect(confirmacion).not.toHaveAttribute('aria-invalid')
      expect(confirmacion.closest('.st-input')).toHaveClass('st-input--valid')
      expect(campo(/^Nueva contraseña/).closest('.st-input')).toHaveClass('st-input--valid')
      expect(updatePassword).not.toHaveBeenCalled()
    })

    it('no envía con campos vacíos o una nueva corta, y enfoca el primer error', async () => {
      vi.mocked(getProfile).mockResolvedValue(PERFIL)
      const user = montar()
      await esperarFormulario()
      const contrasena = formulario('Cambiar contraseña')

      await user.click(within(contrasena).getByRole('button', { name: 'Cambiar contraseña' }))
      expect(updatePassword).not.toHaveBeenCalled()
      expect(within(contrasena).getByText('Escribe tu contraseña actual.')).toBeInTheDocument()
      expect(within(contrasena).getByText('Escribe una contraseña nueva.')).toBeInTheDocument()
      expect(within(contrasena).getByText('Confirma tu nueva contraseña.')).toBeInTheDocument()
      expect(campo(/^Contraseña actual/)).toHaveFocus()

      await escribir(user, campo(/^Contraseña actual/), 'actual123')
      await escribir(user, campo(/^Nueva contraseña/), 'corta')
      await escribir(user, campo(/^Confirmar nueva contraseña/), 'corta')
      await user.click(within(contrasena).getByRole('button', { name: 'Cambiar contraseña' }))
      expect(updatePassword).not.toHaveBeenCalled()
      expect(within(contrasena).getByText('Usa al menos 8 caracteres.')).toBeInTheDocument()
      expect(campo(/^Nueva contraseña/)).toHaveFocus()
    })

    it('envía el payload de siempre, vacía los campos y confirma con toast y aviso', async () => {
      vi.mocked(getProfile).mockResolvedValue(PERFIL)
      vi.mocked(updatePassword).mockResolvedValue()
      const user = montar()
      await esperarFormulario()
      const contrasena = formulario('Cambiar contraseña')

      await escribir(user, campo(/^Contraseña actual/), 'actual123')
      await escribir(user, campo(/^Nueva contraseña/), 'secreta123')
      await escribir(user, campo(/^Confirmar nueva contraseña/), 'secreta123')
      await user.click(within(contrasena).getByRole('button', { name: 'Cambiar contraseña' }))

      expect(updatePassword).toHaveBeenCalledWith({
        current_password: 'actual123',
        password: 'secreta123',
        password_confirmation: 'secreta123',
      })
      expect(await within(toaster()).findByText(EXITO_CONTRASENA)).toBeInTheDocument()
      expect(within(contrasena).getByText(EXITO_CONTRASENA)).toBeInTheDocument()
      expect(campo(/^Contraseña actual/)).toHaveValue('')
      expect(campo(/^Nueva contraseña/)).toHaveValue('')
      expect(campo(/^Confirmar nueva contraseña/)).toHaveValue('')
      expect(campo(/^Confirmar nueva contraseña/)).not.toHaveAttribute('aria-invalid')
    })

    it('muestra el 422 de cada campo, no solo el de la contraseña actual', async () => {
      vi.mocked(getProfile).mockResolvedValue(PERFIL)
      vi.mocked(updatePassword).mockRejectedValue(
        errorHttp(422, {
          message: 'Datos inválidos.',
          errors: {
            current_password: ['La contraseña actual es incorrecta.'],
            password: ['La contraseña nueva no es válida.'],
          },
        }),
      )
      const user = montar()
      await esperarFormulario()
      const contrasena = formulario('Cambiar contraseña')

      await escribir(user, campo(/^Contraseña actual/), 'equivocada')
      await escribir(user, campo(/^Nueva contraseña/), 'secreta123')
      await escribir(user, campo(/^Confirmar nueva contraseña/), 'secreta123')
      await user.click(within(contrasena).getByRole('button', { name: 'Cambiar contraseña' }))

      expect(await within(contrasena).findByText('La contraseña actual es incorrecta.')).toBeInTheDocument()
      expect(within(contrasena).getByText('La contraseña nueva no es válida.')).toBeInTheDocument()
      expect(campo(/^Contraseña actual/)).toHaveAttribute('aria-invalid', 'true')
      expect(campo(/^Contraseña actual/)).toHaveFocus()
      // Lo escrito se conserva para corregirlo.
      expect(campo(/^Nueva contraseña/)).toHaveValue('secreta123')
    })
  })

  describe('aviso de cuenta sin empresa', () => {
    it('al llegar de /app muestra un solo aviso, con el de la guarda y contacto, desde antes de cargar', async () => {
      sesion({ ...SESION, organization_id: null })
      let responder: (perfil: Perfil) => void = () => {}
      vi.mocked(getProfile).mockReturnValue(new Promise<Perfil>((resolve) => (responder = resolve)))
      montar({ aviso: AVISO_SIN_ORGANIZACION })

      // Ya mientras carga el perfil (la empresa sale de la sesión).
      expect(screen.getByRole('alert')).toHaveTextContent(AVISO_SIN_ORGANIZACION)

      responder(SIN_EMPRESA)
      const datos = await esperarFormulario()
      const avisos = screen.getAllByRole('alert')
      expect(avisos).toHaveLength(1)
      const [aviso] = avisos
      expect(aviso).toHaveTextContent(AVISO_SIN_ORGANIZACION)
      // Mientras el correo sea [PENDIENTE], el marcador a la vista y ningún mailto (como /ayuda).
      expect(within(aviso).getByText(CORREO_PENDIENTE)).toHaveClass('st-pendiente')
      expect(within(aviso).queryByRole('link')).not.toBeInTheDocument()
      // Sin la instrucción imposible de antes (PB-22).
      expect(screen.queryByText(/completa el campo/i)).not.toBeInTheDocument()
      expect(within(datos).getByText('Sin empresa asociada')).toBeInTheDocument()
    })

    it('si entra por su cuenta, el aviso explica y ofrece contacto sin interrumpir', async () => {
      sitio.email = 'soporte@strata.mx'
      sesion({ ...SESION, organization_id: null })
      vi.mocked(getProfile).mockResolvedValue(SIN_EMPRESA)
      montar()
      await esperarFormulario()

      const titulo = screen.getByText(TITULO_SIN_EMPRESA)
      const aviso = titulo.closest('.st-callout') as HTMLElement
      expect(aviso).toHaveTextContent('Sin una empresa no puedes entrar al panel de RR. HH. ni crear evaluaciones.')
      // Con un correo real, el contacto es un mailto.
      expect(within(aviso).getByRole('link', { name: 'soporte@strata.mx' })).toHaveAttribute(
        'href',
        'mailto:soporte@strata.mx',
      )
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
