import type { Role } from './access'

export type TelegramTemplateId = 'emergency' | 'escalation' | 'loose_sensor' | 'drifting' | 'untrusted' | 'both' | 'device_attack' | 'unsure'

export interface TelegramButton {
  label: string
  callbackData: string
  allowedRoles: readonly Role[]
}

export interface TelegramTemplate {
  id: TelegramTemplateId
  event: string
  recipient: string
  firstLine: string
  body: string
  time: string
  buttons: readonly TelegramButton[]
  highAlert: boolean
  bedId: string | null
}

export interface TelegramMessage extends TelegramTemplate {
  revision: number
  repeatCount: number
  editedStatus: string | null
}
