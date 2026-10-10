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
    configurePublicAdapter({ createSession: async () => { throw new Error('offline') }, getWardPreview: async () => { throw new Error('offline') } })
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(await screen.findByText('Live demo offline')).toBeInTheDocument()
    expect(container.querySelectorAll('.landing-bed')).toHaveLength(4)
    expect(container.querySelectorAll('.landing-bed--high')).toHaveLength(1)
  })

  it('shows an inline failure and retries the same chosen role', async () => {
    const user = userEvent.setup()
    configurePublicAdapter({ createSession: async () => { throw new Error('offline') }, getWardPreview: async () => [] })
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /^Doctor \/ tele-ICU/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/retry/i)
    configurePublicAdapter(new MockPublicAdapter())
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(useSessionStore.getState()).toEqual(expect.objectContaining({ authenticated: true, displayName: 'Antara Gupta' })))
  })
})
