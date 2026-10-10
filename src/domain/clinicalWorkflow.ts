export interface Clinician {
  id: string
  displayName: string
  role: 'nurse' | 'doctor'
  capacity: number
}

export interface BedAssignment {
  bedId: string
  clinicianId: string
  status: 'assigned' | 'on_my_way' | 'reviewing' | 'complete'
  assignedAt: number
  updatedAt: number
}

export interface BedsideNurseCall {
  bedId: string
  requestedAt: number
  requestedBy: string
  channel: 'telegram'
}
