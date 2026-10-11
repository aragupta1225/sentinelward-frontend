import { describe, expect, it, vi } from 'vitest'
import { HttpBriefingAdapter, MockBriefingAdapter } from './briefingAdapters'

describe('briefing adapters', () => {
  it('provides the deterministic S10 handover and workload fixtures', async () => {
    const adapter = new MockBriefingAdapter()
    const briefing = await adapter.getBriefing('08:00')
    const workload = await adapter.getWorkload(2)

    expect(briefing).toEqual(expect.objectContaining({ since: '08:00', generatedBy: 'IBM Granite', incidents: 3, untrustedBeds: 3, openTickets: 2 }))
    expect(briefing.blindTime).toContainEqual({ bedId: 'B07', minutes: 6 })
    expect(workload).toContainEqual({ nurseId: 'n-priya', nurseName: 'Nurse Priya', alarmsLastTwoHours: 46 })
    expect(workload.filter((entry) => entry.alarmsLastTwoHours >= 40)).toHaveLength(2)
  })

  it('uses the specified briefing and two-hour workload paths in backend mode', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ since: '08:00', generated_by: 'IBM Granite', summary: 'Handover summary.', incidents: 1, untrusted_beds: 2, open_tickets: 3, blind_time: [{ bed_id: 'B03', minutes: 5 }] }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ nurses: [{ nurse_id: 'n-1', nurse_name: 'Nurse One', alarms_last_2h: 41 }] }) } as Response)
    const adapter = new HttpBriefingAdapter('/api/', fetcher)

    await expect(adapter.getBriefing('08:00')).resolves.toEqual(expect.objectContaining({ generatedBy: 'IBM Granite', blindTime: [{ bedId: 'B03', minutes: 5 }] }))
    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/briefing?since=08%3A00', expect.objectContaining({ headers: { Accept: 'application/json' } }))
    await expect(adapter.getWorkload(2)).resolves.toEqual([{ nurseId: 'n-1', nurseName: 'Nurse One', alarmsLastTwoHours: 41 }])
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/workload?hours=2', expect.objectContaining({ headers: { Accept: 'application/json' } }))
  })

  it('rejects malformed workload responses before they reach the screen', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ nurses: [{ nurse_id: 'n-1', nurse_name: 'Nurse One', alarms_last_2h: -1 }] }) } as Response)
    await expect(new HttpBriefingAdapter('/api', fetcher).getWorkload(2)).rejects.toThrow()
  })
})
