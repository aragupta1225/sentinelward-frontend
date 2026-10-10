import { create } from 'zustand'
import { dispatchCommand } from '../adapters/commandGateway'
import { can, type Role } from '../domain/access'
import type { AttackFeedEvent, IncidentEvidence, NetworkPoint, SecurityDevice, SecurityIncident } from '../domain/security'
import { useBedDetailStore } from './bedDetailStore'
import { useWardDashboardStore, type WardActivity } from './wardDashboardStore'

interface SecurityState {
  devices: SecurityDevice[]
  incidents: SecurityIncident[]
  selectedDeviceId: string
  attackFeed: AttackFeedEvent[]
  fleetHuntDeviceIds: string[]
  commandError: string | null
  selectDevice: (deviceId: string) => void
  fleetHunt: (model: string) => Promise<boolean>
  isolateDevice: (deviceId: string, role: Role) => Promise<boolean>
  undoIsolation: (deviceId: string, actionId: string, role: Role) => Promise<boolean>
  captureEvidence: (bedId: string, role: Role) => Promise<void>
  containIncident: (bedId: string, role: Role) => Promise<void>
  resolveIncident: (bedId: string, role: Role, reason?: string) => Promise<boolean>
}

const ago = (milliseconds: number) => Date.now() - milliseconds
const fingerprint = (seed: string) => `${seed.padEnd(8, '0')}a94d3f21c8b7e6d5f4a392817061504f3e2d1c0b9a887766554433221100ffee`.slice(0, 64)
const evidence = (id: string, kind: IncidentEvidence['kind'], label: string, capturedAt: number, source: IncidentEvidence['source'], filename: string): IncidentEvidence => ({
  id, kind, label, capturedAt, source, filename, sizeBytes: kind === 'network_summary' ? 186_420 : 94_280, sha256: fingerprint(id.toLowerCase()),
})

const initialDevices: SecurityDevice[] = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0')
  const attacked = number === '07' || number === '08' || number === '09'
  return {
    id: `MON-${number}`, bedId: `B${number}`, model: index < 9 ? 'SimMon v2' : 'SimMon v3', firmware: index < 9 ? '1.4' : '2.1',
    messageRate: attacked && number === '07' ? 4.8 : 1, fresh: true, networkScore: attacked ? Number(`0.${number}`) : 0.96,
    replayScore: number === '07' ? 0.998 : attacked ? 0.87 : 0.04, status: number === '08' || number === '09' ? 'isolated' : number === '07' ? 'watch' : 'healthy',
  }
})

const initialIncidents: SecurityIncident[] = [
  {
    id: 'INC-B07', bedId: 'B07', verdict: 'TAMPERING', severity: 'medium', status: 'open', summary: 'Replay attack suspected on MON-07', detectedAt: ago(180_000), containedAt: null, resolvedAt: null, affectedBeds: ['B07'],
    evidence: [evidence('EV-7', 'signal_snapshot', 'Last trusted ECG and PPG snapshot', ago(184_000), 'automatic', 'bed-07-readings.json')],
    timeline: [{ id: 'TL-7-1', occurredAt: ago(180_000), description: 'Replay match 0.998 detected', actor: 'Integrity agent M4', evidenceId: 'EV-7' }],
  },
  {
    id: 'INC-B08', bedId: 'B08', verdict: 'BOTH', severity: 'high', status: 'contained', summary: 'Clinical emergency with concurrent device compromise', detectedAt: ago(90_000), containedAt: ago(86_000), resolvedAt: null, affectedBeds: ['B08'],
    evidence: [evidence('EV-8', 'action_record', 'Automatic isolation action record', ago(86_000), 'automatic', 'isolation-action.json')],
    timeline: [{ id: 'TL-8-1', occurredAt: ago(90_000), description: 'Device compromise detected while clinical alarm stayed active', actor: 'SentinelWard', evidenceId: 'EV-8' }, { id: 'TL-8-2', occurredAt: ago(86_000), description: 'Device isolated; treatment systems untouched', actor: 'Containment agent A2', evidenceId: 'EV-8' }],
  },
  {
    id: 'INC-B09', bedId: 'B09', verdict: 'DEVICE_ATTACK', severity: 'high', status: 'contained', summary: 'Malicious traffic detected from bedside device', detectedAt: ago(240_000), containedAt: ago(235_000), resolvedAt: null, affectedBeds: ['B09'],
    evidence: [evidence('EV-9', 'network_summary', 'Ten-minute network witness', ago(238_000), 'automatic', 'mon-09-network.json')],
    timeline: [{ id: 'TL-9-1', occurredAt: ago(240_000), description: 'Abnormal sender timing detected', actor: 'Network agent M5', evidenceId: 'EV-9' }, { id: 'TL-9-2', occurredAt: ago(235_000), description: 'Device isolated', actor: 'Containment agent A2', evidenceId: null }],
  },
]

