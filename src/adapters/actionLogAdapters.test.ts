import { describe, expect, it, vi } from 'vitest'
import { HttpActionLogAdapter, MockActionLogAdapter } from './actionLogAdapters'

describe('action log adapters', () => {
  it('returns a bounded append-only mock record set with an automatic undo candidate', async () => {
    const records = await new MockActionLogAdapter().getActions(3)
    expect(records).toHaveLength(3)
    expect(records[0]).toEqual(expect.objectContaining({ id: 'action-1', mode: 'automatic', undoable: true, bedId: 'B08', deviceId: 'MON-08' }))
  })

  it('uses the locked 200-action path and maps the backend envelope', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ actions: [{ id: 'a-1', occurred_at: 100, actor: 'SentinelWard', action_code: 'device_isolated', action: 'Device isolated', bed_id: 'B07', device_id: 'MON-07', approved_by: 'Safety policy', mode: 'automatic', undoable: true, references_action_id: null }] }) } as Response)
    const adapter = new HttpActionLogAdapter('/api/', fetcher)
    await expect(adapter.getActions(200)).resolves.toEqual([expect.objectContaining({ id: 'a-1', occurredAt: 100, deviceId: 'MON-07' })])
    expect(fetcher).toHaveBeenCalledWith('/api/actions?limit=200', expect.objectContaining({ headers: { Accept: 'application/json' } }))
  })

  it('rejects an invalid action mode at the typed boundary', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ actions: [{ id: 'a-1', occurred_at: 100, actor: 'x', action_code: 'x', action: 'x', bed_id: null, device_id: null, approved_by: null, mode: 'robot', undoable: false, references_action_id: null }] }) } as Response)
    await expect(new HttpActionLogAdapter('/api', fetcher).getActions(200)).rejects.toThrow()
  })
})
