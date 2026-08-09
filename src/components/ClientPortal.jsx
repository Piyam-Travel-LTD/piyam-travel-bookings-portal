import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { normalizePtPortalPackage } from '../adapters/ptPortalPackageAdapter';
import {
  loadPackageData,
  logoutPackageSession
} from '../services/packagePortalApi';
import { getPackageErrorMessage } from '../services/packageErrorResolver';
import PackageDocumentPreview from './portal/PackageDocumentPreview';
import PackageDocuments from './portal/PackageDocuments';
import PackageErrorState from './portal/PackageErrorState';
import PackageHeader from './portal/PackageHeader';
import PackageInvoice from './portal/PackageInvoice';
import PackageLogin from './portal/PackageLogin';
import PackageOverview from './portal/PackageOverview';
import PersonalTravelChecklist from './portal/PersonalTravelChecklist';
import PortalFooter from './portal/PortalFooter';
import PortalWorkInProgressBanner from './portal/PortalWorkInProgressBanner';

const LegacyClientDashboard = lazy(() => import('./legacy/LegacyClientDashboard'));
const SIGNED_LINK_REFRESH_LEEWAY_MS = 60_000;

function LoadingPanel({ message = 'Loading your package…' }) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-gray-800" role="status" aria-live="polite">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-800" aria-hidden="true" />
      <p className="text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  );
}

function signedLinksNeedRefresh(customer, now = Date.now()) {
  const lifetimeSeconds = Number(customer?.signedUrlExpiresIn);
  const loadedAt = Date.parse(customer?.loadedAt || '');
  if (!Number.isFinite(lifetimeSeconds) || lifetimeSeconds <= 0 || !Number.isFinite(loadedAt)) return false;
  const lifetimeMs = lifetimeSeconds * 1000;
  const leeway = Math.min(SIGNED_LINK_REFRESH_LEEWAY_MS, Math.max(1_000, lifetimeMs * 0.1));
  return now >= loadedAt + lifetimeMs - leeway;
}

function findDocument(customer, documentId) {
  return customer?.documents?.find((document) => document.id === documentId) || null;
}

