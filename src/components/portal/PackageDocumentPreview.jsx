import React, { useEffect, useId, useRef, useState } from 'react';
import { XIcon } from '../Icons';
import { classifyPortalDocument, DOCUMENT_KINDS } from '../../utils/packagePortal';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * `onRefreshDocument(document, { reason: 'preview-error'|'customer-request' })`
 * may be async and must return the same document with refreshed URLs. It is called
 * at most once each time the modal opens.
 */
export default function PackageDocumentPreview({ document: documentToPreview, onClose, onRefreshDocument }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [activeDocument, setActiveDocument] = useState(documentToPreview);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    setActiveDocument(documentToPreview);
    setRefreshAttempted(false);
    setIsRefreshing(false);
    setPreviewError('');
  }, [documentToPreview]);

  useEffect(() => {
    if (!documentToPreview) return undefined;

    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [documentToPreview, onClose]);

  if (!documentToPreview || !activeDocument) return null;

  const kind = classifyPortalDocument(activeDocument);
  const previewUrl = activeDocument.preview_url;
  const canRetry = typeof onRefreshDocument === 'function' && !refreshAttempted;

  const refreshPreview = async reason => {
    if (!canRetry || isRefreshing) {
      setPreviewError('This secure preview is unavailable. Download the document or refresh the package.');
      return;
    }

    setRefreshAttempted(true);
    setIsRefreshing(true);
    setPreviewError('');
    try {
      const refreshedDocument = await onRefreshDocument(activeDocument, { reason });
      if (!refreshedDocument?.preview_url) throw new Error('No refreshed preview URL was returned.');
      setActiveDocument(refreshedDocument);
    } catch (_error) {
      setPreviewError('We could not refresh this secure preview. Please close it and try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const showPreview = previewUrl && [DOCUMENT_KINDS.PDF, DOCUMENT_KINDS.IMAGE].includes(kind);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-0 sm:p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="flex h-[100dvh] w-full min-w-0 flex-col bg-white shadow-2xl dark:bg-gray-800 sm:max-h-[90vh] sm:max-w-4xl sm:rounded-lg"
      >
        <div className="flex min-w-0 flex-shrink-0 items-center justify-between gap-3 border-b p-4 dark:border-gray-700">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg font-bold text-gray-800 dark:text-gray-100">{activeDocument.title}</h2>
            <p id={descriptionId} className="text-xs text-gray-500">Secure document preview</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Close document preview"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="relative min-h-0 flex-grow p-2 sm:p-3">
          {showPreview && kind === DOCUMENT_KINDS.PDF && (
            <iframe
              key={previewUrl}
              src={previewUrl}
              title={`${activeDocument.title} preview`}
              referrerPolicy="no-referrer"
              onError={() => refreshPreview('preview-error')}
              className="h-full w-full border-0"
            />
          )}
          {showPreview && kind === DOCUMENT_KINDS.IMAGE && (
            <img
              key={previewUrl}
              src={previewUrl}
              alt={`Preview of ${activeDocument.title}`}
              referrerPolicy="no-referrer"
              onError={() => refreshPreview('preview-error')}
              className="h-full w-full object-contain"
            />
          )}
          {!showPreview && (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Preview not available</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">This file can be downloaded securely instead.</p>
              </div>
            </div>
          )}

          {isRefreshing && (
            <div className="absolute inset-2 flex items-center justify-center bg-white bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90" role="status">
              <p className="font-semibold text-gray-700 dark:text-gray-200">Refreshing your secure document link…</p>
            </div>
          )}
        </div>

        {(previewError || canRetry) && (
          <div className="flex flex-col gap-2 border-t p-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-300" role={previewError ? 'alert' : undefined}>
              {previewError || 'If this secure preview has expired, refresh it once.'}
            </p>
            {canRetry && (
              <button
                type="button"
                onClick={() => refreshPreview('customer-request')}
                className="min-h-10 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-600 dark:text-gray-100"
              >
                Refresh secure link
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
