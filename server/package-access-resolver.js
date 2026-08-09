import { HttpError } from './http.js';
import {
  ACCESS_MESSAGES,
  createPackagePortalClient,
  normalizeLastName,
  normalizePackageReference
} from './package-portal.js';
import { lookupLegacyCustomer } from './legacy-customer.js';

export function createPackageAccessResolver({
  portalClientFactory = () => createPackagePortalClient(),
  legacyLookup = lookupLegacyCustomer
} = {}) {
  return async function resolvePackageAccess(rawReference, rawLastName) {
    const reference = normalizePackageReference(rawReference);
    const lastName = normalizeLastName(rawLastName);
    if (!reference || !lastName) {
      throw new HttpError(400, 'Reference number and last name are required in the expected format.', {
        code: 'INVALID_ACCESS_INPUT'
      });
    }

    const portalClient = portalClientFactory();
    const ptResult = await portalClient.accessPackage(reference, lastName);
    if (ptResult.found) {
      return {
        source: 'pt_portal',
        reference,
        token: ptResult.token,
        customer: null
      };
    }

    // Firestore is deliberately touched only after a valid JSON 404 from PT-Portal.
    const customer = await legacyLookup(reference, lastName);
    if (!customer) {
      throw new HttpError(404, ACCESS_MESSAGES.invalid, { code: 'PACKAGE_NOT_FOUND' });
    }

    return {
      source: 'legacy_firebase',
      reference,
      token: null,
      customer
    };
  };
}

export const resolvePackageAccess = createPackageAccessResolver();
