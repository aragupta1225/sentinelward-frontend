import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWardStore } from './wardStore'

describe('ward store mock stream', () => {
  afterEach(() => vi.useRealTimers())

  it('updates a live bed from adapter events', () => {
    vi.useFakeTimers()
    useWardStore.getState().selectFixture('B01')
    const originalUpdate = useWardStore.getState().featuredBed.lastUpdatedAt
    const stop = useWardStore.getState().startMockStream()
    vi.advanceTimersByTime(1000)
    expect(useWardStore.getState().featuredBed.lastUpdatedAt).not.toBe(originalUpdate)
    stop()
  })

  it('freezes updates while disconnected and resumes after reconnection', () => {
    vi.useFakeTimers()
    useWardStore.getState().selectFixture('B01')
    const stop = useWardStore.getState().startMockStream()
    useWardStore.getState().setConnection('disconnected')
    const frozenAt = useWardStore.getState().featuredBed.lastUpdatedAt

    vi.advanceTimersByTime(5000)
    expect(useWardStore.getState().featuredBed.connection).toBe('disconnected')
    expect(useWardStore.getState().featuredBed.lastUpdatedAt).toBe(frozenAt)

    useWardStore.getState().setConnection('live')
    vi.advanceTimersByTime(1000)
    expect(useWardStore.getState().featuredBed.connection).toBe('live')
    expect(useWardStore.getState().featuredBed.lastUpdatedAt).not.toBe(frozenAt)
    stop()
  })
})
