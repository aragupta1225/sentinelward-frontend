import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { BedDetailFunctionalPage } from './pages/BedDetailFunctionalPage'
import { LandingPage, LoginPage } from './pages/operational/PublicPages'
import { WardPage } from './pages/WardPage'
import { useBedDetailStore } from './store/bedDetailStore'
import { canViewScreen, ROLE_LABELS, type ScreenId } from './domain/access'
import { useSessionStore } from './store/sessionStore'
import { subscribeCommandFailures } from './adapters/commandGateway'

const navigation = [
  ['/ward', 'Ward', 'ward'], ['/census', 'Census', 'census'], ['/security', 'Security', 'security'],
  ['/tickets', 'Tickets', 'tickets'], ['/briefing', 'Briefing', 'briefing'], ['/log', 'Log', 'log'], ['/demo', 'Demo', 'demo'],
] as const

const CensusPage = lazy(() => import('./pages/operational/ClinicalPages').then((module) => ({ default: module.CensusPage })))
const BriefingPage = lazy(() => import('./pages/operational/ClinicalPages').then((module) => ({ default: module.BriefingPage })))
const ActionLogPage = lazy(() => import('./pages/operational/ClinicalPages').then((module) => ({ default: module.ActionLogPage })))
const SecurityPage = lazy(() => import('./pages/operational/SecurityPages').then((module) => ({ default: module.SecurityPage })))
const IncidentPage = lazy(() => import('./pages/operational/SecurityPages').then((module) => ({ default: module.IncidentPage })))
const ReportPage = lazy(() => import('./pages/operational/SecurityPages').then((module) => ({ default: module.ReportPage })))
const TicketsPage = lazy(() => import('./pages/operational/SupportPages').then((module) => ({ default: module.TicketsPage })))
const TelegramPage = lazy(() => import('./pages/operational/SupportPages').then((module) => ({ default: module.TelegramPage })))
const DemoPage = lazy(() => import('./pages/operational/DemoPage').then((module) => ({ default: module.DemoPage })))

function WardClock() {
  const [time, setTime] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setTime(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  return <time dateTime={new Date(time).toISOString()}>{new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(time)}</time>
}

function CommandFailureAnnouncer() {
  const [message, setMessage] = useState('')
  useEffect(() => subscribeCommandFailures((failure) => setMessage(`Action failed: ${failure.message}`)), [])
  return <div className="sr-only" role="alert">{message}</div>
}

function ProtectedRoute({ screen, children }: { screen: ScreenId; children: ReactNode }) {
  const authenticated = useSessionStore((state) => state.authenticated)
  const role = useBedDetailStore((state) => state.currentRole)
  if (!authenticated) return <Navigate to="/login" replace />
  if (!canViewScreen(role, screen)) return <Navigate to="/ward" replace />
  return children
}

function RouteLoading() {
  return <main id="main-content" className="route-loading"><div role="status"><span aria-hidden="true" />Loading screen…</div></main>
}

export default function App() {
  const role = useBedDetailStore((state) => state.currentRole)
  const authenticated = useSessionStore((state) => state.authenticated)
  const signOut = useSessionStore((state) => state.signOut)
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <CommandFailureAnnouncer />
      <header className="topbar">
        <Link className="brand" to="/ward" aria-label="SentinelWard ward view"><span className="brand__mark" aria-hidden="true">S</span><span><strong>SentinelWard</strong><small>Clinical command interface</small></span></Link>
        {authenticated && <nav className="primary-nav" aria-label="Primary">{navigation.filter(([, , screen]) => canViewScreen(role, screen as ScreenId)).map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>}
        {authenticated && <div className="topbar__context"><WardClock /><span className="topbar__divider" aria-hidden="true" /><span>{ROLE_LABELS[role]} · Antara Gupta</span><button className="logout-link" type="button" onClick={() => { signOut(); navigate('/login') }}>Logout</button></div>}
      </header>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ward" element={<ProtectedRoute screen="ward"><WardPage /></ProtectedRoute>} />
          <Route path="/bed/:id" element={<ProtectedRoute screen="ward"><BedDetailFunctionalPage /></ProtectedRoute>} />
          <Route path="/census" element={<ProtectedRoute screen="census"><CensusPage /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute screen="security"><SecurityPage /></ProtectedRoute>} />
          <Route path="/incident/:id" element={<ProtectedRoute screen="security"><IncidentPage /></ProtectedRoute>} />
          <Route path="/incident/:id/report" element={<ProtectedRoute screen="security"><ReportPage /></ProtectedRoute>} />
          <Route path="/tickets" element={<ProtectedRoute screen="tickets"><TicketsPage /></ProtectedRoute>} />
          <Route path="/briefing" element={<ProtectedRoute screen="briefing"><BriefingPage /></ProtectedRoute>} />
          <Route path="/log" element={<ProtectedRoute screen="log"><ActionLogPage /></ProtectedRoute>} />
          <Route path="/demo" element={<ProtectedRoute screen="demo"><DemoPage /></ProtectedRoute>} />
          <Route path="/telegram" element={<ProtectedRoute screen="telegram"><TelegramPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/ward" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}
