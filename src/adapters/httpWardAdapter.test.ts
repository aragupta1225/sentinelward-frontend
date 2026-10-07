import { describe, expect, it, vi } from 'vitest'
import { HttpWardRestAdapter } from './httpWardAdapter'

const rawBed = {
  bed_id: 'B01', patient: { initials: 'AK', age: 64 }, occupancy: 'occupied',
  verdict: 'NORMAL', trust_score: 96, is_trusted: true, connected: true,
  last_updated_at: 1000, vitals: { hr: 76, spo2: 98, systolic: 122, diastolic: 78 },
  waveform: { ecg: [0, 1], ppg: [0, 1] },
}

describe('HttpWardRestAdapter', () => {
  it('maps provisional backend payloads into frontend domain models', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ beds: [rawBed], received_at: 1234 }) } as Response)
    const adapter = new HttpWardRestAdapter('/api/', fetcher)
    const snapshot = await adapter.getWard()
    expect(fetcher).toHaveBeenCalledWith('/api/ward', expect.objectContaining({ method: 'GET' }))
    expect(snapshot.receivedAt).toBe(1234)
    expect(snapshot.beds[0].patient.displayName).toBe('AK')
  })

  it('surfaces HTTP failures without sending raw responses to components', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503 } as Response)
    await expect(new HttpWardRestAdapter('/api', fetcher).getWard()).rejects.toThrow('status 503')
  })
})
