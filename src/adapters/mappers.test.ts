import { describe, expect, it } from 'vitest'
import { mapRawBed } from './mappers'

describe('mapRawBed', () => {
  it('supplies a visible patient fallback when identity is absent', () => {
    const bed = mapRawBed({ bed_id: 'B12', patient: null, occupancy: 'unassigned', verdict: 'NORMAL', trust_score: 100, is_trusted: true, connected: true, last_updated_at: Date.now(), vitals: null, waveform: null })
    expect(bed.patient.displayName).toBe('Patient identity unavailable')
    expect(bed.readings.heartRate).toBeNull()
    expect(bed.waveform.ecg).toEqual([])
  })

  it('rejects an unknown backend verdict before it reaches a component', () => {
    expect(() => mapRawBed({ bed_id: 'B01', verdict: 'UNKNOWN', trust_score: 50, is_trusted: true, connected: true, last_updated_at: Date.now(), vitals: null, waveform: null })).toThrow()
  })
})
