import './GrainTexture.css'

const PATHS = [
  'M -10 90  C 110 68  260 112 430 88  C 590 66  700 104 870 82',
  'M -10 200 C 100 178 250 220 420 196 C 580 174 700 212 870 190',
  'M -10 320 C 130 295 280 345 460 318 C 620 294 730 335 870 310',
  'M -10 445 C 105 420 255 464 435 438 C 605 414 715 455 870 430',
  'M -10 568 C 120 544 265 590 445 562 C 615 537 720 578 870 552',
  'M -10 675 C 135 652 285 695 465 668 C 635 643 740 684 870 658',
]

interface GrainTextureProps {
  className?: string
  divider?: boolean
  animated?: boolean
}

export default function GrainTexture({
  className = '',
  divider = false,
  animated = true,
}: GrainTextureProps) {
  const svgClass = [
    'grain',
    divider ? 'grain--divider' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <svg
      className={svgClass}
      viewBox="0 0 860 760"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          className={[
            'grain__path',
            animated ? 'grain__path--animate' : '',
            i > 0 ? `grain__path--delay-${i}` : '',
          ].filter(Boolean).join(' ')}
        />
      ))}
    </svg>
  )
}
