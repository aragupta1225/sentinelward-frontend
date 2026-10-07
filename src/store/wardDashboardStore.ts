import { create } from 'zustand'
import type { Bed } from '../domain/ward'
import { BED_FIXTURES } from '../mocks/fixtures'
import { MockWardGridEventSource } from '../mocks/mockWardEventSource'

export interface WardActivity {
  id: string
  bedId: string | null
  kind: 'alert' | 'acknowledgement' | 'system'
  priority: Bed['priority']
  message: string
  occurredAt: number
}

interface WardDashboardState {
  beds: Bed[]
  connection: Bed['connection']
  activities: WardActivity[]
  source: MockWardGridEventSource | null
  start: () => () => void
  setConnection: (connection: 'live' | 'disconnected') => void
  acknowledgeBed: (bedId: string) => void
}

let activitySequence = 0

function activity(input: Omit<WardActivity, 'id'>): WardActivity {
  activitySequence += 1
  return { ...input, id: `activity-${activitySequence}` }
}

const initialActivities: WardActivity[] = [
  activity({ bedId: 'B08', kind: 'alert', priority: 'high', message: 'Emergency active; compromised device isolated', occurredAt: Date.now() - 45_000 }),
  activity({ bedId: 'B07', kind: 'alert', priority: 'medium', message: 'Possible signal tampering detected', occurredAt: Date.now() - 90_000 }),
  activity({ bedId: 'B04', kind: 'alert', priority: 'medium', message: 'Loose ECG sensor requires bedside check', occurredAt: Date.now() - 150_000 }),
]

export const useWardDashboardStore = create<WardDashboardState>((set, get) => ({
  beds: structuredClone([...BED_FIXTURES]),
  connection: 'connecting',
  activities: initialActivities,
  source: null,
  start: () => {
    const source = new MockWardGridEventSource(get().beds)
    const unsubscribe = source.subscribe((event) => {
      if (event.type === 'bed.updated') {
        set((state) => ({
          beds: state.beds.map((bed) => bed.id === event.bed.id ? event.bed : bed),
        }))
        return
      }

      set((state) => {
        if (state.connection === event.state) return state
        const message = event.state === 'live'
          ? 'Live ward connection restored'
          : 'Ward connection lost; last readings frozen'
        return {
          connection: event.state,
          beds: state.beds.map((bed) => ({ ...bed, connection: event.state })),
          activities: [activity({ bedId: null, kind: 'system', priority: event.state === 'live' ? 'none' : 'high', message, occurredAt: event.occurredAt }), ...state.activities].slice(0, 30),
        }
      })
    })
    set({ source })
    source.connect()
    return () => {
      unsubscribe()
      source.disconnect()
      set({ source: null })
    }
  },
  setConnection: (connection) => {
    const source = get().source
    if (!source) return
    if (connection === 'live') source.connect()
    else source.disconnect()
  },
  acknowledgeBed: (bedId) => {
    const target = get().beds.find((bed) => bed.id === bedId)
    if (!target || target.acknowledgement === 'acknowledged') return
    set((state) => ({
      beds: state.beds.map((bed) => bed.id === bedId ? { ...bed, acknowledgement: 'acknowledged' } : bed),
      activities: [activity({ bedId, kind: 'acknowledgement', priority: target.priority, message: `${target.label} alert acknowledged`, occurredAt: Date.now() }), ...state.activities].slice(0, 30),
    }))
  },
}))
