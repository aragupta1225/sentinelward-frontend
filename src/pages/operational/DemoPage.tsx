import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionButton, Panel, StatusChip } from '../../components/ui'
import type { ScenarioId, ScenarioSpeed } from '../../domain/scenarios'
import { DEMO_SCENARIOS } from '../../mocks/scenarios'
import { useDemoScenarioStore } from '../../store/demoScenarioStore'
import { OperationalPage } from './shared'

const SPEEDS: ScenarioSpeed[] = [1, 2, 5]

function formatOffset(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return minutes > 0 ? `${minutes}:${remaining.toString().padStart(2, '0')}` : `0:${remaining.toString().padStart(2, '0')}`
}

export function DemoPage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<ScenarioId>('full_ward_script')
  const activeScenarioId = useDemoScenarioStore((state) => state.activeScenarioId)
  const status = useDemoScenarioStore((state) => state.status)
  const speed = useDemoScenarioStore((state) => state.speed)
  const elapsedSeconds = useDemoScenarioStore((state) => state.elapsedSeconds)
  const timeline = useDemoScenarioStore((state) => state.timeline)
  const pending = useDemoScenarioStore((state) => state.pending)
  const error = useDemoScenarioStore((state) => state.error)
  const startScenario = useDemoScenarioStore((state) => state.startScenario)
  const togglePause = useDemoScenarioStore((state) => state.togglePause)
  const setSpeed = useDemoScenarioStore((state) => state.setSpeed)
  const reset = useDemoScenarioStore((state) => state.reset)
  const shownScenario = DEMO_SCENARIOS[activeScenarioId ?? selectedId]
  const completedStepIds = new Set(timeline.map((entry) => entry.id))
  const scenarioLocked = status === 'running' || status === 'paused'

  return (
    <OperationalPage title="Demo control" eyebrow="S12 · operator only" description="Run the deterministic ward script for the video, pause it safely, change playback speed, or reset all ward fixtures.">
      {error && <p className="command-error" role="alert">{error}</p>}
      <div className="scenario-grid" role="radiogroup" aria-label="Demo scenario">
        {Object.values(DEMO_SCENARIOS).map((scenario) => (
          <Panel as="article" className={`scenario-runner ${selectedId === scenario.id ? 'scenario-runner--active' : ''}`} key={scenario.id}>
            <label><input type="radio" name="scenario" value={scenario.id} checked={selectedId === scenario.id} disabled={scenarioLocked} onChange={() => setSelectedId(scenario.id)} /><span><strong>{scenario.title}</strong><small>{scenario.durationSeconds === 720 ? '12 min' : `${scenario.durationSeconds} s`} · {scenario.steps.length} timed events</small></span></label>
            {scenario.targetBedId && <ActionButton tone="quiet" onClick={() => navigate(`/bed/${scenario.targetBedId}`)}>Open {scenario.targetBedId}</ActionButton>}
          </Panel>
        ))}
      </div>
      <Panel className="demo-controls" aria-label="Playback controls">
        <div><span>Speed</span><div className="demo-speed">{SPEEDS.map((value) => <button key={value} type="button" aria-pressed={speed === value} disabled={pending !== null} onClick={() => setSpeed(value)}>{value}×</button>)}</div></div>
        <ActionButton tone="primary" disabled={pending !== null || scenarioLocked} onClick={() => void startScenario(selectedId)}>{pending === 'run' ? 'Starting…' : 'Run'}</ActionButton>
        <ActionButton disabled={!activeScenarioId || !['running', 'paused'].includes(status) || pending !== null} onClick={togglePause}>{status === 'paused' ? 'Resume' : 'Pause'}</ActionButton>
        <ActionButton tone="quiet" disabled={pending !== null} onClick={() => void reset()}>{pending === 'reset' ? 'Resetting…' : 'Reset ward'}</ActionButton>
      </Panel>
      <Panel className="scenario-console" aria-live="polite">
        <header><div><p className="eyebrow">Live timeline · what will happen when</p><h2>{shownScenario.title}</h2></div><StatusChip tone={status === 'running' ? 'positive' : 'neutral'} dot>{status} · {formatOffset(elapsedSeconds)} · {speed}×</StatusChip></header>
        <div className="demo-progress"><span style={{ width: `${Math.min(elapsedSeconds / shownScenario.durationSeconds * 100, 100)}%` }} /><small>{formatOffset(elapsedSeconds)} / {formatOffset(shownScenario.durationSeconds)}</small></div>
        <ol className="demo-timeline">
          <li className={activeScenarioId ? 'demo-timeline--done' : 'demo-timeline--next'}><time>0:00</time><span>{shownScenario.title} starts</span><em>{activeScenarioId ? 'done' : 'next'}</em></li>
          {shownScenario.steps.map((step) => {
            const entryId = `${shownScenario.id}-${step.atSecond}-${step.label}`
            const done = completedStepIds.has(entryId)
            const next = !done && shownScenario.steps.filter((candidate) => candidate.atSecond > elapsedSeconds)[0] === step
            return <li className={done ? 'demo-timeline--done' : next ? 'demo-timeline--next' : undefined} key={entryId}><time>{formatOffset(step.atSecond)}</time><span>{step.label}</span><em>{done ? 'done' : next ? 'next' : 'upcoming'}</em></li>
          })}
        </ol>
      </Panel>
    </OperationalPage>
  )
}
