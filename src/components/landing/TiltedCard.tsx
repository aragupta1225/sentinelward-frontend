import { useRef, type CSSProperties, type ReactNode } from 'react'

type TiltedCardProps = {
  children: ReactNode
  className?: string
  glareColor?: string
  borderGlowColor?: string
}

type TiltedStyle = CSSProperties & {
  '--tilt-x'?: string
  '--tilt-y'?: string
  '--glare-x'?: string
  '--glare-y'?: string
  '--glare-color'?: string
  '--border-glow-color'?: string
}

/** Pointer-reactive surface combining React Bits-inspired tilt, spotlight, and border glow. */
export function TiltedCard({
  children,
  className = '',
  glareColor = 'rgba(139, 188, 255, 0.24)',
  borderGlowColor = 'rgba(139, 188, 255, 0.92)',
}: TiltedCardProps) {
  const cardRef = useRef<HTMLElement>(null)

  const resetTilt = () => {
    const card = cardRef.current
    if (!card) return
    card.style.setProperty('--tilt-x', '0deg')
    card.style.setProperty('--tilt-y', '0deg')
    card.style.setProperty('--glare-x', '50%')
    card.style.setProperty('--glare-y', '50%')
  }

  return (
    <article
      ref={cardRef}
      className={`tilted-card ${className}`.trim()}
      style={{
        '--tilt-x': '0deg',
        '--tilt-y': '0deg',
        '--glare-x': '50%',
        '--glare-y': '50%',
        '--glare-color': glareColor,
        '--border-glow-color': borderGlowColor,
      } as TiltedStyle}
      onPointerMove={(event) => {
        const card = cardRef.current
        if (!card || event.pointerType === 'touch') return
        const bounds = card.getBoundingClientRect()
        const x = (event.clientX - bounds.left) / bounds.width
        const y = (event.clientY - bounds.top) / bounds.height
        card.style.setProperty('--tilt-x', `${(0.5 - y) * 6}deg`)
        card.style.setProperty('--tilt-y', `${(x - 0.5) * 8}deg`)
        card.style.setProperty('--glare-x', `${x * 100}%`)
        card.style.setProperty('--glare-y', `${y * 100}%`)
      }}
      onPointerLeave={resetTilt}
    >
      {children}
    </article>
  )
}
