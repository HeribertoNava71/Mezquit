import type { ReactNode } from 'react'
import { PageHeader as EncabezadoDePagina } from '@/components/ui'

interface PageHeaderProps {
  title: string
  intro?: string
  /** Eyebrow sobre el título (11 px, mayúsculas). */
  eyebrow?: ReactNode
}

/**
 * Encabezado de las páginas del sitio anterior, con la API de siempre
 * (title e intro). Desde la Fase 7 dibuja el PageHeader de STRATA (eyebrow,
 * H1 de 46 px y entradilla de 17 px): ninguna página que lo use se queda con
 * el aspecto viejo.
 *
 * @deprecated Usa `PageHeader` de '@/components/ui' (title, eyebrow, lede y actions).
 * Las páginas públicas, PruebasPage y las de /app ya lo usan.
 */
export default function PageHeader({ title, intro, eyebrow }: PageHeaderProps) {
  return <EncabezadoDePagina title={title} lede={intro} eyebrow={eyebrow} />
}
