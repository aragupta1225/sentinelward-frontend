import { create } from 'zustand'
import { can, type Role } from '../domain/access'
import type { BedAssignment, BedsideNurseCall, Clinician } from '../domain/clinicalWorkflow'
import { useWardDashboardStore, type WardActivity } from './wardDashboardStore'
import { dispatchCommand } from '../adapters/commandGateway'

interface ClinicalWorkflowState {
  clinicians: Clinician[]
  assignments: BedAssignment[]
  bedsideCalls: Record<string, BedsideNurseCall>
  pendingCallBedId: string | null
  commandError: string | null
  assignBed: (bedId: string, clinicianId: string) => Promise<boolean>
  setAssignmentStatus: (bedId: string, status: BedAssignment['status']) => Promise<void>
  callBedsideNurse: (bedId: string, role: Role, requestedBy: string) => Promise<boolean>
}

let eventSequence = 0

function log(message: string, bedId: string) {
  eventSequence += 1
  const entry: WardActivity = { id: `clinical-${eventSequence}`, bedId, kind: 'acknowledgement', priority: 'none', message, occurredAt: Date.now() }
  useWardDashboardStore.setState((ward) => ({ activities: [entry, ...ward.activities].slice(0, 30) }))
}

const clinicians: Clinician[] = [
  { id: 'doctor-rao', displayName: 'Dr. Rao', role: 'doctor', capacity: 4 },
  { id: 'doctor-sen', displayName: 'Dr. Sen', role: 'doctor', capacity: 4 },
  { id: 'nurse-kapoor', displayName: 'Nurse Kapoor', role: 'nurse', capacity: 4 },
  { id: 'nurse-das', displayName: 'Nurse Das', role: 'nurse', capacity: 4 },
]

const now = Date.now()
const initialAssignments: BedAssignment[] = [
  { bedId: 'B03', clinicianId: 'doctor-rao', status: 'assigned', assignedAt: now - 120_000, updatedAt: now - 120_000 },
  { bedId: 'B08', clinicianId: 'doctor-sen', status: 'on_my_way', assignedAt: now - 80_000, updatedAt: now - 50_000 },
  { bedId: 'B04', clinicianId: 'nurse-kapoor', status: 'assigned', assignedAt: now - 180_000, updatedAt: now - 180_000 },
]

export const useClinicalWorkflowStore = create<ClinicalWorkflowState>((set, get) => ({
  clinicians,
  assignments: initialAssignments,
  bedsideCalls: {},
  pendingCallBedId: null,
  commandError: null,
  assignBed: async (bedId, clinicianId) => {
    const clinician = get().clinicians.find((item) => item.id === clinicianId)
    if (!clinician) return false
    const current = get().assignments.find((item) => item.bedId === bedId)
    const activeCount = get().assignments.filter((item) => item.clinicianId === clinicianId && item.status !== 'complete' && item.bedId !== bedId).length
    if (activeCount >= clinician.capacity) return false
    if (!await dispatchCommand({ type: 'assign_clinician', bedId, clinicianId })) return false
    const timestamp = Date.now()
    const assignment: BedAssignment = { bedId, clinicianId, status: 'assigned', assignedAt: current?.assignedAt ?? timestamp, updatedAt: timestamp }
    set((state) => ({ assignments: [assignment, ...state.assignments.filter((item) => item.bedId !== bedId)] }))
    log(`${bedId} assigned to ${clinician.displayName}`, bedId)
    return true
  },
  setAssignmentStatus: async (bedId, status) => {
    const assignment = get().assignments.find((item) => item.bedId === bedId)
    if (!assignment || assignment.status === status) return
    if (!await dispatchCommand({ type: 'update_assignment', bedId, status })) return
    set((state) => ({ assignments: state.assignments.map((item) => item.bedId === bedId ? { ...item, status, updatedAt: Date.now() } : item) }))
    const clinician = get().clinicians.find((item) => item.id === assignment.clinicianId)
    log(`${clinician?.displayName ?? 'Clinician'} marked ${status.replaceAll('_', ' ')}`, bedId)
  },
  callBedsideNurse: async (bedId, role, requestedBy) => {
    if (!can(role, 'call_bedside_nurse')) return false
    set({ pendingCallBedId: bedId, commandError: null })
    if (!await dispatchCommand({ type: 'call_bedside_nurse', bedId, requestedBy })) {
      set({ pendingCallBedId: null, commandError: `Could not call the bedside nurse for ${bedId}. No Telegram ping was recorded.` })
      return false
    }
    const call: BedsideNurseCall = { bedId, requestedAt: Date.now(), requestedBy, channel: 'telegram' }
    set((state) => ({ bedsideCalls: { ...state.bedsideCalls, [bedId]: call }, pendingCallBedId: null }))
    log(`Telegram ping sent to ${bedId} bedside nurse by ${requestedBy}`, bedId)
    return true
  },
}))

export function resetClinicalWorkflowStore() {
  useClinicalWorkflowStore.setState({
    clinicians: structuredClone(clinicians), assignments: structuredClone(initialAssignments), bedsideCalls: {},
    pendingCallBedId: null, commandError: null,
  })
}
