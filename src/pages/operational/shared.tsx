import type { ReactNode } from 'react'
import { EmptyState, PageHeader } from '../../components/ui'

export function OperationalPage({ title, eyebrow, description, actions, children }: {
  title: string
  eyebrow: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return <main id="main-content" className="simple-page operational-page"><PageHeader title={title} eyebrow={eyebrow} description={description} actions={actions} />{children}</main>
}

export function DataTable({ headers, children, emptyMessage }: { headers: string[]; children: ReactNode; emptyMessage?: string }) {
  return <div className="data-table-wrap"><table className="data-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table>{emptyMessage && <EmptyState>{emptyMessage}</EmptyState>}</div>
}
