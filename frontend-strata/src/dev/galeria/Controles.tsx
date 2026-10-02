// Galería · controles: botones, campos, selección, filtros y stepper.
import { useEffect, useRef, useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  Field,
  FieldError,
  IconButton,
  Input,
  RadioCard,
  RadioGroup,
  SegmentedFilter,
  SegmentedToggle,
  Select,
  SelectableListRow,
  Spinner,
  Stepper,
  Tag,
  Textarea,
} from '@/components/ui'
import {
  Fila,
  IconoAgregar,
  IconoCarrito,
  IconoCerrarMuestra,
  IconoCopiarMuestra,
  IconoDescarga,
  IconoEnlace,
  IconoFlecha,
  IconoPersona,
  IconoSobre,
  Muestra,
  Pila,
  Seccion,
} from './comunes'

export function SeccionBotones() {
  return (
    <Seccion
      id="botones"
      titulo="Botones"
      nota="Strata.dc.html:123, 145, 343-344, 613, 671, 690, 757, 854, 1077, 1117, 1186-1188, 1313, 1369-1370. Primario navy (D-19)."
    >
      <Muestra titulo="Variantes · md">
        <Fila>
          <Button>Registrar en candidatos</Button>
          <Button variant="secondary">Guardar borrador</Button>
          <Button variant="neutral">Cancelar</Button>
          <Button variant="highlight">Ver diagnóstico</Button>
          <Button variant="ghost">Tengo un enlace de invitación</Button>
          <Button variant="ink">Comprar un test</Button>
          <Button variant="danger">Eliminar usuario</Button>
        </Fila>
      </Muestra>
      <Muestra titulo="Tamaños · sm, md y lg">
        <Fila>
          <Button size="sm" variant="secondary">
            Reenviar
          </Button>
          <Button size="sm" variant="highlight">
            Ver reporte
          </Button>
          <Button size="sm">Enviar</Button>
          <Button>Siguiente pregunta</Button>
          <Button size="lg" iconRight={<IconoFlecha />}>
            Comenzar evaluación
          </Button>
        </Fila>
      </Muestra>
      <Muestra titulo="Con ícono">
        <Fila>
          <Button variant="secondary" iconLeft={<IconoCarrito />}>
            Carrito · 2
          </Button>
          <Button iconLeft={<IconoEnlace />}>Generar enlace / código</Button>
          <Button iconLeft={<IconoAgregar />}>Generar enlace / código de invitación</Button>
          <Button iconRight={<IconoFlecha />}>Iniciar evaluación</Button>
          <Button iconLeft={<IconoDescarga />}>Descargar diagnóstico (PDF)</Button>
        </Fila>
      </Muestra>
      <Muestra titulo="Estados · deshabilitado y cargando">
        <Fila>
          <Button disabled>Siguiente pregunta</Button>
          <Button variant="secondary" disabled>
            Anterior
          </Button>
          <Button variant="ghost" disabled>
            Reenviar código
          </Button>
          <Button size="sm" variant="secondary" disabled>
            Anterior
          </Button>
          <Button loading loadingText="Enviando…">
            Enviar invitación
          </Button>
          <Button variant="secondary" loading>
            Guardar borrador
          </Button>
        </Fila>
      </Muestra>
      <Muestra titulo="Ancho completo y enlaces">
        <Pila separacion="sm">
          <Button fullWidth>Añadir · Solicitar créditos</Button>
          <Fila>
            <Button to="/precios" variant="secondary">
              Enlace del router (to)
            </Button>
            <Button href="#botones" variant="ghost">
              Ancla (href)
            </Button>
          </Fila>
        </Pila>
      </Muestra>
      <Muestra titulo="Sobre oscuro" fondo="oscuro">
        <Fila>
          <Button variant="ghost">Volver al panel →</Button>
          <Button variant="secondary">Secundario</Button>
          <Button>Primario</Button>
        </Fila>
      </Muestra>
      <Muestra titulo="IconButton · sm (copiar) y md (cerrar)">
        <Fila>
          <IconButton size="sm" aria-label="Copiar código">
            <IconoCopiarMuestra />
          </IconButton>
          <IconButton aria-label="Cerrar">
            <IconoCerrarMuestra />
          </IconButton>
          <IconButton size="sm" aria-label="Copiar código (deshabilitado)" disabled>
            <IconoCopiarMuestra />
          </IconButton>
          <IconButton aria-label="Cerrar (deshabilitado)" disabled>
            <IconoCerrarMuestra />
          </IconButton>
        </Fila>
      </Muestra>
      <Muestra titulo="Spinner · sm, md y lg">
        <Fila>
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" label="Cargando resultados" />
        </Fila>
      </Muestra>
    </Seccion>
  )
}

