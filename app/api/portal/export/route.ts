import { requireRole } from '@/lib/session'
import { exportClientInvoices } from '@/lib/queries'
import { formatCents } from '@/lib/money'

export const dynamic = 'force-dynamic'

/**
 * CSV download for humans.
 *
 * Same independently-scoped query as the HTML export page — NOT a re-use of the
 * portal list query. The bug class this guards against: a list page that filters
 * by client while the export filters by something else (or nothing at all).
 */
export async function GET() {
  const session = await requireRole('client')
  const rows = await exportClientInvoices(session.userId)

  const header = 'invoice,status,due,total'
  const body = rows
    .map((r) => [r.id, r.status, r.due_on, formatCents(r.total_cents)].join(','))
    .join('\n')

  return new Response(`${header}\n${body}\n`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="invoices-${session.userId}.csv"`,
      'cache-control': 'no-store',
    },
  })
}
