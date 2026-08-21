import React, { useState } from 'react';

export default function PackageAccessExtensionRequest({ onRequest, className = '' }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  if (typeof onRequest !== 'function') return null;

  const submitRequest = async () => {
    if (status === 'submitting' || status === 'success') return;
    setStatus('submitting');
    setMessage('');
    try {
      const result = await onRequest();
      setStatus('success');
      setMessage(result?.alreadyRequested
        ? 'Your extension request is already waiting for staff review.'
        : 'Your extension request has been sent to IMS staff for review.');
    } catch (error) {
      setStatus('error');
      setMessage(error?.message || 'We could not send the request. Please try again.');
    }
  };

  return (
    <div className={`rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/60 ${className}`.trim()}>
      <h3 className="font-bold text-blue-950 dark:text-blue-100">Need longer access?</h3>
      <p className="mt-1 text-sm text-blue-900 dark:text-blue-200">
        Send a request to IMS. A member of staff will review it and decide whether to extend your portal access.
      </p>
      <button
        type="button"
        onClick={submitRequest}
        disabled={status === 'submitting' || status === 'success'}
        className="mt-3 min-h-11 rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-offset-blue-950"
      >
        {status === 'submitting' ? 'Sending request…' : status === 'success' ? 'Request sent' : 'Request access extension'}
      </button>
      {message && (
        <p className={`mt-3 text-sm font-medium ${status === 'error' ? 'text-red-700 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-200'}`} role={status === 'error' ? 'alert' : 'status'} aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
