import { useEffect, useMemo, useState } from 'react'
import { ALERT_LADDER, type AlertStatus, type WardAlert } from '../../domain/alerts'
import { ROLE_LABELS } from '../../domain/access'
import { ActionButton, EmptyState, PageHeader, Panel, StatusChip, type StatusTone } from '../../components/ui'
import { useAlertStore } from '../../store/alertStore'
import { useBedDetailStore } from '../../store/bedDetailStore'

type AlertFilter = AlertStatus | 'all'

const FILTERS: ReadonlyArray<{ id: AlertFilter; label: string }> = [
  { id: 'open', label: 'Open' },
  { id: 'acknowledged', label: 'Acknowledged' },
  { id: 'all', label: 'All' },
]

const PRIORITY_TONES: Record<WardAlert['priority'], StatusTone> = {
  high: 'critical', medium: 'warning', low: 'neutral',
}

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(timestamp)
}

function waitingLabel(alert: WardAlert, now: number) {
  const end = alert.acknowledgedAt ?? now
  const seconds = Math.max(0, Math.floor((end - alert.openedAt) / 1000))
  const minutes = Math.floor(seconds / 60)
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
}

function AlertDetails({ alert, now, pending, onClose, onAcknowledge }: {
  alert: WardAlert
  now: number
  pending: boolean
  onClose: () => void
  onAcknowledge: () => void
}) {
  return (
    <aside className="alert-sheet" aria-labelledby="alert-details-title">
      <header>
        <div>
          <p className="eyebrow">Alert detail · {alert.id}</p>
          <h2 id="alert-details-title">{alert.bedLabel}: {alert.verdict}</h2>
        </div>
        <ActionButton tone="quiet" onClick={onClose} aria-label="Close alert details">Close</ActionButton>
      </header>

      <p className="alert-sheet__reason">{alert.reason}</p>
      <dl className="alert-sheet__facts">
        <div><dt>Status</dt><dd>{alert.status}</dd></div>
        <div><dt>Priority</dt><dd>{alert.priority}</dd></div>
        <div><dt>Waiting</dt><dd>{waitingLabel(alert, now)}</dd></div>
      </dl>

      <h3>Three-step response ladder</h3>
      <ol className="alert-ladder">
        {ALERT_LADDER.map((recipient, index) => {
          const step = index + 1
          const reached = step <= alert.ladderStep
          const active = step === alert.ladderStep && alert.status === 'open'
          return (
            <li key={recipient} className={reached ? 'alert-ladder__step alert-ladder__step--reached' : 'alert-ladder__step'}>
              <span aria-hidden="true">{step}</span>
              <div><strong>{recipient}</strong><small>{index === 0 ? 'Immediately' : `After ${index * 30} seconds without acknowledgement`}</small></div>
              <em>{active ? 'Current' : reached ? 'Sent' : 'Pending'}</em>
            </li>
          )
        })}
      </ol>

      <h3>Response history</h3>
      <ol className="alert-history">
        {alert.responseHistory.map((event) => <li key={event.id}><time dateTime={new Date(event.occurredAt).toISOString()}>{formatClock(event.occurredAt)}</time><span>{event.message}</span></li>)}
      </ol>

      <h3>Telegram message</h3>
      <blockquote className="telegram-preview">{alert.telegramMessage}</blockquote>

      {alert.status === 'open'
        ? <ActionButton tone="primary" onClick={onAcknowledge} disabled={pending}>{pending ? 'Recording…' : 'Acknowledge alert'}</ActionButton>
        : <p className="alert-sheet__acknowledged">Acknowledged by {alert.acknowledgedBy} at {formatClock(alert.acknowledgedAt!)}</p>}
    </aside>
  )
}

export function AlertsPage() {
  const alerts = useAlertStore((state) => state.alerts)
  const now = useAlertStore((state) => state.clock)
  const pendingAlertId = useAlertStore((state) => state.pendingAlertId)
  const commandError = useAlertStore((state) => state.commandError)
  const advanceEscalations = useAlertStore((state) => state.advanceEscalations)
  const acknowledgeAlert = useAlertStore((state) => state.acknowledgeAlert)
  const role = useBedDetailStore((state) => state.currentRole)
  const [filter, setFilter] = useState<AlertFilter>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    advanceEscalations()
    const timer = window.setInterval(() => advanceEscalations(), 1000)
    return () => window.clearInterval(timer)
  }, [advanceEscalations])

  const filtered = useMemo(() => alerts.filter((alert) => filter === 'all' || alert.status === filter), [alerts, filter])
  const selected = alerts.find((alert) => alert.id === selectedId) ?? null

  return (
    <main id="main-content" className="simple-page operational-page alerts-page">
      <PageHeader eyebrow="Ward 6 · Clinical response" title="Alerts and escalation" description="High-priority alerts advance every 30 seconds until a nurse or doctor acknowledges them. Integrity-only events stay with IT." />

      {commandError && <p className="ward-status-message ward-status-message--error" role="alert">{commandError}</p>}

      <div className="alert-filters" role="group" aria-label="Alert status">
        {FILTERS.map((item) => {
          const count = item.id === 'all' ? alerts.length : alerts.filter((alert) => alert.status === item.id).length
          return <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label} <strong>{count}</strong></button>
        })}
      </div>

      {filtered.length === 0 ? <EmptyState>No open alerts. All beds calm.</EmptyState> : (
        <div className="data-table-wrap alert-table-wrap">
          <table className="data-table alert-table">
            <caption className="sr-only">{filter === 'all' ? 'All' : filter} ward alerts</caption>
            <thead><tr><th>Time</th><th>Bed</th><th>Priority</th><th>What</th><th>Sent to</th><th>Ladder</th><th>Waiting</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((alert) => (
                <tr key={alert.id}>
                  <td><time dateTime={new Date(alert.openedAt).toISOString()}>{formatClock(alert.openedAt)}</time></td>
                  <td><strong>{alert.bedLabel}</strong></td>
                  <td><StatusChip tone={PRIORITY_TONES[alert.priority]} dot>{alert.priority}</StatusChip></td>
                  <td><strong>{alert.verdict}</strong><small>{alert.reason}</small></td>
                  <td>{alert.assignedTo}</td>
                  <td>{alert.ladderStep} / 3</td>
                  <td>{waitingLabel(alert, now)}</td>
                  <td><div className="alert-table__actions"><ActionButton tone="quiet" onClick={() => setSelectedId(alert.id)}>View details</ActionButton>{alert.status === 'open' && <ActionButton onClick={() => acknowledgeAlert(alert.id, ROLE_LABELS[role])} disabled={pendingAlertId === alert.id}>{pendingAlertId === alert.id ? 'Recording…' : 'Acknowledge'}</ActionButton>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <AlertDetails alert={selected} now={now} pending={pendingAlertId === selected.id} onClose={() => setSelectedId(null)} onAcknowledge={() => acknowledgeAlert(selected.id, ROLE_LABELS[role])} />}
      <Panel className="alerts-scope-note"><strong>Demo timing</strong><span>30-second escalation is enabled for evaluation. The production interval is 60 seconds.</span></Panel>
    </main>
  )
}
