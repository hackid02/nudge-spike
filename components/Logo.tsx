import { useId } from 'react'

/**
 * Nudge mark: an abstract "N" drawn as one continuous stroke on a deep-blue
 * gradient tile, with a small green "ping" — the moment a client opens an invoice.
 * Pure SVG, no image fetch. Same artwork as app/icon.svg (browser tab).
 */
export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4a76ff" />
          <stop offset="0.55" stopColor="#2453e6" />
          <stop offset="1" stopColor="#14298a" />
        </linearGradient>
        <linearGradient id={`${id}-stroke`} x1="9" y1="22" x2="23" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe4ff" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="16" y1="0" x2="16" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id}-bg)`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#ffffff" strokeOpacity="0.14" />
      <rect width="32" height="32" rx="9" fill={`url(#${id}-shine)`} />
      <path
        d="M10 22.5V11.2c0-.9 1.1-1.3 1.7-.6l8.6 10.6c.6.7 1.7.3 1.7-.6V14"
        fill="none"
        stroke={`url(#${id}-stroke)`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="9.2" r="3.4" fill="#14298a" />
      <circle cx="22" cy="9.2" r="2.3" fill="#4ade80" />
    </svg>
  )
}
