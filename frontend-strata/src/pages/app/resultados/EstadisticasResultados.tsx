import type { ReactNode, Ref } from 'react'
import { Link } from 'react-router-dom'
import { StatCard, VisuallyHidden, formatearNumero, type StatCardTone } from '@/components/ui'
import { IconoFlechaDerecha } from '@/components/ui/Iconos'
import type { EstadoResumen } from './useResultados'
import './EstadisticasResultados.css'

export interface EstadisticasResultadosProps {
  /** Resumen en carga o listo. Si falla, la página muestra EstadoError en lugar de las tarjetas. */
  estado: Extract<EstadoResumen, { fase: 'cargando' | 'listo' }>
  /** La página mueve aquí el foco cuando un «Reintentar» trae los datos. */
  ref?: Ref<HTMLUListElement>
}

interface Tarjeta {
  clave: string
  rotulo: string
  ayuda: string
  tono: StatCardTone
  valor: number | null
  /** Enlace del Resumen anterior que se conserva (regla 5). */
  enlace?: { to: string; texto: string }
}

/** Cifra lista: el número, o una raya con «Sin dato» si no llegó. La carga la pinta StatCard (loading). */
function Cifra({ valor }: { valor: number | null }): ReactNode {
  if (valor === null) {
    return (
      <>
        <span aria-hidden="true">—</span>
        <VisuallyHidden>Sin dato</VisuallyHidden>
      </>
    )
  }
  return formatearNumero(valor)
}

/**
 * StatCards de «Resultados» con el cuadro numérico del resumen del prototipo
 * (Strata.dc.html:696-705): créditos disponibles (GET /api/credits), evaluaciones
 * activas y candidatos completados (GET /api/assessments). Mientras carga, cada
 * cuadro late en lugar de la cifra y la lista queda con aria-busy.
 * Conserva «Ver créditos» y «Ver evaluaciones» del Resumen anterior.
 */
export function EstadisticasResultados({ estado, ref }: EstadisticasResultadosProps) {
  const cargando = estado.fase === 'cargando'
  const datos = estado.fase === 'listo' ? estado : null

  // Detalles breves en minúscula, como «listas para enviar» del prototipo (Strata.dc.html:1854-1857).
  // El enlace va en su propia línea bajo el detalle: en la esquina no cabía a 768 px.
  const tarjetas: Tarjeta[] = [
    {
      clave: 'creditos',
      rotulo: 'Créditos disponibles',
      ayuda: '1 crédito por candidato invitado',
      tono: 'navy',
      valor: datos ? datos.saldo : null,
      enlace: { to: '/app/creditos', texto: 'Ver créditos' },
    },
    {
      clave: 'activas',
      rotulo: 'Evaluaciones activas',
      ayuda: 'con candidatos sin terminar',
      tono: 'sky',
      valor: datos ? datos.evaluacionesActivas : null,
      enlace: { to: '/app/evaluaciones', texto: 'Ver evaluaciones' },
    },
    {
      clave: 'completados',
      rotulo: 'Candidatos completados',
      ayuda: 'con reporte listo para revisar',
      tono: 'neutral',
      valor: datos ? datos.candidatosCompletados : null,
    },
  ]

  return (
    <ul
      ref={ref}
      tabIndex={-1}
      className="st-resultados-stats"
      aria-label="Resumen"
      aria-busy={cargando || undefined}
    >
      {tarjetas.map((tarjeta, indice) => (
        <StatCard
          key={tarjeta.clave}
          as="li"
          layout="inline"
          tone={tarjeta.tono}
          staggerIndex={indice}
          className="st-resultados-stats__tarjeta"
          loading={cargando}
          value={<Cifra valor={tarjeta.valor} />}
          label={tarjeta.rotulo}
          help={
            <>
              {tarjeta.ayuda}
              {tarjeta.enlace && (
                <Link className="st-resultados-stats__enlace" to={tarjeta.enlace.to}>
                  {tarjeta.enlace.texto}
                  <IconoFlechaDerecha className="st-resultados-stats__flecha" />
                </Link>
              )}
            </>
          }
        />
      ))}
    </ul>
  )
}
