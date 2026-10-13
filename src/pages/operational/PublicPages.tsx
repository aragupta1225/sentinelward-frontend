import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { loadWardPreview } from '../../adapters/publicGateway'
import { SpotlightCard } from '../../components/landing/SpotlightCard'
import { ActionButton } from '../../components/ui'
import { ROLE_HOME, type Role } from '../../domain/access'
import type { Bed } from '../../domain/ward'
import { BED_FIXTURES } from '../../mocks/fixtures'
import { useSessionStore } from '../../store/sessionStore'

const roleCards: Array<{ role: Role; label: string; description: string }> = [
  { role: 'nurse', label: 'Central nurse', description: 'Watch the ward, respond to alarms, and record bedside checks.' },
  { role: 'doctor', label: 'Doctor / tele-ICU', description: 'Review the remote census and the beds that need a doctor.' },
  { role: 'biomedical', label: 'Biomed', description: 'Track bedside equipment faults and repair tickets.' },
  { role: 'it', label: 'IT security', description: 'Investigate device threats, evidence, and incident reports.' },
  { role: 'operator', label: 'Demo operator', description: 'Run and reset the scripted ward scenarios.' },
]

function MiniBed({ bed, index }: { bed: Bed; index: number }) {
  const high = bed.priority === 'high'
  return (
    <article className={`landing-bed landing-bed--slot-${index + 1}${high ? ' landing-bed--high' : ''}`} aria-label={`${bed.label}: ${bed.reason}`}>
      <header><span>{bed.label}</span><strong>{high ? 'HIGH ALARM' : bed.verdict.replaceAll('_', ' ')}</strong></header>
      <div className="landing-bed__signal" aria-hidden="true"><svg viewBox="0 0 180 36" preserveAspectRatio="none"><path d="M0 22h28l7-3 5 8 7-22 8 17h22l6-4 6 9 7-18 8 13h32l6-4 7 8 8-15 9 11h24" /></svg></div>
      <div className="landing-bed__vitals"><div><small>HR</small><b>{bed.readings.heartRate ?? '—'}</b></div><div><small>SpO₂</small><b>{bed.readings.spo2 ?? '—'}</b></div></div>
      <footer><span>Signal trust</span><strong>{bed.trust}%</strong></footer>
    </article>
  )
}

