export function getNextTileIndex(index: number, key: string, columns: number, total: number) {
  if (key === 'ArrowRight') return Math.min(total - 1, index + 1)
  if (key === 'ArrowLeft') return Math.max(0, index - 1)
  if (key === 'ArrowDown') return Math.min(total - 1, index + columns)
  if (key === 'ArrowUp') return Math.max(0, index - columns)
  return index
}
