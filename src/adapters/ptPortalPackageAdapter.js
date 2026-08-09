import { normalizeReleasedInvoice, normalizeTransportVoucher } from './portalReleaseAdapters.js';
import {
  cleanText,
  isExplicitFalse,
  isExplicitTrue,
  isRecord,
  isTravelDocumentsCategory,
  normalizeDocumentCategory,
  safeExternalUrl
} from '../utils/packagePortal.js';

function isReleasedCustomerDocument(document) {
  if (!isRecord(document)) return false;
  if (isTravelDocumentsCategory(document.category)) return false;

  // The PT endpoint already filters documents. These redundant fields are optional,
  // but an explicit hidden/non-released value must still fail closed.
  if (isExplicitFalse(document.customer_visible) || isExplicitFalse(document.customerVisible)) return false;
  if (isExplicitTrue(document.hidden) || isExplicitTrue(document.internal_only) || isExplicitTrue(document.internalOnly)) return false;

  const status = cleanText(document.status, '', 80).toLowerCase();
  if (status && status !== 'released') return false;
  return true;
}

function normalizeDocument(document, index) {
  const title = cleanText(document.title || document.file_name, 'Document', 500);
  const fileName = cleanText(document.file_name || document.title, 'document', 500);

  return {
    id: cleanText(document.id || document.file_name || document.title, `document-${index + 1}`, 200),
    category: normalizeDocumentCategory(document.category),
    title,
    file_name: fileName,
    file_size: document.file_size ?? null,
    file_type: cleanText(document.file_type, '', 200),
    released_at: document.released_at || null,
    public_notes: cleanText(document.public_notes, '', 5000),
    signed_url: safeExternalUrl(document.signed_url),
    preview_url: safeExternalUrl(document.preview_url),
    status: 'released',
    customer_visible: true
  };
}

function normalizePublicSummary(summary) {
  if (!isRecord(summary)) return {};

  const blockedFragments = [
    'internal', 'supplier', 'cost', 'commission', 'margin', 'profit', 'employee',
    'audit', 'risk', 'shareaccess', 'storage', 'objectkey', 'token', 'price',
    'amount', 'balance', 'deposit', 'currency', 'fare', 'quote', 'subtotal', 'grandtotal'
  ];

  // The object is already designated public by PT-Portal. Keep only scalar values
  // so nested operational records can never be passed to a rendering component.
  return Object.entries(summary).reduce((safeSummary, [key, value]) => {
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(key)) return safeSummary;
    if (['__proto__', 'prototype', 'constructor'].includes(key)) return safeSummary;
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (['total', 'paid', 'outstanding'].includes(normalizedKey)) return safeSummary;
    if (blockedFragments.some((fragment) => normalizedKey.includes(fragment))) return safeSummary;
    if (!['string', 'number', 'boolean'].includes(typeof value)) return safeSummary;
    safeSummary[key] = typeof value === 'string' ? cleanText(value, '', 2000) : value;
    return safeSummary;
  }, {});
}

function normalizeChecklist(rawChecklist, passportStatus) {
  const checklist = Array.isArray(rawChecklist)
    ? rawChecklist.map((item, index) => {
      if (!isRecord(item)) {
        const label = cleanText(item, '', 500);
        return label ? { id: `checklist-${index + 1}`, label, status: '', completed: false } : null;
      }
      const label = cleanText(item.customer_label || item.customerLabel || item.label || item.text || item.title, '', 500);
      if (!label) return null;

      const status = cleanText(item.status || item.state, '', 120);
      const normalizedStatus = status.toLowerCase();
      const completed = item.completed === true || item.is_complete === true || item.isComplete === true ||
        ['ready', 'complete', 'completed', 'done', 'approved'].includes(normalizedStatus);

      return {
        id: cleanText(item.id, `checklist-${index + 1}`, 160),
        label,
        status,
        completed
      };
    }).filter(Boolean)
    : [];

  const safePassportStatus = cleanText(passportStatus, '', 120);
  if (safePassportStatus && !checklist.some(item => /passport/i.test(item.label))) {
    checklist.push({
      id: 'passport-status',
      label: 'Passport status',
      status: safePassportStatus,
      completed: ['ready', 'complete', 'completed', 'approved'].includes(safePassportStatus.toLowerCase())
    });
  }

  return checklist;
}

/** Convert the public PT package response to the normalized customer view model. */
export function normalizePtPortalPackage(apiPayload) {
  const payload = isRecord(apiPayload) ? apiPayload : {};
  const packageData = isRecord(payload.package) ? payload.package : {};
  const documents = Array.isArray(payload.documents) ? payload.documents : [];
  const expiresIn = Number(payload.signedUrlExpiresIn);
  const rawChecklist = Array.isArray(payload.checklist) ? payload.checklist : packageData.checklist;

  return {
    source: 'pt_portal',
    reference: cleanText(packageData.package_reference || packageData.reference, 'PT-UNKNOWN', 80),
    customerName: cleanText(packageData.customer_name, 'Customer', 300),
    packageType: cleanText(packageData.package_type, '', 120),
    destination: cleanText(packageData.destination, '', 300),
    departureDate: packageData.departure_date || null,
    returnDate: packageData.return_date || null,
    accessExpiresAt: packageData.document_access_expires_at || null,
    statusLabel: cleanText(packageData.document_release_status || packageData.status, 'open', 120),
    publicSummary: normalizePublicSummary(packageData.current_public_summary),
    documents: documents.filter(isReleasedCustomerDocument).map(normalizeDocument),
    transportVoucher: normalizeTransportVoucher(payload.transportVoucher || payload.transport_voucher),
    releasedInvoice: normalizeReleasedInvoice(payload.releasedInvoice || payload.released_invoice),
    checklist: normalizeChecklist(rawChecklist, packageData.passport_status || packageData.passportStatus),
    keyInformation: {
      customerEmail: cleanText(packageData.customer_email, '', 254),
      customerPhone: cleanText(
        packageData.customer_phone || packageData.customer_mobile || packageData.customer_contact_number,
        '',
        120
      ),
      customerWhatsApp: cleanText(
        packageData.customer_whatsapp || packageData.customer_whats_app || packageData.whatsapp_number,
        '',
        120
      ),
      customerName: cleanText(packageData.customer_name, 'Customer', 300)
    },
    signedUrlExpiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? Math.floor(expiresIn) : null,
    loadedAt: new Date().toISOString()
  };
}
