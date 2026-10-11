import type { DemoControlAdapter } from './demoAdapters'

let adapter: DemoControlAdapter | null = null
export function configureDemoControlAdapter(next: DemoControlAdapter) { adapter = next }
function configured() { if (!adapter) throw new Error('Demo control runtime is not configured'); return adapter }
export function runDemoScenario(...args: Parameters<DemoControlAdapter['runScenario']>) { return configured().runScenario(...args) }
export function resetDemoWard(...args: Parameters<DemoControlAdapter['resetWard']>) { return configured().resetWard(...args) }
