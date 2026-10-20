import Link from 'next/link'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { messages } from '@/lib/messages'
import { Wordmark } from '@/components/ui'

/**
 * One not-found page for every reason a row is invisible:
 * another client's invoice, another freelancer's invoice, your own draft,
 * or an id that never existed.
 *
 * Deliberately indistinguishable — a page that said "that invoice belongs to
 * someone else" would confirm the invoice exists, which is itself a leak.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12">
      <Wordmark />
      <div className="mt-8 w-full max-w-[420px] rounded-xl border border-line bg-card p-8 text-center shadow-card">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-inset text-muted">
          <FileQuestion aria-hidden="true" className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">{messages.invoice.notFound}</h1>
        <p className="mt-2 text-sm text-muted">
          This page doesn&apos;t exist, or it doesn&apos;t belong to your account.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line-strong bg-card px-3.5 py-2 text-sm font-semibold text-body shadow-card transition-colors duration-150 hover:bg-panel hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Go back
        </Link>
      </div>
    </main>
  )
}
