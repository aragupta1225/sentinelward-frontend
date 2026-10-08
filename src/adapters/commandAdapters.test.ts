import { describe, expect, it, vi } from 'vitest'
import { configureCommandAdapter, dispatchCommand, subscribeCommandFailures } from './commandGateway'
import { HttpCommandAdapter } from './httpCommandAdapter'
import { MockCommandAdapter } from './mockCommandAdapter'

describe('command adapters', () => {
  it('records mock commands behind the shared interface', async () => {
    const adapter = new MockCommandAdapter()
    const receipt = await adapter.execute({ type: 'acknowledge_alert', bedId: 'B03' })
    expect(adapter.commands).toEqual([{ type: 'acknowledge_alert', bedId: 'B03' }])
    expect(receipt.status).toBe('accepted')
  })

  it('isolates provisional HTTP paths from stores and components', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ command_id: 'cmd-1', accepted_at: 123 }) } as Response)
    const adapter = new HttpCommandAdapter('/api/', fetcher)
    await adapter.execute({ type: 'confirm_bedside', bedId: 'B08', status: 'patient_not_ok' })
    expect(fetcher).toHaveBeenCalledWith('/api/beds/B08/bedside-confirmation', expect.objectContaining({ method: 'POST' }))
  })

  it('reports adapter failures without an unhandled rejection', async () => {
    const listener = vi.fn()
    const unsubscribe = subscribeCommandFailures(listener)
    configureCommandAdapter({ execute: async () => { throw new Error('Backend unavailable') } })
    const result = await dispatchCommand({ type: 'isolate_device', bedId: 'B07' })
    expect(result).toBeNull()
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ message: 'Backend unavailable' }))
    unsubscribe()
    configureCommandAdapter(new MockCommandAdapter())
  })
})