export function SeccionCampos() {
  const [nombre, setNombre] = useState('Valentina Ríos')
  const conFoco = useRef<HTMLInputElement>(null)

  // Muestra el estado de foco sin desplazar la página: con autoFocus el navegador
  // bajaba hasta el campo y, en las capturas de página completa, Chromium pintaba
  // los halos fijos respecto a ese desplazamiento (a media página).
  useEffect(() => {
    conFoco.current?.focus({ preventScroll: true })
  }, [])

  return (
    <Seccion
      id="campos"
      titulo="Campos de texto"
      nota="Input md del builder y los modales (Strata.dc.html:369, 1388), sm de los rangos (:559), lg del candidato (:1044, :1059) y código (:1111). Errores inline con ícono (D-22)."
    >
      <Muestra titulo="Input md · reposo, foco y ayuda">
        <Pila>
          <Input label="Correo del candidato" placeholder="nombre@empresa.com" type="email" />
          <Input ref={conFoco} label="Nombre del test" defaultValue="Liderazgo Situacional 360" />
          <Input label="Correo de RR. HH." hint="recibirá una copia del reporte" defaultValue="seleccion@acmetalento.com" />
        </Pila>
      </Muestra>
      <Muestra titulo="Input md · error, válido y deshabilitado">
        <Pila>
          <Input label="Correo del candidato" defaultValue="valentina@correo" error="Escribe un correo válido, por ejemplo nombre@empresa.com." required />
          <Input label="Correo del candidato" defaultValue="v.rios@correo.com" valid />
          <Input label="Empresa" defaultValue="Acme Talento" disabled />
        </Pila>
      </Muestra>
      <Muestra titulo="Input md · prefijo, sufijo y mono; sm">
        <Pila>
          <Fila alinear="arriba">
            <Input label="Precio por crédito" prefix="$" defaultValue="24" inputMode="numeric" />
            <Input label="Duración estimada" suffix="min" defaultValue="35" inputMode="numeric" />
          </Fila>
          <Fila alinear="arriba">
            <Input label="Desde" size="sm" variant="mono" defaultValue="80" />
            <Input label="Hasta" size="sm" variant="mono" defaultValue="100" />
            <Input label="Etiqueta del perfil" size="sm" defaultValue="Perfil de Liderazgo Alto" />
          </Fila>
        </Pila>
      </Muestra>
      <Muestra titulo="Input lg · candidato">
        <Pila>
          <Input
            size="lg"
            label="Nombre completo"
            icon={<IconoPersona />}
            placeholder="Valentina Ríos"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            valid={nombre.trim().length > 2}
          />
          <Input size="lg" label="Correo electrónico" hint="recibirás tu copia del reporte" icon={<IconoSobre />} placeholder="valentina@correo.com" type="email" />
          <Input size="lg" label="Correo electrónico" icon={<IconoSobre />} defaultValue="valentina@correo" error="Revisa el correo: le falta el dominio." />
        </Pila>
      </Muestra>
      <Muestra titulo="Input · código de invitación">
        <Pila>
          <Input variant="code" label="Código de invitación" hideLabel placeholder="9B2X-88K1" />
          <Input variant="code" label="Código de invitación" hideLabel defaultValue="9B2X-88K1" valid />
        </Pila>
      </Muestra>
      <Muestra titulo="Textarea · md, error, válido y deshabilitado">
        <Pila>
          <Textarea label="Descripción para el catálogo" defaultValue="Mide estilo directivo, delegación y lectura de madurez del equipo en contextos de alta presión." />
          <Textarea label="Enunciado" defaultValue="" placeholder="Escribe el reactivo" error="El enunciado no puede quedar vacío." />
          <Textarea label="Notas" defaultValue="Texto confirmado." valid rows={2} />
          <Textarea label="Comentario del revisor" defaultValue="Solo lectura" disabled rows={2} />
        </Pila>
      </Muestra>
      <Muestra titulo="Textarea · sm, lg y mono">
        <Pila>
          <Textarea size="sm" label="Texto corto" defaultValue="Rango compacto del builder." rows={2} />
          <Textarea size="lg" label="Comentarios del candidato" placeholder="Opcional" rows={2} />
          <Textarea variant="mono" label="Texto del reporte automático" defaultValue="{{nombre}} obtuvo {{puntaje}} puntos en {{dimension_alta}}." rows={2} />
        </Pila>
      </Muestra>
      <Muestra titulo="Select · md, sm, lg, error y deshabilitado">
        <Pila>
          <Select
            label="Sector"
            placeholder="Elige un sector"
            options={[
              { value: 'tec', label: 'Tecnología' },
              { value: 'ret', label: 'Retail' },
              { value: 'man', label: 'Manufactura' },
            ]}
          />
          <Select label="Evaluación" defaultValue="lid" options={[{ value: 'lid', label: 'Liderazgo Situacional' }, { value: 'ie', label: 'Inteligencia Emocional' }]} />
          <Fila alinear="arriba">
            <Select size="sm" label="Por página" defaultValue="25" options={[{ value: '25', label: '25' }, { value: '50', label: '50' }]} />
            <Select size="lg" label="País" defaultValue="mx" options={[{ value: 'mx', label: 'México' }, { value: 'co', label: 'Colombia' }]} />
          </Fila>
          <Select label="Rol" placeholder="Elige un rol" required error="Elige el rol del usuario." options={[{ value: 'rh', label: 'RR. HH.' }]} />
          <Select label="Moneda" defaultValue="mxn" disabled options={[{ value: 'mxn', label: 'MXN' }]} />
        </Pila>
      </Muestra>
      <Muestra titulo="Field y FieldError con un control propio">
        <Field label="Archivo del logo" hint="PNG o SVG, 2 MB como máximo" error="El archivo pesa 3.4 MB.">
          <Tag tone="neutral" shape="square" size="sm">
            logo-acme.png
          </Tag>
        </Field>
        <FieldError>Error suelto bajo un grupo de controles.</FieldError>
      </Muestra>
    </Seccion>
  )
}

