import { Link, useNavigate } from 'react-router-dom'
import { ActionButton, PageHeader } from '../../components/ui'
import { ROLE_HOME, ROLE_LABELS, ROLES, type Role } from '../../domain/access'
import { useBedDetailStore } from '../../store/bedDetailStore'
import { useSessionStore } from '../../store/sessionStore'

export function LandingPage() {
  const navigate = useNavigate()
  const signIn = useSessionStore((state) => state.signIn)
  return (
    <main id="main-content" className="simple-page landing-page">
      <PageHeader
        eyebrow="Clinical monitoring · device integrity"
        title="SentinelWard"
        description="Role-based ward awareness that keeps clinical urgency visible even when device data cannot be trusted."
      />
      <div className="page-actions">
        <Link to="/login">Sign in</Link>
        <ActionButton tone="primary" onClick={() => { signIn('operator'); navigate(ROLE_HOME.operator) }}>Open development demo</ActionButton>
      </div>
      <p className="scope-note">Decision support only. SentinelWard never changes treatment automatically.</p>
    </main>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const role = useBedDetailStore((state) => state.currentRole)
  const setRole = useBedDetailStore((state) => state.setRole)
  const signIn = useSessionStore((state) => state.signIn)
  return (
    <main id="main-content" className="simple-page">
      <PageHeader eyebrow="Development authentication" title="Select a role" description="Final identity and permissions will come from the backend authentication contract." />
      <label className="field">Role<select value={role} onChange={(event) => setRole(event.target.value as Role)}>{ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label>
      <ActionButton tone="primary" onClick={() => { signIn(role); navigate(ROLE_HOME[role]) }}>Continue as {ROLE_LABELS[role]}</ActionButton>
    </main>
  )
}
