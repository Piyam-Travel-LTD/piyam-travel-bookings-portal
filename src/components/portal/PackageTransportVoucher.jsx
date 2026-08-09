import React from 'react';
import { normalizeTransportVoucher } from '../../adapters/portalReleaseAdapters';
import { formatPortalDate } from '../../utils/packagePortal';

function JourneyCard({ title, details }) {
  if (!details) return null;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-gray-800">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      <dl className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
        {details.summary && <div><dt className="sr-only">Summary</dt><dd className="break-words">{details.summary}</dd></div>}
        {details.date && <div><dt className="inline font-semibold">Date: </dt><dd className="inline">{formatPortalDate(details.date)}</dd></div>}
        {details.time && <div><dt className="inline font-semibold">Time: </dt><dd className="inline">{details.time}</dd></div>}
        {details.flightNumber && <div><dt className="inline font-semibold">Flight: </dt><dd className="inline">{details.flightNumber}</dd></div>}
        {details.airport && <div><dt className="inline font-semibold">Airport: </dt><dd className="inline">{details.airport}</dd></div>}
        {details.terminal && <div><dt className="inline font-semibold">Terminal: </dt><dd className="inline">{details.terminal}</dd></div>}
        {details.location && <div><dt className="inline font-semibold">Location: </dt><dd className="inline break-words">{details.location}</dd></div>}
      </dl>
    </article>
  );
}

function ContactCard({ title, contact }) {
  if (!contact) return null;
  const telephoneTarget = String(contact.phone || '').replace(/[^+0-9]/g, '');
  const emailTarget = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(contact.email || ''))
    ? String(contact.email)
    : '';

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-gray-800">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      <div className="mt-2 space-y-1 break-words text-sm text-gray-600 dark:text-gray-300">
        {contact.name && <p>{contact.name}</p>}
        {contact.phone && <p>{telephoneTarget ? <a className="underline" href={`tel:${telephoneTarget}`}>{contact.phone}</a> : contact.phone}</p>}
        {contact.whatsApp && <p>WhatsApp: {contact.whatsApp}</p>}
        {contact.email && <p>{emailTarget ? <a className="underline" href={`mailto:${emailTarget}`}>{contact.email}</a> : contact.email}</p>}
      </div>
    </article>
  );
}

/** `voucher` may be raw or normalized; only explicitly whitelisted fields render. */
export default function PackageTransportVoucher({ voucher }) {
  const safeVoucher = normalizeTransportVoucher(voucher);
  if (!safeVoucher) return null;

  return (
    <section className="mb-6" aria-labelledby="transport-voucher-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="transport-voucher-heading" className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Transport Summary
          </h2>
          <div className="text-sm text-gray-500">
            {safeVoucher.voucherNumber && <span>Voucher {safeVoucher.voucherNumber}</span>}
            {safeVoucher.version && <span> · Version {safeVoucher.version}</span>}
            {safeVoucher.releasedAt && <span> · Released {formatPortalDate(safeVoucher.releasedAt)}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {safeVoucher.previewUrl && (
            <a
              href={safeVoucher.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              View / Print voucher
            </a>
          )}
          {safeVoucher.downloadUrl && (
            <a
              href={safeVoucher.downloadUrl}
              download={safeVoucher.fileName}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-800 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 dark:text-red-200"
            >
              Download
            </a>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700">
        {(safeVoucher.arrival || safeVoucher.departure) && (
          <div className="grid gap-4 md:grid-cols-2">
            <JourneyCard title="Arrival" details={safeVoucher.arrival} />
            <JourneyCard title="Departure" details={safeVoucher.departure} />
          </div>
        )}

        {safeVoucher.routes.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Route timeline</h3>
            <ol className="mt-3 space-y-3">
              {safeVoucher.routes.map((route, index) => (
                <li key={route.id} className="relative rounded-lg border border-slate-200 bg-white p-4 pl-11 dark:border-slate-600 dark:bg-gray-800">
                  <span className="absolute left-3 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-red-800 text-xs font-bold text-white" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h4 className="break-words font-semibold text-gray-800 dark:text-gray-100">{route.label}</h4>
                  <dl className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {(route.from || route.to) && <div><dt className="sr-only">Route</dt><dd className="break-words">{route.from || 'Pickup'} → {route.to || 'Destination'}</dd></div>}
                    {route.date && <div><dt className="inline font-semibold">Date: </dt><dd className="inline">{formatPortalDate(route.date)}</dd></div>}
                    {route.time && <div><dt className="inline font-semibold">Time: </dt><dd className="inline">{route.time}</dd></div>}
                    {route.vehicleType && <div><dt className="inline font-semibold">Vehicle: </dt><dd className="inline">{route.vehicleType}</dd></div>}
                    {route.provider?.name && <div><dt className="inline font-semibold">Provider: </dt><dd className="inline">{route.provider.name}</dd></div>}
                    {route.provider?.phone && <div><dt className="inline font-semibold">Provider contact: </dt><dd className="inline">{route.provider.phone}</dd></div>}
                    {route.driver?.name && <div><dt className="inline font-semibold">Driver: </dt><dd className="inline">{route.driver.name}</dd></div>}
                    {route.driver?.phone && <div><dt className="inline font-semibold">Driver contact: </dt><dd className="inline">{route.driver.phone}</dd></div>}
                  </dl>
                  {route.publicNotes && <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-600 dark:text-gray-300">{route.publicNotes}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}

        {(safeVoucher.provider || safeVoucher.driver) && (
          <div className="grid gap-4 md:grid-cols-2">
            <ContactCard title="Transport provider" contact={safeVoucher.provider} />
            <ContactCard title="Driver" contact={safeVoucher.driver} />
          </div>
        )}

        {safeVoucher.publicNotes && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Public notes</h3>
            <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-600 dark:text-gray-300">{safeVoucher.publicNotes}</p>
          </div>
        )}
      </div>
    </section>
  );
}
