import { create } from 'zustand'
import type { WardEventSource } from '../adapters/contracts'
import type { Bed } from '../domain/ward'
import { getFixture } from '../mocks/fixtures'
import { MockWardEventSource } from '../mocks/mockAdapters'

interface WardState {
  selectedFixtureId: string
  featuredBed: Bed
  eventSource: WardEventSource | null
  selectFixture: (id: string) => void
  startMockStream: () => () => void
  setConnection: (state: Bed['connection']) => void
}

export const useWardStore = create<WardState>((set, get) => ({
  selectedFixtureId: 'B01',
  featuredBed: getFixture('B01'),
  eventSource: null,
  selectFixture: (id) => {
    const bed = getFixture(id)
    const source = get().eventSource
    if (source instanceof MockWardEventSource) source.setBed(bed)
    set({ selectedFixtureId: id, featuredBed: bed })
  },
  startMockStream: () => {
    const source = new MockWardEventSource(get().featuredBed)
    const unsubscribe = source.subscribe((event) => {
      if (event.type === 'bed.updated') set({ featuredBed: event.bed })
      if (event.type === 'connection.changed') {
        set((state) => ({ featuredBed: { ...state.featuredBed, connection: event.state } }))
      }
    })
    set({ eventSource: source })
    source.connect()
    return () => {
      unsubscribe()
      source.disconnect()
      set({ eventSource: null })
    }
  },
  setConnection: (state) => {
    const source = get().eventSource
    if (source instanceof MockWardEventSource) {
      if (state === 'live') source.connect()
      else source.disconnect()
      return
    }
    set((current) => ({ featuredBed: { ...current.featuredBed, connection: state } }))
  },
}))
