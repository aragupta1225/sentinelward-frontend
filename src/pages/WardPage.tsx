import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertRail } from '../components/AlertRail'
import { WardGrid } from '../components/WardGrid'
import { WardSummaryRow } from '../components/WardSummaryRow'
import { ActionButton, PageHeader, StatusChip } from '../components/ui'
import { getWardSummary } from '../domain/wardSummary'
import { useBedDetailStore } from '../store/bedDetailStore'
import { useAlertStore } from '../store/alertStore'
import { useWardDashboardStore } from '../store/wardDashboardStore'
import { ROLE_LABELS } from '../domain/access'

export function WardPage() {
  const navigate = useNavigate()
  const beds = useWardDashboardStore((state) => state.beds)
  const connection = useWardDashboardStore((state) => state.connection)
  const activities = useWardDashboardStore((state) => state.activities)
  const loadError = useWardDashboardStore((state) => state.loadError)
  const commandError = useWardDashboardStore((state) => state.commandError)
  const start = useWardDashboardStore((state) => state.start)
  const setConnection = useWardDashboardStore((state) => state.setConnection)
  const acknowledgeBed = useWardDashboardStore((state) => state.acknowledgeBed)
  const currentRole = useBedDetailStore((state) => state.currentRole)
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const previousHigh = useRef(new Set(beds.filter((bed) => bed.priority === 'high').map((bed) => bed.id)))
  const previousConnection = useRef(connection)
  const summary = useMemo(() => getWardSummary(beds), [beds])

  useEffect(() => start(), [start])

  useEffect(() => {
    const current = new Set(beds.filter((bed) => bed.priority === 'high').map((bed) => bed.id))
    const added = [...current].filter((bedId) => !previousHigh.current.has(bedId))
    if (added.length > 0) setAnnouncement(`New high priority alarm: ${added.join(', ')}`)
    previousHigh.current = current
  }, [beds])

  useEffect(() => {
    if (previousConnection.current !== connection && previousConnection.current !== 'connecting') {
      setAnnouncement(connection === 'live' ? 'Ward connection restored' : 'Ward connection lost. Last readings are frozen.')
    }
    previousConnection.current = connection
  }, [connection])

  const openBed = (bedId: string) => navigate(`/bed/${bedId}`)
  const acknowledgeFromRail = async (bedId: string) => {
    if (await acknowledgeBed(bedId, currentRole)) {
      useAlertStore.getState().recordAcknowledgementForBed(bedId, ROLE_LABELS[currentRole])
    }
  }

  return (
    <main id="main-content" className="ward-page">
      <div className="sr-only" aria-live="assertive" aria-atomic="true">{announcement}</div>
      <PageHeader
        eyebrow="Ward 6 · Critical Care"
        title="Live ward"
        description="Clinical priority, signal trust, freshness, and device status remain independent."
        actions={<>
          <StatusChip tone={connection === 'live' ? 'positive' : connection === 'connecting' ? 'warning' : 'critical'} dot>{connection === 'live' ? 'LIVE' : connection.toUpperCase()}</StatusChip>
          <ActionButton onClick={() => setConnection(connection === 'live' ? 'disconnected' : 'live')}>{connection === 'live' ? 'Simulate connection loss' : 'Restore connection'}</ActionButton>
        </>}
      />

      {loadError && <p className="ward-status-message ward-status-message--error" role="alert">Ward refresh failed: {loadError}. Last known patient data remains visible.</p>}
      {commandError && <p className="ward-status-message ward-status-message--error" role="alert">{commandError}</p>}

      <WardSummaryRow summary={summary} />

      <button className="mobile-alert-toggle" type="button" onClick={() => setRailCollapsed((value) => !value)} aria-expanded={!railCollapsed} aria-controls="alert-rail-content">
        Alerts <strong>{summary.activeAlarms}</strong><span>{beds.filter((bed) => bed.priority === 'high').length} high priority</span>
      </button>

      <div className="ward-layout">
        <WardGrid beds={beds} onOpenBed={openBed} />
        <AlertRail beds={beds} activities={activities} collapsed={railCollapsed} onToggle={() => setRailCollapsed((value) => !value)} onAcknowledge={acknowledgeFromRail} onOpenBed={openBed} />
      </div>
    </main>
  )
}
