/**
 * Seed for Nudge. Idempotent: truncates, then inserts.
 *
 * Two sets, and the split is load-bearing (SPEC.md §5):
 *   FIXTURES     INV-10xx — never mutated by anything. Tests only read these.
 *   DISPOSABLES  INV-11xx — one per mutating test case. Nothing else touches them.
 *
 * Why: a single run executes many cases concurrently against ONE database.
 * A fixture must therefore be safe to read at any moment in any order.
 * In particular NO FIXTURE IS EVER 'sent' — opening a 'sent' invoice stamps
 * viewed_at, which would make "status = Sent" assertions order-dependent.
 * 'viewed' fixtures still derive as Overdue when their due date has passed.
 *
 * Dates are relative to now(), never hardcoded — a hardcoded date silently
 * flips to Overdue mid-judging and turns green tests red.
 *
 * Run: node scripts/seed.mjs   (needs DATABASE_URL_UNPOOLED or DATABASE_URL)
 */
import postgres from 'postgres'
import { scrypt, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const SQL_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!SQL_URL) {
  console.error('DATABASE_URL_UNPOOLED or DATABASE_URL is required')
  process.exit(1)
}
const sql = postgres(SQL_URL, { max: 1 })

const PASSWORD = 'demo1234'

async function hash(password) {
  const salt = randomBytes(16).toString('hex')
  const key = await scryptAsync(password, salt, 64)
  return `scrypt$${salt}$${key.toString('hex')}`
}

const day = 86_400_000
const dateOnly = (offsetDays) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10)
const ts = (offsetDays) => new Date(Date.now() + offsetDays * day)

const USERS = [
  { id: 'u_maya', email: 'maya@studio.test',            role: 'freelancer', name: 'Maya Okafor',  business_name: 'Okafor Studio',   freelancer_id: null },
  { id: 'u_dev',  email: 'dev@other.studio.test',       role: 'freelancer', name: 'Dev Patel',    business_name: 'Patel & Co',      freelancer_id: null },
  { id: 'u_ada',  email: 'ada@northwind.test',          role: 'client',     name: 'Ada Bell',     business_name: 'Northwind Co',    freelancer_id: 'u_maya' },
  { id: 'u_ben',  email: 'ben@lumen.test',              role: 'client',     name: 'Ben Ortiz',    business_name: 'Lumen Labs',      freelancer_id: 'u_maya' },
  { id: 'u_cy',   email: 'cy@apex.test',                role: 'client',     name: 'Cy Mensah',    business_name: 'Apex Ltd',        freelancer_id: 'u_dev'  },
]

// tax_rate_bp: 500 = 5%, 725 = 7.25%
const FIXTURES = [
  {
    id: 'INV-1001', freelancer_id: 'u_maya', client_id: 'u_ada', status: 'viewed',
    issued_on: dateOnly(-10), due_on: dateOnly(26), tax_rate_bp: 500,
    viewed_at: ts(-3), paid_at: null,
    notes: 'Brand refresh, phase one.',
    items: [
      { description: 'Brand identity design',  qty_milli: 1000, unit_cents: 95000 },
      { description: 'Revision rounds',        qty_milli: 1500, unit_cents: 9997  }, // 149.955 -> $149.96 (float says 149.95)
      { description: 'Hosting setup',          qty_milli: 2000, unit_cents: 12507 },
    ],
  },
  {
    id: 'INV-1002', freelancer_id: 'u_maya', client_id: 'u_ben', status: 'paid',
    issued_on: dateOnly(-45), due_on: dateOnly(-15), tax_rate_bp: 0,
    viewed_at: ts(-40), paid_at: ts(-15),
    notes: 'Landing page build.',
    items: [{ description: 'Landing page build', qty_milli: 1000, unit_cents: 64000 }],
  },
  {
    id: 'INV-1003', freelancer_id: 'u_maya', client_id: 'u_ada', status: 'draft',
    issued_on: dateOnly(-2), due_on: dateOnly(56), tax_rate_bp: 0,
    viewed_at: null, paid_at: null,
    notes: 'Unsent draft — clients must never see this.',
    items: [{ description: 'Logo exploration', qty_milli: 1000, unit_cents: 30000 }],
  },
  {
    id: 'INV-1004', freelancer_id: 'u_maya', client_id: 'u_ada', status: 'viewed',
    issued_on: dateOnly(-49), due_on: dateOnly(-19), tax_rate_bp: 0,
    viewed_at: ts(-40), paid_at: null,
    notes: 'Past due — derives as Overdue.',
    items: [{ description: 'Consulting call', qty_milli: 1000, unit_cents: 9250 }],
  },
  {
    id: 'INV-1005', freelancer_id: 'u_maya', client_id: 'u_ben', status: 'viewed',
    issued_on: dateOnly(-21), due_on: dateOnly(12), tax_rate_bp: 0,
    viewed_at: ts(-18), paid_at: null,
    notes: 'Retainer, October.',
    items: [{ description: 'Monthly retainer', qty_milli: 1000, unit_cents: 120000 }],
  },
  {
    id: 'INV-1007', freelancer_id: 'u_maya', client_id: 'u_ada', status: 'viewed',
    issued_on: dateOnly(-5), due_on: dateOnly(40), tax_rate_bp: 725,
    viewed_at: ts(-4), paid_at: null,
    notes: 'Tax edge case: 7.25% of $999.99.',
    items: [{ description: 'Audit package', qty_milli: 3000, unit_cents: 33333 }],
  },
  {
    id: 'INV-2001', freelancer_id: 'u_dev', client_id: 'u_cy', status: 'viewed',
    issued_on: dateOnly(-12), due_on: dateOnly(31), tax_rate_bp: 0,
    viewed_at: ts(-10), paid_at: null,
    notes: 'Another tenant entirely.',
    items: [{ description: 'Platform migration', qty_milli: 1000, unit_cents: 440000 }],
  },
]

