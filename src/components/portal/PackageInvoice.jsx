import React from 'react';
import { normalizeReleasedInvoice } from '../../adapters/portalReleaseAdapters';
import { formatMoney, formatPortalDate, formatQuantity } from '../../utils/packagePortal';

function AmountRow({ label, value, currency, strong = false }) {
  const formatted = formatMoney(value, currency);
  if (!formatted) return null;

  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? 'border-t border-gray-300 pt-3 text-base font-bold dark:border-gray-600' : ''}`}>
      <dt>{label}</dt>
      <dd className="text-right tabular-nums">{formatted}</dd>
    </div>
  );
}

/** `invoice` may be raw or normalized; only explicitly whitelisted fields render. */
export default function PackageInvoice({ invoice }) {
  const safeInvoice = normalizeReleasedInvoice(invoice);
  if (!safeInvoice) return null;

  return (
    <section className="mb-6" aria-labelledby="released-invoice-heading">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="released-invoice-heading" className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Released Invoice
          </h2>
          {safeInvoice.invoiceNumber && (
            <p className="text-sm text-gray-500">Invoice {safeInvoice.invoiceNumber}</p>
          )}
        </div>
        <div className="text-sm text-gray-500 sm:text-right">
          {safeInvoice.version && <p>Version {safeInvoice.version}</p>}
          {safeInvoice.releasedAt && <p>Released {formatPortalDate(safeInvoice.releasedAt)}</p>}
        </div>
      </div>

      <div className="space-y-4">
        {safeInvoice.lines.length > 0 && (
          <div className="space-y-3" aria-label="Invoice items">
            {safeInvoice.lines.map(line => (
              <article key={line.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-gray-800">
                <h3 className="break-words font-semibold text-gray-800 dark:text-gray-100">{line.description}</h3>
                <dl className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-3">
                  {line.quantity !== null && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Quantity</dt>
                      <dd>{formatQuantity(line.quantity)}</dd>
                    </div>
                  )}
                  {line.soldAmount !== null && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Sold amount</dt>
                      <dd className="tabular-nums">{formatMoney(line.soldAmount, safeInvoice.currency)}</dd>
                    </div>
                  )}
                  {line.lineTotal !== null && (
                    <div className="sm:text-right">
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Line total</dt>
                      <dd className="font-semibold tabular-nums">{formatMoney(line.lineTotal, safeInvoice.currency)}</dd>
                    </div>
                  )}
                </dl>
              </article>
            ))}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200">
            <dl className="space-y-3">
              <AmountRow label="Subtotal" value={safeInvoice.subtotal} currency={safeInvoice.currency} />
              <AmountRow label="Discount" value={safeInvoice.discount} currency={safeInvoice.currency} />
              <AmountRow label="Total" value={safeInvoice.total} currency={safeInvoice.currency} strong />
              <AmountRow label="Amount paid" value={safeInvoice.amountPaid} currency={safeInvoice.currency} />
              <AmountRow label="Balance due" value={safeInvoice.balanceDue} currency={safeInvoice.currency} strong />
            </dl>
            {safeInvoice.dueDate && (
              <p className="mt-4 border-t border-gray-300 pt-3 dark:border-gray-600">
                <span className="font-semibold">Due date:</span> {formatPortalDate(safeInvoice.dueDate)}
              </p>
            )}
          </div>

          {safeInvoice.customerTerms && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Customer terms</h3>
              <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-600 dark:text-gray-300">
                {safeInvoice.customerTerms}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
