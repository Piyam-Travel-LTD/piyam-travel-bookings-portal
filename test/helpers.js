import assert from 'node:assert/strict';

export const SESSION_ENV = Object.freeze({
  PACKAGE_PORTAL_SESSION_SECRET: 'test-only-session-secret-that-is-at-least-32-characters'
});

export function jsonResponse(payload, init = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(payload), { ...init, headers });
}

export function createMockResponse() {
  const headers = new Map();

  return {
    statusCode: null,
    body: undefined,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

export async function withMockedFetch(fetchImpl, operation) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    return await operation();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

export function assertHttpError(error, { status, code, retryAfter } = {}) {
  assert.equal(error?.name, 'HttpError');
  if (status !== undefined) assert.equal(error.status, status);
  if (code !== undefined) assert.equal(error.code, code);
  if (retryAfter !== undefined) assert.equal(error.retryAfter, retryAfter);
  return true;
}
