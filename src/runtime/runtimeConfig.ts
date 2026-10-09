import { z } from 'zod'

const runtimeEnvironmentSchema = z.object({
  VITE_SENTINELWARD_RUNTIME_MODE: z.enum(['mock', 'backend']).default('mock'),
  VITE_SENTINELWARD_API_BASE_URL: z.string().trim().min(1).default('/api'),
  VITE_SENTINELWARD_WS_URL: z.string().trim().min(1).optional(),
})

export interface RuntimeConfig {
  mode: 'mock' | 'backend'
  apiBaseUrl: string
  webSocketUrl?: string
}

export function parseRuntimeConfig(environment: Record<string, unknown>): RuntimeConfig {
  const parsed = runtimeEnvironmentSchema.parse(environment)
  return {
    mode: parsed.VITE_SENTINELWARD_RUNTIME_MODE,
    apiBaseUrl: parsed.VITE_SENTINELWARD_API_BASE_URL.replace(/\/$/, ''),
    webSocketUrl: parsed.VITE_SENTINELWARD_WS_URL,
  }
}
