import { VERDICT_PRESENTATION, type Bed } from '../domain/ward'
import type { WardActivity } from '../store/wardDashboardStore'

interface AlertRailProps {
  beds: readonly Bed[]
  activities: readonly WardActivity[]
  collapsed: boolean
  onToggle: () => void
  onAcknowledge: (bedId: string) => void | Promise<unknown>
  onOpenBed: (bedId: string) => void
}

function relativeTime(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
}

const priorityOrder: Record<Bed['priority'], number> = { high: 0, medium: 1, low: 2, none: 3 }

export function AlertRail({ beds, activities, collapsed, onToggle, onAcknowledge, onOpenBed }: AlertRailProps) {
  const alerts = beds
    .filter((bed) => bed.priority !== 'none')
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  const highCount = alerts.filter((bed) => bed.priority === 'high').length

  return (
    <aside className={`alert-rail ${collapsed ? 'alert-rail--collapsed' : ''}`} aria-label="Ward alerts and events">
      <button className="alert-rail__toggle" type="button" onClick={onToggle} aria-expanded={!collapsed} aria-controls="alert-rail-content">
        <span>Active alerts</span>
        <strong>{alerts.length}</strong>
        {highCount > 0 && <span className="high-count">{highCount} high</span>}
        <span aria-hidden="true">{collapsed ? '←' : '→'}</span>
      </button>

      <div id="alert-rail-content" hidden={collapsed}>
        <div className="alert-rail__section-heading"><h2>Priority queue</h2><span>{alerts.length} active</span></div>
        <div className="alert-list">
          {alerts.map((bed) => (
            <article className={`alert-card alert-card--${bed.priority}`} key={bed.id}>
              <button className="alert-card__open" type="button" onClick={() => onOpenBed(bed.id)}>
                <span><strong>{bed.label}</strong> · {bed.patient.initials}</span>
                <small>{VERDICT_PRESENTATION[bed.verdict].label}</small>
                <p>{bed.reason}</p>
              </button>
              <button className="alert-card__ack" type="button" disabled={bed.acknowledgement !== 'none'} onClick={() => onAcknowledge(bed.id)}>
                {bed.acknowledgement === 'acknowledged' ? 'Acknowledged' : bed.acknowledgement === 'pending' ? 'Acknowledging…' : 'Acknowledge alert'}
              </button>
            </article>
          ))}
        </div>

        <div className="alert-rail__section-heading alert-rail__section-heading--events"><h2>Recent events</h2></div>
        <ol className="event-list">
          {activities.slice(0, 8).map((event) => (
            <li key={event.id}>
              <i className={`event-dot event-dot--${event.priority}`} aria-hidden="true" />
              <div><span>{event.bedId ? `${event.bedId} · ` : ''}{event.message}</span><small>{relativeTime(event.occurredAt)}</small></div>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}
