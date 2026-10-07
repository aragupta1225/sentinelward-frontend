import type { Bed } from './ward'

export type ScenarioId = 'emergency' | 'loose_sensor' | 'drifting' | 'tampering' | 'both' | 'connection_loss'

export interface ScenarioStep {
  atSecond: number
  label: string
  kind: 'bed_update' | 'connection'
  patch?: Partial<Bed>
  connection?: 'live' | 'disconnected'
}

export interface DemoScenario {
  id: ScenarioId
  title: string
  targetBedId: string | null
  durationSeconds: number
  steps: readonly ScenarioStep[]
}
