import type { Role } from '../domain/access'
import type { Bed } from '../domain/ward'

export interface SessionIdentity {
  token: string
  role: Role
  name: string
}

export interface PublicAdapter {
  createSession(role: Role, signal?: AbortSignal): Promise<SessionIdentity>
  getWardPreview(signal?: AbortSignal): Promise<Bed[]>
}
