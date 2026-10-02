import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataTable, type DataTableColumn, type DataTableSort } from './DataTable'

interface Candidato {
  id: number
  nombre: string
  puntaje: number | null
  estado: string
}

const FILAS: Candidato[] = [
  { id: 1, nombre: 'Valentina Ríos', puntaje: 78, estado: 'completada' },
  { id: 2, nombre: 'Andrés Molina', puntaje: null, estado: 'iniciada' },
  { id: 3, nombre: 'Camila Ferrer', puntaje: 91, estado: 'pendiente' },
]

const COLUMNAS: DataTableColumn<Candidato>[] = [
  { key: 'nombre', header: 'Candidato', sortable: true, rowHeader: true },
  { key: 'puntaje', header: 'Puntaje', sortable: true, sortDescendingFirst: true, align: 'end' },
  { key: 'estado', header: 'Estado', hideOnCard: true },
  { key: 'acciones', header: 'Acción', cardLabel: false, render: (fila) => <button type="button">Ver {fila.nombre}</button> },
]

/** Nombres en el orden en que se ven las filas. */
function nombresEnOrden() {
  return screen
    .getAllByRole('rowheader')
    .map((celda) => celda.querySelector('.st-table__cell-value')?.textContent)
}

const encabezado = (nombre: string) => screen.getByRole('columnheader', { name: nombre })

