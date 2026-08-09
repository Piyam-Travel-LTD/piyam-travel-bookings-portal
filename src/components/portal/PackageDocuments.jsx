import React, { useState } from 'react';
import { FileIcon, PreviewIcon, DownloadIcon } from '../Icons';
import {
  classifyPortalDocument,
  DOCUMENT_KINDS,
  formatFileSize,
  formatPortalDate,
  normalizeDocumentCategory
} from '../../utils/packagePortal';

const CATEGORY_LABELS = {
  flight: 'Flights',
  hotel: 'Hotels',
  transport: 'Transport',
  visa: 'Visa',
  e_sim: 'E-Sim',
  insurance: 'Insurance',
  invoice: 'Invoice',
  other: 'Other'
};

const CATEGORY_ICONS = {
  flight: '✈️',
  hotel: '🏨',
  transport: '🚗',
  visa: '📄',
  e_sim: '📱',
  insurance: '🛡️',
  invoice: '🧾',
  other: '📎'
};

/**
 * Props:
 * - `onPreview(document)` opens a PDF/image modal.
 * - optional `onDownload(document)` owns refresh + download; without it a secure link renders.
 * - optional `onViewHtml(document)` owns refresh + View/Print; without it a secure new-tab link renders.
 */
export default function PackageDocuments({ documents, onPreview, onDownload, onViewHtml }) {
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState('');

  const groupedDocuments = (Array.isArray(documents) ? documents : []).reduce((groups, document) => {
    if (!document || typeof document !== 'object') return groups;
    const key = normalizeDocumentCategory(document.category);
    if (!groups[key]) groups[key] = [];
    groups[key].push(document);
    return groups;
  }, {});

  const visibleCategories = Object.keys(groupedDocuments).filter(key => groupedDocuments[key].length > 0);

  const runOwnedAction = async (actionName, document, callback) => {
    if (typeof callback !== 'function') return;
    const actionKey = `${actionName}:${document.id}`;
    setActionError('');
    setPendingAction(actionKey);
    try {
      await callback(document);
    } catch (_error) {
      setActionError('We could not refresh that secure document link. Please try again.');
    } finally {
      setPendingAction(current => current === actionKey ? null : current);
    }
  };

  return (
    <section className="mb-6" aria-labelledby="package-documents-heading">
      <h2 id="package-documents-heading" className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
        Your Documents
      </h2>
      {actionError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</p>}
      {visibleCategories.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {visibleCategories.map(categoryKey => (
            <section key={categoryKey} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700 sm:p-4">
              <h3 className="mb-4 font-bold text-gray-800 dark:text-gray-100">
                <span aria-hidden="true">{CATEGORY_ICONS[categoryKey] || '📄'} </span>
                {CATEGORY_LABELS[categoryKey] || 'Other'}
              </h3>
              <div className="space-y-3">
                {groupedDocuments[categoryKey].map(document => {
                  const kind = classifyPortalDocument(document);
                  const canModalPreview = Boolean(document.preview_url) && [DOCUMENT_KINDS.PDF, DOCUMENT_KINDS.IMAGE].includes(kind);
                  const canViewHtml = Boolean(document.preview_url) && kind === DOCUMENT_KINDS.HTML;
                  const downloadActionKey = `download:${document.id}`;
                  const htmlActionKey = `html:${document.id}`;

                  return (
                    <article key={document.id} className="min-w-0 rounded-lg border bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                      <div className="mb-2 flex min-w-0 items-start gap-3">
                        <FileIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
                        <div className="min-w-0">
                          <h4 className="break-words font-medium text-gray-800 dark:text-gray-200">{document.title}</h4>
                          <p className="mt-0.5 text-xs text-gray-500">{CATEGORY_LABELS[categoryKey] || 'Other'}</p>
                        </div>
                      </div>

                      <div className="mb-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatFileSize(document.file_size)}</span>
                        {document.released_at && <span>Released {formatPortalDate(document.released_at)}</span>}
                      </div>

                      {document.public_notes && (
                        <p className="mb-3 whitespace-pre-line break-words text-xs text-gray-600 dark:text-gray-300">
                          {document.public_notes}
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                        {canModalPreview && typeof onPreview === 'function' && (
                          <button
                            type="button"
                            onClick={() => onPreview(document)}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                            aria-label={`Preview ${document.title}`}
                          >
                            <PreviewIcon className="mr-2 h-4 w-4" />Preview
                          </button>
                        )}

                        {canViewHtml && (typeof onViewHtml === 'function' ? (
                          <button
                            type="button"
                            disabled={pendingAction === htmlActionKey}
                            onClick={() => runOwnedAction('html', document, onViewHtml)}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:bg-gray-600 dark:text-gray-200"
                          >
                            <PreviewIcon className="mr-2 h-4 w-4" />
                            {pendingAction === htmlActionKey ? 'Refreshing…' : 'View / Print'}
                          </button>
                        ) : (
                          <a
                            href={document.preview_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            referrerPolicy="no-referrer"
                            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-gray-600 dark:text-gray-200"
                          >
                            <PreviewIcon className="mr-2 h-4 w-4" />View / Print
                          </a>
                        ))}

                        {document.signed_url && (typeof onDownload === 'function' ? (
                          <button
                            type="button"
                            disabled={pendingAction === downloadActionKey}
                            onClick={() => runOwnedAction('download', document, onDownload)}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-800 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                          >
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            {pendingAction === downloadActionKey ? 'Refreshing…' : 'Download'}
                          </button>
                        ) : (
                          <a
                            href={document.signed_url}
                            download={document.file_name}
                            target="_blank"
                            rel="noopener noreferrer"
                            referrerPolicy="no-referrer"
                            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-800 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            <DownloadIcon className="mr-2 h-4 w-4" />Download
                          </a>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center" role="status">
          <p className="text-gray-500">Your package is open, but no documents have been released yet.</p>
        </div>
      )}
    </section>
  );
}
