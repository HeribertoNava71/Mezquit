// Contraste de los pares dudosos (Fase 8): texto sobre vidrio, sobre superficies
// translúcidas y sobre tintes. Complementa a axe, que no decide el contraste sobre
// fondos translúcidos con backdrop-filter, degradados ni imágenes («incomplete»).
//
// Uso, desde frontend-strata:
//   node e2e/contraste.mjs                     # pares de tokens (sin navegador)
//   node e2e/contraste.mjs --pagina [--url http://localhost:5188]
//                                              # además, los nodos «incomplete» de
//                                              # .capturas/a11y.json medidos en la página
//
// 1. Tokens. Lee src/styles/tokens.css, resuelve los var() y calcula WCAG 2.x para cada
//    texto sobre cada superficie. Las translúcidas se componen sobre el peor fondo
//    posible debajo: el lienzo #FAF8F5 con el centro del halo más oscuro (coral de la
//    home al 26 %, el de menor luminancia) y, para la barra superior, también sobre la
//    superficie tinta #0F172A (el banner oscuro del reporte pasa por debajo al desplazar).
// 2. Página (--pagina). Para cada nodo que axe dejó sin decidir, toma el color del
//    texto y apila los fondos de sus ancestros sobre ese mismo peor fondo.
//
// Texto normal: 4.5:1. Texto grande (24 px, o 18.66 px en negrita): 3:1.
// Termina con código 1 si algún par de texto normal no llega a 4.5:1.

import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { RAIZ, SALIDA, URL_POR_DEFECTO, abrir, leerOpciones, nuevoContexto } from './comun.mjs'

const opciones = leerOpciones(process.argv.slice(2), {
  pagina: { porDefecto: false, bandera: true },
  url: { porDefecto: URL_POR_DEFECTO, convertir: (v) => String(v ?? '').replace(/\/+$/, '') },
})

// ── Color ────────────────────────────────────────────────────────────────

/** «#RGB», «#RRGGBB», «rgb(…)» o «rgba(…)» → [r, g, b, a]. */
export function leerColor(texto) {
  const valor = texto.trim()
  let m = /^#([0-9a-f]{3})$/i.exec(valor)
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16)).concat(1)
  m = /^#([0-9a-f]{6})$/i.exec(valor)
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1)
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(valor)
  if (m) {
    const alfa = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
    return [Number(m[1]), Number(m[2]), Number(m[3]), alfa]
  }
  return null
}

/** Capa con alfa sobre una base opaca. */
export function componer(capa, base) {
  const [r, g, b, a] = capa
  return [r * a + base[0] * (1 - a), g * a + base[1] * (1 - a), b * a + base[2] * (1 - a), 1]
}

