import { create } from 'zustand'
import type { Role } from '../domain/access'
import type { TelegramMessage, TelegramTemplateId } from '../domain/telegram'
import { TELEGRAM_TEMPLATES } from '../mocks/telegramTemplates'
import { useAlertStore } from './alertStore'
import { useBedDetailStore } from './bedDetailStore'

interface QueuedRepeat { messageId: TelegramTemplateId; repeats: number }
interface TelegramState {
  messages: TelegramMessage[]
  queue: QueuedRepeat[]
  pendingCallbackData: string | null
  callbackError: string | null
  pressButton: (messageId: TelegramTemplateId, callbackData: string, actor: string, role: Role) => Promise<boolean>
  queueRepeat: (messageId: TelegramTemplateId) => void
  drainQueue: () => void
}

let queueTimer: ReturnType<typeof setTimeout> | null = null
const initialMessages = (): TelegramMessage[] => TELEGRAM_TEMPLATES.map((template) => ({ ...template, buttons: template.buttons.map((button) => ({ ...button })), revision: 1, repeatCount: 0, editedStatus: null }))
const atTime = () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(Date.now())

function scheduleDrain() {
  if (queueTimer) return
  queueTimer = setTimeout(() => {
    queueTimer = null
    useTelegramStore.getState().drainQueue()
  }, 1000)
}

export const useTelegramStore = create<TelegramState>((set, get) => ({
  messages: initialMessages(), queue: [], pendingCallbackData: null, callbackError: null,
  pressButton: async (messageId, callbackData, actor, role) => {
    if (new TextEncoder().encode(callbackData).length > 64) return false
    const message = get().messages.find((item) => item.id === messageId)
    const button = message?.buttons.find((item) => item.callbackData === callbackData)
    if (!message || !button?.allowedRoles.includes(role)) return false
    set({ pendingCallbackData: callbackData, callbackError: null })
    if (button.label === 'On my way' && message.bedId) {
      const alert = useAlertStore.getState().alerts.find((item) => item.bedId === message.bedId && item.status === 'open')
      if (!alert || !await useAlertStore.getState().acknowledgeAlert(alert.id, actor)) {
        set({ pendingCallbackData: null, callbackError: `${message.event} acknowledgement was not accepted. The central alert remains open.` })
        return false
      }
    }
    if ((button.label === 'Patient OK' || button.label === 'Patient NOT OK') && message.bedId) {
      const status = button.label === 'Patient OK' ? 'patient_ok' : 'patient_not_ok'
      if (!await useBedDetailStore.getState().confirmPatient(message.bedId, status)) {
        set({ pendingCallbackData: null, callbackError: `${message.event} bedside result was not accepted. The prior clinical state remains active.` })
        return false
      }
    }
    set((state) => ({ messages: state.messages.map((item) => {
      if (item.id !== messageId) return item
      if (button.label === 'Escalate') return { ...item, recipient: 'next nurse + doctor', firstLine: `${item.firstLine.split(' — ')[0]} — emergency, not acknowledged for 30 s. Please go.`, body: '', buttons: [{ label: 'On my way', callbackData: `ack:${item.bedId?.toLowerCase() ?? 'ward'}:${item.id}`, allowedRoles: ['nurse', 'doctor'] }], revision: item.revision + 1, editedStatus: `Escalated by ${actor} at ${atTime()}` }
      const safetySuffix = button.label === 'Patient NOT OK' ? ' Patient NOT OK; high clinical alert remains active.' : ''
      return { ...item, revision: item.revision + 1, editedStatus: `✅ Acknowledged by ${actor} at ${atTime()}.${safetySuffix}` }
    }), pendingCallbackData: null }))
    return true
  },
  queueRepeat: (messageId) => {
    set((state) => {
      const existing = state.queue.find((item) => item.messageId === messageId)
      return { queue: existing ? state.queue.map((item) => item.messageId === messageId ? { ...item, repeats: item.repeats + 1 } : item) : [...state.queue, { messageId, repeats: 1 }] }
    })
    scheduleDrain()
  },
  drainQueue: () => {
    const [next, ...rest] = get().queue
    if (!next) return
    set((state) => ({
      queue: rest,
      messages: state.messages.map((message) => message.id === next.messageId ? { ...message, repeatCount: message.repeatCount + next.repeats, revision: message.revision + 1, editedStatus: `${next.repeats} repeat${next.repeats === 1 ? '' : 's'} merged into this message at ${atTime()}` } : message),
    }))
    if (rest.length > 0) scheduleDrain()
  },
}))

export function resetTelegramStore() {
  if (queueTimer) clearTimeout(queueTimer)
  queueTimer = null
  useTelegramStore.setState({ messages: initialMessages(), queue: [], pendingCallbackData: null, callbackError: null })
}
