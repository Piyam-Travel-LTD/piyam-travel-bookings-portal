import assert from 'node:assert/strict';
import test from 'node:test';

import { HttpError } from '../server/http.js';
import {
  createPackagePortalClient,
  isValidPackageToken,
  normalizeLastName,
  normalizePackageReference,
  parseRequestTimeout,
  requirePackageToken,
  resolvePtPortalBaseUrl,
  sanitizeJsonValue,
  sanitizePackagePayload,
  sanitizePublicUrl
} from '../server/package-portal.js';
import { assertHttpError, jsonResponse } from './helpers.js';

const PORTAL_ENV = Object.freeze({
  PT_PORTAL_BASE_URL: 'https://portal.example.test/internal/root',
  PT_PORTAL_REQUEST_TIMEOUT_MS: '5000'
});

test('package references normalize only the exact six-character contract', () => {
  for (const [input, expected] of [
    ['H29GPX', 'PT-H29GPX'],
    ['PT-H29GPX', 'PT-H29GPX'],
    [' pt-h29gpx ', 'PT-H29GPX'],
    ['000000', 'PT-000000']
  ]) {
    assert.equal(normalizePackageReference(input), expected);
  }

  for (const input of [null, 123456, '', 'H29GP', 'H29GPXX', 'PT-PT-H29GPX', 'PT-H29G X', 'PT-H29GP/']) {
    assert.equal(normalizePackageReference(input), null);
  }
});

test('surname normalization trims human names but rejects blank, control, and oversized input', () => {
  assert.equal(normalizeLastName("  O'Connor-Smith  "), "O'Connor-Smith");
  assert.equal(normalizeLastName('Çelik'), 'Çelik');
  assert.equal(normalizeLastName(''), null);
  assert.equal(normalizeLastName('Smith\nInjected'), null);
  assert.equal(normalizeLastName('x'.repeat(121)), null);
  assert.equal(normalizeLastName({}), null);
});

test('package tokens use a bounded URL-safe opaque format', () => {
  for (const token of ['abcdEF12', 'opaque_token.with~marks-123', 'x'.repeat(512)]) {
    assert.equal(isValidPackageToken(token), true);
    assert.equal(requirePackageToken(` ${token} `), token);
  }

  for (const token of ['', '1234567', 'x'.repeat(513), 'token/with/slash', 'token with space', 'token?query', null]) {
    assert.equal(isValidPackageToken(token), false);
    assert.throws(
      () => requirePackageToken(token),
      error => assertHttpError(error, { status: 400, code: 'INVALID_TOKEN' })
    );
  }
});

test('request timeouts default and clamp to one through thirty seconds', () => {
  assert.equal(parseRequestTimeout(undefined), 10_000);
  assert.equal(parseRequestTimeout(''), 10_000);
  assert.equal(parseRequestTimeout('not-a-number'), 10_000);
  assert.equal(parseRequestTimeout('-1'), 10_000);
  assert.equal(parseRequestTimeout('1'), 1_000);
  assert.equal(parseRequestTimeout('1999.9'), 1_999);
  assert.equal(parseRequestTimeout('5000'), 5_000);
  assert.equal(parseRequestTimeout('999999'), 30_000);
});

test('PT-Portal base URLs require HTTPS except for explicit loopback development', () => {
  assert.equal(resolvePtPortalBaseUrl('https://portal.example.test').href, 'https://portal.example.test/');
  assert.equal(resolvePtPortalBaseUrl(' https://portal.example.test/base/// ').href, 'https://portal.example.test/base/');
  assert.equal(resolvePtPortalBaseUrl('http://localhost:3000/api').href, 'http://localhost:3000/api/');
  assert.equal(resolvePtPortalBaseUrl('http://127.0.0.1:3000').href, 'http://127.0.0.1:3000/');

  for (const value of [
    undefined,
    '',
    'not a URL',
    'http://portal.example.test',
    'ftp://portal.example.test',
    'https://user:pass@portal.example.test',
    'https://portal.example.test/?query=yes',
    'https://portal.example.test/#fragment'
  ]) {
    assert.throws(
      () => resolvePtPortalBaseUrl(value),
      error => assertHttpError(error, { status: 503, code: 'INVALID_BASE_URL' })
    );
  }
});

