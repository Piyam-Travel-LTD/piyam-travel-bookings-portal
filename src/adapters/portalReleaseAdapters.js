import {
  cleanText,
  firstValue,
  isExplicitFalse,
  isExplicitTrue,
  isRecord,
  safeExternalUrl
} from '../utils/packagePortal.js';

const BLOCKED_RELEASE_STATUSES = new Set([
  'draft',
  'hidden',
  'internal',
  'revoked',
  'unreleased',
  'void',
  'cancelled',
  'canceled'
]);

function isExplicitlyUnavailable(record) {
  if (!isRecord(record)) return true;
  if (isExplicitFalse(record.customer_visible) || isExplicitFalse(record.customerVisible)) return true;
  if (isExplicitFalse(record.is_released) || isExplicitFalse(record.isReleased)) return true;
  if (isExplicitTrue(record.hidden) || isExplicitTrue(record.internal_only) || isExplicitTrue(record.internalOnly)) return true;

  const status = cleanText(
    firstValue([record], ['release_status', 'releaseStatus', 'status'], ''),
    '',
    80
  ).toLowerCase();

  return BLOCKED_RELEASE_STATUSES.has(status);
}

function sourceList(record, nestedKeys) {
  const nested = nestedKeys
    .map(key => record?.[key])
    .filter(isRecord);
  return [...nested, record].filter(isRecord);
}

function normalizeInvoiceLine(line, index) {
  if (!isRecord(line) || isExplicitlyUnavailable(line)) return null;
  if (isExplicitTrue(line.hidden) || isExplicitFalse(line.customer_visible) || isExplicitFalse(line.customerVisible)) return null;

  const sources = [line];
  const description = cleanText(firstValue(sources, [
    'customer_description',
    'customerDescription',
    'public_description',
    'publicDescription',
    'description',
    'title',
    'name'
  ], ''), '', 500);

  if (!description) return null;

  return {
    id: cleanText(firstValue(sources, ['id', 'line_id', 'lineId'], `line-${index + 1}`), `line-${index + 1}`, 120),
    description,
    quantity: firstValue(sources, ['quantity', 'qty'], null),
    soldAmount: firstValue(sources, ['sold_amount', 'soldAmount', 'unit_sold_amount', 'unitSoldAmount', 'unit_price', 'unitPrice', 'price'], null),
    lineTotal: firstValue(sources, ['line_total', 'lineTotal', 'sold_total', 'soldTotal', 'total', 'amount'], null)
  };
}

/**
 * Converts a released invoice payload into an explicit customer-safe whitelist.
 * Supplier costs, commission, margin, internal notes and unknown fields are never copied.
 */
export function normalizeReleasedInvoice(rawInvoice) {
  if (!isRecord(rawInvoice) || isExplicitlyUnavailable(rawInvoice)) return null;

  const sources = sourceList(rawInvoice, ['snapshot', 'invoice_snapshot', 'invoiceSnapshot', 'data']);
  const lineValue = firstValue(sources, ['lines', 'line_items', 'lineItems', 'items'], []);
  const lines = Array.isArray(lineValue)
    ? lineValue.map(normalizeInvoiceLine).filter(Boolean)
    : [];

  const invoice = {
    invoiceNumber: cleanText(firstValue(sources, ['invoice_number', 'invoiceNumber', 'number', 'reference'], ''), '', 120),
    version: cleanText(firstValue(sources, ['version', 'invoice_version', 'invoiceVersion'], ''), '', 80),
    currency: cleanText(firstValue(sources, ['currency', 'currency_code', 'currencyCode'], 'GBP'), 'GBP', 3).toUpperCase(),
    releasedAt: firstValue(sources, ['released_at', 'releasedAt', 'release_date', 'releaseDate'], null),
    dueDate: firstValue(sources, ['due_date', 'dueDate'], null),
    customerTerms: cleanText(firstValue(sources, ['customer_terms', 'customerTerms', 'public_terms', 'publicTerms', 'terms'], ''), '', 5000),
    subtotal: firstValue(sources, ['subtotal', 'sold_subtotal', 'soldSubtotal'], null),
    discount: firstValue(sources, ['discount_amount', 'discountAmount', 'discount'], null),
    total: firstValue(sources, ['total', 'total_amount', 'totalAmount', 'sold_total', 'soldTotal'], null),
    amountPaid: firstValue(sources, ['amount_paid', 'amountPaid', 'paid_amount', 'paidAmount'], null),
    balanceDue: firstValue(sources, ['balance_due', 'balanceDue', 'outstanding_balance', 'outstandingBalance'], null),
    lines
  };

  const hasCustomerContent = Boolean(
    invoice.invoiceNumber || invoice.version || invoice.customerTerms || invoice.lines.length ||
    [invoice.subtotal, invoice.discount, invoice.total, invoice.amountPaid, invoice.balanceDue].some(value => value !== null)
  );

  return hasCustomerContent ? invoice : null;
}

