import { z } from 'zod'
import type { WardEvent } from './contracts'
import { mapRawBed } from './mappers'

// Provisional envelope isolated here until Aditya Singh confirms the final contract.
const envelopeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bed.updated'), payload: z.unknown() }),
  z.object({
    type: z.literal('connection.changed'),
    payload: z.object({ state: z.enum(['connecting', 'live', 'disconnected']), occurred_at: z.number().optional() }),
  }),
])

export function decodeWardMessage(raw: string): WardEvent | null {
  try {
    const envelope = envelopeSchema.parse(JSON.parse(raw))
    if (envelope.type === 'bed.updated') return { type: 'bed.updated', bed: mapRawBed(envelope.payload) }
    return { type: 'connection.changed', state: envelope.payload.state, occurredAt: envelope.payload.occurred_at ?? Date.now() }
  } catch {
    return null
  }
}
