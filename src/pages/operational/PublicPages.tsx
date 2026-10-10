import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { loadWardPreview } from '../../adapters/publicGateway'
import { ActionButton, Panel } from '../../components/ui'
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

function MiniBed({ bed }: { bed: Bed }) {
  const high = bed.priority === 'high'
  return (
    <article className={`landing-bed${high ? ' landing-bed--high' : ''}`} aria-label={`${bed.label}: ${bed.reason}`}>
      <header><strong>{bed.label}</strong><span>{high ? 'HIGH ALARM' : bed.verdict.replaceAll('_', ' ')}</span></header>
      <div><b>{bed.readings.heartRate ?? '—'}</b><small>HR</small><b>{bed.readings.spo2 ?? '—'}</b><small>SpO₂</small></div>
      <footer>Trust {bed.trust}%</footer>
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
      <section className="landing-hero">
        <p className="eyebrow">Clinical monitoring · device integrity</p>
        <h1>Patient, Sensor, or Hacker?</h1>
        <p>Real-time AI on IBM LinuxONE that tells, for every hospital bed, whether a scary reading is real.</p>
        <div className="page-actions"><Link className="landing-primary-action" to="/login?role=nurse">Open the live ward</Link><a href="#how-it-works">How it works ↓</a></div>
      </section>

      <section className="landing-preview" aria-labelledby="preview-title">
        <header><div><p className="eyebrow">Read-only ward preview</p><h2 id="preview-title">Four beds, one urgent signal</h2></div><span className={`preview-state preview-state--${previewState}`} role="status">{previewState === 'offline' ? 'Live demo offline' : previewState === 'loading' ? 'Connecting…' : 'Live mock preview'}</span></header>
        <div className="landing-mini-ward" aria-label={previewState === 'offline' ? 'Still ward preview' : 'Live ward preview'}>{preview.map((bed) => <MiniBed bed={bed} key={bed.id} />)}</div>
      </section>

      <section id="how-it-works" className="landing-explain" aria-labelledby="how-title">
        <div><p className="eyebrow">What SentinelWard separates</p><h2 id="how-title">Three causes. Three safe responses.</h2></div>
        <div className="landing-card-grid">
          <Panel as="article"><strong>Real emergency</strong><p>Keep the clinical alarm visible and move the response ladder forward.</p></Panel>
          <Panel as="article"><strong>Loose / drifting sensor</strong><p>Flag the technical problem and ask for a bedside check without inventing a patient crisis.</p></Panel>
          <Panel as="article"><strong>Hacker</strong><p>Freeze last-trusted readings, preserve emergency alarms, and isolate only the compromised device.</p></Panel>
        </div>
      </section>

      <footer className="landing-footer"><span>Team TessNova · IBM Z Datathon 2026</span><a href="https://github.com/aragupta1225/sentinelward-frontend">GitHub</a><span>Decision support only. Treatment is never automatic.</span></footer>
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
