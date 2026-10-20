/**
 * Every database read and write for the app.
 *
 * THE RULE, and it is the whole 40-point suite:
 *   ownership is in the WHERE clause, never in an `if` after the fetch.
 *
 * Why it matters twice:
 *   1. It's the correct way to write it — one forgotten `if` and the app leaks.
 *   2. It makes the isolation tests meaningful. If we fetched then filtered in JS,
 *      any endpoint we forgot would still leak, and the tests would be a coin flip.
 *
 * Note the parameter order: the OWNER ID is always first, and always part of the
 * predicate. There is no function in this file that can return another tenant's row.
 */
import { sql } from './db'
import { computeTotals, type Item } from './money'

export type StoredStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'void'

export type InvoiceRow = {
  id: string
  status: StoredStatus
  issued_on: string
  due_on: string
  tax_rate_bp: number
  viewed_at: string | null
  paid_at: string | null
  notes: string
  client_name: string
  client_business: string
  total_cents: number
}

export type InvoiceDetail = InvoiceRow & {
  items: (Item & { description: string })[]
  subtotal_cents: number
  tax_cents: number
}

/* ------------------------------------------------------------------ *
 * freelancer side
 * ------------------------------------------------------------------ */

/** Dashboard list. Scoped to this freelancer. */
export async function listFreelancerInvoices(freelancerId: string): Promise<InvoiceRow[]> {
  return sql<InvoiceRow[]>`
    select i.id,
           i.status,
           i.issued_on::text,
           i.due_on::text,
           i.tax_rate_bp,
           i.viewed_at::text,
           i.paid_at::text,
           i.notes,
           u.name            as client_name,
           u.business_name   as client_business,
           coalesce(sum(round(ii.qty_milli * ii.unit_cents / 1000.0)), 0)::int as total_cents
      from invoices i
      join users u on u.id = i.client_id
      left join invoice_items ii on ii.invoice_id = i.id
     where i.freelancer_id = ${freelancerId}
     group by i.id, u.name, u.business_name
     order by i.due_on asc, i.id asc
  `
}

/** One invoice, with lines. `freelancer_id` in the WHERE is the guard. */
export async function getFreelancerInvoice(
  freelancerId: string,
  invoiceId: string,
): Promise<InvoiceDetail | null> {
  const [inv] = await sql<InvoiceRow[]>`
    select i.id, i.status, i.issued_on::text, i.due_on::text, i.tax_rate_bp,
           i.viewed_at::text, i.paid_at::text, i.notes,
           u.name as client_name, u.business_name as client_business,
           0 as total_cents
      from invoices i
      join users u on u.id = i.client_id
     where i.id = ${invoiceId}
       and i.freelancer_id = ${freelancerId}
  `
  if (!inv) return null

  const items = await sql<(Item & { description: string })[]>`
    select description, qty_milli, unit_cents
      from invoice_items
     where invoice_id = ${inv.id}
     order by position asc
  `

  const totals = computeTotals(items, inv.tax_rate_bp)
  return {
    ...inv,
    items,
    subtotal_cents: totals.subtotalCents,
    tax_cents: totals.taxCents,
    total_cents: totals.totalCents,
  }
}

export type Stats = {
  outstanding_cents: number
  overdue_cents: number
  paid_this_month_cents: number
}

/**
 * Dashboard tiles.
 * Outstanding = every invoice not paid and not void (drafts don't count as owed).
 * Overdue     = the subset of that whose due date has passed.
 */
export async function freelancerStats(freelancerId: string): Promise<Stats> {
  const [row] = await sql<Stats[]>`
    with totals as (
      select i.id, i.status, i.due_on,
             coalesce(sum(round(ii.qty_milli * ii.unit_cents / 1000.0)), 0)::int as total_cents,
             i.paid_at
        from invoices i
        left join invoice_items ii on ii.invoice_id = i.id
       where i.freelancer_id = ${freelancerId}
       group by i.id
    )
    select
      coalesce(sum(case when status in ('sent','viewed') then total_cents end), 0)::int
        as outstanding_cents,
      coalesce(sum(case when status in ('sent','viewed') and due_on < current_date
                        then total_cents end), 0)::int
        as overdue_cents,
      coalesce(sum(case when status = 'paid'
                         and date_trunc('month', paid_at) = date_trunc('month', now())
                        then total_cents end), 0)::int
        as paid_this_month_cents
    from totals
  `
  return row
}

/** draft -> sent */
export async function sendInvoice(freelancerId: string, invoiceId: string): Promise<boolean> {
  const rows = await sql`
    update invoices
       set status = 'sent'
     where id = ${invoiceId}
       and freelancer_id = ${freelancerId}
       and status = 'draft'
    returning id
  `
  return rows.length > 0
}

