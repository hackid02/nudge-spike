/**
 * Applies db/schema.sql. Idempotent (every statement is CREATE ... IF NOT EXISTS).
 * Uses the UNPOOLED connection — pooled connections and DDL don't get along.
 */
import postgres from 'postgres'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const SQL_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!SQL_URL) {
  console.error('DATABASE_URL_UNPOOLED or DATABASE_URL is required')
  process.exit(1)
}

const sql = postgres(SQL_URL, { max: 1 })

try {
  const ddl = readFileSync(join(here, '..', 'db', 'schema.sql'), 'utf8')
  await sql.unsafe(ddl)
  console.log('[apply-schema] schema applied')
  await sql.end()
} catch (err) {
  console.error('[apply-schema] failed:', err.message)
  await sql.end()
  process.exit(1)
}
