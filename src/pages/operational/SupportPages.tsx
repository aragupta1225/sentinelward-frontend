import { useState } from 'react'
import { ActionButton, EmptyState, Panel } from '../../components/ui'
import type { BiomedicalTicket } from '../../domain/operations'
import { useOperationsStore } from '../../store/operationsStore'
import { OperationalPage } from './shared'

const columns: Array<{ status: BiomedicalTicket['status']; label: string }> = [
  { status: 'open', label: 'New' }, { status: 'assigned', label: 'In progress' }, { status: 'resolved', label: 'Done' },
]

function TicketCard({ ticket }: { ticket: BiomedicalTicket }) {
  const [note, setNote] = useState(ticket.note)
  const pendingTicketId = useOperationsStore((state) => state.pendingTicketId)
  const setTicketStatus = useOperationsStore((state) => state.setTicketStatus)
  const nextStatus = ticket.status === 'open' ? 'assigned' : ticket.status === 'assigned' ? 'resolved' : null
  return (
    <Panel as="article" className="ticket-card">
      <header><strong>{ticket.deviceId} · {ticket.bedId}</strong><span>{ticket.id}</span></header>
      <dl><div><dt>Problem</dt><dd>{ticket.issue}</dd></div><div><dt>Suggested fix</dt><dd>{ticket.suggestedFix}</dd></div></dl>
      <p className="ticket-repeat-count"><strong>{ticket.issueCount30Days}</strong> times this device had issues (30 days)</p>
      {nextStatus ? <div className="ticket-update"><label>Work note<textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record what changed" /></label><ActionButton disabled={!note.trim() || pendingTicketId === ticket.id} onClick={() => setTicketStatus(ticket.id, nextStatus, note)}>{pendingTicketId === ticket.id ? 'Saving…' : nextStatus === 'assigned' ? 'Start work' : 'Mark done'}</ActionButton></div> : <p className="ticket-note"><strong>Completion note</strong>{ticket.note}</p>}
    </Panel>
  )
}

export function TicketsPage() {
  const tickets = useOperationsStore((state) => state.tickets)
  const commandError = useOperationsStore((state) => state.commandError)
  const repeatDevices = [...tickets].filter((ticket) => ticket.issueCount30Days > 1).sort((left, right) => right.issueCount30Days - left.issueCount30Days)

  return (
    <OperationalPage title="Biomedical tickets" eyebrow="S9" description="Repair jobs created from loose and drifting device verdicts.">
      {commandError && <p className="command-error" role="alert">{commandError}</p>}
      <div className="ticket-workspace">
        <section className="ticket-board" aria-label="Biomedical ticket board">
          {columns.map((column) => {
            const matches = tickets.filter((ticket) => ticket.status === column.status)
            return <section className="ticket-column" aria-labelledby={`ticket-${column.status}`} key={column.status}><header><h2 id={`ticket-${column.status}`}>{column.label}</h2><span>{matches.length}</span></header><div>{matches.map((ticket) => <TicketCard ticket={ticket} key={ticket.id} />)}{matches.length === 0 && <EmptyState>No tickets in {column.label.toLowerCase()}.</EmptyState>}</div></section>
          })}
        </section>
        <aside className="repeat-devices" aria-labelledby="repeat-title"><p className="eyebrow">30-day history</p><h2 id="repeat-title">Devices with repeat problems</h2><ol>{repeatDevices.map((ticket) => <li key={ticket.deviceId}><span><strong>{ticket.deviceId}</strong><small>{ticket.bedId} · {ticket.issue}</small></span><b>{ticket.issueCount30Days}</b></li>)}</ol></aside>
      </div>
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
