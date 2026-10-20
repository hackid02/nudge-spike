import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nudge — invoicing for freelancers',
  description:
    'Freelancers give each client a private login that shows only their own invoices.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Geist ships inside the npm package (no network fetch at build time)
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-sm text-body antialiased">
        {children}
      </body>
    </html>
  )
}
