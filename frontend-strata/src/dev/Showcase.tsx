// Entrada de showcase.html: galería del sistema de diseño, solo para desarrollo.
// vite build usa únicamente index.html, así que este archivo no llega a producción.
// Ábrela con el servidor de desarrollo en /showcase.html.
import '@/styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui'
import { Galeria } from './Galeria'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoryRouter>
      <ToastProvider>
        <Galeria />
      </ToastProvider>
    </MemoryRouter>
  </StrictMode>,
)
