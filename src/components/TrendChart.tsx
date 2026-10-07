import { useEffect, useRef } from 'react'
import uPlot, { type AlignedData } from 'uplot'
import 'uplot/dist/uPlot.min.css'
import type { BedTrendData } from '../mocks/trendFixtures'

interface TrendChartProps { data: BedTrendData }

export function TrendChart({ data }: TrendChartProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const chart = new uPlot({
      width: Math.max(320, host.clientWidth), height: 230,
      cursor: { drag: { x: true, y: false } },
      scales: { x: { time: true }, hr: { range: (_u, min, max) => [Math.max(0, min - 8), max + 8] }, spo2: { range: [75, 100] } },
      axes: [
        { stroke: '#8ba2b2', grid: { stroke: '#1d384a' } },
        { scale: 'hr', stroke: '#55e2ba', grid: { stroke: '#1d384a' }, label: 'HR bpm' },
        { scale: 'spo2', side: 1, stroke: '#3bbff2', grid: { show: false }, label: 'SpO₂ %' },
      ],
      series: [
        {},
        { label: 'Heart rate', scale: 'hr', stroke: '#55e2ba', width: 2 },
        { label: 'SpO₂', scale: 'spo2', stroke: '#3bbff2', width: 2 },
      ],
    }, [data.timestamps, data.heartRate, data.spo2] as AlignedData, host)

    const resize = () => chart.setSize({ width: Math.max(320, host.clientWidth), height: 230 })
    window.addEventListener('resize', resize)
    return () => { window.removeEventListener('resize', resize); chart.destroy() }
  }, [data])

  const lastIndex = data.timestamps.length - 1
  return (
    <div className="trend-chart">
      <div ref={hostRef} aria-hidden="true" />
      <p className="sr-only">Thirty-minute trend. Latest heart rate {data.heartRate[lastIndex]} beats per minute and oxygen saturation {data.spo2[lastIndex]} percent.</p>
    </div>
  )
}
