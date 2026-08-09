import React from 'react';
import { piyamTravelLogoBase64 } from '../../data';

const PiyamTravelLogo = () => <img src={piyamTravelLogoBase64} alt="Piyam Travel Logo" className="h-auto max-w-full" />;

export default function PackageHeader({ customer, onLogout }) {
  const packageDescription = customer.packageType && customer.destination
    ? `${customer.packageType} to ${customer.destination}`
    : customer.packageType || customer.destination || 'Travel package';

  return (
    <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50">
          <PiyamTravelLogo />
        </div>
        <div className="min-w-0">
          <p className="break-all font-mono text-sm text-gray-500">Reference: {customer.reference}</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl md:text-4xl">Welcome, {customer.customerName}</h1>
          <p className="mt-2 break-words text-base font-semibold text-gray-600 dark:text-gray-300 sm:text-lg">{packageDescription}</p>
        </div>
      </div>
      <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
        <button type="button" onClick={onLogout} className="min-h-11 w-full rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 md:w-auto">Log Out</button>
      </div>
    </div>
  );
}
