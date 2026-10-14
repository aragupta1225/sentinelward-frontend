import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { useSessionStore } from './store/sessionStore'

afterEach(cleanup)

describe('screen routes', () => {
  it.each([
    ['/', 'Patient, Sensor, or Hacker?', null],
    ['/login', 'Choose your workspace', null],
    ['/census', 'Doctor / tele-ICU census', 'doctor'],
    ['/security', 'Security operations', 'it'],
    ['/incident/B08', 'Replay attack on MON-08, Bed 8', 'it'],
    ['/incident/B08/report', 'CERT-In report draft', 'it'],
    ['/tickets', 'Biomedical tickets', 'biomedical'],
    ['/briefing', 'Shift briefing and workload', 'nurse'],
    ['/log', 'Action log', 'nurse'],
    ['/demo', 'Demo control', 'operator'],
    ['/telegram', 'Telegram message templates', 'nurse'],
    ['/lab/bed-tile', 'Live ward', 'nurse'],
  ] as const)('renders %s', async (path, heading, role) => {
    if (path === '/' || path === '/login') useSessionStore.getState().signOut()
    else await useSessionStore.getState().signIn(role ?? 'nurse')
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: heading }, { timeout: 5_000 })).toBeInTheDocument()
  })

  it('exposes section navigation only on the public landing page', async () => {
    useSessionStore.getState().signOut()
    const { unmount } = render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    const landingNavigation = await screen.findByRole('navigation', { name: 'Landing sections' })
    expect(landingNavigation).toContainElement(screen.getByRole('link', { name: 'How it works' }))
    expect(screen.getByRole('link', { name: 'Safety' })).toHaveAttribute('href', '#safety')
    expect(screen.getByRole('link', { name: 'Role views' })).toHaveAttribute('href', '#roles')
    unmount()

    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>)
    expect(screen.queryByRole('navigation', { name: 'Landing sections' })).not.toBeInTheDocument()
  })

  it('renders the nurse and doctor alerts route but hides it from unrelated roles', async () => {
    await useSessionStore.getState().signIn('nurse')
    const { unmount } = render(<MemoryRouter initialEntries={['/alerts']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Alerts and escalation' }, { timeout: 5_000 })).toBeInTheDocument()
    unmount()

    await useSessionStore.getState().signIn('it')
    render(<MemoryRouter initialEntries={['/alerts']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Security operations' }, { timeout: 5_000 })).toBeInTheDocument()
  })
})
