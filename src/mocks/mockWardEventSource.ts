import type { WardEvent, WardEventSource } from '../adapters/contracts'
import type { Bed } from '../domain/ward'
import { createWaveform } from './waveforms'

export class MockWardGridEventSource implements WardEventSource {
  private listeners = new Set<(event: WardEvent) => void>()
  private beds: Bed[]
  private timer: ReturnType<typeof setInterval> | null = null
  private tick = 0

  constructor(initialBeds: readonly Bed[]) {
    this.beds = structuredClone([...initialBeds])
  }

  connect() {
    if (this.timer) return
    this.emit({ type: 'connection.changed', state: 'live', occurredAt: Date.now() })
    this.timer = setInterval(() => {
      this.tick += 1
      this.beds = this.beds.map((bed, index) => {
        if (bed.occupancy !== 'occupied' || bed.id === 'B10') return bed
        const heartRate = bed.readings.heartRate
        const nextBed: Bed = {
          ...bed,
          connection: 'live',
          readings: {
            ...bed.readings,
            heartRate: heartRate === null ? null : heartRate + (this.tick % 2 === 0 ? 1 : -1),
          },
          waveform: createWaveform(index + this.tick),
          lastUpdatedAt: Date.now(),
        }
        if (nextBed.trustState === 'trusted') {
          nextBed.trustedSnapshot = {
            readings: nextBed.readings,
            waveform: nextBed.waveform,
            capturedAt: nextBed.lastUpdatedAt as number,
          }
        }
        this.emit({ type: 'bed.updated', bed: structuredClone(nextBed) })
        return nextBed
      })
    }, 1000)
  }

  disconnect() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.beds = this.beds.map((bed) => ({ ...bed, connection: 'disconnected' }))
    this.emit({ type: 'connection.changed', state: 'disconnected', occurredAt: Date.now() })
  }

  subscribe(listener: (event: WardEvent) => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private emit(event: WardEvent) {
    this.listeners.forEach((listener) => listener(event))
  }
}
