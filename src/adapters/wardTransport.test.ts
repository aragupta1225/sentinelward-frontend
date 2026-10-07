import { describe, expect, it } from 'vitest'
import { decodeWardMessage } from './wardTransport'

describe('decodeWardMessage', () => {
  it('drops invalid or unknown envelopes', () => {
    expect(decodeWardMessage('not-json')).toBeNull()
    expect(decodeWardMessage(JSON.stringify({ type: 'unknown', payload: {} }))).toBeNull()
  })

  it('maps a valid connection event', () => {
    expect(decodeWardMessage(JSON.stringify({ type: 'connection.changed', payload: { state: 'disconnected', occurred_at: 42 } }))).toEqual({ type: 'connection.changed', state: 'disconnected', occurredAt: 42 })
  })
})
