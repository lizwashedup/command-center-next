import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

function getToken() {
  return createHash('sha256').update((process.env.ADMIN_PASSWORD || '') + 'hq-command-center').digest('hex')
}

// This login wall fronts /api/admin/* routes running on the Supabase
// service-role key (user delete, plans, messages, stats), the higher-value
// of this app's two identical password walls -- ponytail: in-memory
// per-instance limiter, not shared across concurrent serverless instances
// and resets on cold start. Trust assumption: keys off x-forwarded-for,
// which Vercel's edge network sanitizes to the real client IP (this app
// only deploys on Vercel). upgrade: move to Vercel KV/Upstash if this login
// wall ever needs to survive a sustained distributed attack.
const ATTEMPT_LIMIT = 10
const WINDOW_MS = 5 * 60 * 1000
const attempts = new Map<string, { count: number; resetAt: number }>()
let lastSweep = 0

function sweepExpired(now: number) {
  if (now - lastSweep < WINDOW_MS) return
  lastSweep = now
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(key)
  }
}

function isRateLimited(key: string, now: number): boolean {
  const entry = attempts.get(key)
  return !!entry && now <= entry.resetAt && entry.count >= ATTEMPT_LIMIT
}

function recordFailedAttempt(key: string, now: number) {
  const entry = attempts.get(key)
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
  } else {
    entry.count += 1
  }
}

export async function POST(request: NextRequest) {
  const now = Date.now()
  sweepExpired(now)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (isRateLimited(ip, now)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  // .catch() alone isn't enough: a literal `null` body is valid JSON, so
  // request.json() resolves successfully to null rather than rejecting, and
  // destructuring password off null throws. ?? {} covers that case too.
  const { password } = (await request.json().catch(() => null)) ?? {}

  // Only failed attempts count against the limit -- counting every request
  // would let 10 legitimate logins in 5 minutes lock everyone out.
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    recordFailedAttempt(ip, now)
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }
  attempts.delete(ip)

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
