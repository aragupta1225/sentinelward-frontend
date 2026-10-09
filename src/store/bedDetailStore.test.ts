import { beforeEach, describe, expect, it } from 'vitest'
import { resetBedDetailStore, useBedDetailStore } from './bedDetailStore'
import { useWardDashboardStore } from './wardDashboardStore'
import { configureCommandAdapter } from '../adapters/commandGateway'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'
import { resetAlertStore, useAlertStore } from './alertStore'

describe('bed detail workflows', () => {
  beforeEach(() => {
    configureCommandAdapter(new MockCommandAdapter())
    resetBedDetailStore()
    resetAlertStore(1_000_000)
  })

  it('keeps response acknowledgement separate from bedside confirmation', async () => {
    useBedDetailStore.getState().setRole('nurse')
    await useBedDetailStore.getState().acknowledgeResponse('B02')
    const response = useBedDetailStore.getState().responses.B02
    expect(response.responseAcknowledgedAt).not.toBeNull()
    expect(response.bedsideStatus).toBe('pending')
  })

  it('raises a high clinical alert immediately when patient is NOT OK', async () => {
    useBedDetailStore.getState().setRole('nurse')
    await useBedDetailStore.getState().confirmPatient('B02', 'patient_not_ok')
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === 'B02')
    expect(bed?.priority).toBe('high')
    expect(bed?.verdict).toBe('EMERGENCY')
    expect(useBedDetailStore.getState().responses.B02.bedsideStatus).toBe('patient_not_ok')
  })

  it('undoes isolation by appending a referencing action and retaining the original', async () => {
    useBedDetailStore.getState().setRole('it')
    await useBedDetailStore.getState().isolateDevice('B01')
    const original = useBedDetailStore.getState().actions.find((action) => action.bedId === 'B01' && action.type === 'device_isolated')
    expect(original).toBeDefined()
    await useBedDetailStore.getState().undoAction(original!.id)
    const actions = useBedDetailStore.getState().actions
    expect(actions.some((action) => action.id === original!.id)).toBe(true)
    expect(actions.some((action) => action.type === 'action_undone' && action.referencesActionId === original!.id)).toBe(true)
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B01')?.isolated).toBe(false)
  })

  it('applies permissions from configuration rather than component logic', async () => {
    useBedDetailStore.getState().setRole('biomedical')
    await useBedDetailStore.getState().confirmPatient('B04', 'patient_ok')
    expect(useBedDetailStore.getState().responses.B04).toBeUndefined()
  })

  it('escalates an open alert through the typed command boundary and records the action', async () => {
    expect(await useBedDetailStore.getState().escalateAlert('B03')).toBe(true)
    expect(useAlertStore.getState().alerts.find((alert) => alert.bedId === 'B03')?.ladderStep).toBe(2)
    expect(useBedDetailStore.getState().actions.some((action) => action.bedId === 'B03' && action.type === 'alert_escalated')).toBe(true)
  })

  it('records validated hand-check values and schedules the next check', async () => {
    expect(await useBedDetailStore.getState().recordManualReading('B07', { heartRate: 82, spo2: 97, notes: 'Pulse regular' })).toBe(true)
    const reading = useBedDetailStore.getState().manualReadings.B07[0]
    expect(reading).toMatchObject({ heartRate: 82, spo2: 97, notes: 'Pulse regular' })
    expect(useBedDetailStore.getState().nextManualCheckAt.B07).toBeGreaterThan(reading.recordedAt)
    expect(useBedDetailStore.getState().actions.some((action) => action.type === 'manual_reading_recorded')).toBe(true)
  })

  it('keeps S3 actions read-only for IT', async () => {
    useBedDetailStore.getState().setRole('it')
    expect(await useBedDetailStore.getState().escalateAlert('B03')).toBe(false)
    expect(await useBedDetailStore.getState().recordManualReading('B07', { heartRate: 82, spo2: 97, notes: '' })).toBe(false)
    expect(useBedDetailStore.getState().manualReadings.B07).toBeUndefined()
  })
})
