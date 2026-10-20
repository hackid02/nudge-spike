import Link from 'next/link'
import { CircleCheck, Clock, FileText, LayoutDashboard, LogOut, PenLine, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react'
import { messages, displayStatus, statusLabel } from '@/lib/messages'
import { initials } from './format'
import { LogoMark } from './Logo'
import { ThemeToggle } from './ThemeToggle'

/**
 * Status tag. The LABEL text is asserted by the suite (lib/messages.ts) —
 * only the styling lives here. Colour carries status meaning and nothing else.
 */
export function StatusPill({ status, dueOn }: { status: string; dueOn: string }) {
  const display = displayStatus(status as any, dueOn)
  const label = statusLabel(display)

  const tone: Record<string, string> = {
    paid: 'bg-success-soft text-success ring-success/20',
    overdue: 'bg-danger-soft text-danger ring-danger/20',
    viewed: 'bg-accent-soft text-accent ring-accent/20',
    sent: 'bg-warning-soft text-warning ring-warning/20',
    void: 'bg-inset text-muted ring-line-strong',
    draft: 'bg-inset text-body ring-line-strong',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium leading-5 ring-1 ring-inset ${tone[display] ?? tone.draft}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  )
}

/** Logo mark + wordmark. Pure SVG, no image fetch. */
export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={28} />
      <span className={`text-[17px] font-semibold tracking-tight ${inverted ? 'text-white' : 'text-ink'}`}>Nudge</span>
    </span>
  )
}

const avatarTones = [
  'bg-accent-soft text-accent',
  'bg-success-soft text-success',
  'bg-warning-soft text-warning',
  'bg-inset text-body',
]

/** Initials avatar; tone is stable per name. */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const tone = avatarTones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarTones.length]
  const dims = size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-8 w-8 text-xs'
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full font-semibold ${dims} ${tone}`}>
      {initials(name)}
    </span>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-card shadow-card ${className}`}>{children}</section>
  )
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-[13px] text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

/** "Invoices / INV-1001" */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 ? <span className="text-faint">/</span> : null}
          {it.href ? (
            <Link href={it.href} className="transition-colors duration-150 hover:text-ink">
              {it.label}
            </Link>
          ) : (
            <span className="font-medium text-ink">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

type NavKey = 'all' | 'open' | 'overdue' | 'draft' | 'paid' | 'portal' | 'account'

const NAV: Record<'freelancer' | 'client', { key: NavKey; label: string; href: string; icon: typeof FileText }[]> = {
  freelancer: [
    { key: 'all', label: 'All invoices', href: '/', icon: LayoutDashboard },
    { key: 'open', label: 'Awaiting payment', href: '/?status=open', icon: Clock },
    { key: 'overdue', label: 'Needs attention', href: '/?status=overdue', icon: TriangleAlert },
    { key: 'draft', label: 'Drafts', href: '/?status=draft', icon: PenLine },
    { key: 'paid', label: 'Collected', href: '/?status=paid', icon: CircleCheck },
    { key: 'account', label: 'Account', href: '/account', icon: UserRound },
  ],
  client: [
    { key: 'portal', label: 'Your invoices', href: '/portal', icon: FileText },
    { key: 'account', label: 'Account', href: '/account', icon: UserRound },
  ],
}

/**
 * Signed-in layout: dark sidebar on desktop (glass highlights over a soft glow),
 * top bar everywhere. The signed-in name and Sign out exist ONCE in the DOM
 * (in the top bar) so tests never match a hidden duplicate.
 */
export function AppShell({
  name,
  role,
  active,
  children,
}: {
  name: string
  role: 'freelancer' | 'client'
  active?: NavKey
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col overflow-hidden border-r border-white/5 bg-sidebar lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgb(36_83_230/0.35),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgb(6_118_71/0.18),transparent_70%)]"
        />
        <div className="relative flex h-16 items-center px-5">
          <Link href={role === 'client' ? '/portal' : '/'} aria-label="Nudge home">
            <Wordmark inverted />
          </Link>
        </div>
        <nav aria-label="Main" className="relative mt-4 flex-1 px-3">
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">
            {role === 'client' ? 'Client portal' : 'Workspace'}
          </p>
          <ul className="space-y-1">
            {NAV[role].map((item) => {
              const on = item.key === active
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={on ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                      on
                        ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] ring-1 ring-white/10 backdrop-blur-md'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon aria-hidden="true" className={`h-4 w-4 ${on ? 'text-white' : 'text-white/45'}`} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="relative m-3 rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px] font-medium text-white">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[#7ee2a8]" />
            Client isolation on
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            {role === 'client'
              ? 'You only ever see invoices addressed to your business.'
              : 'Each client sees only their own invoices. Ownership is checked in every query.'}
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <SignedInHeader name={name} role={role} />
        {children}
      </div>
    </div>
  )
}

export function SignedInHeader({
  name,
  role,
}: {
  name: string
  role: 'freelancer' | 'client'
}) {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href={role === 'client' ? '/portal' : '/'} aria-label="Nudge home" className="lg:hidden">
            <Wordmark />
          </Link>
          <span className="hidden rounded-md border border-line bg-panel px-2 py-0.5 text-xs font-medium text-muted sm:inline">
            {role === 'client' ? 'Client portal' : 'Freelancer'}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/account"
            title="Your account"
            className="flex min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors duration-150 hover:bg-inset"
          >
            <span className="hidden sm:block"><Avatar name={name} /></span>
            <span className="truncate whitespace-nowrap text-sm font-medium text-ink" data-testid="signed-in-name">
              {name}
            </span>
          </Link>
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
          <form action="/api/logout" method="post">
            <button className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors duration-150 hover:bg-inset hover:text-ink">
              <LogOut aria-hidden="true" className="h-4 w-4" />
              {messages.auth.signOut}
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}

/**
 * Dark "amount" card with a glass inner panel — the same visual language as the
 * dashboard hero, used on invoice pages. High-contrast white text on dark.
 */
export function AmountHero({
  label,
  amount,
  hint,
  late = false,
}: {
  label: string
  amount: string
  hint: string
  late?: boolean
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-sidebar p-5 text-white shadow-raised ring-1 ring-white/5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(36_83_230/0.55),transparent_68%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(6_118_71/0.3),transparent_70%)]"
      />
      <div className="relative rounded-xl border border-white/15 bg-white/[0.07] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl">
        <p className="text-[13px] font-medium text-white/70">{label}</p>
        <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums">{amount}</p>
        <p className={`mt-1.5 text-[13px] ${late ? 'text-[#fda29b]' : 'text-white/55'}`}>{hint}</p>
      </div>
    </section>
  )
}
