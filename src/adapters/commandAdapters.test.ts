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
    expect(fetcher).toHaveBeenCalledWith('/api/beds/B08/bedside-check', expect.objectContaining({ method: 'POST' }))
    await adapter.execute({ type: 'record_manual_reading', bedId: 'B08', heartRate: 86, spo2: 94, notes: 'Portable device' })
    expect(fetcher).toHaveBeenCalledWith('/api/beds/B08/manual-reading', expect.objectContaining({ method: 'POST' }))
    await adapter.execute({ type: 'escalate_alert', alertId: 'AL-B08', bedId: 'B08' })
    expect(fetcher).toHaveBeenCalledWith('/api/alerts/AL-B08/escalate', expect.objectContaining({ method: 'POST' }))
    await adapter.execute({ type: 'isolate_device', deviceId: 'MON-07', bedId: 'B07' })
    expect(fetcher).toHaveBeenCalledWith('/api/devices/MON-07/isolate', expect.objectContaining({ method: 'POST' }))
    await adapter.execute({ type: 'fleet_hunt', model: 'Sentinel V4' })
    expect(fetcher).toHaveBeenCalledWith('/api/fleet-hunt', expect.objectContaining({ method: 'POST' }))
    const report = {
      incidentId: 'INC-B07',
      organisation: 'SentinelWard Hospital',
      contact: 'it@sentinelward.example',
      noticedAt: '2026-10-10T10:00',
      occurredAt: '2026-10-10T09:55',
      incidentType: 'Replay attack',
      affectedSystems: 'MON-07',
      description: 'Repeated monitor frames detected.',
      actionsTaken: 'Device isolated.',
      evidenceList: 'network-summary.json',
      factsChecked: true,
      evidenceAttached: true,
      approver: 'Antara Gupta',
      savedAt: null,
      sentAt: null,
      sentBy: null,
    }
    await adapter.execute({ type: 'save_report', incidentId: 'INC-B07', report })
    expect(fetcher).toHaveBeenCalledWith('/api/reports/INC-B07', expect.objectContaining({ method: 'POST' }))
    await adapter.execute({ type: 'mark_report_sent', incidentId: 'INC-B07', sentBy: 'Antara Gupta' })
    expect(fetcher).toHaveBeenCalledWith('/api/reports/INC-B07/mark-sent', expect.objectContaining({ method: 'POST' }))
    await adapter.execute({ type: 'call_bedside_nurse', bedId: 'B07', requestedBy: 'Antara Gupta' })
    expect(fetcher).toHaveBeenCalledWith('/api/beds/B07/call-nurse', expect.objectContaining({ method: 'POST' }))
  })

  it('reports adapter failures without an unhandled rejection', async () => {
    const listener = vi.fn()
    const unsubscribe = subscribeCommandFailures(listener)
    configureCommandAdapter({ execute: async () => { throw new Error('Backend unavailable') } })
    const result = await dispatchCommand({ type: 'isolate_device', deviceId: 'MON-07', bedId: 'B07' })
    expect(result).toBeNull()
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ message: 'Backend unavailable' }))
    unsubscribe()
    configureCommandAdapter(new MockCommandAdapter())
  })
})
