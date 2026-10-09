import { beforeEach, describe, expect, it } from 'vitest'
import { configureCommandAdapter } from '../adapters/commandGateway'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'
import type { IncomingWardAlert } from '../domain/alerts'
import { resetAlertStore, useAlertStore } from './alertStore'

const BASE_TIME = 1_000_000

function incoming(overrides: Partial<IncomingWardAlert> = {}): IncomingWardAlert {
  return {
    eventKey: 'B02-emergency-1', bedId: 'B02', bedLabel: 'Bed 2', verdict: 'EMERGENCY', priority: 'high',
    reason: 'Possible emergency.', assignedTo: 'Nurse Priya', occurredAt: BASE_TIME,
    telegramMessage: '🔴 Bed 2 — possible emergency.', ...overrides,
  }
}

describe('alert escalation state', () => {
  beforeEach(() => {
    configureCommandAdapter(new MockCommandAdapter())
    resetAlertStore(BASE_TIME)
  })

  it('advances a high alert at exactly 30 and 60 seconds', () => {
    useAlertStore.getState().advanceEscalations(BASE_TIME + 17_999)
    expect(useAlertStore.getState().alerts.find((alert) => alert.id === 'AL-B08')?.ladderStep).toBe(1)

    useAlertStore.getState().advanceEscalations(BASE_TIME + 18_000)
    let alert = useAlertStore.getState().alerts.find((item) => item.id === 'AL-B08')!
    expect(alert.ladderStep).toBe(2)
    expect(alert.assignedTo).toBe('Nurse Ravi')

    useAlertStore.getState().advanceEscalations(BASE_TIME + 48_000)
    alert = useAlertStore.getState().alerts.find((item) => item.id === 'AL-B08')!
    expect(alert.ladderStep).toBe(3)
    expect(alert.assignedTo).toBe('All nurses + doctor')
    expect(alert.responseHistory.map((event) => event.message)).toEqual([
      'Sent to Nurse Priya', 'Escalated to Nurse Ravi', 'Escalated to All nurses + doctor',
    ])
  })

  it('stops escalation and edits the same Telegram alert after acknowledgement', async () => {
    expect(await useAlertStore.getState().acknowledgeAlert('AL-B08', 'Nurse Priya', BASE_TIME + 15_000)).toBe(true)
    useAlertStore.getState().advanceEscalations(BASE_TIME + 120_000)
    const alert = useAlertStore.getState().alerts.find((item) => item.id === 'AL-B08')!
    expect(alert.status).toBe('acknowledged')
    expect(alert.ladderStep).toBe(1)
    expect(alert.telegramMessage).toMatch(/^✅ Acknowledged by Nurse Priya\./)
    expect(alert.responseHistory.at(-1)?.message).toBe('Acknowledged by Nurse Priya')
  })

  it('keeps the alert open and reports feedback when the command fails', async () => {
    configureCommandAdapter({ execute: async () => { throw new Error('Backend unavailable') } })
    expect(await useAlertStore.getState().acknowledgeAlert('AL-B08', 'Nurse Priya')).toBe(false)
    expect(useAlertStore.getState().alerts.find((alert) => alert.id === 'AL-B08')?.status).toBe('open')
    expect(useAlertStore.getState().commandError).toContain('acknowledgement failed')
  })

  it('updates a repeated event instead of creating a duplicate alert', () => {
    useAlertStore.getState().receiveAlert(incoming())
    useAlertStore.getState().receiveAlert(incoming({ reason: 'Updated reason.', occurredAt: BASE_TIME + 1000 }))
    const matches = useAlertStore.getState().alerts.filter((alert) => alert.eventKey === 'B02-emergency-1')
    expect(matches).toHaveLength(1)
    expect(matches[0].reason).toBe('Updated reason.')
  })

  it('never sends integrity-only incidents to the clinical alert queue', () => {
    const before = useAlertStore.getState().alerts.length
    useAlertStore.getState().receiveAlert(incoming({ eventKey: 'B02-integrity-1', verdict: 'DEVICE_ATTACK', integrityOnly: true }))
    expect(useAlertStore.getState().alerts).toHaveLength(before)
  })
})
