import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { BedDetailFunctionalPage } from './pages/BedDetailFunctionalPage'
import { ActionLogPage, BriefingPage, CensusPage, DemoPage, IncidentPage, LandingPage, LoginPage, ReportPage, SecurityPage, TelegramPage, TicketsPage } from './pages/OperationalPages'
import { WardPage } from './pages/WardPage'
import { WardMilestonePage } from './pages/WardMilestonePage'
import { useBedDetailStore } from './store/bedDetailStore'
import { canViewScreen, ROLE_LABELS, type ScreenId } from './domain/access'

const navigation = [
  ['/ward', 'Ward', 'ward'], ['/census', 'Census', 'census'], ['/security', 'Security', 'security'],
  ['/tickets', 'Tickets', 'tickets'], ['/briefing', 'Briefing', 'briefing'], ['/log', 'Log', 'log'], ['/demo', 'Demo', 'demo'],
] as const

function WardClock() {
  const [time, setTime] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setTime(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  return <time dateTime={new Date(time).toISOString()}>{new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(time)}</time>
}

export default function App() {
  const role = useBedDetailStore((state) => state.currentRole)
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="topbar">
        <Link className="brand" to="/ward" aria-label="SentinelWard ward view"><span className="brand__mark" aria-hidden="true">S</span><span><strong>SentinelWard</strong><small>Clinical command interface</small></span></Link>
        <nav className="primary-nav" aria-label="Primary">{navigation.filter(([, , screen]) => canViewScreen(role, screen as ScreenId)).map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>
        <div className="topbar__context"><WardClock /><span className="topbar__divider" aria-hidden="true" /><span>{ROLE_LABELS[role]} · Antara Gupta</span><Link className="logout-link" to="/login">Logout</Link></div>
      </header>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/ward" element={<WardPage />} />
        <Route path="/bed/:id" element={<BedDetailFunctionalPage />} />
        <Route path="/census" element={<CensusPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/incident/:id" element={<IncidentPage />} />
        <Route path="/incident/:id/report" element={<ReportPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/briefing" element={<BriefingPage />} />
        <Route path="/log" element={<ActionLogPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/telegram" element={<TelegramPage />} />
        <Route path="/lab/bed-tile" element={<WardMilestonePage />} />
        <Route path="*" element={<Navigate to="/ward" replace />} />
      </Routes>
    </div>
  )
}
