import { describe, expect, it } from 'vitest'
import { useBedDetailStore } from './bedDetailStore'
import { useWardDashboardStore } from './wardDashboardStore'

describe('bed detail workflows', () => {
  it('keeps response acknowledgement separate from bedside confirmation', () => {
    useBedDetailStore.getState().setRole('nurse')
    useBedDetailStore.getState().acknowledgeResponse('B02')
    const response = useBedDetailStore.getState().responses.B02
    expect(response.responseAcknowledgedAt).not.toBeNull()
    expect(response.bedsideStatus).toBe('pending')
  })

  it('raises a high clinical alert immediately when patient is NOT OK', () => {
    useBedDetailStore.getState().setRole('nurse')
    useBedDetailStore.getState().confirmPatient('B02', 'patient_not_ok')
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === 'B02')
    expect(bed?.priority).toBe('high')
    expect(bed?.verdict).toBe('EMERGENCY')
    expect(useBedDetailStore.getState().responses.B02.bedsideStatus).toBe('patient_not_ok')
  })

  it('undoes isolation by appending a referencing action and retaining the original', () => {
    useBedDetailStore.getState().setRole('it')
    useBedDetailStore.getState().isolateDevice('B01')
    const original = useBedDetailStore.getState().actions.find((action) => action.bedId === 'B01' && action.type === 'device_isolated')
    expect(original).toBeDefined()
    useBedDetailStore.getState().undoAction(original!.id)
    const actions = useBedDetailStore.getState().actions
    expect(actions.some((action) => action.id === original!.id)).toBe(true)
    expect(actions.some((action) => action.type === 'action_undone' && action.referencesActionId === original!.id)).toBe(true)
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B01')?.isolated).toBe(false)
  })

  it('applies permissions from configuration rather than component logic', () => {
    useBedDetailStore.getState().setRole('biomedical')
    useBedDetailStore.getState().confirmPatient('B04', 'patient_ok')
    expect(useBedDetailStore.getState().responses.B04).toBeUndefined()
  })
})
