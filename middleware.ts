import { NextRequest, NextResponse } from 'next/server'

async function getExpectedToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD || ''
  const data = new TextEncoder().encode(password + 'hq-command-center')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/auth/login') || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('hq_auth')?.value
  const expected = await getExpectedToken()
  if (token && token === expected) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
