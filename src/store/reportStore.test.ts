import { beforeEach, describe, expect, it } from 'vitest'
import { configureCommandAdapter } from '../adapters/commandGateway'
import { MockCommandAdapter } from '../adapters/mockCommandAdapter'
import { reportPdfDataUrl, reportReadyToSend, resetReportStore, useReportStore } from './reportStore'

describe('CERT-In report workflow', () => {
  beforeEach(() => { configureCommandAdapter(new MockCommandAdapter()); resetReportStore(); useReportStore.getState().ensureReport('B07') })

  it('keeps mark-sent disabled until every human checklist item is complete', () => {
    let report = useReportStore.getState().reports.B07
    expect(reportReadyToSend(report)).toBe(false)
    useReportStore.getState().updateField('B07', 'factsChecked', true)
    useReportStore.getState().updateField('B07', 'evidenceAttached', true)
    useReportStore.getState().updateField('B07', 'approver', 'Antara Gupta')
    report = useReportStore.getState().reports.B07
    expect(reportReadyToSend(report)).toBe(true)
    expect(reportPdfDataUrl(report)).toMatch(/^data:application\/pdf/)
  })

  it('saves locally and records human sending without auto-submission', async () => {
    useReportStore.getState().updateField('B07', 'factsChecked', true)
    useReportStore.getState().updateField('B07', 'evidenceAttached', true)
    useReportStore.getState().updateField('B07', 'approver', 'Antara Gupta')
    expect(await useReportStore.getState().saveReport('B07')).toBe(true)
    expect(useReportStore.getState().reports.B07.savedAt).not.toBeNull()
    expect(await useReportStore.getState().markSent('B07', 'Antara Gupta')).toBe(true)
    expect(useReportStore.getState().reports.B07).toMatchObject({ sentBy: 'Antara Gupta' })
  })
})
