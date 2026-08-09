import assert from 'node:assert/strict';
import test from 'node:test';

import { createLegacyCustomerLookup, sanitizeLegacyCustomer } from '../server/legacy-customer.js';
import { normalizeLegacyPackage } from '../src/adapters/legacyPackageAdapter.js';
import {
  normalizeReleasedInvoice,
  normalizeTransportVoucher
} from '../src/adapters/portalReleaseAdapters.js';
import { normalizePtPortalPackage } from '../src/adapters/ptPortalPackageAdapter.js';

test('legacy customer sanitizer exposes only the historical public contract', () => {
  const sanitized = sanitizeLegacyCustomer('legacy-1', {
    firstName: 'Ada',
    lastName: 'Smith',
    referenceNumber: 'PT-H29GPX',
    internalNotes: 'never public',
    supplierCost: 123,
    documents: [
      { id: 'doc-1', category: 'flight', name: 'Ticket', url: 'https://files.example.test/ticket.pdf', objectKey: 'private/key' },
      { id: 'doc-2', category: 'hotel', name: 'Unsafe', url: 'javascript:alert(1)' }
    ],
    checklist: [{ id: 'check-1', text: 'Passport ready', completed: true, internal: 'secret' }],
    keyInformation: { customerEmail: 'ada@example.test', agentName: 'Agent', supplierPhone: 'private' },
    createdAt: new Date('2026-08-01T10:00:00Z')
  });

  assert.deepEqual(sanitized.documents, [{
    id: 'doc-1',
    category: 'flight',
    name: 'Ticket',
    url: 'https://files.example.test/ticket.pdf'
  }]);
  assert.deepEqual(sanitized.checklist, [{ id: 'check-1', text: 'Passport ready', completed: true }]);
  assert.equal(sanitized.createdAt, '2026-08-01T10:00:00.000Z');
  assert.equal(sanitized.internalNotes, undefined);
  assert.equal(sanitized.supplierCost, undefined);
  assert.equal(sanitized.keyInformation.supplierPhone, undefined);
});

test('legacy lookup uses normalized equality filters and sanitizes the selected document', async () => {
  const calls = [];
  const snapshot = {
    empty: false,
    docs: [{
      id: 'legacy-1',
      data: () => ({ firstName: 'Ada', lastName: 'Smith', referenceNumber: 'PT-H29GPX', private: 'hidden' })
    }]
  };
  const query = {
    where(...args) { calls.push(['where', ...args]); return this; },
    limit(...args) { calls.push(['limit', ...args]); return this; },
    async get() { calls.push(['get']); return snapshot; }
  };
  const database = {
    collection(name) { calls.push(['collection', name]); return query; }
  };
  const lookup = createLegacyCustomerLookup({ getDatabase: async () => database });

  const customer = await lookup('PT-H29GPX', ' Smith ');
  assert.equal(customer.id, 'legacy-1');
  assert.equal(customer.private, undefined);
  assert.deepEqual(calls, [
    ['collection', 'customers'],
    ['where', 'referenceNumber', '==', 'PT-H29GPX'],
    ['where', 'lastName_lowercase', '==', 'smith'],
    ['limit', 1],
    ['get']
  ]);
});

test('PT adapter accepts omitted release flags and rejects explicit hidden, draft, or travel bundles', () => {
  const normalized = normalizePtPortalPackage({
    package: {
      package_reference: 'PT-H29GPX',
      customer_name: 'Ada Smith',
      customer_email: 'ada@example.test',
      customer_phone: '+44 7000 000000',
      customer_whatsapp: '+44 7111 111111',
      current_public_summary: {
        welcome: 'Your package is ready',
        package_price: 1_500,
        balance_due: 500,
        total: 1_500,
        currency: 'GBP'
      },
      destination: 'Istanbul'
    },
    documents: [
      { id: 'visible', category: 'flights', title: 'Ticket', signed_url: 'https://files.example.test/ticket.pdf' },
      { id: 'hidden', category: 'hotel', title: 'Hotel', customer_visible: false, signed_url: 'https://files.example.test/hotel.pdf' },
      { id: 'draft', category: 'visa', title: 'Visa', status: 'draft', signed_url: 'https://files.example.test/visa.pdf' },
      { id: 'bundle', category: 'travel-documents', title: 'Bundle', signed_url: 'https://files.example.test/bundle.pdf' }
    ]
  });

  assert.equal(normalized.source, 'pt_portal');
  assert.equal(normalized.reference, 'PT-H29GPX');
  assert.deepEqual(normalized.publicSummary, { welcome: 'Your package is ready' });
  assert.equal(normalized.keyInformation.customerPhone, '+44 7000 000000');
  assert.equal(normalized.keyInformation.customerWhatsApp, '+44 7111 111111');
  assert.equal(normalized.documents.length, 1);
  assert.deepEqual(normalized.documents[0], {
    id: 'visible',
    category: 'flight',
    title: 'Ticket',
    file_name: 'Ticket',
    file_size: null,
    file_type: '',
    released_at: null,
    public_notes: '',
    signed_url: 'https://files.example.test/ticket.pdf',
    preview_url: null,
    status: 'released',
    customer_visible: true
  });
});

