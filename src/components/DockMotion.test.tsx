import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DockMotion } from './DockMotion'

const originalMatchMedia = window.matchMedia

afterEach(() => {
  cleanup()
  window.matchMedia = originalMatchMedia
})

describe('DockMotion', () => {
  it('marks buttons and action links for dock proximity motion on fine pointers', async () => {
    window.matchMedia = vi.fn((query: string) => ({
      matches: query.includes('hover: hover'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { getByRole } = render(<><DockMotion /><button type="button">Save</button><a className="button-link" href="/report">Report</a></>)

    await waitFor(() => expect(getByRole('button', { name: 'Save' })).toHaveAttribute('data-dock-motion'))
    expect(getByRole('link', { name: 'Report' })).toHaveAttribute('data-dock-motion')
  })
})
