import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadBriefing, loadWorkload } from '../../adapters/briefingGateway'
import { ActionButton, Panel, StatusChip } from '../../components/ui'
import { can } from '../../domain/access'
import type { NurseWorkload, ShiftBriefing } from '../../domain/briefing'
import { VERDICT_PRESENTATION, type Bed, type VitalReadings } from '../../domain/ward'
import { useAlertStore } from '../../store/alertStore'
import { useBedDetailStore } from '../../store/bedDetailStore'
import { useClinicalWorkflowStore } from '../../store/clinicalWorkflowStore'
import { useSessionStore } from '../../store/sessionStore'
import { useWardDashboardStore } from '../../store/wardDashboardStore'
import { formatTime } from './formatTime'
import { DataTable, OperationalPage } from './shared'
import { sortCensusBeds } from './census'

function displayedReadings(bed: Bed): VitalReadings {
  return bed.trustState === 'untrusted' && bed.trustedSnapshot ? bed.trustedSnapshot.readings : bed.readings
}

function formatVital(value: number | null, lastTrusted: boolean) {
  return value === null ? '—' : `${lastTrusted ? 'Last trusted ' : ''}${value}`
}

function formatBloodPressure(readings: VitalReadings, lastTrusted: boolean) {
  if (readings.systolic === null || readings.diastolic === null) return '—'
  return `${lastTrusted ? 'Last trusted ' : ''}${readings.systolic}/${readings.diastolic}`
}

