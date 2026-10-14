import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { configurePublicAdapter } from '../../adapters/publicGateway'
import { MockPublicAdapter } from '../../adapters/publicAdapters'
import { resetSessionStore, useSessionStore } from '../../store/sessionStore'
import { LandingPage, LoginPage } from './PublicPages'

describe('S0 and S1 public workflows', () => {
  beforeEach(() => resetSessionStore())
  afterEach(cleanup)

  it('keeps a four-bed still preview visible when the live preview fails', async () => {
    const user = userEvent.setup()
    configurePublicAdapter({ createSession: async () => { throw new Error('offline') }, getWardPreview: async () => { throw new Error('offline') } })
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(await screen.findByText('Preview unavailable')).toBeInTheDocument()
    expect(container.querySelectorAll('.landing-bed')).toHaveLength(4)
    expect(container.querySelectorAll('.landing-bed--high')).toHaveLength(1)
    expect(container.querySelectorAll('.landing-bed__signal path')).toHaveLength(8)
    expect(container.querySelectorAll('.tilted-card')).toHaveLength(3)
    expect(container.querySelectorAll('[data-scroll-reveal]')).toHaveLength(5)
    expect(container.querySelectorAll('[data-scroll-reveal].is-visible')).toHaveLength(5)
    expect(document.documentElement).toHaveClass('landing-smooth-scroll')
    expect(container.querySelector('#signal-model')).toBeInTheDocument()
    expect(container.querySelector('#safety')).toBeInTheDocument()
    expect(container.querySelector('#roles')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'SentinelWard separates what looks the same.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Doubtful data never makes the ward go dark.' })).toBeInTheDocument()
    expect(container.querySelectorAll('.landing-safety-card')).toHaveLength(4)
    const preserveAlarm = screen.getByRole('button', { name: /Preserve the alarm/ })
    expect(screen.getByRole('button', { name: /See the patient/ })).toHaveAttribute('aria-pressed', 'false')
    await user.click(preserveAlarm)
    expect(preserveAlarm).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /See the patient/ })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('heading', { name: 'Doubtful data never makes the ward go dark.' }))
    expect(preserveAlarm).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('One bed high alarm shared across five SentinelWard roles')).toHaveTextContent('Bed · High alarm')
    expect(screen.getByLabelText('One bed high alarm shared across five SentinelWard roles').querySelectorAll('.landing-network-role')).toHaveLength(5)
  })

  it('shows an inline failure and retries the same chosen role', async () => {
    const user = userEvent.setup()
    configurePublicAdapter({ createSession: async () => { throw new Error('offline') }, getWardPreview: async () => [] })
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Back to SentinelWard home' })).toHaveAttribute('href', '/')
    await user.click(screen.getByRole('button', { name: /^Doctor \/ tele-ICU/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/retry/i)
    configurePublicAdapter(new MockPublicAdapter())
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(useSessionStore.getState()).toEqual(expect.objectContaining({ authenticated: true, displayName: 'Antara Gupta' })))
  })
})
