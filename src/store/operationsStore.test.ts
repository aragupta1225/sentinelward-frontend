import { beforeEach, describe, expect, it } from 'vitest'
import { resetOperationsStore, useOperationsStore } from './operationsStore'
import { useWardDashboardStore } from './wardDashboardStore'
import { configureCommandAdapter } from '../adapters/commandGateway'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'

describe('operational state', () => {
  beforeEach(() => {
    configureCommandAdapter(new MockCommandAdapter())
    resetOperationsStore()
  })

  it('persists ticket creation and resolution outside component state', async () => {
    const ticket = await useOperationsStore.getState().createTicket('B06', 'Replace damaged sensor cable')
    expect(ticket).not.toBeNull()
    expect(useOperationsStore.getState().tickets[0]).toEqual(ticket)
    await useOperationsStore.getState().setTicketStatus(ticket!.id, 'resolved', 'Cable replaced and verified')
    expect(useOperationsStore.getState().tickets.find((item) => item.id === ticket!.id)?.status).toBe('resolved')
    expect(useWardDashboardStore.getState().activities.some((event) => event.message.includes(ticket!.id))).toBe(true)
  })

  it('records report review without representing it as submission', async () => {
    await useOperationsStore.getState().markReportReviewed('B09', 'Antara Gupta')
    const review = useOperationsStore.getState().reportReviews.B09
    expect(review.status).toBe('reviewed')
    expect(review.reviewedBy).toBe('Antara Gupta')
    expect(review).not.toHaveProperty('submittedAt')
  })

  it('does not show optimistic success when the command adapter rejects', async () => {
    const before = useOperationsStore.getState().tickets.length
    configureCommandAdapter({ execute: async () => { throw new Error('Unavailable') } })
    const ticket = await useOperationsStore.getState().createTicket('B10', 'Check disconnected monitor')
    expect(ticket).toBeNull()
    expect(useOperationsStore.getState().tickets).toHaveLength(before)
  })

  it('keeps a ticket in its board column when a status update fails', async () => {
    configureCommandAdapter({ execute: async () => { throw new Error('Unavailable') } })
    expect(await useOperationsStore.getState().setTicketStatus('BIO-104', 'assigned', 'Started inspection')).toBe(false)
    expect(useOperationsStore.getState().tickets.find((ticket) => ticket.id === 'BIO-104')?.status).toBe('open')
    expect(useOperationsStore.getState().commandError).toMatch(/unchanged/)
  })
})
