import { create } from 'zustand'
import { can, type Role } from '../domain/access'
import type { BedAction, BedActionType, BedResponseState, ManualReading } from '../domain/actions'
import { useWardDashboardStore } from './wardDashboardStore'
import { dispatchCommand } from '../adapters/commandGateway'
import { useAlertStore } from './alertStore'

export interface ManualReadingInput {
  heartRate: number
  spo2: number
  notes: string
}

interface BedDetailState {
  currentRole: Role
  responses: Record<string, BedResponseState>
  actions: BedAction[]
  manualReadings: Record<string, ManualReading[]>
  nextManualCheckAt: Record<string, number>
  pendingCommand: 'escalate' | 'manual-reading' | null
  commandError: string | null
  setRole: (role: Role) => void
  acknowledgeResponse: (bedId: string) => Promise<void>
  escalateAlert: (bedId: string) => Promise<boolean>
  confirmPatient: (bedId: string, status: 'patient_ok' | 'patient_not_ok') => Promise<void>
  recordManualReading: (bedId: string, reading: ManualReadingInput) => Promise<boolean>
  isolateDevice: (bedId: string) => Promise<void>
  undoAction: (actionId: string) => Promise<void>
}

let sequence = 10
let manualReadingSequence = 0
const responseFor = (state: BedDetailState, bedId: string): BedResponseState => state.responses[bedId] ?? { responseAcknowledgedAt: null, bedsideStatus: 'pending', bedsideConfirmedAt: null }
const actor = (role: Role) => role === 'operator' ? 'Demo operator' : 'Antara Gupta'
const isClinicalRole = (role: Role) => role === 'nurse'

function newAction(input: Omit<BedAction, 'id'>): BedAction {
  sequence += 1
  return { ...input, id: `action-${sequence}` }
}

function appendUserAction(state: BedDetailState, bedId: string, type: BedActionType, description: string, undoable = false, referencesActionId: string | null = null) {
  return [newAction({ bedId, type, description, actor: actor(state.currentRole), actorRole: state.currentRole, occurredAt: Date.now(), automatic: false, undoable, referencesActionId }), ...state.actions]
}

const initialActions: BedAction[] = [
  { id: 'action-1', bedId: 'B08', type: 'device_isolated', description: 'Compromised device isolated automatically; treatment systems untouched', actor: 'SentinelWard', actorRole: 'system', occurredAt: Date.now() - 48_000, automatic: true, undoable: true, referencesActionId: null },
  { id: 'action-2', bedId: 'B08', type: 'alert_created', description: 'Clinical emergency retained while device threat was contained', actor: 'SentinelWard', actorRole: 'system', occurredAt: Date.now() - 50_000, automatic: true, undoable: false, referencesActionId: null },
  { id: 'action-3', bedId: 'B03', type: 'alert_created', description: 'High clinical alert created from trusted vital signs', actor: 'SentinelWard', actorRole: 'system', occurredAt: Date.now() - 80_000, automatic: true, undoable: false, referencesActionId: null },
]

