import type { Bed } from '../domain/ward'

export interface WardSnapshot { beds: Bed[]; receivedAt: number }

export type WardEvent =
  | { type: 'bed.updated'; bed: Bed }
  | { type: 'connection.changed'; state: Bed['connection']; occurredAt: number }

export interface WardRestAdapter {
  getWard(signal?: AbortSignal): Promise<WardSnapshot>
}

export interface WardEventSource {
  connect(): void
  disconnect(): void
  subscribe(listener: (event: WardEvent) => void): () => void
}
