import { differenceInCalendarDays, format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'

export function nowIso() {
  return new Date().toISOString()
}

export function todayInputValue() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatShortDate(value?: string) {
  if (!value) return 'No date'
  const date = parseISO(value)
  return isValid(date) ? format(date, 'MMM d') : 'No date'
}

export function formatDateTime(value: string) {
  const date = parseISO(value)
  return isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : 'Unknown time'
}

export function relativeTime(value: string) {
  const date = parseISO(value)
  return isValid(date) ? `${formatDistanceToNowStrict(date, { addSuffix: true })}` : 'recently'
}

export function daysUntil(value?: string) {
  if (!value) return null
  const date = parseISO(value)
  if (!isValid(date)) return null
  return differenceInCalendarDays(date, new Date())
}

export function urgencyRank(urgency: string) {
  if (urgency === 'now') return 0
  if (urgency === 'week') return 1
  return 2
}
