export type ActionLogMode = 'automatic' | 'person'

export interface ActionLogRecord {
  id: string
  occurredAt: number
  actor: string
  actionCode: string
  action: string
  bedId: string | null
  deviceId: string | null
  approvedBy: string | null
  mode: ActionLogMode
  undoable: boolean
  referencesActionId: string | null
}
