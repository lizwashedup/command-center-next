import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

export const metadata: Metadata = {
  title: 'WashedUp HQ',
  description: 'Command Center',
}

function getExpectedToken() {
  return createHash('sha256').update((process.env.ADMIN_PASSWORD || '') + 'hq-command-center').digest('hex')
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('hq_auth')?.value
  const authed = token === getExpectedToken()

  return (
    <html lang="en">
      <body>
        {authed ? (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{
              marginLeft: '220px',
              flex: 1,
              padding: '32px 40px',
              minHeight: '100vh',
            }} className="page-wrapper">
              {children}
            </main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
