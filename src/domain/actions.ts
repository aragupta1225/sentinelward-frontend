import type { Role } from './access'

export type BedActionType = 'alert_created' | 'alert_escalated' | 'response_acknowledged' | 'patient_ok' | 'patient_not_ok' | 'manual_reading_recorded' | 'device_isolated' | 'action_undone'

export interface BedAction {
  id: string
  bedId: string
  type: BedActionType
  description: string
  actor: string
  actorRole: Role | 'system'
  occurredAt: number
  automatic: boolean
  undoable: boolean
  referencesActionId: string | null
}

export interface BedResponseState {
  responseAcknowledgedAt: number | null
  bedsideStatus: 'pending' | 'patient_ok' | 'patient_not_ok'
  bedsideConfirmedAt: number | null
}

export interface ManualReading {
  id: string
  bedId: string
  heartRate: number
  spo2: number
  notes: string
  recordedBy: string
  recordedAt: number
}
