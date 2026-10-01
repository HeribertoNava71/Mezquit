// Componentes base STRATA. Importa desde '@/components/ui'.
// Cada barril reúne un grupo; usa exportaciones con nombre y evita nombres
// repetidos entre barriles (export * los haría ambiguos).
// Button es el STRATA y también conserva su export default, que las pantallas
// viejas importan por ruta ('@/components/ui/Button'). Los componentes del
// sistema anterior (FloatingInput, GrainTexture, PasswordStrength y
// UserDropdown) se importan por su ruta y no pasan por aquí. Los módulos
// internos (Iconos, OverlayDialog, EstadoBase, hasContent, useFieldIds,
// useControlled, useScrollLock y similares) tampoco salen del barril.
export * from './controles'
export * from './contenido'
export * from './feedback'
export * from './utilidades'
