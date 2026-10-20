# Nudge

**Freelancers give each client a private login that shows only their own invoices — so you stop emailing PDFs and you can finally see who's opened one and who hasn't paid.**

**Live:** https://nudge-spike.vercel.app
**Every pull request is tested by TestSprite against its own preview deployment, with its own database branch.**

## Try it

The login page has three one-click demo buttons — no credentials to type.

| Sign in as | Sees |
|---|---|
| **Freelancer** | All of their invoices, and actions to send, record payment, void, delete |
| **Client A** (Northwind) | Only Northwind's invoices |
| **Client B** (Lumen) | Only Lumen's invoices |

Both clients belong to the *same* freelancer. That's the interesting case: cross-freelancer isolation is easy to remember, cross-client isolation within one freelancer is what real apps get wrong.

**Try it:** sign in as Client A, then open `/portal/invoices/INV-1002` — that's Client B's invoice. The app returns not-found, and the page contains neither the invoice number nor its total.

## What the suite covers

16 TestSprite tests across six areas, run automatically on every pull request:

1. **Authentication** — role-based landing, exact error text, signed-out redirects
2. **Money invariants** — exact subtotal/tax/total, and two rounding traps that catch float and banker's-rounding implementations
3. **Dashboard state** — derived Overdue status, ownership scoping
4. **Lifecycle** — draft → sent → viewed → paid, void refused on paid invoices, confirm-to-delete
5. **Client portal** — own invoices only, drafts invisible, no write actions
6. **Tenant isolation** — five cases that fail if the backend trusts the frontend

Isolation cases assert the **absence of a specific value** (`INV-1002`, `$640.00`) rather than a generic "access denied", because a 200 with someone else's data on it passes a lazy assertion.

Run behavior is deliberately non-default: **"Log in once per run" is OFF**, so each case authenticates as its own role. Left on, every isolation test would silently run as one user and prove nothing.

## How the tests stay honest

- **Every pull request gets its own Neon database branch**, seeded at deploy time. A run can't see another run's writes, so a red check is always reproducible.
- **Fixtures are immutable.** Invoices `INV-10xx` are never mutated by anything; only `INV-11xx` disposables change. No fixture is ever in a state that a read would transition.
- **`viewed_at` is idempotent** — the update requires `status = 'sent'`, so re-opening a viewed invoice writes nothing.
- **Seed dates are relative to `now()`**, so they never drift into Overdue during judging.

## Architecture

Next.js (App Router) · Postgres on Neon · Tailwind · Vercel preview deployments.

Three rules the code follows:

- **Ownership lives in the SQL `WHERE` clause.** Never fetch-then-filter in JavaScript — one forgotten `if` is a data leak, and it makes the isolation tests meaningless.
- **Money is integer cents.** Quantity is thousandths, tax is basis points, rounding is half-up per line then summed. No floats.
- **One not-found page for every invisible row.** Another client's invoice, another tenant's invoice, your own draft, and a nonexistent id are indistinguishable — anything else confirms an invoice exists.

## Run locally

```bash
npm install
cp .env.example .env      # DATABASE_URL, DATABASE_URL_UNPOOLED, SESSION_SECRET
npm run db:reset          # schema + deterministic seed
npm run dev
```

```bash
node scripts/check-isolation.mjs http://localhost:3000
```

`check-isolation.mjs` fires real HTTP requests at the five isolation boundaries — a two-second local loop that doesn't spend TestSprite credits.
