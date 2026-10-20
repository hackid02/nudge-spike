/**
 * Runs with: node --experimental-strip-types lib/money.test.mjs
 * (or copy next to money.ts and run with tsx). No test framework — this is a
 * hackathon, not a cathedral.
 */
import { computeTotals, formatCents, formatQty, formatTaxRate, lineTotalCents, taxCents } from './money.ts'

let pass = 0
let fail = 0
const eq = (label, actual, expected) => {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) { pass++; console.log(`  ok   ${label} = ${a}`) }
  else { fail++; console.log(`  FAIL ${label}\n       expected ${e}\n       actual   ${a}`) }
}

console.log('\nline totals (half-up)')
eq('1.5 x $99.97  <-- float says $149.95', formatCents(lineTotalCents(1500, 9997)), '$149.96')
eq('2 x $125.07', formatCents(lineTotalCents(2000, 12507)), '$250.14')
eq('1 x $950.00', formatCents(lineTotalCents(1000, 95000)), '$950.00')
eq('3 x $333.33', formatCents(lineTotalCents(3000, 33333)), '$999.99')
eq('0.5 x $199.99 -> $100.00', formatCents(lineTotalCents(500, 19999)), '$100.00')

console.log('\ntax (half-up)')
eq('5% of $1,350.10  <-- banker says $67.50', formatCents(taxCents(135010, 500)), '$67.51')
eq('7.25% of $999.99', formatCents(taxCents(99999, 725)), '$72.50')
eq('0% of $640.00', formatCents(taxCents(64000, 0)), '$0.00')

console.log('\nINV-1001 full invoice')
const t = computeTotals(
  [
    { qty_milli: 1000, unit_cents: 95000 },
    { qty_milli: 1500, unit_cents: 9997 },
    { qty_milli: 2000, unit_cents: 12507 },
  ],
  500,
)
eq('per-line totals', t.lines.map(formatCents), ['$950.00', '$149.96', '$250.14'])
eq('subtotal', formatCents(t.subtotalCents), '$1,350.10')
eq('tax', formatCents(t.taxCents), '$67.51')
eq('total', formatCents(t.totalCents), '$1,417.61')

console.log('\nINV-1007')
const t7 = computeTotals([{ qty_milli: 3000, unit_cents: 33333 }], 725)
eq('total', formatCents(t7.totalCents), '$1,072.49')

console.log('\nformatting')
eq('zero', formatCents(0), '$0.00')
eq('pennies', formatCents(5), '$0.05')
eq('thousands', formatCents(123456789), '$1,234,567.89')
eq('qty 1.5', formatQty(1500), '1.5')
eq('qty 2', formatQty(2000), '2')
eq('qty 1.25', formatQty(1250), '1.25')
eq('rate 5%', formatTaxRate(500), '5%')
eq('rate 7.25%', formatTaxRate(725), '7.25%')

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
