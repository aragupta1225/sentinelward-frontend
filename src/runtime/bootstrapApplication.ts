import { configureCommandAdapter } from '../adapters/commandGateway'
import { configureWardDashboardAdapters } from '../store/wardDashboardStore'
import { createApplicationRuntime, type ApplicationRuntime, type RuntimeLocation } from './applicationRuntime'

export function bootstrapApplication(
  environment: Record<string, unknown>,
  location?: RuntimeLocation,
  onRecoveryRequired?: () => void,
): ApplicationRuntime {
  const runtime = createApplicationRuntime(environment, location, onRecoveryRequired)
  configureCommandAdapter(runtime.commands)
  configureWardDashboardAdapters(runtime.ward)
  return runtime
}
