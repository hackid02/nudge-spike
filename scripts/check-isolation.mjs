/**
 * Isolation checker — proves the tenant boundaries before TestSprite does.
 *
 * This is NOT a replacement for the TestSprite suite (that's what's scored).
 * It exists so that when a TestSprite case goes red, we already know whether the
 * app is broken or the test is. It also gives us a fast local loop that doesn't
 * burn credits.
 *
 * Usage:
 *   node scripts/check-isolation.mjs https://nudge.vercel.app
 *   node scripts/check-isolation.mjs http://localhost:3000
 *
 * Exits non-zero on any failure, so it can be chained into CI later.
 */

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')

const USERS = {
  maya: { email: 'maya@studio.test', password: 'demo1234', role: 'freelancer' },
  dev: { email: 'dev@other.studio.test', password: 'demo1234', role: 'freelancer' },
  ada: { email: 'ada@northwind.test', password: 'demo1234', role: 'client' },
  ben: { email: 'ben@lumen.test', password: 'demo1234', role: 'client' },
}

let pass = 0
let fail = 0

function check(label, condition, detail = '') {
  if (condition) {
    pass++
    console.log(`  ok    ${label}`)
  } else {
    fail++
    console.log(`  FAIL  ${label}${detail ? `\n         ${detail}` : ''}`)
  }
}

async function login(who) {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: USERS[who].email, password: USERS[who].password }),
    redirect: 'manual',
  })
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) throw new Error(`login as ${who} returned no cookie (status ${res.status})`)
  return setCookie.split(';')[0]
}

async function get(cookie, path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie },
    redirect: 'manual',
  })
  const body = res.status >= 300 && res.status < 400 ? '' : await res.text()
  return { status: res.status, body, location: res.headers.get('location') }
}

/** Strip HTML tags so absence checks aren't fooled by markup. */
const text = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')

async function main() {
  console.log(`\nisolation check against ${BASE}\n`)

  console.log('auth')
  const maya = await login('maya')
  const dev = await login('dev')
  const ada = await login('ada')
  check('maya, dev, ada can all sign in', Boolean(maya && dev && ada))

  console.log('\nE1  client cannot read another client\'s invoice (same freelancer)')
  const e1 = await get(ada, '/portal/invoices/INV-1002')
  const e1t = text(e1.body)
  check('INV-1002 not exposed to ada', !e1t.includes('INV-1002') && !e1t.includes('640.00'),
    `status ${e1.status}; leaked="${e1t.slice(0, 120)}"`)

  console.log('\nE2  client cannot reach another freelancer\'s tenant')
  const e2 = await get(ada, '/portal/invoices/INV-2001')
  check('INV-2001 not exposed to ada', !text(e2.body).includes('4,400.00'))

  console.log('\nE3  client cannot reach freelancer routes')
  const e3 = await get(ada, '/invoices/INV-1001')
  const redirected = e3.status >= 300 && e3.status < 400
  check('ada sent away from /invoices/INV-1001',
    redirected || !text(e3.body).includes('1,417.61'),
    `status ${e3.status} location ${e3.location ?? '-'}`)

  console.log('\nE4  freelancer cannot read another freelancer\'s invoice')
  const e4 = await get(dev, '/invoices/INV-1001')
  check('dev cannot see maya\'s INV-1001', !text(e4.body).includes('1,417.61'),
    `status ${e4.status}`)

  console.log('\nE5  the export re-applies ownership (data layer)')
  const e5 = await get(ada, '/portal/export')
  const e5t = text(e5.body)
  check('export excludes ben\'s INV-1002', !e5t.includes('INV-1002') && !e5t.includes('640.00'))
  check('export excludes ada\'s draft INV-1003', !e5t.includes('INV-1003'))
  check('export excludes other tenant INV-2001', !e5t.includes('INV-2001'))

  console.log('\nportal contents')
  const portal = await get(ada, '/portal')
  const pt = text(portal.body)
  check('ada sees INV-1001', pt.includes('INV-1001'))
  check('ada sees INV-1004 (overdue)', pt.includes('INV-1004'))
  check('ada does NOT see ben\'s INV-1005', !pt.includes('INV-1005'))
  check('ada does NOT see draft INV-1003', !pt.includes('INV-1003'))

  console.log('\nsigned out')
  const anon = await get('', '/portal')
  check('anonymous is redirected away from /portal',
    anon.status >= 300 && anon.status < 400,
    `status ${anon.status}`)

  console.log(`\n${pass} passed, ${fail} failed\n`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('\nchecker crashed:', err.message)
  console.error('is the app running and reachable at', BASE, '?')
  process.exit(1)
})
