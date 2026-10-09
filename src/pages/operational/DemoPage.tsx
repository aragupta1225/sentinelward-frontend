import { useNavigate } from 'react-router-dom'
import { ActionButton, Panel, StatusChip } from '../../components/ui'
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

  return (
    <OperationalPage title="Demo control" eyebrow="S12 · deterministic playback" description="Run repeatable mock events through the same stores and screens used by the operational interface.">
      <div className="scenario-grid">
        {Object.values(DEMO_SCENARIOS).map((scenario) => (
          <Panel as="article" className={`scenario-runner ${activeScenarioId === scenario.id ? 'scenario-runner--active' : ''}`} key={scenario.id}>
            <div><strong>{scenario.title}</strong><span>{scenario.durationSeconds}s · {scenario.steps.length} timed events</span></div>
            <ActionButton onClick={() => startScenario(scenario.id as ScenarioId)}>Run scenario</ActionButton>
            {scenario.targetBedId && <ActionButton tone="quiet" onClick={() => navigate(`/bed/${scenario.targetBedId}`)}>Open {scenario.targetBedId}</ActionButton>}
          </Panel>
        ))}
      </div>
      <Panel className="scenario-console" aria-live="polite">
        <header><div><p className="eyebrow">Playback</p><h2>{activeScenarioId ? DEMO_SCENARIOS[activeScenarioId].title : 'No scenario selected'}</h2></div><StatusChip tone={status === 'running' ? 'positive' : 'neutral'} dot>{status} · {elapsedSeconds}s</StatusChip></header>
        <ol>{timeline.map((entry) => <li key={entry.id}><time>+{entry.atSecond}s</time><span>{entry.label}</span></li>)}</ol>
        <ActionButton onClick={reset}>Reset all fixtures</ActionButton>
      </Panel>
    </OperationalPage>
  )
}
