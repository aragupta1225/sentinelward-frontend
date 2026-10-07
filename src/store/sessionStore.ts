import { create } from 'zustand'
import type { Role } from '../domain/access'
import { useBedDetailStore } from './bedDetailStore'

interface SessionState {
  authenticated: boolean
  displayName: string | null
  signIn: (role: Role, displayName?: string) => void
  signOut: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  authenticated: false,
  displayName: null,
  signIn: (role, displayName = 'Antara Gupta') => {
    useBedDetailStore.getState().setRole(role)
    set({ authenticated: true, displayName })
  },
  signOut: () => set({ authenticated: false, displayName: null }),
}))
