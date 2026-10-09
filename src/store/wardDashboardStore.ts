import { create } from 'zustand'
import { dispatchCommand } from '../adapters/commandGateway'
import type { WardAdapterSet } from '../adapters/createWardAdapters'
import type { WardEvent, WardEventSource } from '../adapters/contracts'
import { can, type Role } from '../domain/access'
import type { Bed } from '../domain/ward'
import { BED_FIXTURES } from '../mocks/fixtures'

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
  source: WardEventSource | null
  loadState: 'idle' | 'loading' | 'ready' | 'error'
  loadError: string | null
  commandError: string | null
  start: () => () => void
  setConnection: (connection: 'live' | 'disconnected') => void
  acknowledgeBed: (bedId: string, role: Role) => Promise<boolean>
}

let configuredAdapters: WardAdapterSet | null = null

export function configureWardDashboardAdapters(adapters: WardAdapterSet) {
  configuredAdapters = adapters
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
  loadState: 'idle',
  loadError: null,
  commandError: null,
  start: () => {
    const adapters = configuredAdapters
    if (!adapters) {
      set({ loadState: 'error', loadError: 'Ward runtime is not configured' })
      return () => undefined
    }
    const source = adapters.events
    const controller = new AbortController()
    let active = true
    let unsubscribe: (() => void) | null = null
    const handleEvent = (event: WardEvent) => {
      if (event.type === 'bed.updated') {
        set((state) => ({
          beds: state.beds.map((bed) => {
            if (bed.id !== event.bed.id) return bed
            const acknowledgement = bed.acknowledgement === 'none' ? event.bed.acknowledgement : bed.acknowledgement
            return { ...event.bed, acknowledgement }
          }),
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
    }
    const connectSource = () => {
      if (!active) return
      unsubscribe = source.subscribe(handleEvent)
      set({ source })
      source.connect()
    }
    set({ source: null, connection: 'connecting', loadState: 'loading', loadError: null })
    void adapters.rest.getWard(controller.signal).then((snapshot) => {
      if (!active) return
      set({ beds: snapshot.beds, loadState: 'ready', loadError: null })
      connectSource()
    }).catch((error: unknown) => {
      if (!active || (error instanceof DOMException && error.name === 'AbortError')) return
      set({
        loadState: 'error',
        loadError: error instanceof Error ? error.message : 'Ward data could not be loaded',
      })
      connectSource()
    })
    return () => {
      active = false
      controller.abort()
      unsubscribe?.()
      source.disconnect()
      if (get().source === source) set({ source: null })
    }
  },
  setConnection: (connection) => {
    const source = get().source
    if (source) {
      if (connection === 'live') source.connect()
      else source.disconnect()
      return
    }
    const occurredAt = Date.now()
    const message = connection === 'live' ? 'Live ward connection restored' : 'Ward connection lost; last readings frozen'
    set((state) => ({
      connection,
      beds: state.beds.map((bed) => ({ ...bed, connection })),
      activities: [activity({ bedId: null, kind: 'system', priority: connection === 'live' ? 'none' : 'high', message, occurredAt }), ...state.activities].slice(0, 30),
    }))
  },
  acknowledgeBed: async (bedId, role) => {
    const target = get().beds.find((bed) => bed.id === bedId)
    if (!target) return false
    if (!can(role, 'acknowledge_alert')) {
      set({ commandError: 'Your current role cannot acknowledge alerts.' })
      return false
    }
    if (target.acknowledgement === 'acknowledged') return true
    if (target.acknowledgement === 'pending') return false
    set((state) => ({
      commandError: null,
      beds: state.beds.map((bed) => bed.id === bedId ? { ...bed, acknowledgement: 'pending' } : bed),
    }))
    if (!await dispatchCommand({ type: 'acknowledge_alert', bedId })) {
      set((state) => ({
        commandError: `${target.label} acknowledgement failed. The alert remains unacknowledged.`,
        beds: state.beds.map((bed) => bed.id === bedId && bed.acknowledgement === 'pending' ? { ...bed, acknowledgement: 'none' } : bed),
      }))
      return false
    }
    set((state) => ({
      beds: state.beds.map((bed) => bed.id === bedId ? { ...bed, acknowledgement: 'acknowledged' } : bed),
      activities: [activity({ bedId, kind: 'acknowledgement', priority: target.priority, message: `${target.label} alert acknowledged`, occurredAt: Date.now() }), ...state.activities].slice(0, 30),
    }))
    return true
  },
}))
