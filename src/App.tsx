import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { WardMilestonePage } from './pages/WardMilestonePage'

export default function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="topbar">
        <Link className="brand" to="/ward" aria-label="SentinelWard ward view"><span className="brand__mark" aria-hidden="true">S</span><span><strong>SentinelWard</strong><small>Clinical command interface</small></span></Link>
        <div className="topbar__context"><span>Ward 6 · Critical Care</span><span className="topbar__divider" aria-hidden="true" /><span>Frontend · Antara Gupta</span></div>
      </header>
      <Routes>
        <Route path="/" element={<Navigate to="/ward" replace />} />
        <Route path="/ward" element={<WardMilestonePage />} />
        <Route path="*" element={<Navigate to="/ward" replace />} />
      </Routes>
    </div>
  )
}
