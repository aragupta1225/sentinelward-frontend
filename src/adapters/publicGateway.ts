import type { Role } from '../domain/access'
import type { PublicAdapter } from './publicContracts'

let adapter: PublicAdapter | null = null

export function configurePublicAdapter(nextAdapter: PublicAdapter) {
  adapter = nextAdapter
}

function configuredAdapter() {
  if (!adapter) throw new Error('Public runtime is not configured')
  return adapter
}

export function createSession(role: Role, signal?: AbortSignal) {
  return configuredAdapter().createSession(role, signal)
}

export function loadWardPreview(signal?: AbortSignal) {
  return configuredAdapter().getWardPreview(signal)
}
