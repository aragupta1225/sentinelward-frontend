import { describe, expect, it } from 'vitest'
import { BED_FIXTURES } from '../mocks/fixtures'
import { getWardSummary } from './wardSummary'

describe('getWardSummary', () => {
  it('keeps alarm, trust, and isolation metrics independent', () => {
    const summary = getWardSummary(BED_FIXTURES)
    expect(summary.totalBeds).toBe(12)
    expect(summary.activeAlarms).toBe(6)
    expect(summary.untrustedBeds).toBe(3)
    expect(summary.stoppedAlarmsToday).toBe(37)
    expect(summary.averageTrust).toBeGreaterThan(0)
  })
})
