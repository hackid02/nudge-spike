'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/session'
import { deleteInvoice, recordPayment, sendInvoice, voidInvoice } from '@/lib/queries'

/**
 * Every action re-reads the session and passes the owner id into the query.
 * The id from the URL is never trusted on its own.
 */

export async function sendInvoiceAction(formData: FormData) {
  const session = await requireRole('freelancer')
  const id = String(formData.get('id') ?? '')
  await sendInvoice(session.userId, id)
  revalidatePath('/')
  revalidatePath(`/invoices/${id}`)
}

export async function recordPaymentAction(formData: FormData) {
  const session = await requireRole('freelancer')
  const id = String(formData.get('id') ?? '')
  await recordPayment(session.userId, id)
  revalidatePath('/')
  revalidatePath(`/invoices/${id}`)
}

export async function voidInvoiceAction(formData: FormData) {
  const session = await requireRole('freelancer')
  const id = String(formData.get('id') ?? '')
  const ok = await voidInvoice(session.userId, id)
  if (!ok) {
    // The query refuses paid invoices; surface the exact message the suite asserts.
    redirect(`/invoices/${id}?error=paid`)
  }
  revalidatePath('/')
  revalidatePath(`/invoices/${id}`)
}

export async function deleteInvoiceAction(formData: FormData) {
  const session = await requireRole('freelancer')
  const id = String(formData.get('id') ?? '')
  const ok = await deleteInvoice(session.userId, id)
  if (!ok) redirect(`/invoices/${id}`)
  revalidatePath('/')
  redirect('/')
}
