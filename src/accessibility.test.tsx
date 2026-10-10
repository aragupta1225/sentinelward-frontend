import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { WardGrid } from './components/WardGrid'
import { BED_FIXTURES } from './mocks/fixtures'
import { useSessionStore } from './store/sessionStore'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
    },
  })
  expect(results.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) }))).toEqual([])
}

describe('accessibility foundations', () => {
  it.each([
    ['/', 'Patient, Sensor, or Hacker?'],
    ['/login', 'Pick a demo role'],
    ['/security', 'Security operations'],
    ['/incident/B08/report', 'CERT-In report draft'],
  ])('has no detectable structural axe violations on the %s route', async (path, heading) => {
    if (path === '/' || path === '/login') useSessionStore.getState().signOut()
    else await useSessionStore.getState().signIn('it')
    const { container } = render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
    await screen.findByRole('heading', { level: 1, name: heading })
    await expectNoAxeViolations(container)
  })

  it('exposes textual alert, trust, isolation, and freshness status', () => {
    render(<MemoryRouter><WardGrid beds={[BED_FIXTURES[7]]} onOpenBed={() => undefined} /></MemoryRouter>)
    expect(screen.getByText('Clinical emergency active')).toBeInTheDocument()
    expect(screen.getByText('UNTRUSTED SIGNAL')).toBeInTheDocument()
    expect(screen.getAllByText('Device isolated').length).toBeGreaterThan(0)
    expect(screen.getByText(/Updated|NO DATA|Connection lost/)).toBeInTheDocument()
  })

  it('opens a focused tile with Enter and records its focus-return target', async () => {
    const user = userEvent.setup()
    let opened = ''
    render(<MemoryRouter><WardGrid beds={BED_FIXTURES.slice(0, 2)} onOpenBed={(id) => { opened = id }} /></MemoryRouter>)
    const firstTile = screen.getAllByRole('link')[0]
    firstTile.focus()
    await user.keyboard('{Enter}')
    expect(opened).toBe('B01')
    expect(sessionStorage.getItem('ward-focus-return')).toBe('B01')
  })

  it('has no detectable structural axe violations on the alerts route', async () => {
    await useSessionStore.getState().signIn('nurse')
    const { container } = render(<MemoryRouter initialEntries={['/alerts']}><App /></MemoryRouter>)
    await screen.findByRole('heading', { level: 1, name: 'Alerts and escalation' })
    await expectNoAxeViolations(container)
  })
})
