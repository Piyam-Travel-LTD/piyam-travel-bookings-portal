import React from 'react';
import { formatPortalDate } from '../../utils/packagePortal';
import PackageAccessExtensionRequest from './PackageAccessExtensionRequest';
import PackageSupportContacts from './PackageSupportContacts';
import PackageTransportVoucher from './PackageTransportVoucher';

const FINANCIAL_PUBLIC_INFO_FRAGMENTS = [
  'price', 'amount', 'balance', 'deposit', 'currency', 'fare', 'quote', 'subtotal', 'grandtotal'
];

function isFinancialPublicInfoKey(key) {
  const normalized = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized === 'total' || normalized === 'paid' || normalized === 'outstanding' ||
    FINANCIAL_PUBLIC_INFO_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

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

function getExpiryNotice(value, now = Date.now()) {
  if (!value) return null;
  const expiresAt = new Date(value).getTime();
  if (!Number.isFinite(expiresAt)) return null;
  const daysRemaining = Math.ceil((expiresAt - now) / 86_400_000);
  if (daysRemaining < 0) return 'Your package access has expired. Contact our office for help.';
  if (daysRemaining === 0) return 'Your package access expires today. Download any documents you need.';
  if (daysRemaining <= 30) return `Your package access expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Download any documents you need.`;
  return null;
}

export default function PackageOverview({ customer, onOpenDocuments, onRequestAccessExtension }) {
  const publicSummary = customer?.publicSummary && typeof customer.publicSummary === 'object'
    ? Object.entries(customer.publicSummary).filter(([key, value]) =>
      !isFinancialPublicInfoKey(key) && ['string', 'number', 'boolean'].includes(typeof value)
    )
    : [];
  const checklist = Array.isArray(customer?.checklist) ? customer.checklist : [];
  const documentCount = Array.isArray(customer?.documents) ? customer.documents.length : 0;
  const expiryNotice = getExpiryNotice(customer?.accessExpiresAt);
  const keyInformation = customer?.keyInformation || {};

  return (
    <section className="mb-6 space-y-4" aria-labelledby="package-overview-heading">
      <h2 id="package-overview-heading" className="sr-only">Package overview</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-red-800 p-4 text-white dark:bg-red-950 dark:ring-1 dark:ring-red-800">
          <h3 className="mb-2 text-lg font-bold">Package Summary</h3>
          <dl className="space-y-1 text-sm">
            <div><dt className="inline font-semibold">Destination: </dt><dd className="inline break-words">{customer?.destination || 'Not supplied'}</dd></div>
            <div><dt className="inline font-semibold">Departure: </dt><dd className="inline">{formatPortalDate(customer?.departureDate)}</dd></div>
            <div><dt className="inline font-semibold">Return: </dt><dd className="inline">{formatPortalDate(customer?.returnDate)}</dd></div>
            <div><dt className="inline font-semibold">Access expires: </dt><dd className="inline">{formatPortalDate(customer?.accessExpiresAt)}</dd></div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-2 text-lg font-bold">Package Status</h3>
          <dl className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            <div><dt className="inline font-semibold">Status: </dt><dd className="inline capitalize">{customer?.statusLabel || 'Open'}</dd></div>
            <div><dt className="inline font-semibold">Released documents: </dt><dd className="inline">{documentCount}</dd></div>
          </dl>
          {typeof onOpenDocuments === 'function' && (
            <button
              type="button"
              onClick={onOpenDocuments}
              className="mt-3 min-h-10 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {documentCount > 0 ? 'View released documents' : 'Check document releases'}
            </button>
          )}
        </div>
      </div>

      {expiryNotice && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100" role="note">
          {expiryNotice}
        </div>
      )}

      <PackageAccessExtensionRequest onRequest={onRequestAccessExtension} />

      <PackageSupportContacts
        customerEmail={keyInformation.customerEmail}
        customerPhone={keyInformation.customerPhone}
        customerWhatsApp={keyInformation.customerWhatsApp}
      />

      {customer?.transportVoucher && <PackageTransportVoucher voucher={customer.transportVoucher} />}

      {publicSummary.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 font-bold text-gray-800 dark:text-gray-100">Booking checklist status</h3>
          <ul className="space-y-2" aria-label="Read-only travel checklist">
            {checklist.map((item, index) => (
              <li key={item.id || `checklist-${index}`} className="flex items-start gap-3 rounded-md bg-white p-3 dark:bg-slate-900">
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
