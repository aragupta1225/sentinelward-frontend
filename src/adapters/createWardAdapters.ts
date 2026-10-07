import type { WardEventSource, WardRestAdapter } from './contracts'
import { HttpWardRestAdapter } from './httpWardAdapter'
import { NativeWardWebSocketEventSource } from './nativeWardWebSocket'
import { getFixture } from '../mocks/fixtures'
import { MockWardEventSource, MockWardRestAdapter } from '../mocks/mockAdapters'

export interface WardAdapterSet { rest: WardRestAdapter; events: WardEventSource }

export function createWardAdapters(mode: 'mock' | 'backend', onRecoveryRequired?: () => void): WardAdapterSet {
  if (mode === 'mock') return { rest: new MockWardRestAdapter(), events: new MockWardEventSource(getFixture('B01')) }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return {
    rest: new HttpWardRestAdapter('/api'),
    events: new NativeWardWebSocketEventSource({
      url: `${protocol}//${window.location.host}/ws`,
      onRecoveryRequired,
    }),
  }
}
