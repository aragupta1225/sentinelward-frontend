import { create } from 'zustand'
import { dispatchCommand } from '../adapters/commandGateway'
import { ALERT_LADDER, ladderStepAt, type IncomingWardAlert, type LadderStep, type WardAlert } from '../domain/alerts'
import { useWardDashboardStore } from './wardDashboardStore'

interface AlertState {
  alerts: WardAlert[]
  clock: number
  pendingAlertId: string | null
  commandError: string | null
  advanceEscalations: (now?: number) => void
  acknowledgeAlert: (alertId: string, actor: string, now?: number) => Promise<boolean>
  recordAcknowledgementForBed: (bedId: string, actor: string, now?: number) => void
  receiveAlert: (incoming: IncomingWardAlert) => void
}

let responseSequence = 0

function response(message: string, occurredAt: number) {
  responseSequence += 1
  return { id: `alert-response-${responseSequence}`, occurredAt, message }
}

export function createInitialAlerts(now = Date.now()): WardAlert[] {
  return [
    {
      id: 'AL-B03', eventKey: 'B03-emergency-1', bedId: 'B03', bedLabel: 'Bed 3', verdict: 'EMERGENCY', priority: 'high',
      reason: 'Possible heart emergency. Go now.', assignedTo: ALERT_LADDER[0], status: 'open', openedAt: now - 35_000,
      updatedAt: now - 35_000, ladderStep: 1, acknowledgedBy: null, acknowledgedAt: null,
      telegramMessage: '🔴 Bed 3 — possible heart emergency. Go now.\nHR 148, SpO₂ 86, BP 94/60. Body and network both look real.',
      responseHistory: [response('Sent to Nurse Priya', now - 35_000)],
    },
    {
      id: 'AL-B08', eventKey: 'B08-both-1', bedId: 'B08', bedLabel: 'Bed 8', verdict: 'BOTH', priority: 'high',
      reason: 'Go now. Possible emergency on a monitor that may be tampered with.', assignedTo: ALERT_LADDER[0], status: 'open', openedAt: now - 12_000,
      updatedAt: now - 12_000, ladderStep: 1, acknowledgedBy: null, acknowledgedAt: null,
      telegramMessage: '🔴 Bed 8 — GO NOW. Do not trust the screen numbers. Possible emergency on a monitor that may be tampered with.',
      responseHistory: [response('Sent to Nurse Priya', now - 12_000)],
    },
    {
      id: 'AL-B07', eventKey: 'B07-tampering-1', bedId: 'B07', bedLabel: 'Bed 7', verdict: 'TAMPERING', priority: 'medium',
      reason: "Monitor can't be trusted. Check pulse and breathing by hand.", assignedTo: 'Bedside nurse', status: 'open', openedAt: now - 70_000,
      updatedAt: now - 70_000, ladderStep: 1, acknowledgedBy: null, acknowledgedAt: null,
      telegramMessage: "⚪ Bed 7 — monitor can't be trusted. Check pulse and breathing by hand. Use a portable monitor.",
      responseHistory: [response('Sent to bedside nurse', now - 70_000)],
    },
    {
      id: 'AL-B04', eventKey: 'B04-loose-1', bedId: 'B04', bedLabel: 'Bed 4', verdict: 'LOOSE_SENSOR', priority: 'low',
      reason: 'Finger sensor loose. Please refit the clip.', assignedTo: 'Bedside nurse', status: 'acknowledged', openedAt: now - 150_000,
      updatedAt: now - 120_000, ladderStep: 1, acknowledgedBy: 'Nurse Priya', acknowledgedAt: now - 120_000,
      telegramMessage: '✅ Acknowledged by Nurse Priya. Bed 4 — finger sensor loose. False alarm silenced. Please refit the clip.',
      responseHistory: [response('Sent to bedside nurse', now - 150_000), response('Acknowledged by Nurse Priya', now - 120_000)],
    },
  ]
}

