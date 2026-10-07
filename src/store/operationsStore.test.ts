import { describe, expect, it } from 'vitest'
import { useOperationsStore } from './operationsStore'
import { useWardDashboardStore } from './wardDashboardStore'

describe('operational state', () => {
  it('persists ticket creation and resolution outside component state', () => {
    const ticket = useOperationsStore.getState().createTicket('B06', 'Replace damaged sensor cable')
    expect(useOperationsStore.getState().tickets[0]).toEqual(ticket)
    useOperationsStore.getState().setTicketStatus(ticket.id, 'resolved')
    expect(useOperationsStore.getState().tickets.find((item) => item.id === ticket.id)?.status).toBe('resolved')
    expect(useWardDashboardStore.getState().activities.some((event) => event.message.includes(ticket.id))).toBe(true)
  })

  it('records report review without representing it as submission', () => {
    useOperationsStore.getState().markReportReviewed('B09', 'Antara Gupta')
    const review = useOperationsStore.getState().reportReviews.B09
    expect(review.status).toBe('reviewed')
    expect(review.reviewedBy).toBe('Antara Gupta')
    expect(review).not.toHaveProperty('submittedAt')
  })
})
