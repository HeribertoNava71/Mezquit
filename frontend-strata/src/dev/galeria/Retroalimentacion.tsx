// Galería · retroalimentación: toasts, modal, drawer, avisos y los tres estados.
import { useEffect, useRef, useState } from 'react'
import {
  Button,
  Callout,
  Card,
  CodeDisplay,
  CopyField,
  Drawer,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Input,
  Modal,
  RadioCard,
  RadioGroup,
  Stepper,
  Tag,
  useToast,
} from '@/components/ui'
import { Fila, IconoCandadoMuestra, IconoCorreo, IconoListo, Muestra, Pila, Seccion } from './comunes'

/** Qué superposición abre la galería al cargar (?abrir=…), para las capturas. */
type Superposicion = 'modal-asignar' | 'modal-invitacion' | 'drawer' | null

function leerAbrir(): string | null {
  return new URLSearchParams(window.location.search).get('abrir')
}

function superposicionInicial(): Superposicion {
  const valor = leerAbrir()
  return valor === 'modal-asignar' || valor === 'modal-invitacion' || valor === 'drawer' ? valor : null
}

export function SeccionToasts() {
  const { toast } = useToast()
  const mostrados = useRef(false)

  // ?abrir=toast deja tres toasts fijos para la captura.
  useEffect(() => {
    if (mostrados.current || leerAbrir() !== 'toast') return
    mostrados.current = true
    toast({ message: 'Enlace de invitación copiado', duration: Infinity })
    toast({ message: 'Solicitud de créditos enviada', tone: 'success', duration: Infinity })
    toast({ message: 'No se pudo copiar: selecciona el enlace y cópialo a mano', tone: 'error', duration: Infinity })
  }, [toast])

  return (
    <Seccion id="toasts" titulo="Toast" nota="Strata.dc.html:1420-1425. Solo confirma acciones (D-22); se anuncia con aria-live.">
      <Muestra titulo="Disparar un toast">
        <Fila>
          <Button variant="secondary" onClick={() => toast({ message: 'Código 9B2X-88K1 copiado' })}>
            Info
          </Button>
          <Button variant="secondary" onClick={() => toast({ message: 'Invitación reenviada a c.ferrer@correo.com', tone: 'success' })}>
            Éxito
          </Button>
          <Button variant="secondary" onClick={() => toast({ message: 'No se pudo copiar el enlace', tone: 'error' })}>
            Error
          </Button>
        </Fila>
      </Muestra>
    </Seccion>
  )
}

