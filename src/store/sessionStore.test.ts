import { beforeEach, describe, expect, it } from 'vitest'
import { configurePublicAdapter } from '../adapters/publicGateway'
import { MockPublicAdapter } from '../adapters/publicAdapters'
import { useBedDetailStore } from './bedDetailStore'
import { resetSessionStore, useSessionStore } from './sessionStore'

describe('development session', () => {
  beforeEach(() => {
    configurePublicAdapter(new MockPublicAdapter())
    resetSessionStore()
  })

  it('signs in with the selected role, persists it, and signs out cleanly', async () => {
    expect(await useSessionStore.getState().signIn('it')).toBe(true)
    expect(useSessionStore.getState().authenticated).toBe(true)
    expect(useSessionStore.getState().displayName).toBe('Antara Gupta')
    expect(useSessionStore.getState().token).toBe('mock-it-session')
    expect(useBedDetailStore.getState().currentRole).toBe('it')
    expect(sessionStorage.getItem('sentinelward.demo-session')).toContain('mock-it-session')
    useSessionStore.getState().signOut()
    expect(useSessionStore.getState().authenticated).toBe(false)
    expect(useSessionStore.getState().displayName).toBeNull()
    expect(sessionStorage.getItem('sentinelward.demo-session')).toBeNull()
  })

  it('keeps the user signed out and exposes retry state when login fails', async () => {
    configurePublicAdapter({
      createSession: async () => { throw new Error('Unavailable') },
      getWardPreview: async () => [],
    })
    expect(await useSessionStore.getState().signIn('doctor')).toBe(false)
    expect(useSessionStore.getState()).toEqual(expect.objectContaining({ authenticated: false, pendingRole: null, lastAttemptRole: 'doctor' }))
    expect(useSessionStore.getState().error).toMatch(/retry/i)
    expect(sessionStorage.getItem('sentinelward.demo-session')).toBeNull()
  })
})
