export interface BiomedicalTicket {
  id: string
  bedId: string
  issue: string
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
