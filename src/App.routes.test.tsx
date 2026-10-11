import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { useSessionStore } from './store/sessionStore'

afterEach(cleanup)

describe('screen routes', () => {
  it.each([
    ['/', 'Patient, Sensor, or Hacker?', null],
    ['/login', 'Pick a demo role', null],
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
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })

  it('renders the nurse and doctor alerts route but hides it from unrelated roles', async () => {
    await useSessionStore.getState().signIn('nurse')
    const { unmount } = render(<MemoryRouter initialEntries={['/alerts']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Alerts and escalation' })).toBeInTheDocument()
    unmount()

    await useSessionStore.getState().signIn('it')
    render(<MemoryRouter initialEntries={['/alerts']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Security operations' })).toBeInTheDocument()
  })
})
