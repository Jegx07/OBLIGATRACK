import { isValid, parseISO, isAfter, isBefore, startOfDay } from 'date-fns'

export interface ValidationWarning {
  field: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * Validate a date string. Returns null if valid, error message if not.
 */
export function validateDateString(value: string | null | undefined): string | null {
  if (!value) return null
  const d = parseISO(value)
  if (!isValid(d)) return 'Invalid date format. Use YYYY-MM-DD.'
  return null
}

/**
 * Validate contract date range.
 */
export function validateContractDates(
  startDate: string | null,
  endDate: string | null,
  renewalDate?: string | null
): ValidationWarning[] {
  const warnings: ValidationWarning[] = []

  if (!startDate) {
    warnings.push({ field: 'start_date', message: 'Start date is required.', severity: 'error' })
  }
  if (!endDate) {
    warnings.push({ field: 'end_date', message: 'End date is required.', severity: 'error' })
  }

  if (startDate && endDate) {
    const s = parseISO(startDate)
    const e = parseISO(endDate)

    if (!isValid(s)) {
      warnings.push({ field: 'start_date', message: 'Start date is not a valid date.', severity: 'error' })
    }
    if (!isValid(e)) {
      warnings.push({ field: 'end_date', message: 'End date is not a valid date.', severity: 'error' })
    }
    if (isValid(s) && isValid(e) && !isBefore(s, e)) {
      warnings.push({
        field: 'end_date',
        message: 'End date must be after the start date.',
        severity: 'error'
      })
    }

    // Warn if end date is in the past but contract is active
    const today = startOfDay(new Date())
    if (isValid(e) && isBefore(e, today)) {
      warnings.push({
        field: 'end_date',
        message: 'The end date is in the past. Verify the contract status is correct.',
        severity: 'warning'
      })
    }
  }

  if (renewalDate && startDate && endDate) {
    const r = parseISO(renewalDate)
    const s = parseISO(startDate)
    const e = parseISO(endDate)
    if (isValid(r) && isValid(s) && isBefore(r, s)) {
      warnings.push({
        field: 'renewal_date',
        message: 'Renewal date is before the contract start date. Verify this is intentional.',
        severity: 'warning'
      })
    }
    if (isValid(r) && isValid(e) && isAfter(r, e)) {
      // Renewal after end is common; just informational
    }
  }

  return warnings
}

/**
 * Validate obligation dates.
 */
export function validateObligationDates(params: {
  dueDate?: string | null
  triggerDate?: string | null
  durationDays?: number | null
  reminderDate?: string | null
  contractStartDate?: string | null
  contractEndDate?: string | null
}): ValidationWarning[] {
  const warnings: ValidationWarning[] = []
  const { dueDate, triggerDate, durationDays, reminderDate, contractStartDate } = params

  if (durationDays !== null && durationDays !== undefined && durationDays < 0) {
    warnings.push({
      field: 'duration_days',
      message: 'Duration in days cannot be negative.',
      severity: 'error'
    })
  }

  if (triggerDate) {
    const t = parseISO(triggerDate)
    if (!isValid(t)) {
      warnings.push({ field: 'trigger_date', message: 'Trigger date is not a valid date.', severity: 'error' })
    }
  }

  if (dueDate) {
    const d = parseISO(dueDate)
    if (!isValid(d)) {
      warnings.push({ field: 'due_date', message: 'Due date is not a valid date.', severity: 'error' })
    }
    const today = startOfDay(new Date())
    if (isValid(d) && isBefore(d, today)) {
      warnings.push({
        field: 'due_date',
        message: 'Due date is in the past. The obligation will be classified as overdue.',
        severity: 'warning'
      })
    }
    if (contractStartDate) {
      const s = parseISO(contractStartDate)
      if (isValid(d) && isValid(s) && isBefore(d, s)) {
        warnings.push({
          field: 'due_date',
          message: 'Due date is before the contract start date. Verify this is intentional.',
          severity: 'warning'
        })
      }
    }
  }

  if (reminderDate && dueDate) {
    const r = parseISO(reminderDate)
    const d = parseISO(dueDate)
    if (isValid(r) && isValid(d) && isAfter(r, d)) {
      warnings.push({
        field: 'reminder_date',
        message: 'Reminder date is after the due date.',
        severity: 'warning'
      })
    }
  }

  return warnings
}
