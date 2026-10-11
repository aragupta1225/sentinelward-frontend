export interface BlindTimeEntry { bedId: string; minutes: number }
export interface ShiftBriefing {
  since: string
  generatedBy: 'IBM Granite'
  summary: string
  incidents: number
  untrustedBeds: number
  openTickets: number
  blindTime: BlindTimeEntry[]
}
export interface NurseWorkload { nurseId: string; nurseName: string; alarmsLastTwoHours: number }
