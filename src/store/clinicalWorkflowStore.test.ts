import { describe, expect, it } from 'vitest'
import { useClinicalWorkflowStore } from './clinicalWorkflowStore'
import { useWardDashboardStore } from './wardDashboardStore'

describe('clinical workload assignments', () => {
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
})
