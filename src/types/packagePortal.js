// Runtime-free JSDoc contracts shared by the customer package portal.

/**
 * @typedef {'pt_portal'|'legacy_firebase'} PortalSource
 * @typedef {'pdf'|'image'|'html'|'download'} PortalDocumentKind
 *
 * @typedef {Object} PortalDocument
 * @property {string} id
 * @property {'flight'|'hotel'|'transport'|'visa'|'e_sim'|'insurance'|'invoice'|'other'} category
 * @property {string} title
 * @property {string} file_name
 * @property {string|number|null} file_size
 * @property {string} file_type
 * @property {string|null} released_at
 * @property {string} public_notes
 * @property {string|null} signed_url Download URL; never derive a public storage URL.
 * @property {string|null} preview_url Inline URL; deliberately not inferred from signed_url.
 *
 * @typedef {Object} PortalChecklistItem
 * @property {string} id
 * @property {string} label
 * @property {string} status
 * @property {boolean} completed Read-only for PT packages.
 *
 * @typedef {Object} PortalInvoiceLine
 * @property {string} id
 * @property {string} description
 * @property {string|number|null} quantity
 * @property {string|number|null} soldAmount
 * @property {string|number|null} lineTotal
 *
 * @typedef {Object} PortalInvoice
 * @property {string} invoiceNumber
 * @property {string} version
 * @property {string} currency
 * @property {string|null} releasedAt
 * @property {string|null} dueDate
 * @property {string} customerTerms
 * @property {string|number|null} subtotal
 * @property {string|number|null} discount
 * @property {string|number|null} total
 * @property {string|number|null} amountPaid
 * @property {string|number|null} balanceDue
 * @property {PortalInvoiceLine[]} lines
 *
 * @typedef {Object} PortalContact
 * @property {string} name
 * @property {string} phone
 * @property {string} email
 * @property {string} whatsApp
 *
 * @typedef {Object} PortalJourneyDetails
 * @property {string} summary
 * @property {string|null} date
 * @property {string} time
 * @property {string} flightNumber
 * @property {string} airport
 * @property {string} terminal
 * @property {string} location
 *
 * @typedef {Object} PortalTransportRoute
 * @property {string} id
 * @property {string} label
 * @property {string} from
 * @property {string} to
 * @property {string|null} date
 * @property {string} time
 * @property {string} vehicleType
 * @property {string} publicNotes
 * @property {PortalContact|null} provider
 * @property {PortalContact|null} driver
 *
 * @typedef {Object} PortalTransportVoucher
 * @property {string} voucherNumber
 * @property {string} version
 * @property {string|null} releasedAt
 * @property {string} publicNotes
 * @property {PortalJourneyDetails|null} arrival
 * @property {PortalJourneyDetails|null} departure
 * @property {PortalTransportRoute[]} routes
 * @property {PortalContact|null} provider
 * @property {PortalContact|null} driver
 * @property {string|null} previewUrl
 * @property {string|null} downloadUrl
 * @property {string} fileName
 *
 * @typedef {Object} PortalPackage
 * @property {'pt_portal'} source
 * @property {string} reference
 * @property {string} customerName
 * @property {string} packageType
 * @property {string} destination
 * @property {string|null} departureDate
 * @property {string|null} returnDate
 * @property {string|null} accessExpiresAt
 * @property {string} statusLabel
 * @property {Record<string, string|number|boolean>} publicSummary
 * @property {PortalDocument[]} documents
 * @property {PortalTransportVoucher|null} transportVoucher
 * @property {PortalInvoice|null} releasedInvoice
 * @property {PortalChecklistItem[]} checklist
 * @property {{customerEmail: string, customerPhone: string, customerWhatsApp: string, customerName: string}} keyInformation
 * @property {number|null} signedUrlExpiresIn
 * @property {string} loadedAt ISO time when URLs were loaded.
 *
 * @typedef {Object} PackageAuthenticationResult
 * @property {PortalPackage|Object} package Normalized PT package or preserved legacy customer.
 * @property {string|null} credential Phase-one bearer token; keep in React state only.
 * @property {boolean} sessionEstablished True when an HttpOnly package cookie exists.
 *
 * @callback PackageAuthenticatedCallback
 * @param {PackageAuthenticationResult} result
 * @returns {void|Promise<void>}
 *
 * @callback RefreshPortalDocumentCallback
 * @param {PortalDocument} document
 * @param {{reason: 'preview-error'|'customer-request'}} context
 * @returns {PortalDocument|Promise<PortalDocument>}
 *
 * @callback PortalDocumentActionCallback
 * @param {PortalDocument} document
 * @returns {void|Promise<void>}
 */

export const packagePortalTypeDefinitions = null;
