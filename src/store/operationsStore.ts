import { create } from 'zustand'
import { dispatchCommand } from '../adapters/commandGateway'
import type { BiomedicalTicket, ReportReview } from '../domain/operations'
import { useWardDashboardStore, type WardActivity } from './wardDashboardStore'

interface OperationsState {
  tickets: BiomedicalTicket[]
  reportReviews: Record<string, ReportReview>
  pendingTicketId: string | null
  commandError: string | null
  createTicket: (bedId: string, issue: string) => Promise<BiomedicalTicket | null>
  setTicketStatus: (ticketId: string, status: BiomedicalTicket['status'], note: string) => Promise<boolean>
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
  { id: 'BIO-104', bedId: 'B04', deviceId: 'MON-04', issue: 'ECG leads lose contact repeatedly, loose sensor', suggestedFix: 'Reseat the ECG leads; inspect and replace the cable if contact drops again', issueCount30Days: 4, note: '', status: 'open', createdAt: Date.now() - 420_000, updatedAt: Date.now() - 420_000 },
  { id: 'BIO-101', bedId: 'B05', deviceId: 'MON-05', issue: 'BP line reads 12 mmHg above cuff for 18 min, drifting', suggestedFix: 'Re-level and re-zero the transducer; take a cuff reading', issueCount30Days: 7, note: 'Cuff comparison requested', status: 'assigned', createdAt: Date.now() - 900_000, updatedAt: Date.now() - 600_000 },
  { id: 'BIO-099', bedId: 'B02', deviceId: 'MON-02', issue: 'SpO₂ probe disconnected intermittently', suggestedFix: 'Replace the probe and verify a stable signal for five minutes', issueCount30Days: 3, note: 'Probe replaced and signal observed', status: 'resolved', createdAt: Date.now() - 2_400_000, updatedAt: Date.now() - 1_200_000 },
]

export const useOperationsStore = create<OperationsState>((set, get) => ({
  tickets: initialTickets,
  reportReviews: {},
  pendingTicketId: null,
  commandError: null,
  createTicket: async (bedId, issue) => {
    ticketSequence += 1
    const ticket: BiomedicalTicket = {
      id: `BIO-${ticketSequence}`, bedId, deviceId: `MON-${bedId.slice(1)}`, issue,
      suggestedFix: 'Inspect the device and verify against a trusted reference', issueCount30Days: 1,
      note: '', status: 'open', createdAt: Date.now(), updatedAt: Date.now(),
    }
    if (!await dispatchCommand({ type: 'create_ticket', bedId, issue })) return null
    set((state) => ({ tickets: [ticket, ...state.tickets] }))
    appendActivity(`${ticket.id} created: ${issue}`, bedId)
    return ticket
  },
  setTicketStatus: async (ticketId, status, note) => {
    const ticket = get().tickets.find((item) => item.id === ticketId)
    if (!ticket || ticket.status === status || !note.trim()) return false
    set({ pendingTicketId: ticketId, commandError: null })
    if (!await dispatchCommand({ type: 'update_ticket', ticketId, status, note: note.trim() })) {
      set({ pendingTicketId: null, commandError: `${ticketId} update failed. Its board status is unchanged.` })
      return false
    }
    set((state) => ({
      tickets: state.tickets.map((item) => item.id === ticketId ? { ...item, status, note: note.trim(), updatedAt: Date.now() } : item),
      pendingTicketId: null,
    }))
    appendActivity(`${ticketId} marked ${status}: ${note.trim()}`, ticket.bedId)
    return true
  },
  markReportReviewed: async (incidentId, reviewer) => {
    if (get().reportReviews[incidentId]?.status === 'reviewed') return
    if (!await dispatchCommand({ type: 'review_report', incidentId })) return
    const review: ReportReview = { incidentId, status: 'reviewed', reviewedAt: Date.now(), reviewedBy: reviewer }
    set((state) => ({ reportReviews: { ...state.reportReviews, [incidentId]: review } }))
    appendActivity(`CERT-In draft for ${incidentId} reviewed by ${reviewer}`, incidentId)
  },
}))

export function resetOperationsStore() {
  useOperationsStore.setState({ tickets: structuredClone(initialTickets), reportReviews: {}, pendingTicketId: null, commandError: null })
}
