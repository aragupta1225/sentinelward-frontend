import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureCommandAdapter } from '../adapters/commandGateway'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'
import { BED_FIXTURES } from '../mocks/fixtures'
import { TELEGRAM_TEMPLATES } from '../mocks/telegramTemplates'
import { resetAlertStore, useAlertStore } from './alertStore'
import { resetBedDetailStore, useBedDetailStore } from './bedDetailStore'
import { resetTelegramStore, useTelegramStore } from './telegramStore'
import { useWardDashboardStore } from './wardDashboardStore'

describe('Telegram frontend behavior', () => {
  beforeEach(() => {
    configureCommandAdapter(new MockCommandAdapter())
    useWardDashboardStore.setState({ beds: structuredClone([...BED_FIXTURES]) })
    resetAlertStore()
    resetBedDetailStore()
    resetTelegramStore()
  })
  afterEach(() => { resetTelegramStore(); vi.useRealTimers() })

  it('provides every exact event template within Telegram limits', () => {
    expect(TELEGRAM_TEMPLATES).toHaveLength(8)
    for (const template of TELEGRAM_TEMPLATES) {
      for (const button of template.buttons) expect(new TextEncoder().encode(button.callbackData).length).toBeLessThanOrEqual(64)
      if (template.highAlert) expect([template.firstLine, template.body, template.time].join('\n').length).toBeLessThanOrEqual(1024)
    }
  })

  it('acknowledges the central alert and edits the same message without adding a duplicate', async () => {
    const before = useTelegramStore.getState().messages
    await expect(useTelegramStore.getState().pressButton('emergency', 'ack:a_3f9c', 'Antara Gupta', 'nurse')).resolves.toBe(true)
    const after = useTelegramStore.getState().messages
    expect(after).toHaveLength(before.length)
    expect(after.find((message) => message.id === 'emergency')).toEqual(expect.objectContaining({ revision: 2, editedStatus: expect.stringContaining('Acknowledged by Antara Gupta') }))
    expect(useAlertStore.getState().alerts.find((alert) => alert.bedId === 'B03')?.status).toBe('acknowledged')
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B03')?.acknowledgement).toBe('acknowledged')
  })

  it('edits emergency escalation in place for the next nurse and doctor', async () => {
    await expect(useTelegramStore.getState().pressButton('emergency', 'escalate:a_3f9c', 'Antara Gupta', 'doctor')).resolves.toBe(true)
    expect(useTelegramStore.getState().messages.find((message) => message.id === 'emergency')).toEqual(expect.objectContaining({ recipient: 'next nurse + doctor', firstLine: expect.stringContaining('not acknowledged for 30 s') }))
  })

  it('records Telegram bedside confirmation in the central clinical state', async () => {
    await expect(useTelegramStore.getState().pressButton('untrusted', 'not_ok:b7:a_7d3f', 'Antara Gupta', 'nurse')).resolves.toBe(true)
    expect(useBedDetailStore.getState().responses.B07.bedsideStatus).toBe('patient_not_ok')
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B07')).toEqual(expect.objectContaining({ priority: 'high', verdict: 'BOTH' }))
    expect(useTelegramStore.getState().messages.find((message) => message.id === 'untrusted')?.editedStatus).toContain('high clinical alert remains active')
  })

  it('queues at one-second intervals and merges repeats for one event', () => {
    vi.useFakeTimers()
    useTelegramStore.getState().queueRepeat('emergency')
    useTelegramStore.getState().queueRepeat('emergency')
    expect(useTelegramStore.getState().queue).toEqual([{ messageId: 'emergency', repeats: 2 }])
    vi.advanceTimersByTime(999)
    expect(useTelegramStore.getState().messages.find((message) => message.id === 'emergency')?.repeatCount).toBe(0)
    vi.advanceTimersByTime(1)
    expect(useTelegramStore.getState().messages.find((message) => message.id === 'emergency')?.repeatCount).toBe(2)
    expect(useTelegramStore.getState().queue).toHaveLength(0)
  })
})
