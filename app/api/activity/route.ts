import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { listFreelancerInvoices } from '@/lib/queries'
import { activityVersion } from '@/components/activity'

export const dynamic = 'force-dynamic'

/**
 * Live-dashboard heartbeat for the signed-in freelancer.
 * Returns only an opaque fingerprint, never invoice data, and reuses the
 * freelancer-scoped list query, so it cannot reveal anything the dashboard
 * itself would not show to this user.
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'freelancer') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'cache-control': 'no-store' } })
  }
  const rows = await listFreelancerInvoices(session.userId)
  return NextResponse.json(
    { version: activityVersion(rows) },
    { headers: { 'cache-control': 'no-store' } },
  )
}
