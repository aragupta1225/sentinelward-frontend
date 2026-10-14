import { lazy, Suspense, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BedDetailFunctionalPage } from './pages/BedDetailFunctionalPage'
import { LandingPage, LoginPage } from './pages/operational/PublicPages'
import { WardPage } from './pages/WardPage'
import { useBedDetailStore } from './store/bedDetailStore'
import { canViewScreen, ROLE_HOME, ROLE_LABELS, type ScreenId } from './domain/access'
import { useSessionStore } from './store/sessionStore'
import { subscribeCommandFailures } from './adapters/commandGateway'
import { useWardDashboardStore } from './store/wardDashboardStore'
import { DockMotion } from './components/DockMotion'

const navigation = [
  ['/ward', 'Ward', 'ward'], ['/alerts', 'Alerts', 'alerts'], ['/census', 'Census', 'census'], ['/security', 'Security', 'security'],
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
const AlertsPage = lazy(() => import('./pages/operational/AlertsPage').then((module) => ({ default: module.AlertsPage })))

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
  if (!canViewScreen(role, screen)) return <Navigate to={ROLE_HOME[role]} replace />
  return children
}

function RouteLoading() {
  return <main id="main-content" className="route-loading"><div role="status"><span aria-hidden="true" />Loading screen…</div></main>
}

export default function App() {
  const role = useBedDetailStore((state) => state.currentRole)
  const authenticated = useSessionStore((state) => state.authenticated)
  const displayName = useSessionStore((state) => state.displayName)
  const signOut = useSessionStore((state) => state.signOut)
  const wardBeds = useWardDashboardStore((state) => state.beds)
  const highAlerts = useMemo(() => wardBeds.filter((bed) => bed.priority === 'high'), [wardBeds])
  const navigate = useNavigate()
  const location = useLocation()
  const isPublicLanding = !authenticated && location.pathname === '/'
  const isPublicLogin = !authenticated && location.pathname === '/login'
  const scrollToLandingSection = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector<HTMLElement>(event.currentTarget.hash)
    if (!target) return
    event.preventDefault()
    target.classList.add('is-visible')
    const headerHeight = event.currentTarget.closest('header')?.getBoundingClientRect().height ?? 0
    const targetBounds = target.getBoundingClientRect()
    const availableHeight = window.innerHeight - headerHeight
    const breathingRoom = Math.max(16, (availableHeight - Math.min(targetBounds.height, availableHeight)) / 2)
    const top = window.scrollY + targetBounds.top - headerHeight - breathingRoom
    window.history.replaceState(null, '', event.currentTarget.hash)
    window.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <DockMotion />
      <CommandFailureAnnouncer />
      <header className={isPublicLanding ? 'topbar topbar--landing' : isPublicLogin ? 'topbar topbar--login' : 'topbar'}>
        <Link className="brand" to={authenticated ? '/ward' : '/'} aria-label={authenticated ? 'SentinelWard ward view' : 'SentinelWard home'}><span className="brand__wordmark" aria-hidden="true"><span className="brand__sentinel">Sentinel</span><span className="brand__ward">Ward</span></span></Link>
        {authenticated && <nav className="primary-nav" aria-label="Primary">{navigation.filter(([, , screen]) => canViewScreen(role, screen as ScreenId)).map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>}
        {isPublicLanding && <nav className="primary-nav landing-nav" aria-label="Landing sections">
          <a href="#how-it-works" onClick={scrollToLandingSection}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 10h3l1.5-4 3 8 2-5 1.5 3h4" /></svg><span>How it works</span></a>
          <a href="#safety" onClick={scrollToLandingSection}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5 16 5v4.4c0 4-2.5 6.8-6 8.1-3.5-1.3-6-4.1-6-8.1V5l6-2.5Z" /><path d="m7.3 10 1.7 1.7 3.8-4" /></svg><span>Safety</span></a>
          <a href="#roles" onClick={scrollToLandingSection}><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="6.2" r="2.5" /><circle cx="4.3" cy="9" r="1.8" /><circle cx="15.7" cy="9" r="1.8" /><path d="M5.8 16c.4-2.8 1.8-4.2 4.2-4.2s3.8 1.4 4.2 4.2M1.8 15c.2-1.9 1.1-2.9 2.7-2.9M18.2 15c-.2-1.9-1.1-2.9-2.7-2.9" /></svg><span>Role views</span></a>
        </nav>}
        {authenticated ? <div className="topbar__context"><WardClock /><span className="topbar__divider" aria-hidden="true" /><span>{ROLE_LABELS[role]} · {displayName}</span><button className="logout-link" type="button" onClick={() => { signOut(); navigate('/login') }}>Logout</button></div> : <Link className="logout-link public-login-link" to="/login">Log in</Link>}
      </header>
      {authenticated && highAlerts.length > 0 && <div className="global-high-alert" role="status"><strong>▲ {highAlerts.length} high-priority {highAlerts.length === 1 ? 'alarm' : 'alarms'}</strong><span>{highAlerts.map((bed) => bed.label).join(' · ')}</span><Link to="/ward">Open ward</Link></div>}
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ward" element={<ProtectedRoute screen="ward"><WardPage /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute screen="alerts"><AlertsPage /></ProtectedRoute>} />
          <Route path="/bed/:id" element={<ProtectedRoute screen="bed"><BedDetailFunctionalPage /></ProtectedRoute>} />
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
