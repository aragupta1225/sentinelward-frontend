import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { configureCommandAdapter } from './adapters/commandGateway'
import { MockCommandAdapter } from './adapters/mockCommandAdapter'
import { resetBedDetailStore } from './store/bedDetailStore'
import { useSessionStore } from './store/sessionStore'

describe('Bed Detail explanation and manual check', () => {
  beforeEach(() => {
    configureCommandAdapter(new MockCommandAdapter())
    resetBedDetailStore()
    useSessionStore.getState().signIn('nurse')
  })

  afterEach(cleanup)

  it('shows three reasons, six checks, two witnesses, and the untrusted-value boundary', async () => {
    render(<MemoryRouter initialEntries={['/bed/B07']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Monitor cannot be trusted' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Top three reasons' })).toBeInTheDocument()
    expect(screen.getAllByRole('progressbar')).toHaveLength(6)
    expect(screen.getByRole('heading', { name: 'Two witnesses' })).toBeInTheDocument()
    expect(screen.getByText('incoming (not trusted)')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /LAST TRUSTED/ })).toBeInTheDocument()
  })

  it('records a manual hand check without treating it as trusted live telemetry', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/bed/B07']}><App /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Check pulse and breathing by hand' })
    await user.type(screen.getByLabelText('Heart rate'), '82')
    await user.type(screen.getByLabelText('SpO₂ by portable device'), '97')
    await user.type(screen.getByLabelText('Notes'), 'Pulse regular')
    await user.click(screen.getByRole('button', { name: 'Record hand check' }))
    expect(await screen.findByText(/Latest: HR 82, SpO₂ 97/)).toBeInTheDocument()
    expect(screen.getByText('incoming (not trusted)')).toBeInTheDocument()
  })
})
