import { CircleCheck, Eye } from 'lucide-react'

/**
 * Static 3D illustration: a fanned stack of invoices with a "client opened it"
 * notification floating in front. Pure CSS transforms — no WebGL, no animation —
 * so it costs nothing to render and never moves under a test's cursor.
 *
 * Uses invented numbers (INV-0042 etc.) on purpose: no seeded invoice id or
 * amount may appear on the sign-in page, so isolation tests that assert the
 * ABSENCE of a value are never confused by marketing art.
 */
export function InvoiceStack3D({ compact = false }: { compact?: boolean }) {
  const scene = (
    <div aria-hidden="true" className="pointer-events-none relative h-[400px] w-[480px] select-none" style={{ perspective: '1400px' }}>
      <div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d', transform: 'rotateX(22deg) rotateY(-24deg) rotateZ(6deg)' }}
      >
        {/* back sheets */}
        <Sheet z={-120} x={46} y={-34} tone="bg-white/[0.05] backdrop-blur-md" />
        <Sheet z={-60} x={22} y={-16} tone="bg-white/[0.09] backdrop-blur-md" />

        {/* front invoice */}
        <div
          className="absolute left-6 top-10 w-[330px] rounded-xl border border-white/10 bg-white p-5 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.6)]"
          style={{ transform: 'translateZ(0px)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">Invoice</p>
              <p className="mt-0.5 text-[15px] font-semibold text-[#101828]">INV-0042</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2 py-0.5 text-[11px] font-medium text-[#2453e6]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Viewed
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[#e4e7ec] py-3 text-[11px]">
            <div>
              <p className="text-[#98a2b3]">Billed to</p>
              <p className="font-medium text-[#101828]">Harbor &amp; Pine</p>
            </div>
            <div>
              <p className="text-[#98a2b3]">Due</p>
              <p className="font-medium text-[#101828]">Mar 14</p>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-[11px]">
            {[
              ['Website redesign', '$1,800.00'],
              ['Copywriting', '$480.00'],
              ['Hosting (1 yr)', '$200.00'],
            ].map(([d, a]) => (
              <div key={d} className="flex justify-between">
                <span className="text-[#344054]">{d}</span>
                <span className="font-medium tabular-nums text-[#101828]">{a}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-[#e4e7ec] pt-3">
            <span className="text-[11px] font-semibold text-[#101828]">Total</span>
            <span className="text-[17px] font-semibold tabular-nums text-[#101828]">$2,480.00</span>
          </div>
        </div>

        {/* floating notifications, lifted towards the viewer */}
        <div
          className="absolute left-[262px] top-[-18px] flex w-[220px] items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 shadow-[0_24px_48px_-12px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.15)] backdrop-blur-xl"
          style={{ transform: 'translateZ(90px)' }}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2453e6]/25 text-[#9db4ff]">
            <Eye className="h-3.5 w-3.5" />
          </span>
          <div className="text-[11px] leading-4">
            <p className="font-medium text-white">Harbor &amp; Pine opened it</p>
            <p className="text-white/50">2 minutes ago</p>
          </div>
        </div>
        <div
          className="absolute left-[150px] top-[338px] flex w-[210px] items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 shadow-[0_24px_48px_-12px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.15)] backdrop-blur-xl"
          style={{ transform: 'translateZ(60px)' }}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#067647]/30 text-[#7ee2a8]">
            <CircleCheck className="h-3.5 w-3.5" />
          </span>
          <div className="text-[11px] leading-4">
            <p className="font-medium text-white">Studio Kiln paid</p>
            <p className="text-white/50">$1,150.00 · today</p>
          </div>
        </div>
      </div>
    </div>
  )

  if (!compact) return <div className="mx-auto w-[480px]">{scene}</div>
  // phones: same scene at 62%, in a box sized to the scaled result so nothing overlaps
  return (
    <div className="relative mx-auto h-[248px] w-[298px]">
      <div className="absolute left-0 top-0 origin-top-left scale-[0.62]">{scene}</div>
    </div>
  )
}

function Sheet({ z, x, y, tone }: { z: number; x: number; y: number; tone: string }) {
  return (
    <div
      className={`absolute left-6 top-10 h-[300px] w-[330px] rounded-xl border border-white/10 ${tone}`}
      style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }}
    />
  )
}
