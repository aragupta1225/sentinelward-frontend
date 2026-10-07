import { describe, expect, it } from 'vitest'
import { canViewScreen, ROLE_SCREENS } from './access'

describe('role screen configuration', () => {
  it('keeps provisional route access in configuration', () => {
    expect(canViewScreen('doctor', 'census')).toBe(true)
    expect(canViewScreen('nurse', 'security')).toBe(false)
    expect(canViewScreen('biomedical', 'tickets')).toBe(true)
    expect(ROLE_SCREENS.operator).toContain('demo')
  })
})