export function CensusPage() {
  const beds = useWardDashboardStore((state) => state.beds)
  const navigate = useNavigate()
  const role = useBedDetailStore((state) => state.currentRole)
  const responses = useBedDetailStore((state) => state.responses)
  const alerts = useAlertStore((state) => state.alerts)
  const displayName = useSessionStore((state) => state.displayName) ?? 'Doctor / tele-ICU'
  const bedsideCalls = useClinicalWorkflowStore((state) => state.bedsideCalls)
  const pendingCallBedId = useClinicalWorkflowStore((state) => state.pendingCallBedId)
  const commandError = useClinicalWorkflowStore((state) => state.commandError)
  const callBedsideNurse = useClinicalWorkflowStore((state) => state.callBedsideNurse)
  const visibleBeds = sortCensusBeds(beds.filter((bed) => bed.occupancy === 'occupied'))
  const untrustedCount = visibleBeds.filter((bed) => bed.trustState === 'untrusted').length

  return (
    <OperationalPage title="Doctor / tele-ICU census" eyebrow="S5" description="A compact remote view sorted by clinical priority, then lowest trust.">
      {untrustedCount > 0 && <Panel className="census-trust-warning" role="alert"><strong>UNTRUSTED DATA</strong><span>{untrustedCount === 1 ? "1 bed's data can't be trusted." : `${untrustedCount} beds' data can't be trusted.`} Don't act on its numbers without a bedside check.</span></Panel>}
      {commandError && <p className="command-error" role="alert">{commandError}</p>}
      <DataTable headers={['Bed', 'Patient', 'Verdict', 'Trust', 'HR', 'SpO₂', 'BP', 'Last bedside check', 'Escalated to me', 'Actions']} emptyMessage={visibleBeds.length === 0 ? 'No occupied beds are available.' : undefined}>
        {visibleBeds.map((bed) => {
          const response = responses[bed.id]
          const call = bedsideCalls[bed.id]
          const alert = alerts.find((item) => item.bedId === bed.id && item.status === 'open')
          const escalatedToDoctor = Boolean(alert?.assignedTo.toLowerCase().includes('doctor') || alert?.responseHistory.some((item) => item.message.toLowerCase().includes('doctor')))
          const readings = displayedReadings(bed)
          const untrusted = bed.trustState === 'untrusted'
          return (
            <tr key={bed.id} className={untrusted ? 'census-row--untrusted' : undefined}>
              <td><button className="table-link" onClick={() => navigate(`/bed/${bed.id}`)}>{bed.label}</button></td>
              <td>{bed.patient.initials}{bed.patient.age === null ? '' : `, age ${bed.patient.age}`}</td>
              <td><StatusChip tone={bed.priority === 'high' ? 'critical' : bed.priority === 'medium' ? 'warning' : bed.priority === 'low' ? 'info' : 'neutral'}>{VERDICT_PRESENTATION[bed.verdict].label}</StatusChip></td>
              <td><div className={untrusted ? 'census-trust census-trust--untrusted' : 'census-trust'}><strong>{untrusted ? 'UNTRUSTED' : 'Trusted'}</strong><span>{bed.trust}%</span></div></td>
              <td>{formatVital(readings.heartRate, untrusted)}</td>
              <td>{formatVital(readings.spo2, untrusted)}</td>
              <td>{formatBloodPressure(readings, untrusted)}</td>
              <td>{response?.bedsideConfirmedAt ? `${response.bedsideStatus === 'patient_ok' ? 'Patient OK' : 'Patient NOT OK'} · ${formatTime(response.bedsideConfirmedAt)}` : 'Not checked'}</td>
              <td>{escalatedToDoctor ? `Yes · ${alert?.assignedTo}` : 'No'}</td>
              <td className="census-actions"><ActionButton tone="quiet" onClick={() => navigate(`/bed/${bed.id}`)}>Open read-only</ActionButton><ActionButton disabled={!can(role, 'call_bedside_nurse') || Boolean(call) || pendingCallBedId === bed.id} onClick={() => callBedsideNurse(bed.id, role, displayName)}>{pendingCallBedId === bed.id ? 'Calling…' : call ? `Nurse called ${formatTime(call.requestedAt)}` : 'Call bedside nurse'}</ActionButton></td>
            </tr>
          )
        })}
      </DataTable>
    </OperationalPage>
  )
}

export function BriefingPage() {
  const [activeTab, setActiveTab] = useState<'briefing' | 'workload'>('briefing')
  const [briefing, setBriefing] = useState<ShiftBriefing | null>(null)
  const [workload, setWorkload] = useState<NurseWorkload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([loadBriefing('08:00', controller.signal), loadWorkload(2, controller.signal)])
      .then(([nextBriefing, nextWorkload]) => {
        setBriefing(nextBriefing)
        setWorkload(nextWorkload)
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Shift briefing could not be loaded.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <OperationalPage title="Shift briefing and workload" eyebrow="S10" description="Handover context and nurse alarm load for the current shift.">
      <div className="briefing-tabs" role="tablist" aria-label="Briefing views">
        <button id="briefing-tab" role="tab" aria-selected={activeTab === 'briefing'} aria-controls="briefing-panel" onClick={() => setActiveTab('briefing')}>Briefing</button>
        <button id="workload-tab" role="tab" aria-selected={activeTab === 'workload'} aria-controls="workload-panel" onClick={() => setActiveTab('workload')}>Workload</button>
      </div>
      {loading && <p className="briefing-state" role="status">Preparing the shift briefing…</p>}
      {error && <p className="command-error" role="alert">{error}</p>}
      {!loading && !error && activeTab === 'briefing' && briefing && (
        <section id="briefing-panel" role="tabpanel" aria-labelledby="briefing-tab" className="briefing-panel">
          <Panel as="article" className="briefing-summary">
            <p className="eyebrow">AI-written handover · {briefing.generatedBy}</p>
            <h2>Since {briefing.since}</h2>
            <p>{briefing.summary}</p>
          </Panel>
          <div className="briefing-metrics" aria-label="Shift totals">
            <Panel><span>Incidents</span><strong>{briefing.incidents}</strong></Panel>
            <Panel><span>Untrusted beds</span><strong>{briefing.untrustedBeds}</strong></Panel>
            <Panel><span>Tickets open</span><strong>{briefing.openTickets}</strong></Panel>
          </div>
          <section className="blind-time-section" aria-labelledby="blind-time-title">
            <h2 id="blind-time-title">Blind Time per bed</h2>
            <p>Minutes with no trusted data since {briefing.since}.</p>
            <ul className="blind-time-list">
              {briefing.blindTime.map((entry) => <li key={entry.bedId}><strong>{entry.bedId}</strong><span>{entry.minutes} minutes without trusted data</span></li>)}
            </ul>
          </section>
        </section>
      )}
      {!loading && !error && activeTab === 'workload' && (
        <section id="workload-panel" role="tabpanel" aria-labelledby="workload-tab" className="workload-panel">
          <header><div><p className="eyebrow">A7 · Nurse alarm load</p><h2>Alarms received in the last 2 h</h2></div><span className="workload-legend"><i aria-hidden="true" />Warning threshold: 40</span></header>
          <div className="workload-chart" role="img" aria-label="Bar chart of alarms received per nurse in the last two hours, with a warning threshold at 40 alarms">
            <div className="workload-threshold" aria-hidden="true"><span>40</span></div>
            {workload.map((entry) => {
              const aboveThreshold = entry.alarmsLastTwoHours >= 40
              return (
                <article className="workload-row" key={entry.nurseId}>
                  <div className="workload-row__label"><strong>{entry.nurseName}</strong><b>{entry.alarmsLastTwoHours}</b></div>
                  <div className="workload-bar-track" aria-hidden="true"><span style={{ width: `${Math.min(entry.alarmsLastTwoHours / 60 * 100, 100)}%` }} /></div>
                  <StatusChip className={aboveThreshold ? 'workload-warning' : undefined}>{aboveThreshold ? 'Workload warning · 40+ alarms' : 'Within research threshold'}</StatusChip>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </OperationalPage>
  )
}

export function ActionLogPage() {
  const actions = useBedDetailStore((state) => state.actions)
  const activities = useWardDashboardStore((state) => state.activities)
  return (
    <OperationalPage title="Action log" eyebrow="S11 · Append-only" description="Manual and automatic events remain visible; undo actions reference rather than erase history.">
      <h2>Explicit and automatic actions</h2>
      <DataTable headers={['Time', 'Bed', 'Action', 'Actor', 'Reference']} emptyMessage={actions.length === 0 ? 'No explicit actions have been recorded.' : undefined}>
        {actions.map((action) => <tr key={action.id}><td>{formatTime(action.occurredAt)}</td><td>{action.bedId}</td><td>{action.description}</td><td>{action.actor}</td><td>{action.referencesActionId ?? '—'}</td></tr>)}
      </DataTable>
      <h2>Ward event stream</h2>
      <DataTable headers={['Time', 'Bed', 'Event', 'Kind', 'Priority']} emptyMessage={activities.length === 0 ? 'No ward events have been received.' : undefined}>
        {activities.map((activity) => <tr key={activity.id}><td>{formatTime(activity.occurredAt)}</td><td>{activity.bedId ?? 'Ward'}</td><td>{activity.message}</td><td>{activity.kind}</td><td>{activity.priority}</td></tr>)}
      </DataTable>
    </OperationalPage>
  )
}