describe('DataTable', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('variant elige la superficie con los nombres de Card (glass por defecto)', () => {
    const { container, rerender } = render(
      <DataTable columns={COLUMNAS} rows={FILAS} getRowKey={(fila) => fila.id} caption="Candidatos" />,
    )
    expect(container.firstElementChild).toHaveClass('st-table', 'st-table--glass')
    rerender(<DataTable variant="white" columns={COLUMNAS} rows={FILAS} getRowKey={(fila) => fila.id} caption="Candidatos" />)
    expect(container.firstElementChild).toHaveClass('st-table--white')
    expect(container.firstElementChild).not.toHaveClass('st-table--glass')
  })

  it('usa el caption oculto como nombre de la tabla y pinta título, barra y pie', () => {
    render(
      <DataTable
        columns={COLUMNAS}
        rows={FILAS}
        getRowKey={(fila) => fila.id}
        caption="Candidatos de la evaluación"
        title="Todos los candidatos"
        subtitle="· actualizado hace 2 min"
        toolbar={<button type="button">Filtrar</button>}
        footer={<span>Mostrando 3 de 3 candidatos</span>}
      />,
    )
    const tabla = screen.getByRole('table', { name: 'Candidatos de la evaluación' })
    expect(tabla.querySelector('caption')).toHaveClass('st-table__caption')
    expect(screen.getByRole('heading', { level: 2, name: 'Todos los candidatos' })).toBeInTheDocument()
    expect(screen.getByText('· actualizado hace 2 min')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtrar' })).toBeInTheDocument()
    expect(screen.getByText('Mostrando 3 de 3 candidatos')).toBeInTheDocument()
    expect(within(tabla).getAllByRole('row')).toHaveLength(4)
  })

  it('ordena sin control: el primer clic asciende, el segundo desciende y aria-sort lo refleja', async () => {
    const user = userEvent.setup()
    render(<DataTable columns={COLUMNAS} rows={FILAS} getRowKey={(fila) => fila.id} caption="Candidatos" />)

    expect(nombresEnOrden()).toEqual(['Valentina Ríos', 'Andrés Molina', 'Camila Ferrer'])
    expect(encabezado('Candidato')).not.toHaveAttribute('aria-sort')

    await user.click(screen.getByRole('button', { name: 'Candidato' }))
    expect(encabezado('Candidato')).toHaveAttribute('aria-sort', 'ascending')
    expect(encabezado('Puntaje')).not.toHaveAttribute('aria-sort')
    expect(nombresEnOrden()).toEqual(['Andrés Molina', 'Camila Ferrer', 'Valentina Ríos'])
    expect(screen.getByRole('status')).toHaveTextContent('Ordenado por Candidato, en orden ascendente.')

    await user.click(screen.getByRole('button', { name: 'Candidato' }))
    expect(encabezado('Candidato')).toHaveAttribute('aria-sort', 'descending')
    expect(nombresEnOrden()).toEqual(['Valentina Ríos', 'Camila Ferrer', 'Andrés Molina'])
  })

  it('ordena con el teclado y deja los valores vacíos al final en los dos sentidos', async () => {
    const user = userEvent.setup()
    render(<DataTable columns={COLUMNAS} rows={FILAS} getRowKey={(fila) => fila.id} caption="Candidatos" />)

    screen.getByRole('button', { name: 'Puntaje' }).focus()
    await user.keyboard('{Enter}')
    // sortDescendingFirst: el primer orden es de mayor a menor.
    expect(encabezado('Puntaje')).toHaveAttribute('aria-sort', 'descending')
    expect(nombresEnOrden()).toEqual(['Camila Ferrer', 'Valentina Ríos', 'Andrés Molina'])

    await user.keyboard(' ')
    expect(encabezado('Puntaje')).toHaveAttribute('aria-sort', 'ascending')
    expect(nombresEnOrden()).toEqual(['Valentina Ríos', 'Camila Ferrer', 'Andrés Molina'])
  })

  it('en modo controlado avisa con onSortChange y muestra el orden que recibe', async () => {
    const user = userEvent.setup()
    const alCambiar = vi.fn()

    function Controlada() {
      const [orden, setOrden] = useState<DataTableSort | null>({ key: 'puntaje', direction: 'ascending' })
      return (
        <DataTable
          columns={COLUMNAS}
          rows={FILAS}
          getRowKey={(fila) => fila.id}
          caption="Candidatos"
          sort={orden}
          onSortChange={(siguiente) => {
            alCambiar(siguiente)
            setOrden(siguiente)
          }}
        />
      )
    }

    render(<Controlada />)
    expect(encabezado('Puntaje')).toHaveAttribute('aria-sort', 'ascending')
    expect(nombresEnOrden()).toEqual(['Valentina Ríos', 'Camila Ferrer', 'Andrés Molina'])

    await user.click(screen.getByRole('button', { name: 'Puntaje' }))
    expect(alCambiar).toHaveBeenCalledWith({ key: 'puntaje', direction: 'descending' })
    expect(encabezado('Puntaje')).toHaveAttribute('aria-sort', 'descending')
  })

  it('si el padre no actualiza el orden controlado, la tabla no cambia', async () => {
    const user = userEvent.setup()
    const alCambiar = vi.fn()
    render(
      <DataTable
        columns={COLUMNAS}
        rows={FILAS}
        getRowKey={(fila) => fila.id}
        caption="Candidatos"
        sort={null}
        onSortChange={alCambiar}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Candidato' }))
    expect(alCambiar).toHaveBeenCalledWith({ key: 'nombre', direction: 'ascending' })
    expect(encabezado('Candidato')).not.toHaveAttribute('aria-sort')
    expect(nombresEnOrden()).toEqual(['Valentina Ríos', 'Andrés Molina', 'Camila Ferrer'])
  })

  it('con manualSort solo marca el encabezado y respeta el orden de las filas', () => {
    render(
      <DataTable
        columns={COLUMNAS}
        rows={FILAS}
        getRowKey={(fila) => fila.id}
        caption="Candidatos"
        sort={{ key: 'nombre', direction: 'ascending' }}
        manualSort
      />,
    )
    expect(encabezado('Candidato')).toHaveAttribute('aria-sort', 'ascending')
    expect(nombresEnOrden()).toEqual(['Valentina Ríos', 'Andrés Molina', 'Camila Ferrer'])
  })

  it('muestra el estado vacío por defecto o el que recibe', () => {
    const { rerender } = render(<DataTable columns={COLUMNAS} rows={[]} getRowKey={(fila) => fila.id} caption="Candidatos" />)
    const vacia = screen.getByRole('cell', { name: 'No hay registros para mostrar.' })
    expect(vacia).toHaveAttribute('colspan', String(COLUMNAS.length))
    // Sin filas, el modo tarjeta saca de la vista las pastillas de orden.
    expect(screen.getByRole('table').closest('.st-table')).toHaveClass('st-table--empty')

    rerender(
      <DataTable
        columns={COLUMNAS}
        rows={[]}
        getRowKey={(fila) => fila.id}
        caption="Candidatos"
        empty={<p>Aún no invitas a nadie.</p>}
      />,
    )
    expect(screen.getByText('Aún no invitas a nadie.')).toBeInTheDocument()
    expect(screen.queryByText('No hay registros para mostrar.')).not.toBeInTheDocument()
  })

  it('modo tarjeta: cada celda lleva su rótulo oculto a lectores, salvo cardLabel false, y marca hideOnCard', () => {
    render(<DataTable columns={COLUMNAS} rows={FILAS} getRowKey={(fila) => fila.id} caption="Candidatos" />)
    const tabla = screen.getByRole('table', { name: 'Candidatos' })
    expect(tabla.closest('.st-table')).toHaveClass('st-table--cards')

    const [primera] = within(tabla).getAllByRole('row').slice(1)
    const rotulos = Array.from(primera.querySelectorAll('.st-table__cell-label')).map((rotulo) => rotulo.textContent)
    expect(rotulos).toEqual(['Candidato', 'Puntaje', 'Estado'])
    primera.querySelectorAll('.st-table__cell-label').forEach((rotulo) => {
      expect(rotulo).toHaveAttribute('aria-hidden', 'true')
    })

    // El rótulo no ensucia el nombre accesible de la celda.
    expect(within(primera).getByRole('rowheader', { name: 'Valentina Ríos' })).toHaveAttribute('scope', 'row')
    expect(within(primera).getByRole('cell', { name: '78' })).toHaveClass('st-table__align-end')
    expect(within(primera).getByRole('cell', { name: 'completada' })).toHaveClass('st-table__cell--hide-on-card')
    expect(within(primera).getByRole('button', { name: 'Ver Valentina Ríos' }).closest('td')).toHaveClass(
      'st-table__cell--no-label',
    )
  })

  it('a 640 px o menos marca el modo tarjeta (st-table--tarjetas)', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((consulta: string) => ({
        matches: consulta === '(max-width: 640px)',
        media: consulta,
        addEventListener: () => {},
        removeEventListener: () => {},
      })),
    )
    render(<DataTable columns={COLUMNAS} rows={FILAS} getRowKey={(fila) => fila.id} caption="Candidatos" />)
    expect(screen.getByRole('table', { name: 'Candidatos' }).closest('.st-table')).toHaveClass('st-table--tarjetas')
  })

  it('más ancho, pasa a tarjetas si la tabla no cabe y vuelve cuando el contenedor alcanza su ancho (Fase 8)', () => {
    // ResizeObserver falso: guarda el callback para dispararlo a mano.
    let medir: (() => void) | null = null
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          medir = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    const medidas = { scrollWidth: 760, clientWidth: 601 }
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('st-table__scroll') ? medidas.scrollWidth : 0
    })
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('st-table__scroll') ? medidas.clientWidth : 0
    })

    render(<DataTable columns={COLUMNAS} rows={FILAS} getRowKey={(fila) => fila.id} caption="Candidatos" minWidth={0} />)
    const raiz = screen.getByRole('table', { name: 'Candidatos' }).closest('.st-table')
    expect(raiz).not.toHaveClass('st-table--tarjetas')

    act(() => medir?.())
    expect(raiz).toHaveClass('st-table--tarjetas')

    // En tarjetas no desborda; con 700 px aún no cabe la tabla (pide 760).
    Object.assign(medidas, { scrollWidth: 700, clientWidth: 700 })
    act(() => medir?.())
    expect(raiz).toHaveClass('st-table--tarjetas')

    Object.assign(medidas, { scrollWidth: 800, clientWidth: 800 })
    act(() => medir?.())
    expect(raiz).not.toHaveClass('st-table--tarjetas')
  })

  it('con responsive="scroll" no pasa a tarjetas y acepta un ancho mínimo propio', () => {
    render(
      <DataTable
        columns={COLUMNAS}
        rows={FILAS}
        getRowKey={(fila) => fila.id}
        caption="Comparativa"
        responsive="scroll"
        minWidth={640}
      />,
    )
    const tabla = screen.getByRole('table', { name: 'Comparativa' })
    expect(tabla.closest('.st-table')).toHaveClass('st-table--scroll')
    expect(tabla.closest('.st-table')).not.toHaveClass('st-table--cards')
    expect(tabla.closest('.st-table')).not.toHaveClass('st-table--tarjetas')
    expect(tabla.style.getPropertyValue('--st-table-min')).toBe('640px')
  })

  it('aplica la densidad compacta', () => {
    render(
      <DataTable columns={COLUMNAS} rows={FILAS} getRowKey={(fila) => fila.id} caption="Candidatos" density="compact" />,
    )
    expect(screen.getByRole('table').closest('.st-table')).toHaveClass('st-table--compact')
  })

  it('escalona la entrada de las filas cada 28 ms con el índice --i', () => {
    render(<DataTable columns={COLUMNAS} rows={FILAS} getRowKey={(fila) => fila.id} caption="Candidatos" />)
    const filas = screen.getAllByRole('row').slice(1)
    filas.forEach((fila, indice) => {
      expect(fila).toHaveClass('st-table__row--enter')
      expect(fila.style.getPropertyValue('--i')).toBe(String(indice))
    })
  })

  it('no anima las filas con movimiento reducido', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })),
    )
    render(<DataTable columns={COLUMNAS} rows={FILAS} getRowKey={(fila) => fila.id} caption="Candidatos" />)
    screen
      .getAllByRole('row')
      .slice(1)
      .forEach((fila) => {
        expect(fila).not.toHaveClass('st-table__row--enter')
        expect(fila.style.getPropertyValue('--i')).toBe('')
      })
  })
})
