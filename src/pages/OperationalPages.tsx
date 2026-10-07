import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { can, ROLE_LABELS, ROLES, type Role } from '../domain/access'
import type { ScenarioId } from '../domain/scenarios'
import { VERDICT_PRESENTATION } from '../domain/ward'
import { DEMO_SCENARIOS } from '../mocks/scenarios'
import { useBedDetailStore } from '../store/bedDetailStore'
import { useDemoScenarioStore } from '../store/demoScenarioStore'
import { useOperationsStore } from '../store/operationsStore'
import { useSecurityStore } from '../store/securityStore'
import { useClinicalWorkflowStore } from '../store/clinicalWorkflowStore'
import { useSessionStore } from '../store/sessionStore'
import { useWardDashboardStore } from '../store/wardDashboardStore'

const formatTime = (time: number) => new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(time)
const REPORT_YEAR = 2026

export function LandingPage() {
  const navigate = useNavigate(); const signIn = useSessionStore((s) => s.signIn)
  return <main id="main-content" className="simple-page landing-page"><p className="eyebrow">Clinical monitoring · device integrity</p><h1>SentinelWard</h1><p>Role-based ward awareness that keeps clinical urgency visible even when device data cannot be trusted.</p><div className="page-actions"><Link to="/login">Sign in</Link><button type="button" onClick={() => { signIn('operator'); navigate('/ward') }}>Open development demo</button></div><p className="scope-note">Decision support only. SentinelWard never changes treatment automatically.</p></main>
}

export function LoginPage() {
  const navigate = useNavigate(); const role = useBedDetailStore((s) => s.currentRole); const setRole = useBedDetailStore((s) => s.setRole); const signIn = useSessionStore((s) => s.signIn)
  return <main id="main-content" className="simple-page"><p className="eyebrow">Development authentication</p><h1>Select a role</h1><p>Final identity and permissions will come from the backend authentication contract.</p><label className="field">Role<select value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label><button className="primary-action" type="button" onClick={() => { signIn(role); navigate('/ward') }}>Continue to ward</button></main>
}

