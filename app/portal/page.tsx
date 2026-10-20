import Link from 'next/link'
import { AlertTriangle, Download, Inbox, Wallet } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { listClientInvoices } from '@/lib/queries'
import { formatCents } from '@/lib/money'
import { messages, displayStatus } from '@/lib/messages'
import { Card, StatusPill, AppShell } from '@/components/ui'
import { daysFromToday, dueHint, formatDate } from '@/components/format'

export const dynamic = 'force-dynamic'

export default async function PortalPage() {
  // a freelancer who lands here is bounced to / by requireRole
  const session = await requireRole('client')
  const invoices = await listClientInvoices(session.userId)

  const rows = invoices.map((inv) => ({ ...inv, display: displayStatus(inv.status, inv.due_on) }))
  const openRows = rows.filter((r) => r.display === 'sent' || r.display === 'viewed' || r.display === 'overdue')
  const overdueRows = rows.filter((r) => r.display === 'overdue')
  const sum = (rs: typeof rows) => rs.reduce((a, r) => a + r.total_cents, 0)

  const tiles = [
    {
      label: 'Amount due',
      value: sum(openRows),
      note: `${openRows.length} open ${openRows.length === 1 ? 'invoice' : 'invoices'}`,
      icon: Wallet,
      chip: 'bg-accent-soft text-accent',
      tone: 'text-ink',
    },
    {
      label: 'Past due',
      value: sum(overdueRows),
      note: overdueRows.length ? `${overdueRows.length} past due date` : 'Nothing past due',
      icon: AlertTriangle,
      chip: 'bg-danger-soft text-danger',
      tone: overdueRows.length ? 'text-danger' : 'text-ink',
    },
  ]

  return (
    <AppShell name={session.name} role="client" active="portal">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Your invoices</h1>
            <p className="mt-1 text-muted">Only invoices addressed to your business appear here.</p>
          </div>
          <Link
            href="/portal/export"
            className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-card px-3.5 py-2 text-sm font-semibold text-body shadow-card transition-colors duration-150 hover:bg-panel hover:text-ink"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Export
          </Link>
        </div>

        {invoices.length > 0 ? (
          <section
            aria-label="Balances"
            className="relative mt-6 overflow-hidden rounded-2xl bg-sidebar p-5 text-white shadow-raised sm:p-6"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgb(36_83_230/0.55),transparent_68%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-36 left-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(6_118_71/0.3),transparent_70%)]"
            />
            <dl className="relative grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr] sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <Wallet aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  <dt className="text-[13px] font-medium text-white/70">{tiles[0].label}</dt>
                </div>
                <dd className="mt-3 text-[34px] font-semibold leading-none tracking-tight tabular-nums sm:text-[40px]">
                  {formatCents(tiles[0].value)}
                </dd>
                <p className="mt-2 text-[13px] text-white/55">{tiles[0].note}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/[0.07] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[13px] font-medium text-white/70">{tiles[1].label}</dt>
                  <AlertTriangle aria-hidden="true" className="h-4 w-4 text-[#fda29b]" />
                </div>
                <dd
                  className={`mt-1.5 text-2xl font-semibold tracking-tight tabular-nums ${overdueRows.length ? 'text-[#fecdca]' : 'text-white'}`}
                >
                  {formatCents(tiles[1].value)}
                </dd>
                <p className="mt-0.5 text-xs text-white/50">{tiles[1].note}</p>
              </div>
            </dl>
          </section>
        ) : null}

        <Card className="mt-6">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-[15px] font-semibold text-ink">Invoices</h2>
          </div>
          {invoices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Inbox aria-hidden="true" className="mx-auto h-8 w-8 text-faint" />
              <p className="mt-3 text-sm text-muted">{messages.portal.empty}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel text-left text-xs font-medium text-muted">
                    <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Invoice</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                    <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">Due</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((inv) => {
                    const open = inv.display === 'sent' || inv.display === 'viewed' || inv.display === 'overdue'
                    return (
                      <tr key={inv.id} className="transition-colors duration-150 hover:bg-panel">
                        <td className="px-4 py-3 sm:px-5">
                          <Link
                            href={`/portal/invoices/${inv.id}`}
                            className="font-medium text-accent underline-offset-2 hover:text-accent-strong hover:underline"
                          >
                            {inv.id}
                          </Link>
                          <div className="mt-0.5 hidden text-xs text-muted sm:block">Issued {formatDate(inv.issued_on)}</div>
                          <div className="mt-0.5 text-xs sm:hidden">
                            <span className={open && daysFromToday(inv.due_on) < 0 ? 'text-danger' : 'text-muted'}>
                              {open ? dueHint(inv.due_on) : `Due ${formatDate(inv.due_on)}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill status={inv.status} dueOn={inv.due_on} />
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-3 sm:table-cell">
                          <div className="text-ink">{formatDate(inv.due_on)}</div>
                          {open ? (
                            <div
                              className={`mt-0.5 text-xs ${daysFromToday(inv.due_on) < 0 ? 'text-danger' : 'text-muted'}`}
                            >
                              {dueHint(inv.due_on)}
                            </div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-ink sm:px-5">
                          {formatCents(inv.total_cents)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </AppShell>
  )
}
