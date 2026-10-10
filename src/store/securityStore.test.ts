import { beforeEach, describe, expect, it } from 'vitest'
import { resetSecurityStore, useSecurityStore } from './securityStore'
import { useWardDashboardStore } from './wardDashboardStore'
import { configureCommandAdapter } from '../adapters/commandGateway'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'

describe('security incident lifecycle', () => {
  beforeEach(() => { configureCommandAdapter(new MockCommandAdapter()); resetSecurityStore() })

  it('denies incident mutation when the provisional role lacks permission', async () => {
    const before = useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')
    await useSecurityStore.getState().containIncident('B07', 'nurse')
    expect(useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')?.status).toBe(before?.status)
  })

  it('captures evidence, contains the device, and resolves without restoring trust', async () => {
    const evidenceBefore = useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')?.evidence.length ?? 0
    await useSecurityStore.getState().captureEvidence('B07', 'it')
    expect(useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')?.evidence).toHaveLength(evidenceBefore + 1)

    await useSecurityStore.getState().containIncident('B07', 'it')
    expect(useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')?.status).toBe('contained')
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B07')?.isolated).toBe(true)

    expect(await useSecurityStore.getState().resolveIncident('B07', 'it')).toBe(true)
    expect(useSecurityStore.getState().incidents.find((item) => item.bedId === 'B07')?.status).toBe('resolved')
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === 'B07')
    expect(bed?.trustState).toBe('untrusted')
    expect(bed?.isolated).toBe(true)
  })

  it('logs every security mutation in ward history', async () => {
    const countBefore = useWardDashboardStore.getState().activities.length
    await useSecurityStore.getState().captureEvidence('B07', 'it')
    const activities = useWardDashboardStore.getState().activities
    expect(activities).toHaveLength(countBefore + 1)
    expect(activities[0]).toEqual(expect.objectContaining({ bedId: 'B07', id: expect.stringMatching(/^security-/) }))
  })

  it('runs a same-model fleet hunt and isolates with an undoable action', async () => {
    expect(await useSecurityStore.getState().fleetHunt('SimMon v2')).toBe(true)
    expect(useSecurityStore.getState().fleetHuntDeviceIds).toContain('MON-07')
    expect(await useSecurityStore.getState().isolateDevice('MON-07', 'it')).toBe(true)
    const event = useSecurityStore.getState().attackFeed[0]
    expect(event.actionId).not.toBeNull()
    expect(useSecurityStore.getState().devices.find((device) => device.id === 'MON-07')?.status).toBe('isolated')
    expect(await useSecurityStore.getState().undoIsolation('MON-07', event.actionId!, 'it')).toBe(true)
    expect(useSecurityStore.getState().devices.find((device) => device.id === 'MON-07')?.status).toBe('watch')
  })
})
