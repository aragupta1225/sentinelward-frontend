import { describe, expect, it } from 'vitest'
import { useSecurityStore } from './securityStore'
import { useWardDashboardStore } from './wardDashboardStore'

describe('security incident lifecycle', () => {
  it('denies incident mutation when the provisional role lacks permission', () => {
    const before = useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')
    useSecurityStore.getState().containIncident('B07', 'nurse')
    expect(useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')?.status).toBe(before?.status)
  })

  it('captures evidence, contains the device, and resolves without restoring trust', () => {
    const evidenceBefore = useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')?.evidence.length ?? 0
    useSecurityStore.getState().captureEvidence('B07', 'it')
    expect(useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')?.evidence).toHaveLength(evidenceBefore + 1)

    useSecurityStore.getState().containIncident('B07', 'it')
    expect(useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')?.status).toBe('contained')
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B07')?.isolated).toBe(true)

    expect(useSecurityStore.getState().resolveIncident('B07', 'it')).toBe(true)
    expect(useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')?.status).toBe('resolved')
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === 'B07')
    expect(bed?.trustState).toBe('untrusted')
    expect(bed?.isolated).toBe(true)
  })

  it('logs every security mutation in ward history', () => {
    expect(useWardDashboardStore.getState().activities.some((event) => event.id.startsWith('security-'))).toBe(true)
  })
})
