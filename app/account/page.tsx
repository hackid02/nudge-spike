import { redirect } from 'next/navigation'
import { Briefcase, Building2, FileText, KeyRound, Mail, Palette, ShieldCheck, Users } from 'lucide-react'
import { requireSession } from '@/lib/session'
import { getAccount } from '@/lib/queries'
import { AppShell, Avatar, Card, CardHeader } from '@/components/ui'
import { ThemeToggle } from '@/components/ThemeToggle'

export const dynamic = 'force-dynamic'

/**
 * Read-only account page for both roles. Everything comes from the signed
 * session's user id (no id in the URL), so it can only ever show your own account.
 * Demo accounts are shared, so nothing here is editable.
 */
export default async function AccountPage() {
  const session = await requireSession()
  const account = await getAccount(session.userId)
  // session for a user that no longer exists (e.g. after a reseed): sign in again
  if (!account) redirect('/api/logout')

  const isClient = account.role === 'client'
  const row = 'flex items-start gap-3 px-5 py-3.5'
  const label = 'text-xs font-medium text-muted'
  const value = 'mt-0.5 text-sm font-medium text-ink'

  return (
    <AppShell name={session.name} role={session.role} active="account">
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Account</h1>
        <p className="mt-1 text-muted">Who you&apos;re signed in as, and exactly what you can see.</p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile */}
          <Card className="self-start lg:col-span-2">
            <div className="flex items-center gap-4 border-b border-line px-5 py-5">
              <span className="[&>span]:h-14 [&>span]:w-14 [&>span]:text-base">
                <Avatar name={account.name} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-ink">{account.name}</p>
                <span className="mt-1 inline-flex items-center rounded-md border border-line bg-panel px-2 py-0.5 text-xs font-medium text-muted">
                  {isClient ? 'Client' : 'Freelancer'}
                </span>
              </div>
            </div>
            <dl className="divide-y divide-line">
              <div className={row}>
                <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 text-faint" />
                <div>
                  <dt className={label}>Email</dt>
                  <dd className={value} data-testid="account-email">
                    {account.email}
                  </dd>
                </div>
              </div>
              <div className={row}>
                <Building2 aria-hidden="true" className="mt-0.5 h-4 w-4 text-faint" />
                <div>
                  <dt className={label}>Business</dt>
                  <dd className={value}>{account.business_name || '—'}</dd>
                </div>
              </div>
              {isClient && account.freelancer_name ? (
                <div className={row}>
                  <Briefcase aria-hidden="true" className="mt-0.5 h-4 w-4 text-faint" />
                  <div>
                    <dt className={label}>Invoices from</dt>
                    <dd className={value}>
                      {account.freelancer_name}
                      {account.freelancer_business ? (
                        <span className="font-normal text-muted"> · {account.freelancer_business}</span>
                      ) : null}
                    </dd>
                  </div>
                </div>
              ) : null}
              <div className={row}>
                <KeyRound aria-hidden="true" className="mt-0.5 h-4 w-4 text-faint" />
                <div>
                  <dt className={label}>Sign-in</dt>
                  <dd className={value}>
                    Email and password
                    <span className="font-normal text-muted"> · demo accounts can&apos;t be edited</span>
                  </dd>
                </div>
              </div>
            </dl>
          </Card>

          <div className="space-y-6">
            {/* Access scope: the isolation guarantee, made visible */}
            <section className="relative overflow-hidden rounded-2xl bg-sidebar p-5 text-white shadow-raised ring-1 ring-white/5">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(6_118_71/0.35),transparent_68%)]"
              />
              <div className="relative">
                <div className="flex items-center gap-2 text-[13px] font-medium text-white/80">
                  <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[#7ee2a8]" />
                  Your access
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums" data-testid="visible-invoices">
                  {account.visible_invoices}
                </p>
                <p className="text-[13px] text-white/60">
                  {account.visible_invoices === 1 ? 'invoice' : 'invoices'} visible to you
                </p>
                <div className="mt-4 rounded-xl border border-white/15 bg-white/[0.07] p-3.5 text-[13px] leading-relaxed text-white/75 backdrop-blur-xl">
                  {isClient ? (
                    <>
                      Only invoices addressed to <span className="font-medium text-white">{account.business_name}</span>.
                      Drafts and other clients&apos; invoices are never shown, even by URL.
                    </>
                  ) : (
                    <>
                      Every invoice you&apos;ve created
                      {account.client_names.length ? (
                        <>
                          {' '}
                          across <span className="font-medium text-white">{account.client_names.join(', ')}</span>
                        </>
                      ) : null}
                      . Each client sees only their own.
                    </>
                  )}
                </div>
              </div>
            </section>

            <Card>
              <CardHeader title="Preferences" />
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Palette aria-hidden="true" className="h-4 w-4 text-faint" />
                  <span className="text-sm text-ink">Appearance</span>
                </div>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {isClient ? (
                    <FileText aria-hidden="true" className="h-4 w-4 text-faint" />
                  ) : (
                    <Users aria-hidden="true" className="h-4 w-4 text-faint" />
                  )}
                  <span className="text-sm text-ink">{isClient ? 'Role' : 'Clients'}</span>
                </div>
                <span className="text-sm text-muted">
                  {isClient ? 'Read-only portal' : `${account.client_names.length} connected`}
                </span>
              </div>
            </Card>

            <p className="px-1 text-[13px] text-faint">
              To switch demo accounts, use Sign out at the top of the page.
            </p>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
