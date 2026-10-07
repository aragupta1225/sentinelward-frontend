import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ROLE_LABELS, ROLES, type Role } from '../domain/access'
import type { ScenarioId } from '../domain/scenarios'
import { VERDICT_PRESENTATION } from '../domain/ward'
import { DEMO_SCENARIOS } from '../mocks/scenarios'
import { useBedDetailStore } from '../store/bedDetailStore'
import { useDemoScenarioStore } from '../store/demoScenarioStore'
import { useWardDashboardStore } from '../store/wardDashboardStore'

const formatTime = (time: number) => new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(time)
const REPORT_YEAR = 2026

export function LandingPage() {
  return <main id="main-content" className="simple-page landing-page"><p className="eyebrow">Clinical monitoring · device integrity</p><h1>SentinelWard</h1><p>Role-based ward awareness that keeps clinical urgency visible even when device data cannot be trusted.</p><div className="page-actions"><Link to="/login">Sign in</Link><Link to="/ward">Open development demo</Link></div><p className="scope-note">Decision support only. SentinelWard never changes treatment automatically.</p></main>
}

export function LoginPage() {
  const navigate = useNavigate(); const role = useBedDetailStore((s) => s.currentRole); const setRole = useBedDetailStore((s) => s.setRole)
  return <main id="main-content" className="simple-page"><p className="eyebrow">Development authentication</p><h1>Select a role</h1><p>Final identity and permissions will come from the backend authentication contract.</p><label className="field">Role<select value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label><button className="primary-action" type="button" onClick={() => navigate('/ward')}>Continue to ward</button></main>
}

export function CensusPage() {
  const beds = useWardDashboardStore((s) => s.beds); const navigate = useNavigate()
  return <Page title="Doctor / tele-ICU census" eyebrow="S5"><DataTable headers={['Bed', 'Patient', 'Priority', 'Verdict', 'Vitals', 'Action']}>{beds.filter((b) => b.occupancy === 'occupied').map((b) => <tr key={b.id}><td>{b.label}</td><td>{b.patient.displayName} · {b.patient.age}</td><td>{b.priority}</td><td>{VERDICT_PRESENTATION[b.verdict].label}</td><td>HR {b.readings.heartRate ?? '—'} · SpO₂ {b.readings.spo2 ?? '—'}</td><td><button onClick={() => navigate(`/bed/${b.id}`)}>Open</button></td></tr>)}</DataTable></Page>
}

export function SecurityPage() {
  const beds = useWardDashboardStore((s) => s.beds); const risky = beds.filter((b) => b.trustState === 'untrusted' || b.isolated)
  return <Page title="Security operations" eyebrow="S6"><div className="record-grid">{risky.map((b) => <article className="record-card" key={b.id}><p className="eyebrow">{b.id} · trust {b.trust}%</p><h2>{VERDICT_PRESENTATION[b.verdict].label}</h2><p>{b.reason}</p><strong>{b.isolated ? 'Device isolated' : 'Isolation not active'}</strong><Link to={`/incident/${b.id}`}>Open incident</Link></article>)}</div></Page>
}

export function IncidentPage() {
  const { id } = useParams(); const bed = useWardDashboardStore((s) => s.beds.find((b) => b.id === id)); const allActions = useBedDetailStore((s) => s.actions); const actions = allActions.filter((a) => a.bedId === id)
  if (!bed) return <Navigate to="/security" replace />
  return <Page title={`Incident · ${bed.label}`} eyebrow="S7"><div className="record-grid"><article className="record-card"><h2>Incident state</h2><dl><div><dt>Verdict</dt><dd>{VERDICT_PRESENTATION[bed.verdict].label}</dd></div><div><dt>Trust</dt><dd>{bed.trust}% · {bed.trustState}</dd></div><div><dt>Isolation</dt><dd>{bed.isolated ? 'Active' : 'Not active'}</dd></div></dl></article><article className="record-card"><h2>Evidence summary</h2><p>{bed.reason}</p><p>Last trusted readings remain visible. Raw evidence retrieval awaits the backend evidence endpoint.</p></article></div><h2>Action history</h2><ul className="plain-list">{actions.map((a) => <li key={a.id}><span>{formatTime(a.occurredAt)} · {a.description}</span><small>{a.actor}</small></li>)}</ul><div className="page-actions"><Link to={`/incident/${bed.id}/report`}>Open CERT-In draft</Link></div></Page>
}

