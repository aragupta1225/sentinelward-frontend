import { Link, Navigate, useParams } from 'react-router-dom'
import { ActionButton, Panel, StatusChip } from '../../components/ui'
import { can } from '../../domain/access'
import { VERDICT_PRESENTATION } from '../../domain/ward'
import { useBedDetailStore } from '../../store/bedDetailStore'
import { useOperationsStore } from '../../store/operationsStore'
import { useSecurityStore } from '../../store/securityStore'
import { useWardDashboardStore } from '../../store/wardDashboardStore'
import { formatTime } from './formatTime'
import { OperationalPage } from './shared'

const REPORT_YEAR = 2026

export function SecurityPage() {
  const beds = useWardDashboardStore((state) => state.beds)
  const incidents = useSecurityStore((state) => state.incidents)
  return (
    <OperationalPage title="Security operations" eyebrow="S6" description="Device-integrity incidents stay separate from clinical priority and patient response.">
      <div className="security-summary" aria-label="Incident status summary">
        <strong>{incidents.filter((item) => item.status === 'open').length}</strong><span>open</span>
        <strong>{incidents.filter((item) => item.status === 'contained').length}</strong><span>contained</span>
        <strong>{incidents.filter((item) => item.status === 'resolved').length}</strong><span>resolved</span>
      </div>
      <div className="record-grid">
        {incidents.map((incident) => {
          const bed = beds.find((item) => item.id === incident.bedId)
          return (
            <Panel as="article" className={`record-card incident-card incident-card--${incident.severity}`} key={incident.id}>
              <div className="record-card__meta"><span>{incident.id}</span><StatusChip tone={incident.status === 'open' ? 'critical' : incident.status === 'contained' ? 'warning' : 'positive'}>{incident.status}</StatusChip></div>
              <h2>{bed ? VERDICT_PRESENTATION[bed.verdict].label : incident.verdict}</h2>
              <p>{incident.summary}</p>
              <strong>{bed?.isolated ? 'Device isolated' : 'Isolation not active'} · {incident.evidence.length} evidence records</strong>
              <Link to={`/incident/${incident.bedId}`}>Open incident</Link>
            </Panel>
          )
        })}
      </div>
    </OperationalPage>
  )
}

export function IncidentPage() {
  const { id } = useParams()
  const bed = useWardDashboardStore((state) => state.beds.find((item) => item.id === id))
  const allActions = useBedDetailStore((state) => state.actions)
  const actions = allActions.filter((action) => action.bedId === id)
  const incident = useSecurityStore((state) => state.incidents.find((item) => item.bedId === id))
  const role = useBedDetailStore((state) => state.currentRole)
  const captureEvidence = useSecurityStore((state) => state.captureEvidence)
  const containIncident = useSecurityStore((state) => state.containIncident)
  const resolveIncident = useSecurityStore((state) => state.resolveIncident)
  if (!bed || !incident) return <Navigate to="/security" replace />

  const statusTone = incident.status === 'open' ? 'critical' : incident.status === 'contained' ? 'warning' : 'positive'

  return (
    <OperationalPage
      title={`Incident · ${bed.label}`}
      eyebrow={`S7 · ${incident.id}`}
      description="Capture evidence and contain the device without suppressing clinical emergency state."
      actions={<><StatusChip tone={statusTone} dot>{incident.status.toUpperCase()}</StatusChip><span className="incident-severity">{incident.severity} severity</span></>}
    >
      <p className="incident-detected">Detected {formatTime(incident.detectedAt)}</p>
      <div className="record-grid">
        <Panel as="article" className="record-card">
          <h2>Incident state</h2>
          <dl><div><dt>Verdict</dt><dd>{VERDICT_PRESENTATION[bed.verdict].label}</dd></div><div><dt>Trust</dt><dd>{bed.trust}% · {bed.trustState}</dd></div><div><dt>Isolation</dt><dd>{bed.isolated ? 'Active' : 'Not active'}</dd></div><div><dt>Lifecycle</dt><dd>{incident.status}</dd></div></dl>
        </Panel>
        <Panel as="article" className="record-card">
          <h2>Evidence</h2>
          <ul>{incident.evidence.map((evidence) => <li key={evidence.id}>{evidence.id} · {evidence.label} · {evidence.source}</li>)}</ul>
          <p>Evidence metadata is frontend mock data until backend evidence paths are confirmed.</p>
        </Panel>
      </div>
      <div className="incident-actions">
        <ActionButton disabled={!can(role, 'capture_incident_evidence')} onClick={() => captureEvidence(bed.id, role)}>Capture evidence snapshot</ActionButton>
        <ActionButton tone="danger" disabled={!can(role, 'contain_incident') || incident.status !== 'open'} onClick={() => containIncident(bed.id, role)}>Contain and isolate device</ActionButton>
        <ActionButton tone="primary" disabled={!can(role, 'resolve_incident') || incident.status !== 'contained' || incident.evidence.length === 0} onClick={() => resolveIncident(bed.id, role)}>Mark incident resolved</ActionButton>
      </div>
      <h2>Action history</h2>
      <ul className="plain-list">{actions.map((action) => <li key={action.id}><span>{formatTime(action.occurredAt)} · {action.description}</span><small>{action.actor}</small></li>)}</ul>
      <div className="page-actions"><Link to={`/incident/${bed.id}/report`}>Open CERT-In draft</Link></div>
      <p className="scope-note">Resolving an incident does not automatically restore device trust or undo isolation.</p>
    </OperationalPage>
  )
}

