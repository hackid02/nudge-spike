/**
 * Money math for Nudge.
 *
 * Everything is an integer. Money = cents. Quantity = thousandths. Tax = basis points.
 * No float ever touches a stored value. Rounding is HALF-UP at every boundary,
 * which is what invoicing actually uses (banker's rounding gets you a very angry accountant).
 *
 * Verified cases (see money.test.mjs):
 *   1.5 x $99.97  -> $149.96   (a float implementation returns $149.95)
 *   1 x $950.00 + 1.5 x $99.97 + 2 x $125.07 = $1,350.10
 *   5% of $1,350.10 -> $67.51  (banker's rounding returns $67.50)
 */

/** Exact integer division with half-up rounding. No intermediate floats. */
export function divHalfUp(numerator: number, denominator: number): number {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new Error('divHalfUp requires integers')
  }
  if (denominator <= 0) throw new Error('divHalfUp requires a positive denominator')
  const negative = numerator < 0
  const n = Math.abs(numerator)
  const q = Math.floor(n / denominator)
  const remainder = n - q * denominator
  const rounded = remainder * 2 >= denominator ? q + 1 : q
  return negative ? -rounded : rounded
}

/** qty_milli * unit_cents / 1000, half-up. */
export function lineTotalCents(qtyMilli: number, unitCents: number): number {
  return divHalfUp(qtyMilli * unitCents, 1000)
}

/** subtotal_cents * rate_bp / 10000, half-up. */
export function taxCents(subtotalCents: number, rateBp: number): number {
  return divHalfUp(subtotalCents * rateBp, 10000)
}

export type Item = { qty_milli: number; unit_cents: number }

export type Totals = {
  lines: number[]        // per-line totals, in cents
  subtotalCents: number
  taxCents: number
  totalCents: number
}

/**
 * Sum half-up rounded line totals, then tax the sum half-up.
 * Order matters: round per line FIRST, then sum. Summing raw and rounding once
 * gives a different (wrong) number.
 */
export function computeTotals(items: Item[], rateBp: number): Totals {
  const lines = items.map((i) => lineTotalCents(i.qty_milli, i.unit_cents))
  const subtotalCents = lines.reduce((a, b) => a + b, 0)
  const tax = taxCents(subtotalCents, rateBp)
  return {
    lines,
    subtotalCents,
    taxCents: tax,
    totalCents: subtotalCents + tax,
  }
}

/** cents -> "$1,417.61" */
export function formatCents(cents: number): string {
  const negative = cents < 0
  const abs = Math.abs(cents)
  const whole = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const frac = (abs % 100).toString().padStart(2, '0')
  return `${negative ? '-' : ''}$${whole}.${frac}`
}

/** thousandths -> "1.5" (trailing zeros trimmed, at least one decimal kept) */
export function formatQty(qtyMilli: number): string {
  const whole = Math.floor(qtyMilli / 1000)
  const frac = (qtyMilli % 1000).toString().padStart(3, '0').replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : `${whole}`
}

/** basis points -> "5%" / "7.25%" */
export function formatTaxRate(rateBp: number): string {
  const pct = rateBp / 100
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2)}%`
}
