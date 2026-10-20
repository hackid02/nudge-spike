'use client'

import { Trash2 } from 'lucide-react'
import { messages } from '@/lib/messages'

/**
 * Destructive action behind a confirm step.
 * The suite asserts that clicking Delete *without* confirming leaves the invoice
 * in the list — so this must not submit until the user confirms.
 */
export function ConfirmDelete({
  action,
  invoiceId,
}: {
  action: (formData: FormData) => void | Promise<void>
  invoiceId: string
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(messages.invoice.deleteConfirm)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={invoiceId} />
      <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger-soft">
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        Delete
      </button>
    </form>
  )
}
