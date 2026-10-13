import { differenceInCalendarDays, isToday, parseISO, startOfDay } from 'date-fns'
import type { Obligation, DeadlineStatus } from '@/types'

/**
 * Classify an obligation's deadline status.
 * Uses the current local calendar date as reference.
 * Rules are applied in priority order.
 */
export function classifyDeadline(obligation: Obligation): DeadlineStatus {
  if (obligation.status === 'completed') return 'completed'
  if (obligation.status === 'cancelled') return 'cancelled'

  if (!obligation.due_date) return 'no_deadline'

  const today = startOfDay(new Date())
  const dueDate = startOfDay(parseISO(obligation.due_date))

  if (isToday(dueDate)) return 'due_today'

  const daysUntilDue = differenceInCalendarDays(dueDate, today)

  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue <= 3) return 'urgent'
  if (daysUntilDue <= 7) return 'approaching'
  return 'on_track'
}

/**
 * Human-readable label for a deadline status.
 */
export function deadlineLabel(status: DeadlineStatus): string {
  switch (status) {
    case 'completed':   return 'Completed'
    case 'cancelled':   return 'Cancelled'
    case 'overdue':     return 'Overdue'
    case 'due_today':   return 'Due Today'
    case 'urgent':      return 'Urgent'
    case 'approaching': return 'Approaching'
    case 'on_track':    return 'On Track'
    case 'no_deadline': return 'No Deadline'
  }
}

/**
 * Tailwind colour classes for deadline badge.
 */
export function deadlineColor(status: DeadlineStatus): string {
  switch (status) {
    case 'completed':   return 'bg-green-100 text-green-800 border-green-200'
    case 'cancelled':   return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'overdue':     return 'bg-red-100 text-red-800 border-red-200'
    case 'due_today':   return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'urgent':      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'approaching': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'on_track':    return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'no_deadline': return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

/**
 * Returns days until due. Negative = overdue. Null if no due date.
 */
export function daysUntilDue(obligation: Obligation): number | null {
  if (!obligation.due_date) return null
  const today = startOfDay(new Date())
  const dueDate = startOfDay(parseISO(obligation.due_date))
  return differenceInCalendarDays(dueDate, today)
}

/**
 * Returns true if the obligation requires attention in listings.
 */
export function requiresAttention(obligation: Obligation): boolean {
  const status = classifyDeadline(obligation)
  return ['overdue', 'due_today', 'urgent', 'no_deadline'].includes(status) ||
    obligation.owner_id === null
}