function normalizeJourneyDetails(rawDetails) {
  if (rawDetails === null || rawDetails === undefined) return null;
  if (!isRecord(rawDetails)) {
    const summary = cleanText(rawDetails, '', 1000);
    return summary ? { summary } : null;
  }

  const sources = [rawDetails];
  const details = {
    summary: cleanText(firstValue(sources, ['summary', 'description', 'details'], ''), '', 1000),
    date: firstValue(sources, ['date', 'travel_date', 'travelDate'], null),
    time: cleanText(firstValue(sources, ['time', 'pickup_time', 'pickupTime'], ''), '', 80),
    flightNumber: cleanText(firstValue(sources, ['flight_number', 'flightNumber', 'flight'], ''), '', 100),
    airport: cleanText(firstValue(sources, ['airport', 'airport_name', 'airportName'], ''), '', 200),
    terminal: cleanText(firstValue(sources, ['terminal'], ''), '', 100),
    location: cleanText(firstValue(sources, ['location', 'pickup_location', 'pickupLocation'], ''), '', 300)
  };

  return Object.values(details).some(Boolean) ? details : null;
}

function normalizeContact(rawContact, fallbackSources = [], kind = 'generic') {
  const sources = [rawContact, ...fallbackSources].filter(isRecord);
  if (!sources.length) return null;

  const nameKeys = kind === 'driver'
    ? ['name', 'driver_name', 'driverName', 'contact_name', 'contactName']
    : kind === 'provider'
      ? ['name', 'company', 'provider_name', 'providerName', 'contact_name', 'contactName']
      : ['name', 'contact_name', 'contactName', 'company'];
  const phoneKeys = kind === 'driver'
    ? ['phone', 'telephone', 'driver_contact', 'driverContact', 'contact_number', 'contactNumber', 'contact']
    : kind === 'provider'
      ? ['phone', 'telephone', 'provider_contact', 'providerContact', 'contact_number', 'contactNumber', 'contact']
      : ['phone', 'telephone', 'contact_number', 'contactNumber', 'contact'];

  const contact = {
    name: cleanText(firstValue(sources, nameKeys, ''), '', 200),
    phone: cleanText(firstValue(sources, phoneKeys, ''), '', 120),
    email: cleanText(firstValue(sources, ['email'], ''), '', 254),
    whatsApp: cleanText(firstValue(sources, ['whatsapp', 'whats_app', 'whatsApp'], ''), '', 120)
  };

  return Object.values(contact).some(Boolean) ? contact : null;
}

