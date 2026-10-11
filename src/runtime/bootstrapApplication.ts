import { configureCommandAdapter } from '../adapters/commandGateway'
import { configureBriefingAdapter } from '../adapters/briefingGateway'
import { configurePublicAdapter } from '../adapters/publicGateway'
import { configureWardDashboardAdapters } from '../store/wardDashboardStore'
import { createApplicationRuntime, type ApplicationRuntime, type RuntimeLocation } from './applicationRuntime'

export function bootstrapApplication(
  environment: Record<string, unknown>,
  location?: RuntimeLocation,
  onRecoveryRequired?: () => void,
): ApplicationRuntime {
  const runtime = createApplicationRuntime(environment, location, onRecoveryRequired)
  configureCommandAdapter(runtime.commands)
  configureBriefingAdapter(runtime.briefing)
  configurePublicAdapter(runtime.public)
  configureWardDashboardAdapters(runtime.ward)
  return runtime
}
