import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureDemoControlAdapter } from '../adapters/demoGateway'
import { MockDemoControlAdapter } from '../adapters/demoAdapters'
import { DEMO_SCENARIOS } from '../mocks/scenarios'
import { useDemoScenarioStore } from './demoScenarioStore'
import { useWardDashboardStore } from './wardDashboardStore'

describe('timed demo scenarios', () => {
  beforeEach(() => {
    configureDemoControlAdapter(new MockDemoControlAdapter())
  })

  afterEach(async () => {
    await useDemoScenarioStore.getState().reset()
    useDemoScenarioStore.setState({ speed: 1 })
    vi.useRealTimers()
  })

  it('provides the exact seven S12 scenario choices', () => {
    expect(Object.values(DEMO_SCENARIOS).map((scenario) => scenario.title)).toEqual(['Full ward script (12 min)', 'Real emergency only', 'Loose sensor', 'Drift', 'Replay attack', 'Fake flatline', 'Flood'])
  })

  it('raises a real emergency at the specified point in the timeline', async () => {
    vi.useFakeTimers()
    await useDemoScenarioStore.getState().startScenario('emergency')
    expect(useWardDashboardStore.getState().beds.find((bed) => bed.id === 'B03')?.verdict).toBe('NORMAL')
    vi.advanceTimersByTime(8000)
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === 'B03')
    expect(bed?.verdict).toBe('EMERGENCY')
    expect(bed?.priority).toBe('high')
    expect(useDemoScenarioStore.getState().timeline).toHaveLength(3)
  })

  it('keeps a replay attack out of the clinical alarm priority while isolating the device', async () => {
    vi.useFakeTimers()
    await useDemoScenarioStore.getState().startScenario('replay_attack')
    vi.advanceTimersByTime(8000)
    const bed = useWardDashboardStore.getState().beds.find((item) => item.id === 'B07')
    expect(bed).toMatchObject({ verdict: 'DEVICE_ATTACK', priority: 'none', isolated: true, trustState: 'untrusted' })
  })

  it('pauses without advancing and applies 5x speed after resume', async () => {
    vi.useFakeTimers()
    useDemoScenarioStore.getState().setSpeed(5)
    await useDemoScenarioStore.getState().startScenario('drifting')
    vi.advanceTimersByTime(400)
    expect(useDemoScenarioStore.getState().elapsedSeconds).toBe(2)
    useDemoScenarioStore.getState().togglePause()
    vi.advanceTimersByTime(2000)
    expect(useDemoScenarioStore.getState().elapsedSeconds).toBe(2)
    useDemoScenarioStore.getState().togglePause()
    vi.advanceTimersByTime(200)
    expect(useDemoScenarioStore.getState().elapsedSeconds).toBe(3)
  })
})
