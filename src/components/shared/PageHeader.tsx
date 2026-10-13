interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  badge?: React.ReactNode
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
