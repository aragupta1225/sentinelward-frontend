import { create } from 'zustand'
import { dispatchCommand } from '../adapters/commandGateway'
import type { CertReportDraft } from '../domain/security'
import { useSecurityStore } from './securityStore'

type EditableReportField = Exclude<keyof CertReportDraft, 'incidentId' | 'savedAt' | 'sentAt' | 'sentBy'>

interface ReportState {
  reports: Record<string, CertReportDraft>
  pending: 'save' | 'send' | null
  error: string | null
  ensureReport: (bedId: string) => void
  updateField: (bedId: string, field: EditableReportField, value: string | boolean) => void
  saveReport: (bedId: string) => Promise<boolean>
  markSent: (bedId: string, sentBy: string) => Promise<boolean>
}

function buildReport(bedId: string): CertReportDraft {
  const incident = useSecurityStore.getState().incidents.find((item) => item.bedId === bedId)
  return {
    incidentId: incident?.id ?? `INC-${bedId}`, organisation: 'SentinelWard Demo Hospital', contact: 'IT Security Operations',
    noticedAt: new Date(incident?.detectedAt ?? Date.now()).toISOString(), occurredAt: new Date(incident?.detectedAt ?? Date.now()).toISOString(),
    incidentType: incident?.summary ?? 'Medical-device integrity incident', affectedSystems: `Monitor MON-${bedId.slice(1)} at ${bedId}`,
    description: incident?.summary ?? 'Incident details unavailable.', actionsTaken: incident?.status === 'contained' ? 'Device isolated; clinical monitoring remained active.' : 'Investigation opened.',
    evidenceList: incident?.evidence.map((item) => `${item.filename} · SHA-256 ${item.sha256}`).join('\n') ?? '',
    factsChecked: false, evidenceAttached: false, approver: '', savedAt: null, sentAt: null, sentBy: null,
  }
}

export function reportReadyToSend(report: CertReportDraft) {
  return report.factsChecked && report.evidenceAttached && report.approver.trim().length > 0 && report.sentAt === null
}

export function reportPdfDataUrl(report: CertReportDraft) {
  const lines = [
    'CERT-In incident report draft', `Incident: ${report.incidentId}`, `Organisation: ${report.organisation}`, `Contact: ${report.contact}`,
    `Time noticed: ${report.noticedAt}`, `Time occurred: ${report.occurredAt}`, `Type: ${report.incidentType}`,
    `Affected systems: ${report.affectedSystems}`, `Description: ${report.description}`, `Actions: ${report.actionsTaken}`, `Evidence: ${report.evidenceList}`,
    'Human review and submission required.',
  ]
  return `data:application/pdf;charset=utf-8,${encodeURIComponent(`%PDF-1.4\n% SentinelWard simulated frontend export\n${lines.join('\n')}\n%%EOF`)}`
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: {}, pending: null, error: null,
  ensureReport: (bedId) => set((state) => state.reports[bedId] ? state : { reports: { ...state.reports, [bedId]: buildReport(bedId) } }),
  updateField: (bedId, field, value) => set((state) => ({ reports: { ...state.reports, [bedId]: { ...(state.reports[bedId] ?? buildReport(bedId)), [field]: value } } })),
  saveReport: async (bedId) => {
    const report = get().reports[bedId] ?? buildReport(bedId)
    set({ pending: 'save', error: null })
    if (!await dispatchCommand({ type: 'save_report', incidentId: report.incidentId, report })) { set({ pending: null, error: 'Draft save failed. Local edits remain visible.' }); return false }
    set((state) => ({ reports: { ...state.reports, [bedId]: { ...report, savedAt: Date.now() } }, pending: null }))
    return true
  },
  markSent: async (bedId, sentBy) => {
    const report = get().reports[bedId] ?? buildReport(bedId)
    if (!reportReadyToSend(report)) { set({ error: 'Complete facts checked, evidence attached, and approver before marking sent.' }); return false }
    set({ pending: 'send', error: null })
    if (!await dispatchCommand({ type: 'mark_report_sent', incidentId: report.incidentId, sentBy })) { set({ pending: null, error: 'Mark-sent command failed. The report remains unsent.' }); return false }
    const sentAt = Date.now()
    set((state) => ({ reports: { ...state.reports, [bedId]: { ...report, sentAt, sentBy, savedAt: report.savedAt ?? sentAt } }, pending: null }))
    return true
  },
}))

export function resetReportStore() { useReportStore.setState({ reports: {}, pending: null, error: null }) }
