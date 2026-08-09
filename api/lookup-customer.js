import {
  HttpError,
  parseJsonBody,
  rejectMethod,
  sendError,
  setPrivateJsonHeaders
} from '../server/http.js';
import { resolvePackageAccess } from '../server/package-access-resolver.js';

export function createLegacyLookupHandler({ resolver = resolvePackageAccess } = {}) {
  return async function handler(req, res) {
    setPrivateJsonHeaders(res);
    if (req.method !== 'POST') return rejectMethod(res, 'POST');

    try {
      const body = parseJsonBody(req);
      const reference = body.referenceNumber ?? body.reference ?? body.referenceNumberInput;
      const lastName = body.lastName ?? body.surname;
      const result = await resolver(reference, lastName);

      if (result.source === 'pt_portal') {
        throw new HttpError(
          410,
          'This package is managed in the current package portal. Refresh the page and sign in again.',
          { code: 'LEGACY_ENDPOINT_RETIRED' }
        );
      }

      // Preserve the legacy endpoint's raw customer response shape for old clients,
      // but only after PT-Portal has returned a genuine 404.
      return res.status(200).json(result.customer);
    } catch (error) {
      return sendError(res, error);
    }
  };
}

export default createLegacyLookupHandler();
