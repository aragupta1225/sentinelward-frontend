import type { ActionLogAdapter } from './actionLogAdapters'

let adapter: ActionLogAdapter | null = null
export function configureActionLogAdapter(next: ActionLogAdapter) { adapter = next }
function configured() { if (!adapter) throw new Error('Action log runtime is not configured'); return adapter }
export function loadActionLog(limit: number, signal?: AbortSignal) { return configured().getActions(limit, signal) }
