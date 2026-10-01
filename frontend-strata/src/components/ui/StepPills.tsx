import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx'
import { IconoPalomita } from './Iconos'
import { VisuallyHidden } from './VisuallyHidden'
import './StepPills.css'

export interface StepPillsStep {
  /** Texto del paso. */
  label: ReactNode
  /** Clave estable (por defecto, el índice). */
  id?: string
}

/** Estado visual de un paso. */
export type StepPillsState = 'todo' | 'active' | 'done'

export interface StepPillsProps extends Omit<HTMLAttributes<HTMLOListElement>, 'children'> {
  /** Pasos en orden. Acepta textos o objetos { label, id }. */
  steps: ReadonlyArray<StepPillsStep | string>
  /** Índice (desde 0) del paso actual. */
  current: number
  /** Índices de los pasos hechos. Por defecto, todos los anteriores al actual. */
  completed?: ReadonlyArray<number>
  /** Si se pasa, cada paso seleccionable es un botón que llama con su índice. */
  onStepSelect?: (index: number) => void
  /** Decide qué pasos se pueden seleccionar. Por defecto, todos (como el prototipo). */
  canSelectStep?: (index: number) => boolean
  /** Nombre de la lista para lectores. Por defecto, «Pasos». */
  'aria-label'?: string
  ref?: Ref<HTMLOListElement>
}

/**
 * Pastillas de pasos numerados (Strata.dc.html:351-358 y 1896-1904).
 * Paso activo: fondo blanco, borde celeste y número navy con aria-current="step".
 * El número activo pasa de #0EA5E9 (2.77:1 con blanco) a navy (10.36:1).
 */
export function StepPills({
  steps,
  current,
  completed,
  onStepSelect,
  canSelectStep,
  className,
  'aria-label': ariaLabel = 'Pasos',
  ref,
  ...rest
}: StepPillsProps) {
  return (
    <ol ref={ref} className={cx('st-steps', className)} aria-label={ariaLabel} {...rest}>
      {steps.map((rawStep, index) => {
        const step = typeof rawStep === 'string' ? { label: rawStep } : rawStep
        const isDone = completed ? completed.includes(index) : index < current
        const state: StepPillsState = index === current ? 'active' : isDone ? 'done' : 'todo'
        const selectable = Boolean(onStepSelect) && (canSelectStep ? canSelectStep(index) : true)
        const ariaCurrent = state === 'active' ? 'step' : undefined
        const content = (
          <>
            <span className="st-steps__number" aria-hidden="true">
              {state === 'done' ? (
                <IconoPalomita width={10} height={10} strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                index + 1
              )}
            </span>
            <span className="st-steps__label">{step.label}</span>
            {state === 'done' && <VisuallyHidden> (completado)</VisuallyHidden>}
          </>
        )
        return (
          <li
            key={step.id ?? index}
            className={cx('st-steps__item', `st-steps__item--${state}`)}
            aria-current={selectable ? undefined : ariaCurrent}
          >
            {selectable ? (
              <button
                type="button"
                className="st-steps__pill st-steps__pill--button"
                aria-current={ariaCurrent}
                onClick={() => onStepSelect?.(index)}
              >
                {content}
              </button>
            ) : (
              <span className="st-steps__pill">{content}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
