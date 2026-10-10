import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={joinClasses('ui-page-header', className)}>
      <div className="ui-page-header__copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="ui-page-header__description">{description}</p>}
      </div>
      {actions && <div className="ui-page-header__actions">{actions}</div>}
    </header>
  )
}

export type StatusTone = 'neutral' | 'positive' | 'info' | 'warning' | 'critical'

export function StatusChip({ children, tone = 'neutral', dot = false, className }: {
  children: ReactNode
  tone?: StatusTone
  dot?: boolean
  className?: string
}) {
  return <span className={joinClasses('ui-status-chip', `ui-status-chip--${tone}`, className)}>{dot && <i aria-hidden="true" />}{children}</span>
}

export function ActionButton({ tone = 'default', className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'default' | 'primary' | 'danger' | 'quiet'
}) {
  return <button type={type} className={joinClasses('ui-action', `ui-action--${tone}`, className)} {...props} />
}

export function Panel({ as = 'section', className, ...props }: HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section'
}) {
  const Element = as
  return <Element className={joinClasses('ui-panel', className)} {...props} />
}

export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={joinClasses('ui-empty-state', className)}>{children}</p>
}
