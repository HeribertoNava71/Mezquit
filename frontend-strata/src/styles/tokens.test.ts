// Guarda de la Fase 8 (D-20): sin los alias temporales, toda var(--x) del código
// tiene que estar definida en algún .css de src o como propiedad en línea
// ('--x': … en un objeto de estilo, o setProperty). Una variable sin definir no
// da error: la declaración se descarta en silencio y el elemento pierde su
// estilo. Pasaría, por ejemplo, si al portar el código real (PB-01) vuelve un
// nombre viejo (--color-hunter, --sp-4…); su equivalente está en
// docs/design-tokens.md. Las var(--x, respaldo) no cuentan: traen su valor.
import { describe, expect, it } from 'vitest'

const hojas = import.meta.glob<string>('/src/**/*.css', { query: '?raw', import: 'default', eager: true })
const modulos = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}', '!/src/test/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

const sinComentariosCss = (texto: string) => texto.replace(/\/\*[\s\S]*?\*\//g, ' ')
const sinComentariosTs = (texto: string) =>
  texto.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')

function recolectar() {
  const definidas = new Set<string>()
  const usos: { nombre: string; archivo: string }[] = []
  const usar = (texto: string, archivo: string) => {
    for (const [, nombre, respaldo] of texto.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)) {
      if (!respaldo) usos.push({ nombre, archivo })
    }
    for (const [, nombre] of texto.matchAll(/getPropertyValue\(\s*['"`](--[\w-]+)/g)) usos.push({ nombre, archivo })
  }

  for (const [archivo, crudo] of Object.entries(hojas)) {
    const texto = sinComentariosCss(crudo)
    for (const [, nombre] of texto.matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g)) definidas.add(nombre)
    usar(texto, archivo)
  }
  for (const [archivo, crudo] of Object.entries(modulos)) {
    const texto = sinComentariosTs(crudo)
    for (const [, nombre] of texto.matchAll(/['"`](--[\w-]+)['"`]\s*[:\]]/g)) definidas.add(nombre)
    for (const [, nombre] of texto.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) definidas.add(nombre)
    usar(texto, archivo)
  }
  return { definidas, usos }
}

describe('custom properties', () => {
  it('lee el contenido de las hojas y los módulos de src', () => {
    // Si llegara vacío (sin test.css.include en vite.config.ts), la otra prueba no revisaría nada.
    expect(hojas['/src/styles/tokens.css']).toContain('--color-navy:')
    expect(Object.keys(modulos).length).toBeGreaterThan(50)
  })

  it('toda var(--x) usada sin respaldo está definida', () => {
    const { definidas, usos } = recolectar()
    const faltantes = usos.filter(({ nombre }) => !definidas.has(nombre)).map(({ nombre, archivo }) => `${nombre} en ${archivo}`)
    expect(usos.length).toBeGreaterThan(100)
    expect([...new Set(faltantes)]).toEqual([])
  })
})
