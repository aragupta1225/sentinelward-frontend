import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { Bed } from '../domain/ward'
import { getNextTileIndex } from '../domain/wardNavigation'
import { BedTile } from './BedTile'

interface WardGridProps {
  beds: readonly Bed[]
  onOpenBed: (bedId: string) => void
}

export function WardGrid({ beds, onOpenBed }: WardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const returnId = sessionStorage.getItem('ward-focus-return')
    if (!returnId) return
    const index = beds.findIndex((bed) => bed.id === returnId)
    if (index >= 0) window.requestAnimationFrame(() => tileRefs.current[index]?.focus())
    sessionStorage.removeItem('ward-focus-return')
  }, [beds])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (!event.key.startsWith('Arrow')) return
    event.preventDefault()
    const columnCount = gridRef.current
      ? getComputedStyle(gridRef.current).gridTemplateColumns.split(' ').length
      : 1
    tileRefs.current[getNextTileIndex(index, event.key, columnCount, beds.length)]?.focus()
  }

  return (
    <div className="ward-grid" ref={gridRef} role="list" aria-label="Ward beds">
      {beds.map((bed, index) => (
        <div role="listitem" key={bed.id}>
          <BedTile
            bed={bed}
            compact
            tileRef={(element) => { tileRefs.current[index] = element }}
            onNavigate={(event) => handleKeyDown(event, index)}
            onOpen={(bedId) => {
              sessionStorage.setItem('ward-focus-return', bedId)
              onOpenBed(bedId)
            }}
          />
        </div>
      ))}
    </div>
  )
}
