import type { AlarmPriority, Verdict } from './ward'

export interface IncidentEvidence {
  id: string
  kind: 'signal_snapshot' | 'network_summary' | 'action_record'
  label: string
  capturedAt: number
  source: 'automatic' | 'manual'
  filename: string
  sizeBytes: number
  sha256: string
}

export interface IncidentTimelineEvent {
  id: string
  occurredAt: number
  description: string
  actor: string
  evidenceId: string | null
}

export interface SecurityIncident {
  id: string
  bedId: string
  verdict: Verdict
  severity: Exclude<AlarmPriority, 'none' | 'low'>
  status: 'open' | 'contained' | 'resolved'
  summary: string
  detectedAt: number
  containedAt: number | null
  resolvedAt: number | null
  evidence: IncidentEvidence[]
  affectedBeds: string[]
  timeline: IncidentTimelineEvent[]
}

export interface SecurityDevice {
  id: string
  bedId: string
  model: string
  firmware: string
  messageRate: number
  fresh: boolean
  networkScore: number
  replayScore: number
  status: 'healthy' | 'watch' | 'isolated'
}

export interface NetworkPoint { timestamp: number; messageRate: number; networkScore: number }

export interface AttackFeedEvent {
  id: string
  deviceId: string
  bedId: string
  occurredAt: number
  message: string
  actionId: string | null
}

export interface CertReportDraft {
  incidentId: string
  organisation: string
  contact: string
  noticedAt: string
  occurredAt: string
  incidentType: string
  affectedSystems: string
  description: string
  actionsTaken: string
  evidenceList: string
  factsChecked: boolean
  evidenceAttached: boolean
  approver: string
  savedAt: number | null
  sentAt: number | null
  sentBy: string | null
}
