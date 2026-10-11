import type { Bed } from './ward'

export type ScenarioId = 'full_ward_script' | 'emergency' | 'loose_sensor' | 'drifting' | 'replay_attack' | 'fake_flatline' | 'flood'
export type ScenarioSpeed = 1 | 2 | 5

export interface ScenarioStep {
  atSecond: number
  label: string
  kind: 'bed_update' | 'event'
  bedId?: string
  patch?: Partial<Bed>
}

export interface DemoScenario {
  id: ScenarioId
  title: string
  targetBedId: string | null
  durationSeconds: number
  steps: readonly ScenarioStep[]
}
