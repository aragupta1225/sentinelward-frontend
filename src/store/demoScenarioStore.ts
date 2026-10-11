import { create } from 'zustand'
import { resetDemoWard, runDemoScenario } from '../adapters/demoGateway'
import type { ScenarioId, ScenarioSpeed } from '../domain/scenarios'
import { BED_FIXTURES } from '../mocks/fixtures'
import { createScenarioBaseline, DEMO_SCENARIOS } from '../mocks/scenarios'
import { useWardDashboardStore, type WardActivity } from './wardDashboardStore'

export interface ScenarioTimelineEntry { id: string; atSecond: number; label: string }
interface DemoScenarioState {
  activeScenarioId: ScenarioId | null
  status: 'idle' | 'running' | 'paused' | 'completed'
  speed: ScenarioSpeed
  elapsedSeconds: number
  timeline: ScenarioTimelineEntry[]
  timer: ReturnType<typeof setInterval> | null
  pending: 'run' | 'reset' | null
  error: string | null
  startScenario: (id: ScenarioId) => Promise<boolean>
  togglePause: () => void
  setSpeed: (speed: ScenarioSpeed) => void
  advanceOneSecond: () => void
  reset: () => Promise<boolean>
}

let eventSequence = 0

function logWardEvent(bedId: string | null, label: string, priority: 'none' | 'medium' | 'high' = 'none') {
  eventSequence += 1
  const entry: WardActivity = { id: `scenario-${eventSequence}`, bedId, kind: 'system', priority, message: label, occurredAt: Date.now() }
  useWardDashboardStore.setState((ward) => ({ activities: [entry, ...ward.activities].slice(0, 30) }))
}

function createTimer(speed: ScenarioSpeed) {
  return setInterval(() => useDemoScenarioStore.getState().advanceOneSecond(), 1000 / speed)
}

function prepareScenario(id: ScenarioId) {
  const scenario = DEMO_SCENARIOS[id]
  const baselineIds = scenario.id === 'full_ward_script'
    ? ['B03', 'B04', 'B05', 'B07', 'B09', 'B10']
    : scenario.targetBedId ? [scenario.targetBedId] : []
  useWardDashboardStore.setState((ward) => ({
    connection: 'live',
    beds: ward.beds.map((bed) => baselineIds.includes(bed.id) ? createScenarioBaseline(bed.id) : bed),
  }))
}

export const useDemoScenarioStore = create<DemoScenarioState>((set, get) => ({
  activeScenarioId: null, status: 'idle', speed: 1, elapsedSeconds: 0, timeline: [], timer: null, pending: null, error: null,
  startScenario: async (id) => {
    const state = get()
    if (state.timer) clearInterval(state.timer)
    set({ pending: 'run', error: null, timer: null })
    try {
      await runDemoScenario(id, state.speed)
    } catch {
      set({ pending: null, error: 'Scenario could not be started. Ward state was not changed.' })
      return false
    }
    const scenario = DEMO_SCENARIOS[id]
    prepareScenario(id)
    const timer = createTimer(state.speed)
    set({ activeScenarioId: id, status: 'running', elapsedSeconds: 0, timeline: [{ id: `${id}-start`, atSecond: 0, label: `${scenario.title} started` }], timer, pending: null })
    logWardEvent(scenario.targetBedId, `${scenario.title} started`)
    return true
  },
  togglePause: () => {
    const state = get()
    if (!state.activeScenarioId || !['running', 'paused'].includes(state.status)) return
    if (state.status === 'running') {
      if (state.timer) clearInterval(state.timer)
      set({ status: 'paused', timer: null })
    } else {
      set({ status: 'running', timer: createTimer(state.speed) })
    }
  },
  setSpeed: (speed) => {
    const state = get()
    if (state.timer) clearInterval(state.timer)
    set({ speed, timer: state.status === 'running' ? createTimer(speed) : null })
  },
  advanceOneSecond: () => {
    const state = get()
    if (!state.activeScenarioId || state.status !== 'running') return
    const scenario = DEMO_SCENARIOS[state.activeScenarioId]
    const elapsedSeconds = state.elapsedSeconds + 1
    const due = scenario.steps.filter((step) => step.atSecond === elapsedSeconds)
    due.forEach((step) => {
      const bedId = step.bedId ?? scenario.targetBedId
      if (step.kind === 'bed_update' && bedId && step.patch) {
        useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === bedId ? { ...bed, ...step.patch, lastUpdatedAt: Date.now() } : bed) }))
      }
      logWardEvent(bedId, step.label, step.patch?.priority === 'high' ? 'high' : step.patch?.priority === 'medium' ? 'medium' : 'none')
    })
    const completed = elapsedSeconds >= scenario.durationSeconds
    if (completed && state.timer) clearInterval(state.timer)
    set((current) => ({
      elapsedSeconds, status: completed ? 'completed' : 'running', timer: completed ? null : current.timer,
      timeline: [...current.timeline, ...due.map((step) => ({ id: `${scenario.id}-${step.atSecond}-${step.label}`, atSecond: step.atSecond, label: step.label }))],
    }))
  },
  reset: async () => {
    set({ pending: 'reset', error: null })
    try {
      await resetDemoWard()
    } catch {
      set({ pending: null, error: 'Ward reset failed. Existing demo state is retained.' })
      return false
    }
    if (get().timer) clearInterval(get().timer as ReturnType<typeof setInterval>)
    useWardDashboardStore.setState({ beds: structuredClone([...BED_FIXTURES]), connection: 'live' })
    set({ activeScenarioId: null, status: 'idle', elapsedSeconds: 0, timeline: [], timer: null, pending: null })
    return true
  },
}))
