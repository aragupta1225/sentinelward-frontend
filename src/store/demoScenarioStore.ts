import { create } from 'zustand'
import type { ScenarioId } from '../domain/scenarios'
import { BED_FIXTURES } from '../mocks/fixtures'
import { createScenarioBaseline, DEMO_SCENARIOS } from '../mocks/scenarios'
import { useWardDashboardStore, type WardActivity } from './wardDashboardStore'

interface ScenarioTimelineEntry { id: string; atSecond: number; label: string }
interface DemoScenarioState {
  activeScenarioId: ScenarioId | null
  status: 'idle' | 'running' | 'completed'
  elapsedSeconds: number
  timeline: ScenarioTimelineEntry[]
  timer: ReturnType<typeof setInterval> | null
  startScenario: (id: ScenarioId) => void
  advanceOneSecond: () => void
  reset: () => void
}

let eventSequence = 0

function logWardEvent(bedId: string | null, label: string, priority: 'none' | 'medium' | 'high' = 'none') {
  eventSequence += 1
  const entry: WardActivity = { id: `scenario-${eventSequence}`, bedId, kind: 'system', priority, message: label, occurredAt: Date.now() }
  useWardDashboardStore.setState((ward) => ({ activities: [entry, ...ward.activities].slice(0, 30) }))
}

export const useDemoScenarioStore = create<DemoScenarioState>((set, get) => ({
  activeScenarioId: null, status: 'idle', elapsedSeconds: 0, timeline: [], timer: null,
  startScenario: (id) => {
    if (get().timer) clearInterval(get().timer as ReturnType<typeof setInterval>)
    const scenario = DEMO_SCENARIOS[id]
    if (scenario.targetBedId) {
      const baseline = createScenarioBaseline(scenario.targetBedId)
      useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === baseline.id ? baseline : bed) }))
    }
    const timer = setInterval(() => get().advanceOneSecond(), 1000)
    set({ activeScenarioId: id, status: 'running', elapsedSeconds: 0, timeline: [{ id: `${id}-start`, atSecond: 0, label: `${scenario.title} started` }], timer })
    logWardEvent(scenario.targetBedId, `${scenario.title} started`)
  },
  advanceOneSecond: () => {
    const state = get()
    if (!state.activeScenarioId || state.status !== 'running') return
    const scenario = DEMO_SCENARIOS[state.activeScenarioId]
    const elapsedSeconds = state.elapsedSeconds + 1
    const due = scenario.steps.filter((step) => step.atSecond === elapsedSeconds)
    due.forEach((step) => {
      if (step.kind === 'connection' && step.connection) useWardDashboardStore.getState().setConnection(step.connection)
      if (step.kind === 'bed_update' && scenario.targetBedId && step.patch) {
        useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === scenario.targetBedId ? { ...bed, ...step.patch, lastUpdatedAt: Date.now() } : bed) }))
      }
      logWardEvent(scenario.targetBedId, step.label, step.patch?.priority === 'high' ? 'high' : step.patch?.priority === 'medium' ? 'medium' : 'none')
    })
    const completed = elapsedSeconds >= scenario.durationSeconds
    if (completed && state.timer) clearInterval(state.timer)
    set((current) => ({ elapsedSeconds, status: completed ? 'completed' : 'running', timer: completed ? null : current.timer, timeline: [...current.timeline, ...due.map((step) => ({ id: `${scenario.id}-${step.atSecond}`, atSecond: step.atSecond, label: step.label }))] }))
  },
  reset: () => {
    if (get().timer) clearInterval(get().timer as ReturnType<typeof setInterval>)
    useWardDashboardStore.setState({ beds: structuredClone([...BED_FIXTURES]), connection: 'live' })
    set({ activeScenarioId: null, status: 'idle', elapsedSeconds: 0, timeline: [], timer: null })
  },
}))
