// Galería · tablas: candidatos (cómoda, con filtros y paginación), códigos
// (compacta, blanca y ordenable) y vacía. A 640 px o menos pasan a tarjetas (D-23).
import { useState } from 'react'
import {
  Avatar,
  Button,
  CopyField,
  DataTable,
  EstadoVacio,
  InvitationStatusBadge,
  SegmentedFilter,
  type DataTableColumn,
} from '@/components/ui'
import { IconoCandadoMuestra, Seccion } from './comunes'

interface Candidato {
  id: number
  nombre: string
  correo: string
  evaluacion: string
  estado: string
  fecha: string
  codigo: string
}

const CANDIDATOS: Candidato[] = [
  { id: 1, nombre: 'Valentina Ríos', correo: 'v.rios@correo.com', evaluacion: 'Liderazgo Situacional', estado: 'completada', fecha: '04 sep 2026', codigo: '8F2A-4471' },
  { id: 2, nombre: 'Andrés Molina', correo: 'a.molina@correo.com', evaluacion: 'Perfil Conductual DISC', estado: 'iniciada', fecha: '05 sep 2026', codigo: '3C9D-2210' },
  { id: 3, nombre: 'Camila Ferrer', correo: 'c.ferrer@correo.com', evaluacion: 'Inteligencia Emocional', estado: 'pendiente', fecha: '06 sep 2026', codigo: '77B1-9032' },
  { id: 4, nombre: 'Joaquín Herrera', correo: 'j.herrera@correo.com', evaluacion: 'Aptitud Cognitiva General', estado: 'completada', fecha: '02 sep 2026', codigo: '1D4E-6650' },
  { id: 5, nombre: 'Mateo Guzmán', correo: 'm.guzman@correo.com', evaluacion: 'Integridad Laboral', estado: 'expirada', fecha: '07 ago 2026', codigo: 'B913-5527' },
]

const COLUMNAS_CANDIDATOS: ReadonlyArray<DataTableColumn<Candidato>> = [
  {
    key: 'nombre',
    header: 'Candidato',
    rowHeader: true,
    render: (fila) => (
      <span className="st-showcase__persona">
        <Avatar name={fila.nombre} shape="square" tone="sky" size="md" />
        <span className="st-showcase__persona-texto">
          <span className="st-showcase__persona-nombre">{fila.nombre}</span>
          <span className="st-showcase__persona-correo">{fila.correo}</span>
        </span>
      </span>
    ),
  },
  { key: 'evaluacion', header: 'Examen asignado' },
  { key: 'estado', header: 'Estado', render: (fila) => <InvitationStatusBadge status={fila.estado} /> },
  { key: 'fecha', header: 'Fecha', render: (fila) => <span className="st-showcase__celda-terciaria">{fila.fecha}</span> },
  { key: 'codigo', header: 'Código usado', render: (fila) => <span className="st-showcase__celda-codigo">{fila.codigo}</span> },
  {
    key: 'accion',
    header: 'Acción',
    align: 'end',
    cardLabel: false,
    render: (fila) =>
      fila.estado === 'completada' ? (
        <Button size="sm" variant="highlight">
          Ver diagnóstico
        </Button>
      ) : (
        <Button size="sm" variant="secondary">
          {fila.estado === 'iniciada' ? 'Ver avance' : 'Reenviar código'}
        </Button>
      ),
  },
]

interface Codigo {
  codigo: string
  enlace: string
  prueba: string
  estado: string
  asignado: string
}

const CODIGOS: Codigo[] = [
  { codigo: '9B2X-88K1', enlace: 'strata.app/test/9B2X-88K1', prueba: 'Liderazgo Situacional', estado: 'pendiente', asignado: '—' },
  { codigo: '77B1-9032', enlace: 'strata.app/test/77B1-9032', prueba: 'Inteligencia Emocional', estado: 'iniciada', asignado: 'c.ferrer@correo.com' },
  { codigo: '8F2A-4471', enlace: 'strata.app/test/8F2A-4471', prueba: 'Liderazgo Situacional', estado: 'completada', asignado: 'v.rios@correo.com' },
  { codigo: 'B913-5527', enlace: 'strata.app/test/B913-5527', prueba: 'Integridad Laboral', estado: 'expirada', asignado: 'm.guzman@correo.com' },
]

