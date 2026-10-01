// Barril de controles (botones, campos de formulario y selección). Fase 1.
// Importa desde '@/components/ui'. Las pantallas viejas siguen importando el
// Button por defecto desde '@/components/ui/Button' (misma API).

export { Button } from './Button'
export type {
  ButtonAsAnchorProps,
  ButtonAsButtonProps,
  ButtonAsLinkProps,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from './Button'

export { IconButton } from './IconButton'
export type { IconButtonProps, IconButtonSize } from './IconButton'

export { Spinner } from './Spinner'
export type { SpinnerProps, SpinnerSize } from './Spinner'

export { Field, FieldError } from './Field'
export type { FieldErrorProps, FieldProps, FieldSize } from './Field'

// «Input (TextField)»: el mismo componente con los dos nombres.
export { Input, Input as TextField } from './Input'
export type { InputProps, InputProps as TextFieldProps, InputSize, InputVariant } from './Input'

export { Textarea } from './Textarea'
export type { TextareaProps, TextareaSize, TextareaVariant } from './Textarea'

export { Select } from './Select'
export type { SelectOption, SelectProps, SelectSize } from './Select'

export { Checkbox } from './Checkbox'
export type { CheckboxProps, CheckboxVariant } from './Checkbox'

export { RadioGroup } from './RadioGroup'
export type { RadioGroupProps, RadioIndicator, RadioSize } from './RadioGroup'

export { RadioCard } from './RadioCard'
export type { RadioCardProps } from './RadioCard'

export { SegmentedFilter } from './SegmentedFilter'
export type { SegmentedFilterOption, SegmentedFilterProps, SegmentedFilterSize } from './SegmentedFilter'

export { SegmentedToggle } from './SegmentedToggle'
export type { SegmentedToggleOption, SegmentedToggleProps } from './SegmentedToggle'

export { Stepper } from './Stepper'
export type { StepperProps, StepperSize } from './Stepper'
