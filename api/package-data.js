import {
  getSingleQueryValue,
  HttpError,
  readBearerToken,
  rejectMethod,
  sendError,
  setPrivateJsonHeaders
} from '../server/http.js';
import {
  createPackagePortalClient,
  requirePackageToken
} from '../server/package-portal.js';
import {
  clearPackageSessionCookie,
  PACKAGE_SESSION_COOKIE,
  parseCookies,
  readPackageSession,
  setPackageSessionCookie
} from '../server/package-session.js';

function resolveRequestToken(req, env) {
  const bearerValue = readBearerToken(req);
  const queryValue = getSingleQueryValue(
    req.query?.token ?? req.query?.reference ?? req.params?.token
  );
  const bearerToken = bearerValue == null ? null : requirePackageToken(bearerValue);
  const queryToken = queryValue == null || queryValue === ''
    ? null
    : requirePackageToken(queryValue);

  if (bearerToken && queryToken && bearerToken !== queryToken) {
    throw new HttpError(400, 'Conflicting package access tokens were supplied.', {
      code: 'CONFLICTING_TOKENS'
    });
  }
  if (bearerToken) return { token: bearerToken, source: 'bearer' };
  if (queryToken) return { token: queryToken, source: 'query' };

  const session = readPackageSession(req, { env });
  if (session) return { token: session.token, source: 'cookie' };
  const cookies = parseCookies(req?.headers?.cookie);
  throw new HttpError(400, 'Invalid package access token.', {
    code: cookies[PACKAGE_SESSION_COOKIE] ? 'INVALID_SESSION' : 'MISSING_TOKEN'
  });
}

export function createPackageDataHandler({
  portalClientFactory = () => createPackagePortalClient(),
  env = process.env
} = {}) {
  return async function handler(req, res) {
    setPrivateJsonHeaders(res);
    if (req.method !== 'GET') return rejectMethod(res, 'GET');

    let tokenSource = null;
    try {
      const resolved = resolveRequestToken(req, env);
      tokenSource = resolved.source;
      if (tokenSource === 'query') {
        res.setHeader('Deprecation', 'true');
      }

      const packageData = await portalClientFactory().loadPackage(resolved.token);
      let sessionEstablished = tokenSource === 'cookie';
      if (tokenSource === 'bearer') {
        sessionEstablished = setPackageSessionCookie(res, resolved.token, { env });
      }

      return res.status(200).json({
        ...packageData,
        sessionEstablished
      });
    } catch (error) {
      if (
        (tokenSource === 'cookie' && [400, 404, 410].includes(error?.status)) ||
        error?.code === 'INVALID_SESSION'
      ) {
        clearPackageSessionCookie(res);
      }
      return sendError(res, error);
    }
  };
}

export { resolveRequestToken };
export default createPackageDataHandler();
