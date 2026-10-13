import { addDays, format, isValid, parseISO } from 'date-fns'
import type { ClauseExtractionResult, ObligationType, TriggerType } from '@/types'

const DATE_PATTERN = /(\d{4}-\d{2}-\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/gi

function parseFoundDate(raw: string): string | null {
  const isoMatch = raw.match(/^\d{4}-\d{2}-\d{2}$/)
  if (isoMatch) {
    const d = parseISO(raw)
    return isValid(d) ? format(d, 'yyyy-MM-dd') : null
  }
  const d = new Date(raw)
  if (isValid(d)) return format(d, 'yyyy-MM-dd')
  return null
}

function extractObligationType(text: string): ObligationType {
  const lower = text.toLowerCase()
  if (lower.includes('pay') || lower.includes('invoice') || lower.includes('remit')) return 'payment'
  if (lower.includes('deliver') || lower.includes('provide') || lower.includes('submit')) return 'delivery'
  if (lower.includes('report') || lower.includes('notify') || lower.includes('inform')) return 'reporting'
  if (lower.includes('renew') || lower.includes('renewal')) return 'renewal'
  if (lower.includes('comply') || lower.includes('compliance') || lower.includes('adhere')) return 'compliance'
  if (lower.includes('service') || lower.includes('maintain') || lower.includes('support')) return 'service'
  return 'other'
}

export function extractClause(rawClause: string): ClauseExtractionResult {
  const result: ClauseExtractionResult = { confidence: {}, warnings: [] }

  if (!rawClause || rawClause.trim().length < 5) {
    result.warnings.push('Clause text is too short to extract meaningful information.')
    return result
  }

  result.obligation_type = extractObligationType(rawClause)
  result.confidence.obligation_type = 'extracted'

  const withinNDaysRelative = rawClause.match(/within\s+(\d+)\s+(?:calendar\s+)?days?\s+(?:from|of|after)\s+(?:the\s+)?(?:effective|signing|commencement|execution|start)\s+date/i)
  const withinNDaysFromDate = rawClause.match(/within\s+(\d+)\s+(?:calendar\s+)?days?\s+(?:from|of|after)\s+([^,.;]+)/i)
  const dueOnDate = rawClause.match(/(?:due|payable|required|delivery)\s+(?:on|by)\s+([^,.;]+)/i)
  const noLaterThan = rawClause.match(/no\s+later\s+than\s+([^,.;]+)/i)
  const onOrBefore = rawClause.match(/on\s+or\s+before\s+([^,.;]+)/i)
  const renewalOn = rawClause.match(/renew(?:al|s)?\s+(?:on|by|date(?:\s+is)?)\s+([^,.;]+)/i)

  if (withinNDaysRelative) {
    const days = parseInt(withinNDaysRelative[1], 10)
    result.duration_days = days
    result.confidence.duration_days = 'extracted'
    result.trigger_type = 'relative_to_start'
    result.confidence.trigger_type = 'extracted'
    result.warnings.push('Trigger date is relative to the contract start/effective date. Please confirm the trigger date to calculate the due date.')
  } else if (withinNDaysFromDate) {
    const days = parseInt(withinNDaysFromDate[1], 10)
    result.duration_days = days
    result.confidence.duration_days = 'extracted'
    const triggerRaw = withinNDaysFromDate[2].trim()
    const parsed = parseFoundDate(triggerRaw)
    if (parsed) {
      result.trigger_date = parsed
      result.trigger_type = 'fixed_date'
      result.confidence.trigger_date = 'extracted'
      result.confidence.trigger_type = 'extracted'
      const due = addDays(parseISO(parsed), days)
      result.due_date = format(due, 'yyyy-MM-dd')
      result.confidence.due_date = 'calculated'
    } else {
      result.trigger_type = 'relative_to_event'
      result.confidence.trigger_date = 'unconfirmed'
      result.confidence.trigger_type = 'extracted'
      result.warnings.push(`Could not parse trigger date "${triggerRaw}". Please confirm the trigger date manually.`)
    }
  }

  if (!result.due_date) {
    const candidate = (dueOnDate?.[1]) || (noLaterThan?.[1]) || (onOrBefore?.[1]) || (renewalOn?.[1])
    if (candidate) {
      const dateMatches = candidate.match(DATE_PATTERN)
      if (dateMatches?.length) {
        const parsed = parseFoundDate(dateMatches[0])
        if (parsed) {
          result.due_date = parsed
          result.trigger_type = 'fixed_date'
          result.confidence.due_date = 'extracted'
          result.confidence.trigger_type = 'extracted'
        }
      } else {
        result.confidence.due_date = 'unconfirmed'
        result.warnings.push(`Found a deadline phrase but could not parse the date from: "${candidate.trim()}". Please enter the due date manually.`)
      }
    }
  }

  const ambiguous = [/as soon as possible/i, /after approval/i, /within a reasonable/i, /promptly/i, /upon request/i]
  for (const p of ambiguous) {
    if (p.test(rawClause)) {
      result.warnings.push(`Ambiguous deadline phrase detected. No due date has been calculated. Please enter the date manually.`)
    }
  }

  const firstSentence = rawClause.split(/[.;]/)[0].trim()
  result.title = firstSentence.length > 80 ? firstSentence.substring(0, 80) + '…' : firstSentence
  result.confidence.title = 'extracted'
  result.structured_description = rawClause.trim()
  result.confidence.structured_description = 'extracted'

  if (!result.trigger_type && !result.due_date) {
    result.trigger_type = 'manual'
    result.confidence.trigger_type = 'manual'
    result.warnings.push('No recognisable deadline pattern found. Please enter dates manually.')
  }

  const lower = rawClause.toLowerCase()
  if (lower.includes('critical') || lower.includes('immediately') || lower.includes('urgent')) {
    result.priority = 'critical'
    result.confidence.priority = 'extracted'
  } else if (lower.includes('high priority') || lower.includes('important')) {
    result.priority = 'high'
    result.confidence.priority = 'extracted'
  }

  return result
}
