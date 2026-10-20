'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { TriangleAlert, Trash2 } from 'lucide-react'
import { messages } from '@/lib/messages'

/**
 * Destructive action behind a confirm step, rendered IN the page.
 *
 * Why not window.confirm(): automated browsers (TestSprite included) auto-close
 * native dialogs, so the cancel path was untestable and the suite reported the
 * delete flow as Blocked. An in-page dialog is visible, clickable and assertable.
 *
 * Contract the suite relies on:
 *  - clicking Delete only OPENS the dialog; nothing is submitted
 *  - the dialog shows messages.invoice.deleteConfirm verbatim
 *  - "Cancel" (or Escape) closes it and the invoice stays
 *  - "Confirm" submits the delete
 * The confirm button is deliberately not labelled "Delete…" so a locator for the
 * Delete button never matches two elements.
 */
export function ConfirmDelete({
  action,
  invoiceId,
}: {
  action: (formData: FormData) => void | Promise<void>
  invoiceId: string
}) {
  const [open, setOpen] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger-soft"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        Delete
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div aria-hidden="true" className="absolute inset-0 bg-[#0c111d]/50" onClick={() => setOpen(false)} />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-sm rounded-2xl border border-line bg-card p-6 shadow-raised"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
                <TriangleAlert aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <p id={titleId} className="text-[15px] font-semibold text-ink">
                  {messages.invoice.deleteConfirm}
                </p>
                <p className="mt-1 text-[13px] text-muted">{invoiceId} will be removed for you and your client.</p>
              </div>
            </div>
            <form action={action} className="mt-6 flex justify-end gap-2">
              <input type="hidden" name="id" value={invoiceId} />
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-line-strong bg-card px-3.5 py-2 text-sm font-semibold text-body transition-colors duration-150 hover:bg-panel hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#d92d20] px-3.5 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#b42318]"
              >
                Confirm
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
