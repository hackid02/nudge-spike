/**
 * Every user-facing string the test suite asserts on.
 *
 * This file exists so tests can assert EXACT text — "an error appeared" is
 * a shallow assertion, and "Invalid email or password." is a deep one.
 * If you change a string here, you are changing a test. Do it deliberately.
 */
export const messages = {
  auth: {
    invalidCredentials: 'Invalid email or password.',
    signOut: 'Sign out',
  },

  invoice: {
    // asserted by C3
    cannotVoidPaid: "Paid invoices can't be voided.",
    deleteConfirm: 'Delete this invoice? This cannot be undone.',
    notFound: 'Invoice not found.',
    // status pills
    statusDraft: 'Draft',
    statusSent: 'Sent',
    statusViewed: 'Viewed',
    statusPaid: 'Paid',
    statusOverdue: 'Overdue',
    statusVoid: 'Void',
  },

  portal: {
    notFound: 'Invoice not found.',
    empty: "You don't have any invoices yet.",
  },

  dashboard: {
    empty: 'No invoices yet. Create your first one.',
    outstanding: 'Outstanding',
    overdue: 'Overdue',
    paidThisMonth: 'Paid this month',
  },

  export: {
    title: 'Export invoices',
    download: 'Download CSV',
  },
} as const

/** Derived status. Overdue is never stored — it's a function of status + due date. */
export type StoredStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'void'
export type DisplayStatus = StoredStatus | 'overdue'

export function displayStatus(status: StoredStatus, dueOn: string, now = new Date()): DisplayStatus {
  const open = status === 'sent' || status === 'viewed'
  const pastDue = new Date(`${dueOn}T23:59:59Z`).getTime() < now.getTime()
  return open && pastDue ? 'overdue' : status
}

export function statusLabel(status: DisplayStatus): string {
  switch (status) {
    case 'draft':   return messages.invoice.statusDraft
    case 'sent':    return messages.invoice.statusSent
    case 'viewed':  return messages.invoice.statusViewed
    case 'paid':    return messages.invoice.statusPaid
    case 'overdue': return messages.invoice.statusOverdue
    case 'void':    return messages.invoice.statusVoid
  }
}
