import { describe, expect, it } from 'vitest'
import { getNextTileIndex } from '../domain/wardNavigation'

describe('getNextTileIndex', () => {
  it('moves by visual columns and stays within the grid', () => {
    expect(getNextTileIndex(1, 'ArrowRight', 4, 12)).toBe(2)
    expect(getNextTileIndex(1, 'ArrowLeft', 4, 12)).toBe(0)
    expect(getNextTileIndex(1, 'ArrowDown', 4, 12)).toBe(5)
    expect(getNextTileIndex(5, 'ArrowUp', 4, 12)).toBe(1)
    expect(getNextTileIndex(11, 'ArrowRight', 4, 12)).toBe(11)
    expect(getNextTileIndex(0, 'ArrowUp', 4, 12)).toBe(0)
  })
})
