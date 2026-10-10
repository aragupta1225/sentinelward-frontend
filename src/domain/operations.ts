export interface BiomedicalTicket {
  id: string
  bedId: string
  deviceId: string
  issue: string
  suggestedFix: string
  issueCount30Days: number
  note: string
  status: 'open' | 'assigned' | 'resolved'
  createdAt: number
  updatedAt: number
}

export interface ReportReview {
  incidentId: string
  status: 'draft' | 'reviewed'
  reviewedAt: number | null
  reviewedBy: string | null
}