test('public URL and JSON sanitizers reject unsafe URLs and internal finance data', () => {
  assert.equal(sanitizePublicUrl('https://files.example.test/doc.pdf'), 'https://files.example.test/doc.pdf');
  assert.equal(sanitizePublicUrl('http://files.example.test/doc.pdf'), null);
  assert.equal(sanitizePublicUrl('http://localhost:3000/doc.pdf'), 'http://localhost:3000/doc.pdf');
  assert.equal(sanitizePublicUrl('javascript:alert(1)'), null);
  assert.equal(sanitizePublicUrl('https://user:pass@files.example.test/doc.pdf'), null);

  const safe = sanitizeJsonValue({
    greeting: 'Welcome',
    nested: { seat: '12A', supplierCost: 75, commission_amount: 20 },
    internal_notes: 'never public',
    margin: 12,
    hiddenChild: { hidden: true, value: 'never public either' }
  });

  assert.deepEqual(safe, {
    greeting: 'Welcome',
    nested: { seat: '12A' },
    hiddenChild: null
  });
});

test('package payload sanitizer accepts released docs with omitted redundant flags and strips private fields', () => {
  const sanitized = sanitizePackagePayload({
    package: {
      id: 'pkg-1',
      package_reference: 'h29gpx',
      customer_name: 'Ada Traveller',
      customer_email: 'ada@example.test',
      commission: 500,
      current_public_summary: {
        welcome: 'Your trip is ready',
        supplier_cost: 900,
        nested: { destinationTip: 'Pack light', profitMargin: 40 }
      }
    },
    documents: [
      {
        id: 'flight-1',
        category: 'flight',
        title: 'Flight ticket',
        signed_url: 'https://files.example.test/ticket.pdf',
        metadata: { seat: '12A', supplierCost: 400, internal_notes: 'private' }
      },
      {
        id: 'travel-docs',
        category: 'Travel Documents',
        title: 'Internal bundle',
        signed_url: 'https://files.example.test/internal.pdf'
      },
      {
        id: 'draft-doc',
        category: 'hotel',
        title: 'Draft hotel',
        status: 'draft',
        signed_url: 'https://files.example.test/draft.pdf'
      },
      {
        id: 'hidden-doc',
        category: 'visa',
        title: 'Hidden visa',
        customer_visible: false,
        signed_url: 'https://files.example.test/hidden.pdf'
      }
    ],
    releasedInvoice: {
      invoice_number: 'INV-7',
      total: 1_200,
      supplier_cost: 750,
      internal_notes: 'private invoice note',
      lines: [{ description: 'Package', sold_amount: 1_200, net_cost: 750 }]
    },
    transportVoucher: {
      voucher_number: 'TV-8',
      public_notes: 'Meet at arrivals',
      supplierAllocation: 'private supplier',
      booked_cost: 80
    },
    signedUrlExpiresIn: 100_000
  });

  assert.equal(sanitized.package.package_reference, 'PT-H29GPX');
  assert.deepEqual(sanitized.package.current_public_summary, {
    welcome: 'Your trip is ready',
    nested: { destinationTip: 'Pack light' }
  });
  assert.equal(sanitized.documents.length, 1);
  assert.equal(sanitized.documents[0].id, 'flight-1');
  assert.equal(sanitized.documents[0].status, 'released');
  assert.equal(sanitized.documents[0].customer_visible, true);
  assert.equal(sanitized.documents[0].metadata, undefined);
  assert.equal(sanitized.releasedInvoice.supplier_cost, undefined);
  assert.equal(sanitized.releasedInvoice.internal_notes, undefined);
  assert.equal(sanitized.releasedInvoice.lines[0].net_cost, undefined);
  assert.equal(sanitized.transportVoucher.supplierAllocation, undefined);
  assert.equal(sanitized.transportVoucher.booked_cost, undefined);
  assert.equal(sanitized.signedUrlExpiresIn, 86_400);
  assert.doesNotMatch(JSON.stringify(sanitized), /private|supplier cost/i);
});

test('package payload sanitizer fails closed on malformed required structure', () => {
  for (const payload of [null, {}, { package: {}, documents: [] }, { package: { package_reference: 'H29GPX' }, documents: [] }]) {
    assert.throws(
      () => sanitizePackagePayload(payload),
      error => assertHttpError(error, { status: 503, code: 'INVALID_UPSTREAM_PAYLOAD' })
    );
  }
});

