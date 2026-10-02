import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileMenu, type MobileMenuProps } from './MobileMenu'
import { ENLACE_AYUDA, ENLACE_CODIGO, ENLACES_PUBLICOS, ENLACES_RH, opcionesDeCuenta, type CuentaMenu } from './navegacion'

function Ubicacion() {
  const navigate = useNavigate()
  return (
    <>
      <p data-testid="ruta">{useLocation().pathname}</p>
      <button type="button" onClick={() => navigate(-1)}>
        Atrás
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Adelante
      </button>
    </>
  )
}

function montar(props: Partial<MobileMenuProps> = {}, ruta = '/app/creditos') {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <a href="#fuera">Fuera del menú</a>
      <MobileMenu navLabel="Panel de RR. HH." enlaces={ENLACES_RH} {...props} />
      <Ubicacion />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

function cuentaRh(cambios: Partial<CuentaMenu> = {}): CuentaMenu {
  return {
    nombre: 'Valentina Ríos',
    etiqueta: 'Acme Talento',
    detalle: 'valentina@acme.mx',
    opciones: opcionesDeCuenta('rh', { organization_id: 3, is_platform_admin: true }),
    onSalir: vi.fn(),
    ...cambios,
  }
}

const boton = () => screen.getByRole('button', { name: 'Menú' })
const panel = () => {
  const id = boton().getAttribute('aria-controls')
  const elemento = id ? document.getElementById(id) : null
  if (!elemento) throw new Error('El panel no está abierto')
  return elemento
}

afterEach(() => {
  document.body.style.overflow = ''
})

describe('MobileMenu', () => {
  it('es un botón «Menú» con aria-expanded que abre y cierra el panel', async () => {
    const user = montar()
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
    expect(boton()).not.toHaveAttribute('aria-controls')

    await user.click(boton())
    expect(boton()).toHaveAttribute('aria-expanded', 'true')
    const nav = within(panel()).getByRole('navigation', { name: 'Panel de RR. HH.' })
    expect(within(nav).getAllByRole('link').map((enlace) => enlace.textContent)).toEqual([
      'Tests',
      'Créditos',
      'Candidatos',
      'Resultados',
    ])
    expect(within(nav).getByRole('link', { name: 'Créditos' })).toHaveAttribute('aria-current', 'page')

    await user.click(boton())
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
    expect(boton()).not.toHaveAttribute('aria-controls')
  })

  it('atrapa el foco entre el botón y el panel: Tab y Mayús+Tab circulan', async () => {
    const user = montar({ cuenta: cuentaRh() })
    await user.click(boton())
    expect(boton()).toHaveFocus()

    const enfocables = [boton(), ...within(panel()).getAllByRole('link'), within(panel()).getByRole('button', { name: 'Salir' })]
    for (const elemento of enfocables.slice(1)) {
      await user.tab()
      expect(elemento).toHaveFocus()
    }
    // Del último vuelve al botón, sin salir al resto de la página.
    await user.tab()
    expect(boton()).toHaveFocus()
    await user.tab({ shift: true })
    expect(within(panel()).getByRole('button', { name: 'Salir' })).toHaveFocus()
    expect(screen.getByRole('link', { name: 'Fuera del menú' })).not.toHaveFocus()
  })

  it('Escape cierra y devuelve el foco al botón', async () => {
    const user = montar()
    await user.click(boton())
    await user.tab()
    expect(within(panel()).getByRole('link', { name: 'Tests' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
    expect(boton()).toHaveFocus()
  })

  it('se cierra al navegar', async () => {
    const user = montar()
    await user.click(boton())
    await user.click(within(panel()).getByRole('link', { name: 'Candidatos' }))
    expect(screen.getByTestId('ruta')).toHaveTextContent('/app/evaluaciones')
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
  })

  it('volver con Atrás a la página donde se abrió no lo reabre', async () => {
    const user = montar()
    await user.click(boton())
    await user.click(within(panel()).getByRole('link', { name: 'Candidatos' }))
    expect(boton()).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(screen.getByTestId('ruta')).toHaveTextContent('/app/creditos')
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByRole('button', { name: 'Adelante' }))
    expect(screen.getByTestId('ruta')).toHaveTextContent('/app/evaluaciones')
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')
  })

  it('bloquea el desplazamiento de la página mientras está abierto', async () => {
    const user = montar()
    await user.click(boton())
    expect(document.body.style.overflow).toBe('hidden')
    await user.click(boton())
    expect(document.body.style.overflow).toBe('')
  })

  it('se cierra si la ventana pasa a escritorio (768 px o más)', async () => {
    let alCambiar: (() => void) | undefined
    const consulta = {
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: (_tipo: string, oyente: () => void) => {
        alCambiar = oyente
      },
      removeEventListener: () => {},
    }
    vi.spyOn(window, 'matchMedia').mockReturnValue(consulta as unknown as MediaQueryList)

    const user = montar()
    await user.click(boton())
    expect(boton()).toHaveAttribute('aria-expanded', 'true')

    consulta.matches = true
    act(() => alCambiar?.())
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
  })

  it('con el corte de su barra (RR. HH., 900 px) escucha ese ancho para cerrarse', async () => {
    const consultas: string[] = []
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (media: string) =>
        ({
          matches: false,
          media,
          addEventListener: () => consultas.push(media),
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    )
    const user = montar({ corte: 'rh' })
    await user.click(boton())
    expect(consultas).toContain('(min-width: 900px)')
  })

  it('con sesión muestra quién es y las opciones de la pastilla, con Operación y Salir (R-06)', async () => {
    const cuenta = cuentaRh()
    const user = montar({ cuenta })
    await user.click(boton())
    const contenido = within(panel())

    expect(contenido.getByText('Valentina Ríos')).toBeInTheDocument()
    expect(contenido.getByText('Acme Talento')).toBeInTheDocument()
    expect(contenido.getByText('valentina@acme.mx')).toBeInTheDocument()
    expect(contenido.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/perfil')
    expect(contenido.getByRole('link', { name: 'Operación' })).toHaveAttribute('href', '/admin/creditos')
    expect(contenido.getByRole('link', { name: 'Sitio público' })).toHaveAttribute('href', '/')

    await user.click(contenido.getByRole('button', { name: 'Salir' }))
    expect(cuenta.onSalir).toHaveBeenCalledTimes(1)
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
  })

  it('sin is_platform_admin no ofrece Operación', async () => {
    const user = montar({
      cuenta: cuentaRh({ opciones: opcionesDeCuenta('rh', { organization_id: 3, is_platform_admin: false }) }),
    })
    await user.click(boton())
    expect(within(panel()).queryByRole('link', { name: 'Operación' })).not.toBeInTheDocument()
    expect(within(panel()).getByRole('button', { name: 'Salir' })).toBeInTheDocument()
  })

  it('pública sin sesión: navegación con Ayuda, «Tengo un código» y el pie con Entrar y Crear cuenta', async () => {
    const user = montar(
      {
        navLabel: 'Navegación principal',
        enlaces: [...ENLACES_PUBLICOS, ENLACE_AYUDA],
        secundarios: [ENLACE_CODIGO],
        pie: (
          <>
            <a href="/login">Entrar</a>
            <a href="/registro">Crear cuenta</a>
          </>
        ),
      },
      '/precios',
    )
    await user.click(boton())
    const contenido = within(panel())
    const nav = within(contenido.getByRole('navigation', { name: 'Navegación principal' }))
    expect(nav.getAllByRole('link').map((enlace) => enlace.textContent)).toEqual([
      'Tests',
      'Para empresas',
      'Cómo funciona',
      'Precios',
      'Ayuda',
    ])
    expect(nav.getByRole('link', { name: 'Precios' })).toHaveAttribute('aria-current', 'page')
    const codigo = contenido.getByRole('link', { name: 'Tengo un código' })
    expect(codigo).toHaveAttribute('href', '/evaluar')
    expect(codigo).toHaveClass('st-mobile-menu__link--accent')
    expect(contenido.getByRole('link', { name: 'Entrar' })).toBeInTheDocument()
    expect(contenido.getByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument()
  })
})
