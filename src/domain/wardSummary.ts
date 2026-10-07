import type { Bed } from './ward'

export interface WardSummary {
  totalBeds: number
  activeAlarms: number
  untrustedBeds: number
  isolatedBeds: number
  averageTrust: number
}

export function getWardSummary(beds: readonly Bed[]): WardSummary {
  if (beds.length === 0) {
    return { totalBeds: 0, activeAlarms: 0, untrustedBeds: 0, isolatedBeds: 0, averageTrust: 0 }
  }

  return {
    totalBeds: beds.length,
    activeAlarms: beds.filter((bed) => bed.priority !== 'none').length,
    untrustedBeds: beds.filter((bed) => bed.trustState === 'untrusted').length,
    isolatedBeds: beds.filter((bed) => bed.isolated).length,
    averageTrust: Math.round(beds.reduce((total, bed) => total + bed.trust, 0) / beds.length),
  }
}
