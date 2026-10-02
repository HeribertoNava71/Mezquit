import { Tag, cx, type TagSize } from '@/components/ui'
import { IconoPendiente } from './iconos'
import './Pendiente.css'

export interface PendienteProps {
  /** El marcador tal como viene de los datos: «[PENDIENTE: precio]». */
  children: string
  /** Por defecto, lg (11.5 px); xl en el lugar del precio. */
  size?: Extract<TagSize, 'md' | 'lg' | 'xl'>
  className?: string
}

/**
 * Dato pendiente a la vista (R-35; D-18): Tag neutro con borde punteado y un
 * reloj de arena, para que el marcador no se confunda con contenido real ni con
 * un control. El texto sale de los datos y se parte en varias líneas si no cabe.
 */
export function Pendiente({ children, size = 'lg', className }: PendienteProps) {
  return (
    <Tag
      tone="neutral"
      shape="square"
      size={size}
      mono
      icon={<IconoPendiente />}
      className={cx('st-pendiente', className)}
    >
      {children}
    </Tag>
  )
}

export default Pendiente
