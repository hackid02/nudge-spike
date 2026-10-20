/**
 * Display helpers for dates and names. Pure functions, server-side only
 * (every page is force-dynamic, so "now" is the request time).
 */

const DAY = 24 * 60 * 60 * 1000

/** "2026-11-15" -> "Nov 15, 2026" (UTC, so it never shifts a day). */
export function formatDate(isoDate: string): string {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Timestamp -> "Oct 17, 12:44" */
export function formatDateTime(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}

/** Timestamp -> "just now" / "5 min ago" / "3 h ago" / "Oct 17" */
export function timeAgo(ts: string, now = new Date()): string {
  const diff = now.getTime() - new Date(ts).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`
  if (diff < DAY) return `${Math.floor(diff / 3_600_000)} h ago`
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** Whole days from today (UTC) to the date. Negative = in the past. */
export function daysFromToday(isoDate: string, now = new Date()): number {
  const target = Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`)
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.round((target - today) / DAY)
}

/** "Due in 12 days" / "Due today" / "5 days late" */
export function dueHint(isoDate: string): string {
  const d = daysFromToday(isoDate)
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  if (d > 1) return `Due in ${d} days`
  if (d === -1) return '1 day late'
  return `${-d} days late`
}

/** "Northwind Co" -> "NC" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}
