/**
 * Session handling. No NextAuth, no JWT library, no OAuth.
 *
 * A session is an HMAC-signed cookie: base64url(payload).base64url(signature).
 * The payload is readable (it's not encrypted) — that's fine, it only carries
 * userId + role. The signature is what stops tampering: change the role in the
 * cookie and the HMAC stops matching, so readSession() returns null and the
 * request is treated as signed out.
 *
 * IMPORTANT: role in the cookie is a HINT for redirects, never the authority.
 * Every query re-scopes by the database, so a forged role gets you a redirect
 * and nothing else. See lib/queries.ts.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE = 'nudge_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

export type Role = 'freelancer' | 'client'

export type Session = {
  userId: string
  role: Role
  name: string
}

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET is missing or too short (needs 16+ chars)')
  }
  return s
}

const b64 = (buf: Buffer | string) =>
  Buffer.from(buf).toString('base64url')

const sign = (payloadB64: string) =>
  createHmac('sha256', secret()).update(payloadB64).digest('base64url')

export function signSession(session: Session): string {
  const payload = b64(JSON.stringify(session))
  return `${payload}.${sign(payload)}`
}

export function readSessionFromCookieValue(value: string | undefined): Session | null {
  if (!value) return null
  const dot = value.lastIndexOf('.')
  if (dot < 1) return null

  const payload = value.slice(0, dot)
  const provided = value.slice(dot + 1)
  const expected = sign(payload)

  // constant-time compare; length mismatch would throw in timingSafeEqual
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  if (!timingSafeEqual(a, b)) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof parsed?.userId !== 'string') return null
    if (parsed.role !== 'freelancer' && parsed.role !== 'client') return null
    return { userId: parsed.userId, role: parsed.role, name: String(parsed.name ?? '') }
  } catch {
    return null
  }
}

/** Read the session in a server component / route handler. Null when signed out. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  return readSessionFromCookieValue(store.get(COOKIE)?.value)
}

/** Redirect to /login when signed out. */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

/**
 * Redirect when the role doesn't match.
 * A client hitting a freelancer page goes to /portal, not /login — they ARE
 * signed in, they just aren't allowed here. The suite asserts this.
 */
export async function requireRole(role: Role): Promise<Session> {
  const session = await requireSession()
  if (session.role !== role) {
    redirect(session.role === 'client' ? '/portal' : '/')
  }
  return session
}

export const sessionCookie = {
  name: COOKIE,
  maxAge: MAX_AGE_SECONDS,
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  },
}
