import { useState } from 'react'
import { ActionButton, EmptyState, Panel } from '../../components/ui'
import { WaveformCanvas } from '../../components/WaveformCanvas'
import type { BiomedicalTicket } from '../../domain/operations'
import type { TelegramMessage } from '../../domain/telegram'
import { getFixture } from '../../mocks/fixtures'
import { useBedDetailStore } from '../../store/bedDetailStore'
import { useOperationsStore } from '../../store/operationsStore'
import { useSessionStore } from '../../store/sessionStore'
import { useTelegramStore } from '../../store/telegramStore'
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
  const messages = useTelegramStore((state) => state.messages)
  const queue = useTelegramStore((state) => state.queue)
  const pressButton = useTelegramStore((state) => state.pressButton)
  const queueRepeat = useTelegramStore((state) => state.queueRepeat)
  const role = useBedDetailStore((state) => state.currentRole)
  const actor = useSessionStore((state) => state.displayName) ?? 'Antara Gupta'

  const renderMessage = (message: TelegramMessage) => {
    const queued = queue.find((item) => item.messageId === message.id)?.repeats ?? 0
    const captionLength = [message.firstLine, message.body, message.time].filter(Boolean).join('\n').length
    const waveform = message.bedId ? getFixture(message.bedId).waveform : null
    return (
      <Panel as="article" className="telegram-card" data-testid="telegram-message" key={message.id}>
        <header><div><p className="eyebrow">{message.event}</p><h2>{message.recipient}</h2></div><span>rev {message.revision}</span></header>
        {message.highAlert && waveform && <figure className="telegram-waveform"><WaveformCanvas data={waveform} durationSeconds={12} /><figcaption>sendPhoto · 12-second waveform · caption {captionLength}/1024 characters</figcaption></figure>}
        <div className="telegram-bubble">
          {message.editedStatus && <p className="telegram-edited" role="status">{message.editedStatus}</p>}
          <strong>{message.firstLine}</strong>
          {message.body && <p>{message.body}</p>}
          <time>{message.time}</time>
          {message.repeatCount > 0 && <small>{message.repeatCount} repeat{message.repeatCount === 1 ? '' : 's'} merged into this message.</small>}
        </div>
        <div className="telegram-buttons">
          {message.buttons.map((button) => {
            const allowed = button.allowedRoles.includes(role)
            return <div key={button.callbackData}><ActionButton disabled={!allowed} onClick={() => pressButton(message.id, button.callbackData, actor, role)}>{button.label}</ActionButton><code>{button.callbackData} · {new TextEncoder().encode(button.callbackData).length}/64 bytes</code>{!allowed && <small>{button.allowedRoles.includes('it') ? 'IT only' : 'Clinical role only'}</small>}</div>
          })}
        </div>
        <ActionButton tone="quiet" onClick={() => queueRepeat(message.id)}>Simulate repeat</ActionButton>
        {queued > 0 && <p className="telegram-queue" role="status">{queued} repeat{queued === 1 ? '' : 's'} queued as one edit · delivery limited to 1 message/s per chat</p>}
      </Panel>
    )
  }

  return (
    <OperationalPage title="Telegram message templates" eyebrow="Secondary channel" description="Exact mock notifications, callback controls, and edit-in-place behavior without patient names.">
      <p className="scope-note">Telegram is secondary. The central Ward remains fully operational without it.</p>
      <Panel className="telegram-policy"><strong>Delivery policy</strong><span>At most 1 message per second per chat. Extra messages queue; repeats for the same bed and event merge into the existing message.</span></Panel>
      <div className="telegram-template-grid">{messages.map(renderMessage)}</div>
    </OperationalPage>
  )
}
