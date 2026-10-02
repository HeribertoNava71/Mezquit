import { useLayoutEffect, useRef, useState } from 'react'
import { Button, Callout, Card } from '@/components/ui'
import { IconoExito } from '@/components/ui/Iconos'
import { SITE } from '@/config/site'
import { IconoPalomitaFin } from './iconos'
import type { ResumenFin } from './useCandidateFlow'
import './FinEvaluacion.css'

export interface FinEvaluacionProps {
  /** Datos reales del examen terminado (useCandidateFlow). */
  resumen: ResumenFin
}

/**
 * Fin del examen (Strata.dc.html:1198-1228; mapa.md, CA-5). SuccessHero con
 * tarjetas reales: pruebas aplicadas, reactivos respondidos frente al total y
 * organización. Sin promesa de copia del reporte (D-16): el candidato no
 * recibe resultados. «Cerrar ventana» llama a window.close(); si el navegador
 * no deja cerrar la pestaña, lo dice en línea. «Conocer Strata» lleva a /.
 * Va dentro de PageLayout variant="candidate".
 */
export function FinEvaluacion({ resumen }: FinEvaluacionProps) {
  const titulo = useRef<HTMLHeadingElement>(null)
  const [noSeCerro, setNoSeCerro] = useState(false)
  const { pruebas, respondidos, total, organizacion } = resumen

  // Al llegar, el foco va al título (useLayoutEffect: en el mismo commit, antes de pintar).
  useLayoutEffect(() => {
    titulo.current?.focus()
  }, [])

  function cerrarVentana() {
    window.close()
    // Los navegadores solo dejan cerrar una pestaña que abrió un script (o con
    // un solo paso en el historial); si sigue abierta, se avisa en línea.
    if (!window.closed) setNoSeCerro(true)
  }

  const datos = [
    {
      etiqueta: pruebas.length === 1 ? 'Prueba aplicada' : 'Pruebas aplicadas',
      valor: pruebas.map((nombre, indice) => (
        <span key={`${indice}-${nombre}`} className="st-fin__linea">
          {nombre}
        </span>
      )),
    },
    { etiqueta: 'Reactivos respondidos', valor: `${respondidos} de ${total}` },
    { etiqueta: 'Enviado a', valor: organizacion },
  ]

  return (
    <div className="st-fin">
      <div className="st-fin__inner">
        <span className="st-fin__icono" aria-hidden="true">
          <IconoPalomitaFin />
        </span>
        <h1 ref={titulo} tabIndex={-1} className="st-fin__titulo">
          ¡Examen completado con éxito!
        </h1>
        <p className="st-fin__texto">
          Tus respuestas se enviaron a {organizacion}. La empresa se pondrá en contacto contigo.
        </p>

        <dl className="st-fin__resumen">
          {datos.map(({ etiqueta, valor }) => (
            <Card key={etiqueta} variant="glass" padding="sm" className="st-fin__dato">
              <dt className="st-fin__dato-etiqueta">{etiqueta}</dt>
              <dd className="st-fin__dato-valor">{valor}</dd>
            </Card>
          ))}
        </dl>

        <Callout tone="info" icon={<IconoExito />} className="st-fin__aviso">
          Tus respuestas quedaron registradas. No es necesario hacer nada más.
        </Callout>

        <div className="st-fin__acciones">
          <Button className="st-fin__cerrar-ventana" onClick={cerrarVentana}>
            Cerrar ventana
          </Button>
          <Button variant="secondary" className="st-fin__conocer" to="/">
            Conocer {SITE.name}
          </Button>
        </div>
        <p className="st-fin__cerrar" role="status">
          {noSeCerro ? 'Ya puedes cerrar esta pestaña.' : ''}
        </p>
      </div>
    </div>
  )
}

export default FinEvaluacion
