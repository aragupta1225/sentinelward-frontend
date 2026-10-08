import { create } from 'zustand'
import { can, type Role } from '../domain/access'
import type { IncidentEvidence, SecurityIncident } from '../domain/security'
import { useWardDashboardStore, type WardActivity } from './wardDashboardStore'
import { dispatchCommand } from '../adapters/commandGateway'

interface SecurityState {
  incidents: SecurityIncident[]
  captureEvidence: (bedId: string, role: Role) => Promise<void>
  containIncident: (bedId: string, role: Role) => Promise<void>
  resolveIncident: (bedId: string, role: Role) => Promise<boolean>
}

let evidenceSequence = 10
let activitySequence = 100

function appendActivity(bedId: string, message: string, priority: WardActivity['priority']) {
  activitySequence += 1
  const entry: WardActivity = { id: `security-${activitySequence}`, bedId, kind: 'system', priority, message, occurredAt: Date.now() }
  useWardDashboardStore.setState((ward) => ({ activities: [entry, ...ward.activities].slice(0, 30) }))
}

const initialIncidents: SecurityIncident[] = [
  { id: 'INC-B07', bedId: 'B07', verdict: 'TAMPERING', severity: 'medium', status: 'open', summary: 'Flatline conflicts with trusted pulse signal', detectedAt: Date.now() - 180_000, containedAt: null, resolvedAt: null, evidence: [{ id: 'EV-7', kind: 'signal_snapshot', label: 'Last trusted ECG and PPG snapshot', capturedAt: Date.now() - 184_000, source: 'automatic' }] },
  { id: 'INC-B08', bedId: 'B08', verdict: 'BOTH', severity: 'high', status: 'contained', summary: 'Clinical emergency with concurrent device compromise', detectedAt: Date.now() - 90_000, containedAt: Date.now() - 86_000, resolvedAt: null, evidence: [{ id: 'EV-8', kind: 'action_record', label: 'Automatic isolation action record', capturedAt: Date.now() - 86_000, source: 'automatic' }] },
  { id: 'INC-B09', bedId: 'B09', verdict: 'DEVICE_ATTACK', severity: 'high', status: 'contained', summary: 'Malicious traffic detected from bedside device', detectedAt: Date.now() - 240_000, containedAt: Date.now() - 235_000, resolvedAt: null, evidence: [{ id: 'EV-9', kind: 'network_summary', label: 'Provisional network event summary', capturedAt: Date.now() - 238_000, source: 'automatic' }] },
]

export const useSecurityStore = create<SecurityState>((set, get) => ({
  incidents: initialIncidents,
  captureEvidence: async (bedId, role) => {
    if (!can(role, 'capture_incident_evidence')) return
    const incident = get().incidents.find((item) => item.bedId === bedId)
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === bedId)
    if (!incident || !bed) return
    if (!await dispatchCommand({ type: 'capture_evidence', bedId })) return
    evidenceSequence += 1
    const evidence: IncidentEvidence = { id: `EV-${evidenceSequence}`, kind: 'signal_snapshot', label: `Signal snapshot · trust ${bed.trust}% · ${bed.verdict}`, capturedAt: Date.now(), source: 'manual' }
    set((state) => ({ incidents: state.incidents.map((item) => item.bedId === bedId ? { ...item, evidence: [...item.evidence, evidence] } : item) }))
    appendActivity(bedId, `${evidence.id} captured for ${incident.id}`, incident.severity)
  },
  containIncident: async (bedId, role) => {
    if (!can(role, 'contain_incident')) return
    const incident = get().incidents.find((item) => item.bedId === bedId)
    if (!incident || incident.status !== 'open') return
    if (!await dispatchCommand({ type: 'contain_incident', bedId })) return
    const now = Date.now()
    set((state) => ({ incidents: state.incidents.map((item) => item.bedId === bedId ? { ...item, status: 'contained', containedAt: now } : item) }))
    useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === bedId ? { ...bed, isolated: true, verdict: bed.priority === 'high' ? 'BOTH' : bed.verdict } : bed) }))
    appendActivity(bedId, `${incident.id} contained; device isolated without treatment changes`, incident.severity)
  },
  resolveIncident: async (bedId, role) => {
    if (!can(role, 'resolve_incident')) return false
    const incident = get().incidents.find((item) => item.bedId === bedId)
    if (!incident || incident.status !== 'contained' || incident.evidence.length === 0) return false
    if (!await dispatchCommand({ type: 'resolve_incident', bedId })) return false
    set((state) => ({ incidents: state.incidents.map((item) => item.bedId === bedId ? { ...item, status: 'resolved', resolvedAt: Date.now() } : item) }))
    appendActivity(bedId, `${incident.id} marked resolved; device trust remains unchanged pending backend recovery rules`, incident.severity)
    return true
  },
}))
