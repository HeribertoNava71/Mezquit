import { useState } from 'react'
import { VisuallyHidden, useReducedMotion } from '@/components/ui'
import { AVISO_OCULTA, AVISO_VISIBLE, TEXTO_MOSTRAR, TEXTO_OCULTAR } from './mensajes'
import { guardarMascotaOculta, useMascotaOculta } from './preferencia'

export interface ControlMascotaProps {
  /** Clase del botón: en el pie de la home, la de sus enlaces (st-footer__link). */
  className?: string
}

/**
 * «Ocultar mascota» / «Mostrar mascota» (WCAG 2.2.2, nivel A; D-27). Va en el pie
 * de la home y vale para la siguiente visita (preferencia.ts). Oculta, la mascota
 * no se monta: sin tweens, ticker ni listeners. El texto del botón dice lo que
 * hará; una región viva anuncia el cambio, también cuando se ocultó desde la
 * burbuja. Con prefers-reduced-motion la mascota no existe y el control no se muestra.
 * No importa GSAP ni la mascota: pesa unos bytes en el pie.
 */
export function ControlMascota({ className }: ControlMascotaProps) {
  const reducir = useReducedMotion()
  const oculta = useMascotaOculta()
  // Aviso del último cambio. Al montar no se anuncia nada: solo los cambios.
  const [previa, setPrevia] = useState(oculta)
  const [aviso, setAviso] = useState('')
  if (previa !== oculta) {
    setPrevia(oculta)
    setAviso(oculta ? AVISO_OCULTA : AVISO_VISIBLE)
  }

  if (reducir) return null
  return (
    <>
      <button type="button" className={className} onClick={() => guardarMascotaOculta(!oculta)}>
        {oculta ? TEXTO_MOSTRAR : TEXTO_OCULTAR}
      </button>
      <VisuallyHidden role="status">{aviso}</VisuallyHidden>
    </>
  )
}

export default ControlMascota
