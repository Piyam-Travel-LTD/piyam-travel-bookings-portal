import {
  HttpError,
  parseJsonBody,
  readBearerToken,
  rejectMethod,
  sendError,
  setPrivateJsonHeaders
} from '../server/http.js';
import {
  createPackagePortalClient,
  requirePackageToken
} from '../server/package-portal.js';
import { readPackageSession } from '../server/package-session.js';

function resolveExtensionCredential(req, env) {
  const bearerValue = readBearerToken(req);
  if (bearerValue != null) {
    return { rawToken: requirePackageToken(bearerValue) };
  }

  const session = readPackageSession(req, { env });
  if (session) return { rawToken: session.token };

  const body = parseJsonBody(req);
  return {
    rawReference: body.reference,
    rawLastName: body.lastName ?? body.last_name
  };
}

export function createPackageExtensionRequestHandler({
  portalClientFactory = () => createPackagePortalClient(),
  env = process.env
} = {}) {
  return async function handler(req, res) {
    setPrivateJsonHeaders(res);
    if (req.method !== 'POST') return rejectMethod(res, 'POST');

    try {
      const credential = resolveExtensionCredential(req, env);
      const result = await portalClientFactory().requestAccessExtension(credential);
      return res.status(202).json(result);
    } catch (error) {
      if (error instanceof HttpError) return sendError(res, error);
      return sendError(res, error, 503);
    }
  };
}

export default createPackageExtensionRequestHandler();
