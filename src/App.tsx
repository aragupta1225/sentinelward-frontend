import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { BedDetailFunctionalPage } from './pages/BedDetailFunctionalPage'
import { ActionLogPage, BriefingPage, CensusPage, DemoPage, IncidentPage, LandingPage, LoginPage, ReportPage, SecurityPage, TelegramPage, TicketsPage } from './pages/OperationalPages'
import { WardPage } from './pages/WardPage'
import { WardMilestonePage } from './pages/WardMilestonePage'
import { useBedDetailStore } from './store/bedDetailStore'

const navigation = [
  ['/ward', 'Ward'], ['/census', 'Census'], ['/security', 'Security'],
  ['/tickets', 'Tickets'], ['/briefing', 'Briefing'], ['/log', 'Log'], ['/demo', 'Demo'],
] as const

export default function App() {
  const role = useBedDetailStore((state) => state.currentRole)
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="topbar">
        <Link className="brand" to="/ward" aria-label="SentinelWard ward view"><span className="brand__mark" aria-hidden="true">S</span><span><strong>SentinelWard</strong><small>Clinical command interface</small></span></Link>
        <nav className="primary-nav" aria-label="Primary">{navigation.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>
        <div className="topbar__context"><span>{role.replace('_', ' ')} · Antara Gupta</span></div>
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
