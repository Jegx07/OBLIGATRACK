import { classifyDeadline } from './deadlineEngine'
import type { Obligation, RiskScore, RiskLevel } from '@/types'

/**
 * Operational risk scoring — not a legal risk assessment.
 * Score is capped at 100.
 *
 * Points:
 *   +50  obligation is overdue
 *   +25  internal owner is missing
 *   +20  deadline is within three days (urgent or due today)
 *   +20  deadline is missing
 *   +10  priority is high or critical
 */
export function scoreRisk(obligation: Obligation): RiskScore {
  const reasons: string[] = []
  let score = 0

  const deadline = classifyDeadline(obligation)

  // Overdue — only for non-completed, non-cancelled
  if (deadline === 'overdue') {
    score += 50
    reasons.push('Obligation is overdue')
  }

  // Missing owner
  if (!obligation.owner_id) {
    score += 25
    reasons.push('No internal owner assigned')
  }

  // Deadline within three days
  if (deadline === 'urgent' || deadline === 'due_today') {
    score += 20
    reasons.push('Deadline is within three days')
  }

  // Missing deadline
  if (deadline === 'no_deadline') {
    score += 20
    reasons.push('No due date set')
  }

  // High/critical priority
  if (obligation.priority === 'high' || obligation.priority === 'critical') {
    score += 10
    reasons.push(`Priority is ${obligation.priority}`)
  }

  const capped = Math.min(score, 100)

  let level: RiskLevel
  if (capped >= 60) level = 'high'
  else if (capped >= 30) level = 'medium'
  else level = 'low'

  return { score: capped, level, reasons }
}

/**
 * Tailwind colour classes for a risk badge.
 */
export function riskColor(level: RiskLevel): string {
  switch (level) {
    case 'high':   return 'bg-red-100 text-red-800 border-red-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':    return 'bg-green-100 text-green-800 border-green-200'
  }
}

export function riskLabel(level: RiskLevel): string {
  switch (level) {
    case 'high':   return 'High Risk'
    case 'medium': return 'Medium Risk'
    case 'low':    return 'Low Risk'
  }
}
