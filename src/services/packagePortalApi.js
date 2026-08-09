const ACCESS_ENDPOINT = '/api/package-access';
const DATA_ENDPOINT = '/api/package-data';
const SESSION_ENDPOINT = '/api/package-session';

const DEFAULT_ACCESS_ERROR = 'Package details do not match. Check the lead passenger surname and reference.';
const DEFAULT_DATA_ERROR = 'Package documents are not currently available. Contact your agent.';
const DEFAULT_SERVICE_ERROR = 'The package service is temporarily unavailable. Please try again shortly.';

/**
 * Error returned by the same-origin package portal API.
 * `status` is zero for a network failure. `retryAfter` is seconds, when supplied.
 */
export class PackagePortalApiError extends Error {
  constructor(message, { status = 0, retryAfter = null, code = null, cause } = {}) {
    super(message || DEFAULT_SERVICE_ERROR, cause ? { cause } : undefined);
    this.name = 'PackagePortalApiError';
    this.status = Number.isFinite(Number(status)) ? Number(status) : 0;
    this.retryAfter = Number.isFinite(Number(retryAfter)) ? Math.max(0, Math.ceil(Number(retryAfter))) : null;
    this.code = code || null;
  }
}

export function isPackagePortalApiError(error) {
  return error instanceof PackagePortalApiError || error?.name === 'PackagePortalApiError';
}

function parseRetryAfter(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));

  const retryDate = new Date(value);
  if (Number.isNaN(retryDate.getTime())) return null;
  return Math.max(0, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
}

async function readJsonSafely(response) {
  let text = '';
  try {
    text = await response.text();
  } catch (_error) {
    return { payload: {}, isEmpty: true, isInvalid: true };
  }

  if (!text.trim()) return { payload: {}, isEmpty: true, isInvalid: false };

  try {
    const payload = JSON.parse(text);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { payload: {}, isEmpty: false, isInvalid: true };
    }
    return { payload, isEmpty: false, isInvalid: false };
  } catch (_error) {
    return { payload: {}, isEmpty: false, isInvalid: true };
  }
}

async function requestJson(url, options, fallbackMessage, { allowEmpty = false } = {}) {
  let response;
  try {
    response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new PackagePortalApiError(DEFAULT_SERVICE_ERROR, { status: 0, cause: error });
  }

  const parsed = await readJsonSafely(response);
  const payload = parsed.payload;
  if (!response.ok) {
    throw new PackagePortalApiError(
      typeof payload.error === 'string' && payload.error.trim() ? payload.error : fallbackMessage,
      {
        status: response.status,
        retryAfter: parseRetryAfter(response.headers.get('Retry-After')),
        code: typeof payload.code === 'string' ? payload.code : null
      }
    );
  }

  if (parsed.isInvalid || (parsed.isEmpty && !allowEmpty)) {
    throw new PackagePortalApiError(DEFAULT_SERVICE_ERROR, { status: 502, code: 'INVALID_JSON_RESPONSE' });
  }

  const sessionHeader = response.headers.get('X-Package-Session');
  if (
    payload && typeof payload === 'object' &&
    payload.sessionEstablished === undefined &&
    ['1', 'true', 'established'].includes(String(sessionHeader || '').toLowerCase())
  ) {
    return { ...payload, sessionEstablished: true };
  }

  return payload;
}

/**
 * Resolve reference/surname access. The endpoint may establish an HttpOnly cookie
 * and return `sessionEstablished: true`, or return a phase-one bearer token.
 */
export function resolvePackageAccess(reference, lastName, { signal } = {}) {
  return requestJson(ACCESS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reference, lastName }),
    signal
  }, DEFAULT_ACCESS_ERROR);
}

/**
 * Load current package data. Supplying `token` sends it in an Authorization header,
 * never in the URL. Omit it when an HttpOnly package session cookie exists.
 */
export function loadPackageData(token = null, { signal } = {}) {
  const headers = { Accept: 'application/json' };
  const credential = typeof token === 'string' ? token.trim() : '';
  if (credential) headers.Authorization = `Bearer ${credential}`;

  return requestJson(DATA_ENDPOINT, {
    method: 'GET',
    headers,
    signal
  }, DEFAULT_DATA_ERROR);
}

/**
 * Optional hardened flow: exchange a direct-route bearer token for an HttpOnly
 * session cookie. The backend may return an empty JSON object.
 */
export function exchangePackageSession(token, { signal, endpoint = SESSION_ENDPOINT } = {}) {
  const credential = typeof token === 'string' ? token.trim() : '';
  if (!credential) {
    return Promise.reject(new PackagePortalApiError('Invalid package access token.', { status: 400 }));
  }

  return requestJson(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${credential}`
    },
    signal
  }, DEFAULT_DATA_ERROR);
}

/** Clear the optional HttpOnly package session cookie on logout. */
export function logoutPackageSession({ signal, endpoint = SESSION_ENDPOINT } = {}) {
  return requestJson(endpoint, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    signal
  }, DEFAULT_SERVICE_ERROR, { allowEmpty: true });
}
