// Genera los íconos y la imagen para compartir a partir del emblema de Strata (D-03).
//
// Uso (desde cualquier carpeta): node scripts/generate-favicons.mjs
//
// Origen: public/brand/strata-mark.png, copiado del prototipo aprobado
// (Plataforma Strata de evaluaciones psicométricas/assets/). Si cambia el
// emblema, reemplaza ese archivo y vuelve a correr el script.
//
// Salida en public/: logo.png, favicon-16.png, favicon-32.png,
// apple-touch-icon.png y og-image.png (1200 × 630).
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(RAIZ, 'public/brand/strata-mark.png')
const OUT = path.join(RAIZ, 'public')

// Fondo del propio emblema (#F8F5ED). Rellenar con él evita que se note el
// recuadro del PNG, que es opaco. iOS necesita el ícono opaco.
const FONDO = { r: 248, g: 245, b: 237, alpha: 1 }

mkdirSync(OUT, { recursive: true })

// El emblema sin el margen beige del archivo, para que llene cada ícono.
const emblema = await sharp(SRC).trim({ threshold: 18 }).toBuffer()

/** Ícono cuadrado: el emblema centrado con un margen del mismo fondo. */
async function cuadrado(lado, margen, archivo) {
  const interior = lado - margen * 2
  await sharp(emblema)
    .resize(interior, interior, { fit: 'contain', background: FONDO })
    .extend({ top: margen, bottom: margen, left: margen, right: margen, background: FONDO })
    .png()
    .toFile(path.join(OUT, archivo))
}

// Logo de referencia: lo usan las pantallas que aún no se rediseñan
// (/logo.png en Login y Registro). Las barras y el pie nuevos usan
// public/brand/strata-salamandra.png a través de SITE.brand.
await sharp(SRC).png().toFile(path.join(OUT, 'logo.png'))

await cuadrado(16, 1, 'favicon-16.png')
await cuadrado(32, 2, 'favicon-32.png')
await cuadrado(180, 20, 'apple-touch-icon.png')

// Imagen para compartir (Open Graph): emblema centrado sobre su mismo fondo.
const emblemaOg = await sharp(emblema).resize(300, 330, { fit: 'inside' }).toBuffer()
await sharp({ create: { width: 1200, height: 630, channels: 4, background: FONDO } })
  .composite([{ input: emblemaOg, gravity: 'centre' }])
  .png()
  .toFile(path.join(OUT, 'og-image.png'))

console.log('Íconos generados en public/: logo.png, favicon-16.png, favicon-32.png, apple-touch-icon.png y og-image.png')