test('legacy adapter preserves legacy data while adding normalized portal aliases', () => {
  const raw = {
    id: 'legacy-1',
    firstName: 'Ada',
    lastName: 'Smith',
    referenceNumber: 'PT-OLD123',
    customLegacyFlag: true,
    documents: [{ id: 'd1', category: 'Hotels', name: 'Hotel voucher', url: 'https://files.example.test/hotel.pdf' }]
  };
  const normalized = normalizeLegacyPackage(raw);

  assert.equal(normalized.source, 'legacy_firebase');
  assert.equal(normalized.customerName, 'Ada Smith');
  assert.equal(normalized.customLegacyFlag, true);
  assert.equal(normalized.documents, raw.documents);
  assert.equal(normalized.portalDocuments.length, 1);
  assert.equal(normalized.portalDocuments[0].category, 'hotel');
  assert.equal(normalized.portalDocuments[0].signed_url, 'https://files.example.test/hotel.pdf');
});

test('released invoice adapter is an explicit allowlist at invoice and line level', () => {
  const invoice = normalizeReleasedInvoice({
    status: 'released',
    invoice_number: 'INV-42',
    currency: 'gbp',
    total: 1_500,
    supplier_cost: 900,
    commission: 100,
    internal_notes: 'private note',
    lines: [{
      id: 'line-1',
      customer_description: 'Travel package',
      quantity: 1,
      sold_amount: 1_500,
      line_total: 1_500,
      net_cost: 900,
      margin: 600,
      supplier: 'Private Supplier'
    }]
  });

  assert.deepEqual(Object.keys(invoice).sort(), [
    'amountPaid', 'balanceDue', 'currency', 'customerTerms', 'discount', 'dueDate',
    'invoiceNumber', 'lines', 'releasedAt', 'subtotal', 'total', 'version'
  ].sort());
  assert.deepEqual(Object.keys(invoice.lines[0]).sort(), [
    'description', 'id', 'lineTotal', 'quantity', 'soldAmount'
  ].sort());
  assert.equal(invoice.invoiceNumber, 'INV-42');
  assert.equal(invoice.currency, 'GBP');
  assert.doesNotMatch(JSON.stringify(invoice), /supplier|private note|net_cost|margin/i);
  assert.equal(normalizeReleasedInvoice({ status: 'draft', invoice_number: 'INV-DRAFT' }), null);
});

test('transport voucher adapter allowlists journey, contact, route, and URL fields', () => {
  const voucher = normalizeTransportVoucher({
    voucher_number: 'TV-42',
    public_notes: 'Meet at arrivals',
    supplier_cost: 70,
    internal_notes: 'private note',
    provider: { name: 'Public Transfers', phone: '+44 20 0000 0000', booked_cost: 70 },
    driver: { name: 'Driver Name', phone: '+44 7000 000000', private_id: 'secret-id' },
    routes: [{
      id: 'route-1',
      label: 'Airport to hotel',
      from: 'Airport',
      to: 'Hotel',
      time: '14:30',
      vehicle_type: 'Minibus',
      supplier_allocation: 'private allocation',
      route_cost: 70
    }],
    document: {
      preview_url: 'https://files.example.test/voucher.html',
      signed_url: 'https://files.example.test/voucher.pdf',
      file_name: 'voucher.pdf',
      object_key: 'private/key'
    }
  });

  assert.deepEqual(Object.keys(voucher).sort(), [
    'arrival', 'departure', 'downloadUrl', 'driver', 'fileName', 'previewUrl', 'provider',
    'publicNotes', 'releasedAt', 'routes', 'version', 'voucherNumber'
  ].sort());
  assert.deepEqual(Object.keys(voucher.routes[0]).sort(), [
    'date', 'driver', 'from', 'id', 'label', 'provider', 'publicNotes', 'time', 'to', 'vehicleType'
  ].sort());
  assert.deepEqual(Object.keys(voucher.provider).sort(), ['email', 'name', 'phone', 'whatsApp'].sort());
  assert.equal(voucher.previewUrl, 'https://files.example.test/voucher.html');
  assert.equal(voucher.downloadUrl, 'https://files.example.test/voucher.pdf');
  assert.doesNotMatch(JSON.stringify(voucher), /private|supplier_cost|route_cost|object_key/i);
  assert.equal(normalizeTransportVoucher({ hidden: true, voucher_number: 'TV-HIDDEN' }), null);
});
