import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nudge — invoicing for freelancers',
  description:
    'Freelancers give each client a private login that shows only their own invoices.',
}

/*
 * Runs before first paint: applies the saved theme, or the system setting when
 * nothing is saved, so dark-mode users never see a white flash.
 */
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;if(d)r.classList.add('dark');r.style.colorScheme=d?'dark':'light'}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Geist ships inside the npm package (no network fetch at build time).
    // suppressHydrationWarning: the theme script may add class="dark" before React hydrates.
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-sm text-body antialiased">{children}</body>
    </html>
  )
}
