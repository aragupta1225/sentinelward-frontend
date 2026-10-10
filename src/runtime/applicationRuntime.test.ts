import { describe, expect, it } from 'vitest'
import { HttpCommandAdapter } from '../adapters/httpCommandAdapter'
import { HttpWardRestAdapter } from '../adapters/httpWardAdapter'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'
import { NativeWardWebSocketEventSource } from '../adapters/nativeWardWebSocket'
import { HttpPublicAdapter, MockPublicAdapter } from '../adapters/publicAdapters'
import { MockWardRestAdapter } from '../mocks/mockAdapters'
import { MockWardGridEventSource } from '../mocks/mockWardEventSource'
import { createApplicationRuntime } from './applicationRuntime'
import { parseRuntimeConfig } from './runtimeConfig'

const location = { protocol: 'https:', host: 'sentinelward.test' }

describe('application runtime composition', () => {
  it('uses the typed mock runtime as the safe default', () => {
    const runtime = createApplicationRuntime({}, location)
    expect(runtime.config.mode).toBe('mock')
    expect(runtime.ward.rest).toBeInstanceOf(MockWardRestAdapter)
    expect(runtime.ward.events).toBeInstanceOf(MockWardGridEventSource)
    expect(runtime.commands).toBeInstanceOf(MockCommandAdapter)
    expect(runtime.public).toBeInstanceOf(MockPublicAdapter)
  })

  it('selects all backend adapters from validated configuration', () => {
    const runtime = createApplicationRuntime({
      VITE_SENTINELWARD_RUNTIME_MODE: 'backend',
      VITE_SENTINELWARD_API_BASE_URL: '/clinical-api/',
      VITE_SENTINELWARD_WS_URL: 'wss://events.sentinelward.test/ward',
    }, location)
    expect(runtime.config).toEqual({
      mode: 'backend',
      apiBaseUrl: '/clinical-api',
      webSocketUrl: 'wss://events.sentinelward.test/ward',
    })
    expect(runtime.ward.rest).toBeInstanceOf(HttpWardRestAdapter)
    expect(runtime.ward.events).toBeInstanceOf(NativeWardWebSocketEventSource)
    expect(runtime.commands).toBeInstanceOf(HttpCommandAdapter)
    expect(runtime.public).toBeInstanceOf(HttpPublicAdapter)
  })

  it('rejects an unknown runtime mode instead of silently enabling a transport', () => {
    expect(() => parseRuntimeConfig({ VITE_SENTINELWARD_RUNTIME_MODE: 'production' })).toThrow()
  })
})
