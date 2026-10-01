import sharp from 'sharp'
import { mkdirSync } from 'fs'

const SRC = '../backend/img/mezquite.png'
const OUT = './public'

mkdirSync(OUT, { recursive: true })

// Copiar logo a public (para referencia en CSS/JS)
await sharp(SRC).toFile(`${OUT}/logo.png`)

// Favicons
await sharp(SRC).resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(`${OUT}/favicon-16.png`)
await sharp(SRC).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(`${OUT}/favicon-32.png`)
await sharp(SRC).resize(180, 180, { fit: 'contain', background: { r: 218, g: 215, b: 205, alpha: 1 } }).toFile(`${OUT}/apple-touch-icon.png`)

// OG image 1200×630 fondo timberwolf + logo centrado
const logoBuffer = await sharp(SRC).resize(380, 257, { fit: 'inside' }).toBuffer()
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: { r: 218, g: 215, b: 205, alpha: 1 } }
}).composite([{ input: logoBuffer, gravity: 'centre' }]).png().toFile(`${OUT}/og-image.png`)

console.log('Favicons generados en public/')
