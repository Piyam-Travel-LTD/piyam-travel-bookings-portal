import {
  parseJsonBody,
  rejectMethod,
  sendError,
  setPrivateJsonHeaders
} from '../server/http.js';
import { resolvePackageAccess } from '../server/package-access-resolver.js';
import {
  clearPackageSessionCookie,
  setPackageSessionCookie
} from '../server/package-session.js';

export function createPackageAccessHandler({
  resolver = resolvePackageAccess,
  env = process.env
} = {}) {
  return async function handler(req, res) {
    setPrivateJsonHeaders(res);
    if (req.method !== 'POST') return rejectMethod(res, 'POST');

    try {
      const body = parseJsonBody(req);
      const reference = body.reference ?? body.referenceNumber ?? body.referenceNumberInput;
      const lastName = body.lastName ?? body.surname;
      const result = await resolver(reference, lastName);

      if (result.source === 'pt_portal') {
        const sessionEstablished = setPackageSessionCookie(res, result.token, { env });
        const response = {
          source: 'pt_portal',
          sessionEstablished
        };
        if (!sessionEstablished) response.token = result.token;
        return res.status(200).json(response);
      }

      clearPackageSessionCookie(res);
      return res.status(200).json({
        source: 'legacy_firebase',
        customer: result.customer
      });
    } catch (error) {
      return sendError(res, error);
    }
  };
}

export default createPackageAccessHandler();
