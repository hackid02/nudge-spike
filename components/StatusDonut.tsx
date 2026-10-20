import { formatCents } from '@/lib/money'

export type DonutSlice = { label: string; cents: number; color: string; count: number }

/**
 * Static SVG donut of invoice value by status. No chart library, no animation.
 * The legend carries every number in text, so the chart is never the only
 * place a value lives (and is readable without colour).
 */
export function StatusDonut({ slices, centerLabel }: { slices: DonutSlice[]; centerLabel: string }) {
  const total = slices.reduce((a, s) => a + s.cents, 0)
  const R = 42
  const C = 2 * Math.PI * R
  const GAP = total > 0 && slices.filter((s) => s.cents > 0).length > 1 ? 2.5 : 0
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`Invoice value by status, ${formatCents(total)} total`}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-inset)" strokeWidth="11" />
          {total > 0
            ? slices.map((s) => {
                if (s.cents <= 0) return null
                const len = (s.cents / total) * C
                const seg = (
                  <circle
                    key={s.label}
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="11"
                    strokeDasharray={`${Math.max(len - GAP, 0.01)} ${C}`}
                    strokeDashoffset={-offset}
                  />
                )
                offset += len
                return seg
              })
            : null}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[15px] font-semibold tabular-nums text-ink">{formatCents(total)}</p>
            <p className="text-[11px] text-muted">{centerLabel}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2 text-[13px]">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-body">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
              <span className="text-faint">· {s.count}</span>
            </span>
            <span className="font-medium tabular-nums text-ink">{formatCents(s.cents)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
