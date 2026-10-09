import type { ReactNode } from 'react'

export function OperationalPage({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return <main id="main-content" className="simple-page operational-page"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children}</main>
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="data-table-wrap"><table className="data-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}
