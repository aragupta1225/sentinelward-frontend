import { describe, expect, it } from 'vitest'
import { getFixture } from '../../mocks/fixtures'
import { sortCensusBeds } from './census'

describe('S5 census ordering', () => {
  it('sorts occupied beds by priority, then lowest trust', () => {
    const sorted = sortCensusBeds(['B01', 'B03', 'B05', 'B07', 'B08', 'B09'].map(getFixture))
    expect(sorted.map((bed) => bed.id)).toEqual(['B08', 'B03', 'B07', 'B05', 'B09', 'B01'])
  })
})
