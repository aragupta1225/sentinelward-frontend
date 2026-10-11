import type { Bed } from '../domain/ward'
import type { DemoScenario, ScenarioId } from '../domain/scenarios'
import { getFixture } from './fixtures'

export const DEMO_SCENARIOS: Record<ScenarioId, DemoScenario> = {
  full_ward_script: { id: 'full_ward_script', title: 'Full ward script (12 min)', targetBedId: null, durationSeconds: 720, steps: [
    { atSecond: 60, label: 'Bed 3 heart rate begins rising', kind: 'bed_update', bedId: 'B03', patch: { priority: 'medium', readings: { heartRate: 118, spo2: 93, systolic: 106, diastolic: 67 }, reason: 'Vital signs moving outside configured range' } },
    { atSecond: 120, label: 'Bed 3 clinical emergency raised', kind: 'bed_update', bedId: 'B03', patch: { verdict: 'EMERGENCY', priority: 'high', readings: { heartRate: 148, spo2: 86, systolic: 94, diastolic: 60 }, reason: 'HR 148 and SpO₂ falling', requestedAction: 'Urgent bedside assessment' } },
    { atSecond: 210, label: 'Bed 4 loose sensor identified and alarm safely silenced', kind: 'bed_update', bedId: 'B04', patch: { verdict: 'LOOSE_SENSOR', priority: 'low', trust: 68, reason: 'Intermittent ECG contact', requestedAction: 'Reseat ECG leads' } },
    { atSecond: 300, label: 'Bed 5 drifting blood-pressure sensor identified', kind: 'bed_update', bedId: 'B05', patch: { verdict: 'DRIFTING', priority: 'medium', trust: 61, reason: 'Blood-pressure baseline drifting', requestedAction: 'Verify and re-zero sensor' } },
    { atSecond: 390, label: 'MON-07 replay attack isolated; Bed 7 marked untrusted', kind: 'bed_update', bedId: 'B07', patch: { verdict: 'DEVICE_ATTACK', priority: 'none', trust: 18, trustState: 'untrusted', isolated: true, reason: 'Replay attack suspected', requestedAction: 'Use trusted bedside equipment' } },
    { atSecond: 480, label: 'Bed 9 fake flatline conflicts with pulse witness', kind: 'bed_update', bedId: 'B09', patch: { verdict: 'TAMPERING', priority: 'medium', trust: 22, trustState: 'untrusted', reason: 'Flatline conflicts with pulse signal', requestedAction: 'Check patient by hand' } },
    { atSecond: 570, label: 'Repeated Bed 10 events merge into one flood alert', kind: 'event', bedId: 'B10' },
    { atSecond: 720, label: 'Full ward script complete', kind: 'event' },
  ] },
  emergency: { id: 'emergency', title: 'Real emergency only', targetBedId: 'B03', durationSeconds: 12, steps: [
    { atSecond: 3, label: 'Heart rate begins rising', kind: 'bed_update', patch: { priority: 'medium', readings: { heartRate: 118, spo2: 93, systolic: 106, diastolic: 67 }, reason: 'Vital signs moving outside configured range' } },
    { atSecond: 8, label: 'Clinical emergency verdict raised', kind: 'bed_update', patch: { verdict: 'EMERGENCY', priority: 'high', readings: { heartRate: 148, spo2: 86, systolic: 94, diastolic: 60 }, reason: 'HR 148 and SpO₂ falling', requestedAction: 'Urgent bedside assessment' } },
  ] },
  loose_sensor: { id: 'loose_sensor', title: 'Loose sensor', targetBedId: 'B04', durationSeconds: 10, steps: [
    { atSecond: 3, label: 'ECG contact becomes intermittent', kind: 'bed_update', patch: { trust: 72, priority: 'low', reason: 'Intermittent ECG contact' } },
    { atSecond: 7, label: 'Loose sensor verdict raised; false alarm silenced', kind: 'bed_update', patch: { verdict: 'LOOSE_SENSOR', priority: 'low', trust: 68, requestedAction: 'Reseat ECG leads' } },
  ] },
  drifting: { id: 'drifting', title: 'Drift', targetBedId: 'B05', durationSeconds: 12, steps: [
    { atSecond: 2, label: 'SpO₂ baseline starts drifting', kind: 'bed_update', patch: { trust: 82, reason: 'SpO₂ baseline moving gradually' } },
    { atSecond: 6, label: 'Trust continues to decline', kind: 'bed_update', patch: { trust: 68, priority: 'medium' } },
    { atSecond: 10, label: 'Drifting sensor verdict raised', kind: 'bed_update', patch: { verdict: 'DRIFTING', trust: 61, requestedAction: 'Verify sensor placement' } },
  ] },
  replay_attack: { id: 'replay_attack', title: 'Replay attack', targetBedId: 'B07', durationSeconds: 12, steps: [
    { atSecond: 3, label: 'Repeated network sequence detected', kind: 'event' },
    { atSecond: 8, label: 'Replay attack suspected; device isolated', kind: 'bed_update', patch: { verdict: 'DEVICE_ATTACK', priority: 'none', trust: 18, trustState: 'untrusted', isolated: true, reason: 'Replay attack suspected', requestedAction: 'Use trusted bedside equipment' } },
  ] },
  fake_flatline: { id: 'fake_flatline', title: 'Fake flatline', targetBedId: 'B09', durationSeconds: 10, steps: [
    { atSecond: 3, label: 'Flatline conflicts with trusted pulse', kind: 'bed_update', patch: { trust: 22, trustState: 'untrusted', priority: 'medium', reason: 'Flatline conflicts with pulse signal' } },
    { atSecond: 7, label: 'Tampering verdict raised; last trusted values retained', kind: 'bed_update', patch: { verdict: 'TAMPERING', requestedAction: 'Verify patient and device at bedside' } },
  ] },
  flood: { id: 'flood', title: 'Flood', targetBedId: 'B10', durationSeconds: 10, steps: [
    { atSecond: 2, label: 'Burst of repeated monitor messages detected', kind: 'event' },
    { atSecond: 5, label: 'Repeats merged into one Bed 10 alert', kind: 'bed_update', patch: { verdict: 'UNSURE', priority: 'medium', reason: 'Message flood reduced signal confidence', requestedAction: 'Check patient at bedside' } },
    { atSecond: 8, label: 'Excess messages rate-limited; patient display retained', kind: 'event' },
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
