import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { VERDICTS } from '../domain/ward'
import { getFixture } from '../mocks/fixtures'
import { BedTile } from './BedTile'

afterEach(cleanup)

describe('BedTile', () => {
  it.each(VERDICTS)('renders the %s verdict with a textual label', (verdict) => {
    const bed = { ...getFixture('B01'), verdict }
    render(<BedTile bed={bed} now={bed.lastUpdatedAt ?? Date.now()} />)
    expect(screen.getByText('Verdict')).toBeInTheDocument()
    expect(screen.getByTestId('bed-tile')).toHaveAccessibleName()
  })

  it('shows the emergency and device isolation simultaneously for BOTH', () => {
    const bed = getFixture('B08')
    render(<BedTile bed={bed} now={bed.lastUpdatedAt ?? Date.now()} />)
    expect(screen.getByText('Clinical emergency active')).toBeInTheDocument()
    expect(screen.getAllByText('Device isolated').length).toBeGreaterThan(0)
    expect(screen.getByText('Emergency + device threat')).toBeInTheDocument()
  })

  it('retains last readings and reports age for an untrusted bed', () => {
    const bed = getFixture('B07')
    const now = (bed.lastUpdatedAt ?? Date.now()) + 5000
    const trustedAge = Math.floor((now - (bed.trustedSnapshot?.capturedAt ?? now)) / 1000)
    render(<BedTile bed={bed} now={now} />)
    expect(screen.getByText(/Showing last trusted readings/)).toHaveTextContent(`${trustedAge} s ago`)
    expect(screen.getByText('NO DATA · 5 s')).toBeInTheDocument()
  })

  it('never leaves a loading or unassigned patient blank', () => {
    const { rerender } = render(<BedTile bed={getFixture('B11')} now={Date.now()} />)
    expect(screen.getByText(/Patient data loading/)).toBeInTheDocument()
    rerender(<BedTile bed={getFixture('B12')} now={Date.now()} />)
    expect(screen.getByText(/Unassigned bed/)).toBeInTheDocument()
  })
})
