import type { WardRestAdapter } from '../adapters/contracts'
import { BED_FIXTURES } from './fixtures'

export class MockWardRestAdapter implements WardRestAdapter {
  async getWard() {
    return { beds: structuredClone([...BED_FIXTURES]), receivedAt: Date.now() }
  }
}
