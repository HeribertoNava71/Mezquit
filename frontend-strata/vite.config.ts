/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    // Fase 8 (D-28): las fuentes nunca van en base64 dentro del CSS. Los subconjuntos
    // chicos de JetBrains Mono (menos de 4 KB) se incrustaban en la hoja principal,
    // que bloquea el primer pintado, aunque la home no los use (unicode-range).
    assetsInlineLimit: (archivo) => (/\.(woff2?|ttf|otf|eot)$/i.test(archivo) ? false : undefined),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    // Vitest entrega vacío todo .css. src/styles/tokens.test.ts lee las hojas con
    // ?raw para revisar que cada var(--x) esté definida; las demás importaciones
    // de CSS siguen vacías.
    css: { include: [/\.css\?raw$/] },
  },
})
