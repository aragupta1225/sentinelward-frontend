import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionButton, Panel, StatusChip } from '../../components/ui'
import { can } from '../../domain/access'
import { VERDICT_PRESENTATION } from '../../domain/ward'
import { useBedDetailStore } from '../../store/bedDetailStore'
import { useClinicalWorkflowStore } from '../../store/clinicalWorkflowStore'
import { useWardDashboardStore } from '../../store/wardDashboardStore'
import { formatTime } from './formatTime'
import { DataTable, OperationalPage } from './shared'

export function CensusPage() {
  const beds = useWardDashboardStore((state) => state.beds)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'priority' | 'unacknowledged'>('all')
  const role = useBedDetailStore((state) => state.currentRole)
  const responses = useBedDetailStore((state) => state.responses)
  const acknowledgeResponse = useBedDetailStore((state) => state.acknowledgeResponse)
  const clinicians = useClinicalWorkflowStore((state) => state.clinicians)
  const assignments = useClinicalWorkflowStore((state) => state.assignments)
  const assignBed = useClinicalWorkflowStore((state) => state.assignBed)
  const setAssignmentStatus = useClinicalWorkflowStore((state) => state.setAssignmentStatus)
  const visibleBeds = beds
    .filter((bed) => bed.occupancy === 'occupied')
    .filter((bed) => filter === 'all' || (filter === 'priority' ? bed.priority === 'high' : !responses[bed.id]?.responseAcknowledgedAt))

  return (
    <OperationalPage title="Doctor / tele-ICU census" eyebrow="S5" description="Assign clinical ownership and record response separately from bedside confirmation.">
      <div className="census-filters" role="group" aria-label="Census filter">
        {(['all', 'priority', 'unacknowledged'] as const).map((item) => (
          <ActionButton tone="quiet" key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</ActionButton>
        ))}
      </div>
      <DataTable
        headers={['Bed', 'Patient', 'Priority', 'Verdict', 'Vitals', 'Assigned clinician', 'Response', 'Detail']}
        emptyMessage={visibleBeds.length === 0 ? 'No occupied beds match this filter.' : undefined}
      >
        {visibleBeds.map((bed) => {
          const assignment = assignments.find((item) => item.bedId === bed.id)
          const acknowledged = responses[bed.id]?.responseAcknowledgedAt
          return (
            <tr key={bed.id}>
              <td>{bed.label}</td>
              <td>{bed.patient.displayName} · {bed.patient.age}</td>
              <td><StatusChip tone={bed.priority === 'high' ? 'critical' : bed.priority === 'medium' ? 'warning' : 'neutral'}>{bed.priority}</StatusChip></td>
              <td>{VERDICT_PRESENTATION[bed.verdict].label}</td>
              <td>HR {bed.readings.heartRate ?? '—'} · SpO₂ {bed.readings.spo2 ?? '—'}</td>
              <td>
                <select aria-label={`Assign ${bed.label}`} value={assignment?.clinicianId ?? ''} onChange={(event) => assignBed(bed.id, event.target.value)}>
                  <option value="">Unassigned</option>
                  {clinicians.filter((item) => item.role === 'doctor').map((item) => <option value={item.id} key={item.id}>{item.displayName}</option>)}
                </select>
              </td>
              <td><ActionButton disabled={!can(role, 'acknowledge_alert') || Boolean(acknowledged)} onClick={() => { acknowledgeResponse(bed.id); setAssignmentStatus(bed.id, 'on_my_way') }}>{acknowledged ? 'On my way recorded' : 'On my way'}</ActionButton></td>
              <td><ActionButton tone="quiet" onClick={() => navigate(`/bed/${bed.id}`)}>Open</ActionButton></td>
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
