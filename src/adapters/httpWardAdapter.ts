import { z } from 'zod'
import type { WardRestAdapter, WardSnapshot } from './contracts'
import { mapRawBed } from './mappers'

const wardSnapshotSchema = z.object({
  beds: z.array(z.unknown()),
  received_at: z.number().optional(),
})

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export class HttpWardRestAdapter implements WardRestAdapter {
  private readonly baseUrl: string
  private readonly fetcher: FetchLike

  constructor(
    baseUrl = '/api',
    fetcher: FetchLike = fetch,
  ) {
    this.baseUrl = baseUrl
    this.fetcher = fetcher
  }

  async getWard(signal?: AbortSignal): Promise<WardSnapshot> {
    const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, '')}/ward`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    })
    if (!response.ok) throw new Error(`Ward request failed with status ${response.status}`)
    const payload = wardSnapshotSchema.parse(await response.json())
    return {
      beds: payload.beds.map(mapRawBed),
      receivedAt: payload.received_at ?? Date.now(),
    }
  }
}
