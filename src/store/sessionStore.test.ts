import { describe, expect, it } from 'vitest'
import { useBedDetailStore } from './bedDetailStore'
import { useSessionStore } from './sessionStore'

describe('development session', () => {
  it('signs in with the selected role and signs out cleanly', () => {
    useSessionStore.getState().signIn('it')
    expect(useSessionStore.getState().authenticated).toBe(true)
    expect(useSessionStore.getState().displayName).toBe('Antara Gupta')
    expect(useBedDetailStore.getState().currentRole).toBe('it')
    useSessionStore.getState().signOut()
    expect(useSessionStore.getState().authenticated).toBe(false)
    expect(useSessionStore.getState().displayName).toBeNull()
  })
})