const DISPOSABLES = [
  { id: 'INV-1101', freelancer_id: 'u_maya', client_id: 'u_ada', status: 'draft', issued_on: dateOnly(-1), due_on: dateOnly(30),  tax_rate_bp: 0, total: 45000,  notes: 'send -> void' },
  { id: 'INV-1102', freelancer_id: 'u_maya', client_id: 'u_ada', status: 'sent',  issued_on: dateOnly(-3), due_on: dateOnly(20),  tax_rate_bp: 0, total: 87500,  notes: 'record payment' },
  { id: 'INV-1103', freelancer_id: 'u_maya', client_id: 'u_ben', status: 'sent',  issued_on: dateOnly(-4), due_on: dateOnly(25),  tax_rate_bp: 0, total: 24000,  notes: 'money invariance' },
  { id: 'INV-1104', freelancer_id: 'u_maya', client_id: 'u_ada', status: 'paid',  issued_on: dateOnly(-20), due_on: dateOnly(-5), tax_rate_bp: 0, total: 6000,   notes: 'void refused', paidDaysAgo: 5 },
  { id: 'INV-1105', freelancer_id: 'u_maya', client_id: 'u_ada', status: 'sent',  issued_on: dateOnly(-2), due_on: dateOnly(18),  tax_rate_bp: 0, total: 31000,  notes: 'client opens -> viewed' },
  { id: 'INV-1106', freelancer_id: 'u_maya', client_id: 'u_ben', status: 'draft', issued_on: dateOnly(-1), due_on: dateOnly(35),  tax_rate_bp: 0, total: 12500,  notes: 'delete with confirm' },
].map((d) => ({
  ...d,
  viewed_at: null,
  paid_at: d.paidDaysAgo ? ts(-d.paidDaysAgo) : null,
  items: [{ description: `Disposable ${d.id}`, qty_milli: 1000, unit_cents: d.total }],
}))

async function main() {
  console.log('truncating...')
  await sql`truncate table invoice_items, invoices, users restart identity cascade`

  console.log('hashing password...')
  const password_hash = await hash(PASSWORD)

  console.log(`inserting ${USERS.length} users...`)
  for (const u of USERS) {
    await sql`
      insert into users ${sql({ ...u, password_hash })}
    `
  }

  const all = [...FIXTURES, ...DISPOSABLES]
  console.log(`inserting ${all.length} invoices...`)
  for (const inv of all) {
    const { items, paidDaysAgo, total, ...row } = inv
    await sql`insert into invoices ${sql(row)}`
    let position = 0
    for (const item of items) {
      await sql`
        insert into invoice_items ${sql({
          id: `${inv.id}-L${position + 1}`,
          invoice_id: inv.id,
          description: item.description,
          qty_milli: item.qty_milli,
          unit_cents: item.unit_cents,
          position,
        })}
      `
      position += 1
    }
  }

  const [{ count: users }] = await sql`select count(*)::int from users`
  const [{ count: invoices }] = await sql`select count(*)::int from invoices`
  const [{ count: items }] = await sql`select count(*)::int from invoice_items`
  const [{ count: sentfixtures }] = await sql`
    select count(*)::int from invoices where id like 'INV-10%' and status = 'sent'`

  console.log(`\nrow counts: users=${users} invoices=${invoices} items=${items}`)
  console.log(`sent fixtures (must be 0): ${sentfixtures}`)
  if (done(sentfixtures)) console.log('seed looks correct')

  await sql.end()
}

const done = (n) => n === 0
main().catch(async (err) => {
  console.error(err)
  await sql.end()
  process.exit(1)
})
