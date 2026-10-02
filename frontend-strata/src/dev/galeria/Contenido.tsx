// Galería · contenido: tarjetas, estadísticas, barras, badges, tags, encabezados y códigos.
import { useState } from 'react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CodeDisplay,
  CopyField,
  DotSeparator,
  Fecha,
  InvitationStatusBadge,
  INVITATION_STATUSES,
  LiveDot,
  PageHeader,
  Persona,
  ProgressBar,
  StatCard,
  StepPills,
  Tag,
} from '@/components/ui'
import { Fila, IconoCarrito, IconoPalomitaMuestra, Muestra, Pila, Seccion } from './comunes'

const SALDOS = [
  { nombre: 'Liderazgo Situacional', codigo: 'LID-360', libres: 12, total: 30 },
  { nombre: 'Inteligencia Emocional', codigo: 'EQ-i 2.0', libres: 5, total: 23 },
  { nombre: 'Aptitud Cognitiva General', codigo: 'ACG-4', libres: 20, total: 38 },
  { nombre: 'Perfil Conductual DISC', codigo: 'DISC-C', libres: 3, total: 21 },
]

const RESUMEN = [
  { label: 'Disponibles', help: 'listos para enviar', n: 2, tone: 'navy' },
  { label: 'Enviadas', help: 'esperando al candidato', n: 2, tone: 'sky' },
  { label: 'En uso', help: 'examen en curso', n: 1, tone: 'sky-soft' },
  { label: 'Consumidas', help: 'reporte generado', n: 2, tone: 'neutral' },
] as const

export function SeccionTarjetas() {
  return (
    <Seccion
      id="tarjetas"
      titulo="Tarjetas"
      nota="Vidrio (Strata.dc.html:630, 708), secundaria (:1270), blanca fría y cálida (:888, :1011), tinta (:419), punteada (:509) y paso translúcido (:273)."
    >
      <Card hover="outline" staggerIndex={0}>
        <p className="st-showcase__texto-fuerte">Vidrio · hover outline</p>
        <p className="st-showcase__texto">Fondo blanco al 72 %, blur de 14 px, radio 24 y sombra suave.</p>
      </Card>
      <Card hover="lift" staggerIndex={1}>
        <p className="st-showcase__texto-fuerte">Vidrio · hover lift</p>
        <p className="st-showcase__texto">Sube 5 px y gana sombra al pasar el puntero.</p>
      </Card>
      <Card variant="secondary" padding="sm" staggerIndex={2}>
        <p className="st-showcase__texto-fuerte">Secundaria · padding sm</p>
        <p className="st-showcase__texto">Blanco al 85 %, borde #EFE9DF y radio 18.</p>
      </Card>
      <Card variant="white">
        <p className="st-showcase__texto-fuerte">Blanca · borde frío</p>
        <p className="st-showcase__texto">Reporte y pregunta del examen.</p>
      </Card>
      <Card variant="white" borderTone="warm" padding="lg">
        <p className="st-showcase__texto-fuerte">Blanca · borde cálido · padding lg</p>
        <p className="st-showcase__texto">Tarjeta del acceso del candidato.</p>
      </Card>
      <Card variant="dark">
        <p className="st-showcase__eyebrow-oscuro">Vista previa en catálogo</p>
        <p className="st-showcase__texto-claro">Tinta #0F172A con radio 18.</p>
      </Card>
      <Card variant="dashed">
        <p className="st-showcase__eyebrow-neutro">Vista previa del candidato</p>
        <p className="st-showcase__texto">Punteada #D6CFC2 sobre #FAF8F5.</p>
      </Card>
      <Card variant="step" hover="lift">
        <p className="st-showcase__texto-fuerte">Paso translúcido</p>
        <p className="st-showcase__texto">Blanco al 66 %, radio 22 y sin blur.</p>
      </Card>
      <Card padding="none">
        <div className="st-showcase__barra-tarjeta">
          <p className="st-showcase__texto-fuerte">Vidrio · padding none</p>
        </div>
        <p className="st-showcase__texto st-showcase__texto--relleno">Contenedor de tabla o lista; recorta su contenido.</p>
      </Card>
    </Seccion>
  )
}

