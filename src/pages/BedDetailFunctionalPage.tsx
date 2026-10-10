import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BedTile } from '../components/BedTile'
import { TrendChart } from '../components/TrendChart'
import { ActionButton, EmptyState, PageHeader, Panel } from '../components/ui'
import { can, ROLE_LABELS, ROLES, type Role } from '../domain/access'
import { createMockBedAnalysis } from '../domain/bedAnalysis'
import { VERDICT_PRESENTATION } from '../domain/ward'
import { createThirtyMinuteTrend } from '../mocks/trendFixtures'
import { useBedDetailStore } from '../store/bedDetailStore'
import { useWardDashboardStore } from '../store/wardDashboardStore'

type DetailTab = 'overview' | 'trends' | 'actions'

function formatTime(timestamp: number | null) {
  return timestamp ? new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(timestamp) : 'Not recorded'
}

function formatCountdown(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function formatVital(value: number | null) {
  return value === null ? 'NO DATA' : value
}

export function BedDetailFunctionalPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const bed = useWardDashboardStore((state) => state.beds.find((item) => item.id === id))
  const [tab, setTab] = useState<DetailTab>('overview')
  const currentRole = useBedDetailStore((state) => state.currentRole)
  const setRole = useBedDetailStore((state) => state.setRole)
  const response = useBedDetailStore((state) => id ? state.responses[id] : undefined)
  const actions = useBedDetailStore((state) => state.actions)
  const manualReadings = useBedDetailStore((state) => id ? state.manualReadings[id] : undefined)
  const nextManualCheckAt = useBedDetailStore((state) => id ? state.nextManualCheckAt[id] : undefined)
  const pendingCommand = useBedDetailStore((state) => state.pendingCommand)
  const commandError = useBedDetailStore((state) => state.commandError)
  const acknowledgeResponse = useBedDetailStore((state) => state.acknowledgeResponse)
  const escalateAlert = useBedDetailStore((state) => state.escalateAlert)
  const confirmPatient = useBedDetailStore((state) => state.confirmPatient)
  const recordManualReading = useBedDetailStore((state) => state.recordManualReading)
  const undoAction = useBedDetailStore((state) => state.undoAction)
  const trend = useMemo(() => bed ? createThirtyMinuteTrend(bed) : null, [bed])
  const analysis = useMemo(() => bed ? createMockBedAnalysis(bed) : null, [bed])
  const [now, setNow] = useState(() => Date.now())
  const [fallbackManualCheckAt] = useState(() => Date.now() + 300_000)
  const [manualForm, setManualForm] = useState({ heartRate: '', spo2: '', notes: '' })

  useEffect(() => {
    if (bed?.trustState !== 'untrusted') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [bed?.trustState])

  if (!bed || !trend || !analysis) return <Navigate to="/ward" replace />

  const bedActions = actions.filter((action) => action.bedId === bed.id)
  const responseState = response ?? { responseAcknowledgedAt: null, bedsideStatus: 'pending', bedsideConfirmedAt: null }
  const undoableIsolation = bedActions.find((action) => action.type === 'device_isolated' && action.undoable && !bedActions.some((candidate) => candidate.referencesActionId === action.id))
  const clinicalActionsAllowed = currentRole === 'nurse'
  const latestManualReading = manualReadings?.[0]

  const submitManualReading = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const saved = await recordManualReading(bed.id, {
      heartRate: Number(manualForm.heartRate), spo2: Number(manualForm.spo2), notes: manualForm.notes.trim(),
    })
    if (saved) setManualForm({ heartRate: '', spo2: '', notes: '' })
  }

  return (
    <main id="main-content" className="bed-detail-page bed-detail-page--functional">
      <ActionButton tone="quiet" className="back-button" onClick={() => navigate(-1)}>← Back to ward</ActionButton>
      <PageHeader
        eyebrow="Bed detail · live mock data"
        title={`${bed.label} · ${bed.patient.displayName}`}
        description={`${VERDICT_PRESENTATION[bed.verdict].label} · ${bed.reason}`}
        actions={<div className="detail-header-actions"><label className="role-selector">Acting role<select value={currentRole} onChange={(event) => setRole(event.target.value as Role)}>{ROLES.map((role) => <option value={role} key={role}>{ROLE_LABELS[role]}</option>)}</select></label><div><ActionButton tone="primary" disabled={!clinicalActionsAllowed || responseState.responseAcknowledgedAt !== null} onClick={() => acknowledgeResponse(bed.id)}>{responseState.responseAcknowledgedAt ? `Recorded · ${formatTime(responseState.responseAcknowledgedAt)}` : 'On my way'}</ActionButton><ActionButton disabled={!clinicalActionsAllowed || bed.priority === 'none' || pendingCommand === 'escalate'} onClick={() => escalateAlert(bed.id)}>{pendingCommand === 'escalate' ? 'Escalating…' : 'Escalate'}</ActionButton></div></div>}
      />

      {commandError && <p className="ward-status-message ward-status-message--error" role="alert">{commandError}</p>}

      <nav className="detail-tabs" aria-label="Bed detail sections">
        {(['overview', 'trends', 'actions'] as DetailTab[]).map((item) => <button type="button" key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{item}</button>)}
      </nav>

      {tab === 'overview' && (
        <div className="detail-overview">
          <div className="detail-signal-column">
            <BedTile bed={bed} />

            {bed.trustState === 'untrusted' && <Panel className="incoming-untrusted" aria-labelledby="incoming-untrusted-title"><p className="eyebrow">Safety hold</p><h2 id="incoming-untrusted-title">LAST TRUSTED · {formatTime(bed.trustedSnapshot?.capturedAt ?? null)}</h2><p>The main signal stays frozen at the last trusted reading. Do not use the incoming monitor values for treatment.</p><div><strong>incoming (not trusted)</strong><dl><div><dt>HR</dt><dd>{formatVital(bed.readings.heartRate)}</dd></div><div><dt>SpO₂</dt><dd>{formatVital(bed.readings.spo2)}</dd></div><div><dt>BP</dt><dd>{bed.readings.systolic === null ? 'NO DATA' : `${bed.readings.systolic}/${bed.readings.diastolic ?? '—'}`}</dd></div></dl></div></Panel>}

            <Panel className="witness-panel" aria-labelledby="witness-title"><p className="eyebrow">Independent evidence</p><h2 id="witness-title">Two witnesses</h2>{analysis.witnesses.map((witness) => <article key={witness.kind}><strong>{witness.kind}</strong><span>{witness.summary}</span><em>{witness.supportsVerdict ? '✓ supports verdict' : '? needs review'}</em></article>)}</Panel>

            {bed.trustState === 'untrusted' && <Panel className="manual-check-panel" aria-labelledby="manual-check-title"><header><div><p className="eyebrow">Bedside referee</p><h2 id="manual-check-title">Check pulse and breathing by hand</h2></div><strong>next check in {formatCountdown((nextManualCheckAt ?? fallbackManualCheckAt) - now)}</strong></header><form onSubmit={submitManualReading}><label>Heart rate<input name="heartRate" type="number" min="20" max="250" required value={manualForm.heartRate} onChange={(event) => setManualForm((form) => ({ ...form, heartRate: event.target.value }))} /></label><label>SpO₂ by portable device<input name="spo2" type="number" min="50" max="100" required value={manualForm.spo2} onChange={(event) => setManualForm((form) => ({ ...form, spo2: event.target.value }))} /></label><label className="manual-check-panel__notes">Notes<textarea name="notes" rows={2} value={manualForm.notes} onChange={(event) => setManualForm((form) => ({ ...form, notes: event.target.value }))} /></label><ActionButton tone="primary" type="submit" disabled={!clinicalActionsAllowed || pendingCommand === 'manual-reading'}>{pendingCommand === 'manual-reading' ? 'Recording…' : 'Record hand check'}</ActionButton></form>{latestManualReading && <p className="manual-check-panel__saved">Latest: HR {latestManualReading.heartRate}, SpO₂ {latestManualReading.spo2} · {formatTime(latestManualReading.recordedAt)} · {latestManualReading.recordedBy}</p>}</Panel>}
          </div>

          <div className="detail-analysis-column">
            <Panel className="why-panel" aria-labelledby="why-title"><p className="eyebrow">Why</p><header><h2 id="why-title">{analysis.headline}</h2><strong>confidence {analysis.confidence.toFixed(2)}</strong></header><h3>Top three reasons</h3><ol>{analysis.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ol><h3>The six checks (0–1)</h3><div className="analysis-scores">{analysis.scores.map((score) => <div key={score.id}><span><strong>{score.id}</strong> {score.label}</span><progress value={score.value} max="1" aria-label={`${score.id} ${score.label} ${score.value.toFixed(2)}`} /><em>{score.value.toFixed(2)}</em></div>)}</div><h3>Actions taken</h3>{bedActions.length === 0 ? <EmptyState>No actions recorded for this bed.</EmptyState> : <ol className="why-actions">{bedActions.slice(0, 3).map((action) => { const undone = bedActions.some((candidate) => candidate.referencesActionId === action.id); return <li key={action.id}><time dateTime={new Date(action.occurredAt).toISOString()}>{formatTime(action.occurredAt)}</time><span>{action.description}</span>{action.undoable && !undone && <ActionButton tone="quiet" disabled={!can(currentRole, 'undo_isolation')} onClick={() => undoAction(action.id)}>Undo</ActionButton>}</li> })}</ol>}</Panel>

            <div className="detail-workflows">
              <Panel className="workflow-card" aria-labelledby="bedside-title">
                <p className="eyebrow">Bedside referee</p><h2 id="bedside-title">Checked at the bedside?</h2>
                <p>Bedside confirmation remains separate from the response acknowledgement.</p>
                <div className="bedside-actions">
                  <ActionButton disabled={!clinicalActionsAllowed || !can(currentRole, 'confirm_bedside_status')} onClick={() => confirmPatient(bed.id, 'patient_ok')}>Patient OK</ActionButton>
                  <ActionButton tone="danger" disabled={!clinicalActionsAllowed || !can(currentRole, 'confirm_bedside_status')} onClick={() => confirmPatient(bed.id, 'patient_not_ok')}>Patient NOT OK</ActionButton>
                </div>
                <strong className={`bedside-result bedside-result--${responseState.bedsideStatus}`}>{responseState.bedsideStatus === 'pending' ? 'Awaiting bedside confirmation' : responseState.bedsideStatus === 'patient_ok' ? 'Patient confirmed OK' : 'Patient NOT OK · high alert active'}</strong>
              </Panel>

              <Panel className="workflow-card" aria-labelledby="device-title">
                <p className="eyebrow">Device integrity</p><h2 id="device-title">Isolation status</h2>
                <p>{bed.isolated ? 'Device isolated from the ward network.' : 'Device is not isolated.'} Treatment is never changed by this control.</p>
                {bed.isolated && undoableIsolation && <ActionButton disabled={!can(currentRole, 'undo_isolation')} onClick={() => undoAction(undoableIsolation.id)}>Undo isolation action</ActionButton>}
                {!bed.isolated && <small>Manage device isolation from the IT Security screen.</small>}
              </Panel>
            </div>
          </div>
        </div>
      )}

      {tab === 'trends' && <section className="trend-panel" aria-labelledby="trend-title"><div><p className="eyebrow">Last 30 minutes</p><h2 id="trend-title">HR and SpO₂ trends</h2><p>Mock trend data uses the same domain model boundary planned for the history API.</p></div><TrendChart data={trend} /></section>}

      {tab === 'actions' && (
        <section className="action-panel" aria-labelledby="action-title"><div><p className="eyebrow">Append-only record</p><h2 id="action-title">Bed action history</h2><p>Undo creates a referencing entry; original actions remain visible.</p></div>
          <div className="action-table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Mode</th><th>Reference</th></tr></thead><tbody>{bedActions.map((action) => <tr key={action.id}><td>{formatTime(action.occurredAt)}</td><td>{action.description}</td><td>{action.actor}<small>{action.actorRole}</small></td><td>{action.automatic ? 'Automatic' : 'Manual'}</td><td>{action.referencesActionId ?? '—'}</td></tr>)}</tbody></table></div>
          {bedActions.length === 0 && <EmptyState>No actions recorded for this bed.</EmptyState>}
        </section>
      )}

      <p className="treatment-boundary">SentinelWard monitoring actions never modify patient treatment.</p>
    </main>
  )
}
