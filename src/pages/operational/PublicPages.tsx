import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { loadWardPreview } from '../../adapters/publicGateway'
import { TiltedCard } from '../../components/landing/TiltedCard'
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

const safetyPrinciples = [
  { number: '01', title: 'See the patient', description: 'Clinical urgency stays separate from device confidence.' },
  { number: '02', title: 'Question the signal', description: 'Trust, freshness, and witness evidence remain explicit.' },
  { number: '03', title: 'Preserve the alarm', description: 'Tampering can never silence a real emergency.' },
  { number: '04', title: 'Keep care human', description: 'The interface supports decisions; it never changes treatment.' },
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
  const landingPageRef = useRef<HTMLElement>(null)
  const [preview, setPreview] = useState<Bed[]>(() => structuredClone(BED_FIXTURES.slice(0, 4)))
  const [previewState, setPreviewState] = useState<'loading' | 'live' | 'offline'>('loading')
  const [activeSafetyCard, setActiveSafetyCard] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    loadWardPreview(controller.signal)
      .then((beds) => { setPreview(beds.slice(0, 4)); setPreviewState('live') })
      .catch(() => { if (!controller.signal.aborted) setPreviewState('offline') })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const page = landingPageRef.current
    const sections = Array.from(page?.querySelectorAll<HTMLElement>('[data-scroll-reveal]') ?? [])
    if (!page || sections.length === 0) return

    const showAll = () => sections.forEach((section) => section.classList.add('is-visible'))
    page.classList.add('landing-page--reveal-ready')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showAll()
      return () => page.classList.remove('landing-page--reveal-ready')
    }

    const remaining = new Set(sections)
    let pendingFrame = 0
    const removeListeners = () => {
      window.removeEventListener('scroll', scheduleReveal)
      window.removeEventListener('resize', scheduleReveal)
    }
    const revealVisible = () => {
      pendingFrame = 0
      for (const section of remaining) {
        const bounds = section.getBoundingClientRect()
        if (bounds.top > window.innerHeight * 0.9 || bounds.bottom < 0) continue
        section.classList.add('is-visible')
        remaining.delete(section)
      }
      if (remaining.size === 0) removeListeners()
    }
    function scheduleReveal() {
      if (pendingFrame) return
      pendingFrame = window.requestAnimationFrame(revealVisible)
    }

    window.addEventListener('scroll', scheduleReveal, { passive: true })
    window.addEventListener('resize', scheduleReveal)
    revealVisible()
    return () => {
      window.cancelAnimationFrame(pendingFrame)
      removeListeners()
    }
  }, [])

  const clearSafetySelection = (event: MouseEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('.landing-safety-card')) return
    setActiveSafetyCard(null)
  }

  return (
    <main ref={landingPageRef} id="main-content" className="landing-page" onClick={clearSafetySelection}>
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

      <section className="landing-signal-strip" data-scroll-reveal aria-label="SentinelWard signal model">
        <span>Patient state</span><i aria-hidden="true" /><span>Signal trust</span><i aria-hidden="true" /><span>Device integrity</span><i aria-hidden="true" /><strong>One safe decision surface</strong>
      </section>

      <section id="how-it-works" className="landing-explain" data-scroll-reveal aria-labelledby="how-title">
        <header className="landing-section-heading"><div><p className="eyebrow">One reading. Three possible truths.</p><h2 id="how-title">SentinelWard separates what looks the same.</h2></div><p>A spike can be a patient emergency, a sensor fault, or a compromised device. SentinelWard keeps all three possibilities visible.</p></header>
        <div className="landing-card-grid">
          <TiltedCard className="landing-cause-card landing-cause-card--emergency" glareColor="rgba(255, 77, 79, 0.24)" borderGlowColor="rgba(255, 127, 137, 0.95)"><span className="landing-cause-card__number">01</span><div className="landing-cause-card__icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 26S5 20 5 11.8C5 7.9 9.8 5.8 13 9l3 3 3-3c3.2-3.2 8-1.1 8 2.8C27 20 16 26 16 26Z" /><path d="M9 16h4l1.8-3.5 2.5 7 1.8-3.5H23" /></svg></div><h3>Real emergency</h3><p>Keep the alarm visible and escalate the response.</p><footer><span>Patient first</span><i aria-hidden="true" /></footer></TiltedCard>
          <TiltedCard className="landing-cause-card landing-cause-card--sensor" glareColor="rgba(34, 211, 238, 0.22)" borderGlowColor="rgba(90, 224, 239, 0.94)"><span className="landing-cause-card__number">02</span><div className="landing-cause-card__icon" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="3" /><path d="M10.8 10.8a7.4 7.4 0 0 0 0 10.4M21.2 10.8a7.4 7.4 0 0 1 0 10.4M7.2 7.2a12.4 12.4 0 0 0 0 17.6M24.8 7.2a12.4 12.4 0 0 1 0 17.6" /></svg></div><h3>Loose or drifting sensor</h3><p>Request a bedside check. Never invent a crisis.</p><footer><span>Verify by hand</span><i aria-hidden="true" /></footer></TiltedCard>
          <TiltedCard className="landing-cause-card landing-cause-card--security" glareColor="rgba(139, 188, 255, 0.25)" borderGlowColor="rgba(139, 188, 255, 0.98)"><span className="landing-cause-card__number">03</span><div className="landing-cause-card__icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4 25 8v6.5c0 6-3.8 10.8-9 13.5-5.2-2.7-9-7.5-9-13.5V8l9-4Z" /><path d="m12.3 16 2.4 2.4 5.2-5.2" /></svg></div><h3>Compromised device</h3><p>Freeze trusted values and isolate the device—not the patient.</p><footer><span>Contain the device</span><i aria-hidden="true" /></footer></TiltedCard>
        </div>
      </section>

      <section className="landing-safety" data-scroll-reveal aria-labelledby="safety-title">
        <div className="landing-safety__copy"><p className="eyebrow">Designed for dangerous ambiguity</p><h2 id="safety-title">Doubtful data never makes the ward go dark.</h2><p>Last-trusted values stay visible, emergencies keep escalating, and treatment stays human.</p><Link to="/login?role=nurse">Enter the nurse view <span aria-hidden="true">→</span></Link></div>
        <ol className="landing-safety__steps" aria-label="SentinelWard safety principles">
          {safetyPrinciples.map((principle, index) => (
            <li key={principle.number} data-active={activeSafetyCard === index}>
              <button
                type="button"
                className="landing-safety-card"
                aria-pressed={activeSafetyCard === index}
                onPointerDown={() => setActiveSafetyCard(index)}
                onClick={() => setActiveSafetyCard(index)}
              >
                <span className="landing-safety-card__surface">
                  <span className="landing-safety-card__number">{principle.number}</span>
                  <span className="landing-safety-card__copy"><strong>{principle.title}</strong><span>{principle.description}</span></span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-roles" data-scroll-reveal aria-labelledby="roles-title">
        <header className="landing-section-heading landing-section-heading--compact"><div><p className="eyebrow">One shared source of truth</p><h2 id="roles-title">One event. Five role views.</h2></div><p>Each team sees the action they own—without losing the shared clinical context.</p></header>
        <div className="landing-role-network" aria-label="One Bed 08 high alarm shared across five SentinelWard roles">
          <svg className="landing-role-network__lines" viewBox="0 0 1200 440" preserveAspectRatio="none" aria-hidden="true">
            <ellipse cx="600" cy="233" rx="476" ry="151" />
            <ellipse className="landing-role-network__halo" cx="600" cy="233" rx="404" ry="119" />
          </svg>
          <div className="landing-network-event">
            <span><i aria-hidden="true" /> Shared event · 09:42</span>
            <strong>Bed 08 · High alarm</strong>
            <small>HR 142 · signal trusted</small>
          </div>
          <ul className="landing-network-roles">
            <li className="landing-network-role landing-network-role--nurse"><span className="landing-network-role__content"><b aria-hidden="true">N</b><span><strong>Central nurse</strong><small>Respond now</small></span></span></li>
            <li className="landing-network-role landing-network-role--doctor"><span className="landing-network-role__content"><b aria-hidden="true">D</b><span><strong>Doctor / tele-ICU</strong><small>Review patient</small></span></span></li>
            <li className="landing-network-role landing-network-role--biomed"><span className="landing-network-role__content"><b aria-hidden="true">B</b><span><strong>Biomedical</strong><small>Check device</small></span></span></li>
            <li className="landing-network-role landing-network-role--it"><span className="landing-network-role__content"><b aria-hidden="true">IT</b><span><strong>IT security</strong><small>Verify integrity</small></span></span></li>
            <li className="landing-network-role landing-network-role--operator"><span className="landing-network-role__content"><b aria-hidden="true">O</b><span><strong>Demo operator</strong><small>Observe scenario</small></span></span></li>
          </ul>
        </div>
      </section>

      <section className="landing-final-cta" data-scroll-reveal aria-labelledby="final-cta-title"><div><p className="eyebrow">The ward is waiting.</p><h2 id="final-cta-title">See the signal.<br />Question the source.</h2></div><div><p>Follow one urgent reading from telemetry to a human response.</p><Link to="/login?role=nurse">Open SentinelWard <span aria-hidden="true">↗</span></Link></div></section>

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
        <Link className="login-back-link" to="/" aria-label="Back to SentinelWard home"><span aria-hidden="true">←</span> Back to home</Link>
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
