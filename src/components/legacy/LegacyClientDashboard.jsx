import React, { useCallback, useEffect, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { fileCategories } from '../../data';
import {
  DownloadIcon,
  FileIcon,
  GlobeIcon,
  InfoIcon,
  MailIcon,
  PreviewIcon,
  SimCardIcon,
  UserIcon,
  XIcon
} from '../Icons';
import PackageSupportContacts from '../portal/PackageSupportContacts';
import PackageInvoice from '../portal/PackageInvoice';
import PersonalTravelChecklist from '../portal/PersonalTravelChecklist';

const LEGACY_TABS = Object.freeze([
  { id: 'overview', label: 'Overview' },
  { id: 'documents', label: 'Documents' },
  { id: 'checklist', label: 'My Checklist' },
  { id: 'invoice', label: 'Invoice' }
]);

function formatExpiryDate(customer) {
  const dateToUse = customer.accessExpiresAt || customer.createdAt;
  if (!dateToUse) return 'N/A';

  const expiryBaseDate = new Date(dateToUse);
  if (Number.isNaN(expiryBaseDate.getTime())) return 'N/A';

  if (!customer.accessExpiresAt) {
    expiryBaseDate.setMonth(expiryBaseDate.getMonth() + 10);
  }

  return expiryBaseDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatLastUpdated(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString('en-GB');
}

function getLegacyPreviewKind(file) {
  const candidate = `${file?.name || ''} ${file?.url || ''}`.split(/[?#]/, 1)[0].toLowerCase();
  if (/\.(?:jpe?g|png|webp)(?:\s|$)/i.test(candidate)) return 'image';
  if (/\.pdf(?:\s|$)/i.test(candidate)) return 'pdf';
  return null;
}

export default function LegacyClientDashboard({ customer, onLogout, onCustomerUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [previewFile, setPreviewFile] = useState(null);
  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const [localSim, setLocalSim] = useState(customer.keyInformation?.customerSim || '');
  const [localEmail, setLocalEmail] = useState(customer.keyInformation?.customerEmail || '');

  useEffect(() => {
    setLocalSim(customer.keyInformation?.customerSim || '');
    setLocalEmail(customer.keyInformation?.customerEmail || '');
  }, [customer]);

  useEffect(() => {
    if (!previewFile) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPreviewFile(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [previewFile]);

  const handleTabKeyDown = useCallback((event, currentIndex) => {
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % LEGACY_TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + LEGACY_TABS.length) % LEGACY_TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = LEGACY_TABS.length - 1;
    else return;

    event.preventDefault();
    const nextTab = LEGACY_TABS[nextIndex];
    setActiveTab(nextTab.id);
    window.requestAnimationFrame(() => document.getElementById(`legacy-package-tab-${nextTab.id}`)?.focus());
  }, []);

  const handleSaveContactInfo = async () => {
    const newKeyInfo = {
      ...customer.keyInformation,
      customerSim: localSim,
      customerEmail: localEmail,
      isEmailLocked: true
    };

    try {
      await updateDoc(doc(db, 'customers', customer.id), {
        keyInformation: newKeyInfo,
        lastUpdatedAt: serverTimestamp()
      });
      onCustomerUpdate({
        ...customer,
        keyInformation: newKeyInfo,
        lastUpdatedAt: new Date().toISOString()
      });
      window.alert('Your contact information has been saved.');
    } catch (_error) {
      window.alert('Could not save your information. Please try again.');
    }
  };

  const handleChecklistItemToggle = async (itemId) => {
    const updatedChecklist = (customer.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    try {
      await updateDoc(doc(db, 'customers', customer.id), { checklist: updatedChecklist });
      onCustomerUpdate({ ...customer, checklist: updatedChecklist });
    } catch (_error) {
      // Keep customer identifiers and Firestore document paths out of browser logs.
      window.alert('Could not update your checklist. Please try again.');
    }
  };

  const keyInfo = customer.keyInformation || {};
  const checklist = customer.checklist || [];
  const isEmailEditable = !keyInfo.isEmailLocked || !keyInfo.customerEmail;
  const visibleCategories = fileCategories.filter((category) =>
    customer.documents?.some((document) => document.category === category.name)
  );

  return (
    <>
      <div className="w-full rounded-2xl border border-transparent bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 md:p-8">
        <header className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-6 dark:border-gray-700 md:flex-row">
          <div>
            <p className="font-mono text-sm text-gray-500">Reference: {customer.referenceNumber}</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-800 dark:text-white md:text-4xl">
              Welcome, {customer.firstName} {customer.lastName}
            </h1>
            <p className="mt-2 text-lg font-semibold text-gray-600 dark:text-gray-300">
              {customer.packageType} to {customer.destination}
            </p>
          </div>
          <div className="flex w-full flex-col items-start gap-3 md:w-auto md:items-end">
            {customer.status === 'Completed' && (
              <span className="rounded-full bg-green-200 px-4 py-2 text-base font-bold text-green-800 dark:bg-green-900 dark:text-green-300">
                Package Completed
              </span>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 md:w-auto"
            >
              Log Out
            </button>
          </div>
        </header>

        <div className="sticky top-0 z-10 -mx-6 mb-6 border-y border-gray-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:mx-0 sm:rounded-lg sm:border sm:px-2">
          <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Package sections" aria-orientation="horizontal">
            {LEGACY_TABS.map((tab, index) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`legacy-package-tab-${tab.id}`}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`legacy-package-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`min-h-10 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-offset-slate-900 ${selected ? 'bg-red-800 text-white shadow-sm dark:bg-red-700' : 'border border-red-800 text-red-800 hover:bg-red-50 dark:border-red-500 dark:text-red-200 dark:hover:bg-slate-800'}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`legacy-package-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`legacy-package-tab-${activeTab}`}
          tabIndex={0}
          className="focus:outline-none"
        >
        {activeTab === 'overview' && (
          <div className="space-y-6">
        <section className="rounded-lg bg-red-800 p-4 text-white dark:bg-red-950 dark:ring-1 dark:ring-red-800">
          <h2 className="mb-4 text-lg font-bold">Key Information</h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm md:grid-cols-2">
            <div className="flex items-start gap-3">
              <UserIcon className="mt-1 h-5 w-5 opacity-75" />
              <div>
                <p className="font-semibold">Your Agent</p>
                <p className="opacity-90">{keyInfo.agentName}</p>
                <p className="opacity-90">{keyInfo.agentContact}</p>
                <p className="mt-1 text-xs italic opacity-75">{keyInfo.whatsAppNotes}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GlobeIcon className="mt-1 h-5 w-5 opacity-75" />
              <div>
                <p className="font-semibold">Ground Transport Manager</p>
                <p className="opacity-90">{keyInfo.groundTransportManager}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <SimCardIcon className="mt-1 h-5 w-5 opacity-75" />
              <div className="min-w-0 flex-1">
                <label htmlFor="legacy-local-sim" className="font-semibold">Your Local SIM Number</label>
                <input
                  id="legacy-local-sim"
                  type="text"
                  value={localSim}
                  onChange={(event) => setLocalSim(event.target.value)}
                  placeholder="Enter your local number"
                  className="mt-1 w-full rounded border border-white/40 bg-white/20 p-2 text-white placeholder:text-red-100 focus:border-white focus:ring-white"
                />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MailIcon className="mt-1 h-5 w-5 opacity-75" />
              <div className="min-w-0 flex-1">
                <label htmlFor="legacy-email" className="font-semibold">Your Email Address</label>
                <input
                  id="legacy-email"
                  type="email"
                  value={localEmail}
                  onChange={(event) => setLocalEmail(event.target.value)}
                  placeholder="Enter your email"
                  className={`mt-1 w-full rounded border border-white/40 bg-white/20 p-2 text-white placeholder:text-red-100 focus:border-white focus:ring-white ${!isEmailEditable ? 'cursor-not-allowed bg-black/20' : ''}`}
                  disabled={!isEmailEditable}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveContactInfo}
            className="mt-4 rounded-lg bg-white px-3 py-1 font-semibold text-red-800 hover:bg-gray-200"
          >
            Save My Info
          </button>
        </section>
            <PackageSupportContacts customerEmail={localEmail} customerPhone={localSim} />
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-6">
          {checklist.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Your Pre-Travel Checklist</h2>
              <button
                type="button"
                onClick={() => setIsChecklistVisible((visible) => !visible)}
                className="text-sm font-semibold text-red-800 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                {isChecklistVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            {isChecklistVisible && (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                {checklist.map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-center rounded-md p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(item.completed)}
                      onChange={() => handleChecklistItemToggle(item.id)}
                      className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`ml-3 text-gray-700 dark:text-gray-300 ${item.completed ? 'text-gray-500 line-through dark:text-gray-400' : ''}`}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>
          )}
          <PersonalTravelChecklist reference={customer.referenceNumber} />
          </div>
        )}

        {activeTab === 'documents' && (
          <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Your Documents</h2>
        {visibleCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleCategories.map((category) => (
              <section key={category.name} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="mb-4 text-lg font-bold">{category.icon} {category.name}</h3>
                <div className="space-y-3">
                  {customer.documents
                    .filter((document) => document.category === category.name)
                    .map((file) => (
                      <article key={file.id} className="rounded-lg border bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-3 flex min-w-0 items-center">
                          <FileIcon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500" />
                          <span className="truncate font-medium text-gray-800 dark:text-gray-200">{file.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {getLegacyPreviewKind(file) && (
                            <button
                              type="button"
                              onClick={() => setPreviewFile(file)}
                              className="flex items-center rounded-lg bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                            >
                              <PreviewIcon className="mr-2 h-4 w-4" />Preview
                            </button>
                          )}
                          <a
                            href={file.url}
                            download={file.name}
                            referrerPolicy="no-referrer"
                            className="flex items-center rounded-lg bg-red-800 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                          >
                            <DownloadIcon className="mr-2 h-4 w-4" />Download
                          </a>
                        </div>
                      </article>
                    ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center"><p className="text-gray-500">No documents have been uploaded for you yet.</p></div>
        )}
          </section>
        )}

        {activeTab === 'invoice' && <PackageInvoice />}
        </div>

        <footer className="mt-8 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="flex items-center justify-center rounded-lg bg-slate-50 p-3 text-sm text-gray-500 dark:bg-slate-800 dark:text-slate-300">
            <InfoIcon className="mr-3 h-5 w-5 flex-shrink-0" />
            For your security, access to this portal will expire on {formatExpiryDate(customer)}. Please download any documents you wish to keep.
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">Last Updated: {formatLastUpdated(customer.lastUpdatedAt)}</p>
        </footer>
      </div>

      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legacy-preview-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewFile(null);
          }}
        >
          <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex flex-shrink-0 items-center justify-between border-b p-4 dark:border-slate-700">
              <h2 id="legacy-preview-title" className="truncate text-lg font-bold text-slate-900 dark:text-white">{previewFile.name}</h2>
              <button type="button" onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-gray-800 dark:hover:text-white" aria-label="Close document preview">
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-grow p-2">
              {getLegacyPreviewKind(previewFile) === 'image' ? (
                <img src={previewFile.url} alt={previewFile.name} referrerPolicy="no-referrer" className="h-full w-full object-contain" />
              ) : (
                <iframe src={previewFile.url} title={`${previewFile.name} preview`} referrerPolicy="no-referrer" className="h-full w-full border-0" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
