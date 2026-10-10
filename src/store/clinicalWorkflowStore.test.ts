import { beforeEach, describe, expect, it } from 'vitest'
import { configureCommandAdapter } from '../adapters/commandGateway'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'
import { resetClinicalWorkflowStore, useClinicalWorkflowStore } from './clinicalWorkflowStore'
import { useWardDashboardStore } from './wardDashboardStore'

describe('clinical workload assignments', () => {
  let adapter: MockCommandAdapter

  beforeEach(() => {
    adapter = new MockCommandAdapter()
    configureCommandAdapter(adapter)
    resetClinicalWorkflowStore()
  })

  it('keeps one active assignment per bed and logs reassignment', async () => {
    expect(await useClinicalWorkflowStore.getState().assignBed('B06', 'doctor-rao')).toBe(true)
    expect(await useClinicalWorkflowStore.getState().assignBed('B06', 'doctor-sen')).toBe(true)
    const matches = useClinicalWorkflowStore.getState().assignments.filter((item) => item.bedId === 'B06')
    expect(matches).toHaveLength(1)
    expect(matches[0].clinicianId).toBe('doctor-sen')
    expect(useWardDashboardStore.getState().activities.some((event) => event.id.startsWith('clinical-'))).toBe(true)
  })

  it('enforces configured clinician capacity', async () => {
    expect(await useClinicalWorkflowStore.getState().assignBed('B01', 'doctor-rao')).toBe(true)
    expect(await useClinicalWorkflowStore.getState().assignBed('B02', 'doctor-rao')).toBe(true)
    expect(await useClinicalWorkflowStore.getState().assignBed('B05', 'doctor-rao')).toBe(true)
    expect(await useClinicalWorkflowStore.getState().assignBed('B07', 'doctor-rao')).toBe(false)
  })

  it('tracks On my way as an assignment status without bedside confirmation', async () => {
    await useClinicalWorkflowStore.getState().setAssignmentStatus('B03', 'on_my_way')
    expect(useClinicalWorkflowStore.getState().assignments.find((item) => item.bedId === 'B03')?.status).toBe('on_my_way')
  })

  it('records a doctor-requested bedside nurse Telegram ping only after command acceptance', async () => {
    expect(await useClinicalWorkflowStore.getState().callBedsideNurse('B07', 'nurse', 'Nurse Priya')).toBe(false)
    expect(await useClinicalWorkflowStore.getState().callBedsideNurse('B07', 'doctor', 'Antara Gupta')).toBe(true)
    expect(useClinicalWorkflowStore.getState().bedsideCalls.B07).toEqual(expect.objectContaining({ requestedBy: 'Antara Gupta', channel: 'telegram' }))
    expect(adapter.commands).toContainEqual({ type: 'call_bedside_nurse', bedId: 'B07', requestedBy: 'Antara Gupta' })
  })

  it('does not record a bedside call when the command adapter fails', async () => {
    configureCommandAdapter({ execute: async () => { throw new Error('Telegram unavailable') } })
    expect(await useClinicalWorkflowStore.getState().callBedsideNurse('B07', 'doctor', 'Antara Gupta')).toBe(false)
    expect(useClinicalWorkflowStore.getState().bedsideCalls.B07).toBeUndefined()
    expect(useClinicalWorkflowStore.getState().pendingCallBedId).toBeNull()
    expect(useClinicalWorkflowStore.getState().commandError).toMatch(/No Telegram ping was recorded/)
  })
})
