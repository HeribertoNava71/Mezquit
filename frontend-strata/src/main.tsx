import '@/styles/global.css'
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui'
import { AuthProvider } from '@/context/AuthContext'
import App from './App.tsx'

// Modo demo sin backend (npm run dev:mock): la pastilla para cambiar de escenario.
// Con cualquier otro modo, la condición es falsa al compilar y el build no trae
// ni el import() ni su chunk.
const SelectorEscenario = import.meta.env.MODE === 'mock' ? lazy(() => import('./demo/SelectorEscenario')) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
          {SelectorEscenario && (
            <Suspense fallback={null}>
              <SelectorEscenario />
            </Suspense>
          )}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
