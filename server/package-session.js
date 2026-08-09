import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { HttpError } from './http.js';
import { isValidPackageToken } from './package-portal.js';

export const PACKAGE_SESSION_COOKIE = '__Host-piyam_package_session';
export const PACKAGE_SESSION_TTL_SECONDS = 60 * 60;
const SESSION_VERSION = 'v1';
const MINIMUM_SECRET_LENGTH = 32;
const MAXIMUM_COOKIE_VALUE_LENGTH = 4_096;

function normalizeSessionTtl(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return PACKAGE_SESSION_TTL_SECONDS;
  return Math.min(Math.max(Math.trunc(parsed), 60), 86_400);
}

function getSessionKey(env = process.env) {
  const secret = env.PACKAGE_PORTAL_SESSION_SECRET;
  if (
    typeof secret !== 'string' ||
    secret.trim().length < MINIMUM_SECRET_LENGTH ||
    Buffer.byteLength(secret, 'utf8') < MINIMUM_SECRET_LENGTH
  ) return null;
  return createHash('sha256')
    .update('piyam-bookings-package-session-v1\0', 'utf8')
    .update(secret, 'utf8')
    .digest();
}

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value, maximumBytes) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const decoded = Buffer.from(value, 'base64url');
    return decoded.length <= maximumBytes ? decoded : null;
  } catch (_error) {
    return null;
  }
}

export function isPackageSessionConfigured(env = process.env) {
  return Boolean(getSessionKey(env));
}

export function encryptPackageSession(token, {
  env = process.env,
  now = Date.now(),
  ttlSeconds = PACKAGE_SESSION_TTL_SECONDS
} = {}) {
  if (!isValidPackageToken(token)) {
    throw new HttpError(400, 'Invalid package access token.', { code: 'INVALID_TOKEN' });
  }

  const key = getSessionKey(env);
  if (!key) {
    throw new HttpError(503, 'Secure package sessions are not configured.', {
      code: 'SESSION_NOT_CONFIGURED'
    });
  }

  const boundedTtl = normalizeSessionTtl(ttlSeconds);
  const payload = Buffer.from(JSON.stringify({
    v: 1,
    token,
    exp: now + boundedTtl * 1_000
  }), 'utf8');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(SESSION_VERSION, 'utf8'));
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${SESSION_VERSION}.${toBase64Url(iv)}.${toBase64Url(encrypted)}.${toBase64Url(tag)}`;
}

export function decryptPackageSession(value, {
  env = process.env,
  now = Date.now()
} = {}) {
  if (typeof value !== 'string' || value.length > MAXIMUM_COOKIE_VALUE_LENGTH) return null;
  const key = getSessionKey(env);
  if (!key) return null;

  const parts = value.split('.');
  if (parts.length !== 4 || parts[0] !== SESSION_VERSION) return null;
  const iv = fromBase64Url(parts[1], 12);
  const encrypted = fromBase64Url(parts[2], 2_048);
  const tag = fromBase64Url(parts[3], 16);
  if (!iv || iv.length !== 12 || !encrypted || !encrypted.length || !tag || tag.length !== 16) {
    return null;
  }

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from(SESSION_VERSION, 'utf8'));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    if (plaintext.length > 2_048) return null;

    const payload = JSON.parse(plaintext.toString('utf8'));
    if (
      payload?.v !== 1 ||
      !isValidPackageToken(payload.token) ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= now ||
      payload.exp > now + (86_400 + 60) * 1_000
    ) {
      return null;
    }
    return { token: payload.token, expiresAt: payload.exp };
  } catch (_error) {
    return null;
  }
}

export function parseCookies(headerValue) {
  const cookies = Object.create(null);
  if (typeof headerValue !== 'string' || headerValue.length > 16_384) return cookies;

  for (const part of headerValue.split(';').slice(0, 100)) {
    const separator = part.indexOf('=');
    if (separator <= 0) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name && !Object.prototype.hasOwnProperty.call(cookies, name)) cookies[name] = value;
  }
  return cookies;
}

function appendSetCookie(res, cookie) {
  const existing = res.getHeader?.('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookie);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie]);
  } else {
    res.setHeader('Set-Cookie', [String(existing), cookie]);
  }
}

export function setPackageSessionCookie(res, token, {
  env = process.env,
  ttlSeconds = PACKAGE_SESSION_TTL_SECONDS
} = {}) {
  if (!isPackageSessionConfigured(env)) return false;
  const value = encryptPackageSession(token, { env, ttlSeconds });
  const boundedTtl = normalizeSessionTtl(ttlSeconds);
  appendSetCookie(
    res,
    `${PACKAGE_SESSION_COOKIE}=${value}; Path=/; Max-Age=${boundedTtl}; HttpOnly; Secure; SameSite=Lax`
  );
  return true;
}

export function clearPackageSessionCookie(res) {
  appendSetCookie(
    res,
    `${PACKAGE_SESSION_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`
  );
}

export function readPackageSession(req, { env = process.env } = {}) {
  const cookies = parseCookies(req?.headers?.cookie);
  return decryptPackageSession(cookies[PACKAGE_SESSION_COOKIE], { env });
}
