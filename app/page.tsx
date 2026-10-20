import Link from 'next/link'
import { AlertTriangle, CircleCheck, Eye, Inbox, Wallet } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { listFreelancerInvoices, freelancerStats } from '@/lib/queries'
import { formatCents } from '@/lib/money'
import { messages, displayStatus, type DisplayStatus } from '@/lib/messages'
import { Avatar, Card, CardHeader, StatusPill, AppShell } from '@/components/ui'
import { daysFromToday, dueHint, formatDate, formatDateTime, timeAgo } from '@/components/format'
import { activityVersion } from '@/components/activity'
import { LiveRefresh } from '@/components/LiveRefresh'
import { StatusDonut } from '@/components/StatusDonut'

export const dynamic = 'force-dynamic'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
  { key: 'draft', label: 'Draft' },
] as const
type FilterKey = (typeof FILTERS)[number]['key']

function matches(filter: FilterKey, s: DisplayStatus) {
  if (filter === 'all') return true
  if (filter === 'open') return s === 'sent' || s === 'viewed' || s === 'overdue'
  return s === filter
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  // a client who lands here is bounced to /portal by requireRole
  const session = await requireRole('freelancer')
  const [invoices, stats] = await Promise.all([
    listFreelancerInvoices(session.userId),
    freelancerStats(session.userId),
  ])
  const { status } = await searchParams
  const filter: FilterKey = FILTERS.some((f) => f.key === status) ? (status as FilterKey) : 'all'

  const rows = invoices.map((inv) => ({ ...inv, display: displayStatus(inv.status, inv.due_on) }))
  const visible = rows.filter((r) => matches(filter, r.display))
  const count = (f: FilterKey) => rows.filter((r) => matches(f, r.display)).length

  const now = new Date()
  const paidThisMonth = rows.filter((r) => {
    if (!r.paid_at) return false
    const d = new Date(r.paid_at)
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()
  }).length
  const overdueRows = rows
    .filter((r) => r.display === 'overdue')
    .sort((a, b) => a.due_on.localeCompare(b.due_on))

  const tiles = [
    {
      label: messages.dashboard.outstanding,
      value: stats.outstanding_cents,
      note: `${count('open')} open ${count('open') === 1 ? 'invoice' : 'invoices'}`,
      icon: Wallet,
      chip: 'bg-accent-soft text-accent',
      glassTone: 'text-white',
      glassValue: 'text-white',
      tone: 'text-ink',
    },
    {
      label: messages.dashboard.overdue,
      value: stats.overdue_cents,
      note: overdueRows.length ? `${overdueRows.length} past due date` : 'Nothing past due',
      icon: AlertTriangle,
      chip: 'bg-danger-soft text-danger',
      glassTone: 'text-[#fda29b]',
      glassValue: stats.overdue_cents > 0 ? 'text-[#fecdca]' : 'text-white',
      // red only when there is something overdue: colour means status, not decoration
      tone: stats.overdue_cents > 0 ? 'text-danger' : 'text-ink',
    },
    {
      label: messages.dashboard.paidThisMonth,
      value: stats.paid_this_month_cents,
      note: `${paidThisMonth} ${paidThisMonth === 1 ? 'payment' : 'payments'} received`,
      icon: CircleCheck,
      chip: 'bg-success-soft text-success',
      glassTone: 'text-[#7ee2a8]',
      glassValue: 'text-white',
      tone: 'text-ink',
    },
  ]

  // Billed money (everything except drafts and voids) by where it stands
  const sumOf = (pred: (r: (typeof rows)[number]) => boolean) =>
    rows.filter(pred).reduce((a, r) => a + r.total_cents, 0)
  const paidCents = sumOf((r) => r.display === 'paid')
  const awaitingCents = sumOf((r) => r.display === 'sent' || r.display === 'viewed')
  const overdueCents = sumOf((r) => r.display === 'overdue')
  const draftCents = sumOf((r) => r.display === 'draft')
  const billed = paidCents + awaitingCents + overdueCents || 1
  const split = [
    { label: 'Collected', pct: (paidCents / billed) * 100, bar: 'bg-[#4ade80]' },
    { label: 'Awaiting', pct: (awaitingCents / billed) * 100, bar: 'bg-[#7c9cff]' },
    { label: 'Overdue', pct: (overdueCents / billed) * 100, bar: 'bg-[#f97066]' },
  ]
  const n = (pred: (r: (typeof rows)[number]) => boolean) => rows.filter(pred).length
  const donut = [
    { label: 'Collected', cents: paidCents, color: '#12b76a', count: n((r) => r.display === 'paid') },
    { label: 'Awaiting payment', cents: awaitingCents, color: '#2453e6', count: n((r) => r.display === 'sent' || r.display === 'viewed') },
    { label: 'Overdue', cents: overdueCents, color: '#f04438', count: n((r) => r.display === 'overdue') },
    { label: 'Drafts', cents: draftCents, color: '#98a2b3', count: n((r) => r.display === 'draft') },
  ]

  // The product's point: see who opened an invoice and who paid.
  const activity = rows
    .flatMap((r) => {
      const who = r.client_business || r.client_name
      const ev: { at: string; kind: 'viewed' | 'paid'; who: string; id: string }[] = []
      if (r.viewed_at) ev.push({ at: r.viewed_at, kind: 'viewed', who, id: r.id })
      if (r.paid_at) ev.push({ at: r.paid_at, kind: 'paid', who, id: r.id })
      return ev
    })
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6)

  return (
    <AppShell name={session.name} role="freelancer" active={filter}>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <div>
          <p className="text-[13px] font-medium text-muted">Welcome back, {session.name.split(' ')[0]}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-ink">Invoices</h1>
          <p className="mt-1 text-muted">See what you&apos;ve billed, who has opened it, and what&apos;s been paid.</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Hero balance card: the one place glass is used — over a dark, glowing surface */}
          <section
            aria-label="Balances"
            className="relative overflow-hidden rounded-2xl bg-sidebar p-5 text-white shadow-raised ring-1 ring-white/5 sm:p-6 lg:col-span-2"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgb(36_83_230/0.55),transparent_68%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-36 left-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(6_118_71/0.35),transparent_70%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
            />

            <dl className="relative grid grid-cols-1 gap-5 sm:grid-cols-[1.15fr_1fr] sm:gap-6">
              <div className="flex flex-col justify-between">
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

                {/* where billed money stands */}
                <div className="mt-6">
                  <div className="flex h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                    {split.map((p) =>
                      p.pct > 0 ? <div key={p.label} className={p.bar} style={{ width: `${p.pct}%` }} /> : null,
                    )}
                  </div>
                  <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                    {split.map((p) => (
                      <li key={p.label} className="flex items-center gap-1.5">
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${p.bar}`} />
                        {p.label} {Math.round(p.pct)}%
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                {tiles.slice(1).map((t) => (
                  <div
                    key={t.label}
                    className="rounded-xl border border-white/15 bg-white/[0.07] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-[13px] font-medium text-white/70">{t.label}</dt>
                      <t.icon aria-hidden="true" className={`h-4 w-4 ${t.glassTone}`} />
                    </div>
                    <dd className={`mt-1.5 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl ${t.glassValue}`}>
                      {formatCents(t.value)}
                    </dd>
                    <p className="mt-0.5 text-xs text-white/50">{t.note}</p>
                  </div>
                ))}
              </div>
            </dl>
          </section>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Where your money is</h2>
            <p className="mt-0.5 text-[13px] text-muted">Invoice value by status</p>
            <div className="mt-5">
              <StatusDonut slices={donut} centerLabel={`${rows.length} invoices`} />
            </div>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="min-w-0 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
              <h2 className="text-[15px] font-semibold text-ink">All invoices</h2>
              <nav
                aria-label="Filter invoices"
                className="-mx-1 flex max-w-full overflow-x-auto rounded-lg border border-line bg-panel p-0.5"
              >
                {FILTERS.map((f) => {
                  const active = f.key === filter
                  return (
                    <Link
                      key={f.key}
                      href={f.key === 'all' ? '/' : `/?status=${f.key}`}
                      aria-current={active ? 'page' : undefined}
                      className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors duration-150 ${
                        active ? 'bg-card text-ink shadow-card ring-1 ring-line' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {f.label}
                      <span className={`ml-1.5 tabular-nums ${active ? 'text-muted' : 'text-faint'}`}>{count(f.key)}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {invoices.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Inbox aria-hidden="true" className="mx-auto h-8 w-8 text-faint" />
                <p className="mt-3 text-sm text-muted">{messages.dashboard.empty}</p>
              </div>
            ) : visible.length === 0 ? (
              <p className="px-6 py-14 text-center text-sm text-muted">No invoices match this filter.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel text-left text-xs font-medium text-muted">
                    <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Invoice</th>
                    <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">Client</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                    <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">Due</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((inv) => {
                    const open = inv.display === 'sent' || inv.display === 'viewed' || inv.display === 'overdue'
                    const client = inv.client_business || inv.client_name
                    const late = open && daysFromToday(inv.due_on) < 0
                    return (
                      <tr key={inv.id} className="transition-colors duration-150 hover:bg-panel">
                        <td className="px-4 py-3 sm:px-5">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="font-medium text-accent underline-offset-2 hover:text-accent-strong hover:underline"
                          >
                            {inv.id}
                          </Link>
                          <div className="mt-0.5 hidden text-xs text-muted sm:block">Issued {formatDate(inv.issued_on)}</div>
                          {/* phones/tablets: client (and due on phones) folded under the id */}
                          <div className="mt-0.5 text-xs text-muted md:hidden">
                            {client}
                            <span className="sm:hidden">
                              {' · '}
                              <span className={late ? 'text-danger' : ''}>
                                {open ? dueHint(inv.due_on) : `Due ${formatDate(inv.due_on)}`}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="hidden px-3 py-3 md:table-cell">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={client} size="sm" />
                            <span className="font-medium text-ink">{client}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill status={inv.status} dueOn={inv.due_on} />
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-3 sm:table-cell">
                          <div className="text-ink">{formatDate(inv.due_on)}</div>
                          {open ? (
                            <div className={`mt-0.5 text-xs ${late ? 'text-danger' : 'text-muted'}`}>{dueHint(inv.due_on)}</div>
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
            )}
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Needs attention" description="Open invoices past their due date" />
              {overdueRows.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-5 text-sm text-muted">
                  <CircleCheck aria-hidden="true" className="h-5 w-5 text-success" />
                  Nothing overdue. Nice.
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {overdueRows.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <Link href={`/invoices/${r.id}`} className="font-medium text-ink hover:text-accent">
                          {r.id}
                        </Link>
                        <p className="truncate text-xs text-muted">
                          {r.client_business || r.client_name} · <span className="text-danger">{dueHint(r.due_on)}</span>
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums text-ink">{formatCents(r.total_cents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Recent activity"
                description="When clients open and pay invoices"
                action={<LiveRefresh version={activityVersion(invoices)} />}
              />
              {activity.length === 0 ? (
                <p className="px-5 py-5 text-sm text-muted">No client activity yet.</p>
              ) : (
                <ol className="px-5 py-2">
                  {activity.map((e, i) => (
                    <li key={`${e.id}-${e.kind}`} className="relative flex gap-3 py-2.5">
                      {i < activity.length - 1 ? (
                        <span aria-hidden="true" className="absolute left-[13px] top-9 h-[calc(100%-24px)] w-px bg-line" />
                      ) : null}
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-card ${
                          e.kind === 'paid' ? 'bg-success-soft text-success' : 'bg-accent-soft text-accent'
                        }`}
                      >
                        {e.kind === 'paid' ? (
                          <CircleCheck aria-hidden="true" className="h-3.5 w-3.5" />
                        ) : (
                          <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <div className="min-w-0 text-[13px] leading-5">
                        <p className="text-body">
                          <span className="font-medium text-ink">{e.who}</span> {e.kind === 'paid' ? 'paid' : 'opened'}{' '}
                          <Link href={`/invoices/${e.id}`} className="font-medium text-ink hover:text-accent">
                            {e.id}
                          </Link>
                        </p>
                        <p className="text-xs text-muted" title={`${formatDateTime(e.at)} UTC`}>
                          {timeAgo(e.at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
