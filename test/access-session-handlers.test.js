import assert from 'node:assert/strict';
import test from 'node:test';

import { createPackageAccessHandler } from '../api/package-access.js';
import { createPackageDataHandler, resolveRequestToken } from '../api/package-data.js';
import { createPackageExtensionRequestHandler } from '../api/package-extension-request.js';
import { createPackageSessionHandler } from '../api/package-session.js';
import { HttpError } from '../server/http.js';
import { createPackageAccessResolver } from '../server/package-access-resolver.js';
import {
  clearPackageSessionCookie,
  decryptPackageSession,
  encryptPackageSession,
  isPackageSessionConfigured,
  PACKAGE_SESSION_COOKIE,
  parseCookies,
  setPackageSessionCookie
} from '../server/package-session.js';
import { createMockResponse, SESSION_ENV } from './helpers.js';

const TOKEN = 'opaque-token-123';

test('access resolver never touches legacy storage when PT-Portal succeeds', async () => {
  let legacyCalls = 0;
  const resolve = createPackageAccessResolver({
    portalClientFactory: () => ({
      accessPackage: async (reference, lastName) => {
        assert.equal(reference, 'PT-H29GPX');
        assert.equal(lastName, 'Smith');
        return { found: true, token: TOKEN };
      }
    }),
    legacyLookup: async () => {
      legacyCalls += 1;
      return null;
    }
  });

  assert.deepEqual(await resolve('h29gpx', ' Smith '), {
    source: 'pt_portal',
    reference: 'PT-H29GPX',
    token: TOKEN,
    customer: null
  });
  assert.equal(legacyCalls, 0);
});

test('access resolver performs legacy fallback only for PT not-found result', async () => {
  const customer = { id: 'legacy-1', referenceNumber: 'PT-H29GPX' };
  const calls = [];
  const resolve = createPackageAccessResolver({
    portalClientFactory: () => ({ accessPackage: async () => ({ found: false, token: null }) }),
    legacyLookup: async (...args) => {
      calls.push(args);
      return customer;
    }
  });

  assert.deepEqual(await resolve('PT-H29GPX', 'Smith'), {
    source: 'legacy_firebase',
    reference: 'PT-H29GPX',
    token: null,
    customer
  });
  assert.deepEqual(calls, [['PT-H29GPX', 'Smith']]);
});

test('access resolver does not downgrade PT errors to legacy lookups', async () => {
  for (const status of [400, 410, 429, 503, 504]) {
    let legacyCalls = 0;
    const expected = new HttpError(status, 'PT failure');
    const resolve = createPackageAccessResolver({
      portalClientFactory: () => ({ accessPackage: async () => { throw expected; } }),
      legacyLookup: async () => {
        legacyCalls += 1;
        return { id: 'must-not-load' };
      }
    });

    await assert.rejects(resolve('PT-H29GPX', 'Smith'), error => error === expected);
    assert.equal(legacyCalls, 0);
  }
});

test('invalid access input is rejected before either data source is created', async () => {
  let portalFactoryCalls = 0;
  let legacyCalls = 0;
  const resolve = createPackageAccessResolver({
    portalClientFactory: () => {
      portalFactoryCalls += 1;
      return { accessPackage: async () => ({ found: false }) };
    },
    legacyLookup: async () => { legacyCalls += 1; }
  });

  await assert.rejects(resolve('bad', ''), error => error.status === 400 && error.code === 'INVALID_ACCESS_INPUT');
  assert.equal(portalFactoryCalls, 0);
  assert.equal(legacyCalls, 0);
});

test('secure package sessions round-trip and reject expiration or tampering', () => {
  const now = Date.parse('2026-08-08T12:00:00Z');
  assert.equal(isPackageSessionConfigured({}), false);
  assert.equal(isPackageSessionConfigured(SESSION_ENV), true);

  const encrypted = encryptPackageSession(TOKEN, { env: SESSION_ENV, now, ttlSeconds: 300 });
  assert.deepEqual(decryptPackageSession(encrypted, { env: SESSION_ENV, now: now + 1_000 }), {
    token: TOKEN,
    expiresAt: now + 300_000
  });
  assert.equal(decryptPackageSession(encrypted, { env: SESSION_ENV, now: now + 300_000 }), null);
  const tamperedParts = encrypted.split('.');
  tamperedParts[2] = `${tamperedParts[2][0] === 'A' ? 'B' : 'A'}${tamperedParts[2].slice(1)}`;
  assert.equal(decryptPackageSession(tamperedParts.join('.'), { env: SESSION_ENV, now }), null);
  assert.equal(decryptPackageSession(encrypted, { env: { PACKAGE_PORTAL_SESSION_SECRET: `${SESSION_ENV.PACKAGE_PORTAL_SESSION_SECRET}x` }, now }), null);
});