export function ReportPage() {
  const { id } = useParams(); const [reviewed, setReviewed] = useState(false); const bed = useWardDashboardStore((s) => s.beds.find((b) => b.id === id))
  if (!bed) return <Navigate to="/security" replace />
  return <Page title="CERT-In report draft" eyebrow="S8 · Human submission required"><article className="report-draft"><header><strong>{reviewed ? 'Reviewed draft' : 'Draft · not submitted'}</strong><span>Incident {bed.id}-{REPORT_YEAR}</span></header><h2>Executive summary</h2><p>SentinelWard detected {VERDICT_PRESENTATION[bed.verdict].label.toLowerCase()} affecting {bed.label}. Signal trust was {bed.trust}%. {bed.isolated ? 'The affected device was isolated.' : 'Device isolation was not active.'}</p><h2>Safety boundary</h2><p>No automated action modified patient treatment. Clinical staff retained decision authority.</p></article><button className="primary-action" type="button" onClick={() => setReviewed(true)} disabled={reviewed}>{reviewed ? 'Marked reviewed' : 'Mark draft reviewed'}</button><p className="scope-note">Official reports are drafted automatically but sent only by an authorized person.</p></Page>
}

export function TicketsPage() {
  const [tickets, setTickets] = useState([{ id: 'BIO-104', bed: 'B04', issue: 'Reseat ECG leads', status: 'Open' }, { id: 'BIO-101', bed: 'B05', issue: 'Inspect drifting SpO₂ sensor', status: 'Assigned' }])
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); setTickets((items) => [{ id: `BIO-${105 + items.length}`, bed: String(data.get('bed')), issue: String(data.get('issue')), status: 'Open' }, ...items]); event.currentTarget.reset() }
  return <Page title="Biomedical tickets" eyebrow="S9"><form className="inline-form" onSubmit={submit}><label>Bed<input name="bed" required placeholder="B04" /></label><label>Issue<input name="issue" required placeholder="Describe equipment issue" /></label><button type="submit">Create ticket</button></form><DataTable headers={['Ticket', 'Bed', 'Issue', 'Status', 'Update']}>{tickets.map((t) => <tr key={t.id}><td>{t.id}</td><td>{t.bed}</td><td>{t.issue}</td><td>{t.status}</td><td><button onClick={() => setTickets((items) => items.map((item) => item.id === t.id ? { ...item, status: 'Resolved' } : item))}>Resolve</button></td></tr>)}</DataTable></Page>
}

export function BriefingPage() {
  const beds = useWardDashboardStore((s) => s.beds); const high = beds.filter((b) => b.priority === 'high')
  return <Page title="Briefing and workload" eyebrow="S10"><div className="record-grid"><article className="record-card"><h2>Shift priorities</h2><strong>{high.length} high-priority beds</strong><ul>{high.map((b) => <li key={b.id}>{b.label} · {VERDICT_PRESENTATION[b.verdict].label}</li>)}</ul></article><article className="record-card"><h2>Provisional workload</h2><p>Nurse: 4 assigned beds</p><p>Doctor / tele-ICU: {high.length} priority reviews</p><p>IT: {beds.filter((b) => b.trustState === 'untrusted').length} integrity reviews</p><p>Biomedical: {beds.filter((b) => ['LOOSE_SENSOR', 'DRIFTING'].includes(b.verdict)).length} device checks</p></article></div></Page>
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
