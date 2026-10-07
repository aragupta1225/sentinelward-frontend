import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDemoScenarioStore } from './demoScenarioStore'
import { useWardDashboardStore } from './wardDashboardStore'

describe('timed demo scenarios', () => {
  afterEach(() => {
    useDemoScenarioStore.getState().reset()
    vi.useRealTimers()
  })

  it('raises a real emergency at the specified point in the timeline', () => {
    vi.useFakeTimers()
    useDemoScenarioStore.getState().startScenario('emergency')
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B03')?.verdict).toBe('NORMAL')
    vi.advanceTimersByTime(3000)
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === 'B03')
    expect(bed?.verdict).toBe('EMERGENCY')
    expect(bed?.priority).toBe('high')
    expect(useDemoScenarioStore.getState().timeline).toHaveLength(3)
  })

  it('keeps the emergency visible while isolating a compromised device', () => {
    vi.useFakeTimers()
    useDemoScenarioStore.getState().startScenario('both')
    vi.advanceTimersByTime(4000)
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === 'B08')
    expect(bed?.verdict).toBe('BOTH')
    expect(bed?.priority).toBe('high')
    expect(bed?.isolated).toBe(true)
    expect(bed?.trustState).toBe('untrusted')
  })

  it('freezes and restores the ward connection on schedule', () => {
    vi.useFakeTimers()
    useDemoScenarioStore.getState().startScenario('connection_loss')
    vi.advanceTimersByTime(2000)
    expect(useWardDashboardStore.getState().connection).toBe('disconnected')
    vi.advanceTimersByTime(5000)
    expect(useWardDashboardStore.getState().connection).toBe('live')
  })
})