export function CensusPage() {
  const beds = useWardDashboardStore((s) => s.beds); const navigate = useNavigate(); const [filter, setFilter] = useState<'all' | 'priority' | 'unacknowledged'>('all'); const role = useBedDetailStore((s) => s.currentRole); const responses = useBedDetailStore((s) => s.responses); const acknowledgeResponse = useBedDetailStore((s) => s.acknowledgeResponse); const clinicians = useClinicalWorkflowStore((s) => s.clinicians); const assignments = useClinicalWorkflowStore((s) => s.assignments); const assignBed = useClinicalWorkflowStore((s) => s.assignBed); const setAssignmentStatus = useClinicalWorkflowStore((s) => s.setAssignmentStatus)
  const visibleBeds = beds.filter((b) => b.occupancy === 'occupied').filter((b) => filter === 'all' || (filter === 'priority' ? b.priority === 'high' : !responses[b.id]?.responseAcknowledgedAt))
  return <Page title="Doctor / tele-ICU census" eyebrow="S5"><div className="census-filters" role="group" aria-label="Census filter">{(['all', 'priority', 'unacknowledged'] as const).map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div><DataTable headers={['Bed', 'Patient', 'Priority', 'Verdict', 'Vitals', 'Assigned clinician', 'Response', 'Detail']}>{visibleBeds.map((b) => { const assignment = assignments.find((item) => item.bedId === b.id); const acknowledged = responses[b.id]?.responseAcknowledgedAt; return <tr key={b.id}><td>{b.label}</td><td>{b.patient.displayName} · {b.patient.age}</td><td>{b.priority}</td><td>{VERDICT_PRESENTATION[b.verdict].label}</td><td>HR {b.readings.heartRate ?? '—'} · SpO₂ {b.readings.spo2 ?? '—'}</td><td><select aria-label={`Assign ${b.label}`} value={assignment?.clinicianId ?? ''} onChange={(event) => assignBed(b.id, event.target.value)}><option value="">Unassigned</option>{clinicians.filter((item) => item.role === 'doctor').map((item) => <option value={item.id} key={item.id}>{item.displayName}</option>)}</select></td><td><button disabled={!can(role, 'acknowledge_alert') || Boolean(acknowledged)} onClick={() => { acknowledgeResponse(b.id); setAssignmentStatus(b.id, 'on_my_way') }}>{acknowledged ? 'On my way recorded' : 'On my way'}</button></td><td><button onClick={() => navigate(`/bed/${b.id}`)}>Open</button></td></tr> })}</DataTable></Page>
}

export function SecurityPage() {
  const beds = useWardDashboardStore((s) => s.beds); const incidents = useSecurityStore((s) => s.incidents)
  return <Page title="Security operations" eyebrow="S6"><div className="security-summary"><strong>{incidents.filter((item) => item.status === 'open').length}</strong><span>open</span><strong>{incidents.filter((item) => item.status === 'contained').length}</strong><span>contained</span><strong>{incidents.filter((item) => item.status === 'resolved').length}</strong><span>resolved</span></div><div className="record-grid">{incidents.map((incident) => { const bed = beds.find((item) => item.id === incident.bedId); return <article className={`record-card incident-card incident-card--${incident.severity}`} key={incident.id}><p className="eyebrow">{incident.id} · {incident.status}</p><h2>{bed ? VERDICT_PRESENTATION[bed.verdict].label : incident.verdict}</h2><p>{incident.summary}</p><strong>{bed?.isolated ? 'Device isolated' : 'Isolation not active'} · {incident.evidence.length} evidence records</strong><Link to={`/incident/${incident.bedId}`}>Open incident</Link></article> })}</div></Page>
}

export function IncidentPage() {
  const { id } = useParams(); const bed = useWardDashboardStore((s) => s.beds.find((b) => b.id === id)); const allActions = useBedDetailStore((s) => s.actions); const actions = allActions.filter((a) => a.bedId === id); const incidents = useSecurityStore((s) => s.incidents); const incident = incidents.find((item) => item.bedId === id); const role = useBedDetailStore((s) => s.currentRole); const captureEvidence = useSecurityStore((s) => s.captureEvidence); const containIncident = useSecurityStore((s) => s.containIncident); const resolveIncident = useSecurityStore((s) => s.resolveIncident)
  if (!bed || !incident) return <Navigate to="/security" replace />
  return <Page title={`Incident · ${bed.label}`} eyebrow={`S7 · ${incident.id}`}><div className="incident-status"><strong>{incident.status.toUpperCase()}</strong><span>{incident.severity} severity · detected {formatTime(incident.detectedAt)}</span></div><div className="record-grid"><article className="record-card"><h2>Incident state</h2><dl><div><dt>Verdict</dt><dd>{VERDICT_PRESENTATION[bed.verdict].label}</dd></div><div><dt>Trust</dt><dd>{bed.trust}% · {bed.trustState}</dd></div><div><dt>Isolation</dt><dd>{bed.isolated ? 'Active' : 'Not active'}</dd></div><div><dt>Lifecycle</dt><dd>{incident.status}</dd></div></dl></article><article className="record-card"><h2>Evidence</h2><ul>{incident.evidence.map((evidence) => <li key={evidence.id}>{evidence.id} · {evidence.label} · {evidence.source}</li>)}</ul><p>Evidence metadata is frontend mock data until backend evidence paths are confirmed.</p></article></div><div className="incident-actions"><button type="button" disabled={!can(role, 'capture_incident_evidence')} onClick={() => captureEvidence(bed.id, role)}>Capture evidence snapshot</button><button type="button" disabled={!can(role, 'contain_incident') || incident.status !== 'open'} onClick={() => containIncident(bed.id, role)}>Contain and isolate device</button><button type="button" disabled={!can(role, 'resolve_incident') || incident.status !== 'contained' || incident.evidence.length === 0} onClick={() => resolveIncident(bed.id, role)}>Mark incident resolved</button></div><h2>Action history</h2><ul className="plain-list">{actions.map((a) => <li key={a.id}><span>{formatTime(a.occurredAt)} · {a.description}</span><small>{a.actor}</small></li>)}</ul><div className="page-actions"><Link to={`/incident/${bed.id}/report`}>Open CERT-In draft</Link></div><p className="scope-note">Resolving an incident does not automatically restore device trust or undo isolation.</p></Page>
}

export function ReportPage() {
  const { id } = useParams(); const bed = useWardDashboardStore((s) => s.beds.find((b) => b.id === id)); const review = useOperationsStore((s) => id ? s.reportReviews[id] : undefined); const markReportReviewed = useOperationsStore((s) => s.markReportReviewed); const incidents = useSecurityStore((s) => s.incidents); const incident = incidents.find((item) => item.bedId === id); const role = useBedDetailStore((s) => s.currentRole)
  if (!bed) return <Navigate to="/security" replace />
  const reviewed = review?.status === 'reviewed'
  return <Page title="CERT-In report draft" eyebrow="S8 · Human submission required"><article className="report-draft"><header><strong>{reviewed ? 'Reviewed draft' : 'Draft · not submitted'}</strong><span>Incident {incident?.id ?? `${bed.id}-${REPORT_YEAR}`}</span></header><h2>Executive summary</h2><p>SentinelWard detected {VERDICT_PRESENTATION[bed.verdict].label.toLowerCase()} affecting {bed.label}. Signal trust was {bed.trust}%. {bed.isolated ? 'The affected device was isolated.' : 'Device isolation was not active.'}</p><h2>Incident evidence</h2><p>{incident?.evidence.length ?? 0} evidence records are associated with this draft. Incident status: {incident?.status ?? 'unavailable'}.</p><h2>Safety boundary</h2><p>No automated action modified patient treatment. Clinical staff retained decision authority.</p>{reviewed && <p>Reviewed by {review.reviewedBy} at {formatTime(review.reviewedAt as number)}.</p>}</article><button className="primary-action" type="button" onClick={() => markReportReviewed(bed.id, 'Antara Gupta')} disabled={reviewed || !can(role, 'review_report')}>{reviewed ? 'Marked reviewed' : can(role, 'review_report') ? 'Mark draft reviewed' : 'Current role cannot review'}</button><p className="scope-note">Official reports are drafted automatically but sent only by an authorized person.</p></Page>
}

export function TicketsPage() {
  const tickets = useOperationsStore((s) => s.tickets); const createTicket = useOperationsStore((s) => s.createTicket); const setTicketStatus = useOperationsStore((s) => s.setTicketStatus)
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); createTicket(String(data.get('bed')).toUpperCase(), String(data.get('issue'))); event.currentTarget.reset() }
  return <Page title="Biomedical tickets" eyebrow="S9"><form className="inline-form" onSubmit={submit}><label>Bed<input name="bed" required pattern="B[0-9]{2}" placeholder="B04" /></label><label>Issue<input name="issue" required minLength={5} placeholder="Describe equipment issue" /></label><button type="submit">Create ticket</button></form><DataTable headers={['Ticket', 'Bed', 'Issue', 'Status', 'Update']}>{tickets.map((t) => <tr key={t.id}><td>{t.id}</td><td>{t.bedId}</td><td>{t.issue}</td><td>{t.status}</td><td><button disabled={t.status === 'resolved'} onClick={() => setTicketStatus(t.id, 'resolved')}>{t.status === 'resolved' ? 'Resolved' : 'Resolve'}</button></td></tr>)}</DataTable></Page>
}