export function SeccionSuperposiciones() {
  const [abierta, setAbierta] = useState<Superposicion>(superposicionInicial)
  const [correo, setCorreo] = useState('')
  const cerrar = () => setAbierta(null)

  return (
    <Seccion id="superposiciones" titulo="Modal y Drawer" nota="Modales «Asignar test por email» (Strata.dc.html:1376-1418) y «Enlace de invitación» (:1323-1374); drawer del resumen (:1247-1321).">
      <Muestra titulo="Abrir">
        <Fila>
          <Button variant="secondary" onClick={() => setAbierta('modal-asignar')}>
            Modal · asignar por email
          </Button>
          <Button onClick={() => setAbierta('modal-invitacion')}>
            Modal · enlace de invitación
          </Button>
          <Button variant="secondary" onClick={() => setAbierta('drawer')}>
            Drawer · resumen
          </Button>
        </Fila>
      </Muestra>

      <Modal
        open={abierta === 'modal-asignar'}
        onClose={cerrar}
        title="Asignar test por email"
        description="Strata envía el enlace de invitación al candidato."
        footerNote="Vence en 14 días si no se inicia."
        footer={
          <>
            <Button variant="neutral" onClick={cerrar}>
              Cancelar
            </Button>
            <Button onClick={cerrar}>Enviar invitación</Button>
          </>
        }
      >
        <Input label="Correo del candidato" type="email" placeholder="nombre@empresa.com" value={correo} onChange={(event) => setCorreo(event.target.value)} />
        <RadioGroup label="Test a aplicar" defaultValue="lid">
          <RadioCard value="lid" label="Liderazgo Situacional" aside="12 libres" />
          <RadioCard value="ie" label="Inteligencia Emocional" aside="5 libres" />
          <RadioCard value="cog" label="Aptitud Cognitiva General" aside="20 libres" />
        </RadioGroup>
        <RadioGroup label="Modo de envío" hideLabel indicator="none" orientation="horizontal" defaultValue="email">
          <RadioCard value="email" label="Invitación por email" description="Strata envía el enlace al candidato." />
          <RadioCard value="link" label="Enlace de invitación" description="Copias el enlace y lo compartes tú." />
        </RadioGroup>
      </Modal>

      <Modal
        open={abierta === 'modal-invitacion'}
        onClose={cerrar}
        size="lg"
        title="Enlace de invitación generado"
        description="Compártelo por el canal que prefieras."
        footerNote="Vence en 14 días si no se inicia."
        footer={
          <>
            <Button variant="neutral" onClick={cerrar}>
              Cerrar
            </Button>
            <Button onClick={cerrar}>Registrar en candidatos</Button>
          </>
        }
      >
        <CodeDisplay label="Código único cifrado" code="9B2X-88K1">
          <CopyField value="https://strata.app/test/9B2X-88K1" label="enlace de invitación">
            strata.app/test/9B2X-88K1
          </CopyField>
        </CodeDisplay>
        <RadioGroup label="Test vinculado" defaultValue="lid">
          <RadioCard value="lid" label="Liderazgo Situacional" aside="12 libres" />
          <RadioCard value="ie" label="Inteligencia Emocional" aside="5 libres" />
        </RadioGroup>
      </Modal>

      <Drawer
        open={abierta === 'drawer'}
        onClose={cerrar}
        title="Resumen de la solicitud"
        description="Los créditos se acreditan cuando se confirma el pago."
        footer={
          <Button fullWidth onClick={cerrar}>
            Enviar solicitud
          </Button>
        }
        footerNote={
          <>
            <IconoCandadoMuestra /> Un asesor revisa cada solicitud.
          </>
        }
      >
        <Pila separacion="sm">
          <Card variant="secondary" padding="sm" className="st-showcase__linea">
            <span className="st-showcase__linea-texto">
              <span className="st-showcase__texto-fuerte">Liderazgo Situacional</span>
              <span className="st-showcase__linea-codigo">LID-360 · 3 créditos</span>
            </span>
            <Stepper label="Créditos de Liderazgo Situacional" hideLabel size="sm" min={1} defaultValue={3} />
          </Card>
          <Card variant="secondary" padding="sm" className="st-showcase__linea">
            <span className="st-showcase__linea-texto">
              <span className="st-showcase__texto-fuerte">Inteligencia Emocional</span>
              <span className="st-showcase__linea-codigo">EQ-i 2.0 · 1 crédito</span>
            </span>
            <Stepper label="Créditos de Inteligencia Emocional" hideLabel size="sm" min={1} defaultValue={1} />
          </Card>
        </Pila>
        <RadioGroup label="Método de pago" defaultValue="spei">
          <RadioCard
            value="spei"
            label="Transferencia"
            description="Pago contra factura"
            aside={
              <Tag tone="sky" shape="square" size="xs" mono>
                SPEI
              </Tag>
            }
          />
          <RadioCard
            value="asesor"
            label="Con un asesor"
            description="Te contactamos para acordarlo"
            aside={
              <Tag tone="sky" shape="square" size="xs" mono>
                ASESOR
              </Tag>
            }
          />
        </RadioGroup>
        <Card variant="secondary" padding="sm">
          <dl className="st-showcase__totales">
            <div>
              <dt>Créditos</dt>
              <dd>4</dd>
            </div>
            <div className="st-showcase__totales-total">
              <dt>Total</dt>
              <dd>[PENDIENTE]</dd>
            </div>
          </dl>
        </Card>
      </Drawer>
    </Seccion>
  )
}

