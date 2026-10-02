import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ENLACES_ADMIN, ENLACES_PUBLICOS, ENLACES_RH, type EnlaceNav } from './navegacion'
import { NavLinks } from './NavLinks'

function montar(ruta: string, enlaces: readonly EnlaceNav[], label = 'Panel de RR. HH.') {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <NavLinks label={label} enlaces={enlaces} />
    </MemoryRouter>,
  )
  return within(screen.getByRole('navigation', { name: label }))
}

/** Nombres de los enlaces marcados con aria-current="page". */
function activos(nav: ReturnType<typeof montar>) {
  return nav
    .getAllByRole('link')
    .filter((enlace: HTMLElement) => enlace.getAttribute('aria-current') === 'page')
    .map((enlace: HTMLElement) => enlace.textContent)
}

describe('NavLinks', () => {
  it('es una navegación con nombre y una lista de enlaces de barra', () => {
    const nav = montar('/app/creditos', ENLACES_RH)
    expect(nav.getAllByRole('listitem')).toHaveLength(4)
    const tests = nav.getByRole('link', { name: 'Tests' })
    expect(tests).toHaveAttribute('href', '/app/pruebas')
    expect(tests).toHaveClass('st-topbar__link')
    expect(screen.getByRole('navigation')).toHaveClass('st-nav-links')
  })

  it.each([
    ['/app', ['Resultados']],
    ['/app/candidatos/41/reporte', ['Resultados']],
    ['/app/creditos', ['Créditos']],
    ['/app/pruebas', ['Tests']],
    ['/app/evaluaciones', ['Candidatos']],
    ['/app/evaluaciones/nueva', ['Candidatos']],
    ['/app/evaluaciones/3/comparar', ['Candidatos']],
  ])('RR. HH. en %s: activo %j', (ruta, esperados) => {
    expect(activos(montar(ruta, ENLACES_RH))).toEqual(esperados)
  })

  it('Resultados (/app) no se marca en el resto del panel', () => {
    const nav = montar('/app/evaluaciones/3', ENLACES_RH)
    expect(nav.getByRole('link', { name: 'Resultados' })).not.toHaveAttribute('aria-current')
    expect(nav.getByRole('link', { name: 'Candidatos' })).toHaveAttribute('aria-current', 'page')
  })

  it('pública: Tests sigue activo en el detalle de una prueba', () => {
    expect(activos(montar('/pruebas/demo', ENLACES_PUBLICOS, 'Navegación principal'))).toEqual(['Tests'])
    expect(activos(montar('/', ENLACES_PUBLICOS, 'Inicio'))).toEqual([])
  })

  it('super admin: Usuarios activo en el detalle de un usuario; ninguno en el perfil', () => {
    expect(activos(montar('/admin/usuarios/5', ENLACES_ADMIN, 'Operación'))).toEqual(['Usuarios'])
    expect(activos(montar('/admin/perfil', ENLACES_ADMIN, 'Operación (perfil)'))).toEqual([])
  })
})