export function ReportPage() {
  const { id } = useParams()
  const bed = useWardDashboardStore((state) => state.beds.find((item) => item.id === id))
  const review = useOperationsStore((state) => id ? state.reportReviews[id] : undefined)
  const markReportReviewed = useOperationsStore((state) => state.markReportReviewed)
  const incident = useSecurityStore((state) => state.incidents.find((item) => item.bedId === id))
  const role = useBedDetailStore((state) => state.currentRole)
  if (!bed) return <Navigate to="/security" replace />
  const reviewed = review?.status === 'reviewed'

  return (
    <OperationalPage
      title="CERT-In report draft"
      eyebrow="S8 · Human submission required"
      description="Reviewable incident context only; submission always requires an authorized person."
      actions={<StatusChip tone={reviewed ? 'positive' : 'warning'}>{reviewed ? 'Reviewed draft' : 'Draft · not submitted'}</StatusChip>}
    >
      <Panel as="article" className="report-draft">
        <header><strong>{reviewed ? 'Reviewed draft' : 'Draft · not submitted'}</strong><span>Incident {incident?.id ?? `${bed.id}-${REPORT_YEAR}`}</span></header>
        <h2>Executive summary</h2><p>SentinelWard detected {VERDICT_PRESENTATION[bed.verdict].label.toLowerCase()} affecting {bed.label}. Signal trust was {bed.trust}%. {bed.isolated ? 'The affected device was isolated.' : 'Device isolation was not active.'}</p>
        <h2>Incident evidence</h2><p>{incident?.evidence.length ?? 0} evidence records are associated with this draft. Incident status: {incident?.status ?? 'unavailable'}.</p>
        <h2>Safety boundary</h2><p>No automated action modified patient treatment. Clinical staff retained decision authority.</p>
        {reviewed && <p>Reviewed by {review.reviewedBy} at {formatTime(review.reviewedAt as number)}.</p>}
      </Panel>
      <ActionButton tone="primary" onClick={() => markReportReviewed(bed.id, 'Antara Gupta')} disabled={reviewed || !can(role, 'review_report')}>{reviewed ? 'Marked reviewed' : can(role, 'review_report') ? 'Mark draft reviewed' : 'Current role cannot review'}</ActionButton>
      <p className="scope-note">Official reports are drafted automatically but sent only by an authorized person.</p>
    </OperationalPage>
  )
}
