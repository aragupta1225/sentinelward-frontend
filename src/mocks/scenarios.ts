import type { Bed } from '../domain/ward'
import type { DemoScenario, ScenarioId } from '../domain/scenarios'
import { getFixture } from './fixtures'

export const DEMO_SCENARIOS: Record<ScenarioId, DemoScenario> = {
  emergency: { id: 'emergency', title: 'Bed 3 real emergency', targetBedId: 'B03', durationSeconds: 5, steps: [
    { atSecond: 1, label: 'Heart rate begins rising', kind: 'bed_update', patch: { priority: 'medium', readings: { heartRate: 118, spo2: 93, systolic: 106, diastolic: 67 }, reason: 'Vital signs moving outside configured range' } },
    { atSecond: 3, label: 'Clinical emergency verdict raised', kind: 'bed_update', patch: { verdict: 'EMERGENCY', priority: 'high', readings: { heartRate: 148, spo2: 86, systolic: 94, diastolic: 60 }, reason: 'HR 148 and SpO₂ falling', requestedAction: 'Urgent bedside assessment' } },
  ] },
  loose_sensor: { id: 'loose_sensor', title: 'Bed 4 loose sensor', targetBedId: 'B04', durationSeconds: 5, steps: [
    { atSecond: 2, label: 'ECG contact becomes intermittent', kind: 'bed_update', patch: { trust: 72, priority: 'medium', reason: 'Intermittent ECG contact' } },
    { atSecond: 4, label: 'Loose sensor verdict raised', kind: 'bed_update', patch: { verdict: 'LOOSE_SENSOR', trust: 68, requestedAction: 'Reseat ECG leads' } },
  ] },
  drifting: { id: 'drifting', title: 'Bed 5 drifting sensor', targetBedId: 'B05', durationSeconds: 6, steps: [
    { atSecond: 1, label: 'SpO₂ baseline starts drifting', kind: 'bed_update', patch: { trust: 82, reason: 'SpO₂ baseline moving gradually' } },
    { atSecond: 3, label: 'Trust continues to decline', kind: 'bed_update', patch: { trust: 68, priority: 'medium' } },
    { atSecond: 5, label: 'Drifting sensor verdict raised', kind: 'bed_update', patch: { verdict: 'DRIFTING', trust: 61, requestedAction: 'Verify sensor placement' } },
  ] },
  tampering: { id: 'tampering', title: 'Bed 7 fake flatline / tampering', targetBedId: 'B07', durationSeconds: 5, steps: [
    { atSecond: 2, label: 'Flatline conflicts with trusted pulse', kind: 'bed_update', patch: { trust: 22, trustState: 'untrusted', priority: 'medium', reason: 'Flatline conflicts with pulse signal' } },
    { atSecond: 4, label: 'Tampering verdict raised; trusted snapshot retained', kind: 'bed_update', patch: { verdict: 'TAMPERING', requestedAction: 'Verify patient and device at bedside' } },
  ] },
  both: { id: 'both', title: 'BOTH emergency + device attack', targetBedId: 'B08', durationSeconds: 6, steps: [
    { atSecond: 2, label: 'Clinical emergency raised', kind: 'bed_update', patch: { verdict: 'EMERGENCY', priority: 'high', readings: { heartRate: 139, spo2: 84, systolic: 88, diastolic: 56 }, reason: 'Clinical emergency detected' } },
    { atSecond: 4, label: 'Device compromise detected and isolated', kind: 'bed_update', patch: { verdict: 'BOTH', trust: 12, trustState: 'untrusted', isolated: true, reason: 'Clinical emergency with device compromise', requestedAction: 'Attend patient; use trusted bedside equipment' } },
  ] },
  connection_loss: { id: 'connection_loss', title: 'Ward connection loss', targetBedId: null, durationSeconds: 8, steps: [
    { atSecond: 2, label: 'Connection lost; displays freeze', kind: 'connection', connection: 'disconnected' },
    { atSecond: 7, label: 'Connection restored', kind: 'connection', connection: 'live' },
  ] },
}

export function createScenarioBaseline(bedId: string): Bed {
  const bed = getFixture(bedId)
  return {
    ...bed,
    verdict: 'NORMAL', priority: 'none', trust: 96, trustState: 'trusted', isolated: false,
    reason: 'Vitals within configured range', requestedAction: 'Continue routine monitoring',
    acknowledgement: 'none', connection: 'live', lastUpdatedAt: Date.now(),
    trustedSnapshot: null,
  }
}
