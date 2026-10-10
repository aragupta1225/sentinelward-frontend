import { create } from 'zustand'
import { createSession } from '../adapters/publicGateway'
import { ROLES, type Role } from '../domain/access'
import type { SessionIdentity } from '../adapters/publicContracts'
import { useBedDetailStore } from './bedDetailStore'

const SESSION_STORAGE_KEY = 'sentinelward.demo-session'

interface SessionState {
  authenticated: boolean
  displayName: string | null
  token: string | null
  pendingRole: Role | null
  lastAttemptRole: Role | null
  error: string | null
  signIn: (role: Role) => Promise<boolean>
  signOut: () => void
}

function readStoredSession(): SessionIdentity | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<SessionIdentity>
    if (!value.token || !value.name || !ROLES.includes(value.role as Role)) return null
    return value as SessionIdentity
  } catch {
    return null
  }
}

function persistSession(identity: SessionIdentity | null) {
  try {
    if (identity) window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(identity))
    else window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // The in-memory session remains usable when browser storage is unavailable.
  }
}

const storedSession = typeof window === 'undefined' ? null : readStoredSession()
if (storedSession) useBedDetailStore.getState().setRole(storedSession.role)

export const useSessionStore = create<SessionState>((set) => ({
  authenticated: Boolean(storedSession),
  displayName: storedSession?.name ?? null,
  token: storedSession?.token ?? null,
  pendingRole: null,
  lastAttemptRole: null,
  error: null,
  signIn: async (role) => {
    set({ pendingRole: role, lastAttemptRole: role, error: null })
    try {
      const identity = await createSession(role)
      useBedDetailStore.getState().setRole(identity.role)
      persistSession(identity)
      set({ authenticated: true, displayName: identity.name, token: identity.token, pendingRole: null, error: null })
      return true
    } catch {
      set({ authenticated: false, displayName: null, token: null, pendingRole: null, error: 'Demo sign-in failed. Check the connection and retry.' })
      return false
    }
  },
  signOut: () => {
    persistSession(null)
    useBedDetailStore.getState().setRole('nurse')
    set({ authenticated: false, displayName: null, token: null, pendingRole: null, lastAttemptRole: null, error: null })
  },
}))

export function resetSessionStore() {
  persistSession(null)
  useBedDetailStore.getState().setRole('nurse')
  useSessionStore.setState({ authenticated: false, displayName: null, token: null, pendingRole: null, lastAttemptRole: null, error: null })
}
