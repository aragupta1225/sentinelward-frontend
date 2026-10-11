import type { CommandAdapter } from '../adapters/commandContracts'
import { HttpActionLogAdapter, MockActionLogAdapter, type ActionLogAdapter } from '../adapters/actionLogAdapters'
import { HttpDemoControlAdapter, MockDemoControlAdapter, type DemoControlAdapter } from '../adapters/demoAdapters'
import { HttpBriefingAdapter, MockBriefingAdapter, type BriefingAdapter } from '../adapters/briefingAdapters'
import { createWardAdapters, type WardAdapterSet } from '../adapters/createWardAdapters'
import { HttpCommandAdapter } from '../adapters/httpCommandAdapter'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'
import { HttpPublicAdapter, MockPublicAdapter } from '../adapters/publicAdapters'
import type { PublicAdapter } from '../adapters/publicContracts'
import { parseRuntimeConfig, type RuntimeConfig } from './runtimeConfig'

export interface ApplicationRuntime {
  config: RuntimeConfig
  ward: WardAdapterSet
  commands: CommandAdapter
  public: PublicAdapter
  briefing: BriefingAdapter
  actionLog: ActionLogAdapter
  demo: DemoControlAdapter
}

export interface RuntimeLocation {
  protocol: string
  host: string
}

export function createApplicationRuntime(
  environment: Record<string, unknown>,
  location: RuntimeLocation = window.location,
  onRecoveryRequired?: () => void,
): ApplicationRuntime {
  const config = parseRuntimeConfig(environment)
  return {
    config,
    ward: createWardAdapters(config, location, onRecoveryRequired),
    commands: config.mode === 'mock'
      ? new MockCommandAdapter()
      : new HttpCommandAdapter(config.apiBaseUrl),
    public: config.mode === 'mock'
      ? new MockPublicAdapter()
      : new HttpPublicAdapter(config.apiBaseUrl),
    briefing: config.mode === 'mock'
      ? new MockBriefingAdapter()
      : new HttpBriefingAdapter(config.apiBaseUrl),
    actionLog: config.mode === 'mock'
      ? new MockActionLogAdapter()
      : new HttpActionLogAdapter(config.apiBaseUrl),
    demo: config.mode === 'mock'
      ? new MockDemoControlAdapter()
      : new HttpDemoControlAdapter(config.apiBaseUrl),
  }
}
