import React from 'react';
import { OFFICE_SUPPORT } from '../../utils/customerSupport';

export default function PortalFooter() {
  const year = new Date().getFullYear();
  const privacyEmail = `mailto:${OFFICE_SUPPORT.email}?subject=${encodeURIComponent('Bookings portal privacy enquiry')}`;

  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:text-left">
        <div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">Developed by Rathobixz Inc.</p>
          <p>© {year} Piyam Travel. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>Customer portal beta</span>
          <span aria-hidden="true">•</span>
          <a className="font-medium hover:text-slate-800 hover:underline dark:hover:text-slate-100" href={`mailto:${OFFICE_SUPPORT.email}`}>Support</a>
          <span aria-hidden="true">•</span>
          <a className="font-medium hover:text-slate-800 hover:underline dark:hover:text-slate-100" href={privacyEmail}>Privacy</a>
        </div>
      </div>
    </footer>
  );
}
