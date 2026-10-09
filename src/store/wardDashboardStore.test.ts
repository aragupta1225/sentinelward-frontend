import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureCommandAdapter } from '../adapters/commandGateway'
import type { WardEvent, WardEventSource } from '../adapters/contracts'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'
import { BED_FIXTURES } from '../mocks/fixtures'
import { bootstrapApplication } from '../runtime/bootstrapApplication'
import { configureWardDashboardAdapters, useWardDashboardStore } from './wardDashboardStore'

class SilentEventSource implements WardEventSource {
  connect = vi.fn()
  disconnect = vi.fn()
  subscribe = vi.fn((_listener: (event: WardEvent) => void) => () => undefined)
}

describe('ward dashboard store', () => {
  beforeEach(() => {
    bootstrapApplication({})
    useWardDashboardStore.setState({
      beds: structuredClone([...BED_FIXTURES]),
      connection: 'connecting',
      source: null,
      loadState: 'idle',
      loadError: null,
      commandError: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    bootstrapApplication({})
  })

  it('loads the initial ward through REST and streams through the event source', async () => {
    vi.useFakeTimers()
    const rest = { getWard: vi.fn().mockResolvedValue({ beds: structuredClone(BED_FIXTURES.slice(0, 2)), receivedAt: Date.now() }) }
    const runtime = bootstrapApplication({})
    configureWardDashboardAdapters({ rest, events: runtime.ward.events })
    const stop = useWardDashboardStore.getState().start()
    await vi.waitFor(() => expect(useWardDashboardStore.getState().loadState).toBe('ready'))
    expect(rest.getWard).toHaveBeenCalledOnce()
    expect(useWardDashboardStore.getState().beds).toHaveLength(2)
    const before = useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B01')?.lastUpdatedAt
    vi.advanceTimersByTime(1000)
    const after = useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B01')?.lastUpdatedAt
    expect(useWardDashboardStore.getState().loadState).toBe('ready')
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

  it('records an accepted acknowledgement as a new activity without removing history', async () => {
    const before = useWardDashboardStore.getState().activities.length
    await useWardDashboardStore.getState().acknowledgeBed('B03', 'nurse')
    const state = useWardDashboardStore.getState()
    expect(state.beds.find((bed) => bed.id === 'B03')?.acknowledgement).toBe('acknowledged')
    expect(state.activities.length).toBe(before + 1)
    expect(state.activities[0].kind).toBe('acknowledgement')
  })

  it('keeps acknowledgement pending until the command adapter accepts it', async () => {
    let accept: (() => void) | undefined
    configureCommandAdapter({
      execute: () => new Promise((resolve) => {
        accept = () => resolve({ commandId: 'cmd-1', acceptedAt: Date.now(), status: 'accepted' })
      }),
    })
    const acknowledgement = useWardDashboardStore.getState().acknowledgeBed('B03', 'nurse')
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B03')?.acknowledgement).toBe('pending')
    accept?.()
    await acknowledgement
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B03')?.acknowledgement).toBe('acknowledged')
  })

  it('restores an unacknowledged alert and exposes feedback when the command fails', async () => {
    configureCommandAdapter({ execute: async () => { throw new Error('Backend unavailable') } })
    const accepted = await useWardDashboardStore.getState().acknowledgeBed('B03', 'nurse')
    const state = useWardDashboardStore.getState()
    expect(accepted).toBe(false)
    expect(state.beds.find((bed) => bed.id === 'B03')?.acknowledgement).toBe('none')
    expect(state.commandError).toContain('remains unacknowledged')
    configureCommandAdapter(new MockCommandAdapter())
  })

  it('keeps last known beds visible when the initial REST load fails', async () => {
    const events = new SilentEventSource()
    configureWardDashboardAdapters({
      rest: { getWard: vi.fn().mockRejectedValue(new Error('Ward service unavailable')) },
      events,
    })
    const stop = useWardDashboardStore.getState().start()
    await vi.waitFor(() => expect(useWardDashboardStore.getState().loadState).toBe('error'))
    expect(useWardDashboardStore.getState().beds).toHaveLength(BED_FIXTURES.length)
    expect(useWardDashboardStore.getState().loadError).toBe('Ward service unavailable')
    expect(events.connect).toHaveBeenCalledOnce()
    stop()
  })
})
