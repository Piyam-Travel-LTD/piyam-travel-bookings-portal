import React from 'react';
import { formatPortalDate } from '../../utils/packagePortal';

function formatSummaryLabel(key) {
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, character => character.toUpperCase());
}

function formatSummaryValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export default function PackageOverview({ customer }) {
  const publicSummary = customer?.publicSummary && typeof customer.publicSummary === 'object'
    ? Object.entries(customer.publicSummary).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    : [];
  const checklist = Array.isArray(customer?.checklist) ? customer.checklist : [];

  return (
    <section className="mb-6 space-y-4" aria-labelledby="package-overview-heading">
      <h2 id="package-overview-heading" className="sr-only">Package overview</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-red-800 p-4 text-white">
          <h3 className="mb-2 text-lg font-bold">Package Summary</h3>
          <dl className="space-y-1 text-sm">
            <div><dt className="inline font-semibold">Destination: </dt><dd className="inline break-words">{customer?.destination || 'Not supplied'}</dd></div>
            <div><dt className="inline font-semibold">Departure: </dt><dd className="inline">{formatPortalDate(customer?.departureDate)}</dd></div>
            <div><dt className="inline font-semibold">Return: </dt><dd className="inline">{formatPortalDate(customer?.returnDate)}</dd></div>
            <div><dt className="inline font-semibold">Access expires: </dt><dd className="inline">{formatPortalDate(customer?.accessExpiresAt)}</dd></div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700">
          <h3 className="mb-2 text-lg font-bold">Package Status</h3>
          <dl className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            <div><dt className="inline font-semibold">Status: </dt><dd className="inline capitalize">{customer?.statusLabel || 'Open'}</dd></div>
            <div><dt className="inline font-semibold">Customer email: </dt><dd className="inline break-all">{customer?.keyInformation?.customerEmail || 'Not supplied'}</dd></div>
          </dl>
        </div>
      </div>

      {publicSummary.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-gray-800">
          <h3 className="mb-3 font-bold text-gray-800 dark:text-gray-100">Public information</h3>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {publicSummary.map(([key, value]) => (
              <div key={key} className="min-w-0">
                <dt className="font-semibold text-gray-700 dark:text-gray-200">{formatSummaryLabel(key)}</dt>
                <dd className="break-words text-gray-600 dark:text-gray-300">{formatSummaryValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {checklist.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700">
          <h3 className="mb-3 font-bold text-gray-800 dark:text-gray-100">Travel checklist status</h3>
          <ul className="space-y-2" aria-label="Read-only travel checklist">
            {checklist.map((item, index) => (
              <li key={item.id || `checklist-${index}`} className="flex items-start gap-3 rounded-md bg-white p-3 dark:bg-gray-800">
                <span
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${item.completed ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-100'}`}
                  aria-hidden="true"
                >
                  {item.completed ? '✓' : '•'}
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-gray-800 dark:text-gray-100">{item.label || item.text}</p>
                  {item.status && <p className="text-xs capitalize text-gray-500">{item.status}</p>}
                  <span className="sr-only">{item.completed ? 'Complete' : 'Not complete'}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500">This information is read-only. Contact your agent if anything needs changing.</p>
        </div>
      )}
    </section>
  );
}