const OPCIONES_LIKERT = [
  { valor: '1', texto: 'Totalmente en desacuerdo' },
  { valor: '2', texto: 'En desacuerdo' },
  { valor: '3', texto: 'Neutral' },
  { valor: '4', texto: 'De acuerdo' },
  { valor: '5', texto: 'Totalmente de acuerdo' },
]

export function SeccionSeleccion() {
  const [likert, setLikert] = useState('4')
  return (
    <Seccion
      id="seleccion"
      titulo="Casillas y opciones"
      nota="Consentimiento (Strata.dc.html:1068-1073), tarjetas de radio de los modales (:1346), del examen (:1175), del checkout (:1289), del builder (:482) y sin aro (:1404)."
    >
      <Muestra titulo="Checkbox · default">
        <Pila separacion="sm">
          <Checkbox label="Recordar este dispositivo" />
          <Checkbox label="Enviar copia del reporte a RR. HH." description="seleccion@acmetalento.com" defaultChecked />
          <Checkbox label="Acepto los términos" error="Acepta los términos para continuar." />
          <Checkbox label="Opción deshabilitada" disabled />
          <Checkbox label="Opción deshabilitada y marcada" disabled defaultChecked />
        </Pila>
      </Muestra>
      <Muestra titulo="Checkbox · consent">
        <Pila separacion="sm">
          <Checkbox
            variant="consent"
            label={
              <>
                Acepto el tratamiento de mis respuestas con fines de evaluación laboral y el <a href="#seleccion">aviso de privacidad</a>.
              </>
            }
          />
          <Checkbox
            variant="consent"
            defaultChecked
            label={
              <>
                Acepto el tratamiento de mis respuestas con fines de evaluación laboral y el <a href="#seleccion">aviso de privacidad</a>.
              </>
            }
          />
          <Checkbox variant="consent" label="Acepto el aviso de privacidad." error="Acepta el aviso de privacidad para continuar." />
        </Pila>
      </Muestra>
      <Muestra titulo="RadioGroup md · lista del modal">
        <RadioGroup label="Test a aplicar" defaultValue="lid">
          <RadioCard value="lid" label="Liderazgo Situacional" aside="12 libres" />
          <RadioCard value="ie" label="Inteligencia Emocional" aside="5 libres" />
          <RadioCard value="cog" label="Aptitud Cognitiva General" aside="20 libres" />
          <RadioCard value="int" label="Integridad Laboral" aside="0 libres" disabled />
        </RadioGroup>
      </Muestra>
      <Muestra titulo="RadioCard con detalle y etiqueta mono">
        <RadioGroup label="Método de pago" defaultValue="tarjeta">
          <RadioCard
            value="tarjeta"
            label="Transferencia"
            description="Pago contra factura"
            aside={
              <Tag tone="sky" shape="square" size="xs" mono>
                SPEI
              </Tag>
            }
          />
          <RadioCard
            value="otro"
            label="Otro medio"
            description="Lo acuerdas con un asesor"
            aside={
              <Tag tone="sky" shape="square" size="xs" mono>
                ASESOR
              </Tag>
            }
          />
        </RadioGroup>
      </Muestra>
      <Muestra titulo="RadioGroup sm horizontal · chips del builder">
        <RadioGroup label="Tipo de respuesta" size="sm" orientation="horizontal" defaultValue="likert">
          <RadioCard value="likert" label="Escala Likert (1-5)" />
          <RadioCard value="multiple" label="Opción múltiple" />
          <RadioCard value="forzada" label="Elección forzada" />
        </RadioGroup>
      </Muestra>
      <Muestra titulo="RadioGroup sin aro · modos de envío">
        <RadioGroup label="Modo de envío" indicator="none" orientation="horizontal" defaultValue="email">
          <RadioCard value="email" label="Invitación por email" description="Strata envía el enlace al candidato." />
          <RadioCard value="link" label="Enlace de invitación" description="Copias el enlace y lo compartes tú." />
        </RadioGroup>
      </Muestra>
      <Muestra titulo="RadioGroup lg · opciones del examen" ancho="completo">
        <RadioGroup label="Indica qué tanto te describe la afirmación" hideLabel size="lg" value={likert} onChange={setLikert}>
          {OPCIONES_LIKERT.map((opcion) => (
            <RadioCard key={opcion.valor} value={opcion.valor} label={opcion.texto} aside={opcion.valor} />
          ))}
        </RadioGroup>
      </Muestra>
      <Muestra titulo="RadioGroup · error">
        <RadioGroup label="Responde para continuar" size="lg" error="Elige una opción para continuar.">
          <RadioCard value="a" label="De acuerdo" aside="4" />
          <RadioCard value="b" label="En desacuerdo" aside="2" />
        </RadioGroup>
      </Muestra>
    </Seccion>
  )
}

