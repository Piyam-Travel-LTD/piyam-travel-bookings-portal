const SAFE_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:']);

const CATEGORY_ALIASES = {
  flight: 'flight',
  flights: 'flight',
  hotel: 'hotel',
  hotels: 'hotel',
  transport: 'transport',
  transportation: 'transport',
  visa: 'visa',
  visas: 'visa',
  e_sim: 'e_sim',
  esim: 'e_sim',
  'e-sim': 'e_sim',
  insurance: 'insurance',
  invoice: 'invoice',
  invoices: 'invoice',
  other: 'other',
  others: 'other'
};

export const DOCUMENT_KINDS = Object.freeze({
  PDF: 'pdf',
  IMAGE: 'image',
  HTML: 'html',
  DOWNLOAD: 'download'
});

export function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function cleanText(value, fallback = '', maxLength = 2000) {
  if (value === null || value === undefined) return fallback;
  if (!['string', 'number', 'boolean'].includes(typeof value)) return fallback;

  const text = String(value).trim();
  if (!text) return fallback;
  return text.slice(0, maxLength);
}

export function firstValue(sources, keys, fallback = null) {
  for (const source of sources) {
    if (!isRecord(source)) continue;
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
  }
  return fallback;
}

export function isExplicitFalse(value) {
  return value === false || value === 0 || ['false', '0', 'no'].includes(String(value).toLowerCase());
}

export function isExplicitTrue(value) {
  return value === true || value === 1 || ['true', '1', 'yes'].includes(String(value).toLowerCase());
}

export function safeExternalUrl(value) {
  const candidate = cleanText(value, '', 4096);
  if (!candidate) return null;

  try {
    const baseUrl = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://bookings.piyamtravel.com';
    const parsed = new URL(candidate, baseUrl);
    const isLocalHost = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(parsed.hostname);
    if (
      !SAFE_EXTERNAL_PROTOCOLS.has(parsed.protocol) ||
      (parsed.protocol !== 'https:' && !isLocalHost) ||
      parsed.username ||
      parsed.password
    ) return null;
    return parsed.href;
  } catch (_error) {
    return null;
  }
}

export function normalizeDocumentCategory(value) {
  const normalized = cleanText(value, 'other', 80)
    .toLowerCase()
    .replace(/\s+/g, '_');

  return CATEGORY_ALIASES[normalized] || 'other';
}

export function isTravelDocumentsCategory(value) {
  const normalized = cleanText(value, '', 80)
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  return normalized === 'travel_documents' || normalized === 'traveldocuments';
}

export function getDocumentExtension(document) {
  const candidates = [document?.file_name, document?.title, document?.preview_url, document?.signed_url];

  for (const candidate of candidates) {
    const text = cleanText(candidate, '', 4096).split(/[?#]/, 1)[0];
    const match = text.toLowerCase().match(/\.([a-z0-9]{1,10})$/);
    if (match) return match[1];
  }

  return '';
}

/**
 * Classifies only the formats the customer portal can safely preview.
 * HTML is previewable only for the controlled transport-voucher flow.
 */
export function classifyPortalDocument(document) {
  const mimeType = cleanText(document?.file_type, '', 200).toLowerCase().split(';', 1)[0];
  const extension = getDocumentExtension(document);
  const category = normalizeDocumentCategory(document?.category);

  if (mimeType === 'application/pdf' || mimeType === 'pdf' || extension === 'pdf') {
    return DOCUMENT_KINDS.PDF;
  }

  if (
    ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'jpg', 'jpeg', 'png', 'webp'].includes(mimeType) ||
    ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
  ) {
    return DOCUMENT_KINDS.IMAGE;
  }

  const isHtml = ['text/html', 'application/xhtml+xml', 'html', 'htm'].includes(mimeType) ||
    ['html', 'htm'].includes(extension);

  if (isHtml && category === 'transport') return DOCUMENT_KINDS.HTML;
  return DOCUMENT_KINDS.DOWNLOAD;
}

export function formatFileSize(value) {
  if (value === null || value === undefined || value === '') return 'File';
  if (typeof value === 'string' && /[a-z]/i.test(value)) return cleanText(value, 'File', 80);

  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return 'File';
  if (bytes < 1024) return `${Math.round(bytes)} B`;

  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: size < 10 ? 1 : 0 }).format(size)} ${units[unitIndex]}`;
}

export function formatPortalDate(value, options = {}) {
  if (!value) return options.fallback || 'Not supplied';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value, options.fallback || 'Not supplied', 100);

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(options.includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(date);
}

export function formatMoney(value, currency = 'GBP') {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return cleanText(value, '', 80) || null;

  const normalizedCurrency = /^[A-Z]{3}$/.test(cleanText(currency, '', 3).toUpperCase())
    ? cleanText(currency, '', 3).toUpperCase()
    : 'GBP';

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (_error) {
    return `${normalizedCurrency} ${amount.toFixed(2)}`;
  }
}

export function formatQuantity(value) {
  if (value === null || value === undefined || value === '') return null;
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return cleanText(value, '', 40) || null;
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(quantity);
}
