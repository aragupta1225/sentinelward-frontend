import type { BriefingAdapter } from './briefingAdapters'

let adapter: BriefingAdapter | null = null
export function configureBriefingAdapter(next: BriefingAdapter) { adapter = next }
function configured() { if (!adapter) throw new Error('Briefing runtime is not configured'); return adapter }
export function loadBriefing(since: string, signal?: AbortSignal) { return configured().getBriefing(since, signal) }
export function loadWorkload(hours: number, signal?: AbortSignal) { return configured().getWorkload(hours, signal) }
