import { NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/queries'
import { verifyPassword } from '@/lib/auth'
import { signSession, sessionCookie } from '@/lib/session'
import { messages } from '@/lib/messages'

export async function POST(request: Request) {
  let email = ''
  let password = ''

  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    email = String(body.email ?? '')
    password = String(body.password ?? '')
  } else {
    const form = await request.formData()
    email = String(form.get('email') ?? '')
    password = String(form.get('password') ?? '')
  }

  const wantsJson = contentType.includes('application/json')
  const fail = () =>
    wantsJson
      ? NextResponse.json({ error: messages.auth.invalidCredentials }, { status: 401 })
      : NextResponse.redirect(new URL('/login?error=1', request.url), { status: 303 })

  if (!email || !password) return fail()

  const user = await findUserByEmail(email)
  if (!user) return fail()

  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) return fail()

  const target = user.role === 'client' ? '/portal' : '/'
  const value = signSession({ userId: user.id, role: user.role, name: user.name })

  const res = wantsJson
    ? NextResponse.json({ ok: true, role: user.role, redirectTo: target })
    : NextResponse.redirect(new URL(target, request.url), { status: 303 })

  res.cookies.set(sessionCookie.name, value, sessionCookie.options)
  return res
}
