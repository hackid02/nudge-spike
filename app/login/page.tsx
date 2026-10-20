import { redirect } from 'next/navigation'
import { Eye, Lock, ShieldCheck } from 'lucide-react'
import { getSession } from '@/lib/session'
import { messages } from '@/lib/messages'
import { Wordmark } from '@/components/ui'
import { InvoiceStack3D } from '@/components/InvoiceStack3D'
import { DemoButtons } from './DemoButtons'

export const dynamic = 'force-dynamic'

const input =
  'mt-1.5 block w-full rounded-lg border border-line-strong bg-card px-3.5 py-2.5 text-sm text-ink shadow-card outline-none transition-colors duration-150 placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/10'

const features = [
  { icon: Eye, text: 'See the moment a client opens an invoice' },
  { icon: ShieldCheck, text: 'Each client sees only their own invoices' },
  { icon: Lock, text: 'Signed sessions, ownership checked in every query' },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getSession()
  if (session) redirect(session.role === 'client' ? '/portal' : '/')

  const { error } = await searchParams

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel: compact on phones, full height on desktop */}
      <aside className="relative overflow-hidden bg-sidebar px-6 pb-2 pt-6 sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
        {/* soft light behind the illustration (static) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 top-1/3 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(36_83_230/0.28),transparent_65%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />

        <div className="relative">
          <Wordmark inverted />
        </div>

        <div className="relative mt-6 lg:mt-0">
          <h2 className="max-w-lg text-[26px] font-semibold leading-[1.15] tracking-tight text-white sm:text-[32px] lg:text-[38px]">
            Know who opened your invoice. And who hasn&apos;t paid.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/60 lg:mt-4">
            Give every client a private portal with only their own invoices. No more emailing PDFs into the void.
          </p>

          <div className="mt-6 lg:hidden">
            <InvoiceStack3D compact />
          </div>
          <div className="mt-10 hidden lg:block">
            <InvoiceStack3D />
          </div>
        </div>

        <ul className="relative hidden space-y-2.5 text-[13px] text-white/60 lg:block">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-2.5">
              <f.icon aria-hidden="true" className="h-4 w-4 text-white/40" />
              {f.text}
            </li>
          ))}
        </ul>
      </aside>

      {/* Sign-in */}
      <div className="flex items-start justify-center bg-canvas px-6 py-10 sm:py-14 lg:items-center">
        <div className="w-full max-w-[400px]">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in to Nudge</h1>
          <p className="mt-1.5 text-muted">Invoicing for freelancers and their clients.</p>

          <form action="/api/login" method="post" className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-body">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="you@company.com"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-body">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className={input}
              />
            </div>

            {/* Exact text the suite asserts on. Do not soften it. */}
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger"
              >
                {messages.auth.invalidCredentials}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-lg bg-accent px-3.5 py-2.5 text-sm font-semibold text-white shadow-card transition-colors duration-150 hover:bg-accent-strong"
            >
              Sign in
            </button>
          </form>

          <section className="mt-10" aria-labelledby="demo-heading">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <h2 id="demo-heading" className="text-xs font-medium uppercase tracking-[0.06em] text-faint">
                Demo accounts
              </h2>
              <div className="h-px flex-1 bg-line" />
            </div>
            <p className="mb-4 mt-3 text-[13px] leading-relaxed text-muted">
              One freelancer, two clients. Sign in as Client A and try to open Client B&apos;s invoice — the app should
              refuse.
            </p>
            <DemoButtons />
          </section>
        </div>
      </div>
    </main>
  )
}
