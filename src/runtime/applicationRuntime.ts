import type { CommandAdapter } from '../adapters/commandContracts'
import { createWardAdapters, type WardAdapterSet } from '../adapters/createWardAdapters'
import { HttpCommandAdapter } from '../adapters/httpCommandAdapter'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'
import { parseRuntimeConfig, type RuntimeConfig } from './runtimeConfig'

export interface ApplicationRuntime {
  config: RuntimeConfig
  ward: WardAdapterSet
  commands: CommandAdapter
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
  }
}
