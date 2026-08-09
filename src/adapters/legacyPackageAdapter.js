import { normalizeReleasedInvoice, normalizeTransportVoucher } from './portalReleaseAdapters.js';
import { cleanText, isRecord, normalizeDocumentCategory, safeExternalUrl } from '../utils/packagePortal.js';

function normalizeLegacyDocument(document, index) {
  const record = isRecord(document) ? document : {};
  const fileName = cleanText(record.name || record.fileName, 'document', 500);

  return {
    id: cleanText(record.id || record.name || record.fileName, `legacy-document-${index + 1}`, 200),
    category: normalizeDocumentCategory(record.category),
    title: cleanText(record.name || record.fileName, 'Document', 500),
    file_name: fileName,
    file_size: record.file_size ?? record.size ?? null,
    file_type: cleanText(record.type, '', 200),
    released_at: record.releasedAt || null,
    public_notes: cleanText(record.publicNotes, '', 5000),
    signed_url: safeExternalUrl(record.url),
    preview_url: safeExternalUrl(record.url),
    status: 'released',
    customer_visible: true
  };
}

/**
 * Preserve the complete legacy customer contract for the existing editable
 * Firebase dashboard while adding normalized aliases for a future shared shell.
 * Raw `documents`, names, ids and timestamps are deliberately not overwritten.
 */
export function normalizeLegacyPackage(customer) {
  const rawCustomer = isRecord(customer) ? customer : {};
  const rawDocuments = Array.isArray(rawCustomer.documents) ? rawCustomer.documents : [];

  return {
    ...rawCustomer,
    source: 'legacy_firebase',
    reference: cleanText(rawCustomer.referenceNumber, '', 80),
    customerName: `${cleanText(rawCustomer.firstName, '', 150)} ${cleanText(rawCustomer.lastName, '', 150)}`.trim(),
    statusLabel: cleanText(rawCustomer.status, 'open', 120),
    departureDate: rawCustomer.departureDate || rawCustomer.departure_date || null,
    returnDate: rawCustomer.returnDate || rawCustomer.return_date || null,
    accessExpiresAt: rawCustomer.accessExpiresAt || null,
    publicSummary: isRecord(rawCustomer.publicSummary) ? rawCustomer.publicSummary : {},
    portalDocuments: rawDocuments.map(normalizeLegacyDocument),
    portalTransportVoucher: normalizeTransportVoucher(rawCustomer.transportVoucher),
    portalReleasedInvoice: normalizeReleasedInvoice(rawCustomer.releasedInvoice)
  };
}