export function SeccionEstadisticas() {
  return (
    <Seccion
      id="estadisticas"
      titulo="StatCard y barras"
      nota="Saldo (Strata.dc.html:790-807), resumen con cuadro numérico (:696-706) y barras de demo, saldo, reporte, examen y simulador (:177, :801, :940, :1159, :584)."
    >
      <div className="st-showcase__rejilla-saldos">
        {SALDOS.map((saldo) => (
          <StatCard
            key={saldo.codigo}
            label={saldo.nombre}
            meta={
              <Tag tone="sky" shape="square" size="xs" mono>
                {saldo.codigo}
              </Tag>
            }
            value={saldo.libres}
            unit={`de ${saldo.total} libres`}
            progress={{ value: saldo.libres, max: saldo.total, label: `Créditos libres de ${saldo.nombre}`, valueText: `${saldo.libres} de ${saldo.total}` }}
            help={`${saldo.total - saldo.libres} aplicadas este mes`}
          />
        ))}
      </div>
      <div className="st-showcase__rejilla-resumen">
        {RESUMEN.map((r) => (
          <StatCard key={r.label} layout="inline" tone={r.tone} value={r.n} label={r.label} help={r.help} />
        ))}
      </div>
      <Muestra titulo="StatCard · en carga (loading, Fase 4)">
        <Pila separacion="sm">
          <StatCard label="Completadas" value={9} unit="de 20 invitados" progress={{ value: 9, max: 20 }} help="con reporte listo para revisar" loading />
          <StatCard layout="inline" tone="navy" label="Disponibles" value={37} help="para invitar candidatos" loading />
        </Pila>
      </Muestra>
      <Muestra titulo="StatCard · cifra Satoshi (heading) y mono, sin barra">
        <Pila separacion="sm">
          <StatCard label="Índice global" value={76} valueFont="heading" unit="de 100" help="Cifra de marca en Satoshi" />
          <StatCard label="Puntaje de prueba" value={76} valueFont="mono" unit="de 100" help="Índice global" />
        </Pila>
      </Muestra>
      <Muestra titulo="ProgressBar · tamaños y tonos">
        <Pila separacion="sm">
          <ProgressBar value={18} size={5} label="Avance de la demo" />
          <ProgressBar value={40} tone="sky-strong" track="divider" size={6} label="Saldo" />
          <ProgressBar value={85} tone="navy" size={8} label="Comunicación" />
          <ProgressBar value={72} tone="sky-strong" size={8} label="Toma de decisiones" />
          <ProgressBar value={64} tone="sky" size={8} label="Adaptabilidad" />
          <ProgressBar value={30} tone="neutral" size={8} label="Sin dato" />
          <ProgressBar value={50} size={4} track="divider" flush label="Avance del examen" />
        </Pila>
      </Muestra>
      <Muestra titulo="ProgressBar · sobre oscuro" fondo="oscuro">
        <ProgressBar value={76} size={7} track="on-dark" label="Puntaje del simulador" />
      </Muestra>
    </Seccion>
  )
}

