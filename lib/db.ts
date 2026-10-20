/**
 * Postgres client. One pool, reused across hot reloads in dev.
 *
 * Always use the POOLED url at runtime — serverless functions open a lot of
 * short-lived connections and the unpooled URL will exhaust them.
 * The UNPOOLED url is only for DDL and seeding (scripts/apply-schema.mjs, seed.mjs).
 */
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined
}

export const sql =
  globalThis.__sql ??
  postgres(url, {
    max: 5, // low ceiling: previews share the same Neon project
    idle_timeout: 20,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== 'production') globalThis.__sql = sql