test('PT access client accepts a valid token and sends only normalized request data', async () => {
  let captured;
  const client = createPackagePortalClient({
    env: PORTAL_ENV,
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return jsonResponse({ token: 'opaque-token-123' }, { status: 200 });
    }
  });

  assert.deepEqual(await client.accessPackage('PT-H29GPX', "O'Connor"), {
    found: true,
    token: 'opaque-token-123'
  });
  assert.equal(captured.url.href, 'https://portal.example.test/internal/root/api/package-portal/access');
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.redirect, 'error');
  assert.deepEqual(JSON.parse(captured.init.body), { reference: 'PT-H29GPX', lastName: "O'Connor" });
  assert.ok(captured.init.signal instanceof AbortSignal);
});

test('only a valid JSON upstream 404 is represented as a fallback candidate', async () => {
  const valid404Client = createPackagePortalClient({
    env: PORTAL_ENV,
    fetchImpl: async () => jsonResponse({ error: 'not found' }, { status: 404 })
  });
  assert.deepEqual(await valid404Client.accessPackage('PT-H29GPX', 'Smith'), {
    found: false,
    token: null
  });

  const html404Client = createPackagePortalClient({
    env: PORTAL_ENV,
    fetchImpl: async () => new Response('<html>not found</html>', { status: 404 })
  });
  await assert.rejects(
    html404Client.accessPackage('PT-H29GPX', 'Smith'),
    error => assertHttpError(error, { status: 503, code: 'NON_JSON_UPSTREAM_404' })
  );
});

test('PT access status mapping preserves customer-safe errors and sanitized Retry-After', async () => {
  const cases = [
    [400, 'UPSTREAM_VALIDATION', 400],
    [410, 'ACCESS_EXPIRED', 410],
    [429, 'ACCESS_THROTTLED', 429],
    [500, 'UPSTREAM_ACCESS_ERROR', 503]
  ];

  for (const [upstreamStatus, code, publicStatus] of cases) {
    const client = createPackagePortalClient({
      env: PORTAL_ENV,
      fetchImpl: async () => jsonResponse(
        { error: 'upstream detail must not leak' },
        { status: upstreamStatus, headers: { 'Retry-After': upstreamStatus === 429 ? '9999999' : 'ignored' } }
      )
    });

    await assert.rejects(
      client.accessPackage('PT-H29GPX', 'Smith'),
      error => {
        assertHttpError(error, { status: publicStatus, code });
        if (upstreamStatus === 429) assert.equal(error.retryAfter, null);
        assert.doesNotMatch(error.message, /upstream detail/);
        return true;
      }
    );
  }

  const throttledClient = createPackagePortalClient({
    env: PORTAL_ENV,
    fetchImpl: async () => jsonResponse({}, { status: 429, headers: { 'Retry-After': '120' } })
  });
  await assert.rejects(
    throttledClient.accessPackage('PT-H29GPX', 'Smith'),
    error => assertHttpError(error, { status: 429, code: 'ACCESS_THROTTLED', retryAfter: '120' })
  );
});

test('malformed successful PT responses fail closed for access and package data', async () => {
  for (const body of ['<html>gateway page</html>', JSON.stringify({}), JSON.stringify({ token: 'short' })]) {
    const client = createPackagePortalClient({
      env: PORTAL_ENV,
      fetchImpl: async () => new Response(body, { status: 200 })
    });
    await assert.rejects(
      client.accessPackage('PT-H29GPX', 'Smith'),
      error => assertHttpError(error, { status: 503, code: 'INVALID_UPSTREAM_TOKEN' })
    );
  }

  const dataClient = createPackagePortalClient({
    env: PORTAL_ENV,
    fetchImpl: async () => new Response('<html>success?</html>', { status: 200 })
  });
  await assert.rejects(
    dataClient.loadPackage('opaque-token-123'),
    error => assertHttpError(error, { status: 503, code: 'INVALID_UPSTREAM_PAYLOAD' })
  );
});

test('transport failures are wrapped without exposing network details', async () => {
  const client = createPackagePortalClient({
    env: PORTAL_ENV,
    fetchImpl: async () => {
      throw new TypeError('getaddrinfo ENOTFOUND secret.internal');
    }
  });

  await assert.rejects(
    client.accessPackage('PT-H29GPX', 'Smith'),
    error => {
      assert.ok(error instanceof HttpError);
      assertHttpError(error, { status: 503, code: 'UPSTREAM_UNAVAILABLE' });
      assert.doesNotMatch(error.message, /secret\.internal/);
      return true;
    }
  );
});