export function SeccionFiltros() {
  const [cantidad, setCantidad] = useState(1)
  const [fila, setFila] = useState(0)
  return (
    <Seccion
      id="filtros"
      titulo="Filtros, selector y stepper"
      nota="Filtros del catálogo (Strata.dc.html:621-624) y de las tablas (:713-716), selector de la home (:136-140) y cantidad y peso (:665-669, :500-504)."
    >
      <Muestra titulo="SelectableListRow · fila elegible de una lista (Fase 4)" fondo="ninguno">
        <Pila separacion="sm">
          {['Orientación a resultados', 'Colaboración', 'Adaptabilidad'].map((escala, indice) => (
            <SelectableListRow key={escala} selected={fila === indice} aria-pressed={fila === indice} onClick={() => setFila(indice)}>
              {escala}
            </SelectableListRow>
          ))}
        </Pila>
      </Muestra>
      <Muestra titulo="SegmentedFilter md · catálogo" fondo="ninguno">
        <SegmentedFilter
          aria-label="Filtrar por categoría"
          defaultValue="todos"
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'lid', label: 'Liderazgo' },
            { value: 'per', label: 'Personalidad' },
            { value: 'cog', label: 'Cognitivos' },
            { value: 'con', label: 'Conductuales' },
          ]}
        />
      </Muestra>
      <Muestra titulo="SegmentedFilter sm · tabla, con conteo y opción deshabilitada" fondo="ninguno">
        <SegmentedFilter
          aria-label="Filtrar por estado"
          size="sm"
          defaultValue="pendiente"
          options={[
            { value: 'todos', label: 'Todos', count: 24 },
            { value: 'pendiente', label: 'Pendiente', count: 6 },
            { value: 'iniciada', label: 'Iniciada', count: 3 },
            { value: 'completada', label: 'Completada', count: 15 },
            { value: 'expirada', label: 'Expirada', count: 0, disabled: true },
          ]}
        />
      </Muestra>
      <Muestra titulo="SegmentedToggle" fondo="ninguno">
        <Pila separacion="sm">
          <SegmentedToggle
            aria-label="Tipo de cliente"
            options={[
              { value: 'mi', label: 'Para mí (Sin registro)' },
              { value: 'empresa', label: 'Para mi Empresa (B2B)' },
            ]}
          />
          <SegmentedToggle
            aria-label="Tipo de cliente"
            defaultValue="empresa"
            options={[
              { value: 'mi', label: 'Para mí (Sin registro)' },
              { value: 'empresa', label: 'Para mi Empresa (B2B)' },
            ]}
          />
        </Pila>
      </Muestra>
      <Muestra titulo="Stepper · sm (cantidad) y md (peso)">
        <Fila alinear="arriba">
          <Stepper label="Cantidad" hideLabel size="sm" min={1} value={cantidad} onChange={setCantidad} />
          <Stepper label="Peso" min={0.1} max={3} step={0.1} defaultValue={1.2} />
          <Stepper label="Créditos" min={1} max={5} defaultValue={5} hint="máximo 5" />
        </Fila>
      </Muestra>
      <Muestra titulo="Stepper · error y deshabilitado">
        <Fila alinear="arriba">
          <Stepper label="Créditos" min={1} defaultValue={0} error="Pide al menos un crédito." />
          <Stepper label="Peso" defaultValue={1} disabled />
        </Fila>
      </Muestra>
      <Muestra titulo="Dentro de una tarjeta de vidrio (contexto del catálogo)">
        <Card padding="sm">
          <Fila alinear="base">
            <Stepper label="Cantidad" hideLabel size="sm" min={1} defaultValue={3} />
            <Button size="sm" variant="secondary">
              Añadir
            </Button>
          </Fila>
        </Card>
      </Muestra>
    </Seccion>
  )
}
