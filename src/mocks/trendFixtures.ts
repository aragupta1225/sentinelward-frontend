import type { Bed } from '../domain/ward'

export interface BedTrendData { timestamps: number[]; heartRate: number[]; spo2: number[] }

export function createThirtyMinuteTrend(bed: Bed, now = Date.now()): BedTrendData {
  const timestamps: number[] = []
  const heartRate: number[] = []
  const spo2: number[] = []
  const baselineHr = bed.readings.heartRate ?? 75
  const baselineSpo2 = bed.readings.spo2 ?? 97
  const seed = Number(bed.id.replace(/\D/g, '')) || 1

  for (let minute = 30; minute >= 0; minute -= 1) {
    const index = 30 - minute
    timestamps.push(Math.floor((now - minute * 60_000) / 1000))
    heartRate.push(Math.round(baselineHr + Math.sin((index + seed) / 3) * 3))
    spo2.push(Number((baselineSpo2 + Math.sin((index + seed) / 5) * 0.6).toFixed(1)))
  }
  return { timestamps, heartRate, spo2 }
}
