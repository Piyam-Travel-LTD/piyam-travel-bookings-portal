import { HttpError } from './http.js';
import { sanitizePublicUrl } from './package-portal.js';

let defaultDatabasePromise = null;

function requireFirebaseEnvironment(env) {
  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY;
  if (![projectId, clientEmail, privateKey].every((value) => typeof value === 'string' && value.trim())) {
    throw new HttpError(503, 'The package service is temporarily unavailable. Please try again shortly.', {
      code: 'LEGACY_NOT_CONFIGURED'
    });
  }
  return {
    projectId: projectId.trim(),
    clientEmail: clientEmail.trim(),
    privateKey: privateKey.replace(/\\n/g, '\n')
  };
}

async function createDefaultDatabase(env = process.env) {
  const credentials = requireFirebaseEnvironment(env);
  try {
    const imported = await import('firebase-admin');
    const admin = imported.default || imported;
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(credentials) });
    }
    return admin.firestore();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, 'The package service is temporarily unavailable. Please try again shortly.', {
      code: 'LEGACY_UNAVAILABLE',
      cause: error
    });
  }
}

async function getDefaultDatabase(env = process.env) {
  if (!defaultDatabasePromise) {
    defaultDatabasePromise = createDefaultDatabase(env).catch((error) => {
      defaultDatabasePromise = null;
      throw error;
    });
  }
  return defaultDatabasePromise;
}

function boundedString(value, maxLength = 2_000) {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLength);
}

function timestampToIso(value) {
  if (value == null) return null;
  try {
    const date = typeof value.toDate === 'function'
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  } catch (_error) {
    return null;
  }
}

function sanitizeLegacyDocument(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const url = sanitizePublicUrl(value.url);
  const category = boundedString(value.category, 100).trim();
  const name = boundedString(value.name, 500).trim();
  if (!url || !category || !name) return null;
  return {
    id: ['string', 'number'].includes(typeof value.id) ? String(value.id).slice(0, 200) : '',
    category,
    name,
    url
  };
}

function sanitizeLegacyChecklistItem(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const text = boundedString(value.text, 2_000).trim();
  if (!text) return null;
  return {
    id: ['string', 'number'].includes(typeof value.id) ? String(value.id).slice(0, 200) : '',
    text,
    completed: value.completed === true
  };
}

function sanitizeLegacyKeyInformation(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    agentName: boundedString(source.agentName, 500),
    agentContact: boundedString(source.agentContact, 500),
    whatsAppNotes: boundedString(source.whatsAppNotes, 5_000),
    groundTransportManager: boundedString(source.groundTransportManager, 1_000),
    customerSim: boundedString(source.customerSim, 500),
    customerEmail: boundedString(source.customerEmail, 500),
    isEmailLocked: source.isEmailLocked === true
  };
}

export function sanitizeLegacyCustomer(documentId, customerData) {
  const source = customerData && typeof customerData === 'object' ? customerData : {};
  const documents = Array.isArray(source.documents)
    ? source.documents.slice(0, 500).map(sanitizeLegacyDocument).filter(Boolean)
    : [];
  const checklist = Array.isArray(source.checklist)
    ? source.checklist.slice(0, 200).map(sanitizeLegacyChecklistItem).filter(Boolean)
    : [];

  return {
    id: boundedString(String(documentId || ''), 200),
    firstName: boundedString(source.firstName, 500),
    lastName: boundedString(source.lastName, 500),
    referenceNumber: boundedString(source.referenceNumber, 100),
    packageType: boundedString(source.packageType, 500),
    destination: boundedString(source.destination, 1_000),
    documents,
    checklist,
    keyInformation: sanitizeLegacyKeyInformation(source.keyInformation),
    status: boundedString(source.status, 200),
    isArchived: source.isArchived === true,
    createdAt: timestampToIso(source.createdAt),
    lastUpdatedAt: timestampToIso(source.lastUpdatedAt),
    accessExpiresAt: timestampToIso(source.accessExpiresAt)
  };
}

export function createLegacyCustomerLookup({
  getDatabase = () => getDefaultDatabase(process.env)
} = {}) {
  return async function lookupLegacyCustomer(normalizedReference, lastName) {
    if (typeof normalizedReference !== 'string' || typeof lastName !== 'string') return null;
    let database;
    try {
      database = await getDatabase();
      const snapshot = await database.collection('customers')
        .where('referenceNumber', '==', normalizedReference)
        .where('lastName_lowercase', '==', lastName.trim().toLowerCase())
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      const document = snapshot.docs[0];
      return sanitizeLegacyCustomer(document.id, document.data());
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, 'The package service is temporarily unavailable. Please try again shortly.', {
        code: 'LEGACY_UNAVAILABLE',
        cause: error
      });
    }
  };
}

export const lookupLegacyCustomer = createLegacyCustomerLookup();