export const useBedDetailStore = create<BedDetailState>((set, get) => ({
  currentRole: 'nurse', responses: {}, actions: initialActions, manualReadings: {}, nextManualCheckAt: {}, pendingCommand: null, commandError: null,
  setRole: (currentRole) => set({ currentRole }),
  acknowledgeResponse: async (bedId) => {
    const state = get()
    if (!isClinicalRole(state.currentRole) || !can(state.currentRole, 'acknowledge_alert')) return
    const current = responseFor(state, bedId)
    if (current.responseAcknowledgedAt) return
    if (!await useWardDashboardStore.getState().acknowledgeBed(bedId, state.currentRole)) return
    const occurredAt = Date.now()
    set({ responses: { ...state.responses, [bedId]: { ...current, responseAcknowledgedAt: occurredAt } }, actions: appendUserAction(state, bedId, 'response_acknowledged', 'On my way response recorded') })
  },
  escalateAlert: async (bedId) => {
    const state = get()
    if (!isClinicalRole(state.currentRole)) return false
    const alert = useAlertStore.getState().alerts.find((item) => item.bedId === bedId && item.status === 'open')
    if (!alert) {
      set({ commandError: 'No open alert is available to escalate.' })
      return false
    }
    set({ pendingCommand: 'escalate', commandError: null })
    if (!await dispatchCommand({ type: 'escalate_alert', alertId: alert.id, bedId })) {
      set({ pendingCommand: null, commandError: 'Escalation failed. The current response ladder remains unchanged.' })
      return false
    }
    const occurredAt = Date.now()
    useAlertStore.getState().escalateAlert(alert.id, occurredAt)
    set({ actions: appendUserAction(state, bedId, 'alert_escalated', 'Alert manually escalated to the next responder'), pendingCommand: null })
    return true
  },
  confirmPatient: async (bedId, status) => {
    const state = get()
    if (!isClinicalRole(state.currentRole) || !can(state.currentRole, 'confirm_bedside_status')) return
    const current = responseFor(state, bedId)
    const occurredAt = Date.now()
    if (!await dispatchCommand({ type: 'confirm_bedside', bedId, status })) return
    if (status === 'patient_not_ok') {
      useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === bedId ? {
        ...bed, priority: 'high', verdict: bed.verdict === 'TAMPERING' || bed.verdict === 'DEVICE_ATTACK' ? 'BOTH' : 'EMERGENCY',
        reason: 'Patient confirmed NOT OK at bedside', requestedAction: 'Immediate clinical assessment required',
      } : bed) }))
    }
    set({ responses: { ...state.responses, [bedId]: { ...current, bedsideStatus: status, bedsideConfirmedAt: occurredAt } }, actions: appendUserAction(state, bedId, status, status === 'patient_ok' ? 'Patient confirmed OK at bedside' : 'Patient confirmed NOT OK; high alert raised') })
  },
  recordManualReading: async (bedId, reading) => {
    const state = get()
    if (!isClinicalRole(state.currentRole)) return false
    if (reading.heartRate < 20 || reading.heartRate > 250 || reading.spo2 < 50 || reading.spo2 > 100) {
      set({ commandError: 'Enter a heart rate from 20–250 and SpO₂ from 50–100.' })
      return false
    }
    set({ pendingCommand: 'manual-reading', commandError: null })
    if (!await dispatchCommand({ type: 'record_manual_reading', bedId, ...reading })) {
      set({ pendingCommand: null, commandError: 'Hand check could not be recorded. No reading was saved.' })
      return false
    }
    const recordedAt = Date.now()
    manualReadingSequence += 1
    const manualReading: ManualReading = {
      id: `manual-reading-${manualReadingSequence}`, bedId, ...reading,
      recordedBy: actor(state.currentRole), recordedAt,
    }
    set({
      manualReadings: { ...state.manualReadings, [bedId]: [manualReading, ...(state.manualReadings[bedId] ?? [])] },
      nextManualCheckAt: { ...state.nextManualCheckAt, [bedId]: recordedAt + 300_000 },
      actions: appendUserAction(state, bedId, 'manual_reading_recorded', `Hand check recorded: HR ${reading.heartRate}, SpO₂ ${reading.spo2}`),
      pendingCommand: null,
    })
    return true
  },
  isolateDevice: async (bedId) => {
    const state = get()
    if (!can(state.currentRole, 'isolate_device')) return
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === bedId)
    if (!bed || bed.isolated) return
    if (!await dispatchCommand({ type: 'isolate_device', deviceId: `MON-${bedId.slice(1)}`, bedId })) return
    useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((item) => item.id === bedId ? { ...item, isolated: true } : item) }))
    set({ actions: appendUserAction(state, bedId, 'device_isolated', 'Device isolation requested; treatment systems untouched', true) })
  },
  undoAction: async (actionId) => {
    const state = get()
    if (!can(state.currentRole, 'undo_isolation')) return
    const original = state.actions.find((action) => action.id === actionId)
    if (!original?.undoable || original.type !== 'device_isolated') return
    const alreadyUndone = state.actions.some((action) => action.type === 'action_undone' && action.referencesActionId === actionId)
    if (alreadyUndone) return
    if (!await dispatchCommand({ type: 'undo_action', bedId: original.bedId, originalActionId: actionId })) return
    useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === original.bedId ? { ...bed, isolated: false } : bed) }))
    set({ actions: appendUserAction(state, original.bedId, 'action_undone', `Isolation action ${actionId} undone; original retained`, false, actionId) })
  },
}))

export function resetBedDetailStore() {
  useBedDetailStore.setState({
    currentRole: 'nurse', responses: {}, actions: structuredClone(initialActions), manualReadings: {},
    nextManualCheckAt: {}, pendingCommand: null, commandError: null,
  })
}
