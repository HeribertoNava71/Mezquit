// Galería del sistema de diseño STRATA (solo desarrollo, showcase.html).
// Muestra cada componente de src/components/ui con sus variantes y estados sobre
// el fondo STRATA con sus tres halos (Strata.dc.html:47-50), para compararlo con
// el prototipo. No entra al build de producción: vite build solo usa index.html.
//
// Parámetro ?abrir= para las capturas: modal-asignar, modal-invitacion, drawer o toast.
// El barril carga el CSS de los componentes; Showcase.css va después.
import { Tag } from '@/components/ui'
import './Showcase.css'
import { SeccionCodigos, SeccionEncabezados, SeccionEstadisticas, SeccionEtiquetas, SeccionTarjetas } from './galeria/Contenido'
import { SeccionBotones, SeccionCampos, SeccionFiltros, SeccionSeleccion } from './galeria/Controles'
import { SeccionAvisos, SeccionEstados, SeccionSuperposiciones, SeccionToasts } from './galeria/Retroalimentacion'
import { SeccionTablas } from './galeria/Tablas'

const INDICE = [
  { id: 'botones', texto: 'Botones' },
  { id: 'campos', texto: 'Campos' },
  { id: 'seleccion', texto: 'Opciones' },
  { id: 'filtros', texto: 'Filtros' },
  { id: 'tarjetas', texto: 'Tarjetas' },
  { id: 'estadisticas', texto: 'Estadísticas' },
  { id: 'tablas', texto: 'Tablas' },
  { id: 'etiquetas', texto: 'Badges y tags' },
  { id: 'encabezados', texto: 'Encabezados' },
  { id: 'codigos', texto: 'Códigos' },
  { id: 'toasts', texto: 'Toast' },
  { id: 'superposiciones', texto: 'Modal y drawer' },
  { id: 'avisos', texto: 'Callout' },
  { id: 'estados', texto: 'Estados' },
]

export function Galeria() {
  return (
    <div className="st-showcase">
      <div className="st-showcase__halos" aria-hidden="true">
        <span className="st-showcase__halo st-showcase__halo--coral" />
        <span className="st-showcase__halo st-showcase__halo--sky" />
        <span className="st-showcase__halo st-showcase__halo--navy" />
      </div>

      <main className="st-showcase__main">
        <header className="st-showcase__cabecera">
          <p className="st-showcase__eyebrow">
            Fase 1 · Sistema de diseño <Tag tone="neutral" size="sm" shape="square" mono>solo desarrollo</Tag>
          </p>
          <h1 className="st-showcase__titulo">Galería de componentes STRATA</h1>
          <p className="st-showcase__entradilla">
            Cada componente de src/components/ui con sus variantes y estados, sobre el fondo de tres halos. Las referencias
            Strata.dc.html:… señalan la parte del prototipo que reproduce cada muestra.
          </p>
          <nav aria-label="Secciones de la galería" className="st-showcase__indice">
            {INDICE.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="st-showcase__indice-enlace">
                {item.texto}
              </a>
            ))}
          </nav>
        </header>

        <SeccionBotones />
        <SeccionCampos />
        <SeccionSeleccion />
        <SeccionFiltros />
        <SeccionTarjetas />
        <SeccionEstadisticas />
        <SeccionTablas />
        <SeccionEtiquetas />
        <SeccionEncabezados />
        <SeccionCodigos />
        <SeccionToasts />
        <SeccionSuperposiciones />
        <SeccionAvisos />
        <SeccionEstados />
      </main>
    </div>
  )
}