test('cookie helpers use the secure __Host contract and preserve existing cookies', () => {
  assert.deepEqual({ ...parseCookies('first=one; duplicate=old; duplicate=new; encoded=a.b-c_d') }, {
    first: 'one',
    duplicate: 'old',
    encoded: 'a.b-c_d'
  });
  assert.deepEqual({ ...parseCookies(null) }, {});

  const res = createMockResponse();
  res.setHeader('Set-Cookie', 'existing=value');
  assert.equal(setPackageSessionCookie(res, TOKEN, { env: SESSION_ENV, ttlSeconds: 300 }), true);
  clearPackageSessionCookie(res);

  const cookies = res.getHeader('Set-Cookie');
  assert.equal(Array.isArray(cookies), true);
  assert.equal(cookies.length, 3);
  assert.match(cookies[1], new RegExp(`^${PACKAGE_SESSION_COOKIE}=`));
  assert.match(cookies[1], /Path=\/; Max-Age=300; HttpOnly; Secure; SameSite=Lax/);
  assert.match(cookies[2], new RegExp(`^${PACKAGE_SESSION_COOKIE}=;`));
  assert.match(cookies[2], /Max-Age=0/);
});

test('access handler returns a bearer token only when encrypted sessions are unavailable', async () => {
  const resolver = async () => ({ source: 'pt_portal', token: TOKEN });

  const withoutSession = createMockResponse();
  await createPackageAccessHandler({ resolver, env: {} })(
    { method: 'POST', body: { reference: 'H29GPX', lastName: 'Smith' } },
    withoutSession
  );
  assert.equal(withoutSession.statusCode, 200);
  assert.deepEqual(withoutSession.body, {
    source: 'pt_portal',
    sessionEstablished: false,
    token: TOKEN
  });
  assert.equal(withoutSession.getHeader('Set-Cookie'), undefined);

  const withSession = createMockResponse();
  await createPackageAccessHandler({ resolver, env: SESSION_ENV })(
    { method: 'POST', body: { reference: 'H29GPX', lastName: 'Smith' } },
    withSession
  );
  assert.equal(withSession.statusCode, 200);
  assert.deepEqual(withSession.body, { source: 'pt_portal', sessionEstablished: true });
  assert.match(withSession.getHeader('Set-Cookie'), new RegExp(`^${PACKAGE_SESSION_COOKIE}=`));
  assert.equal(withSession.body.token, undefined);
});

