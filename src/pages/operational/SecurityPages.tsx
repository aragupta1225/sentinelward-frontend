import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ActionButton, EmptyState, Panel, StatusChip } from '../../components/ui'
import { can } from '../../domain/access'
import type { SecurityDevice } from '../../domain/security'
import { useBedDetailStore } from '../../store/bedDetailStore'
import { reportPdfDataUrl, reportReadyToSend, useReportStore } from '../../store/reportStore'
import { networkHistoryFor, useSecurityStore } from '../../store/securityStore'
import { useWardDashboardStore } from '../../store/wardDashboardStore'
import { formatTime } from './formatTime'
import { OperationalPage } from './shared'

function formatCountdown(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  return `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function useClock() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  return now
}

function reportDeadline(detectedAt: number) { return detectedAt + 6 * 60 * 60 * 1000 }
function bytes(value: number) { return `${(value / 1024).toFixed(1)} KB` }

function NetworkWitness({ device }: { device: SecurityDevice }) {
  const history = useMemo(() => networkHistoryFor(device), [device])
  const points = history.map((point, index) => `${index * 28},${70 - Math.min(1, point.messageRate / 5) * 60}`).join(' ')
  return <Panel className="network-witness" aria-labelledby="network-witness-title"><header><div><p className="eyebrow">Selected device</p><h2 id="network-witness-title">Network witness · {device.id}</h2></div><StatusChip tone={device.status === 'healthy' ? 'positive' : device.status === 'isolated' ? 'critical' : 'warning'}>{device.status}</StatusChip></header><svg viewBox="0 0 252 80" role="img" aria-label={`Ten-minute message-rate trend ending at ${device.messageRate.toFixed(1)} messages per second`}><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" /></svg><dl><div><dt>Message rate</dt><dd>{device.messageRate.toFixed(1)}/s</dd></div><div><dt>Sender</dt><dd>{device.networkScore > .5 ? 'Verified' : 'Mismatch'}</dd></div><div><dt>Freshness</dt><dd>{device.fresh ? 'Fresh' : 'Stale'}</dd></div><div><dt>M4 replay check</dt><dd>{device.replayScore.toFixed(3)}</dd></div><div><dt>M5 network</dt><dd>{device.networkScore.toFixed(2)}</dd></div></dl></Panel>
}

export function SecurityPage() {
  const now = useClock()
  const devices = useSecurityStore((state) => state.devices)
  const incidents = useSecurityStore((state) => state.incidents)
  const selectedDeviceId = useSecurityStore((state) => state.selectedDeviceId)
  const attackFeed = useSecurityStore((state) => state.attackFeed)
  const fleetHuntDeviceIds = useSecurityStore((state) => state.fleetHuntDeviceIds)
  const commandError = useSecurityStore((state) => state.commandError)
  const selectDevice = useSecurityStore((state) => state.selectDevice)
  const fleetHunt = useSecurityStore((state) => state.fleetHunt)
  const isolateDevice = useSecurityStore((state) => state.isolateDevice)
  const undoIsolation = useSecurityStore((state) => state.undoIsolation)
  const role = useBedDetailStore((state) => state.currentRole)
  const [confirmDeviceId, setConfirmDeviceId] = useState<string | null>(null)
  const selected = devices.find((device) => device.id === selectedDeviceId) ?? devices[0]
  const activeIncident = incidents.find((incident) => incident.status !== 'resolved')
  const reportTime = activeIncident ? formatCountdown(reportDeadline(activeIncident.detectedAt) - now) : 'No active clock'

  return (
    <OperationalPage title="Security operations" eyebrow="S6 · IT security" description="Device integrity and network health only. Clinical alarm details remain on the clinical screens.">
      {commandError && <p className="ward-status-message ward-status-message--error" role="alert">{commandError}</p>}
      <section className="security-metrics" aria-label="Security summary"><Panel><span>Devices</span><strong>{devices.length}</strong></Panel><Panel><span>Isolated</span><strong>{devices.filter((device) => device.status === 'isolated').length}</strong></Panel><Panel><span>Open incidents</span><strong>{incidents.filter((incident) => incident.status !== 'resolved').length}</strong></Panel><Panel><span>Report clock</span><strong>{reportTime}</strong></Panel></section>

      <div className="security-workspace">
        <section aria-labelledby="device-inventory-title"><div className="section-title"><div><p className="eyebrow">GET /api/devices · simulated</p><h2 id="device-inventory-title">Device inventory</h2></div><ActionButton onClick={() => fleetHunt(selected.model)}>Fleet hunt · {selected.model}</ActionButton></div><div className="data-table-wrap"><table className="data-table device-table"><thead><tr><th>Device</th><th>Bed</th><th>Model</th><th>Firmware</th><th>Msg rate</th><th>Fresh</th><th>M5 Net</th><th>Status</th><th>Actions</th></tr></thead><tbody>{devices.map((device) => <tr key={device.id} className={fleetHuntDeviceIds.includes(device.id) ? 'fleet-match' : undefined}><td><button type="button" className="table-link" onClick={() => selectDevice(device.id)} aria-pressed={selected.id === device.id}>{device.id}</button></td><td>{device.bedId}</td><td>{device.model}</td><td>{device.firmware}</td><td>{device.messageRate.toFixed(1)}/s</td><td>{device.fresh ? '✓ Fresh' : '⏱ Stale'}</td><td>{device.networkScore.toFixed(2)}</td><td>{device.status}</td><td><div className="table-actions">{device.status !== 'isolated' && <ActionButton disabled={!can(role, 'isolate_device')} onClick={() => setConfirmDeviceId(device.id)}>Cut off device</ActionButton>}<Link to={`/incident/${device.bedId}`}>Open incident</Link></div></td></tr>)}</tbody></table></div>{fleetHuntDeviceIds.length > 0 && <p className="fleet-result" role="status">Fleet hunt: watching {fleetHuntDeviceIds.join(', ')} because they use {selected.model}.</p>}</section>

        <aside className="attack-feed" aria-labelledby="attack-feed-title"><h2 id="attack-feed-title">Live attack feed</h2>{attackFeed.length === 0 ? <EmptyState>No incidents. Device network health is calm.</EmptyState> : <ol>{attackFeed.map((event) => <li key={event.id}><time dateTime={new Date(event.occurredAt).toISOString()}>{formatTime(event.occurredAt)}</time><strong>{event.deviceId} · {event.bedId}</strong><span>{event.message}</span>{event.actionId && devices.find((item) => item.id === event.deviceId)?.status === 'isolated' && <ActionButton tone="quiet" onClick={() => undoIsolation(event.deviceId, event.actionId!, role)}>Undo / reconnect</ActionButton>}</li>)}</ol>}</aside>
      </div>

      <NetworkWitness device={selected} />

      {confirmDeviceId && <div className="confirmation-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="isolate-confirm-title" className="confirmation-dialog"><h2 id="isolate-confirm-title">Cut off {confirmDeviceId}?</h2><p>This disconnects only the monitor from the ward network. It never changes patient treatment or suppresses a clinical emergency.</p><div><ActionButton tone="quiet" onClick={() => setConfirmDeviceId(null)}>Cancel</ActionButton><ActionButton onClick={async () => { if (await isolateDevice(confirmDeviceId, role)) setConfirmDeviceId(null) }}>Confirm cut off</ActionButton></div></section></div>}
    </OperationalPage>
  )
}

export function IncidentPage() {
  const { id } = useParams()
  const now = useClock()
  const bed = useWardDashboardStore((state) => state.beds.find((item) => item.id === id))
  const allActions = useBedDetailStore((state) => state.actions)
  const incident = useSecurityStore((state) => state.incidents.find((item) => item.bedId === id))
  const role = useBedDetailStore((state) => state.currentRole)
  const captureEvidence = useSecurityStore((state) => state.captureEvidence)
  const containIncident = useSecurityStore((state) => state.containIncident)
  const resolveIncident = useSecurityStore((state) => state.resolveIncident)
  const undoIsolation = useSecurityStore((state) => state.undoIsolation)
  const [closeReason, setCloseReason] = useState('')
  if (!bed || !incident) return <Navigate to="/security" replace />
  const actions = allActions.filter((action) => action.bedId === id)
  const deviceId = `MON-${bed.id.slice(1)}`
  const statusTone = incident.status === 'open' ? 'critical' : incident.status === 'contained' ? 'warning' : 'positive'

  return (
    <OperationalPage title={`Replay attack on ${deviceId}, ${bed.label}`} eyebrow={`S7 · ${incident.id}`} description="Minute-by-minute evidence for IT. Clinical decisions remain outside this screen." actions={<><StatusChip tone={statusTone} dot>{incident.status.toUpperCase()}</StatusChip><strong className="report-clock">CERT-In · {formatCountdown(reportDeadline(incident.detectedAt) - now)} left</strong></>}>
      <p className="incident-detected">Started {formatTime(incident.detectedAt)} · {incident.severity} integrity severity</p>
      <div className="incident-workspace"><section aria-labelledby="timeline-title"><h2 id="timeline-title">Incident timeline</h2><ol className="incident-timeline">{incident.timeline.map((event) => <li key={event.id}><time dateTime={new Date(event.occurredAt).toISOString()}>{formatTime(event.occurredAt)}</time><div><strong>{event.description}</strong><span>{event.actor}{event.evidenceId ? ` · ${event.evidenceId}` : ''}</span></div></li>)}</ol></section><section aria-labelledby="evidence-title"><h2 id="evidence-title">Evidence and fingerprints</h2><div className="evidence-list">{incident.evidence.map((item) => <Panel as="article" key={item.id}><header><strong>{item.filename}</strong><span>{bytes(item.sizeBytes)}</span></header><p>{item.label}</p><code>SHA-256 {item.sha256}</code><a href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(item))}`} download={item.filename}>Download</a></Panel>)}</div></section></div>

      <Panel className="affected-actions"><h2>Affected beds and actions taken</h2><p>{incident.affectedBeds.join(', ')}</p><ul className="plain-list">{actions.map((action) => { const undone = actions.some((candidate) => candidate.referencesActionId === action.id); return <li key={action.id}><span>{formatTime(action.occurredAt)} · {action.description}</span>{action.undoable && !undone ? <ActionButton tone="quiet" onClick={() => undoIsolation(deviceId, action.id, role)}>Undo</ActionButton> : <small>{action.actor}</small>}</li> })}</ul></Panel>

      <div className="incident-actions"><ActionButton disabled={!can(role, 'capture_incident_evidence')} onClick={() => captureEvidence(bed.id, role)}>Capture evidence snapshot</ActionButton><ActionButton disabled={!can(role, 'contain_incident') || incident.status !== 'open'} onClick={() => containIncident(bed.id, role)}>Contain and isolate device</ActionButton><Link className="button-link" to={`/incident/${bed.id}/report`}>Draft CERT-In report</Link></div>
      {incident.status === 'contained' && <Panel className="close-incident"><label>Reason for closing incident<input value={closeReason} onChange={(event) => setCloseReason(event.target.value)} /></label><ActionButton tone="primary" disabled={!can(role, 'resolve_incident') || !closeReason.trim()} onClick={() => resolveIncident(bed.id, role, closeReason)}>Close incident</ActionButton></Panel>}
      <p className="scope-note">Closing an incident does not restore device trust or reconnect isolation automatically.</p>
    </OperationalPage>
  )
}

