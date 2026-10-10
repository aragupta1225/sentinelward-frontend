import { describe, expect, it, vi } from 'vitest'
import { HttpPublicAdapter, MockPublicAdapter } from './publicAdapters'

describe('public adapters', () => {
  it('provides a four-bed read-only mock preview with one high alarm', async () => {
    const adapter = new MockPublicAdapter()
    const beds = await adapter.getWardPreview()
    expect(beds).toHaveLength(4)
    expect(beds.some((bed) => bed.priority === 'high')).toBe(true)
    expect(await adapter.createSession('nurse')).toEqual(expect.objectContaining({ role: 'nurse', token: 'mock-nurse-session' }))
  })

  it('uses the locked preview and session paths in backend mode', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ token: 'token-1', role: 'doctor', name: 'Dr. Demo' }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ beds: [{ bed_id: 'B01', verdict: 'NORMAL', trust_score: 96, is_trusted: true, connected: true, last_updated_at: 1, vitals: null, waveform: null }] }) } as Response)
    const adapter = new HttpPublicAdapter('/api/', fetcher)
    expect(await adapter.createSession('doctor')).toEqual({ token: 'token-1', role: 'doctor', name: 'Dr. Demo' })
    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/session', expect.objectContaining({ method: 'POST', body: JSON.stringify({ role: 'doctor' }) }))
    expect(await adapter.getWardPreview()).toHaveLength(1)
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/ward/preview', expect.objectContaining({ method: 'GET' }))
  })
})
