import type { WardSummary } from '../domain/wardSummary'

interface WardSummaryRowProps { summary: WardSummary }

export function WardSummaryRow({ summary }: WardSummaryRowProps) {
  const metrics = [
    { label: 'Beds', value: summary.totalBeds, detail: 'monitored' },
    { label: 'Active alarms', value: summary.activeAlarms, detail: 'need review', tone: 'alarm' },
    { label: 'Untrusted', value: summary.untrustedBeds, detail: 'verify readings', tone: 'warning' },
    { label: 'Isolated', value: summary.isolatedBeds, detail: 'devices contained', tone: 'neutral' },
    { label: 'Average trust', value: `${summary.averageTrust}%`, detail: 'ward signal confidence' },
  ]

  return (
    <section className="ward-summary" aria-label="Ward summary">
      {metrics.map((metric) => (
        <div className={`summary-card ${metric.tone ? `summary-card--${metric.tone}` : ''}`} key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small>{metric.detail}</small>
        </div>
      ))}
    </section>
  )
}