export function SeccionEtiquetas() {
  return (
    <Seccion
      id="etiquetas"
      titulo="Badges, tags, puntos y avatares"
      nota="Badges de estado (Strata.dc.html:751-753, 1831-1836, 1866-1870), tags (:240, :266, :460-462, :638, :795, :1015), puntos (:67, :130, :1155), separadores (:247, :1023) y avatares (:69, :838, :1001)."
    >
      <Muestra titulo="InvitationStatusBadge · los cuatro estados">
        <Fila>
          {INVITATION_STATUSES.map((estado) => (
            <InvitationStatusBadge key={estado} status={estado} />
          ))}
          <InvitationStatusBadge status="archivada" />
        </Fila>
      </Muestra>
      <Muestra titulo="Badge · tonos (md)">
        <Fila>
          <Badge tone="navy">Disponible</Badge>
          <Badge tone="sky">Enviada</Badge>
          <Badge tone="coral">Expirada</Badge>
          <Badge tone="neutral">Consumida</Badge>
          <Badge tone="slate">Ajuste</Badge>
          <Badge tone="success">Aprobada</Badge>
          <Badge tone="error">Rechazada</Badge>
          <Badge tone="warning">En revisión</Badge>
        </Fila>
      </Muestra>
      <Muestra titulo="Badge · sm">
        <Fila>
          <Badge size="sm">Borrador · v0.4</Badge>
          <Badge size="sm" tone="navy">
            Publicado
          </Badge>
          <Badge size="sm" tone="sky">
            En proceso
          </Badge>
        </Fila>
      </Muestra>
      <Muestra titulo="Tag · tonos con punto">
        <Fila>
          <Tag dot>Ideal para jóvenes y profesionales</Tag>
          <Tag tone="coral" dot>
            Autoconocimiento
          </Tag>
          <Tag tone="navy" dot>
            Empresas &amp; Equipos
          </Tag>
          <Tag tone="neutral" dot>
            Neutro
          </Tag>
        </Fila>
      </Muestra>
      <Muestra titulo="Tag · pastillas especiales">
        <Fila>
          <Tag tone="surface" size="lg" live>
            Sin registro · Tu informe llega a tu correo
          </Tag>
          <Tag tone="coral" size="xl" bordered icon={<IconoPalomitaMuestra />}>
            Sin crear cuenta. Cero fricción.
          </Tag>
          <Tag tone="outline" size="sm" dot>
            12 en saldo
          </Tag>
        </Fila>
      </Muestra>
      <Muestra titulo="Tag · cuadradas y mono">
        <Fila>
          <Tag tone="neutral" shape="square" size="sm">
            Escala Likert (1-5)
          </Tag>
          <Tag tone="sky" shape="square" size="sm">
            Comunicación
          </Tag>
          <Tag tone="navy" shape="square" size="sm" mono>
            ×1.2
          </Tag>
          <Tag tone="sky" shape="square" size="sm" mono>
            ITEM-1
          </Tag>
          <Tag tone="sky" shape="square" size="xs" mono>
            LID-360
          </Tag>
        </Fila>
      </Muestra>
      <Muestra titulo="Tag · insignia verificada sobre tinta" fondo="oscuro">
        <Tag tone="success-on-dark" size="lg" dot>
          Invitación verificada
        </Tag>
      </Muestra>
      <Muestra titulo="LiveDot · tonos, tamaños y pulsos">
        <Fila>
          <LiveDot />
          <LiveDot tone="sky-strong" size={6} pulse="blink" />
          <LiveDot tone="navy" size={6} pulse="none" />
          <LiveDot tone="success" size={6} tempo="slow" />
          <LiveDot tone="neutral" size={5} pulse="none" />
          <LiveDot tone="coral" size={5} pulse="none" />
          <span className="st-showcase__texto-inline">
            <LiveDot tone="sky-strong" size={6} pulse="blink" /> Guardado automático
          </span>
        </Fila>
      </Muestra>
      <Muestra titulo="DotSeparator">
        <Fila>
          <span className="st-showcase__meta">
            15 min <DotSeparator /> 48 reactivos
          </span>
          <span className="st-showcase__meta">
            Aviso de privacidad <DotSeparator tone="soft" /> Soporte
          </span>
        </Fila>
      </Muestra>
      <Muestra titulo="DotSeparator · sobre oscuro" fondo="oscuro">
        <span className="st-showcase__meta st-showcase__meta--oscura">
          68 reactivos <DotSeparator tone="on-dark" /> Escala Likert 1–5
        </span>
      </Muestra>
      <Muestra titulo="Avatar">
        <Fila>
          <Avatar name="María Rodríguez" />
          <Avatar name="Luis Ordóñez" tone="navy" />
          <Avatar name="Valentina Ríos" shape="square" tone="sky" size="md" />
          <Avatar name="Acme Talento" initials="A" shape="square" />
          <Avatar name="Joaquín Herrera" size="md" decorative={false} />
        </Fila>
      </Muestra>
      <Muestra titulo="Persona · celda «Candidato» (Fase 4)">
        <Pila separacion="sm">
          <Persona name="Valentina Ríos" detail="v.rios@correo.com" />
          <Persona name="Joaquín Herrera" />
        </Pila>
      </Muestra>
      <Muestra titulo="Fecha · formato «04 sep 2026» (Fase 4)">
        <Fila>
          <Fecha valor="2026-09-04" />
          <Fecha valor="2026-09-27 11:42" conHora />
          <Fecha valor={null} vacio="Sin fecha límite" />
          <Fecha valor={null} />
        </Fila>
      </Muestra>
    </Seccion>
  )
}

