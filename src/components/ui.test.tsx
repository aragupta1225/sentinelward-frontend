import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActionButton, EmptyState, PageHeader, Panel, StatusChip } from './ui'

afterEach(cleanup)

describe('shared UI primitives', () => {
  it('associates page hierarchy with optional context and actions', () => {
    render(<PageHeader eyebrow="S6" title="Security operations" description="Device integrity incidents." actions={<button>Review</button>} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Security operations' })).toBeInTheDocument()
    expect(screen.getByText('Device integrity incidents.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument()
  })

  it('renders textual status independently of the decorative dot', () => {
    const { container } = render(<StatusChip tone="critical" dot>Disconnected</StatusChip>)
    expect(screen.getByText('Disconnected')).toHaveClass('ui-status-chip--critical')
    expect(container.querySelector('i')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps actions as native buttons with safe default type', () => {
    const onClick = vi.fn()
    render(<ActionButton tone="primary" onClick={onClick}>Acknowledge</ActionButton>)
    const button = screen.getByRole('button', { name: 'Acknowledge' })
    expect(button).toHaveAttribute('type', 'button')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('preserves requested panel semantics and explicit empty-state copy', () => {
    render(<><Panel as="article">Evidence</Panel><EmptyState>No actions recorded.</EmptyState></>)
    expect(screen.getByRole('article')).toHaveTextContent('Evidence')
    expect(screen.getByText('No actions recorded.')).toHaveClass('ui-empty-state')
  })
})
