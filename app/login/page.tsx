import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CodeXml, Eye, Lock, ShieldCheck } from 'lucide-react'
import { getSession } from '@/lib/session'
import { messages } from '@/lib/messages'
import { Wordmark } from '@/components/ui'
import { ThemeToggle } from '@/components/ThemeToggle'
import { InvoiceStack3D } from '@/components/InvoiceStack3D'
import { DemoButtons } from './DemoButtons'

export const dynamic = 'force-dynamic'

const REPO = 'https://github.com/hackid02/nudge-spike'

const input =
  'mt-1.5 block w-full rounded-lg border border-line-strong bg-card px-3.5 py-2.5 text-sm text-ink shadow-card outline-none transition-colors duration-150 placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/10'

const features = [
  { icon: Eye, text: 'See the moment a client opens an invoice' },
  { icon: ShieldCheck, text: 'Each client sees only their own invoices' },
  { icon: Lock, text: 'Ownership checked in every database query' },
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
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* ---------- Hero (always dark) ---------- */}
      <section className="relative overflow-hidden border-b border-white/5 bg-sidebar text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-10 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgb(36_83_230/0.32),transparent_65%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 bottom-[-260px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(6_118_71/0.18),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
        />

        <header className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6">
          <Link href="/login" aria-label="Nudge home">
            <Wordmark inverted />
          </Link>
          <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
            <a
              href="#demo"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white sm:inline-block"
            >
              Demo accounts
            </a>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white sm:inline-block"
            >
              GitHub
            </a>
            <ThemeToggle onDark />
            <a
              href="#signin"
              className="ml-1 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-[#101828] shadow-card transition-colors duration-150 hover:bg-white/90"
            >
              Sign in
            </a>
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-24 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[13px] font-medium text-white/80 backdrop-blur-md">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              Read receipts for your invoices
            </span>
            <h2 className="mt-6 max-w-xl text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-[46px] lg:text-[52px]">
              Know who opened your invoice. And who hasn&apos;t paid.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65 sm:text-[17px]">
              Give every client a private portal with only their own invoices. No more emailing PDFs into the void.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#signin"
                className="inline-flex items-center gap-2 rounded-lg bg-[#2453e6] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(36_83_230/0.8)] transition-colors duration-150 hover:bg-[#1c44c4]"
              >
                Try the live demo
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-colors duration-150 hover:bg-white/[0.12]"
              >
                <CodeXml aria-hidden="true" className="h-4 w-4" />
                View the code
              </a>
            </div>
            <ul className="mt-10 space-y-2.5 text-sm text-white/60">
              {features.map((f) => (
                <li key={f.text} className="flex items-center gap-2.5">
                  <f.icon aria-hidden="true" className="h-4 w-4 text-white/40" />
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-8 lg:hidden">
            <InvoiceStack3D compact />
          </div>
          <div className="hidden lg:block">
            <InvoiceStack3D />
          </div>
        </div>
      </section>

      {/* ---------- Sign in + demo accounts ---------- */}
      <section id="signin" className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="rounded-2xl border border-line bg-card p-6 shadow-card sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in to Nudge</h1>
            <p className="mt-1.5 text-muted">Invoicing for freelancers and their clients.</p>

            <form action="/api/login" method="post" className="mt-7 space-y-4">
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
          </div>

          <section id="demo" className="scroll-mt-6" aria-labelledby="demo-heading">
            <div className="flex items-center gap-3">
              <h2 id="demo-heading" className="text-xs font-medium uppercase tracking-[0.06em] text-faint">
                Demo accounts
              </h2>
              <div className="h-px flex-1 bg-line" />
            </div>
            <p className="mb-4 mt-3 text-[15px] leading-relaxed text-muted">
              One freelancer, two clients. Sign in as Client A and try to open Client B&apos;s invoice — the app should
              refuse.
            </p>
            <DemoButtons />
            <p className="mt-4 text-[13px] text-faint">
              No sign-up needed. Demo data is shared by every visitor, so you may see changes others have made.
            </p>
          </section>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="mt-auto border-t border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Invoices with read receipts. Every client gets a private portal that shows only their own invoices.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-[13px]">
            <div>
              <p className="font-semibold text-ink">Product</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <a href="#signin" className="transition-colors duration-150 hover:text-ink">
                    Live demo
                  </a>
                </li>
                <li>
                  <a href="#demo" className="transition-colors duration-150 hover:text-ink">
                    Demo accounts
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-ink">Project</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <a href={REPO} target="_blank" rel="noreferrer" className="transition-colors duration-150 hover:text-ink">
                    Source on GitHub
                  </a>
                </li>
                <li>
                  <a
                    href={`${REPO}#readme`}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors duration-150 hover:text-ink"
                  >
                    How it&apos;s tested
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© 2026 Nudge</p>
            <p>Built for TestSprite Hackathon Season 4</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
