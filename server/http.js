const DEFAULT_BODY_LIMIT_BYTES = 8 * 1024;

export class HttpError extends Error {
  constructor(status, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'HttpError';
    this.status = status;
    this.retryAfter = options.retryAfter || null;
    this.code = options.code || null;
  }
}

export function setPrivateJsonHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Vary', 'Authorization, Cookie');
}

export function rejectMethod(res, allowedMethods) {
  const methods = Array.isArray(allowedMethods) ? allowedMethods : [allowedMethods];
  res.setHeader('Allow', methods.join(', '));
  return res.status(405).json({ error: 'Method Not Allowed' });
}

export function parseJsonBody(req, maxBytes = DEFAULT_BODY_LIMIT_BYTES) {
  const body = req?.body;

  if (body && typeof body === 'object' && !Array.isArray(body) && !Buffer.isBuffer(body)) {
    let serialized;
    try {
      serialized = JSON.stringify(body);
    } catch (error) {
      throw new HttpError(400, 'The request body must be valid JSON.', { cause: error });
    }
    if (Buffer.byteLength(serialized, 'utf8') > maxBytes) {
      throw new HttpError(413, 'The request body is too large.');
    }
    return body;
  }

  let text = '';
  if (typeof body === 'string') {
    text = body;
  } else if (Buffer.isBuffer(body)) {
    text = body.toString('utf8');
  } else if (body == null || body === '') {
    return {};
  } else {
    throw new HttpError(400, 'The request body must be a JSON object.');
  }

  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    throw new HttpError(413, 'The request body is too large.');
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('JSON body is not an object');
    }
    return parsed;
  } catch (error) {
    throw new HttpError(400, 'The request body must be valid JSON.', { cause: error });
  }
}

export function getSingleQueryValue(value) {
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      throw new HttpError(400, 'Invalid package access token.');
    }
    return value[0];
  }
  return value;
}

export function readBearerToken(req) {
  const header = req?.headers?.authorization;
  if (header == null || header === '') return null;
  if (Array.isArray(header) || typeof header !== 'string') {
    throw new HttpError(400, 'Invalid package access token.');
  }

  const match = header.match(/^Bearer[ \t]+([^ \t]+)$/i);
  if (!match) {
    throw new HttpError(400, 'Invalid package access token.');
  }
  return match[1];
}

export function sanitizeRetryAfter(value, now = Date.now()) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();

  if (/^\d{1,6}$/.test(trimmed)) {
    return String(Math.min(Math.max(Number(trimmed), 1), 86_400));
  }

  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp) || timestamp <= now || timestamp - now > 7 * 86_400_000) {
    return null;
  }
  return new Date(timestamp).toUTCString();
}

export function sendError(res, error, fallbackStatus = 500) {
  const isHttpError = error instanceof HttpError;
  const status = isHttpError ? error.status : fallbackStatus;
  const message = isHttpError
    ? error.message
    : 'The package service is temporarily unavailable. Please try again shortly.';

  if (isHttpError && error.retryAfter) {
    res.setHeader('Retry-After', error.retryAfter);
  }

  return res.status(status).json({ error: message });
}
