export const ROLES = ['nurse', 'doctor', 'it', 'biomedical', 'operator'] as const
export type Role = (typeof ROLES)[number]
export type Permission =
  | 'acknowledge_alert'
  | 'confirm_bedside_status'
  | 'isolate_device'
  | 'undo_isolation'
  | 'capture_incident_evidence'
  | 'contain_incident'
  | 'resolve_incident'
  | 'review_report'
export type ScreenId = 'ward' | 'alerts' | 'census' | 'security' | 'tickets' | 'briefing' | 'log' | 'demo' | 'telegram'

export const ROLE_LABELS: Record<Role, string> = {
  nurse: 'Nurse', doctor: 'Doctor / tele-ICU', it: 'IT',
  biomedical: 'Biomedical engineer', operator: 'Operator',
}

// Provisional configuration pending Aditya Singh's final role matrix.
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  nurse: ['acknowledge_alert', 'confirm_bedside_status'],
  doctor: ['acknowledge_alert', 'confirm_bedside_status'],
  it: ['acknowledge_alert', 'isolate_device', 'undo_isolation', 'capture_incident_evidence', 'contain_incident', 'resolve_incident', 'review_report'],
  biomedical: ['acknowledge_alert'],
  operator: ['acknowledge_alert', 'isolate_device', 'undo_isolation', 'capture_incident_evidence', 'contain_incident', 'resolve_incident', 'review_report'],
}

export const ROLE_SCREENS: Record<Role, readonly ScreenId[]> = {
  nurse: ['ward', 'alerts', 'log', 'telegram'],
  doctor: ['ward', 'alerts', 'census', 'briefing', 'log', 'telegram'],
  it: ['ward', 'security', 'log'],
  biomedical: ['ward', 'tickets', 'log'],
  operator: ['ward', 'census', 'security', 'tickets', 'briefing', 'log', 'demo', 'telegram'],
}

export function can(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function canViewScreen(role: Role, screen: ScreenId) {
  return ROLE_SCREENS[role].includes(screen)
}
