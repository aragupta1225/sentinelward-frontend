import { create } from 'zustand'
import type { BiomedicalTicket, ReportReview } from '../domain/operations'
import { useWardDashboardStore, type WardActivity } from './wardDashboardStore'
import { dispatchCommand } from '../adapters/commandGateway'

interface OperationsState {
  tickets: BiomedicalTicket[]
  reportReviews: Record<string, ReportReview>
  createTicket: (bedId: string, issue: string) => Promise<BiomedicalTicket | null>
  setTicketStatus: (ticketId: string, status: BiomedicalTicket['status']) => Promise<void>
  markReportReviewed: (incidentId: string, reviewer: string) => Promise<void>
}

let ticketSequence = 104
let eventSequence = 0

function appendActivity(message: string, bedId: string | null, priority: WardActivity['priority'] = 'none') {
  eventSequence += 1
  const entry: WardActivity = { id: `operation-${eventSequence}`, bedId, kind: 'system', priority, message, occurredAt: Date.now() }
  useWardDashboardStore.setState((ward) => ({ activities: [entry, ...ward.activities].slice(0, 30) }))
}

const initialTickets: BiomedicalTicket[] = [
  { id: 'BIO-104', bedId: 'B04', issue: 'Reseat ECG leads', status: 'open', createdAt: Date.now() - 420_000, updatedAt: Date.now() - 420_000 },
  { id: 'BIO-101', bedId: 'B05', issue: 'Inspect drifting SpO₂ sensor', status: 'assigned', createdAt: Date.now() - 900_000, updatedAt: Date.now() - 600_000 },
]

export const useOperationsStore = create<OperationsState>((set, get) => ({
  tickets: initialTickets,
  reportReviews: {},
  createTicket: async (bedId, issue) => {
    ticketSequence += 1
    const ticket: BiomedicalTicket = { id: `BIO-${ticketSequence}`, bedId, issue, status: 'open', createdAt: Date.now(), updatedAt: Date.now() }
    if (!await dispatchCommand({ type: 'create_ticket', bedId, issue })) return null
    set((state) => ({ tickets: [ticket, ...state.tickets] }))
    appendActivity(`${ticket.id} created: ${issue}`, bedId)
    return ticket
  },
  setTicketStatus: async (ticketId, status) => {
    const ticket = get().tickets.find((item) => item.id === ticketId)
    if (!ticket || ticket.status === status) return
    if (!await dispatchCommand({ type: 'update_ticket', ticketId, status })) return
    set((state) => ({ tickets: state.tickets.map((item) => item.id === ticketId ? { ...item, status, updatedAt: Date.now() } : item) }))
    appendActivity(`${ticketId} marked ${status}`, ticket.bedId)
  },
  markReportReviewed: async (incidentId, reviewer) => {
    if (get().reportReviews[incidentId]?.status === 'reviewed') return
    if (!await dispatchCommand({ type: 'review_report', incidentId })) return
    const review: ReportReview = { incidentId, status: 'reviewed', reviewedAt: Date.now(), reviewedBy: reviewer }
    set((state) => ({ reportReviews: { ...state.reportReviews, [incidentId]: review } }))
    appendActivity(`CERT-In draft for ${incidentId} reviewed by ${reviewer}`, incidentId)
  },
}))
