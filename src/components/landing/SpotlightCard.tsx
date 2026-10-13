import { useRef, type CSSProperties, type ReactNode } from 'react'

type SpotlightCardProps = {
  children: ReactNode
  className?: string
  spotlightColor?: string
}

type SpotlightStyle = CSSProperties & {
  '--spotlight-color'?: string
}

/** Pointer-following surface adapted from React Bits' SpotlightCard pattern. */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(139, 188, 255, 0.22)',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLElement>(null)

  return (
    <article
      ref={cardRef}
      className={`spotlight-card ${className}`.trim()}
      style={{ '--spotlight-color': spotlightColor } as SpotlightStyle}
      onPointerMove={(event) => {
        const card = cardRef.current
        if (!card) return
        const bounds = card.getBoundingClientRect()
        card.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`)
        card.style.setProperty('--spotlight-y', `${event.clientY - bounds.top}px`)
      }}
    >
      {children}
    </article>
  )
}
