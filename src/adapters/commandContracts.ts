import type { CertReportDraft } from '../domain/security'

export type FrontendCommand =
  | { type: 'acknowledge_alert'; bedId: string }
  | { type: 'escalate_alert'; alertId: string; bedId: string }
  | { type: 'confirm_bedside'; bedId: string; status: 'patient_ok' | 'patient_not_ok' }
  | { type: 'record_manual_reading'; bedId: string; heartRate: number; spo2: number; notes: string }
  | { type: 'isolate_device'; deviceId: string; bedId: string }
  | { type: 'fleet_hunt'; model: string }
  | { type: 'undo_action'; bedId: string; originalActionId: string }
  | { type: 'capture_evidence'; bedId: string }
  | { type: 'contain_incident'; bedId: string }
  | { type: 'resolve_incident'; bedId: string; reason: string }
  | { type: 'create_ticket'; bedId: string; issue: string }
  | { type: 'update_ticket'; ticketId: string; status: 'open' | 'assigned' | 'resolved' }
  | { type: 'review_report'; incidentId: string }
  | { type: 'save_report'; incidentId: string; report: CertReportDraft }
  | { type: 'mark_report_sent'; incidentId: string; sentBy: string }
  | { type: 'call_bedside_nurse'; bedId: string; requestedBy: string }
  | { type: 'assign_clinician'; bedId: string; clinicianId: string }
  | { type: 'update_assignment'; bedId: string; status: 'assigned' | 'on_my_way' | 'reviewing' | 'complete' }

export interface CommandReceipt {
  commandId: string
  acceptedAt: number
  status: 'accepted'
}

export interface CommandAdapter {
  execute(command: FrontendCommand, signal?: AbortSignal): Promise<CommandReceipt>
}
