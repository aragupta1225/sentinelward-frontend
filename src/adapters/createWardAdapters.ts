import type { WardEventSource, WardRestAdapter } from './contracts'
import { HttpWardRestAdapter } from './httpWardAdapter'
import { NativeWardWebSocketEventSource } from './nativeWardWebSocket'
import { BED_FIXTURES } from '../mocks/fixtures'
import { MockWardRestAdapter } from '../mocks/mockAdapters'
import { MockWardGridEventSource } from '../mocks/mockWardEventSource'
import type { RuntimeLocation } from '../runtime/applicationRuntime'
import type { RuntimeConfig } from '../runtime/runtimeConfig'

export interface WardAdapterSet { rest: WardRestAdapter; events: WardEventSource }

export function createWardAdapters(config: RuntimeConfig, location: RuntimeLocation, onRecoveryRequired?: () => void): WardAdapterSet {
  if (config.mode === 'mock') {
    return { rest: new MockWardRestAdapter(), events: new MockWardGridEventSource(BED_FIXTURES) }
  }
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return {
    rest: new HttpWardRestAdapter(config.apiBaseUrl),
    events: new NativeWardWebSocketEventSource({
      url: config.webSocketUrl ?? `${protocol}//${location.host}/ws`,
      onRecoveryRequired,
    }),
  }
}
