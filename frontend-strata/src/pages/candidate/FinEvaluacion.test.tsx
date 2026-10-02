import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SITE } from '@/config/site'
import { FinEvaluacion } from './FinEvaluacion'
import type { ResumenFin } from './useCandidateFlow'

const RESUMEN: ResumenFin = {
  pruebas: ['Prueba de demostración'],
  respondidos: 12,
  total: 12,
  organizacion: 'Comercializadora Río Claro',
}

function montar(resumen: ResumenFin = RESUMEN) {
  render(
    <MemoryRouter initialEntries={['/evaluar/abc']}>
      <Routes>
        <Route path="/evaluar/:token" element={<FinEvaluacion resumen={resumen} />} />
        <Route path="/" element={<h1>Inicio</h1>} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

describe('FinEvaluacion', () => {
  it('confirma con datos reales, sin prometer copia ni resultados (D-16)', () => {
    montar()
    expect(screen.getByRole('heading', { level: 1, name: '¡Examen completado con éxito!' })).toHaveFocus()
    expect(
      screen.getByText('Tus respuestas se enviaron a Comercializadora Río Claro. La empresa se pondrá en contacto contigo.'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual([
      'Prueba aplicada',
      'Reactivos respondidos',
      'Enviado a',
    ])
    expect(screen.getAllByRole('definition').map((d) => d.textContent)).toEqual([
      'Prueba de demostración',
      '12 de 12',
      'Comercializadora Río Claro',
    ])
    expect(screen.getByText('Tus respuestas quedaron registradas. No es necesario hacer nada más.')).toBeInTheDocument()
    expect(screen.queryByText(/copia|reporte|código|licencia/i)).not.toBeInTheDocument()
  })

  it('«Cerrar ventana» llama a window.close() y, si la pestaña sigue abierta, lo dice en línea', async () => {
    const cerrar = vi.spyOn(window, 'close').mockImplementation(() => {})
    const user = montar()
    const aviso = screen.getByRole('status')
    expect(aviso).toBeEmptyDOMElement()

    await user.click(screen.getByRole('button', { name: 'Cerrar ventana' }))
    expect(cerrar).toHaveBeenCalledTimes(1)
    expect(aviso).toHaveTextContent('Ya puedes cerrar esta pestaña.')
  })

  it('si el navegador cierra la pestaña, no muestra el aviso', async () => {
    // jsdom no implementa window.closed: se simula una pestaña que sí se cierra.
    let cerrada = false
    vi.spyOn(window, 'close').mockImplementation(() => {
      cerrada = true
    })
    Object.defineProperty(window, 'closed', { configurable: true, get: () => cerrada })
    try {
      const user = montar()
      await user.click(screen.getByRole('button', { name: 'Cerrar ventana' }))
      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    } finally {
      Reflect.deleteProperty(window, 'closed')
    }
  })

  it('«Conocer Strata» lleva al inicio', async () => {
    const user = montar()
    await user.click(screen.getByRole('link', { name: `Conocer ${SITE.name}` }))
    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  })

  it('con varias pruebas, las nombra todas', () => {
    montar({ ...RESUMEN, pruebas: ['Prueba de demostración', 'Estilos de trabajo'], respondidos: 32, total: 32 })
    expect(screen.getByText('Pruebas aplicadas')).toBeInTheDocument()
    expect(screen.getByText('Estilos de trabajo')).toBeInTheDocument()
    expect(screen.getByText('32 de 32')).toBeInTheDocument()
  })
})
