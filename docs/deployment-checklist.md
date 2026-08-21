# Bookings Portal Deployment Checklist

Use this checklist for both the initial PT-Portal integration and later releases that affect customer access. Do not paste customer surnames, access tokens, signed document URLs, or private environment values into this document, pull requests, or issue trackers.

## 1. Prepare the release

- [ ] Confirm the intended commit and review the complete diff.
- [ ] Install and build with Node.js 20 or newer.
- [ ] Run the project’s available automated checks and record the results.
- [ ] Confirm that no Supabase service-role key, MinIO key, Firebase Admin key, R2 key, Mailgun key, document token, or session secret is present in the client bundle or Git diff.
- [ ] Confirm <code>.env</code> files remain untracked and only placeholder values exist in <code>.env.example</code>.
- [ ] Record the currently promoted Vercel production deployment so it can be restored quickly.
- [ ] Identify an authorized test PT package with at least one released document, a valid lead surname, and a current voucher or QR link.
- [ ] Identify a legacy Firebase package that may be used for fallback verification.

## 2. Configure Vercel Preview

Configure these values in the Preview environment and redeploy after changing them:

- [ ] <code>PT_PORTAL_BASE_URL</code> points to the intended HTTPS PT-Portal environment and has no trailing slash.
- [ ] <code>PT_PORTAL_REQUEST_TIMEOUT_MS</code> is set to the approved value, normally <code>10000</code>.
- [ ] <code>PACKAGE_PORTAL_SESSION_SECRET</code> contains at least 32 random characters and differs from Production.
- [ ] <code>PT_PORTAL_INTEGRATION_SECRET</code> is absent unless request signing is active in both portals.
- [ ] Firebase Admin variables are present while legacy fallback remains supported.
- [ ] R2 variables are present while legacy documents remain supported.
- [ ] Mailgun variables are present if completion emails are in release scope.
- [ ] <code>CRON_SECRET</code> matches the GitHub Actions repository secret if the preview environment is intended to exercise purge automation.
- [ ] No server secret uses a <code>VITE_</code> prefix.
- [ ] Preview and PT-Portal origins use valid HTTPS certificates.

On the corresponding PT-Portal deployment:

- [ ] Set <code>NEXT_PUBLIC_BOOKINGS_PORTAL_URL</code> to the intended bookings portal URL.
- [ ] Regenerate or obtain a new test access link after changing that value.
- [ ] Confirm generated transport-voucher QR codes use the same URL.

Production PT-Portal must use:

    NEXT_PUBLIC_BOOKINGS_PORTAL_URL=https://bookings.piyamtravel.com

## 3. Preview smoke-test matrix

Record pass/fail and the sanitized evidence location for each row.

| Area | Required check |
| --- | --- |
| Reference normalization | The same PT package opens with the six-character code, full <code>PT-XXXXXX</code> reference, and lowercase reference. An overlong or malformed reference is rejected rather than truncated to another package. |
| Surname handling | Leading/trailing spaces are normalized and valid surnames containing spaces, apostrophes, or hyphens work. A wrong surname receives neutral wording. |
| PT priority | A valid PT package opens from PT-Portal. If both sources contain the reference, PT-Portal wins. |
| Fallback boundary | Legacy Firebase is queried only after a genuine PT <code>404</code>. Confirm <code>410</code>, <code>429</code>, timeout, and <code>5xx</code> never open a legacy record. |
| Revoked ownership | A disabled or revoked PT-owned package cannot return the fallback-triggering not-found result and reopen a stale Firebase record with the same reference. |
| Legacy access | A known legacy package opens after PT returns <code>404</code>; its header, documents, preview/download controls, checklist, and permitted legacy updates still work. |
| Direct token | A copied <code>/package-documents/:token</code> link opens the same PT package after a hard refresh. Invalid, revoked, and expired tokens produce controlled guidance. |
| QR link | Scan a real PT access-voucher or transport-voucher QR code on a phone and confirm it opens the expected package. |
| Released documents | Only customer-visible released documents appear. Empty categories and <code>travel_documents</code> remain hidden. |
| Preview/download | Test PDF, image, HTML voucher, and download-only file behavior. Confirm the supplied filename and new-tab protections. |
| Signed URL expiry | Leave the portal open until a signed URL expires; the portal refreshes package data and retries only once. |
| Transport | Only released, customer-safe transport fields appear; no supplier allocation or net cost is visible. View/Print works for the released voucher. |
| Overview support | Transport appears as an Overview summary, price-like public information is absent, and office emergency contacts are usable. |
| Personal checklist | The checklist has its own tab, stays browser-session-only, and remains isolated when the customer switches packages. |
| Contact reminder | A package missing email or mobile/WhatsApp details shows a clear office contact prompt without writing directly to PT-Portal or Firebase. |
| Extension request | A logged-in PT customer and a customer with verified expired access can submit one request. IMS creates one open staff task and audit event; repeated submissions are deduplicated and no expiry changes automatically. |
| Invoice | The always-visible Invoice tab shows only the approved Coming soon state. No invoice, line-item, price, balance, cost, margin, commission, draft, or internal-note data appears. |
| Beta shell | The work-in-progress banner and Rathobixz Inc. footer appear on login, package, and controlled-error states; Support and Privacy email links work. |
| Dark mode | Login, all four tabs, alerts, cards, forms, checklist, preview, banner, and footer remain readable with visible focus states in dark mode. |
| Empty states | A package with no released documents shows the approved calm empty state and no empty Transport section. |
| Logout | Logout clears customer state and any session cookie, replaces a token-bearing URL, and refresh does not reopen the package without valid access. |
| Error semantics | Validate <code>400</code>, <code>404</code>, <code>410</code>, <code>429</code>, timeout, malformed upstream response, and <code>5xx</code>. Every API response is JSON and outages are not described as invalid details. |
| Cache/referrer | Package-data responses are <code>private, no-store</code>. Token pages and previews do not send token-bearing referrers. |
| Mobile | At 320 px width there is no horizontal overflow; tabs and document actions remain usable; previews close without browser Back. |
| Customer routes | No agent-only or IMS installation prompt appears on customer routes. |
| Agent route | `/agent` redirects to the customer login and the AgentPortal bundle is not loaded by the public route manifest. |

