import type { WardEvent, WardEventSource, WardRestAdapter } from '../adapters/contracts'
import type { Bed } from '../domain/ward'
import { BED_FIXTURES } from './fixtures'
import { createWaveform } from './waveforms'

export class MockWardRestAdapter implements WardRestAdapter {
  async getWard() {
    return { beds: structuredClone([...BED_FIXTURES]), receivedAt: Date.now() }
  }
}

export class MockWardEventSource implements WardEventSource {
  private listeners = new Set<(event: WardEvent) => void>()
  private timer: ReturnType<typeof setInterval> | null = null
  private selectedBed: Bed
  private connectionState: Bed['connection']
  private tick = 0

  constructor(initialBed: Bed) {
    this.selectedBed = structuredClone(initialBed)
    this.connectionState = initialBed.connection
  }

  setBed(bed: Bed) {
    this.selectedBed = { ...structuredClone(bed), connection: this.connectionState }
    this.tick = 0
    this.emit({ type: 'bed.updated', bed: structuredClone(this.selectedBed) })
  }

  connect() {
    if (this.timer) return
    this.connectionState = 'live'
    this.selectedBed = { ...this.selectedBed, connection: 'live' }
    this.emit({ type: 'connection.changed', state: 'live', occurredAt: Date.now() })
    this.timer = setInterval(() => {
      if (this.selectedBed.occupancy !== 'occupied' || this.selectedBed.connection !== 'live' || this.selectedBed.id === 'B10') return
      this.tick += 1
      const heartRate = this.selectedBed.readings.heartRate
      const updated: Bed = {
        ...this.selectedBed,
        readings: { ...this.selectedBed.readings, heartRate: heartRate === null ? null : heartRate + (this.tick % 2 === 0 ? 1 : -1) },
        waveform: createWaveform(this.tick),
        lastUpdatedAt: Date.now(),
      }
      if (updated.trustState === 'trusted') {
        updated.trustedSnapshot = { readings: updated.readings, waveform: updated.waveform, capturedAt: updated.lastUpdatedAt as number }
      }
      this.selectedBed = updated
      this.emit({ type: 'bed.updated', bed: structuredClone(updated) })
    }, 1000)
  }

  disconnect() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.connectionState = 'disconnected'
    this.selectedBed = { ...this.selectedBed, connection: 'disconnected' }
    this.emit({ type: 'connection.changed', state: 'disconnected', occurredAt: Date.now() })
  }

  subscribe(listener: (event: WardEvent) => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private emit(event: WardEvent) { this.listeners.forEach((listener) => listener(event)) }
}
