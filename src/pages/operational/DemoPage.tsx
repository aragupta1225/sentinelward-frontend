import { useNavigate } from 'react-router-dom'
import type { ScenarioId } from '../../domain/scenarios'
import { DEMO_SCENARIOS } from '../../mocks/scenarios'
import { useDemoScenarioStore } from '../../store/demoScenarioStore'
import { OperationalPage } from './shared'

export function DemoPage() {
  const navigate = useNavigate()
  const activeScenarioId = useDemoScenarioStore((state) => state.activeScenarioId)
  const status = useDemoScenarioStore((state) => state.status)
  const elapsedSeconds = useDemoScenarioStore((state) => state.elapsedSeconds)
  const timeline = useDemoScenarioStore((state) => state.timeline)
  const startScenario = useDemoScenarioStore((state) => state.startScenario)
  const reset = useDemoScenarioStore((state) => state.reset)

  return <OperationalPage title="Demo control" eyebrow="S12 · deterministic playback"><div className="scenario-grid">{Object.values(DEMO_SCENARIOS).map((scenario) => <article className={`scenario-runner ${activeScenarioId === scenario.id ? 'scenario-runner--active' : ''}`} key={scenario.id}><div><strong>{scenario.title}</strong><span>{scenario.durationSeconds}s · {scenario.steps.length} timed events</span></div><button type="button" onClick={() => startScenario(scenario.id as ScenarioId)}>Run scenario</button>{scenario.targetBedId && <button type="button" onClick={() => navigate(`/bed/${scenario.targetBedId}`)}>Open {scenario.targetBedId}</button>}</article>)}</div><section className="scenario-console" aria-live="polite"><header><div><p className="eyebrow">Playback</p><h2>{activeScenarioId ? DEMO_SCENARIOS[activeScenarioId].title : 'No scenario selected'}</h2></div><strong>{status.toUpperCase()} · {elapsedSeconds}s</strong></header><ol>{timeline.map((entry) => <li key={entry.id}><time>+{entry.atSecond}s</time><span>{entry.label}</span></li>)}</ol><button type="button" onClick={reset}>Reset all fixtures</button></section></OperationalPage>
}
