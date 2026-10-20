/**
 * Preview-only database reset.
 *
 * Wired as `vercel-build` so every preview deployment starts from the same
 * known seed — that's what makes a red check reproducible.
 *
 * THE GUARD IS THE POINT: if this ever ran on a production build it would wipe
 * the database a judge is looking at, mid-judging. It exits 0 on anything that
 * is not an explicit preview environment, including local `next build`.
 */
import { spawnSync } from 'node:child_process'

const env = process.env.VERCEL_ENV

if (env !== 'preview') {
  console.log(`[preview-reset] VERCEL_ENV=${env ?? 'unset'} — skipping reset (guard)`)
  process.exit(0)
}

if (!process.env.DATABASE_URL_UNPOOLED) {
  console.warn('[preview-reset] no DATABASE_URL_UNPOOLED — skipping reset')
  process.exit(0)
}

const run = (label, args) => {
  console.log(`[preview-reset] ${label}`)
  const r = spawnSync('node', args, { stdio: 'inherit', env: process.env })
  if (r.status !== 0) {
    // Fail the build rather than deploy an unseeded preview: a preview with the
    // wrong data produces misleading test failures, which is worse than no deploy.
    console.error(`[preview-reset] ${label} failed`)
    process.exit(r.status ?? 1)
  }
}

run('applying schema', ['scripts/apply-schema.mjs'])
run('seeding', ['scripts/seed.mjs'])
console.log('[preview-reset] done')
