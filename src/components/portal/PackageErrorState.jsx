import React from 'react';
import PackageAccessExtensionRequest from './PackageAccessExtensionRequest';

export default function PackageErrorState({ title = 'Package unavailable', message = 'Package documents are not currently available. Contact your agent.', actionLabel, onAction, onRequestAccessExtension }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full" role="alert">
      <div className="max-w-xl mx-auto text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-800">
          <span className="text-3xl">!</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
        {actionLabel && typeof onAction === 'function' && (
          <button type="button" onClick={onAction} className="mt-6 min-h-11 rounded-lg bg-red-800 px-4 py-2 font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
            {actionLabel}
          </button>
        )}
        <PackageAccessExtensionRequest className="mt-6 text-left" onRequest={onRequestAccessExtension} />
      </div>
    </div>
  );
}