const initialAttackFeed: AttackFeedEvent[] = [
  { id: 'FEED-1', deviceId: 'MON-07', bedId: 'B07', occurredAt: ago(180_000), message: 'Replay match 0.998 detected (M4)', actionId: null },
  { id: 'FEED-2', deviceId: 'MON-08', bedId: 'B08', occurredAt: ago(86_000), message: 'Device cut off; emergency remained active (A2)', actionId: 'action-1' },
  { id: 'FEED-3', deviceId: 'MON-07', bedId: 'B07', occurredAt: ago(170_000), message: 'Evidence frozen (A3)', actionId: null },
]

let evidenceSequence = 10
let activitySequence = 100
let actionSequence = 200

function appendActivity(bedId: string, message: string, priority: WardActivity['priority']) {
  activitySequence += 1
  const entry: WardActivity = { id: `security-${activitySequence}`, bedId, kind: 'system', priority, message, occurredAt: Date.now() }
  useWardDashboardStore.setState((ward) => ({ activities: [entry, ...ward.activities].slice(0, 30) }))
}

export function networkHistoryFor(device: SecurityDevice, now = Date.now()): NetworkPoint[] {
  return Array.from({ length: 10 }, (_, index) => ({
    timestamp: now - (9 - index) * 60_000,
    messageRate: Number(Math.max(0, device.messageRate + Math.sin(index + Number(device.id.slice(-2))) * (device.status === 'healthy' ? 0.08 : 0.7)).toFixed(2)),
    networkScore: Number(Math.max(0, Math.min(1, device.networkScore + Math.cos(index) * 0.03)).toFixed(2)),
  }))
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  devices: initialDevices,
  incidents: initialIncidents,
  selectedDeviceId: 'MON-07',
  attackFeed: initialAttackFeed,
  fleetHuntDeviceIds: [],
  commandError: null,
  selectDevice: (selectedDeviceId) => set({ selectedDeviceId }),
  fleetHunt: async (model) => {
    set({ commandError: null })
    if (!await dispatchCommand({ type: 'fleet_hunt', model })) { set({ commandError: 'Fleet hunt failed. No device state changed.' }); return false }
    set({ fleetHuntDeviceIds: get().devices.filter((device) => device.model === model).map((device) => device.id) })
    return true
  },
  isolateDevice: async (deviceId, role) => {
    if (!can(role, 'isolate_device')) return false
    const device = get().devices.find((item) => item.id === deviceId)
    if (!device || device.status === 'isolated') return false
    if (!await dispatchCommand({ type: 'isolate_device', deviceId, bedId: device.bedId })) { set({ commandError: 'Device isolation failed. Network access remains unchanged.' }); return false }
    actionSequence += 1
    const now = Date.now()
    const actionId = `security-action-${actionSequence}`
    set((state) => ({
      devices: state.devices.map((item) => item.id === deviceId ? { ...item, status: 'isolated' } : item), commandError: null,
      attackFeed: [{ id: `FEED-${now}`, deviceId, bedId: device.bedId, occurredAt: now, message: 'Device cut off by IT; treatment systems untouched', actionId }, ...state.attackFeed],
    }))
    useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === device.bedId ? { ...bed, isolated: true } : bed) }))
    useBedDetailStore.setState((state) => ({ actions: [{ id: actionId, bedId: device.bedId, type: 'device_isolated', description: `${device.id} cut off from network; treatment systems untouched`, actor: 'Antara Gupta', actorRole: role, occurredAt: now, automatic: false, undoable: true, referencesActionId: null }, ...state.actions] }))
    appendActivity(device.bedId, `${device.id} isolated by IT`, 'none')
    return true
  },
  undoIsolation: async (deviceId, actionId, role) => {
    if (!can(role, 'undo_isolation')) return false
    const device = get().devices.find((item) => item.id === deviceId)
    if (!device || device.status !== 'isolated') return false
    if (!await dispatchCommand({ type: 'undo_action', bedId: device.bedId, originalActionId: actionId })) return false
    const now = Date.now()
    set((state) => ({ devices: state.devices.map((item) => item.id === deviceId ? { ...item, status: 'watch' } : item), attackFeed: [{ id: `FEED-${now}`, deviceId, bedId: device.bedId, occurredAt: now, message: `Reconnect recorded; original action ${actionId} retained`, actionId: null }, ...state.attackFeed] }))
    useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === device.bedId ? { ...bed, isolated: false } : bed) }))
    useBedDetailStore.setState((state) => ({ actions: [{ id: `security-undo-${now}`, bedId: device.bedId, type: 'action_undone', description: `Isolation action ${actionId} undone; original retained`, actor: 'Antara Gupta', actorRole: role, occurredAt: now, automatic: false, undoable: false, referencesActionId: actionId }, ...state.actions] }))
    return true
  },
  captureEvidence: async (bedId, role) => {
    if (!can(role, 'capture_incident_evidence')) return
    const incident = get().incidents.find((item) => item.bedId === bedId)
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === bedId)
    if (!incident || !bed || !await dispatchCommand({ type: 'capture_evidence', bedId })) return
    evidenceSequence += 1
    const now = Date.now()
    const next = evidence(`EV-${evidenceSequence}`, 'signal_snapshot', `Signal snapshot · trust ${bed.trust}% · ${bed.verdict}`, now, 'manual', `${bedId.toLowerCase()}-signal-snapshot.json`)
    set((state) => ({ incidents: state.incidents.map((item) => item.bedId === bedId ? { ...item, evidence: [...item.evidence, next], timeline: [...item.timeline, { id: `TL-${bedId}-${now}`, occurredAt: now, description: `${next.id} captured and fingerprinted`, actor: 'Antara Gupta', evidenceId: next.id }] } : item) }))
    appendActivity(bedId, `${next.id} captured for ${incident.id}`, incident.severity)
  },
  containIncident: async (bedId, role) => {
    if (!can(role, 'contain_incident')) return
    const incident = get().incidents.find((item) => item.bedId === bedId)
    if (!incident || incident.status !== 'open' || !await dispatchCommand({ type: 'contain_incident', bedId })) return
    const now = Date.now()
    set((state) => ({ incidents: state.incidents.map((item) => item.bedId === bedId ? { ...item, status: 'contained', containedAt: now, timeline: [...item.timeline, { id: `TL-${bedId}-${now}`, occurredAt: now, description: 'Incident contained and device isolated', actor: 'Antara Gupta', evidenceId: null }] } : item), devices: state.devices.map((device) => device.bedId === bedId ? { ...device, status: 'isolated' } : device) }))
    useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === bedId ? { ...bed, isolated: true, verdict: bed.priority === 'high' ? 'BOTH' : bed.verdict } : bed) }))
    appendActivity(bedId, `${incident.id} contained; treatment unchanged`, incident.severity)
  },
  resolveIncident: async (bedId, role, reason = 'Investigation complete') => {
    if (!can(role, 'resolve_incident') || !reason.trim()) return false
    const incident = get().incidents.find((item) => item.bedId === bedId)
    if (!incident || incident.status !== 'contained' || incident.evidence.length === 0 || !await dispatchCommand({ type: 'resolve_incident', bedId, reason })) return false
    const now = Date.now()
    set((state) => ({ incidents: state.incidents.map((item) => item.bedId === bedId ? { ...item, status: 'resolved', resolvedAt: now, timeline: [...item.timeline, { id: `TL-${bedId}-${now}`, occurredAt: now, description: `Incident closed: ${reason.trim()}`, actor: 'Antara Gupta', evidenceId: null }] } : item) }))
    appendActivity(bedId, `${incident.id} resolved; device trust unchanged`, incident.severity)
    return true
  },
}))

export function resetSecurityStore() {
  useSecurityStore.setState({ devices: structuredClone(initialDevices), incidents: structuredClone(initialIncidents), selectedDeviceId: 'MON-07', attackFeed: structuredClone(initialAttackFeed), fleetHuntDeviceIds: [], commandError: null })
}
