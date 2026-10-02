import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { opcionesDeCuenta, type CuentaMenu } from './navegacion'
import { UserMenu } from './UserMenu'

function Ubicacion() {
  const navigate = useNavigate()
  return (
    <>
      <p data-testid="ruta">{useLocation().pathname}</p>
      <button type="button" onClick={() => navigate('/app/evaluaciones')}>
        Ir a candidatos
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        Atrás
      </button>
    </>
  )
}

function montar(cuenta: Partial<CuentaMenu> = {}) {
  const onSalir = vi.fn()
  const datos: CuentaMenu = {
    nombre: 'Valentina Ríos',
    etiqueta: 'Acme Talento',
    detalle: 'valentina@acme.mx',
    opciones: opcionesDeCuenta('rh', { organization_id: 3, is_platform_admin: true }),
    onSalir,
    ...cuenta,
  }
  render(
    <MemoryRouter initialEntries={['/app/creditos']}>
      <button type="button">Antes</button>
      <UserMenu cuenta={datos} />
      <button type="button">Después</button>
      <Ubicacion />
    </MemoryRouter>,
  )
  return { onSalir, user: userEvent.setup() }
}

const pastilla = () => screen.getByRole('button', { name: /menú de cuenta/i })
const opcion = (nombre: string) => screen.getByRole('menuitem', { name: nombre })

describe('UserMenu', () => {
  it('la pastilla es un botón de menú con iniciales, organización y nombre accesible', () => {
    montar()
    const boton = pastilla()
    expect(boton).toHaveAttribute('aria-haspopup', 'menu')
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(boton).toHaveAccessibleName('Acme Talento, menú de cuenta de Valentina Ríos')
    expect(boton).toHaveTextContent('VR')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('con el nombre de la persona como texto, el nombre accesible no lo repite', () => {
    montar({ etiqueta: 'Valentina Ríos' })
    expect(pastilla()).toHaveAccessibleName('Valentina Ríos, menú de cuenta')
  })

  it('mientras carga la organización muestra un marcador y conserva el nombre accesible', () => {
    montar({ etiqueta: null })
    expect(pastilla()).toHaveAccessibleName('Menú de cuenta de Valentina Ríos')
    expect(pastilla().querySelector('.st-user-menu__label--loading')).toHaveAttribute('aria-hidden', 'true')
  })

  it('abre con clic: aria-expanded, menú con nombre, opciones y foco en la primera', async () => {
    const { user } = montar()
    await user.click(pastilla())

    expect(pastilla()).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu', { name: 'Acme Talento, menú de cuenta de Valentina Ríos' })
    expect(pastilla()).toHaveAttribute('aria-controls', menu.id)
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Mi perfil',
      'Operación',
      'Sitio público',
      'Salir',
    ])
    expect(opcion('Mi perfil')).toHaveAttribute('href', '/perfil')
    expect(opcion('Operación')).toHaveAttribute('href', '/admin/creditos')
    expect(opcion('Sitio público')).toHaveAttribute('href', '/')
    expect(opcion('Mi perfil')).toHaveFocus()
    // Cabecera con quién tiene la sesión.
    expect(screen.getByText('valentina@acme.mx')).toBeInTheDocument()
  })

  it('un segundo clic en la pastilla lo cierra', async () => {
    const { user } = montar()
    await user.click(pastilla())
    await user.click(pastilla())
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(pastilla()).toHaveAttribute('aria-expanded', 'false')
  })

  it('flechas, Inicio y Fin recorren las opciones y dan la vuelta', async () => {
    const { user } = montar()
    pastilla().focus()
    await user.keyboard('{ArrowDown}')
    expect(opcion('Mi perfil')).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(opcion('Operación')).toHaveFocus()
    await user.keyboard('{End}')
    expect(opcion('Salir')).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(opcion('Mi perfil')).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(opcion('Salir')).toHaveFocus()
    await user.keyboard('{Home}')
    expect(opcion('Mi perfil')).toHaveFocus()
    // Una letra salta a la opción que empieza con ella (sin importar acentos).
    await user.keyboard('s')
    expect(opcion('Sitio público')).toHaveFocus()
    await user.keyboard('s')
    expect(opcion('Salir')).toHaveFocus()
  })

  it('↑ en la pastilla abre el menú en la última opción', async () => {
    const { user } = montar()
    pastilla().focus()
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(opcion('Salir')).toHaveFocus()
  })

  it('Enter en la pastilla abre en la primera opción', async () => {
    const { user } = montar()
    pastilla().focus()
    await user.keyboard('{Enter}')
    expect(opcion('Mi perfil')).toHaveFocus()
  })

  it('Escape cierra y devuelve el foco a la pastilla', async () => {
    const { user } = montar()
    await user.click(pastilla())
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(pastilla()).toHaveFocus()
    expect(pastilla()).toHaveAttribute('aria-expanded', 'false')
  })

  it('un clic fuera lo cierra', async () => {
    const { user } = montar()
    await user.click(pastilla())
    await user.click(screen.getByRole('button', { name: 'Después' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('un clic dentro del menú no lo cierra por «fuera»', async () => {
    montar()
    fireEvent.click(pastilla())
    fireEvent.pointerDown(screen.getByText('valentina@acme.mx'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('si el foco sale del menú por otra vía, se cierra', async () => {
    const { user } = montar()
    await user.click(pastilla())
    act(() => screen.getByRole('button', { name: 'Después' }).focus())
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('Tab cierra el menú', async () => {
    const { user } = montar()
    await user.click(pastilla())
    await user.tab()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('elegir un enlace navega, cierra y deja el foco en la pastilla', async () => {
    const { user } = montar()
    await user.click(pastilla())
    await user.click(opcion('Mi perfil'))
    expect(screen.getByTestId('ruta')).toHaveTextContent('/perfil')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(pastilla()).toHaveFocus()
  })

  it('se cierra si la ruta cambia por otra vía y no se reabre al volver', async () => {
    const { user } = montar()
    await user.click(pastilla())
    // Navegación que no pasa por el menú (por ejemplo, un atajo del navegador).
    act(() => screen.getByRole('button', { name: 'Ir a candidatos' }).click())
    expect(screen.getByTestId('ruta')).toHaveTextContent('/app/evaluaciones')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    act(() => screen.getByRole('button', { name: 'Atrás' }).click())
    expect(screen.getByTestId('ruta')).toHaveTextContent('/app/creditos')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('Espacio también elige un enlace', async () => {
    const { user } = montar()
    pastilla().focus()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(opcion('Operación')).toHaveFocus()
    await user.keyboard(' ')
    expect(screen.getByTestId('ruta')).toHaveTextContent('/admin/creditos')
  })

  it('Salir llama a onSalir y cierra el menú', async () => {
    const { user, onSalir } = montar()
    await user.click(pastilla())
    await user.click(opcion('Salir'))
    expect(onSalir).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('mientras sale, Salir queda deshabilitado y no repite la llamada', async () => {
    const { user, onSalir } = montar({ saliendo: true })
    expect(pastilla()).toHaveAttribute('aria-busy', 'true')
    await user.click(pastilla())
    const salir = opcion('Saliendo…')
    expect(salir).toHaveAttribute('aria-disabled', 'true')
    await user.click(salir)
    expect(onSalir).not.toHaveBeenCalled()
  })
})
