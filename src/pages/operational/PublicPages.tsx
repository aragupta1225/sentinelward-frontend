import { Link, useNavigate } from 'react-router-dom'
import { ROLE_LABELS, ROLES, type Role } from '../../domain/access'
import { useBedDetailStore } from '../../store/bedDetailStore'
import { useSessionStore } from '../../store/sessionStore'

export function LandingPage() {
  const navigate = useNavigate()
  const signIn = useSessionStore((state) => state.signIn)
  return <main id="main-content" className="simple-page landing-page"><p className="eyebrow">Clinical monitoring · device integrity</p><h1>SentinelWard</h1><p>Role-based ward awareness that keeps clinical urgency visible even when device data cannot be trusted.</p><div className="page-actions"><Link to="/login">Sign in</Link><button type="button" onClick={() => { signIn('operator'); navigate('/ward') }}>Open development demo</button></div><p className="scope-note">Decision support only. SentinelWard never changes treatment automatically.</p></main>
}

export function LoginPage() {
  const navigate = useNavigate()
  const role = useBedDetailStore((state) => state.currentRole)
  const setRole = useBedDetailStore((state) => state.setRole)
  const signIn = useSessionStore((state) => state.signIn)
  return <main id="main-content" className="simple-page"><p className="eyebrow">Development authentication</p><h1>Select a role</h1><p>Final identity and permissions will come from the backend authentication contract.</p><label className="field">Role<select value={role} onChange={(event) => setRole(event.target.value as Role)}>{ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label><button className="primary-action" type="button" onClick={() => { signIn(role); navigate('/ward') }}>Continue to ward</button></main>
}
