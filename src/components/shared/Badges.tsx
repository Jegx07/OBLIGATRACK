import { cn } from '@/lib/utils'
import { classifyDeadline, deadlineLabel } from '@/lib/deadlineEngine'
import { riskLabel } from '@/lib/riskEngine'
import type { ContractStatus, ObligationStatus, ObligationPriority, RiskLevel, Obligation } from '@/types'

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn('status-pill', className)}>{children}</span>
}

const contractStatusStyles: Record<ContractStatus, { pill: string; dot: string; label: string }> = {
  draft:      { pill: 'bg-slate-50 text-slate-600 border-slate-200',          dot: 'bg-slate-400', label: 'Draft' },
  active:     { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',    dot: 'bg-emerald-500', label: 'Active' },
  expired:    { pill: 'bg-red-50 text-red-700 border-red-200',                dot: 'bg-red-500',   label: 'Expired' },
  terminated: { pill: 'bg-gray-100 text-gray-500 border-gray-200',            dot: 'bg-gray-400',  label: 'Terminated' },
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const s = contractStatusStyles[status]
  return (
    <Pill className={s.pill}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', s.dot)} />
      {s.label}
    </Pill>
  )
}

const obligationStatusStyles: Record<ObligationStatus, { pill: string; dot: string; label: string }> = {
  pending:     { pill: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500',   label: 'Pending' },
  in_progress: { pill: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500',    label: 'In Progress' },
  completed:   { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' },
  cancelled:   { pill: 'bg-gray-100 text-gray-500 border-gray-200',      dot: 'bg-gray-400',    label: 'Cancelled' },
}

export function ObligationStatusBadge({ status }: { status: ObligationStatus }) {
  const s = obligationStatusStyles[status]
  return (
    <Pill className={s.pill}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', s.dot)} />
      {s.label}
    </Pill>
  )
}

const priorityStyles: Record<ObligationPriority, string> = {
  low:      'bg-slate-50 text-slate-600 border-slate-200',
  medium:   'bg-blue-50 text-blue-700 border-blue-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
}

export function PriorityBadge({ priority }: { priority: ObligationPriority }) {
  const labels: Record<ObligationPriority, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }
  return <Pill className={priorityStyles[priority]}>{labels[priority]}</Pill>
}

const deadlineStyles: Record<string, string> = {
  completed:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:   'bg-gray-100 text-gray-500 border-gray-200',
  overdue:     'bg-red-50 text-red-700 border-red-200',
  due_today:   'bg-orange-50 text-orange-700 border-orange-200',
  urgent:      'bg-orange-50 text-orange-700 border-orange-200',
  approaching: 'bg-amber-50 text-amber-700 border-amber-200',
  on_track:    'bg-blue-50 text-blue-700 border-blue-200',
  no_deadline: 'bg-gray-100 text-gray-500 border-gray-200',
}

export function DeadlineBadge({ obligation }: { obligation: Obligation }) {
  const status = classifyDeadline(obligation)
  return <Pill className={deadlineStyles[status]}>{deadlineLabel(status)}</Pill>
}

const riskStyles: Record<RiskLevel, string> = {
  high:   'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low:    'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const labels: Record<RiskLevel, string> = { high: 'High Risk', medium: 'Medium Risk', low: 'Low Risk' }
  return <Pill className={riskStyles[level]}>{labels[level]}</Pill>
}
