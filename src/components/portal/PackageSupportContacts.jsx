import React from 'react';
import { CONTACT_UPDATE_WHATSAPP_URL, OFFICE_SUPPORT } from '../../utils/customerSupport';

function cleanContact(value, maxLength = 254) {
  if (!['string', 'number'].includes(typeof value)) return '';
  return String(value).trim().slice(0, maxLength);
}

export default function PackageSupportContacts({ customerEmail, customerPhone, customerWhatsApp }) {
  const email = cleanContact(customerEmail);
  const phone = cleanContact(customerPhone, 120);
  const whatsApp = cleanContact(customerWhatsApp, 120);
  const hasEmail = Boolean(email);
  const hasMobileContact = Boolean(phone || whatsApp);
  const contactDetailsComplete = hasEmail && hasMobileContact;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Customer and emergency contact details">
      <div className={`rounded-lg border p-4 ${contactDetailsComplete ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800' : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/60'}`}>
        <h3 className="font-bold text-gray-800 dark:text-gray-100">Your contact details</h3>
        <dl className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-200">
          <div><dt className="inline font-semibold">Email: </dt><dd className="inline break-all">{email || 'Not provided'}</dd></div>
          <div><dt className="inline font-semibold">Mobile: </dt><dd className="inline break-words">{phone || whatsApp || 'Not provided'}</dd></div>
        </dl>
        {!contactDetailsComplete && (
          <div className="mt-3" role="note">
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
              Please add {!hasEmail && !hasMobileContact ? 'an email address and mobile/WhatsApp number' : !hasEmail ? 'an email address' : 'a mobile/WhatsApp number'} to your booking.
            </p>
            <p className="mt-1 text-xs text-amber-900 dark:text-amber-200">
              Message or call our office so an agent can update your booking securely.
            </p>
            <a
              href={CONTACT_UPDATE_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            >
              Update details by WhatsApp
            </a>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/60">
        <h3 className="font-bold text-red-950 dark:text-red-100">Piyam Travel emergency contact</h3>
        <p className="mt-1 text-xs text-red-900 dark:text-red-200">Available 24/7 while you are travelling.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`tel:${OFFICE_SUPPORT.phoneDial}`} className="inline-flex min-h-10 items-center rounded-lg bg-red-800 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Call {OFFICE_SUPPORT.phoneDisplay}
          </a>
          <a
            href={OFFICE_SUPPORT.whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="inline-flex min-h-10 items-center rounded-lg border border-red-800 px-3 py-2 text-sm font-semibold text-red-900 hover:bg-white dark:border-red-600 dark:text-red-100 dark:hover:bg-red-900"
          >
            WhatsApp office
          </a>
          <a href={`mailto:${OFFICE_SUPPORT.email}`} className="inline-flex min-h-10 items-center rounded-lg border border-red-800 px-3 py-2 text-sm font-semibold text-red-900 hover:bg-white dark:border-red-600 dark:text-red-100 dark:hover:bg-red-900">
            {OFFICE_SUPPORT.email}
          </a>
        </div>
        <p className="mt-3 text-xs text-red-900 dark:text-red-200">
          If there is immediate danger or a medical emergency, contact the local emergency services first.
        </p>
      </div>
    </section>
  );
}