function ladderRecipient(step: LadderStep) {
  return ALERT_LADDER[step - 1]
}

function acknowledge(alert: WardAlert, actor: string, now: number): WardAlert {
  if (alert.status === 'acknowledged') return alert
  return {
    ...alert,
    status: 'acknowledged',
    acknowledgedBy: actor,
    acknowledgedAt: now,
    updatedAt: now,
    telegramMessage: `✅ Acknowledged by ${actor}. ${alert.telegramMessage.replace(/^✅[^.]+\.\s*/, '')}`,
    responseHistory: [...alert.responseHistory, response(`Acknowledged by ${actor}`, now)],
  }
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: createInitialAlerts(),
  clock: Date.now(),
  pendingAlertId: null,
  commandError: null,
  advanceEscalations: (now = Date.now()) => {
    set((state) => ({
      clock: now,
      alerts: state.alerts.map((alert) => {
        const nextStep = ladderStepAt(alert, now)
        if (nextStep === alert.ladderStep) return alert
        const events = [...alert.responseHistory]
        for (let step = alert.ladderStep + 1; step <= nextStep; step += 1) {
          events.push(response(`Escalated to ${ladderRecipient(step as LadderStep)}`, alert.openedAt + (step - 1) * 30_000))
        }
        return { ...alert, ladderStep: nextStep, assignedTo: ladderRecipient(nextStep), updatedAt: now, responseHistory: events }
      }),
    }))
  },
  acknowledgeAlert: async (alertId, actor, now = Date.now()) => {
    const target = get().alerts.find((alert) => alert.id === alertId)
    if (!target) return false
    if (target.status === 'acknowledged') return true
    set({ pendingAlertId: alertId, commandError: null })
    if (!await dispatchCommand({ type: 'acknowledge_alert', bedId: target.bedId })) {
      set({ pendingAlertId: null, commandError: `${target.bedLabel} acknowledgement failed. The alert remains open.` })
      return false
    }
    set((state) => ({ alerts: state.alerts.map((alert) => alert.id === alertId ? acknowledge(alert, actor, now) : alert), pendingAlertId: null }))
    useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === target.bedId ? { ...bed, acknowledgement: 'acknowledged' } : bed) }))
    return true
  },
  recordAcknowledgementForBed: (bedId, actor, now = Date.now()) => {
    set((state) => ({ alerts: state.alerts.map((alert) => alert.bedId === bedId && alert.status === 'open' ? acknowledge(alert, actor, now) : alert) }))
  },
  receiveAlert: (incoming) => {
    if (incoming.integrityOnly) return
    set((state) => {
      const existing = state.alerts.find((alert) => alert.eventKey === incoming.eventKey)
      if (existing) {
        return { alerts: state.alerts.map((alert) => alert.eventKey === incoming.eventKey ? { ...alert, reason: incoming.reason, telegramMessage: incoming.telegramMessage, updatedAt: incoming.occurredAt } : alert) }
      }
      const alert: WardAlert = {
        id: `AL-${incoming.eventKey}`, eventKey: incoming.eventKey, bedId: incoming.bedId, bedLabel: incoming.bedLabel,
        verdict: incoming.verdict, priority: incoming.priority, reason: incoming.reason, assignedTo: incoming.assignedTo,
        status: 'open', openedAt: incoming.occurredAt, updatedAt: incoming.occurredAt, ladderStep: 1,
        acknowledgedBy: null, acknowledgedAt: null, telegramMessage: incoming.telegramMessage,
        responseHistory: [response(`Sent to ${incoming.assignedTo}`, incoming.occurredAt)],
      }
      return { alerts: [alert, ...state.alerts] }
    })
  },
}))

export function resetAlertStore(now = Date.now()) {
  useAlertStore.setState({ alerts: createInitialAlerts(now), clock: now, pendingAlertId: null, commandError: null })
}
