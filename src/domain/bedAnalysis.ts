import type { Bed, Verdict } from './ward'

export interface AnalysisScore {
  id: 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6'
  label: string
  value: number
}

export interface AnalysisWitness {
  kind: 'BODY' | 'NETWORK'
  summary: string
  supportsVerdict: boolean
}

export interface BedAnalysis {
  headline: string
  confidence: number
  reasons: readonly [string, string, string]
  scores: readonly AnalysisScore[]
  witnesses: readonly [AnalysisWitness, AnalysisWitness]
}

const headline: Record<Verdict, string> = {
  NORMAL: 'Signals look normal', EMERGENCY: 'Real emergency', BOTH: 'Emergency and device threat',
  TAMPERING: 'Monitor cannot be trusted', UNSURE: 'Readings are unclear', DRIFTING: 'Sensor is drifting',
  LOOSE_SENSOR: 'Sensor contact is loose', DEVICE_ATTACK: 'Device attack evidence',
}

const scoreProfiles: Record<Verdict, readonly [number, number, number, number, number, number]> = {
  NORMAL: [0.96, 0.08, 0.94, 0.99, 0.98, 0.97],
  EMERGENCY: [0.88, 0.95, 0.90, 0.99, 0.97, 0.91],
  BOTH: [0.44, 0.92, 0.89, 0.12, 0.18, 0.84],
  TAMPERING: [0.72, 0.21, 0.18, 0.08, 0.34, 0.82],
  UNSURE: [0.52, 0.49, 0.43, 0.77, 0.80, 0.69],
  DRIFTING: [0.63, 0.27, 0.61, 0.98, 0.96, 0.14],
  LOOSE_SENSOR: [0.18, 0.15, 0.32, 0.99, 0.97, 0.88],
  DEVICE_ATTACK: [0.62, 0.17, 0.30, 0.06, 0.11, 0.90],
}

const verdictConfidence: Record<Verdict, number> = {
  NORMAL: 0.96, EMERGENCY: 0.93, BOTH: 0.96, TAMPERING: 0.94,
  UNSURE: 0.58, DRIFTING: 0.89, LOOSE_SENSOR: 0.92, DEVICE_ATTACK: 0.97,
}

function topReasons(bed: Bed): BedAnalysis['reasons'] {
  if (bed.verdict === 'EMERGENCY') return [
    'Heart rate, pulse and blood pressure worsen together',
    'Oxygen saturation is falling with the heart-rate rise',
    'Network timing and sender identity are normal',
  ]
  if (bed.verdict === 'BOTH') return [
    'Body signals agree that the patient may be deteriorating',
    'Incoming monitor data also shows replay-like timing',
    'Clinical escalation stays active even while the device is untrusted',
  ]
  if (bed.verdict === 'TAMPERING' || bed.verdict === 'DEVICE_ATTACK') return [
    'ECG behavior conflicts with the pulse signal and recent patient pattern',
    'Packet timing resembles an older trusted window',
    'Use bedside observation and a portable monitor for clinical decisions',
  ]
  if (bed.verdict === 'DRIFTING') return [
    'The current baseline has moved away from the recent stable range',
    'Other body signals do not show the same change',
    'Network timing and sender identity remain normal',
  ]
  if (bed.verdict === 'LOOSE_SENSOR') return [
    'Signal contact drops intermittently',
    'Other available body signals remain stable',
    'Network timing and sender identity remain normal',
  ]
  if (bed.verdict === 'UNSURE') return [
    'Available body signals do not agree strongly enough',
    'The monitor data is too ambiguous for a safe automatic conclusion',
    'A bedside check is needed to decide the next action',
  ]
  return [
    'Body signals remain inside the configured range',
    'Independent pulse and pressure patterns agree',
    'Network timing, sender identity and freshness are normal',
  ]
}

export function createMockBedAnalysis(bed: Bed): BedAnalysis {
  const values = scoreProfiles[bed.verdict]
  return {
    headline: headline[bed.verdict],
    confidence: verdictConfidence[bed.verdict],
    reasons: topReasons(bed),
    scores: [
      { id: 'M1', label: 'Sensor OK', value: values[0] },
      { id: 'M2', label: 'Real alarm', value: values[1] },
      { id: 'M3', label: 'Body agrees', value: values[2] },
      { id: 'M4', label: 'Not a replay', value: values[3] },
      { id: 'M5', label: 'Network OK', value: values[4] },
      { id: 'M6', label: 'No drift', value: values[5] },
    ],
    witnesses: [
      { kind: 'BODY', summary: bed.trustState === 'trusted' ? 'Beat→pulse delay 212 ms (usual 205±15)' : 'Body signals disagree; verify pulse and breathing by hand', supportsVerdict: true },
      { kind: 'NETWORK', summary: bed.trustState === 'trusted' ? '1 msg/s · sender verified · fresh' : 'Timing or freshness is abnormal; incoming values are untrusted', supportsVerdict: true },
    ],
  }
}
