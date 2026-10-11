import { create } from 'zustand'
import { loadActionLog } from '../adapters/actionLogGateway'
import { dispatchCommand } from '../adapters/commandGateway'
import type { Role } from '../domain/access'
import type { ActionLogRecord } from '../domain/actionLog'
import { useBedDetailStore } from './bedDetailStore'
import { useWardDashboardStore } from './wardDashboardStore'

interface ActionLogState {
  records: ActionLogRecord[]
  loading: boolean
  error: string | null
  pendingUndoId: string | null
  load: (signal?: AbortSignal) => Promise<void>
  undo: (record: ActionLogRecord, role: Role, approvedBy: string) => Promise<boolean>
}

export const useActionLogStore = create<ActionLogState>((set, get) => ({
  records: [], loading: true, error: null, pendingUndoId: null,
  load: async (signal) => {
    set({ loading: true, error: null })
    try {
      const records = await loadActionLog(200, signal)
      if (!signal?.aborted) set({ records, loading: false })
    } catch (reason) {
      if (!signal?.aborted) set({ loading: false, error: reason instanceof Error ? reason.message : 'Action log could not be loaded.' })
    }
  },
  undo: async (record, role, approvedBy) => {
    const state = get()
    const alreadyUndone = state.records.some((entry) => entry.referencesActionId === record.id)
      || useBedDetailStore.getState().actions.some((entry) => entry.referencesActionId === record.id)
    if (role !== 'it' || record.mode !== 'automatic' || !record.undoable || alreadyUndone) return false
    set({ pendingUndoId: record.id, error: null })
    if (!await dispatchCommand({ type: 'undo_action', bedId: record.bedId ?? 'ward', originalActionId: record.id })) {
      set({ pendingUndoId: null, error: 'Undo failed. The original action remains in force.' })
      return false
    }
    const occurredAt = Date.now()
    const undoRecord: ActionLogRecord = {
      id: `log-undo-${occurredAt}`, occurredAt, actor: approvedBy, actionCode: 'action_undone',
      action: `Undo recorded for: ${record.action}`, bedId: record.bedId, deviceId: record.deviceId,
      approvedBy, mode: 'person', undoable: false, referencesActionId: record.id,
    }
    set({ records: [undoRecord, ...state.records], pendingUndoId: null })
    if (record.bedId) {
      useBedDetailStore.setState((bedState) => ({ actions: [{ id: undoRecord.id, bedId: record.bedId!, type: 'action_undone', description: `${undoRecord.action}; original retained`, actor: approvedBy, actorRole: role, occurredAt, automatic: false, undoable: false, referencesActionId: record.id }, ...bedState.actions] }))
      if (record.actionCode === 'device_isolated') useWardDashboardStore.setState((ward) => ({ beds: ward.beds.map((bed) => bed.id === record.bedId ? { ...bed, isolated: false } : bed) }))
    }
    return true
  },
}))

export function resetActionLogStore() {
  useActionLogStore.setState({ records: [], loading: true, error: null, pendingUndoId: null })
}
