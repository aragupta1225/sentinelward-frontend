import type { Bed } from './ward'

export interface WardSummary {
  totalBeds: number
  activeAlarms: number
  untrustedBeds: number
  stoppedAlarmsToday: number
  averageTrust: number
}

export function getWardSummary(beds: readonly Bed[]): WardSummary {
  if (beds.length === 0) {
    return { totalBeds: 0, activeAlarms: 0, untrustedBeds: 0, stoppedAlarmsToday: 37, averageTrust: 0 }
  }

  return {
    totalBeds: beds.length,
    activeAlarms: beds.filter((bed) => bed.priority !== 'none').length,
    untrustedBeds: beds.filter((bed) => bed.trustState === 'untrusted').length,
    stoppedAlarmsToday: 37,
    averageTrust: Math.round(beds.reduce((total, bed) => total + bed.trust, 0) / beds.length),
  }
}
