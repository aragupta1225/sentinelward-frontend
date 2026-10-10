import type { AlarmPriority, Bed } from '../../domain/ward'

const priorityOrder: Record<AlarmPriority, number> = { high: 0, medium: 1, low: 2, none: 3 }

export function sortCensusBeds(beds: Bed[]) {
  return [...beds].sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority] || left.trust - right.trust || left.id.localeCompare(right.id))
}
