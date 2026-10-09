import type { AlarmPriority, Verdict } from './ward'

export type AlertStatus = 'open' | 'acknowledged'
export type LadderStep = 1 | 2 | 3

export interface AlertResponseEvent {
  id: string
  occurredAt: number
  message: string
}

export interface WardAlert {
  id: string
  eventKey: string
  bedId: string
  bedLabel: string
  verdict: Verdict
  priority: Exclude<AlarmPriority, 'none'>
  reason: string
  assignedTo: string
  status: AlertStatus
  openedAt: number
  updatedAt: number
  ladderStep: LadderStep
  acknowledgedBy: string | null
  acknowledgedAt: number | null
  telegramMessage: string
  responseHistory: AlertResponseEvent[]
}

export interface IncomingWardAlert {
  eventKey: string
  bedId: string
  bedLabel: string
  verdict: Verdict
  priority: Exclude<AlarmPriority, 'none'>
  reason: string
  assignedTo: string
  occurredAt: number
  telegramMessage: string
  integrityOnly?: boolean
}

export const ALERT_LADDER = ['Nurse Priya', 'Nurse Ravi', 'All nurses + doctor'] as const

export function ladderStepAt(alert: Pick<WardAlert, 'priority' | 'openedAt' | 'status' | 'ladderStep'>, now: number): LadderStep {
  if (alert.status === 'acknowledged' || alert.priority !== 'high') return alert.ladderStep
  return Math.min(3, 1 + Math.floor(Math.max(0, now - alert.openedAt) / 30_000)) as LadderStep
}
