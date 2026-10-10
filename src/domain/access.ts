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
  | 'call_bedside_nurse'
export type ScreenId = 'ward' | 'bed' | 'alerts' | 'census' | 'security' | 'tickets' | 'briefing' | 'log' | 'demo' | 'telegram'

export const ROLE_LABELS: Record<Role, string> = {
  nurse: 'Nurse', doctor: 'Doctor / tele-ICU', it: 'IT',
  biomedical: 'Biomedical engineer', operator: 'Operator',
}

// Provisional configuration pending Aditya Singh's final role matrix.
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  nurse: ['acknowledge_alert', 'confirm_bedside_status'],
  doctor: ['acknowledge_alert', 'call_bedside_nurse'],
  it: ['isolate_device', 'undo_isolation', 'capture_incident_evidence', 'contain_incident', 'resolve_incident', 'review_report'],
  biomedical: [],
  operator: [],
}

export const ROLE_SCREENS: Record<Role, readonly ScreenId[]> = {
  nurse: ['ward', 'bed', 'alerts', 'briefing', 'log', 'telegram'],
  doctor: ['ward', 'bed', 'alerts', 'census', 'briefing', 'log', 'telegram'],
  it: ['ward', 'bed', 'security', 'log', 'telegram'],
  biomedical: ['tickets', 'log'],
  operator: ['log', 'demo'],
}

export const ROLE_HOME: Record<Role, string> = {
  nurse: '/ward', doctor: '/census', it: '/security', biomedical: '/tickets', operator: '/demo',
}

export function can(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function canViewScreen(role: Role, screen: ScreenId) {
  return ROLE_SCREENS[role].includes(screen)
}
