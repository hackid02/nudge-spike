import { NextResponse } from 'next/server'
import { sessionCookie } from '@/lib/session'

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL('/login', request.url), { status: 303 })
  res.cookies.set(sessionCookie.name, '', { ...sessionCookie.options, maxAge: 0 })
  return res
}

export async function GET(request: Request) {
  return POST(request)
}
