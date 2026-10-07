export const ROLES = ['nurse', 'doctor', 'it', 'biomedical', 'operator'] as const
export type Role = (typeof ROLES)[number]
export type Permission = 'acknowledge_alert' | 'confirm_bedside_status' | 'isolate_device' | 'undo_isolation'

export const ROLE_LABELS: Record<Role, string> = {
  nurse: 'Nurse', doctor: 'Doctor / tele-ICU', it: 'IT',
  biomedical: 'Biomedical engineer', operator: 'Operator',
}

// Provisional configuration pending Aditya Singh's final role matrix.
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  nurse: ['acknowledge_alert', 'confirm_bedside_status'],
  doctor: ['acknowledge_alert', 'confirm_bedside_status'],
  it: ['acknowledge_alert', 'isolate_device', 'undo_isolation'],
  biomedical: ['acknowledge_alert'],
  operator: ['acknowledge_alert', 'isolate_device', 'undo_isolation'],
}

export function can(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission)
}