## 4. Rate-limit and client-IP verification

The customer browser calls the bookings portal, which then makes a server-to-server request to PT-Portal. PT-Portal must not accidentally treat all customers as the same Vercel egress client.

- [ ] Coordinate with the PT-Portal owner to identify which trusted request field supplies the rate-limit identity.
- [ ] Do not trust or blindly forward a browser-controlled <code>X-Forwarded-For</code> value.
- [ ] If an originating address or pseudonymous identity is forwarded, derive it from Vercel-controlled request metadata and protect the integration with the agreed trust mechanism.
- [ ] Make failed attempts from two independent clients and confirm one client’s limit does not unexpectedly throttle the other.
- [ ] Confirm repeated failures from one client produce <code>429</code>.
- [ ] Confirm the bookings proxy preserves the approved <code>Retry-After</code> value and the UI presents the expected wait guidance.
- [ ] Inspect sanitized PT-Portal audit records to confirm successful access is attributed as designed.
- [ ] Confirm neither portal logs the surname, package token, signed document URL, or customer response body.
- [ ] Confirm Vercel access controls, retention, and redaction are acceptable for the unavoidable initial <code>/package-documents/:token</code> edge request.

Do not release until the rate-limit identity is understood and the shared-egress risk has been ruled out or mitigated.

## 5. Configure and release Production

- [ ] Copy approved configuration into the Vercel Production scope; do not copy Preview secrets verbatim.
- [ ] Confirm <code>PT_PORTAL_BASE_URL</code>, <code>R2_PUBLIC_URL</code>, and all customer-facing origins use HTTPS.
- [ ] Confirm the PT-Portal production setting is exactly <code>NEXT_PUBLIC_BOOKINGS_PORTAL_URL=https://bookings.piyamtravel.com</code>.
- [ ] Confirm DNS and TLS for <code>bookings.piyamtravel.com</code> are healthy.
- [ ] Deploy the reviewed commit to Vercel Production.
- [ ] Repeat the minimum production smoke tests: root login, a real PT package, its direct voucher/QR link, one released preview/download, controlled wrong login, controlled expired/revoked access, legacy fallback, logout, and a 320 px mobile check.
- [ ] Check sanitized Vercel and PT-Portal logs for unexpected <code>5xx</code>, shared-client <code>429</code>, cache errors, or leaked sensitive query values.
- [ ] Record operator, deployment identifier, commit, time, test package identifier in a protected operational system, and pass/fail outcome without recording credentials.

The following are external release gates:

- [ ] An authorized operator has configured and confirmed Vercel Preview and Production environment variables.
- [ ] An authorized operator has tested a real released PT package by reference and surname.
- [ ] An authorized operator has scanned a real current QR code and confirmed the package.
- [ ] PT-Portal ownership has confirmed rate-limit/client-IP behavior and the production bookings URL.
- [ ] PT-Portal ownership has confirmed disabled/revoked PT records cannot trigger stale legacy fallback.
- [ ] Vercel edge-log access, retention, and redaction for token-bearing routes have been approved.

Repository build success alone does not satisfy these gates.

## 6. Rollback

Rollback must restore availability without weakening source-routing security.

1. Stop promotion and record the sanitized symptom, affected route, status code, and deployment identifier.
2. Use Vercel to promote or redeploy the previously recorded known-good production deployment.
3. Restore the last known-good Production environment configuration if configuration caused the incident. Handle values in Vercel; never write secrets into Git or incident notes.
4. Keep PT-first routing semantics. Do not introduce broad Firebase fallback for <code>410</code>, <code>429</code>, timeouts, or <code>5xx</code> as an emergency workaround.
5. Confirm the root customer page, a known legacy lookup, and the last known-good PT flow after rollback.
6. Confirm PT-Portal still points generated production links to <code>https://bookings.piyamtravel.com</code>.
7. Review sanitized logs and create a follow-up fix without copying tokens, surnames, signed URLs, or customer data.
8. Re-run the Preview matrix before attempting production again.

If the previous deployment cannot open current PT packages, treat that as an incident requiring coordination with the PT-Portal owner. Do not duplicate PT package data into Firebase.