function canal(c) {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminancia([r, g, b]) {
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
}

export function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const hex = ([r, g, b]) => `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase()}`

// ── Tokens ───────────────────────────────────────────────────────────────

async function leerTokens() {
  const css = await readFile(path.join(RAIZ, 'src', 'styles', 'tokens.css'), 'utf8')
  const inicio = css.indexOf(':root {')
  const fin = css.indexOf('\n}', inicio)
  const bloque = css.slice(inicio, fin).replace(/\/\*[\s\S]*?\*\//g, '')
  const crudos = new Map()
  for (const [, nombre, valor] of bloque.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) crudos.set(nombre, valor.trim())
  const resolver = (valor, profundidad = 0) =>
    profundidad > 10 ? valor : valor.replace(/var\((--[\w-]+)\)/g, (_, nombre) => resolver(crudos.get(nombre) ?? '', profundidad + 1))
  return (nombre) => {
    const color = leerColor(resolver(crudos.get(nombre) ?? ''))
    if (!color) throw new Error(`El token ${nombre} no es un color`)
    return color
  }
}

async function revisarTokens() {
  const t = await leerTokens()
  const lienzo = t('--color-bg')
  // El halo de menor luminancia en su centro, sobre el lienzo: coral de la home al 26 %.
  const halos = ['--halo-coral-home', '--halo-sky-home', '--halo-navy-home', '--halo-coral', '--halo-sky', '--halo-navy'].map((h) => [h, componer(t(h), lienzo)])
  const [haloPeor, fondoPeor] = halos.sort((a, b) => luminancia(a[1]) - luminancia(b[1]))[0]
  console.log(`Peor fondo bajo una superficie translúcida: ${haloPeor} sobre el lienzo = ${hex(fondoPeor)} (L ${luminancia(fondoPeor).toFixed(3)})`)

  const vidrio = componer(t('--surface-glass-bg'), fondoPeor)
  const superficies = {
    'lienzo #FAF8F5': lienzo,
    // Peor caso teórico (texto justo en el centro del halo): solo informa. La posición
    // real del texto respecto a los halos la mide --pagina.
    'lienzo bajo el halo más oscuro': fondoPeor,
    'vidrio .72 (sobre el halo más oscuro)': vidrio,
    'tarjeta secundaria .85': componer(t('--surface-secondary-bg'), fondoPeor),
    'paso translúcido .66': componer(t('--surface-step-bg'), fondoPeor),
    'cabecera de tabla .6 sobre vidrio': componer(t('--color-bg-thead'), vidrio),
    'pastilla .8': componer(t('--color-surface-pill'), fondoPeor),
    'botón sobre vidrio .9': componer(t('--color-surface-ghost'), vidrio),
    'barra superior (sobre el halo)': componer(t('--color-topbar-bg'), fondoPeor),
    'barra superior sobre la tinta #0F172A': componer(t('--color-topbar-bg'), t('--color-surface-dark')),
    'barra del examen .8': componer(t('--color-exam-bar-bg'), fondoPeor),
    'blanco': t('--color-surface-white'),
    'beige secundario': t('--color-bg-alt'),
    'superficie suave': t('--color-surface-soft'),
    'hover de fila': t('--color-surface-hover'),
    'pista del segmentado': t('--color-surface-track'),
    'badge neutro': t('--color-surface-muted'),
    'tinte navy': t('--color-navy-tint'),
    'tinte celeste': t('--color-sky-tint'),
    'tinte celeste fuerte': t('--color-sky-tint-strong'),
    'tinte celeste suave': t('--color-sky-tint-soft'),
    'tinte coral': t('--color-coral-tint'),
    'fondo de error': t('--color-error-bg'),
    'fondo de éxito': t('--color-success-bg'),
    'fondo de advertencia': t('--color-warning-bg'),
    'tinte slate': t('--color-slate-tint'),
  }

  // Texto de cada superficie: el que se usa sobre ella en las pantallas.
  const textosComunes = ['--color-text', '--color-text-data', '--color-text-secondary', '--color-text-tertiary', '--color-navy', '--color-sky-text']
  const pares = [
    ...['lienzo #FAF8F5', 'lienzo bajo el halo más oscuro', 'vidrio .72 (sobre el halo más oscuro)', 'tarjeta secundaria .85', 'paso translúcido .66', 'blanco', 'beige secundario', 'hover de fila'].flatMap((s) =>
      [...textosComunes, '--color-error-text', '--color-success-text', '--color-warning-text'].map((x) => [x, s]),
    ),
    ...['cabecera de tabla .6 sobre vidrio', 'pista del segmentado', 'badge neutro'].flatMap((s) => ['--color-text', '--color-text-secondary', '--color-text-tertiary'].map((x) => [x, s])),
    ...['pastilla .8', 'botón sobre vidrio .9'].flatMap((s) => ['--color-text', '--color-text-secondary', '--color-navy', '--color-sky-text'].map((x) => [x, s])),
    ...['barra superior (sobre el halo)', 'barra superior sobre la tinta #0F172A'].flatMap((s) =>
      ['--color-text', '--color-text-secondary', '--color-text-tertiary', '--color-navy', '--color-link-hover'].map((x) => [x, s]),
    ),
    ...['barra del examen .8'].flatMap((s) => ['--color-text', '--color-text-secondary', '--color-text-tertiary', '--color-success-text', '--color-error-text'].map((x) => [x, s])),
    ['--color-text-placeholder', 'blanco'],
    ['--color-text-placeholder', 'superficie suave'],
    ['--color-text-placeholder', 'lienzo #FAF8F5'],
    ['--color-navy', 'tinte navy'],
    ['--color-sky-deep', 'tinte celeste'],
    ['--color-sky-text', 'tinte celeste'],
    ['--color-text', 'tinte celeste'],
    ['--color-text-tertiary', 'tinte celeste'],
    ['--color-sky-deep', 'tinte celeste fuerte'],
    ['--color-text-secondary', 'tinte celeste suave'],
    ['--color-coral-text', 'tinte coral'],
    ['--color-error-text', 'fondo de error'],
    ['--color-success-text', 'fondo de éxito'],
    ['--color-warning-text', 'fondo de advertencia'],
    ['--color-text-slate', 'blanco'],
    ['--color-text-slate', 'tinte slate'],
  ]

  const fallos = []
  let ultimo = ''
  for (const [texto, superficie] of pares) {
    const fondo = superficies[superficie]
    const ratio = contraste(t(texto), fondo)
    if (superficie !== ultimo) {
      console.log(`\n${superficie} (${hex(fondo)})`)
      ultimo = superficie
    }
    const ok = ratio >= 4.5
    const informativo = superficie === 'lienzo bajo el halo más oscuro'
    console.log(`  ${ok ? 'ok   ' : informativo ? 'aviso' : 'FALLA'} ${texto.padEnd(26)} ${ratio.toFixed(2)}:1`)
    if (!ok && !informativo) fallos.push(`${texto} sobre ${superficie}: ${ratio.toFixed(2)}:1`)
  }
  return { fallos }
}

// ── Página ───────────────────────────────────────────────────────────────

/**
 * Mide en la página los nodos que axe no decidió. El fondo es la pila real de
 * ancestros translúcidos sobre el lienzo y los halos en la posición del texto
 * (con los halos fijos, en la altura más desfavorable que alcanza al desplazar).
 */
async function revisarPagina() {
  let informe
  try {
    informe = JSON.parse(await readFile(path.join(SALIDA, 'a11y.json'), 'utf8'))
  } catch {
    console.log('\nSin .capturas/a11y.json: corre antes node e2e/a11y.mjs.')
    return []
  }
  // Un nodo por ruta, escenario y selector (el primer ancho en que apareció). Los estados con
  // algo abierto se miden en su ruta base solo si el selector existe ahí.
  const unicos = new Map()
  for (const entrada of informe) {
    for (const nodo of entrada.contrasteDudoso ?? []) {
      const clave = `${entrada.escenario}|${entrada.ruta}|${nodo.target}`
      if (!unicos.has(clave)) unicos.set(clave, { ...entrada, nodo })
    }
  }
  console.log(`\nNodos que axe no decidió: ${unicos.size} (únicos por ruta y selector)`)
  const porRuta = new Map()
  for (const item of unicos.values()) {
    const clave = `${item.ancho}|${item.escenario}|${item.ruta}`
    porRuta.set(clave, [...(porRuta.get(clave) ?? []), item])
  }

  const fallos = []
  const resumen = new Map()
  const browser = await chromium.launch()
  try {
    for (const [clave, items] of porRuta) {
      const [ancho, escenario, ruta] = clave.split('|')
      const context = await nuevoContexto(browser, escenario, { ancho: Number(ancho) })
      const page = await context.newPage()
      try {
        await abrir(page, opciones.url, ruta, { espera: 300 })
        const medidas = await page.evaluate(
          ({ selectores }) => {
            const leer = (texto) => {
              const m = /rgba?\(([^)]+)\)/.exec(texto)
              if (!m) return null
              const [r, g, b, a = '1'] = m[1].split(/[\s,/]+/).filter(Boolean)
              return [Number(r), Number(g), Number(b), Number(a)]
            }
            const sobre = (capa, base) => capa.slice(0, 3).map((c, i) => c * capa[3] + base[i] * (1 - capa[3])).concat(1)
            const canal = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
            const lum = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
            const ratio = (x, y) => {
              const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p)
              return (a + 0.05) / (b + 0.05)
            }

            // Lienzo y halos reales: radial-gradient(circle, color, transparent 70%), con el
            // radio hasta la esquina más lejana. Los fijos (todas las pantallas menos la home)
            // no se mueven al desplazar: el texto pasa por debajo, así que se toma la altura
            // alcanzable más cercana a su centro (sin contar lo que tapa la barra sticky).
            const lienzo = leer(getComputedStyle(document.querySelector('.st-page') ?? document.body).backgroundColor) ?? [250, 248, 245, 1]
            const barra = document.querySelector('.st-topbar:not(.st-topbar--home)')
            const techo = barra && getComputedStyle(barra).position === 'sticky' ? barra.getBoundingClientRect().height : 0
            const recorrido = Math.max(0, document.documentElement.scrollHeight - innerHeight)
            const halos = [...document.querySelectorAll('.st-page__halo')]
              .filter((h) => getComputedStyle(h).display !== 'none')
              .map((h) => {
                const r = h.getBoundingClientRect()
                const color = leer(getComputedStyle(h).backgroundImage)
                const fijo = getComputedStyle(h.parentElement).position === 'fixed'
                return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, radio: Math.hypot(r.width, r.height) / 2, color, fijo }
              })
              .filter((h) => h.color)
            const fondoEn = (caja) => {
              const x = caja.left + caja.width / 2
              let base = lienzo
              for (const h of halos) {
                const y0 = caja.top + caja.height / 2
                // Altura del texto en la ventana: con halos fijos, la más cercana al centro del
                // halo entre las alcanzables al desplazar; con los de la home, la de ahora.
                const y = h.fijo ? Math.min(Math.max(h.cy, Math.max(techo, y0 - recorrido)), Math.max(techo, y0)) : y0
                const t = Math.min(1, Math.hypot(x - h.cx, y - h.cy) / (0.7 * h.radio))
                base = sobre([h.color[0], h.color[1], h.color[2], h.color[3] * (1 - t)], base)
              }
              return base
            }

            return selectores.map((selector) => {
              let el = null
              try {
                el = document.querySelector(selector)
              } catch {
                /* selector de axe con sintaxis que querySelector no entiende */
              }
              if (!el) return { selector, falta: true }
              // Capas de fondo de abajo arriba: ancestros con fondo de color, hasta uno opaco.
              // El lienzo (.st-page) no cuenta como opaco: debajo del texto están los halos.
              const capas = []
              let imagen = false
              let opaco = null
              for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
                if (n.classList.contains('st-page')) break
                const estilo = getComputedStyle(n)
                if (estilo.backgroundImage !== 'none') imagen = true
                const color = leer(estilo.backgroundColor)
                if (color && color[3] === 1) {
                  opaco = color
                  break
                }
                if (color && color[3] > 0) capas.unshift(color)
              }
              let fondo = opaco ?? fondoEn(el.getBoundingClientRect())
              for (const capa of capas) fondo = sobre(capa, fondo)
              const estilo = getComputedStyle(el)
              let texto = leer(estilo.color)
              let opacidad = 1
              for (let n = el; n && n.nodeType === 1; n = n.parentElement) opacidad *= Number(getComputedStyle(n).opacity)
              texto = sobre([texto[0], texto[1], texto[2], texto[3] * opacidad], fondo)
              const px = parseFloat(estilo.fontSize)
              const grande = px >= 24 || (px >= 18.66 && Number(estilo.fontWeight) >= 700)
              return { selector, ratio: ratio(texto, fondo), grande, imagen, texto: el.textContent.trim().slice(0, 40) }
            })
          },
          { selectores: items.map((i) => i.nodo.target) },
        )
        for (const m of medidas) {
          if (m.falta) continue
          const minimo = m.grande ? 3 : 4.5
          const ok = m.ratio >= minimo
          const etiqueta = `${ancho}px ${escenario} ${ruta} · ${m.selector} «${m.texto}»`
          const grupo = ok ? 'ok' : 'FALLA'
          resumen.set(grupo, (resumen.get(grupo) ?? 0) + 1)
          if (!ok) {
            fallos.push(`${etiqueta}: ${m.ratio.toFixed(2)}:1 (mínimo ${minimo}:1)${m.imagen ? ' · con imagen de fondo: revisar a ojo' : ''}`)
            console.log(`  FALLA ${etiqueta}: ${m.ratio.toFixed(2)}:1`)
          }
        }
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
  console.log(`  ${resumen.get('ok') ?? 0} nodos llegan a su mínimo con el peor fondo; ${resumen.get('FALLA') ?? 0} no.`)
  return fallos
}

async function main() {
  const { fallos } = await revisarTokens()
  if (opciones.pagina) fallos.push(...(await revisarPagina()))
  console.log(`\n${fallos.length === 0 ? 'ok: todos los pares llegan a 4.5:1' : `FALLA: ${fallos.length} pares por debajo del mínimo`}`)
  for (const fallo of fallos) console.log(`  - ${fallo}`)
  process.exit(fallos.length > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