const PASOS = ['Datos generales', 'Diseñador de reactivos', 'Algoritmo de diagnóstico']

export function SeccionEncabezados() {
  const [paso, setPaso] = useState(1)
  return (
    <Seccion
      id="encabezados"
      titulo="PageHeader y StepPills"
      nota="Encabezados de página (Strata.dc.html:606-618, 684-694, 333-349) y pasos del builder (:351-358, :1896-1904)."
    >
      <Muestra titulo="PageHeader · eyebrow, H1, entradilla y acciones" ancho="completo" fondo="ninguno">
        <PageHeader
          level={2}
          eyebrow="Paso 1 de 3 · Adquirir créditos"
          title="Catálogo de tests psicométricos"
          lede="Instrumentos para evaluar a tus candidatos. Cada crédito habilita una aplicación individual."
          actions={
            <Button variant="secondary" iconLeft={<IconoCarrito />}>
              Carrito · 0
            </Button>
          }
        />
      </Muestra>
      <Muestra titulo="PageHeader · con pastilla de estado" ancho="completo" fondo="ninguno">
        <PageHeader
          level={2}
          eyebrow="Test Builder"
          status={<Badge size="sm">Borrador · v0.4</Badge>}
          title="Liderazgo Situacional 360"
          lede="Última edición hace 12 min · 68 reactivos · 6 dimensiones"
          actions={
            <>
              <Button variant="secondary">Guardar borrador</Button>
              <Button>Publicar al catálogo</Button>
            </>
          }
        />
      </Muestra>
      <Muestra titulo="StepPills · seleccionables" ancho="completo" fondo="ninguno">
        <StepPills steps={PASOS} current={paso} onStepSelect={setPaso} aria-label="Pasos del constructor" />
      </Muestra>
      <Muestra titulo="StepPills · primer paso y último con hechos" fondo="ninguno">
        <Pila separacion="sm">
          <StepPills steps={PASOS} current={0} aria-label="Pasos (primero)" />
          <StepPills steps={PASOS} current={2} aria-label="Pasos (último)" />
        </Pila>
      </Muestra>
    </Seccion>
  )
}

export function SeccionCodigos() {
  return (
    <Seccion
      id="codigos"
      titulo="CopyField y CodeDisplay"
      nota="Tarjeta del código y fila copiable (Strata.dc.html:1333-1340), código y enlace en tabla (:737-746)."
    >
      <Muestra titulo="CodeDisplay con CopyField field">
        <CodeDisplay label="Código único cifrado" code="9B2X-88K1">
          <CopyField value="https://strata.app/test/9B2X-88K1" label="enlace de invitación">
            strata.app/test/9B2X-88K1
          </CopyField>
        </CodeDisplay>
      </Muestra>
      <Muestra titulo="CodeDisplay sin código (token largo, PB-11)">
        <CodeDisplay label="Enlace de invitación" align="start">
          <CopyField value="https://strata.app/invitacion/4f9c2a7e1b0d43c88a5e6f71b2c9d0e3a4b5c6d7" label="enlace de invitación">
            strata.app/invitacion/4f9c2a7e1b0d43c88a5e6f71b2c9d0e3a4b5c6d7
          </CopyField>
        </CodeDisplay>
      </Muestra>
      <Muestra titulo="CopyField · field claro">
        <CopyField value="https://strata.app/test/4KQ7-31M9" label="enlace" tone="light">
          strata.app/test/4KQ7-31M9
        </CopyField>
      </Muestra>
      <Muestra titulo="CopyField · inline y link (claros)">
        <Pila separacion="sm">
          <CopyField variant="inline" value="9B2X-88K1" label="código" />
          <CopyField variant="link" value="https://strata.app/test/9B2X-88K1" label="enlace">
            strata.app/test/9B2X-88K1
          </CopyField>
        </Pila>
      </Muestra>
      <Muestra titulo="CopyField · inline y link (oscuros)" fondo="oscuro">
        <Pila separacion="sm">
          <CopyField variant="inline" tone="dark" value="77B1-9032" label="código" />
          <CopyField variant="link" tone="dark" value="https://strata.app/test/77B1-9032" label="enlace">
            strata.app/test/77B1-9032
          </CopyField>
        </Pila>
      </Muestra>
    </Seccion>
  )
}
