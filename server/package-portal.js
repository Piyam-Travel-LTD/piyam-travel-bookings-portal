import { HttpError, sanitizeRetryAfter } from './http.js';

export const PACKAGE_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{8,512}$/;
const PACKAGE_REFERENCE_PATTERN = /^(?:PT-)?([A-Z0-9]{6})$/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const DEFAULT_TIMEOUT_MS = 10_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 30_000;
const ACCESS_RESPONSE_LIMIT_BYTES = 32 * 1024;
const PACKAGE_RESPONSE_LIMIT_BYTES = 2 * 1024 * 1024;

const ACCESS_MESSAGES = Object.freeze({
  invalid: 'Package details do not match. Check the lead passenger surname and reference.',
  expired: 'Your document access has expired. Contact your agent to renew access.',
  throttled: 'Too many attempts. Please wait before trying again.',
  unavailable: 'The package service is temporarily unavailable. Please try again shortly.'
});

const DATA_MESSAGES = Object.freeze({
  invalid: 'Invalid package access token.',
  unavailable: 'Package documents are not currently available. Contact your agent.',
  expired: 'Your document access has expired. Contact your agent to renew access.',
  throttled: 'Too many attempts. Please wait before trying again.',
  service: 'The package service is temporarily unavailable. Please try again shortly.'
});

export function normalizePackageReference(rawValue) {
  if (typeof rawValue !== 'string') return null;
  const match = rawValue.trim().match(PACKAGE_REFERENCE_PATTERN);
  return match ? `PT-${match[1].toUpperCase()}` : null;
}

export function normalizeLastName(rawValue) {
  if (typeof rawValue !== 'string') return null;
  const value = rawValue.trim();
  if (!value || value.length > 120 || CONTROL_CHARACTER_PATTERN.test(value)) return null;
  return value;
}

export function isValidPackageToken(rawValue) {
  return typeof rawValue === 'string' && PACKAGE_TOKEN_PATTERN.test(rawValue);
}

export function requirePackageToken(rawValue) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!isValidPackageToken(value)) {
    throw new HttpError(400, DATA_MESSAGES.invalid, { code: 'INVALID_TOKEN' });
  }
  return value;
}

export function parseRequestTimeout(rawValue) {
  if (rawValue == null || rawValue === '') return DEFAULT_TIMEOUT_MS;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(Math.trunc(parsed), MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

export function resolvePtPortalBaseUrl(rawValue) {
  if (typeof rawValue !== 'string' || !rawValue.trim() || rawValue.length > 2_048) {
    throw new HttpError(503, ACCESS_MESSAGES.unavailable, { code: 'INVALID_BASE_URL' });
  }

  let url;
  try {
    url = new URL(rawValue.trim());
  } catch (error) {
    throw new HttpError(503, ACCESS_MESSAGES.unavailable, {
      code: 'INVALID_BASE_URL',
      cause: error
    });
  }

  const isLocalHost = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    (url.protocol !== 'https:' && !isLocalHost) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new HttpError(503, ACCESS_MESSAGES.unavailable, { code: 'INVALID_BASE_URL' });
  }

  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url;
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function optionalString(value, maxLength = 2_000) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function optionalFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function sanitizePublicUrl(value) {
  if (typeof value !== 'string' || !value || value.length > 8_192) return null;
  try {
    const url = new URL(value);
    const isLocalHost = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      (url.protocol !== 'https:' && !isLocalHost) ||
      url.username ||
      url.password
    ) return null;
    return url.toString();
  } catch (_error) {
    return null;
  }
}

function isForbiddenPublicKey(key) {
  const normalized = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normalized || ['__proto__', 'prototype', 'constructor'].includes(key)) return true;

  return [
    'internal',
    'commission',
    'margin',
    'profit',
    'employee',
    'audit',
    'riskflag',
    'shareaccesscode',
    'thirdpartyaccess',
    'supplierallocation',
    'storagebucket',
    'bucketname',
    'objectkey',
    'storagekey',
    'bookedcost',
    'netcost',
    'suppliercost',
    'hiddenline',
    'accesstoken',
    'accesscode',
    'sharecode',
    'supplierprice',
    'suppliernet',
    'supplierid',
    'providerid',
    'driverid',
    'customerid',
    'reservationid',
    'purchaseprice',
    'buyprice',
    'buyingprice',
    'buyrate',
    'netrate',
    'wholesale',
    'passengername',
    'travellername',
    'familymember'
  ].some((fragment) => normalized.includes(fragment)) ||
    normalized === 'token' ||
    normalized.includes('cost');
}