const COLUMNAS_CODIGOS: ReadonlyArray<DataTableColumn<Codigo>> = [
  { key: 'codigo', header: 'Código único', sortable: true, rowHeader: true, render: (fila) => <CopyField variant="inline" value={fila.codigo} label="código" /> },
  {
    key: 'enlace',
    header: 'Enlace',
    render: (fila) => (
      <CopyField variant="link" value={`https://${fila.enlace}`} label="enlace">
        {fila.enlace}
      </CopyField>
    ),
  },
  { key: 'prueba', header: 'Test', sortable: true },
  { key: 'estado', header: 'Estado', sortable: true, render: (fila) => <InvitationStatusBadge status={fila.estado} /> },
  { key: 'asignado', header: 'Asignado a', hideOnCard: true, render: (fila) => <span className="st-showcase__celda-terciaria">{fila.asignado}</span> },
  {
    key: 'accion',
    header: 'Acción',
    align: 'end',
    cardLabel: false,
    render: (fila) => (
      <Button size="sm" variant="secondary">
        {fila.estado === 'completada' ? 'Ver reporte' : fila.estado === 'pendiente' ? 'Enviar' : 'Reenviar'}
      </Button>
    ),
  },
]

export function SeccionTablas() {
  const [filtro, setFiltro] = useState('todos')
  const visibles = filtro === 'todos' ? CANDIDATOS : CANDIDATOS.filter((fila) => fila.estado === filtro)
  return (
    <Seccion
      id="tablas"
      titulo="DataTable"
      nota="Candidatos (Strata.dc.html:809-868) e inventario (:708-768). Por debajo de 640 px cada fila es una tarjeta (D-23)."
    >
      <div className="st-showcase__ancho-completo">
        <DataTable
          caption="Candidatos de ejemplo"
          title="Todos los candidatos"
          subtitle="· actualizado hace 2 min"
          columns={COLUMNAS_CANDIDATOS}
          rows={visibles}
          getRowKey={(fila) => fila.id}
          toolbar={
            <SegmentedFilter
              aria-label="Filtrar por estado"
              size="sm"
              value={filtro}
              onChange={setFiltro}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'iniciada', label: 'Iniciada' },
                { value: 'completada', label: 'Completada' },
                { value: 'expirada', label: 'Expirada' },
              ]}
            />
          }
          footer={
            <>
              <span>
                Mostrando {visibles.length} de {CANDIDATOS.length} candidatos
              </span>
              <span className="st-showcase__paginacion">
                <Button size="sm" variant="secondary" disabled>
                  Anterior
                </Button>
                <Button size="sm" variant="secondary">
                  Siguiente
                </Button>
              </span>
            </>
          }
          empty={<EstadoVacio size="sm" role="status" title="Ningún candidato en este estado" description="Cambia el filtro para ver otros candidatos." />}
        />
      </div>
      <div className="st-showcase__ancho-completo">
        <DataTable
          caption="Códigos de ejemplo"
          title="Códigos emitidos"
          subtitle="· orden de ejemplo"
          titleLevel={3}
          variant="white"
          density="compact"
          defaultSort={{ key: 'codigo', direction: 'ascending' }}
          columns={COLUMNAS_CODIGOS}
          rows={CODIGOS}
          getRowKey={(fila) => fila.codigo}
          footer={
            <span className="st-showcase__nota-pie">
              <IconoCandadoMuestra /> Cada código sirve para una sola aplicación.
            </span>
          }
        />
      </div>
      <div className="st-showcase__ancho-completo">
        <DataTable
          caption="Tabla vacía de ejemplo"
          title="Solicitudes de créditos"
          titleLevel={3}
          columns={[
            { key: 'fecha', header: 'Fecha' },
            { key: 'creditos', header: 'Créditos' },
            { key: 'estado', header: 'Estado' },
          ]}
          rows={[]}
          getRowKey={(_, indice) => indice}
          minWidth={600}
          empty={<EstadoVacio size="sm" title="Aún no has pedido créditos" description="Cuando envíes una solicitud, aparecerá aquí con su estado." />}
        />
      </div>
    </Seccion>
  )
}
