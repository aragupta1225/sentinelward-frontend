import { z } from 'zod'
import type { NurseWorkload, ShiftBriefing } from '../domain/briefing'

export interface BriefingAdapter {
  getBriefing(since: string, signal?: AbortSignal): Promise<ShiftBriefing>
  getWorkload(hours: number, signal?: AbortSignal): Promise<NurseWorkload[]>
}

const briefingSchema = z.object({
  since: z.string(), generated_by: z.literal('IBM Granite'), summary: z.string(), incidents: z.number().int().nonnegative(),
  untrusted_beds: z.number().int().nonnegative(), open_tickets: z.number().int().nonnegative(),
  blind_time: z.array(z.object({ bed_id: z.string(), minutes: z.number().nonnegative() })),
})
const workloadSchema = z.object({ nurses: z.array(z.object({ nurse_id: z.string(), nurse_name: z.string(), alarms_last_2h: z.number().int().nonnegative() })) })
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export class MockBriefingAdapter implements BriefingAdapter {
  async getBriefing(since: string): Promise<ShiftBriefing> {
    return { since, generatedBy: 'IBM Granite', summary: 'Three device-integrity incidents were investigated. Three beds remain untrusted, two biomedical jobs are open, and bedside teams should use trusted equipment until checks are recorded.', incidents: 3, untrustedBeds: 3, openTickets: 2, blindTime: [{ bedId: 'B07', minutes: 6 }, { bedId: 'B08', minutes: 4 }, { bedId: 'B09', minutes: 8 }, { bedId: 'B10', minutes: 3 }] }
  }
  async getWorkload(_hours: number): Promise<NurseWorkload[]> {
    return [{ nurseId: 'n-priya', nurseName: 'Nurse Priya', alarmsLastTwoHours: 46 }, { nurseId: 'n-ravi', nurseName: 'Nurse Ravi', alarmsLastTwoHours: 31 }, { nurseId: 'n-kapoor', nurseName: 'Nurse Kapoor', alarmsLastTwoHours: 18 }, { nurseId: 'n-das', nurseName: 'Nurse Das', alarmsLastTwoHours: 42 }]
  }
}

export class HttpBriefingAdapter implements BriefingAdapter {
  private readonly baseUrl: string
  private readonly fetcher: FetchLike

  constructor(baseUrl = '/api', fetcher: FetchLike = fetch) {
    this.baseUrl = baseUrl
    this.fetcher = fetcher
  }
  async getBriefing(since: string, signal?: AbortSignal): Promise<ShiftBriefing> {
    const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, '')}/briefing?since=${encodeURIComponent(since)}`, { headers: { Accept: 'application/json' }, signal })
    if (!response.ok) throw new Error(`Briefing request failed with status ${response.status}`)
    const value = briefingSchema.parse(await response.json())
    return { since: value.since, generatedBy: value.generated_by, summary: value.summary, incidents: value.incidents, untrustedBeds: value.untrusted_beds, openTickets: value.open_tickets, blindTime: value.blind_time.map((entry) => ({ bedId: entry.bed_id, minutes: entry.minutes })) }
  }
  async getWorkload(hours: number, signal?: AbortSignal): Promise<NurseWorkload[]> {
    const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, '')}/workload?hours=${hours}`, { headers: { Accept: 'application/json' }, signal })
    if (!response.ok) throw new Error(`Workload request failed with status ${response.status}`)
    return workloadSchema.parse(await response.json()).nurses.map((entry) => ({ nurseId: entry.nurse_id, nurseName: entry.nurse_name, alarmsLastTwoHours: entry.alarms_last_2h }))
  }
}
