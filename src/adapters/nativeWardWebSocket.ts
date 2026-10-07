import type { WardEvent, WardEventSource } from './contracts'
import { decodeWardMessage } from './wardTransport'

export interface ReconnectPolicy {
  initialDelayMs: number
  maximumDelayMs: number
  maximumAttempts: number
}

interface WebSocketLike {
  readyState: number
  onopen: (() => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onclose: (() => void) | null
  onerror: (() => void) | null
  close(): void
}

interface NativeWardWebSocketOptions {
  url: string
  policy?: Partial<ReconnectPolicy>
  socketFactory?: (url: string) => WebSocketLike
  decode?: (raw: string) => WardEvent | null
  onRecoveryRequired?: (reconnectAttempt: number) => void
}

const DEFAULT_POLICY: ReconnectPolicy = {
  initialDelayMs: 1000,
  maximumDelayMs: 15_000,
  maximumAttempts: Number.POSITIVE_INFINITY,
}

export class NativeWardWebSocketEventSource implements WardEventSource {
  private readonly options: NativeWardWebSocketOptions
  private readonly listeners = new Set<(event: WardEvent) => void>()
  private readonly policy: ReconnectPolicy
  private readonly socketFactory: (url: string) => WebSocketLike
  private readonly decode: (raw: string) => WardEvent | null
  private socket: WebSocketLike | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempt = 0
  private intentionallyClosed = false

  constructor(options: NativeWardWebSocketOptions) {
    this.options = options
    this.policy = { ...DEFAULT_POLICY, ...options.policy }
    this.socketFactory = options.socketFactory ?? ((url) => new WebSocket(url) as unknown as WebSocketLike)
    this.decode = options.decode ?? decodeWardMessage
  }

  connect() {
    if (this.socket && (this.socket.readyState === 0 || this.socket.readyState === 1)) return
    this.intentionallyClosed = false
    this.emit({ type: 'connection.changed', state: 'connecting', occurredAt: Date.now() })
    const socket = this.socketFactory(this.options.url)
    this.socket = socket
    socket.onopen = () => {
      const wasReconnect = this.reconnectAttempt > 0
      const attempt = this.reconnectAttempt
      this.reconnectAttempt = 0
      this.emit({ type: 'connection.changed', state: 'live', occurredAt: Date.now() })
      if (wasReconnect) this.options.onRecoveryRequired?.(attempt)
    }
    socket.onmessage = (message) => {
      if (typeof message.data !== 'string') return
      const event = this.decode(message.data)
      if (event) this.emit(event)
    }
    socket.onerror = () => undefined
    socket.onclose = () => {
      if (this.socket === socket) this.socket = null
      this.emit({ type: 'connection.changed', state: 'disconnected', occurredAt: Date.now() })
      if (!this.intentionallyClosed) this.scheduleReconnect()
    }
  }

  disconnect() {
    this.intentionallyClosed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
    this.socket?.close()
    this.socket = null
  }

  subscribe(listener: (event: WardEvent) => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempt >= this.policy.maximumAttempts) return
    const delay = Math.min(this.policy.initialDelayMs * 2 ** this.reconnectAttempt, this.policy.maximumDelayMs)
    this.reconnectAttempt += 1
    this.reconnectTimer = setTimeout(() => { this.reconnectTimer = null; this.connect() }, delay)
  }

  private emit(event: WardEvent) {
    this.listeners.forEach((listener) => listener(event))
  }
}
