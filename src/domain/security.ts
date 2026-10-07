import type { AlarmPriority, Verdict } from './ward'

export interface IncidentEvidence {
  id: string
  kind: 'signal_snapshot' | 'network_summary' | 'action_record'
  label: string
  capturedAt: number
  source: 'automatic' | 'manual'
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
}
