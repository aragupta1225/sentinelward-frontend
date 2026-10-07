import { useEffect, useRef } from 'react'
import type { WaveformData } from '../domain/ward'

interface WaveformCanvasProps { data: WaveformData; muted?: boolean }

function drawSignal(context: CanvasRenderingContext2D, values: number[], top: number, height: number, color: string) {
  if (values.length < 2) return
  context.beginPath()
  values.forEach((value, index) => {
    const x = (index / (values.length - 1)) * context.canvas.width
    const y = top + height / 2 - value * height * 0.38
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  })
  context.strokeStyle = color
  context.lineWidth = 2
  context.stroke()
}

export function WaveformCanvas({ data, muted = false }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const bounds = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.floor(bounds.width * ratio))
    canvas.height = Math.max(1, Math.floor(bounds.height * ratio))
    const context = canvas.getContext('2d')
    if (!context) return

    context.fillStyle = '#071725'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = 'rgba(128, 166, 190, 0.12)'
    context.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 24 * ratio) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke()
    }
    for (let y = 0; y < canvas.height; y += 24 * ratio) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()
    }

    if (data.ecg.length === 0 && data.ppg.length === 0) {
      context.fillStyle = '#9db0bf'
      context.font = `${12 * ratio}px system-ui`
      context.fillText('Waveform unavailable — no zero or flatline inferred', 14 * ratio, 49 * ratio)
      return
    }
    drawSignal(context, data.ecg, 3 * ratio, 51 * ratio, muted ? '#82909b' : '#55e2ba')
    drawSignal(context, data.ppg, 53 * ratio, 43 * ratio, muted ? '#6f7f8a' : '#3bbff2')
  }, [data, muted])

  return (
    <div className="waveform" aria-label="Six-second ECG and PPG waveform snapshot" role="img">
      <span className="waveform__label waveform__label--ecg">ECG</span>
      <span className="waveform__label waveform__label--ppg">PPG</span>
      <canvas ref={canvasRef} />
    </div>
  )
}