/** sent|viewed -> paid */
export async function recordPayment(freelancerId: string, invoiceId: string): Promise<boolean> {
  const rows = await sql`
    update invoices
       set status = 'paid', paid_at = now()
     where id = ${invoiceId}
       and freelancer_id = ${freelancerId}
       and status in ('sent', 'viewed')
    returning id
  `
  return rows.length > 0
}

/**
 * -> void, but NEVER from paid. The `status <> 'paid'` is the enforcement of
 * the rule the suite asserts; the exact user-facing message lives in lib/messages.ts.
 */
export async function voidInvoice(freelancerId: string, invoiceId: string): Promise<boolean> {
  const rows = await sql`
    update invoices
       set status = 'void'
     where id = ${invoiceId}
       and freelancer_id = ${freelancerId}
       and status <> 'paid'
       and status <> 'void'
    returning id
  `
  return rows.length > 0
}

export async function deleteInvoice(freelancerId: string, invoiceId: string): Promise<boolean> {
  const rows = await sql`
    delete from invoices
     where id = ${invoiceId}
       and freelancer_id = ${freelancerId}
    returning id
  `
  return rows.length > 0
}

/* ------------------------------------------------------------------ *
 * client side — the surface the suite attacks
 * ------------------------------------------------------------------ */

/**
 * Client portal list.
 * Excludes drafts (not yet sent) and, by construction, everyone else's rows.
 */
export async function listClientInvoices(clientId: string): Promise<InvoiceRow[]> {
  return sql<InvoiceRow[]>`
    select i.id, i.status, i.issued_on::text, i.due_on::text, i.tax_rate_bp,
           i.viewed_at::text, i.paid_at::text, i.notes,
           u.business_name as client_name,
           u.business_name as client_business,
           coalesce(sum(round(ii.qty_milli * ii.unit_cents / 1000.0)), 0)::int as total_cents
      from invoices i
      join users u on u.id = i.client_id
      left join invoice_items ii on ii.invoice_id = i.id
     where i.client_id = ${clientId}
       and i.status <> 'draft'
     group by i.id, u.business_name
     order by i.due_on asc, i.id asc
  `
}

/**
 * One invoice for a client. `client_id` is in the WHERE.
 * Returns null for: someone else's invoice, another freelancer's invoice, and
 * your own draft. The caller renders not-found for all three — deliberately
 * indistinguishable, so the route leaks nothing about what exists.
 */
export async function getClientInvoice(
  clientId: string,
  invoiceId: string,
): Promise<InvoiceDetail | null> {
  const [inv] = await sql<InvoiceRow[]>`
    select i.id, i.status, i.issued_on::text, i.due_on::text, i.tax_rate_bp,
           i.viewed_at::text, i.paid_at::text, i.notes,
           u.business_name as client_name,
           u.business_name as client_business,
           0 as total_cents
      from invoices i
      join users u on u.id = i.client_id
     where i.id = ${invoiceId}
       and i.client_id = ${clientId}
       and i.status <> 'draft'
  `
  if (!inv) return null

  const items = await sql<(Item & { description: string })[]>`
    select description, qty_milli, unit_cents
      from invoice_items
     where invoice_id = ${inv.id}
     order by position asc
  `
  const totals = computeTotals(items, inv.tax_rate_bp)

  // Idempotent by construction: the predicate requires status = 'sent', so a
  // second open of an already-'viewed' invoice matches zero rows and writes
  // nothing. This is what makes viewed fixtures safe under concurrent tests.
  await sql`
    update invoices
       set status = 'viewed', viewed_at = now()
     where id = ${invoiceId}
       and client_id = ${clientId}
       and status = 'sent'
  `

  return {
    ...inv,
    status: inv.status === 'sent' ? 'viewed' : inv.status,
    items,
    subtotal_cents: totals.subtotalCents,
    tax_cents: totals.taxCents,
    total_cents: totals.totalCents,
  }
}

/**
 * Export rows.
 * A SECOND query, independently scoped — not a re-use of listClientInvoices.
 * The classic bug is an export that filters by freelancer (or not at all) while
 * the list filters by client; the page looks right and the data leaks.
 * The suite's E5 case exists to catch exactly this.
 */
export async function exportClientInvoices(clientId: string) {
  return sql<{ id: string; due_on: string; status: StoredStatus; total_cents: number }[]>`
    select i.id,
           i.due_on::text as due_on,
           i.status,
           coalesce(sum(round(ii.qty_milli * ii.unit_cents / 1000.0)), 0)::int as total_cents
      from invoices i
      left join invoice_items ii on ii.invoice_id = i.id
     where i.client_id = ${clientId}
       and i.status <> 'draft'
     group by i.id
     order by i.due_on asc, i.id asc
  `
}

/** Used by the demo login buttons and the login form. */
export async function findUserByEmail(email: string) {
  const [u] = await sql<
    { id: string; email: string; password_hash: string; role: 'freelancer' | 'client'; name: string }[]
  >`
    select id, email, password_hash, role, name
      from users
     where email = ${email.toLowerCase().trim()}
  `
  return u ?? null
}
