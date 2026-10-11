import { z } from 'zod'
import type { ActionLogRecord } from '../domain/actionLog'

export interface ActionLogAdapter {
  getActions(limit: number, signal?: AbortSignal): Promise<ActionLogRecord[]>
}

const actionSchema = z.object({
  id: z.string(),
  occurred_at: z.number(),
  actor: z.string(),
  action_code: z.string(),
  action: z.string(),
  bed_id: z.string().nullable(),
  device_id: z.string().nullable(),
  approved_by: z.string().nullable(),
  mode: z.enum(['automatic', 'person']),
  undoable: z.boolean(),
  references_action_id: z.string().nullable(),
})
const responseSchema = z.object({ actions: z.array(actionSchema) })
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export class MockActionLogAdapter implements ActionLogAdapter {
  async getActions(limit: number): Promise<ActionLogRecord[]> {
    const now = Date.now()
    const records: ActionLogRecord[] = [
      { id: 'action-1', occurredAt: now - 48_000, actor: 'SentinelWard', actionCode: 'device_isolated', action: 'Compromised device isolated automatically; treatment systems untouched', bedId: 'B08', deviceId: 'MON-08', approvedBy: 'Safety policy v1', mode: 'automatic', undoable: true, referencesActionId: null },
      { id: 'action-2', occurredAt: now - 50_000, actor: 'SentinelWard', actionCode: 'alert_created', action: 'Clinical emergency retained while device threat was contained', bedId: 'B08', deviceId: 'MON-08', approvedBy: 'Clinical alarm rule', mode: 'automatic', undoable: false, referencesActionId: null },
      { id: 'action-3', occurredAt: now - 80_000, actor: 'SentinelWard', actionCode: 'alert_created', action: 'High clinical alert created from trusted vital signs', bedId: 'B03', deviceId: 'MON-03', approvedBy: 'Clinical alarm rule', mode: 'automatic', undoable: false, referencesActionId: null },
      { id: 'action-4', occurredAt: now - 150_000, actor: 'Antara Gupta', actionCode: 'evidence_captured', action: 'Incident evidence snapshot captured and fingerprinted', bedId: 'B07', deviceId: 'MON-07', approvedBy: 'Antara Gupta', mode: 'person', undoable: false, referencesActionId: null },
    ]
    return records.slice(0, limit)
  }
}

export class HttpActionLogAdapter implements ActionLogAdapter {
  private readonly baseUrl: string
  private readonly fetcher: FetchLike

  constructor(baseUrl = '/api', fetcher: FetchLike = fetch) {
    this.baseUrl = baseUrl
    this.fetcher = fetcher
  }

  async getActions(limit: number, signal?: AbortSignal): Promise<ActionLogRecord[]> {
    const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, '')}/actions?limit=${limit}`, { headers: { Accept: 'application/json' }, signal })
    if (!response.ok) throw new Error(`Action log request failed with status ${response.status}`)
    return responseSchema.parse(await response.json()).actions.map((entry) => ({
      id: entry.id, occurredAt: entry.occurred_at, actor: entry.actor, actionCode: entry.action_code, action: entry.action,
      bedId: entry.bed_id, deviceId: entry.device_id, approvedBy: entry.approved_by, mode: entry.mode,
      undoable: entry.undoable, referencesActionId: entry.references_action_id,
    }))
  }
}
