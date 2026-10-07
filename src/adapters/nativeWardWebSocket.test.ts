import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WardEvent } from './contracts'
import { NativeWardWebSocketEventSource } from './nativeWardWebSocket'

class FakeSocket {
  readyState = 0
  onopen: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  open() { this.readyState = 1; this.onopen?.() }
  message(data: string) { this.onmessage?.({ data }) }
  remoteClose() { this.readyState = 3; this.onclose?.() }
  close() { this.readyState = 3; this.onclose?.() }
}

describe('NativeWardWebSocketEventSource', () => {
  afterEach(() => vi.useRealTimers())

  it('validates messages and reconnects with recovery notification', () => {
    vi.useFakeTimers()
    const sockets: FakeSocket[] = []
    const events: WardEvent[] = []
    const recovery = vi.fn()
    const source = new NativeWardWebSocketEventSource({
      url: 'ws://example.test/ws',
      socketFactory: () => { const socket = new FakeSocket(); sockets.push(socket); return socket },
      policy: { initialDelayMs: 100, maximumDelayMs: 100, maximumAttempts: 2 },
      decode: (raw) => raw === 'valid' ? { type: 'connection.changed', state: 'live', occurredAt: 1 } : null,
      onRecoveryRequired: recovery,
    })
    source.subscribe((event) => events.push(event))
    source.connect()
    sockets[0].open()
    sockets[0].message('invalid')
    sockets[0].message('valid')
    sockets[0].remoteClose()
    expect(events.at(-1)?.type).toBe('connection.changed')
    vi.advanceTimersByTime(100)
    expect(sockets).toHaveLength(2)
    sockets[1].open()
    expect(recovery).toHaveBeenCalledWith(1)
    source.disconnect()
  })
})
