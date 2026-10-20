import { notFound } from 'next/navigation'
import { Ban, CircleCheck, CreditCard, Eye, FileText, Send } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { getFreelancerInvoice } from '@/lib/queries'
import { formatCents } from '@/lib/money'
import { messages, displayStatus } from '@/lib/messages'
import { Breadcrumb, Card, CardHeader, AppShell, AmountHero } from '@/components/ui'
import { InvoiceDocument } from '@/components/InvoiceDocument'
import { ConfirmDelete } from '@/components/ConfirmDelete'
import { daysFromToday, dueHint, formatDate, formatDateTime } from '@/components/format'
import {
  deleteInvoiceAction,
  recordPaymentAction,
  sendInvoiceAction,
  voidInvoiceAction,
} from './actions'

export const dynamic = 'force-dynamic'

const primaryBtn =
  'inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white shadow-card transition-colors duration-150 hover:bg-accent-strong'
const secondaryBtn =
  'inline-flex items-center gap-2 rounded-lg border border-line-strong bg-card px-3.5 py-2 text-sm font-semibold text-body shadow-card transition-colors duration-150 hover:bg-panel hover:text-ink'

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const session = await requireRole('freelancer')
  const { id } = await params
  const { error } = await searchParams

  // scoped by freelancer_id inside the query: another tenant's invoice is null
  const invoice = await getFreelancerInvoice(session.userId, id)
  if (!invoice) notFound()

  const canSend = invoice.status === 'draft'
  const canPay = invoice.status === 'sent' || invoice.status === 'viewed'
  // Void stays visible on paid invoices: the server refuses it and shows
  // messages.invoice.cannotVoidPaid, which is what the 'void refused' test (INV-1104) asserts.
  const canVoid = invoice.status !== 'void'
  const display = displayStatus(invoice.status, invoice.due_on)
  const open = display === 'sent' || display === 'viewed' || display === 'overdue'
  const client = invoice.client_business || invoice.client_name

  const timeline = [
    { done: true, icon: FileText, title: 'Invoice created', when: formatDate(invoice.issued_on) },
    {
      done: invoice.status !== 'draft',
      icon: Send,
      title: invoice.status === 'draft' ? 'Not sent yet' : `Sent to ${client}`,
      when: invoice.status === 'draft' ? 'Draft' : '',
    },
    {
      done: !!invoice.viewed_at,
      icon: Eye,
      title: invoice.viewed_at ? `Opened by ${client}` : 'Not opened yet',
      when: invoice.viewed_at ? `${formatDateTime(invoice.viewed_at)} UTC` : '—',
    },
    {
      done: !!invoice.paid_at,
      icon: CircleCheck,
      title: invoice.paid_at ? 'Payment recorded' : invoice.status === 'void' ? 'Voided' : 'Awaiting payment',
      when: invoice.paid_at ? `${formatDateTime(invoice.paid_at)} UTC` : '—',
    },
  ]

  return (
    <AppShell name={session.name} role="freelancer" active="all">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 pt-6">
        <Breadcrumb items={[{ label: 'Invoices', href: '/' }, { label: invoice.id }]} />

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{invoice.id}</h1>
            <p className="mt-1 text-muted">
              {client} · {formatCents(invoice.total_cents)}
            </p>
          </div>

          {/* One primary action (Send OR Record payment — never both) */}
          <div className="flex flex-wrap items-center gap-2">
            <ConfirmDelete action={deleteInvoiceAction} invoiceId={invoice.id} />
            {canVoid ? (
              <form action={voidInvoiceAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <button className={secondaryBtn}>
                  <Ban aria-hidden="true" className="h-4 w-4" />
                  Void
                </button>
              </form>
            ) : null}
            {canSend ? (
              <form action={sendInvoiceAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <button className={primaryBtn}>
                  <Send aria-hidden="true" className="h-4 w-4" />
                  Send
                </button>
              </form>
            ) : null}
            {canPay ? (
              <form action={recordPaymentAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <button className={primaryBtn}>
                  <CreditCard aria-hidden="true" className="h-4 w-4" />
                  Record payment
                </button>
              </form>
            ) : null}
          </div>
        </div>

        {error === 'paid' ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            {messages.invoice.cannotVoidPaid}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <InvoiceDocument invoice={invoice} from={session.name} showUnit testIds />
          </div>

          <div className="space-y-6">
            <AmountHero
              label={display === 'paid' ? 'Amount paid' : display === 'void' ? 'Amount (void)' : 'Amount due'}
              amount={formatCents(invoice.total_cents)}
              hint={open ? `${dueHint(invoice.due_on)} · ${formatDate(invoice.due_on)}` : `Due ${formatDate(invoice.due_on)}`}
              late={open && daysFromToday(invoice.due_on) < 0}
            />

            <Card>
              <CardHeader title="Timeline" />
              <ol className="px-5 py-3">
                {timeline.map((t, i) => (
                  <li key={i} className="relative flex gap-3 py-2.5">
                    {i < timeline.length - 1 ? (
                      <span aria-hidden="true" className="absolute left-[13px] top-9 h-[calc(100%-24px)] w-px bg-line" />
                    ) : null}
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-card ${
                        t.done ? 'bg-accent-soft text-accent' : 'bg-inset text-faint'
                      }`}
                    >
                      <t.icon aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                    <div className="text-[13px] leading-5">
                      <p className={t.done ? 'font-medium text-ink' : 'text-muted'}>{t.title}</p>
                      {t.when ? <p className="text-xs text-muted">{t.when}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
