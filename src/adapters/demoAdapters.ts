import { z } from 'zod'
import type { ScenarioId, ScenarioSpeed } from '../domain/scenarios'

export interface DemoControlAdapter {
  runScenario(scenario: ScenarioId, speed: ScenarioSpeed, signal?: AbortSignal): Promise<void>
  resetWard(signal?: AbortSignal): Promise<void>
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
const receiptSchema = z.object({ accepted: z.boolean() })

export class MockDemoControlAdapter implements DemoControlAdapter {
  readonly calls: Array<{ type: 'run'; scenario: ScenarioId; speed: ScenarioSpeed } | { type: 'reset' }> = []
  async runScenario(scenario: ScenarioId, speed: ScenarioSpeed) { this.calls.push({ type: 'run', scenario, speed }) }
  async resetWard() { this.calls.push({ type: 'reset' }) }
}

export class HttpDemoControlAdapter implements DemoControlAdapter {
  private readonly baseUrl: string
  private readonly fetcher: FetchLike

  constructor(baseUrl = '/api', fetcher: FetchLike = fetch) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.fetcher = fetcher
  }

  async runScenario(scenario: ScenarioId, speed: ScenarioSpeed, signal?: AbortSignal) {
    await this.post('/demo/run', { scenario, speed }, signal)
  }

  async resetWard(signal?: AbortSignal) {
    await this.post('/demo/reset', {}, signal)
  }

  private async post(path: string, body: object, signal?: AbortSignal) {
    const response = await this.fetcher(`${this.baseUrl}${path}`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal })
    if (!response.ok) throw new Error(`Demo control request failed with status ${response.status}`)
    const receipt = receiptSchema.parse(await response.json())
    if (!receipt.accepted) throw new Error('Demo control request was not accepted')
  }
}
