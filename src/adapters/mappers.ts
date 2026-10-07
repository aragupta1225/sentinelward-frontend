import { z } from 'zod'
import {
  EMPTY_READINGS, EMPTY_WAVEFORM, SAFE_PATIENT_FALLBACK,
  VERDICT_PRESENTATION, VERDICTS, type Bed,
} from '../domain/ward'

const rawBedSchema = z.object({
  bed_id: z.string(),
  patient: z.object({
    initials: z.string().min(1), age: z.number().int().nonnegative().nullable(),
    name: z.string().min(1).optional(),
  }).nullish(),
  occupancy: z.enum(['occupied', 'unassigned', 'loading']).default('occupied'),
  verdict: z.enum(VERDICTS),
  priority: z.enum(['none', 'low', 'medium', 'high']).optional(),
  trust_score: z.number().min(0).max(100),
  is_trusted: z.boolean(),
  connected: z.boolean(),
  isolated: z.boolean().default(false),
  reason: z.string().default('No reason supplied'),
  requested_action: z.string().default('Continue monitoring'),
  acknowledged: z.boolean().default(false),
  last_updated_at: z.number().nullable(),
  vitals: z.object({
    hr: z.number().nullable(), spo2: z.number().nullable(),
    systolic: z.number().nullable(), diastolic: z.number().nullable(),
  }).nullable(),
  waveform: z.object({ ecg: z.array(z.number()), ppg: z.array(z.number()) }).nullable(),
  last_trusted: z.object({
    captured_at: z.number(),
    vitals: z.object({
      hr: z.number().nullable(), spo2: z.number().nullable(),
      systolic: z.number().nullable(), diastolic: z.number().nullable(),
    }),
    waveform: z.object({ ecg: z.array(z.number()), ppg: z.array(z.number()) }),
  }).nullable().optional(),
})

export type RawBedPayload = z.input<typeof rawBedSchema>

export function mapRawBed(raw: unknown): Bed {
  const payload = rawBedSchema.parse(raw)
  const patient = payload.patient ? {
    initials: payload.patient.initials,
    age: payload.patient.age,
    displayName: payload.patient.name ?? payload.patient.initials,
  } : SAFE_PATIENT_FALLBACK
  const readings = payload.vitals ? {
    heartRate: payload.vitals.hr, spo2: payload.vitals.spo2,
    systolic: payload.vitals.systolic, diastolic: payload.vitals.diastolic,
  } : EMPTY_READINGS
  const waveform = payload.waveform ?? EMPTY_WAVEFORM

  return {
    id: payload.bed_id,
    label: `Bed ${payload.bed_id.replace(/^B0?/, '')}`,
    occupancy: payload.occupancy,
    patient,
    verdict: payload.verdict,
    priority: payload.priority ?? VERDICT_PRESENTATION[payload.verdict].priority,
    trust: payload.trust_score,
    trustState: payload.is_trusted ? 'trusted' : 'untrusted',
    connection: payload.connected ? 'live' : 'disconnected',
    isolated: payload.isolated,
    reason: payload.reason,
    requestedAction: payload.requested_action,
    acknowledgement: payload.acknowledged ? 'acknowledged' : 'none',
    readings,
    waveform,
    lastUpdatedAt: payload.last_updated_at,
    trustedSnapshot: payload.last_trusted ? {
      capturedAt: payload.last_trusted.captured_at,
      readings: {
        heartRate: payload.last_trusted.vitals.hr,
        spo2: payload.last_trusted.vitals.spo2,
        systolic: payload.last_trusted.vitals.systolic,
        diastolic: payload.last_trusted.vitals.diastolic,
      },
      waveform: payload.last_trusted.waveform,
    } : null,
  }
}
