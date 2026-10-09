import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BedTile } from '../components/BedTile'
import { VERDICT_PRESENTATION } from '../domain/ward'
import { useBedDetailStore } from '../store/bedDetailStore'
import { useWardDashboardStore } from '../store/wardDashboardStore'

export function BedDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const bed = useWardDashboardStore((state) => state.beds.find((item) => item.id === id))
  const acknowledgeBed = useWardDashboardStore((state) => state.acknowledgeBed)
  const currentRole = useBedDetailStore((state) => state.currentRole)

  if (!bed) return <Navigate to="/ward" replace />

  return (
    <main id="main-content" className="bed-detail-page">
      <button className="back-button" type="button" onClick={() => navigate(-1)}>← Back to ward</button>
      <section className="bed-detail-heading">
        <div><p className="eyebrow">Bed detail · functional foundation</p><h1>{bed.label} · {bed.patient.displayName}</h1><p>{VERDICT_PRESENTATION[bed.verdict].label} · {bed.reason}</p></div>
        <button type="button" className="primary-action" disabled={bed.acknowledgement !== 'none'} onClick={() => acknowledgeBed(bed.id, currentRole)}>
          {bed.acknowledgement === 'acknowledged' ? 'Alert acknowledged' : bed.acknowledgement === 'pending' ? 'Acknowledging…' : 'Acknowledge alert'}
        </button>
      </section>
      <div className="bed-detail-foundation">
        <BedTile bed={bed} />
        <section className="detail-panel" aria-labelledby="detail-status-title">
          <h2 id="detail-status-title">Current status</h2>
          <dl>
            <div><dt>Clinical priority</dt><dd>{bed.priority}</dd></div>
            <div><dt>Signal trust</dt><dd>{bed.trustState} · {bed.trust}%</dd></div>
            <div><dt>Connection</dt><dd>{bed.connection}</dd></div>
            <div><dt>Device isolation</dt><dd>{bed.isolated ? 'Isolated' : 'Not isolated'}</dd></div>
            <div><dt>Requested action</dt><dd>{bed.requestedAction}</dd></div>
          </dl>
          <p className="scope-note">Treatment controls are intentionally absent. Detailed history, bedside confirmation, evidence, and role-gated actions will be added in the Bed Detail milestone.</p>
        </section>
      </div>
    </main>
  )
}
