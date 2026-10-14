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
  { role: 'operator', label: 'System operator', description: 'Monitor system behaviour and coordinate controlled scenarios.' },
]

function WorkspaceIcon({ role }: { role: Role }) {
  const commonProps = {
    viewBox: '0 0 64 64',
    'aria-hidden': true,
    focusable: false,
  } as const

  if (role === 'nurse') return (
    <svg {...commonProps}>
      <path d="M9 48V24m0 16h38v8M13 33h17a7 7 0 0 1 7 7H9m27-21h17v15H36z" />
      <path d="M40 27h3l2-5 3 10 2-5h3" />
    </svg>
  )
  if (role === 'doctor') return (
    <svg {...commonProps}>
      <path d="M18 13v13a13 13 0 0 0 26 0V13M14 13a4 4 0 1 0 8 0m18 0a4 4 0 1 0 8 0" />
      <path d="M31 39v5a10 10 0 0 0 20 0v-3" />
      <circle cx="51" cy="36" r="5" />
    </svg>
  )
  if (role === 'biomedical') return (
    <svg {...commonProps}>
      <path d="M50 14a14 14 0 0 1-18 17L15 48a5 5 0 0 1-7-7l17-17A14 14 0 0 1 42 6l-8 8 2 8 8 2z" />
    </svg>
  )
  if (role === 'it') return (
    <svg {...commonProps}>
      <path d="M32 6 51 14v14c0 13-8 23-19 29C21 51 13 41 13 28V14z" />
      <rect x="24" y="29" width="16" height="14" rx="2" />
      <path d="M28 29v-4a4 4 0 0 1 8 0v4m-4 6v3" />
    </svg>
  )
  return (
    <svg {...commonProps}>
      <circle cx="32" cy="32" r="9" />
      <path d="M28 5h8l2 8a20 20 0 0 1 5 2l7-4 5 5-4 7a20 20 0 0 1 2 5l8 2v8l-8 2a20 20 0 0 1-2 5l4 7-5 5-7-4a20 20 0 0 1-5 2l-2 8h-8l-2-8a20 20 0 0 1-5-2l-7 4-5-5 4-7a20 20 0 0 1-2-5l-8-2v-8l8-2a20 20 0 0 1 2-5l-4-7 5-5 7 4a20 20 0 0 1 5-2z" />
    </svg>
  )
}

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
      <div className="landing-bed__signal" aria-hidden="true"><svg viewBox="0 0 180 36" preserveAspectRatio="none"><g><path d="M0 22h28l7-3 5 8 7-22 8 17h22l6-4 6 9 7-18 8 13h32l6-4 7 8 8-15 9 11h24" /><path d="M180 22h28l7-3 5 8 7-22 8 17h22l6-4 6 9 7-18 8 13h32l6-4 7 8 8-15 9 11h24" /></g></svg></div>
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
    document.documentElement.classList.add('landing-smooth-scroll')

    const cleanUpPageClasses = () => {
      page.classList.remove('landing-page--reveal-ready')
      document.documentElement.classList.remove('landing-smooth-scroll')
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showAll()
      return cleanUpPageClasses
    }

    if (!('IntersectionObserver' in window)) {
      showAll()
      return cleanUpPageClasses
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 })

    sections.forEach((section) => observer.observe(section))
    return () => {
      observer.disconnect()
      cleanUpPageClasses()
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
          <p className="landing-hero__lead">Real-time intelligence that helps care teams distinguish a patient event from a sensor issue or compromised device.</p>
          <div className="page-actions landing-hero__actions"><Link className="landing-primary-action" to="/login?role=nurse">Open the live ward <span aria-hidden="true">↗</span></Link><a href="#how-it-works">See how it decides <span aria-hidden="true">↓</span></a></div>
          <ul className="landing-proof-list" aria-label="Product boundaries">
            <li><strong>Patient</strong><span>clinical context first</span></li>
            <li><strong>Signal</strong><span>trust stays visible</span></li>
            <li><strong>Human</strong><span>treatment decisions</span></li>
          </ul>
        </div>

        <div className="landing-hero__visual" aria-labelledby="preview-title">
          <div className="landing-orbit landing-orbit--one" aria-hidden="true" />
          <div className="landing-orbit landing-orbit--two" aria-hidden="true" />
          <div className="landing-float-chip landing-float-chip--top" aria-hidden="true"><i /> Last trusted snapshot</div>
          <div className="landing-float-chip landing-float-chip--bottom" aria-hidden="true"><i /> Human decision required</div>
          <section className="landing-preview">
            <header><div><p className="eyebrow">Critical care monitoring</p><h2 id="preview-title">Signal command view</h2></div><span className={`preview-state preview-state--${previewState}`} role="status">{previewState === 'offline' ? 'Preview unavailable' : previewState === 'loading' ? 'Preparing preview…' : 'Interface preview'}</span></header>
            <div className="landing-mini-ward" aria-label={previewState === 'offline' ? 'Still ward preview' : 'Live ward preview'}>{preview.map((bed, index) => <MiniBed bed={bed} index={index} key={bed.id} />)}</div>
          </section>
        </div>
      </section>

      <section id="signal-model" className="landing-signal-strip" data-scroll-reveal aria-label="SentinelWard signal model">
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

      <section id="safety" className="landing-safety" data-scroll-reveal aria-labelledby="safety-title">
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

      <section id="roles" className="landing-roles" data-scroll-reveal aria-labelledby="roles-title">
        <header className="landing-section-heading landing-section-heading--compact"><div><p className="eyebrow">One shared source of truth</p><h2 id="roles-title">One event. Five role views.</h2></div><p>Each team sees the action they own—without losing the shared clinical context.</p></header>
        <div className="landing-role-network" aria-label="One bed high alarm shared across five SentinelWard roles">
          <svg className="landing-role-network__lines" viewBox="0 0 1200 440" preserveAspectRatio="none" aria-hidden="true">
            <ellipse cx="600" cy="233" rx="476" ry="151" />
            <ellipse className="landing-role-network__halo" cx="600" cy="233" rx="404" ry="119" />
          </svg>
          <div className="landing-network-event">
            <span><i aria-hidden="true" /> Shared event · 09:42</span>
            <strong>Bed · High alarm</strong>
            <small>HR 142 · signal trusted</small>
          </div>
          <ul className="landing-network-roles">
            <li className="landing-network-role landing-network-role--nurse"><span className="landing-network-role__content"><b aria-hidden="true">N</b><span><strong>Central nurse</strong><small>Respond now</small></span></span></li>
            <li className="landing-network-role landing-network-role--doctor"><span className="landing-network-role__content"><b aria-hidden="true">D</b><span><strong>Doctor / tele-ICU</strong><small>Review patient</small></span></span></li>
            <li className="landing-network-role landing-network-role--biomed"><span className="landing-network-role__content"><b aria-hidden="true">B</b><span><strong>Biomedical</strong><small>Check device</small></span></span></li>
            <li className="landing-network-role landing-network-role--it"><span className="landing-network-role__content"><b aria-hidden="true">IT</b><span><strong>IT security</strong><small>Verify integrity</small></span></span></li>
            <li className="landing-network-role landing-network-role--operator"><span className="landing-network-role__content"><b aria-hidden="true">O</b><span><strong>System operator</strong><small>Monitor flow</small></span></span></li>
          </ul>
        </div>
      </section>

      <section className="landing-final-cta" data-scroll-reveal aria-labelledby="final-cta-title"><div><p className="eyebrow">The ward is waiting.</p><h2 id="final-cta-title">See the signal.<br />Question the source.</h2></div><div><p>Follow one urgent reading from telemetry to a human response.</p><Link to="/login?role=nurse">Open SentinelWard <span aria-hidden="true">↗</span></Link></div></section>

      <footer className="landing-footer"><Link className="landing-footer__brand" to="/" aria-label="SentinelWard home"><span className="brand__sentinel">Sentinel</span><span className="brand__ward">Ward</span></Link><span>Clinical clarity across every monitored bed.</span><a href="https://github.com/aragupta1225/sentinelward-frontend">GitHub</a><span>Decision support only. Treatment is never automatic.</span></footer>
    </main>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedRole = searchParams.get('role')
  const preset = roleCards.find((card) => card.role === requestedRole)?.role ?? null
  const [activeRole, setActiveRole] = useState<Role | null>(() => preset)
  const [expandedRole, setExpandedRole] = useState<Role | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)
  const signIn = useSessionStore((state) => state.signIn)
  const pendingRole = useSessionStore((state) => state.pendingRole)
  const lastAttemptRole = useSessionStore((state) => state.lastAttemptRole)
  const error = useSessionStore((state) => state.error)

  const chooseRole = async (role: Role) => {
    setActiveRole(role)
    setExpandedRole(role)
    if (!await signIn(role)) return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsLeaving(true)
      await new Promise<void>((resolve) => window.setTimeout(resolve, 220))
    }
    navigate(ROLE_HOME[role])
  }

  const clearRoleSelection = (event: MouseEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('.login-role')) return
    setExpandedRole(null)
  }

  return (
    <main id="main-content" className={isLeaving ? 'login-page login-page--leaving' : 'login-page'} aria-busy={pendingRole !== null || isLeaving} onClick={clearRoleSelection}>
      <svg className="login-backdrop" viewBox="0 0 1600 860" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="login-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0v28" /></pattern>
        </defs>
        <rect width="1600" height="860" fill="url(#login-grid)" />
        <g className="login-backdrop__paths">
          <path d="M-10 122C68 92 62 8 137-20S265 59 366 40" />
          <path d="M-16 166C72 137 72 37 150 9s119 73 214 56" />
          <path d="M1608 76c-76-20-108 30-161 68s-130 10-199 44" />
          <path d="M1610 568c-77 29-74 123-154 151s-142-58-230-17-92 111-173 130" />
          <path d="M-14 580c70 30 52 133 135 166s145-44 222 0" />
        </g>
        <g className="login-backdrop__dots">
          <circle cx="36" cy="112" r="5" /><circle cx="365" cy="40" r="5" /><circle cx="1538" cy="41" r="5" />
          <circle cx="1414" cy="189" r="5" /><circle cx="1510" cy="706" r="5" /><circle cx="1258" cy="772" r="5" />
          <circle cx="101" cy="769" r="5" /><circle cx="264" cy="799" r="5" />
        </g>
        <path className="login-backdrop__ecg" d="M770 111h114l7-11 9 33 9-74 12 52h82l9-11 9 30 9-70 12 51h87l9-12 10 31 12-81 13 62h85l9-12 11 32 10-67 13 47h85" />
      </svg>
      <section className="login-card" aria-labelledby="login-title">
        <Link className="login-back-link" to="/" aria-label="Back to SentinelWard home"><span aria-hidden="true">←</span> Back to home</Link>
        <p className="eyebrow">Role-based access</p>
        <h1 id="login-title">Choose your workspace</h1>
        <p>Select a role to open the workspace and actions relevant to that team.</p>
        <div className="login-role-grid">
          {roleCards.map((card) => (
            <button
              type="button"
              key={card.role}
              className={`login-role${activeRole === card.role ? ' login-role--active' : ''}${expandedRole === card.role ? ' login-role--expanded' : ''}`}
              aria-pressed={activeRole === card.role}
              disabled={pendingRole !== null || isLeaving}
              onPointerDown={() => { setActiveRole(card.role); setExpandedRole(card.role) }}
              onClick={() => chooseRole(card.role)}
            >
              <span className="login-role__icon"><WorkspaceIcon role={card.role} /></span>
              <strong>{pendingRole === card.role && <i className="login-spinner" aria-hidden="true" />}{pendingRole === card.role ? 'Signing in…' : card.label}</strong>
              <span className="login-role__description">{card.description}</span>
              {preset === card.role && <em className="sr-only">Pre-selected</em>}
            </button>
          ))}
        </div>
        {error && <div className="login-error" role="alert"><span>{error}</span><ActionButton onClick={() => chooseRole(lastAttemptRole ?? 'nurse')}>Retry</ActionButton></div>}
        <footer className="login-scope-note"><span aria-hidden="true">i</span><p>Each workspace keeps clinical, technical, and operational responsibilities clearly separated.</p></footer>
      </section>
    </main>
  )
}
