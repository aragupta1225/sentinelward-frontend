import { beforeEach, describe, expect, it } from 'vitest'
import { MockActionLogAdapter } from '../adapters/actionLogAdapters'
import { configureActionLogAdapter } from '../adapters/actionLogGateway'
import { configureCommandAdapter } from '../adapters/commandGateway'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'
import { resetActionLogStore, useActionLogStore } from './actionLogStore'
import { resetBedDetailStore, useBedDetailStore } from './bedDetailStore'

describe('action log store', () => {
  beforeEach(() => {
    configureActionLogAdapter(new MockActionLogAdapter())
    configureCommandAdapter(new MockCommandAdapter())
    resetActionLogStore()
    resetBedDetailStore()
  })

  it('loads at most 200 actions and retains an original when IT appends its undo', async () => {
    await useActionLogStore.getState().load()
    const original = useActionLogStore.getState().records.find((record) => record.id === 'action-1')!
    expect(await useActionLogStore.getState().undo(original, 'it', 'Antara Gupta')).toBe(true)
    const records = useActionLogStore.getState().records
    expect(records.some((record) => record.id === original.id)).toBe(true)
    expect(records.some((record) => record.referencesActionId === original.id)).toBe(true)
    expect(useBedDetailStore.getState().actions.some((action) => action.referencesActionId === original.id)).toBe(true)
  })

  it('does not allow a non-IT role to undo an automatic action', async () => {
    await useActionLogStore.getState().load()
    const original = useActionLogStore.getState().records.find((record) => record.id === 'action-1')!
    expect(await useActionLogStore.getState().undo(original, 'nurse', 'Nurse Priya')).toBe(false)
    expect(useActionLogStore.getState().records.some((record) => record.referencesActionId === original.id)).toBe(false)
  })
})
