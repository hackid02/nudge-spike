import { createHash } from 'node:crypto'
import type { InvoiceRow } from '@/lib/queries'

/**
 * A short fingerprint of everything the dashboard shows that a CLIENT can change
 * (opening = viewed_at, paying is recorded by the freelancer but may happen in
 * another tab). The live poller compares fingerprints and only refreshes the page
 * when it changes — so an idle dashboard never re-renders under a test's cursor.
 *
 * Built from the already-scoped list query: no new SQL, no new ownership rule.
 */
export function activityVersion(rows: Pick<InvoiceRow, 'id' | 'status' | 'viewed_at' | 'paid_at'>[]): string {
  const material = rows
    .map((r) => `${r.id}|${r.status}|${r.viewed_at ?? ''}|${r.paid_at ?? ''}`)
    .sort()
    .join('\n')
  return createHash('sha256').update(material).digest('base64url').slice(0, 16)
}