export function BriefingPage() {
  const beds = useWardDashboardStore((s) => s.beds); const high = beds.filter((b) => b.priority === 'high'); const clinicians = useClinicalWorkflowStore((s) => s.clinicians); const assignments = useClinicalWorkflowStore((s) => s.assignments)
  return <Page title="Briefing and workload" eyebrow="S10"><div className="record-grid"><article className="record-card"><h2>Shift priorities</h2><strong>{high.length} high-priority beds</strong><ul>{high.map((b) => <li key={b.id}>{b.label} · {VERDICT_PRESENTATION[b.verdict].label}</li>)}</ul></article><article className="record-card"><h2>Operational queues</h2><p>Doctor / tele-ICU: {high.length} priority reviews</p><p>IT: {beds.filter((b) => b.trustState === 'untrusted').length} integrity reviews</p><p>Biomedical: {beds.filter((b) => ['LOOSE_SENSOR', 'DRIFTING'].includes(b.verdict)).length} device checks</p></article></div><h2>Clinical assignments</h2><div className="workload-grid">{clinicians.map((clinician) => { const active = assignments.filter((item) => item.clinicianId === clinician.id && item.status !== 'complete'); return <article key={clinician.id}><strong>{clinician.displayName}</strong><span>{active.length} / {clinician.capacity} active beds</span><ul>{active.map((item) => <li key={item.bedId}>{item.bedId} · {item.status.replaceAll('_', ' ')}</li>)}</ul></article> })}</div></Page>
}

