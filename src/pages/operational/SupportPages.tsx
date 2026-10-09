import type { FormEvent } from 'react'
import { ActionButton, Panel } from '../../components/ui'
import { useOperationsStore } from '../../store/operationsStore'
import { DataTable, OperationalPage } from './shared'

export function TicketsPage() {
  const tickets = useOperationsStore((state) => state.tickets)
  const createTicket = useOperationsStore((state) => state.createTicket)
  const setTicketStatus = useOperationsStore((state) => state.setTicketStatus)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const ticket = await createTicket(String(data.get('bed')).toUpperCase(), String(data.get('issue')))
    if (ticket) form.reset()
  }

  return (
    <OperationalPage title="Biomedical tickets" eyebrow="S9" description="Track equipment follow-up without changing clinical or device-integrity state.">
      <Panel as="section" className="form-panel" aria-label="Create biomedical ticket">
        <form className="inline-form" onSubmit={submit}>
          <label>Bed<input name="bed" required pattern="B[0-9]{2}" placeholder="B04" /></label>
          <label>Issue<input name="issue" required minLength={5} placeholder="Describe equipment issue" /></label>
          <ActionButton tone="primary" type="submit">Create ticket</ActionButton>
        </form>
      </Panel>
      <DataTable headers={['Ticket', 'Bed', 'Issue', 'Status', 'Update']} emptyMessage={tickets.length === 0 ? 'No biomedical tickets have been created.' : undefined}>
        {tickets.map((ticket) => <tr key={ticket.id}><td>{ticket.id}</td><td>{ticket.bedId}</td><td>{ticket.issue}</td><td>{ticket.status}</td><td><ActionButton disabled={ticket.status === 'resolved'} onClick={() => setTicketStatus(ticket.id, 'resolved')}>{ticket.status === 'resolved' ? 'Resolved' : 'Resolve'}</ActionButton></td></tr>)}
      </DataTable>
    </OperationalPage>
  )
}

export function TelegramPage() {
  const templates = [
    'HIGH ALERT · Bed 3 · Possible clinical emergency. Open SentinelWard for trusted context.',
    'DEVICE INTEGRITY · Bed 7 · Incoming data is untrusted. Verify patient and equipment at bedside.',
    'BOTH · Bed 8 · Clinical emergency remains active. Device isolated. Use trusted bedside equipment.',
  ]
  return (
    <OperationalPage title="Telegram message templates" eyebrow="Secondary channel" description="Minimal notifications point recipients back to the central interface without exposing patient names.">
      <p className="scope-note">Telegram is secondary. The central Ward remains fully operational without it.</p>
      <div className="template-list">
        {templates.map((message) => <Panel as="article" key={message}><span>SentinelWard</span><p>{message}</p><small>No patient name included · central interface is source of truth</small></Panel>)}
      </div>
    </OperationalPage>
  )
}
