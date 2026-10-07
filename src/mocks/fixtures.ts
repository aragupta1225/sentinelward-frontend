import { mapRawBed, type RawBedPayload } from '../adapters/mappers'
import type { Bed } from '../domain/ward'
import { createWaveform } from './waveforms'

const now = Date.now()

function payload(overrides: Partial<RawBedPayload> & Pick<RawBedPayload, 'bed_id' | 'verdict'>): RawBedPayload {
  const numericId = Number(overrides.bed_id.replace(/\D/g, '')) || 1
  return {
    patient: { initials: 'AK', age: 64, name: 'A. Kumar' },
    occupancy: 'occupied',
    trust_score: 96,
    is_trusted: true,
    connected: true,
    isolated: false,
    reason: 'Vitals within configured range',
    requested_action: 'Continue routine monitoring',
    acknowledged: false,
    last_updated_at: now,
    vitals: { hr: 76, spo2: 98, systolic: 122, diastolic: 78 },
    waveform: createWaveform(numericId),
    ...overrides,
  }
}

function lastTrusted(seed: number, capturedAt = now - 4000) {
  return {
    captured_at: capturedAt,
    vitals: { hr: 78, spo2: 97, systolic: 120, diastolic: 76 },
    waveform: createWaveform(seed),
  }
}

export const BED_FIXTURES: readonly Bed[] = [
  mapRawBed(payload({ bed_id: 'B01', verdict: 'NORMAL' })),
  mapRawBed(payload({ bed_id: 'B02', verdict: 'NORMAL', patient: { initials: 'RM', age: 51, name: 'R. Mehta' }, trust_score: 92 })),
  mapRawBed(payload({ bed_id: 'B03', verdict: 'EMERGENCY', patient: { initials: 'NS', age: 72, name: 'N. Singh' }, reason: 'HR 148 and SpO₂ falling', requested_action: 'Urgent bedside assessment', vitals: { hr: 148, spo2: 86, systolic: 94, diastolic: 60 } })),
  mapRawBed(payload({ bed_id: 'B04', verdict: 'LOOSE_SENSOR', patient: { initials: 'PJ', age: 45, name: 'P. Jain' }, trust_score: 68, reason: 'Intermittent ECG contact', requested_action: 'Reseat ECG leads' })),
  mapRawBed(payload({ bed_id: 'B05', verdict: 'DRIFTING', patient: { initials: 'VD', age: 58, name: 'V. Das' }, trust_score: 61, reason: 'SpO₂ baseline is drifting', requested_action: 'Verify sensor placement' })),
  mapRawBed(payload({ bed_id: 'B06', verdict: 'UNSURE', patient: { initials: 'SA', age: 69, name: 'S. Ali' }, trust_score: 54, reason: 'Signals disagree across sensors', requested_action: 'Confirm patient state at bedside' })),
  mapRawBed(payload({ bed_id: 'B07', verdict: 'TAMPERING', patient: { initials: 'MT', age: 63, name: 'M. Thomas' }, trust_score: 22, is_trusted: false, reason: 'Flatline conflicts with pulse signal', requested_action: 'Verify patient and device at bedside', last_trusted: lastTrusted(7) })),
  mapRawBed(payload({ bed_id: 'B08', verdict: 'BOTH', patient: { initials: 'GK', age: 77, name: 'G. Kaur' }, trust_score: 12, is_trusted: false, isolated: true, reason: 'Clinical emergency with device compromise', requested_action: 'Attend patient; use trusted bedside equipment', vitals: { hr: 139, spo2: 84, systolic: 88, diastolic: 56 }, last_trusted: lastTrusted(8) })),
  mapRawBed(payload({ bed_id: 'B09', verdict: 'DEVICE_ATTACK', patient: { initials: 'AB', age: 60, name: 'A. Bose' }, trust_score: 9, is_trusted: false, isolated: true, reason: 'Malicious device traffic detected', requested_action: 'Verify readings using trusted equipment', last_trusted: lastTrusted(9) })),
  mapRawBed(payload({ bed_id: 'B10', verdict: 'NORMAL', patient: { initials: 'KC', age: 55, name: 'K. Chopra' }, last_updated_at: now - 12_000, reason: 'Data stream delayed', requested_action: 'Check device connection' })),
  mapRawBed(payload({ bed_id: 'B11', verdict: 'NORMAL', occupancy: 'loading', patient: null, connected: false, last_updated_at: null, vitals: null, waveform: null, trust_score: 0, reason: 'Waiting for initial ward data', requested_action: 'No action required' })),
  mapRawBed(payload({ bed_id: 'B12', verdict: 'NORMAL', occupancy: 'unassigned', patient: null, last_updated_at: now, vitals: null, waveform: null, trust_score: 100, reason: 'Bed available', requested_action: 'No action required' })),
]

export function getFixture(id: string): Bed {
  return structuredClone(BED_FIXTURES.find((bed) => bed.id === id) ?? BED_FIXTURES[0])
}
