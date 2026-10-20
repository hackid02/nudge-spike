import { Download, Lock } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { exportClientInvoices } from '@/lib/queries'
import { formatCents } from '@/lib/money'
import { messages } from '@/lib/messages'
import { Breadcrumb, Card, StatusPill, AppShell } from '@/components/ui'
import { formatDate } from '@/components/format'

export const dynamic = 'force-dynamic'

/**
 * An HTML table rather than a raw CSV endpoint, on purpose.
 *
 * A browser navigating to a .csv URL downloads a file instead of rendering it,
 * so a browser-based test suite cannot assert on the body. Rendering the same
 * rows as HTML makes the export testable — and it's better UX, since the human
 * can see what they're about to export before downloading.
 *
 * The Download button still exists for humans (see /api/portal/export).
 */
export default async function ExportPage() {
  const session = await requireRole('client')
  const rows = await exportClientInvoices(session.userId)

  return (
    <AppShell name={session.name} role="client">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 pt-6">
        <Breadcrumb items={[{ label: 'Your invoices', href: '/portal' }, { label: 'Export' }]} />

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{messages.export.title}</h1>
            <p className="mt-1 text-muted">Preview exactly what the CSV will contain before you download it.</p>
          </div>
          <a
            href="/api/portal/export"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white shadow-card transition-colors duration-150 hover:bg-accent-strong"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            {messages.export.download}
          </a>
        </div>

        <Card className="mt-6">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-[15px] font-semibold text-ink">
              {rows.length} {rows.length === 1 ? 'row' : 'rows'}
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
              <Lock aria-hidden="true" className="h-3.5 w-3.5" />
              Only invoices belonging to your account are listed. Drafts are never included.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-panel text-left text-xs font-medium text-muted">
                  <th scope="col" className="px-5 py-2.5 font-medium">Invoice</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Due</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-medium text-ink">{r.id}</td>
                    <td className="px-3 py-3">
                      <StatusPill status={r.status} dueOn={r.due_on} />
                    </td>
                    <td className="px-3 py-3 text-ink">{formatDate(r.due_on)}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-ink">
                      {formatCents(r.total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </AppShell>
  )
}
