import { z } from 'zod'
import type { CommandAdapter, CommandReceipt, FrontendCommand } from './commandContracts'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type EndpointResolver = (command: FrontendCommand) => string

const receiptSchema = z.object({ command_id: z.string(), accepted_at: z.number() })

// Provisional paths are isolated here until the final action endpoint list is supplied.
const defaultEndpoint: EndpointResolver = (command) => {
  switch (command.type) {
    case 'acknowledge_alert': return `/beds/${command.bedId}/acknowledge`
    case 'escalate_alert': return `/alerts/${command.alertId}/escalate`
    case 'confirm_bedside': return `/beds/${command.bedId}/bedside-check`
    case 'record_manual_reading': return `/beds/${command.bedId}/manual-reading`
    case 'isolate_device': return `/devices/${command.deviceId}/isolate`
    case 'fleet_hunt': return '/fleet-hunt'
    case 'undo_action': return `/actions/${command.originalActionId}/undo`
    case 'capture_evidence': return `/incidents/${command.bedId}/evidence`
    case 'contain_incident': return `/incidents/${command.bedId}/contain`
    case 'resolve_incident': return `/incidents/${command.bedId}/resolve`
    case 'create_ticket': return '/tickets'
    case 'update_ticket': return `/tickets/${command.ticketId}`
    case 'review_report': return `/incidents/${command.incidentId}/report/review`
    case 'save_report': return `/reports/${command.incidentId}`
    case 'mark_report_sent': return `/reports/${command.incidentId}/mark-sent`
    case 'call_bedside_nurse': return `/beds/${command.bedId}/call-nurse`
    case 'assign_clinician': return `/beds/${command.bedId}/assignment`
    case 'update_assignment': return `/beds/${command.bedId}/assignment/status`
  }
}

export class HttpCommandAdapter implements CommandAdapter {
  private readonly baseUrl: string
  private readonly fetcher: FetchLike
  private readonly resolveEndpoint: EndpointResolver

  constructor(baseUrl = '/api', fetcher: FetchLike = fetch, resolveEndpoint: EndpointResolver = defaultEndpoint) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.fetcher = fetcher
    this.resolveEndpoint = resolveEndpoint
  }

  async execute(command: FrontendCommand, signal?: AbortSignal): Promise<CommandReceipt> {
    const response = await this.fetcher(`${this.baseUrl}${this.resolveEndpoint(command)}`, {
      method: command.type === 'update_ticket' || command.type === 'save_report' ? 'PATCH' : 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal,
    })
    if (!response.ok) throw new Error(`Command ${command.type} failed with status ${response.status}`)
    const receipt = receiptSchema.parse(await response.json())
    return { commandId: receipt.command_id, acceptedAt: receipt.accepted_at, status: 'accepted' }
  }
}
