import { describe, expect, it, vi } from 'vitest'
import { HttpDemoControlAdapter, MockDemoControlAdapter } from './demoAdapters'

describe('demo control adapters', () => {
  it('records deterministic mock run and reset commands', async () => {
    const adapter = new MockDemoControlAdapter()
    await adapter.runScenario('full_ward_script', 5)
    await adapter.resetWard()
    expect(adapter.calls).toEqual([{ type: 'run', scenario: 'full_ward_script', speed: 5 }, { type: 'reset' }])
  })

  it('uses the locked run and reset paths with exact payloads', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ accepted: true }) } as Response)
    const adapter = new HttpDemoControlAdapter('/api/', fetcher)
    await adapter.runScenario('fake_flatline', 2)
    await adapter.resetWard()
    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/demo/run', expect.objectContaining({ method: 'POST', body: JSON.stringify({ scenario: 'fake_flatline', speed: 2 }) }))
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/demo/reset', expect.objectContaining({ method: 'POST', body: JSON.stringify({}) }))
  })

  it('rejects an unaccepted backend command', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ accepted: false }) } as Response)
    await expect(new HttpDemoControlAdapter('/api', fetcher).resetWard()).rejects.toThrow('not accepted')
  })
})
