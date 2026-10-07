export const VERDICTS = [
  'NORMAL', 'EMERGENCY', 'BOTH', 'TAMPERING',
  'UNSURE', 'DRIFTING', 'LOOSE_SENSOR', 'DEVICE_ATTACK',
] as const

export type Verdict = (typeof VERDICTS)[number]
export type AlarmPriority = 'none' | 'low' | 'medium' | 'high'
export type ConnectionState = 'connecting' | 'live' | 'disconnected'
export type TrustState = 'trusted' | 'untrusted'
export type OccupancyState = 'occupied' | 'unassigned' | 'loading'

export interface PatientIdentity {
  initials: string
  age: number | null
  displayName: string
}

export interface VitalReadings {
  heartRate: number | null
  spo2: number | null
  systolic: number | null
  diastolic: number | null
}

export interface WaveformData { ecg: number[]; ppg: number[] }

export interface TrustedSnapshot {
  readings: VitalReadings
  waveform: WaveformData
  capturedAt: number
}

export interface Bed {
  id: string
  label: string
  occupancy: OccupancyState
  patient: PatientIdentity
  priority: AlarmPriority
  verdict: Verdict
  trust: number
  trustState: TrustState
  connection: ConnectionState
  isolated: boolean
  reason: string
  requestedAction: string
  acknowledgement: 'none' | 'pending' | 'acknowledged'
  readings: VitalReadings
  waveform: WaveformData
  lastUpdatedAt: number | null
  trustedSnapshot: TrustedSnapshot | null
}

export interface VerdictPresentation {
  label: string
  priority: AlarmPriority
  icon: string
}

export const VERDICT_PRESENTATION: Record<Verdict, VerdictPresentation> = {
  NORMAL: { label: 'Normal', priority: 'none', icon: '✓' },
  EMERGENCY: { label: 'Clinical emergency', priority: 'high', icon: '!' },
  BOTH: { label: 'Emergency + device threat', priority: 'high', icon: '!' },
  TAMPERING: { label: 'Possible tampering', priority: 'medium', icon: '⌁' },
  UNSURE: { label: 'Assessment unsure', priority: 'medium', icon: '?' },
  DRIFTING: { label: 'Sensor drifting', priority: 'medium', icon: '↗' },
  LOOSE_SENSOR: { label: 'Loose sensor', priority: 'medium', icon: '◇' },
  DEVICE_ATTACK: { label: 'Device attack', priority: 'high', icon: '⊘' },
}

export const SAFE_PATIENT_FALLBACK: PatientIdentity = {
  initials: '—', age: null, displayName: 'Patient identity unavailable',
}

export const EMPTY_READINGS: VitalReadings = {
  heartRate: null, spo2: null, systolic: null, diastolic: null,
}

export const EMPTY_WAVEFORM: WaveformData = { ecg: [], ppg: [] }