export function sanitizeJsonValue(value, depth = 0) {
  if (depth > 8) return null;
  if (value == null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return value.slice(0, 20_000);

  if (Array.isArray(value)) {
    return value.slice(0, 500).map((item) => sanitizeJsonValue(item, depth + 1));
  }

  if (!isPlainObject(value)) return null;
  if (
    value.customer_visible === false ||
    value.is_customer_visible === false ||
    value.visible_to_customer === false ||
    value.is_visible === false ||
    value.hidden === true ||
    value.is_hidden === true
  ) return null;

  const output = {};
  for (const [key, childValue] of Object.entries(value).slice(0, 200)) {
    if (key.length > 100 || isForbiddenPublicKey(key)) continue;
    const sanitized = sanitizeJsonValue(childValue, depth + 1);
    if (sanitized !== undefined) output[key] = sanitized;
  }
  return output;
}

const PUBLIC_SUMMARY_FINANCIAL_FRAGMENTS = [
  'price', 'amount', 'balance', 'deposit', 'currency', 'fare', 'quote', 'subtotal', 'grandtotal'
];

function isPublicSummaryFinancialKey(key) {
  const normalized = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized === 'total' || normalized === 'paid' || normalized === 'outstanding' ||
    PUBLIC_SUMMARY_FINANCIAL_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function removePublicSummaryPricing(value, depth = 0) {
  if (depth > 8 || value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => removePublicSummaryPricing(item, depth + 1));
  }

  const output = {};
  for (const [key, childValue] of Object.entries(value)) {
    if (isPublicSummaryFinancialKey(key)) continue;
    output[key] = removePublicSummaryPricing(childValue, depth + 1);
  }
  return output;
}

function sanitizeDocument(value) {
  if (!isPlainObject(value)) return null;
  if ('customer_visible' in value && value.customer_visible !== true) return null;
  if (
    'status' in value &&
    (typeof value.status !== 'string' || value.status.trim().toLowerCase() !== 'released')
  ) return null;

  const category = optionalString(value.category, 80);
  if (!category || category.toLowerCase().replace(/[^a-z0-9]/g, '') === 'traveldocuments') {
    return null;
  }

  const id = ['string', 'number'].includes(typeof value.id)
    ? optionalString(String(value.id), 200)
    : null;
  const fileName = optionalString(value.file_name, 500);
  const title = optionalString(value.title, 500) || fileName;
  const signedUrl = sanitizePublicUrl(value.signed_url);
  const previewUrl = sanitizePublicUrl(value.preview_url);
  if (!id || !title || (!signedUrl && !previewUrl)) return null;

  return {
    id,
    category,
    title,
    file_name: fileName || title,
    file_size: optionalFiniteNumber(value.file_size) ?? optionalString(value.file_size, 100),
    file_type: optionalString(value.file_type, 200),
    released_at: optionalString(value.released_at, 100),
    public_notes: optionalString(value.public_notes, 10_000),
    signed_url: signedUrl,
    preview_url: previewUrl,
    status: 'released',
    customer_visible: true
  };
}

function sanitizeChecklistItem(value, index) {
  if (typeof value === 'string') {
    const label = optionalString(value, 500);
    return label ? { id: `checklist-${index + 1}`, label, status: '', completed: false } : null;
  }
  if (!isPlainObject(value)) return null;
  if (
    value.customer_visible === false ||
    value.is_customer_visible === false ||
    value.hidden === true ||
    value.is_hidden === true
  ) return null;

  const label = optionalString(
    value.customer_label ?? value.customerLabel ?? value.label ?? value.text ?? value.title,
    500
  );
  if (!label) return null;
  const idValue = ['string', 'number'].includes(typeof value.id)
    ? String(value.id)
    : `checklist-${index + 1}`;
  return {
    id: optionalString(idValue, 200),
    label,
    status: optionalString(value.status ?? value.state, 120),
    completed: value.completed === true || value.is_complete === true || value.isComplete === true
  };
}

export function sanitizePackagePayload(payload) {
  if (!isPlainObject(payload) || !isPlainObject(payload.package) || !Array.isArray(payload.documents)) {
    throw new HttpError(503, DATA_MESSAGES.service, { code: 'INVALID_UPSTREAM_PAYLOAD' });
  }

  const packageReference = normalizePackageReference(payload.package.package_reference);
  const customerName = optionalString(payload.package.customer_name, 500);
  if (!packageReference || !customerName) {
    throw new HttpError(503, DATA_MESSAGES.service, { code: 'INVALID_UPSTREAM_PAYLOAD' });
  }

  const publicSummary = isPlainObject(payload.package.current_public_summary)
    ? removePublicSummaryPricing(sanitizeJsonValue(payload.package.current_public_summary))
    : {};
  const packageData = {
    id: optionalString(payload.package.id, 200),
    package_reference: packageReference,
    customer_name: customerName,
    customer_email: optionalString(payload.package.customer_email, 500),
    customer_phone: optionalString(
      payload.package.customer_phone ?? payload.package.customer_mobile ?? payload.package.customer_contact_number,
      120
    ),
    customer_whatsapp: optionalString(
      payload.package.customer_whatsapp ?? payload.package.customer_whats_app ?? payload.package.whatsapp_number,
      120
    ),
    package_type: optionalString(payload.package.package_type, 200),
    destination: optionalString(payload.package.destination, 500),
    departure_date: optionalString(payload.package.departure_date, 100),
    return_date: optionalString(payload.package.return_date, 100),
    document_access_expires_at: optionalString(payload.package.document_access_expires_at, 100),
    document_release_status: optionalString(payload.package.document_release_status, 100),
    current_public_summary: publicSummary || {},
    passport_status: optionalString(payload.package.passport_status, 100)
  };

  const documents = payload.documents
    .slice(0, 500)
    .map(sanitizeDocument)
    .filter(Boolean);
  const rawChecklist = Array.isArray(payload.checklist)
    ? payload.checklist
    : Array.isArray(payload.package.checklist)
      ? payload.package.checklist
      : [];
  const checklist = rawChecklist
    .slice(0, 200)
    .map(sanitizeChecklistItem)
    .filter(Boolean);

  const signedUrlExpiresIn = optionalFiniteNumber(payload.signedUrlExpiresIn);
  return {
    package: packageData,
    documents,
    checklist,
    releasedInvoice: isPlainObject(payload.releasedInvoice)
      ? sanitizeJsonValue(payload.releasedInvoice)
      : null,
    transportVoucher: isPlainObject(payload.transportVoucher)
      ? sanitizeJsonValue(payload.transportVoucher)
      : null,
    signedUrlExpiresIn: signedUrlExpiresIn && signedUrlExpiresIn > 0
      ? Math.min(Math.trunc(signedUrlExpiresIn), 86_400)
      : null
  };
}

async function readBoundedText(response, maxBytes) {
  const contentLength = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new HttpError(503, DATA_MESSAGES.service, { code: 'UPSTREAM_RESPONSE_TOO_LARGE' });
  }

  if (!response.body) return '';
  if (typeof response.body.getReader !== 'function') {
    const data = new Uint8Array(await response.arrayBuffer());
    if (data.byteLength > maxBytes) {
      throw new HttpError(503, DATA_MESSAGES.service, { code: 'UPSTREAM_RESPONSE_TOO_LARGE' });
    }
    return new TextDecoder().decode(data);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new HttpError(503, DATA_MESSAGES.service, { code: 'UPSTREAM_RESPONSE_TOO_LARGE' });
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
}

function parseUpstreamJson(text) {
  if (!text) return { valid: false, payload: null };
  try {
    const payload = JSON.parse(text);
    return { valid: isPlainObject(payload), payload };
  } catch (_error) {
    return { valid: false, payload: null };
  }
}

export function createPackagePortalClient({ fetchImpl = globalThis.fetch, env = process.env } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new HttpError(503, ACCESS_MESSAGES.unavailable, { code: 'FETCH_UNAVAILABLE' });
  }

  const requestJson = async (relativePath, init, maxBytes) => {
    const baseUrl = resolvePtPortalBaseUrl(env.PT_PORTAL_BASE_URL);
    const url = new URL(relativePath.replace(/^\/+/, ''), baseUrl);
    const controller = new AbortController();
    const timeout = parseRequestTimeout(env.PT_PORTAL_REQUEST_TIMEOUT_MS);
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetchImpl(url, {
        ...init,
        redirect: 'error',
        signal: controller.signal
      });
      const text = await readBoundedText(response, maxBytes);
      const parsed = parseUpstreamJson(text);
      return {
        status: response.status,
        ok: response.ok,
        retryAfter: sanitizeRetryAfter(response.headers?.get?.('retry-after')),
        jsonValid: parsed.valid,
        payload: parsed.payload
      };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        throw new HttpError(504, ACCESS_MESSAGES.unavailable, {
          code: 'UPSTREAM_TIMEOUT',
          cause: error
        });
      }
      throw new HttpError(503, ACCESS_MESSAGES.unavailable, {
        code: 'UPSTREAM_UNAVAILABLE',
        cause: error
      });
    } finally {
      clearTimeout(timer);
    }
  };

  const accessPackage = async (reference, lastName) => {
    const result = await requestJson('api/package-portal/access', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reference, lastName })
    }, ACCESS_RESPONSE_LIMIT_BYTES);

    if (result.status === 200 && result.ok) {
      if (!result.jsonValid || !isValidPackageToken(result.payload?.token)) {
        throw new HttpError(503, ACCESS_MESSAGES.unavailable, { code: 'INVALID_UPSTREAM_TOKEN' });
      }
      return { found: true, token: result.payload.token };
    }

    if (result.status === 404) {
      if (!result.jsonValid) {
        throw new HttpError(503, ACCESS_MESSAGES.unavailable, { code: 'NON_JSON_UPSTREAM_404' });
      }
      return { found: false, token: null };
    }

    if (result.status === 400) {
      throw new HttpError(400, ACCESS_MESSAGES.invalid, { code: 'UPSTREAM_VALIDATION' });
    }
    if (result.status === 410) {
      throw new HttpError(410, ACCESS_MESSAGES.expired, { code: 'ACCESS_EXPIRED' });
    }
    if (result.status === 429) {
      throw new HttpError(429, ACCESS_MESSAGES.throttled, {
        code: 'ACCESS_THROTTLED',
        retryAfter: result.retryAfter
      });
    }

    throw new HttpError(503, ACCESS_MESSAGES.unavailable, { code: 'UPSTREAM_ACCESS_ERROR' });
  };

  const loadPackage = async (rawToken) => {
    const token = requirePackageToken(rawToken);
    const result = await requestJson(
      `api/package-documents/${encodeURIComponent(token)}`,
      { method: 'GET', headers: { Accept: 'application/json' } },
      PACKAGE_RESPONSE_LIMIT_BYTES
    );

    if (result.status === 200 && result.ok) {
      if (!result.jsonValid) {
        throw new HttpError(503, DATA_MESSAGES.service, { code: 'INVALID_UPSTREAM_PAYLOAD' });
      }
      return sanitizePackagePayload(result.payload);
    }
    if (result.status === 400) {
      throw new HttpError(400, DATA_MESSAGES.invalid, { code: 'INVALID_TOKEN' });
    }
    if (result.status === 404) {
      throw new HttpError(404, DATA_MESSAGES.unavailable, { code: 'PACKAGE_UNAVAILABLE' });
    }
    if (result.status === 410) {
      throw new HttpError(410, DATA_MESSAGES.expired, { code: 'ACCESS_EXPIRED' });
    }
    if (result.status === 429) {
      throw new HttpError(429, DATA_MESSAGES.throttled, {
        code: 'ACCESS_THROTTLED',
        retryAfter: result.retryAfter
      });
    }
    throw new HttpError(503, DATA_MESSAGES.service, { code: 'UPSTREAM_DATA_ERROR' });
  };

  return { accessPackage, loadPackage };
}

export { ACCESS_MESSAGES, DATA_MESSAGES };
