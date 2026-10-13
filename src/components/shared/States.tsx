import { Loader2, AlertCircle, SearchX, FolderOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton, TableRowSkeleton, MetricCardSkeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

export { MetricCardSkeleton }

export function LoadingSpinner({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-card overflow-hidden">
      <table className="w-full">
        <thead className="border-b bg-muted/40">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-3 w-20 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-40 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="rounded-xl border border-border/60 bg-card shadow-card p-5">
            <Skeleton className="h-5 w-40 mb-4 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-3 border-b border-border/40 last:border-0">
                <Skeleton className="h-4 flex-1 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card shadow-card p-5">
            <Skeleton className="h-5 w-32 mb-3 rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-2.5 border-b border-border/40 last:border-0">
                <Skeleton className="h-4 w-full mb-1 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-3"
    >
      <div className="p-3 rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="font-medium text-foreground">Something went wrong</p>
      <p className="text-sm text-muted-foreground max-w-sm text-center">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 mt-1">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      )}
    </motion.div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = FolderOpen,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ElementType
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-3 text-center"
    >
      <div className="p-4 rounded-2xl bg-muted/60">
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  )
}

export function NoResultsState({ onClear }: { onClear?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 gap-3"
    >
      <div className="p-4 rounded-2xl bg-muted/60">
        <SearchX className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <p className="font-medium text-foreground">No results found</p>
      <p className="text-sm text-muted-foreground">Try adjusting your filters or search term.</p>
      {onClear && <Button variant="ghost" size="sm" onClick={onClear}>Clear filters</Button>}
    </motion.div>
  )
}
