import { useNavigate } from 'react-router-dom'
import { ActionButton, Panel, StatusChip } from '../../components/ui'
import { can } from '../../domain/access'
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
  const beds = useWardDashboardStore((state) => state.beds)
  const highPriorityBeds = beds.filter((bed) => bed.priority === 'high')
  const clinicians = useClinicalWorkflowStore((state) => state.clinicians)
  const assignments = useClinicalWorkflowStore((state) => state.assignments)

  return (
    <OperationalPage title="Briefing and workload" eyebrow="S10" description="A shift-level view of clinical priority and active workload.">
      <div className="record-grid">
        <Panel as="article" className="record-card">
          <h2>Shift priorities</h2>
          <strong>{highPriorityBeds.length} high-priority beds</strong>
          <ul>{highPriorityBeds.map((bed) => <li key={bed.id}>{bed.label} · {VERDICT_PRESENTATION[bed.verdict].label}</li>)}</ul>
        </Panel>
        <Panel as="article" className="record-card">
          <h2>Operational queues</h2>
          <p>Doctor / tele-ICU: {highPriorityBeds.length} priority reviews</p>
          <p>IT: {beds.filter((bed) => bed.trustState === 'untrusted').length} integrity reviews</p>
          <p>Biomedical: {beds.filter((bed) => ['LOOSE_SENSOR', 'DRIFTING'].includes(bed.verdict)).length} device checks</p>
        </Panel>
      </div>
      <h2>Clinical assignments</h2>
      <div className="workload-grid">
        {clinicians.map((clinician) => {
          const active = assignments.filter((item) => item.clinicianId === clinician.id && item.status !== 'complete')
          return <Panel as="article" key={clinician.id}><strong>{clinician.displayName}</strong><span>{active.length} / {clinician.capacity} active beds</span><ul>{active.map((item) => <li key={item.bedId}>{item.bedId} · {item.status.replaceAll('_', ' ')}</li>)}</ul></Panel>
        })}
      </div>
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
