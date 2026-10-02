import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SITE } from '@/config/site'
import AyudaPage from './AyudaPage'

// SITE.email se puede cambiar por prueba: la página lo lee al dibujarse.
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

function montar() {
  return render(
    <MemoryRouter>
      <AyudaPage />
    </MemoryRouter>,
  )
}

const grupo = (nombre: string) => screen.getByRole('region', { name: nombre })

beforeEach(() => {
  sitio.email = '[PENDIENTE: correo de contacto]'
})

describe('AyudaPage', () => {
  it('encabezado con la marca de SITE.name', () => {
    montar()
    expect(screen.getByRole('heading', { level: 1, name: 'Ayuda' })).toBeInTheDocument()
    expect(screen.getByText(`Encuentra respuestas según cómo usas ${SITE.name}.`)).toBeInTheDocument()
  })

  it('«Soy candidato»: sus tres preguntas y el acceso a /evaluar', () => {
    montar()
    const candidato = grupo('Soy candidato')
    expect(candidato).toHaveClass('st-card', 'st-card--glass')
    expect(within(candidato).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'No me llegó el enlace de la evaluación',
      'Se me cerró la prueba a la mitad',
      'Me pide datos que no quiero dar',
    ])
    expect(candidato).toHaveTextContent('Vuelve a abrir el mismo enlace: tus respuestas se guardan y continúas donde ibas.')
    expect(
      within(candidato).getByRole('link', { name: '¿Te invitaron a una evaluación? Accede aquí' }),
    ).toHaveAttribute('href', '/evaluar')
  })

  it('«Soy empresa»: sus tres preguntas; sin correo real, el marcador pendiente y ningún mailto', () => {
    montar()
    const empresa = grupo('Soy empresa')
    expect(within(empresa).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      '¿Cómo invito candidatos?',
      '¿Cómo leo el reporte?',
      '¿Cómo funciona la facturación?',
    ])
    expect(within(empresa).getByText('[PENDIENTE: correo de contacto]')).toHaveClass('st-pendiente')
    expect(within(empresa).queryByRole('link')).not.toBeInTheDocument()
  })

  it('con correo real: «Escríbenos» abre un mailto a SITE.email', () => {
    sitio.email = 'soporte@strata.mx'
    montar()
    const enlace = within(grupo('Soy empresa')).getByRole('link', { name: 'Escríbenos: soporte@strata.mx' })
    expect(enlace).toHaveAttribute('href', 'mailto:soporte@strata.mx')
  })
})