function triggerDownload(documentToDownload) {
  if (!documentToDownload?.signed_url) throw new Error('This secure download is unavailable.');

  const anchor = document.createElement('a');
  anchor.href = documentToDownload.signed_url;
  anchor.download = documentToDownload.file_name || documentToDownload.title || 'document';
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.referrerPolicy = 'no-referrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function openSecureTab(url, existingWindow = null) {
  if (!url) throw new Error('This secure preview is unavailable.');

  if (existingWindow && !existingWindow.closed) {
    existingWindow.opener = null;
    existingWindow.location.replace(url);
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.referrerPolicy = 'no-referrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function PtPortalDashboard({ customer, isRefreshing, refreshMessage, onLogout, onRefreshPackage }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const tabs = useMemo(() => (
    [
      { id: 'overview', label: 'Overview' },
      { id: 'documents', label: 'Documents' },
      { id: 'checklist', label: 'My Checklist' },
      { id: 'invoice', label: 'Invoice' }
    ]
  ), []);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) setActiveTab('overview');
  }, [activeTab, tabs]);

  const handleTabKeyDown = useCallback((event, currentIndex) => {
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    window.requestAnimationFrame(() => {
      document.getElementById(`package-tab-${nextTab.id}`)?.focus();
    });
  }, [tabs]);

  const refreshDocument = useCallback(async (originalDocument, { force = false } = {}) => {
    const refreshedPackage = await onRefreshPackage({ force });
    const refreshedDocument = findDocument(refreshedPackage, originalDocument.id);
    if (!refreshedDocument) {
      throw new Error('This document is no longer available. Refresh the package to see current releases.');
    }
    return refreshedDocument;
  }, [onRefreshPackage]);

  const handleDownload = useCallback(async (documentToDownload) => {
    setActionMessage('');
    try {
      if (!signedLinksNeedRefresh(customer)) {
        triggerDownload(documentToDownload);
        return;
      }

      const refreshedDocument = await refreshDocument(documentToDownload, { force: true });
      triggerDownload(refreshedDocument);
    } catch (error) {
      // The package shell displays the refresh error without leaving an unhandled event promise.
      setActionMessage(error?.message || 'This document is not currently available.');
    }
  }, [customer, refreshDocument]);

  const handleViewHtml = useCallback(async (documentToView) => {
    setActionMessage('');
    if (!signedLinksNeedRefresh(customer)) {
      openSecureTab(documentToView.preview_url);
      return;
    }

    const placeholder = window.open('about:blank', '_blank');
    if (placeholder) {
      placeholder.opener = null;
      try {
        placeholder.document.title = 'Loading secure voucher…';
        const meta = placeholder.document.createElement('meta');
        meta.name = 'referrer';
        meta.content = 'no-referrer';
        placeholder.document.head.appendChild(meta);
      } catch (_error) {
        // The placeholder remains safe after its opener is cleared.
      }
    }

    try {
      const refreshedDocument = await refreshDocument(documentToView, { force: true });
      openSecureTab(refreshedDocument.preview_url, placeholder);
    } catch (error) {
      placeholder?.close();
      setActionMessage(error?.message || 'This voucher is not currently available.');
    }
  }, [customer, refreshDocument]);

  const handlePreviewRefresh = useCallback(async (documentToRefresh) => {
    const refreshedDocument = await refreshDocument(documentToRefresh, { force: true });
    setPreviewDocument(refreshedDocument);
    return refreshedDocument;
  }, [refreshDocument]);

  return (
    <>
      <div className="w-full rounded-2xl border border-transparent bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:p-6 md:p-8">
        <PackageHeader customer={customer} onLogout={onLogout} />

        {(isRefreshing || refreshMessage || actionMessage) && (
          <div
            className={`mb-4 rounded-lg border p-3 text-sm ${refreshMessage || actionMessage ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100' : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100'}`}
            role={refreshMessage || actionMessage ? 'alert' : 'status'}
            aria-live="polite"
          >
            {isRefreshing ? 'Refreshing your secure document links…' : refreshMessage || actionMessage}
          </div>
        )}

        <div className="sticky top-0 z-10 -mx-4 mb-6 border-y border-gray-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:mx-0 sm:rounded-lg sm:border sm:px-2">
          <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Package sections" aria-orientation="horizontal">
            {tabs.map((tab, index) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`package-tab-${tab.id}`}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`package-panel-${tab.id}`}
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
          id={`package-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`package-tab-${activeTab}`}
          tabIndex={0}
          className="focus:outline-none"
        >
          {activeTab === 'overview' && <PackageOverview customer={customer} onOpenDocuments={() => setActiveTab('documents')} />}
          {activeTab === 'documents' && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onRefreshPackage({ force: true }).catch(() => {})}
                  disabled={isRefreshing}
                  className="min-h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {isRefreshing ? 'Refreshing…' : 'Refresh secure links'}
                </button>
              </div>
              <PackageDocuments
                documents={customer.documents}
                onPreview={setPreviewDocument}
                onDownload={handleDownload}
                onViewHtml={handleViewHtml}
              />
            </>
          )}
          {activeTab === 'checklist' && <PersonalTravelChecklist reference={customer.reference} />}
          {activeTab === 'invoice' && <PackageInvoice />}
        </div>
      </div>

      <PackageDocumentPreview
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
        onRefreshDocument={handlePreviewRefresh}
      />
    </>
  );
}

export default function ClientPortal() {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [portalPackage, setPortalPackage] = useState(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [portalError, setPortalError] = useState(null);
  const credentialRef = useRef(null);
  const packageRef = useRef(null);
  const refreshPromiseRef = useRef(null);
  const skipNextDocumentsLoadRef = useRef(false);
  const customerStateVersionRef = useRef(0);

  const commitPackage = useCallback((nextPackage) => {
    packageRef.current = nextPackage;
    setPortalPackage(nextPackage);
  }, []);

  useEffect(() => {
    const directToken = typeof token === 'string' && token ? token : null;
    const isSessionRoute = location.pathname === '/documents';
    if (!directToken && !isSessionRoute) return undefined;

    if (isSessionRoute && skipNextDocumentsLoadRef.current && packageRef.current) {
      skipNextDocumentsLoadRef.current = false;
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;
    setIsRouteLoading(true);
    setPortalError(null);
    setRefreshMessage('');

    (async () => {
      try {
        const payload = await loadPackageData(directToken, { signal: controller.signal });
        if (cancelled) return;

        const normalized = normalizePtPortalPackage(payload);
        const sessionEstablished = payload.sessionEstablished === true || !directToken;
        credentialRef.current = sessionEstablished ? null : directToken;
        commitPackage(normalized);

        if (directToken && sessionEstablished) {
          skipNextDocumentsLoadRef.current = true;
          navigate('/documents', { replace: true });
        }
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') return;
        credentialRef.current = null;
        commitPackage(null);
        setPortalError({
          title: Number(error?.status) === 410 ? 'Access expired' : 'Package unavailable',
          message: getPackageErrorMessage(error, 'token')
        });
      } finally {
        if (!cancelled) setIsRouteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [commitPackage, location.pathname, navigate, token]);

  const refreshPackage = useCallback(async ({ force = false } = {}) => {
    const currentPackage = packageRef.current;
    if (!currentPackage || currentPackage.source !== 'pt_portal') return currentPackage;
    if (!force && !signedLinksNeedRefresh(currentPackage)) return currentPackage;
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const refreshRequest = (async () => {
      const stateVersion = customerStateVersionRef.current;
      setIsRefreshing(true);
      setRefreshMessage('');
      try {
        const payload = await loadPackageData(credentialRef.current);
        if (stateVersion !== customerStateVersionRef.current) return packageRef.current;
        const normalized = normalizePtPortalPackage(payload);
        if (payload.sessionEstablished === true) {
          credentialRef.current = null;
        }
        commitPackage(normalized);
        return normalized;
      } catch (error) {
        if (stateVersion !== customerStateVersionRef.current) return packageRef.current;
        const status = Number(error?.status);
        if ([400, 404, 410].includes(status)) {
          credentialRef.current = null;
          commitPackage(null);
          setPortalError({
            title: status === 410 ? 'Access expired' : 'Package unavailable',
            message: getPackageErrorMessage(error, 'token')
          });
        } else {
          setRefreshMessage(getPackageErrorMessage(error, 'token'));
        }
        throw error;
      } finally {
        setIsRefreshing(false);
      }
    })();

    refreshPromiseRef.current = refreshRequest;
    try {
      return await refreshRequest;
    } finally {
      if (refreshPromiseRef.current === refreshRequest) refreshPromiseRef.current = null;
    }
  }, [commitPackage]);

  useEffect(() => {
    if (portalPackage?.source !== 'pt_portal') return undefined;
    const lifetimeSeconds = Number(portalPackage.signedUrlExpiresIn);
    const loadedAt = Date.parse(portalPackage.loadedAt || '');
    if (!Number.isFinite(lifetimeSeconds) || lifetimeSeconds <= 0 || !Number.isFinite(loadedAt)) return undefined;

    const lifetimeMs = lifetimeSeconds * 1000;
    const leeway = Math.min(SIGNED_LINK_REFRESH_LEEWAY_MS, Math.max(1_000, lifetimeMs * 0.1));
    const refreshAt = loadedAt + lifetimeMs - leeway;
    const delay = Math.min(Math.max(refreshAt - Date.now(), 1_000), 2_147_000_000);
    const timer = window.setTimeout(() => {
      refreshPackage({ force: true }).catch(() => {});
    }, delay);
    return () => window.clearTimeout(timer);
  }, [portalPackage, refreshPackage]);

  const handleAuthenticated = useCallback(async ({
    package: authenticatedPackage,
    credential,
    sessionEstablished
  }) => {
    credentialRef.current = credential || null;
    setPortalError(null);
    setRefreshMessage('');
    commitPackage(authenticatedPackage);

    if (authenticatedPackage.source === 'pt_portal' && sessionEstablished) {
      skipNextDocumentsLoadRef.current = true;
      navigate('/documents', { replace: true });
    }
  }, [commitPackage, navigate]);

  const clearCustomerState = useCallback(() => {
    customerStateVersionRef.current += 1;
    credentialRef.current = null;
    refreshPromiseRef.current = null;
    setPortalError(null);
    setRefreshMessage('');
    commitPackage(null);
  }, [commitPackage]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutPackageSession();
    } catch (_error) {
      // Local package state is still cleared; the next protected request revalidates upstream access.
    } finally {
      clearCustomerState();
      navigate('/', { replace: true });
    }
  }, [clearCustomerState, navigate]);

  const returnToLogin = useCallback(() => {
    logoutPackageSession().catch(() => {});
    clearCustomerState();
    navigate('/', { replace: true });
  }, [clearCustomerState, navigate]);

  const updateLegacyCustomer = useCallback((updatedCustomer) => {
    commitPackage(updatedCustomer);
  }, [commitPackage]);

  let content;
  if (isRouteLoading) {
    content = <LoadingPanel />;
  } else if (portalError) {
    content = (
      <PackageErrorState
        title={portalError.title}
        message={portalError.message}
        actionLabel="Return to package login"
        onAction={returnToLogin}
      />
    );
  } else if (portalPackage?.source === 'pt_portal') {
    content = (
      <PtPortalDashboard
        customer={portalPackage}
        isRefreshing={isRefreshing}
        refreshMessage={refreshMessage}
        onLogout={handleLogout}
        onRefreshPackage={refreshPackage}
      />
    );
  } else if (portalPackage?.source === 'legacy_firebase') {
    content = (
      <Suspense fallback={<LoadingPanel message="Loading legacy package…" />}>
        <LegacyClientDashboard
          customer={portalPackage}
          onLogout={handleLogout}
          onCustomerUpdate={updateLegacyCustomer}
        />
      </Suspense>
    );
  } else {
    content = <PackageLogin onAuthenticated={handleAuthenticated} />;
  }

  const isDashboard = Boolean(portalPackage);
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <PortalWorkInProgressBanner />
      <main className={`flex flex-1 p-3 sm:p-4 ${isDashboard ? 'items-start justify-center py-5 sm:py-8' : 'items-center justify-center py-8'}`}>
        <div className="w-full max-w-5xl">{content}</div>
      </main>
      <PortalFooter />
    </div>
  );
}
