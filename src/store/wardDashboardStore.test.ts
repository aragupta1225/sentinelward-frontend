import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWardDashboardStore } from './wardDashboardStore'

describe('ward dashboard store', () => {
  afterEach(() => vi.useRealTimers())

  it('streams live telemetry for the ward', () => {
    vi.useFakeTimers()
    const before = useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B01')?.lastUpdatedAt
    const stop = useWardDashboardStore.getState().start()
    vi.advanceTimersByTime(1000)
    const after = useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B01')?.lastUpdatedAt
    expect(after).not.toBe(before)
    stop()
  })

  it('freezes all readings on connection loss', () => {
    vi.useFakeTimers()
    const stop = useWardDashboardStore.getState().start()
    useWardDashboardStore.getState().setConnection('disconnected')
    const frozenAt = useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B03')?.lastUpdatedAt
    vi.advanceTimersByTime(5000)
    expect(useWardDashboardStore.getState().connection).toBe('disconnected')
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B03')?.lastUpdatedAt).toBe(frozenAt)
    stop()
  })

  it('records acknowledgement as a new activity without removing history', () => {
    const before = useWardDashboardStore.getState().activities.length
    useWardDashboardStore.getState().acknowledgeBed('B03')
    const state = useWardDashboardStore.getState()
    expect(state.beds.find((bed) => bed.id === 'B03')?.acknowledgement).toBe('acknowledged')
    expect(state.activities.length).toBe(before + 1)
    expect(state.activities[0].kind).toBe('acknowledgement')
  })
})
