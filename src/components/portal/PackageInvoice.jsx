import React from 'react';
import { OFFICE_SUPPORT } from '../../utils/customerSupport';

export default function PackageInvoice() {
  return (
    <section className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center dark:border-slate-700 dark:bg-slate-900" aria-labelledby="invoice-coming-soon-heading">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-950" aria-hidden="true">🧾</div>
      <p className="mx-auto mt-5 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Coming soon
      </p>
      <h2 id="invoice-coming-soon-heading" className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Invoices are being prepared for this portal</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
        You will be able to view customer invoices here in a future update. No invoice or pricing information is currently displayed on this page.
      </p>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        Need a copy now? Email{' '}
        <a className="font-semibold text-red-800 underline hover:text-red-600 dark:text-red-300 dark:hover:text-red-200" href={`mailto:${OFFICE_SUPPORT.email}?subject=${encodeURIComponent('Invoice copy request')}`}>
          {OFFICE_SUPPORT.email}
        </a>.
      </p>
    </section>
  );
}