export function SeccionAvisos() {
  return (
    <Seccion
      id="avisos"
      titulo="Callout"
      nota="Aviso celeste del fin (Strata.dc.html:1217-1220), caja de interpretación (:946-953), banner tinta (:876-885) y pista compacta (:572-575). Errores inline con ícono y texto (D-22)."
    >
      <Muestra titulo="info">
        <Callout icon={<IconoCorreo />}>
          El código <strong className="st-showcase__mono">9B2X-88K1</strong> quedó consumido. No es necesario hacer nada más.
        </Callout>
      </Muestra>
      <Muestra titulo="success con título">
        <Callout tone="success" title="Solicitud enviada">
          Te avisaremos por correo cuando se acrediten los créditos.
        </Callout>
      </Muestra>
      <Muestra titulo="error con acciones">
        <Callout tone="error" title="No pudimos enviar la invitación" actions={<Button size="sm" variant="secondary">Reintentar</Button>}>
          Revisa el correo del candidato e inténtalo de nuevo.
        </Callout>
      </Muestra>
      <Muestra titulo="warning">
        <Callout tone="warning" title="Te quedan 2 créditos">
          Pide más antes de invitar a otro grupo de candidatos.
        </Callout>
      </Muestra>
      <Muestra titulo="neutral · interpretación">
        <Callout tone="neutral" icon={null} title="Comunicación · Muy alto">
          Da retroalimentación oportuna y directa, incluso en conversaciones incómodas. Es su recurso más fuerte para alinear expectativas.
        </Callout>
      </Muestra>
      <Muestra titulo="sm · pista del builder">
        <Callout size="sm" icon={null} actions={<span>Variables disponibles</span>}>
          <span className="st-showcase__mono">{'{{nombre}} · {{puntaje}} · {{dimension_alta}}'}</span>
        </Callout>
      </Muestra>
      <Muestra titulo="dark · banner" ancho="completo" fondo="ninguno">
        <Callout
          tone="dark"
          icon={<IconoListo />}
          title="Examen finalizado · Reporte generado"
          actions={<a href="#avisos">Volver al panel →</a>}
        >
          Valentina Ríos · Liderazgo Situacional · 09 sep 2026, 11:42
        </Callout>
      </Muestra>
    </Seccion>
  )
}

export function SeccionEstados() {
  const [reintentando, setReintentando] = useState(false)
  return (
    <Seccion id="estados" titulo="Estados de carga, vacío y error" nota="El prototipo solo diseña el carrito vacío (Strata.dc.html:1263-1268); carga y error usan la misma receta.">
      <Muestra titulo="EstadoCarga · inline">
        <EstadoCarga />
      </Muestra>
      <Muestra titulo="EstadoCarga · bloque de líneas">
        <EstadoCarga variant="bloque" count={4} label="Cargando candidatos…" />
      </Muestra>
      <Muestra titulo="EstadoCarga · bloque de tarjetas" ancho="completo" fondo="ninguno">
        <EstadoCarga variant="bloque" skeleton="tarjetas" count={3} label="Cargando pruebas…" />
      </Muestra>
      <Muestra titulo="EstadoVacio · sm (carrito vacío)" fondo="ninguno">
        <EstadoVacio size="sm" title="Aún no has añadido créditos" description="Elige un test del catálogo para continuar." />
      </Muestra>
      <Muestra titulo="EstadoVacio · md con acción" fondo="ninguno">
        <EstadoVacio
          title="Aún no tienes candidatos"
          description="Invita al primero con un enlace o por correo."
          actions={<Button>Invitar candidato</Button>}
        />
      </Muestra>
      <Muestra titulo="EstadoError · red con reintento" fondo="ninguno">
        <EstadoError
          kind="red"
          onRetry={() => {
            setReintentando(true)
            window.setTimeout(() => setReintentando(false), 1500)
          }}
          retrying={reintentando}
        />
      </Muestra>
      <Muestra titulo="EstadoError · permiso y servidor (sm)" fondo="ninguno">
        <Pila>
          <EstadoError kind="permiso" size="sm" actions={<Button size="sm" variant="ghost">Volver al inicio</Button>} />
          <EstadoError kind="servidor" size="sm" onRetry={() => undefined} />
        </Pila>
      </Muestra>
    </Seccion>
  )
}
