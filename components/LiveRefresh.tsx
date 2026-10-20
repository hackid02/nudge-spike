'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const POLL_MS = 8000

/**
 * "Live" badge + quiet poller. Every few seconds (only while the tab is visible)
 * it asks /api/activity for a fingerprint; if it differs from what the page was
 * rendered with, it refreshes the server components in place. No change, no
 * re-render — the page is perfectly still while nothing happens.
 */
export function LiveRefresh({ version }: { version: string }) {
  const router = useRouter()
  const current = useRef(version)
  const [flash, setFlash] = useState(false)

  // a refresh brings a new server-rendered version prop
  useEffect(() => {
    current.current = version
  }, [version])

  useEffect(() => {
    let stopped = false
    async function tick() {
      if (document.visibilityState !== 'visible') return
      try {
        const res = await fetch('/api/activity', { cache: 'no-store' })
        if (!res.ok) return
        const { version: next } = (await res.json()) as { version?: string }
        if (!stopped && next && next !== current.current) {
          current.current = next
          setFlash(true)
          router.refresh()
          window.setTimeout(() => setFlash(false), 4000)
        }
      } catch {
        /* offline or server restarting: try again next tick */
      }
    }
    const id = window.setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      stopped = true
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [router])

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors duration-300 ${
        flash ? 'bg-accent-soft text-accent ring-accent/30' : 'bg-success-soft text-success ring-success/20'
      }`}
      title="Updates automatically when a client opens or pays an invoice"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {flash ? 'Updated' : 'Live'}
    </span>
  )
}
