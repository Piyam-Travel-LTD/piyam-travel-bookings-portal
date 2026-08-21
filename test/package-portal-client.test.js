import assert from 'node:assert/strict';
import test from 'node:test';

import {
  exchangePackageSession,
  isPackagePortalApiError,
  loadPackageData,
  logoutPackageSession,
  PackagePortalApiError,
  requestPackageAccessExtension,
  resolvePackageAccess
} from '../src/services/packagePortalApi.js';
import { jsonResponse, withMockedFetch } from './helpers.js';

const TOKEN = 'opaque-token-123';

test('client posts reference access using same-origin no-store credentials', async () => {
  let captured;
  const result = await withMockedFetch(async (url, init) => {
    captured = { url, init };
    return jsonResponse({ source: 'pt_portal', token: TOKEN });
  }, () => resolvePackageAccess('PT-H29GPX', 'Smith'));

  assert.deepEqual(result, { source: 'pt_portal', token: TOKEN });
  assert.equal(captured.url, '/api/package-access');
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.credentials, 'same-origin');
  assert.equal(captured.init.cache, 'no-store');
  assert.deepEqual(JSON.parse(captured.init.body), { reference: 'PT-H29GPX', lastName: 'Smith' });
});

test('client sends package tokens only in Authorization, never in the URL', async () => {
  let captured;
  const result = await withMockedFetch(async (url, init) => {
    captured = { url, init };
    return jsonResponse({ package: { package_reference: 'PT-H29GPX' }, documents: [] });
  }, () => loadPackageData(`  ${TOKEN}  `));

  assert.equal(captured.url, '/api/package-data');
  assert.equal(captured.url.includes(TOKEN), false);
  assert.equal(captured.init.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(captured.init.credentials, 'same-origin');
  assert.equal(result.package.package_reference, 'PT-H29GPX');
});

test('client sends extension requests through same-origin credentials', async () => {
  const calls = [];
  await withMockedFetch(async (url, init) => {
    calls.push({ url, init });
    return jsonResponse({ requested: true, alreadyRequested: false }, { status: 202 });
  }, async () => {
    await requestPackageAccessExtension({ token: TOKEN });
    await requestPackageAccessExtension({ reference: 'H29GPX', lastName: 'Smith' });
  });

  assert.equal(calls[0].url, '/api/package-extension-request');
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(calls[0].url.includes(TOKEN), false);
  assert.deepEqual(JSON.parse(calls[0].init.body), {});
  assert.equal(calls[0].init.credentials, 'same-origin');

  assert.equal(calls[1].init.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    reference: 'H29GPX',
    lastName: 'Smith'
  });
});

test('client surfaces typed API errors with numeric Retry-After and server code', async () => {
  await withMockedFetch(
    async () => jsonResponse(
      { error: 'Too many attempts. Please wait before trying again.', code: 'ACCESS_THROTTLED' },
      { status: 429, headers: { 'Retry-After': '12.2' } }
    ),
    async () => {
      await assert.rejects(resolvePackageAccess('PT-H29GPX', 'Smith'), error => {
        assert.ok(error instanceof PackagePortalApiError);
        assert.equal(isPackagePortalApiError(error), true);
        assert.equal(error.status, 429);
        assert.equal(error.retryAfter, 13);
        assert.equal(error.code, 'ACCESS_THROTTLED');
        assert.match(error.message, /Too many attempts/);
        return true;
      });
    }
  );
});

test('successful HTML or malformed JSON is a typed invalid-response failure', async () => {
  for (const body of ['<html>proxy page</html>', '[]', 'null', '']) {
    await withMockedFetch(
      async () => new Response(body, { status: 200, headers: { 'Content-Type': 'text/html' } }),
      async () => {
        await assert.rejects(loadPackageData(TOKEN), error => {
          assert.ok(error instanceof PackagePortalApiError);
          assert.equal(error.status, 502);
          assert.equal(error.code, 'INVALID_JSON_RESPONSE');
          return true;
        });
      }
    );
  }
});

test('network errors become typed service failures while AbortError remains abortable', async () => {
  const networkFailure = new TypeError('network down');
  await withMockedFetch(async () => { throw networkFailure; }, async () => {
    await assert.rejects(loadPackageData(TOKEN), error => {
      assert.ok(error instanceof PackagePortalApiError);
      assert.equal(error.status, 0);
      assert.equal(error.cause, networkFailure);
      return true;
    });
  });

  const aborted = new DOMException('cancelled', 'AbortError');
  await withMockedFetch(async () => { throw aborted; }, async () => {
    await assert.rejects(loadPackageData(TOKEN), error => error === aborted);
  });
});

test('session exchange and logout keep credentials in same-origin headers', async () => {
  const calls = [];
  await withMockedFetch(async (url, init) => {
    calls.push({ url, init });
    if (init.method === 'DELETE') return new Response('', { status: 200 });
    return jsonResponse({ sessionEstablished: true });
  }, async () => {
    assert.deepEqual(await exchangePackageSession(TOKEN), { sessionEstablished: true });
    assert.deepEqual(await logoutPackageSession(), {});
  });

  assert.equal(calls[0].url, '/api/package-session');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(calls[1].url, '/api/package-session');
  assert.equal(calls[1].init.method, 'DELETE');
});

test('session-established response header is normalized for phased server rollout', async () => {
  const result = await withMockedFetch(
    async () => jsonResponse(
      { source: 'pt_portal' },
      { headers: { 'X-Package-Session': 'established' } }
    ),
    () => resolvePackageAccess('PT-H29GPX', 'Smith')
  );

  assert.deepEqual(result, { source: 'pt_portal', sessionEstablished: true });
});

test('blank session tokens reject locally without issuing a request', async () => {
  let fetchCalls = 0;
  await withMockedFetch(async () => { fetchCalls += 1; }, async () => {
    await assert.rejects(exchangePackageSession('  '), error => {
      assert.ok(error instanceof PackagePortalApiError);
      assert.equal(error.status, 400);
      return true;
    });
  });
  assert.equal(fetchCalls, 0);
});
