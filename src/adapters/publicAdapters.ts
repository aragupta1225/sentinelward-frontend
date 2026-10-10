import { z } from 'zod'
import { ROLES, type Role } from '../domain/access'
import { BED_FIXTURES } from '../mocks/fixtures'
import { mapRawBed } from './mappers'
import type { PublicAdapter, SessionIdentity } from './publicContracts'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

const sessionSchema = z.object({ token: z.string().min(1), role: z.enum(ROLES), name: z.string().min(1) })
const previewSchema = z.object({ beds: z.array(z.unknown()).min(1).max(4) })

export class MockPublicAdapter implements PublicAdapter {
  async createSession(role: Role): Promise<SessionIdentity> {
    return { token: `mock-${role}-session`, role, name: 'Antara Gupta' }
  }

  async getWardPreview() {
    return structuredClone(BED_FIXTURES.slice(0, 4))
  }
}

export class HttpPublicAdapter implements PublicAdapter {
  private readonly baseUrl: string
  private readonly fetcher: FetchLike

  constructor(baseUrl = '/api', fetcher: FetchLike = fetch) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.fetcher = fetcher
  }

  async createSession(role: Role, signal?: AbortSignal): Promise<SessionIdentity> {
    const response = await this.fetcher(`${this.baseUrl}/session`, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ role }), signal,
    })
    if (!response.ok) throw new Error(`Session request failed with status ${response.status}`)
    return sessionSchema.parse(await response.json())
  }

  async getWardPreview(signal?: AbortSignal) {
    const response = await this.fetcher(`${this.baseUrl}/ward/preview`, { method: 'GET', headers: { Accept: 'application/json' }, signal })
    if (!response.ok) throw new Error(`Ward preview failed with status ${response.status}`)
    return previewSchema.parse(await response.json()).beds.map(mapRawBed)
  }
}
