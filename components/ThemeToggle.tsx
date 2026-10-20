'use client'

import { Moon, Sun } from 'lucide-react'

/**
 * Light/dark switch. The icon is chosen by CSS (dark: variant), not state, so
 * server and client render identical HTML — no hydration mismatch, no flash.
 * The choice is remembered per browser; with no choice, the system setting wins
 * (applied before paint by the inline script in app/layout.tsx).
 */
export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  function toggle() {
    const root = document.documentElement
    const dark = !root.classList.contains('dark')
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      /* private mode: the toggle still works for this page view */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors duration-150 ${
        onDark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-muted hover:bg-inset hover:text-ink'
      }`}
    >
      <Moon aria-hidden="true" className="h-[18px] w-[18px] dark:hidden" />
      <Sun aria-hidden="true" className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  )
}