test('access handler clears stale package sessions for a legacy customer', async () => {
  const customer = { id: 'legacy-1' };
  const res = createMockResponse();
  await createPackageAccessHandler({
    resolver: async () => ({ source: 'legacy_firebase', customer }),
    env: SESSION_ENV
  })({ method: 'POST', body: { reference: 'H29GPX', lastName: 'Smith' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { source: 'legacy_firebase', customer });
  assert.match(res.getHeader('Set-Cookie'), /Max-Age=0/);
});

test('request token resolution enforces explicit token consistency and priority', () => {
  const session = encryptPackageSession('cookie-token-123', { env: SESSION_ENV });
  const cookieHeader = `${PACKAGE_SESSION_COOKIE}=${session}`;

  assert.deepEqual(resolveRequestToken({
    headers: { authorization: `Bearer ${TOKEN}`, cookie: cookieHeader },
    query: {}
  }, SESSION_ENV), { token: TOKEN, source: 'bearer' });

  assert.deepEqual(resolveRequestToken({
    headers: { cookie: cookieHeader },
    query: { token: 'query-token-123' }
  }, SESSION_ENV), { token: 'query-token-123', source: 'query' });

  assert.deepEqual(resolveRequestToken({ headers: { cookie: cookieHeader }, query: {} }, SESSION_ENV), {
    token: 'cookie-token-123',
    source: 'cookie'
  });

  assert.throws(
    () => resolveRequestToken({
      headers: { authorization: `Bearer ${TOKEN}` },
      query: { token: 'different-token-123' }
    }, SESSION_ENV),
    error => error.status === 400 && error.code === 'CONFLICTING_TOKENS'
  );
});

test('data handler supports deprecated query tokens without putting secrets in its response', async () => {
  const res = createMockResponse();
  let loadedToken;
  await createPackageDataHandler({
    env: {},
    portalClientFactory: () => ({
      loadPackage: async token => {
        loadedToken = token;
        return { package: { package_reference: 'PT-H29GPX' }, documents: [] };
      }
    })
  })({ method: 'GET', headers: {}, query: { token: TOKEN } }, res);

  assert.equal(loadedToken, TOKEN);
  assert.equal(res.statusCode, 200);
  assert.equal(res.getHeader('Deprecation'), 'true');
  assert.equal(res.body.sessionEstablished, false);
  assert.equal(JSON.stringify(res.body).includes(TOKEN), false);
});

test('data handler establishes a cookie from bearer auth and rejects conflicts', async () => {
  const handler = createPackageDataHandler({
    env: SESSION_ENV,
    portalClientFactory: () => ({ loadPackage: async () => ({ package: {}, documents: [] }) })
  });

  const success = createMockResponse();
  await handler({ method: 'GET', headers: { authorization: `Bearer ${TOKEN}` }, query: {} }, success);
  assert.equal(success.statusCode, 200);
  assert.equal(success.body.sessionEstablished, true);
  assert.match(success.getHeader('Set-Cookie'), new RegExp(`^${PACKAGE_SESSION_COOKIE}=`));

  const conflict = createMockResponse();
  await handler({
    method: 'GET',
    headers: { authorization: `Bearer ${TOKEN}` },
    query: { token: 'different-token-123' }
  }, conflict);
  assert.equal(conflict.statusCode, 400);
  assert.deepEqual(conflict.body, { error: 'Conflicting package access tokens were supplied.' });
});

test('session endpoint validates the token upstream before setting a cookie and DELETE clears it', async () => {
  let loadCalls = 0;
  const handler = createPackageSessionHandler({
    env: SESSION_ENV,
    portalClientFactory: () => ({
      loadPackage: async token => {
        loadCalls += 1;
        assert.equal(token, TOKEN);
        return { package: { package_reference: 'PT-H29GPX' }, documents: [] };
      }
    })
  });

  const post = createMockResponse();
  await handler({ method: 'POST', headers: { authorization: `Bearer ${TOKEN}` } }, post);
  assert.equal(post.statusCode, 200);
  assert.equal(post.body.sessionEstablished, true);
  assert.equal(loadCalls, 1);
  assert.match(post.getHeader('Set-Cookie'), new RegExp(`^${PACKAGE_SESSION_COOKIE}=`));

  const remove = createMockResponse();
  await handler({ method: 'DELETE', headers: {} }, remove);
  assert.equal(remove.statusCode, 200);
  assert.deepEqual(remove.body, { sessionEstablished: false });
  assert.match(remove.getHeader('Set-Cookie'), /Max-Age=0/);
  assert.equal(loadCalls, 1);
});

test('extension handler uses bearer, cookie, or reference credentials without echoing secrets', async () => {
  const calls = [];
  const handler = createPackageExtensionRequestHandler({
    env: SESSION_ENV,
    portalClientFactory: () => ({
      requestAccessExtension: async credential => {
        calls.push(credential);
        return { requested: true, alreadyRequested: calls.length > 1 };
      }
    })
  });

  const bearer = createMockResponse();
  await handler({
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}` },
    body: {}
  }, bearer);
  assert.equal(bearer.statusCode, 202);
  assert.deepEqual(calls[0], { rawToken: TOKEN });
  assert.equal(JSON.stringify(bearer.body).includes(TOKEN), false);

  const encrypted = encryptPackageSession('cookie-token-123', { env: SESSION_ENV });
  const cookie = createMockResponse();
  await handler({
    method: 'POST',
    headers: { cookie: `${PACKAGE_SESSION_COOKIE}=${encrypted}` },
    body: {}
  }, cookie);
  assert.deepEqual(calls[1], { rawToken: 'cookie-token-123' });

  const expiredLogin = createMockResponse();
  await handler({
    method: 'POST',
    headers: {},
    body: { reference: 'h29gpx', lastName: ' Smith ' }
  }, expiredLogin);
  assert.deepEqual(calls[2], { rawReference: 'h29gpx', rawLastName: ' Smith ' });
  assert.equal(expiredLogin.getHeader('Cache-Control').includes('no-store'), true);
});

test('handlers reject unsupported methods with an Allow header', async () => {
  for (const [handler, req, allowed] of [
    [createPackageAccessHandler({ resolver: async () => null }), { method: 'GET' }, 'POST'],
    [createPackageDataHandler({ portalClientFactory: () => ({}) }), { method: 'POST' }, 'GET'],
    [createPackageExtensionRequestHandler({ portalClientFactory: () => ({}) }), { method: 'GET' }, 'POST'],
    [createPackageSessionHandler({ portalClientFactory: () => ({}) }), { method: 'PATCH' }, 'POST, DELETE']
  ]) {
    const res = createMockResponse();
    await handler({ headers: {}, query: {}, ...req }, res);
    assert.equal(res.statusCode, 405);
    assert.equal(res.getHeader('Allow'), allowed);
  }
});
