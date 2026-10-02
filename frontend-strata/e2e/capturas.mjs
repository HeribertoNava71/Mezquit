// Capturas de todas las rutas de e2e/comun.mjs a 360, 768 y 1440 px (Fase 8), con
// scripts/captura.mjs y el mock de cada escenario. Guarda .capturas/f8-<escenario>__<ruta>-<ancho>.png.
//
// Uso, desde frontend-strata y con el sitio corriendo:
//   node e2e/capturas.mjs [--url http://localhost:5188] [--anchos 360,768,1440] [--solo-minimas] [--escenario rh]

import { spawn } from 'node:child_process'
import path from 'node:path'
import { RAIZ, URL_POR_DEFECTO, filtrarRutas, leerOpciones, nombreDeRuta } from './comun.mjs'

const opciones = leerOpciones(process.argv.slice(2), {
  url: { porDefecto: URL_POR_DEFECTO, convertir: (v) => String(v ?? '').replace(/\/+$/, '') },
  anchos: { porDefecto: '360,768,1440' },
  'solo-minimas': { porDefecto: false, bandera: true },
  escenario: { porDefecto: null },
})

function capturar(ruta) {
  const argumentos = [
    path.join(RAIZ, 'scripts', 'captura.mjs'),
    `${opciones.url}${ruta.ruta}`,
    `f8-${nombreDeRuta(ruta)}`,
    opciones.anchos,
    '--mock',
    path.join(RAIZ, 'e2e', 'mocks', `${ruta.escenario}.json`),
  ]
  return new Promise((resolver) => {
    const proceso = spawn(process.execPath, argumentos, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] })
    let salida = ''
    proceso.stdout.on('data', (d) => (salida += d))
    proceso.stderr.on('data', (d) => (salida += d))
    proceso.on('close', (codigo) => resolver({ codigo, salida }))
  })
}

let fallas = 0
for (const ruta of filtrarRutas({ minimas: opciones['solo-minimas'], escenario: opciones.escenario })) {
  const { codigo, salida } = await capturar(ruta)
  const avisos = salida.split('\n').filter((l) => /\[página|Error|No se pudo/.test(l))
  console.log(`${codigo === 0 ? 'ok   ' : 'FALLA'} ${ruta.escenario} ${ruta.ruta}${avisos.length ? ` · ${avisos.join(' | ')}` : ''}`)
  if (codigo !== 0) fallas++
}
process.exit(fallas > 0 ? 1 : 0)
