import { notFound } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { getClientInvoice } from '@/lib/queries'
import { formatCents } from '@/lib/money'
import { displayStatus } from '@/lib/messages'
import { Breadcrumb, Card, AppShell, AmountHero } from '@/components/ui'
import { InvoiceDocument } from '@/components/InvoiceDocument'
import { daysFromToday, dueHint, formatDate } from '@/components/format'

export const dynamic = 'force-dynamic'

export default async function PortalInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireRole('client')
  const { id } = await params

  // client_id is in the WHERE clause. Someone else's invoice -> null -> 404.
  const invoice = await getClientInvoice(session.userId, id)
  if (!invoice) notFound()

  const display = displayStatus(invoice.status, invoice.due_on)
  const open = display === 'sent' || display === 'viewed' || display === 'overdue'

  return (
    <AppShell name={session.name} role="client" active='portal'>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 pt-6">
        <Breadcrumb items={[{ label: 'Your invoices', href: '/portal' }, { label: invoice.id }]} />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">{invoice.id}</h1>

        {/* Read-only for clients: no actions, just the document */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <InvoiceDocument invoice={invoice} showUnit={false} testIds={false} />
          </div>

          <div className="space-y-6">
            <AmountHero
              label={display === 'paid' ? 'Amount paid' : 'Amount due'}
              amount={formatCents(invoice.total_cents)}
              hint={open ? `${dueHint(invoice.due_on)} · ${formatDate(invoice.due_on)}` : `Due ${formatDate(invoice.due_on)}`}
              late={open && daysFromToday(invoice.due_on) < 0}
            />

            <Card className="flex gap-3 p-5">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <p className="text-[13px] leading-5 text-muted">
                This invoice is visible only to your account. Questions about it? Contact{' '}
                {invoice.freelancer_name ?? 'your freelancer'} directly.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
