import { useEffect, useMemo, useState } from 'react'
import type { Bed } from '../domain/ward'
import { EMPTY_READINGS, EMPTY_WAVEFORM, VERDICT_PRESENTATION } from '../domain/ward'
import { WaveformCanvas } from './WaveformCanvas'

interface BedTileProps { bed: Bed; now?: number; onOpen?: (bedId: string) => void }

function formatReading(value: number | null) { return value === null ? '—' : String(value) }

function freshnessLabel(bed: Bed, now: number) {
  if (bed.lastUpdatedAt === null) return 'Waiting for first data'
  const seconds = Math.max(0, Math.floor((now - bed.lastUpdatedAt) / 1000))
  if (bed.connection === 'disconnected') return `Connection lost · last update ${seconds} s ago`
  if (seconds >= 3) return `NO DATA · ${seconds} s`
  return seconds === 0 ? 'Updated now' : `Updated ${seconds} s ago`
}

export function BedTile({ bed, now: suppliedNow, onOpen }: BedTileProps) {
  const [clock, setClock] = useState(() => suppliedNow ?? Date.now())
  const effectiveClock = suppliedNow ?? clock
  const presentation = VERDICT_PRESENTATION[bed.verdict]
  const displaySnapshot = bed.trustState === 'untrusted' && bed.trustedSnapshot ? bed.trustedSnapshot : null
  const readings = bed.trustState === 'untrusted'
    ? displaySnapshot?.readings ?? EMPTY_READINGS
    : bed.readings
  const waveform = bed.trustState === 'untrusted'
    ? displaySnapshot?.waveform ?? EMPTY_WAVEFORM
    : bed.waveform
  const isNoData = bed.lastUpdatedAt === null || effectiveClock - bed.lastUpdatedAt >= 3000
  const freshness = useMemo(() => freshnessLabel(bed, effectiveClock), [bed, effectiveClock])

  useEffect(() => {
    if (suppliedNow !== undefined) return
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [suppliedNow])

  const patientDescription = bed.occupancy === 'unassigned'
    ? 'Unassigned bed — awaiting admission'
    : bed.occupancy === 'loading'
      ? 'Patient data loading — identity not yet available'
      : `${bed.patient.displayName}${bed.patient.age === null ? '' : `, age ${bed.patient.age}`}`

  return (
    <article className={`bed-tile bed-tile--${bed.priority} ${bed.trustState === 'untrusted' ? 'bed-tile--untrusted' : ''}`} aria-label={`${bed.label}: ${presentation.label}. ${patientDescription}`} data-testid="bed-tile">
      <header className="bed-tile__header">
        <div><p className="eyebrow">{bed.label}</p><h2>{patientDescription}</h2></div>
        <div className={`priority priority--${bed.priority}`}>
          <span aria-hidden="true">{bed.priority === 'high' ? '!' : bed.priority === 'medium' ? '◆' : '●'}</span>
          {bed.priority === 'none' ? 'Routine' : `${bed.priority} priority`}
        </div>
      </header>

      {bed.verdict === 'BOTH' && (
        <div className="dual-alert" role="alert"><strong>Clinical emergency active</strong><span>Device isolated · treatment controls untouched</span></div>
      )}

      <WaveformCanvas data={waveform} muted={bed.trustState === 'untrusted' || isNoData} />

      <div className="vitals" aria-label="Last available vital readings">
        <div><span>HR</span><strong>{formatReading(readings.heartRate)}</strong><small>bpm</small></div>
        <div><span>SpO₂</span><strong>{formatReading(readings.spo2)}</strong><small>%</small></div>
        <div><span>BP</span><strong>{readings.systolic === null || readings.diastolic === null ? '—' : `${readings.systolic}/${readings.diastolic}`}</strong><small>mmHg</small></div>
      </div>

      <div className="trust-row">
        <div className="trust-row__labels"><span>{bed.trustState === 'trusted' ? 'Signal trust' : 'UNTRUSTED SIGNAL'}</span><strong>{bed.trust}%</strong></div>
        <div className="trust-meter" role="meter" aria-label="Signal trust" aria-valuemin={0} aria-valuemax={100} aria-valuenow={bed.trust}><span style={{ width: `${bed.trust}%` }} /></div>
        {displaySnapshot && <small>Showing last trusted readings · captured {Math.max(0, Math.floor((effectiveClock - displaySnapshot.capturedAt) / 1000))} s ago</small>}
      </div>

      <div className={`verdict verdict--${bed.priority}`}>
        <span className="verdict__icon" aria-hidden="true">{presentation.icon}</span>
        <div><span>Verdict</span><strong>{presentation.label}</strong></div>
        {bed.isolated && <span className="isolation-badge">Device isolated</span>}
      </div>

      <div className="bed-tile__message"><strong>{bed.reason}</strong><span>{bed.requestedAction}</span></div>
      <footer className="bed-tile__footer">
        <span className={`freshness ${isNoData ? 'freshness--stale' : ''}`}><i aria-hidden="true" /> {freshness}</span>
        <span>{bed.acknowledgement === 'acknowledged' ? 'Acknowledged' : 'Not acknowledged'}</span>
      </footer>
      {onOpen && <button className="bed-tile__open" type="button" onClick={() => onOpen(bed.id)}>Open {bed.label}<span aria-hidden="true"> →</span></button>}
    </article>
  )
}
