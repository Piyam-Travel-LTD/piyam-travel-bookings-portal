import {
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
  isPackageSessionConfigured,
  setPackageSessionCookie
} from '../server/package-session.js';

export function createPackageSessionHandler({
  portalClientFactory = () => createPackagePortalClient(),
  env = process.env
} = {}) {
  return async function handler(req, res) {
    setPrivateJsonHeaders(res);
    if (!['POST', 'DELETE'].includes(req.method)) {
      return rejectMethod(res, ['POST', 'DELETE']);
    }

    if (req.method === 'DELETE') {
      clearPackageSessionCookie(res);
      return res.status(200).json({ sessionEstablished: false });
    }

    try {
      if (!isPackageSessionConfigured(env)) {
        throw new HttpError(503, 'Secure package sessions are not configured.', {
          code: 'SESSION_NOT_CONFIGURED'
        });
      }

      const token = requirePackageToken(readBearerToken(req));
      const packageData = await portalClientFactory().loadPackage(token);
      setPackageSessionCookie(res, token, { env });
      return res.status(200).json({
        ...packageData,
        sessionEstablished: true
      });
    } catch (error) {
      return sendError(res, error);
    }
  };
}

export default createPackageSessionHandler();
