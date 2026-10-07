import { useEffect } from 'react'
import { BedTile } from '../components/BedTile'
import { BED_FIXTURES } from '../mocks/fixtures'
import { useWardStore } from '../store/wardStore'

export function WardMilestonePage() {
  const featuredBed = useWardStore((state) => state.featuredBed)
  const selectedFixtureId = useWardStore((state) => state.selectedFixtureId)
  const selectFixture = useWardStore((state) => state.selectFixture)
  const startMockStream = useWardStore((state) => state.startMockStream)
  const setConnection = useWardStore((state) => state.setConnection)

  useEffect(() => startMockStream(), [startMockStream])

  return (
    <main id="main-content" className="milestone-page">
      <section className="milestone-intro">
        <div><p className="eyebrow">Frontend milestone 01</p><h1>Bed tile safety states</h1><p>One domain-driven tile, live mock telemetry, and every specified verdict.</p></div>
        <div className="live-status" aria-live="polite"><span aria-hidden="true" /> Mock stream · {featuredBed.connection === 'live' ? 'LIVE' : 'DISCONNECTED'}</div>
      </section>

      <section className="workbench" aria-labelledby="workbench-title">
        <div className="workbench__controls">
          <div><p className="eyebrow">Deterministic fixture gallery</p><h2 id="workbench-title">Choose a safety state</h2></div>
          <div className="scenario-list" role="group" aria-label="Bed tile fixture">
            {BED_FIXTURES.map((fixture) => (
              <button className={selectedFixtureId === fixture.id ? 'scenario-button scenario-button--active' : 'scenario-button'} key={fixture.id} type="button" aria-pressed={selectedFixtureId === fixture.id} onClick={() => selectFixture(fixture.id)}>
                <strong>{fixture.id}</strong><span>{fixture.occupancy === 'occupied' ? fixture.verdict.replace('_', ' ') : fixture.occupancy}</span>
              </button>
            ))}
          </div>
          <div className="connection-controls">
            <button type="button" onClick={() => setConnection('live')}>Restore connection</button>
            <button type="button" onClick={() => setConnection('disconnected')}>Simulate connection loss</button>
          </div>
          <aside className="safety-note"><strong>Safety behavior</strong><p>Missing data is never drawn as zero. Untrusted signals retain the last trusted snapshot. Connection loss freezes the last readings and preserves their age.</p></aside>
        </div>
        <div className="workbench__preview"><BedTile bed={featuredBed} /><p className="preview-note">Mock vitals update once per second for live, occupied fixtures.</p></div>
      </section>

      <section className="spec-note" aria-labelledby="open-spec-title"><span aria-hidden="true">i</span><div><h2 id="open-spec-title">Open specification item</h2><p>The source names 12 numbered web screens plus Telegram while claiming 13 web screens; no S4 is defined.</p></div></section>
    </main>
  )
}
