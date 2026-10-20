import { formatCents, formatQty, formatTaxRate, lineTotalCents } from '@/lib/money'
import type { InvoiceDetail } from '@/lib/queries'
import { StatusPill } from './ui'
import { formatDate } from './format'

const label = 'text-xs font-medium uppercase tracking-[0.06em] text-faint'

/**
 * The invoice as the client receives it. Shared by the freelancer page and the
 * client portal. `testIds` keeps the data-testid hooks the suite asserts on
 * (freelancer page only, as before).
 */
export function InvoiceDocument({
  invoice,
  from,
  showUnit,
  testIds,
}: {
  invoice: InvoiceDetail
  from?: string
  showUnit: boolean
  testIds: boolean
}) {
  const tid = (id: string) => (testIds ? { 'data-testid': id } : {})

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
      <header className="flex items-start justify-between gap-4 px-5 pb-6 pt-6 sm:px-8 sm:pt-8">
        <div>
          <p className={label}>Invoice</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-ink">{invoice.id}</p>
        </div>
        <StatusPill status={invoice.status} dueOn={invoice.due_on} />
      </header>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-y border-line bg-panel px-5 py-5 sm:px-8 sm:grid-cols-4">
        {from ? (
          <div>
            <dt className={label}>From</dt>
            <dd className="mt-1 font-medium text-ink">{from}</dd>
          </div>
        ) : null}
        <div>
          <dt className={label}>Billed to</dt>
          <dd className="mt-1 font-medium text-ink">{invoice.client_business || invoice.client_name}</dd>
        </div>
        <div>
          <dt className={label}>Issued</dt>
          <dd className="mt-1 text-ink">{formatDate(invoice.issued_on)}</dd>
        </div>
        <div>
          <dt className={label}>Due</dt>
          <dd className="mt-1 text-ink">{formatDate(invoice.due_on)}</dd>
        </div>
      </dl>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-medium text-muted">
            <th scope="col" className="py-3 pl-5 pr-3 sm:pl-8 font-medium">Description</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Qty</th>
            {showUnit ? <th scope="col" className="px-3 py-3 text-right font-medium">Unit</th> : null}
            <th scope="col" className="py-3 pl-3 pr-5 sm:pr-8 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {invoice.items.map((item, i) => (
            <tr key={i}>
              <td className="py-3.5 pl-5 pr-3 sm:pl-8 font-medium text-ink">{item.description}</td>
              <td className="px-3 py-3.5 text-right tabular-nums text-body">{formatQty(item.qty_milli)}</td>
              {showUnit ? (
                <td className="px-3 py-3.5 text-right tabular-nums text-body">{formatCents(item.unit_cents)}</td>
              ) : null}
              <td className="py-3.5 pl-3 pr-5 sm:pr-8 text-right font-medium tabular-nums text-ink" {...tid('line-total')}>
                {formatCents(lineTotalCents(item.qty_milli, item.unit_cents))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-line px-5 py-6 sm:px-8">
        <dl className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums text-ink" {...tid('subtotal')}>
              {formatCents(invoice.subtotal_cents)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Tax ({formatTaxRate(invoice.tax_rate_bp)})</dt>
            <dd className="tabular-nums text-ink" {...tid('tax')}>
              {formatCents(invoice.tax_cents)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3 text-ink">
            <dt className="font-semibold">Total</dt>
            <dd className="text-xl font-semibold tracking-tight tabular-nums" {...tid('total')}>
              {formatCents(invoice.total_cents)}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  )
}
