import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md skeleton-shimmer", className)}
      {...props}
    />
  )
}

// Table row skeleton
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  )
}

// Card metric skeleton
export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-card">
      <Skeleton className="h-8 w-8 rounded-lg mb-3" />
      <Skeleton className="h-7 w-16 mb-1.5" />
      <Skeleton className="h-3.5 w-24" />
    </div>
  )
}

export { Skeleton }