export function LandingPage() {
  const [preview, setPreview] = useState<Bed[]>(() => structuredClone(BED_FIXTURES.slice(0, 4)))
  const [previewState, setPreviewState] = useState<'loading' | 'live' | 'offline'>('loading')

  useEffect(() => {
    const controller = new AbortController()
    loadWardPreview(controller.signal)
      .then((beds) => { setPreview(beds.slice(0, 4)); setPreviewState('live') })
      .catch(() => { if (!controller.signal.aborted) setPreviewState('offline') })
    return () => controller.abort()
  }, [])

  return (
    <main id="main-content" className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__copy">
          <p className="landing-kicker"><span aria-hidden="true" /> Clinical monitoring · device integrity</p>
          <h1 id="landing-title">Patient, Sensor, <span>or Hacker?</span></h1>
          <p className="landing-hero__lead">Real-time AI on IBM LinuxONE that tells, for every hospital bed, whether a scary reading is real.</p>
          <div className="page-actions landing-hero__actions"><Link className="landing-primary-action" to="/login?role=nurse">Open the live ward <span aria-hidden="true">↗</span></Link><a href="#how-it-works">See how it decides <span aria-hidden="true">↓</span></a></div>
          <ul className="landing-proof-list" aria-label="Product boundaries">
            <li><strong>12</strong><span>beds in the demo ward</span></li>
            <li><strong>8</strong><span>explicit verdicts</span></li>
            <li><strong>0</strong><span>automatic treatments</span></li>
          </ul>
        </div>

        <div className="landing-hero__visual" aria-labelledby="preview-title">
          <div className="landing-orbit landing-orbit--one" aria-hidden="true" />
          <div className="landing-orbit landing-orbit--two" aria-hidden="true" />
          <div className="landing-float-chip landing-float-chip--top" aria-hidden="true"><i /> Last trusted snapshot</div>
          <div className="landing-float-chip landing-float-chip--bottom" aria-hidden="true"><i /> Human decision required</div>
          <section className="landing-preview">
            <header><div><p className="eyebrow">Ward 6 · Critical care</p><h2 id="preview-title">Signal command view</h2></div><span className={`preview-state preview-state--${previewState}`} role="status">{previewState === 'offline' ? 'Live demo offline' : previewState === 'loading' ? 'Connecting…' : 'Live mock preview'}</span></header>
            <div className="landing-mini-ward" aria-label={previewState === 'offline' ? 'Still ward preview' : 'Live ward preview'}>{preview.map((bed, index) => <MiniBed bed={bed} index={index} key={bed.id} />)}</div>
          </section>
        </div>
      </section>

      <section className="landing-signal-strip" aria-label="SentinelWard signal model">
        <span>Patient state</span><i aria-hidden="true" /><span>Signal trust</span><i aria-hidden="true" /><span>Device integrity</span><i aria-hidden="true" /><strong>One safe decision surface</strong>
      </section>

      <section id="how-it-works" className="landing-explain" aria-labelledby="how-title">
        <header className="landing-section-heading"><div><p className="eyebrow">One reading. Three possible truths.</p><h2 id="how-title">SentinelWard separates what looks the same.</h2></div><p>A spike on a monitor can mean a patient emergency, a failing sensor, or a compromised device. The interface keeps those explanations visible without letting one erase another.</p></header>
        <div className="landing-card-grid">
          <SpotlightCard className="landing-cause-card landing-cause-card--emergency" spotlightColor="rgba(255, 77, 79, 0.18)"><span className="landing-cause-card__number">01</span><div className="landing-cause-card__icon" aria-hidden="true">♥</div><h3>Real emergency</h3><p>Keep the clinical alarm visible and move the response ladder forward.</p><footer><span>Patient first</span><i aria-hidden="true" /></footer></SpotlightCard>
          <SpotlightCard className="landing-cause-card landing-cause-card--sensor" spotlightColor="rgba(34, 211, 238, 0.18)"><span className="landing-cause-card__number">02</span><div className="landing-cause-card__icon" aria-hidden="true">⌁</div><h3>Loose / drifting sensor</h3><p>Flag the technical problem and ask for a bedside check without inventing a patient crisis.</p><footer><span>Verify by hand</span><i aria-hidden="true" /></footer></SpotlightCard>
          <SpotlightCard className="landing-cause-card landing-cause-card--security" spotlightColor="rgba(139, 188, 255, 0.2)"><span className="landing-cause-card__number">03</span><div className="landing-cause-card__icon" aria-hidden="true">◇</div><h3>Hacker</h3><p>Freeze last-trusted readings, preserve emergency alarms, and isolate only the compromised device.</p><footer><span>Contain the device</span><i aria-hidden="true" /></footer></SpotlightCard>
        </div>
      </section>

      <section className="landing-safety" aria-labelledby="safety-title">
        <div className="landing-safety__copy"><p className="eyebrow">Designed for the dangerous ambiguity</p><h2 id="safety-title">When data becomes doubtful, the ward does not go dark.</h2><p>SentinelWard keeps the last trusted values on screen, labels incoming telemetry honestly, preserves emergency escalation, and leaves treatment decisions with people.</p><Link to="/login?role=nurse">Enter the nurse view <span aria-hidden="true">→</span></Link></div>
        <ol className="landing-safety__steps">
          <li><span>01</span><div><strong>See the patient</strong><p>Clinical urgency stays separate from device confidence.</p></div></li>
          <li><span>02</span><div><strong>Question the signal</strong><p>Trust, freshness, and witness evidence remain explicit.</p></div></li>
          <li><span>03</span><div><strong>Preserve the alarm</strong><p>Tampering can never silence a real emergency.</p></div></li>
          <li><span>04</span><div><strong>Keep care human</strong><p>The interface supports decisions; it never changes treatment.</p></div></li>
        </ol>
      </section>

      <section className="landing-roles" aria-labelledby="roles-title">
        <header className="landing-section-heading"><div><p className="eyebrow">One command surface · five viewpoints</p><h2 id="roles-title">Everyone sees the same event through the right lens.</h2></div><p>Nurses, doctors, biomedical engineers, IT security, and demo operators receive role-specific screens without fragmenting the source of truth.</p></header>
        <div className="landing-role-map" aria-label="SentinelWard demo roles"><span>Nurse</span><span>Doctor / tele-ICU</span><span>Biomedical</span><span>IT security</span><span>Demo operator</span><strong aria-hidden="true">SW</strong></div>
      </section>

      <section className="landing-final-cta" aria-labelledby="final-cta-title"><div><p className="eyebrow">The ward is already waiting.</p><h2 id="final-cta-title">See the signal.<br />Question the source.</h2></div><div><p>Open the mock ward as Central Nurse and follow one urgent reading from bedside telemetry to a human response.</p><Link to="/login?role=nurse">Open SentinelWard <span aria-hidden="true">↗</span></Link></div></section>

      <footer className="landing-footer"><Link className="landing-footer__brand" to="/" aria-label="SentinelWard home"><span className="brand__sentinel">Sentinel</span><span className="brand__ward">Ward</span></Link><span>Team TessNova · IBM Z Datathon 2026</span><a href="https://github.com/aragupta1225/sentinelward-frontend">GitHub</a><span>Decision support only. Treatment is never automatic.</span></footer>
    </main>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preset = searchParams.get('role') as Role | null
  const signIn = useSessionStore((state) => state.signIn)
  const pendingRole = useSessionStore((state) => state.pendingRole)
  const lastAttemptRole = useSessionStore((state) => state.lastAttemptRole)
  const error = useSessionStore((state) => state.error)

  const chooseRole = async (role: Role) => {
    if (await signIn(role)) navigate(ROLE_HOME[role])
  }

  return (
    <main id="main-content" className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">Development authentication</p>
        <h1 id="login-title">Pick a demo role</h1>
        <p>Choose one role to open its home screen. Permissions in this demo follow the frontend specification.</p>
        <div className="login-role-grid">
          {roleCards.map((card) => <button type="button" key={card.role} className={preset === card.role ? 'login-role login-role--preset' : 'login-role'} disabled={pendingRole !== null} onClick={() => chooseRole(card.role)}><strong>{pendingRole === card.role && <i className="login-spinner" aria-hidden="true" />}{pendingRole === card.role ? 'Signing in…' : card.label}</strong><span>{card.description}</span>{preset === card.role && <em>Pre-selected</em>}</button>)}
        </div>
        {error && <div className="login-error" role="alert"><span>{error}</span><ActionButton onClick={() => chooseRole(lastAttemptRole ?? 'nurse')}>Retry</ActionButton></div>}
        <p className="scope-note">Demo accounts. A hospital would connect its own sign-in.</p>
      </section>
    </main>
  )
}
