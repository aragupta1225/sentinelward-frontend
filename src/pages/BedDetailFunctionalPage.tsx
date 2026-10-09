import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BedTile } from '../components/BedTile'
import { TrendChart } from '../components/TrendChart'
import { ActionButton, EmptyState, PageHeader, Panel } from '../components/ui'
import { can, ROLE_LABELS, ROLES, type Role } from '../domain/access'
import { VERDICT_PRESENTATION } from '../domain/ward'
import { createThirtyMinuteTrend } from '../mocks/trendFixtures'
import { useBedDetailStore } from '../store/bedDetailStore'
import { useWardDashboardStore } from '../store/wardDashboardStore'

type DetailTab = 'overview' | 'trends' | 'actions'

function formatTime(timestamp: number | null) {
  return timestamp ? new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(timestamp) : 'Not recorded'
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
  const acknowledgeResponse = useBedDetailStore((state) => state.acknowledgeResponse)
  const confirmPatient = useBedDetailStore((state) => state.confirmPatient)
  const isolateDevice = useBedDetailStore((state) => state.isolateDevice)
  const undoAction = useBedDetailStore((state) => state.undoAction)
  const trend = useMemo(() => bed ? createThirtyMinuteTrend(bed) : null, [bed])

  if (!bed || !trend) return <Navigate to="/ward" replace />

  const bedActions = actions.filter((action) => action.bedId === bed.id)
  const responseState = response ?? { responseAcknowledgedAt: null, bedsideStatus: 'pending', bedsideConfirmedAt: null }
  const undoableIsolation = bedActions.find((action) => action.type === 'device_isolated' && action.undoable && !bedActions.some((candidate) => candidate.referencesActionId === action.id))

  return (
    <main id="main-content" className="bed-detail-page bed-detail-page--functional">
      <ActionButton tone="quiet" className="back-button" onClick={() => navigate(-1)}>← Back to ward</ActionButton>
      <PageHeader
        eyebrow="Bed detail · live mock data"
        title={`${bed.label} · ${bed.patient.displayName}`}
        description={`${VERDICT_PRESENTATION[bed.verdict].label} · ${bed.reason}`}
        actions={<label className="role-selector">Acting role<select value={currentRole} onChange={(event) => setRole(event.target.value as Role)}>{ROLES.map((role) => <option value={role} key={role}>{ROLE_LABELS[role]}</option>)}</select></label>}
      />

      <nav className="detail-tabs" aria-label="Bed detail sections">
        {(['overview', 'trends', 'actions'] as DetailTab[]).map((item) => <button type="button" key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{item}</button>)}
      </nav>

      {tab === 'overview' && (
        <div className="detail-overview">
          <BedTile bed={bed} />
          <div className="detail-workflows">
            <Panel className="workflow-card" aria-labelledby="response-title">
              <p className="eyebrow">Step 1 · response</p><h2 id="response-title">Acknowledge “On my way”</h2>
              <p>This records a response only. It does not confirm the patient’s condition.</p>
              <ActionButton tone="primary" disabled={!can(currentRole, 'acknowledge_alert') || responseState.responseAcknowledgedAt !== null} onClick={() => acknowledgeResponse(bed.id)}>{responseState.responseAcknowledgedAt ? `Recorded · ${formatTime(responseState.responseAcknowledgedAt)}` : 'On my way'}</ActionButton>
            </Panel>

            <Panel className="workflow-card" aria-labelledby="bedside-title">
              <p className="eyebrow">Step 2 · bedside</p><h2 id="bedside-title">Confirm patient status</h2>
              <p>Bedside confirmation remains separate from the response acknowledgement.</p>
              <div className="bedside-actions">
                <ActionButton disabled={!can(currentRole, 'confirm_bedside_status')} onClick={() => confirmPatient(bed.id, 'patient_ok')}>Patient OK</ActionButton>
                <ActionButton tone="danger" disabled={!can(currentRole, 'confirm_bedside_status')} onClick={() => confirmPatient(bed.id, 'patient_not_ok')}>Patient NOT OK</ActionButton>
              </div>
              <strong className={`bedside-result bedside-result--${responseState.bedsideStatus}`}>{responseState.bedsideStatus === 'pending' ? 'Awaiting bedside confirmation' : responseState.bedsideStatus === 'patient_ok' ? 'Patient confirmed OK' : 'Patient NOT OK · high alert active'}</strong>
            </Panel>

            <Panel className="workflow-card" aria-labelledby="device-title">
              <p className="eyebrow">Device integrity</p><h2 id="device-title">Isolation status</h2>
              <p>{bed.isolated ? 'Device isolated from the ward network.' : 'Device is not isolated.'} Treatment is never changed by this control.</p>
              {!bed.isolated && <ActionButton disabled={!can(currentRole, 'isolate_device')} onClick={() => isolateDevice(bed.id)}>Request device isolation</ActionButton>}
              {bed.isolated && undoableIsolation && <ActionButton disabled={!can(currentRole, 'undo_isolation')} onClick={() => undoAction(undoableIsolation.id)}>Undo isolation action</ActionButton>}
              {!can(currentRole, 'isolate_device') && !bed.isolated && <small>Current provisional role cannot isolate devices.</small>}
            </Panel>
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