const reportFields = [
  ['organisation', 'Organisation'], ['contact', 'Contact'], ['noticedAt', 'Time noticed'], ['occurredAt', 'Time occurred'],
  ['incidentType', 'Type of incident'], ['affectedSystems', 'Affected systems'], ['description', 'Description'], ['actionsTaken', 'Actions taken'], ['evidenceList', 'Evidence list'],
] as const

export function ReportPage() {
  const { id } = useParams()
  const now = useClock()
  const incident = useSecurityStore((state) => state.incidents.find((item) => item.bedId === id))
  const report = useReportStore((state) => id ? state.reports[id] : undefined)
  const pending = useReportStore((state) => state.pending)
  const error = useReportStore((state) => state.error)
  const ensureReport = useReportStore((state) => state.ensureReport)
  const updateField = useReportStore((state) => state.updateField)
  const saveReport = useReportStore((state) => state.saveReport)
  const markSent = useReportStore((state) => state.markSent)
  useEffect(() => { if (id) ensureReport(id) }, [ensureReport, id])
  if (!id || !incident) return <Navigate to="/security" replace />
  if (!report) return <OperationalPage title="CERT-In report draft" eyebrow="S8" description="Preparing simulated draft."><p role="status">Loading draft…</p></OperationalPage>
  const ready = reportReadyToSend(report)

  return (
    <OperationalPage title="CERT-In report draft" eyebrow="S8 · Human submission required" description="The frontend prepares and saves a draft. An authorized person checks and sends it; SentinelWard never auto-sends." actions={<StatusChip tone={report.sentAt ? 'positive' : 'warning'}>{report.sentAt ? 'Sent recorded' : 'Draft · not sent'}</StatusChip>}>
      {error && <p className="ward-status-message ward-status-message--error" role="alert">{error}</p>}
      <div className="report-workspace"><Panel className="editable-report"><header><strong>{report.incidentId}</strong><span>{report.savedAt ? `Saved ${formatTime(report.savedAt)}` : 'Unsaved changes are local'}</span></header>{reportFields.map(([field, label]) => <label key={field}>{label}{field === 'description' || field === 'actionsTaken' || field === 'evidenceList' ? <textarea rows={field === 'evidenceList' ? 5 : 3} value={report[field]} onChange={(event) => updateField(id, field, event.target.value)} /> : <input value={report[field]} onChange={(event) => updateField(id, field, event.target.value)} />}</label>)}</Panel><aside><Panel className="report-deadline"><span>Report within 6 hours</span><strong>{formatCountdown(reportDeadline(incident.detectedAt) - now)} left</strong></Panel><Panel className="report-checklist"><h2>Human checklist</h2><label><input type="checkbox" checked={report.factsChecked} onChange={(event) => updateField(id, 'factsChecked', event.target.checked)} /> Facts checked</label><label><input type="checkbox" checked={report.evidenceAttached} onChange={(event) => updateField(id, 'evidenceAttached', event.target.checked)} /> Evidence attached</label><label>Approver<input value={report.approver} onChange={(event) => updateField(id, 'approver', event.target.value)} /></label>{!ready && !report.sentAt && <p>Mark as sent stays disabled until facts, evidence, and approver are complete.</p>}{report.sentAt && <p>Sent recorded by {report.sentBy} at {formatTime(report.sentAt)}.</p>}</Panel></aside></div>
      <div className="report-actions"><ActionButton onClick={() => saveReport(id)} disabled={pending !== null}>{pending === 'save' ? 'Saving…' : 'Save draft'}</ActionButton><a className="button-link" href={reportPdfDataUrl(report)} download={`${report.incidentId}-draft.pdf`}>Download PDF</a><ActionButton tone="primary" onClick={() => markSent(id, 'Antara Gupta')} disabled={!ready || pending !== null}>{pending === 'send' ? 'Recording…' : report.sentAt ? 'Sent recorded' : 'Mark as sent by me'}</ActionButton></div>
      <p className="scope-note">Mock mode records the human action locally. It does not transmit an official report.</p>
    </OperationalPage>
  )
}