function normalizeRoute(route, index) {
  if (!isRecord(route) || isExplicitlyUnavailable(route)) return null;
  const sources = [route];
  const providerRecord = firstValue(sources, ['provider', 'transport_provider', 'transportProvider'], null);
  const driverRecord = firstValue(sources, ['driver'], null);

  const normalized = {
    id: cleanText(firstValue(sources, ['id', 'route_id', 'routeId'], `route-${index + 1}`), `route-${index + 1}`, 120),
    label: cleanText(firstValue(sources, ['public_label', 'publicLabel', 'label', 'title', 'route_name', 'routeName'], `Route ${index + 1}`), `Route ${index + 1}`, 300),
    from: cleanText(firstValue(sources, ['from', 'origin', 'pickup_location', 'pickupLocation'], ''), '', 300),
    to: cleanText(firstValue(sources, ['to', 'destination', 'dropoff_location', 'dropoffLocation'], ''), '', 300),
    date: firstValue(sources, ['date', 'travel_date', 'travelDate'], null),
    time: cleanText(firstValue(sources, ['time', 'pickup_time', 'pickupTime'], ''), '', 80),
    vehicleType: cleanText(firstValue(sources, ['vehicle_type', 'vehicleType', 'vehicle'], ''), '', 200),
    publicNotes: cleanText(firstValue(sources, ['public_notes', 'publicNotes', 'customer_notes', 'customerNotes'], ''), '', 2000),
    provider: normalizeContact(providerRecord, sources, 'provider'),
    driver: normalizeContact(driverRecord, sources, 'driver')
  };

  const hasRouteContent = normalized.from || normalized.to || normalized.date || normalized.time ||
    normalized.vehicleType || normalized.publicNotes || normalized.provider || normalized.driver;

  return hasRouteContent ? normalized : null;
}

/**
 * Converts a released transport voucher into a customer-safe whitelist.
 * Route costs, supplier allocations and any unrecognised fields are never copied.
 */
export function normalizeTransportVoucher(rawVoucher) {
  if (!isRecord(rawVoucher) || isExplicitlyUnavailable(rawVoucher)) return null;

  const sources = sourceList(rawVoucher, ['voucher_data', 'voucherData', 'snapshot', 'data']);
  const routeValue = firstValue(sources, ['routes', 'route_timeline', 'routeTimeline', 'timeline', 'segments', 'journeys'], []);
  const routes = Array.isArray(routeValue)
    ? routeValue.map(normalizeRoute).filter(Boolean)
    : [];
  const providerRecord = firstValue(sources, ['provider', 'transport_provider', 'transportProvider'], null);
  const driverRecord = firstValue(sources, ['driver'], null);
  const documentRecord = firstValue(sources, ['document', 'voucher_document', 'voucherDocument'], null);
  const urlSources = [documentRecord, ...sources].filter(isRecord);

  const voucher = {
    voucherNumber: cleanText(firstValue(sources, ['voucher_number', 'voucherNumber', 'number', 'reference'], ''), '', 120),
    version: cleanText(firstValue(sources, ['version', 'voucher_version', 'voucherVersion'], ''), '', 80),
    releasedAt: firstValue(sources, ['released_at', 'releasedAt', 'release_date', 'releaseDate'], null),
    publicNotes: cleanText(firstValue(sources, ['public_notes', 'publicNotes', 'customer_notes', 'customerNotes'], ''), '', 5000),
    arrival: normalizeJourneyDetails(firstValue(sources, ['arrival', 'arrival_details', 'arrivalDetails'], null)),
    departure: normalizeJourneyDetails(firstValue(sources, ['departure', 'departure_details', 'departureDetails'], null)),
    routes,
    provider: normalizeContact(providerRecord, sources, 'provider'),
    driver: normalizeContact(driverRecord, sources, 'driver'),
    previewUrl: safeExternalUrl(firstValue(urlSources, ['preview_url', 'previewUrl', 'view_url', 'viewUrl'], null)),
    downloadUrl: safeExternalUrl(firstValue(urlSources, ['signed_url', 'signedUrl', 'download_url', 'downloadUrl'], null)),
    fileName: cleanText(firstValue(urlSources, ['file_name', 'fileName'], 'transport-voucher'), 'transport-voucher', 300)
  };

  const hasCustomerContent = Boolean(
    voucher.voucherNumber || voucher.version || voucher.publicNotes || voucher.arrival || voucher.departure ||
    voucher.routes.length || voucher.provider || voucher.driver || voucher.previewUrl || voucher.downloadUrl
  );

  return hasCustomerContent ? voucher : null;
}
