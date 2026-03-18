import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

function getToken() {
  return createHash('sha256').update((process.env.ADMIN_PASSWORD || '') + 'hq-command-center').digest('hex')
}

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('hq_auth', getToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
