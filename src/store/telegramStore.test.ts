import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TELEGRAM_TEMPLATES } from '../mocks/telegramTemplates'
import { resetTelegramStore, useTelegramStore } from './telegramStore'

describe('Telegram frontend behavior', () => {
  beforeEach(() => resetTelegramStore())
  afterEach(() => { resetTelegramStore(); vi.useRealTimers() })

  it('provides every exact event template within Telegram limits', () => {
    expect(TELEGRAM_TEMPLATES).toHaveLength(8)
    for (const template of TELEGRAM_TEMPLATES) {
      for (const button of template.buttons) expect(new TextEncoder().encode(button.callbackData).length).toBeLessThanOrEqual(64)
      if (template.highAlert) expect([template.firstLine, template.body, template.time].join('\n').length).toBeLessThanOrEqual(1024)
    }
  })

  it('edits the same message after acknowledgement instead of adding a duplicate', () => {
    const before = useTelegramStore.getState().messages
    expect(useTelegramStore.getState().pressButton('emergency', 'ack:a_3f9c', 'Antara Gupta', 'nurse')).toBe(true)
    const after = useTelegramStore.getState().messages
    expect(after).toHaveLength(before.length)
    expect(after.find((message) => message.id === 'emergency')).toEqual(expect.objectContaining({ revision: 2, editedStatus: expect.stringContaining('Acknowledged by Antara Gupta') }))
  })

  it('edits emergency escalation in place for the next nurse and doctor', () => {
    expect(useTelegramStore.getState().pressButton('emergency', 'escalate:a_3f9c', 'Antara Gupta', 'doctor')).toBe(true)
    expect(useTelegramStore.getState().messages.find((message) => message.id === 'emergency')).toEqual(expect.objectContaining({ recipient: 'next nurse + doctor', firstLine: expect.stringContaining('not acknowledged for 30 s') }))
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
