import type { WaveformData } from '../domain/ward'

function gaussian(value: number, center: number, width: number) {
  const distance = (value - center) / width
  return Math.exp(-(distance * distance))
}

export function createWaveform(seed = 0, points = 180): WaveformData {
  const ecg: number[] = []
  const ppg: number[] = []
  for (let index = 0; index < points; index += 1) {
    const cycle = ((index + seed * 7) % 36) / 36
    const baseline = Math.sin(index * 0.18 + seed) * 0.025
    const qrs = -0.16 * gaussian(cycle, 0.28, 0.028)
      + 1.05 * gaussian(cycle, 0.34, 0.022)
      - 0.28 * gaussian(cycle, 0.39, 0.03)
    ecg.push(baseline + qrs + 0.18 * gaussian(cycle, 0.64, 0.11))
    ppg.push(0.08 + 0.75 * gaussian(cycle, 0.42, 0.18) + 0.1 * gaussian(cycle, 0.72, 0.07))
  }
  return { ecg, ppg }
}