export function ActionLogPage() {
  const actions = useBedDetailStore((s) => s.actions)
  const activities = useWardDashboardStore((s) => s.activities)
  return <Page title="Action log" eyebrow="S11 · Append-only"><h2>Explicit and automatic actions</h2><DataTable headers={['Time', 'Bed', 'Action', 'Actor', 'Reference']}>{actions.map((a) => <tr key={a.id}><td>{formatTime(a.occurredAt)}</td><td>{a.bedId}</td><td>{a.description}</td><td>{a.actor}</td><td>{a.referencesActionId ?? '—'}</td></tr>)}</DataTable><h2>Ward event stream</h2><DataTable headers={['Time', 'Bed', 'Event', 'Kind', 'Priority']}>{activities.map((a) => <tr key={a.id}><td>{formatTime(a.occurredAt)}</td><td>{a.bedId ?? 'Ward'}</td><td>{a.message}</td><td>{a.kind}</td><td>{a.priority}</td></tr>)}</DataTable></Page>
}

export function DemoPage() {
  const navigate = useNavigate()
  const activeScenarioId = useDemoScenarioStore((s) => s.activeScenarioId)
  const status = useDemoScenarioStore((s) => s.status)
  const elapsedSeconds = useDemoScenarioStore((s) => s.elapsedSeconds)
  const timeline = useDemoScenarioStore((s) => s.timeline)
  const startScenario = useDemoScenarioStore((s) => s.startScenario)
  const reset = useDemoScenarioStore((s) => s.reset)

  return <Page title="Demo control" eyebrow="S12 · deterministic playback">
    <div className="scenario-grid">{Object.values(DEMO_SCENARIOS).map((scenario) => <article className={`scenario-runner ${activeScenarioId === scenario.id ? 'scenario-runner--active' : ''}`} key={scenario.id}><div><strong>{scenario.title}</strong><span>{scenario.durationSeconds}s · {scenario.steps.length} timed events</span></div><button type="button" onClick={() => startScenario(scenario.id as ScenarioId)}>Run scenario</button>{scenario.targetBedId && <button type="button" onClick={() => navigate(`/bed/${scenario.targetBedId}`)}>Open {scenario.targetBedId}</button>}</article>)}</div>
    <section className="scenario-console" aria-live="polite"><header><div><p className="eyebrow">Playback</p><h2>{activeScenarioId ? DEMO_SCENARIOS[activeScenarioId].title : 'No scenario selected'}</h2></div><strong>{status.toUpperCase()} · {elapsedSeconds}s</strong></header><ol>{timeline.map((entry) => <li key={entry.id}><time>+{entry.atSecond}s</time><span>{entry.label}</span></li>)}</ol><button type="button" onClick={reset}>Reset all fixtures</button></section>
  </Page>
}

export function TelegramPage() {
  const templates = ['HIGH ALERT · Bed 3 · Possible clinical emergency. Open SentinelWard for trusted context.', 'DEVICE INTEGRITY · Bed 7 · Incoming data is untrusted. Verify patient and equipment at bedside.', 'BOTH · Bed 8 · Clinical emergency remains active. Device isolated. Use trusted bedside equipment.']
  return <Page title="Telegram message templates" eyebrow="Secondary channel"><p className="scope-note">Telegram is secondary. The central Ward remains fully operational without it.</p><div className="template-list">{templates.map((message) => <article key={message}><span>SentinelWard</span><p>{message}</p><small>No patient name included · central interface is source of truth</small></article>)}</div></Page>
}

function Page({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) { return <main id="main-content" className="simple-page operational-page"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children}</main> }
function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) { return <div className="data-table-wrap"><table className="data-table"><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div> }
