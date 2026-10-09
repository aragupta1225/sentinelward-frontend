import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { useSessionStore } from './store/sessionStore'

afterEach(cleanup)

describe('screen routes', () => {
  it.each([
    ['/', 'SentinelWard'],
    ['/login', 'Select a role'],
    ['/census', 'Doctor / tele-ICU census'],
    ['/security', 'Security operations'],
    ['/incident/B08', 'Incident · Bed 8'],
    ['/incident/B08/report', 'CERT-In report draft'],
    ['/tickets', 'Biomedical tickets'],
    ['/briefing', 'Briefing and workload'],
    ['/log', 'Action log'],
    ['/demo', 'Demo control'],
    ['/telegram', 'Telegram message templates'],
    ['/lab/bed-tile', 'Live ward'],
  ])('renders %s', async (path, heading) => {
    if (path === '/' || path === '/login') useSessionStore.getState().signOut()
    else useSessionStore.getState().signIn('operator')
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })
})
