import React, { useEffect, useRef, useState } from 'react';
import { UserIcon } from '../Icons';
import { PackagePortalApiError, resolvePackageAccess, loadPackageData } from '../../services/packagePortalApi';
import { normalizePtPortalPackage } from '../../adapters/ptPortalPackageAdapter';
import { normalizeLegacyPackage } from '../../adapters/legacyPackageAdapter';
import { piyamTravelLogoBase64 } from '../../data';
import { getPackageErrorMessage } from '../../services/packageErrorResolver';

const PiyamTravelLogo = () => <img src={piyamTravelLogoBase64} alt="Piyam Travel Logo" className="h-auto max-w-full" />;

export function normalizeReferenceInput(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized.startsWith('PT-') ? normalized.slice(3) : normalized;
}

/**
 * Successful callback contract:
 * `onAuthenticated({ package, credential, sessionEstablished })` is preferred.
 * For the existing shell, `onLogin(package, metadata)` receives equivalent data.
 * The bearer credential is never attached to the normalized package object.
 */
export default function PackageLogin({ onAuthenticated, onLogin }) {
  const [refNumber, setRefNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryUntil, setRetryUntil] = useState(0);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const requestControllerRef = useRef(null);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  useEffect(() => {
    if (!retryUntil) {
      setRetrySeconds(0);
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000));
      setRetrySeconds(remaining);
      if (remaining === 0) setRetryUntil(0);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [retryUntil]);

  const notifyAuthenticated = async result => {
    if (typeof onAuthenticated === 'function') {
      await onAuthenticated(result);
      return;
    }

    if (typeof onLogin === 'function') {
      await onLogin(result.package, {
        source: result.package.source,
        credential: result.credential,
        sessionEstablished: result.sessionEstablished
      });
      return;
    }

    throw new Error('PackageLogin requires onAuthenticated or onLogin.');
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (isSubmitting || retrySeconds > 0) return;

    const normalizedReference = normalizeReferenceInput(refNumber);
    if (!/^[A-Z0-9]{6}$/.test(normalizedReference)) {
      setError('Enter exactly six letters or numbers shown after PT- on your package reference.');
      return;
    }
    if (!lastName.trim()) {
      setError('Enter the lead passenger surname.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const accessData = await resolvePackageAccess(normalizedReference, lastName.trim(), { signal: controller.signal });

      if (accessData?.source === 'pt_portal') {
        const sessionEstablished = accessData.sessionEstablished === true;
        const token = typeof accessData.token === 'string' && accessData.token.trim()
          ? accessData.token.trim()
          : null;

        if (!sessionEstablished && !token) {
          throw new PackagePortalApiError('The package service is temporarily unavailable. Please try again shortly.', {
            status: 503,
            code: 'MISSING_PACKAGE_CREDENTIAL'
          });
        }

        const packageData = accessData.package && accessData.documents
          ? accessData
          : await loadPackageData(sessionEstablished ? null : token, { signal: controller.signal });
        const normalizedPackage = normalizePtPortalPackage(packageData);
        const effectiveSessionEstablished = sessionEstablished || packageData.sessionEstablished === true;

        await notifyAuthenticated({
          package: normalizedPackage,
          credential: effectiveSessionEstablished ? null : token,
          sessionEstablished: effectiveSessionEstablished
        });
        return;
      }

      if (accessData?.source === 'legacy_firebase') {
        await notifyAuthenticated({
          package: normalizeLegacyPackage(accessData.customer),
          credential: null,
          sessionEstablished: false
        });
        return;
      }

      throw new PackagePortalApiError('Package details do not match. Check the lead passenger surname and reference.', {
        status: 404,
        code: 'UNKNOWN_PACKAGE_SOURCE'
      });
    } catch (requestError) {
      if (requestError?.name === 'AbortError') return;

      setError(getPackageErrorMessage(requestError, 'access'));
      if (Number(requestError?.status) === 429) {
        const waitSeconds = Number.isFinite(Number(requestError.retryAfter)) && Number(requestError.retryAfter) > 0
          ? Math.min(3600, Math.ceil(Number(requestError.retryAfter)))
          : 60;
        setRetrySeconds(waitSeconds);
        setRetryUntil(Date.now() + waitSeconds * 1000);
      }
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
      setIsSubmitting(false);
    }
  };

  const errorId = error ? 'package-login-error' : undefined;
  const retryId = retrySeconds > 0 ? 'package-login-retry' : undefined;
  const describedBy = [errorId, retryId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 border-t-4 border-t-red-800 bg-white shadow-xl dark:border-slate-800 dark:border-t-red-700 dark:bg-slate-900 dark:shadow-black/30">
      <div className="p-5 sm:p-8">
        <div className="mb-6 flex justify-center"><PiyamTravelLogo /></div>
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-800 dark:text-gray-200">Client Document Portal</h1>
        <p className="mb-8 text-center text-gray-500 dark:text-slate-400">Access your travel documents securely.</p>

        <form className="space-y-6" onSubmit={handleSubmit} aria-busy={isSubmitting} noValidate>
          <div>
            <label htmlFor="refNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Package reference</label>
            <div className="mt-1 flex min-w-0 items-center">
              <span className="inline-flex min-h-11 items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400" aria-hidden="true">PT-</span>
              <input
                type="text"
                id="refNumber"
                value={refNumber}
                onChange={event => setRefNumber(normalizeReferenceInput(event.target.value))}
                onPaste={event => {
                  event.preventDefault();
                  setRefNumber(normalizeReferenceInput(event.clipboardData.getData('text')));
                }}
                placeholder="H29GPX"
                className="block min-h-11 min-w-0 flex-1 rounded-none rounded-r-lg border border-gray-300 p-2 uppercase focus:border-red-500 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-900"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
                minLength={6}
                maxLength={32}
                pattern="[A-Za-z0-9]{6}"
                aria-describedby={describedBy}
                aria-invalid={Boolean(error)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lead passenger surname</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon className="h-5 w-5 text-gray-400" /></div>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={event => setLastName(event.target.value)}
                placeholder="Lead passenger surname"
                className="min-h-11 w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-red-800 focus:ring-red-800 dark:border-gray-600 dark:bg-gray-900"
                autoComplete="family-name"
                maxLength={100}
                aria-describedby={describedBy}
                aria-invalid={Boolean(error)}
                required
              />
            </div>
          </div>

          <div className="min-h-5 text-center" aria-live="assertive">
            {error && <p id={errorId} className="text-sm text-red-600 dark:text-red-300" role="alert">{error}</p>}
            {retrySeconds > 0 && (
              <p id={retryId} className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                You can try again in {retrySeconds} second{retrySeconds === 1 ? '' : 's'}.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || retrySeconds > 0}
            className="flex min-h-12 w-full justify-center rounded-lg border border-transparent bg-red-800 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-wait disabled:bg-red-400"
          >
            {isSubmitting ? 'Opening your package…' : retrySeconds > 0 ? `Try again in ${retrySeconds}s` : 'Access Documents'}
          </button>
        </form>
      </div>
    </div>
  );
}
