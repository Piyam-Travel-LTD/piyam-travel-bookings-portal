# Piyam Travel Bookings Portal

The customer-facing portal at bookings.piyamtravel.com provides access to travel-package documents while the business moves from legacy Firebase folders to PT-Portal packages.

New packages are owned and managed in PT-Portal. This repository remains responsible for the customer interface, same-origin serverless adapters, and temporary read access to legacy Firebase and Cloudflare R2 records. The legacy <code>/agent</code> route is disabled; staff manage packages in IMS.

## Application routes

- <code>/</code> accepts a package reference and lead passenger surname.
- <code>/package-documents/:token</code> supports PT-Portal access vouchers and transport-voucher QR codes.
- <code>/documents</code> is the token-free URL used after a secure package session is established.
- <code>/agent</code> provides the temporary Firebase agent dashboard for legacy folders.

The browser calls only same-origin <code>/api</code> endpoints. Serverless functions contact PT-Portal, Firebase Admin, Cloudflare R2, and Mailgun with server-only credentials. Customer access-extension requests are verified and persisted by PT-Portal as deduplicated staff tasks and audit events; they never extend access automatically.

## Requirements

- Node.js 20 or newer
- npm
- Git
- Vercel CLI or a linked Vercel project when testing serverless functions locally
- Access to the required development or preview credentials

Current dependency resolutions include packages that require Node 20. Do not use Node 18 for installation, local verification, or deployment.

## Local setup

1. Clone and enter the repository.

       git clone https://github.com/Piyam-Travel-LTD/piyam-travel-bookings-portal.git
       cd piyam-travel-bookings-portal

2. Install dependencies.

       npm install

3. Create a local environment file and replace every required placeholder.

       cp .env.example .env.local

4. Generate a unique session secret of at least 32 random characters. For example:

       openssl rand -base64 48

   Put the result in <code>PACKAGE_PORTAL_SESSION_SECRET</code>. Never reuse production secrets in local or preview environments.

5. Run the frontend-only Vite server when API calls are not needed.

       npm run dev

6. Use Vercel development mode for end-to-end work involving <code>/api/package-access</code>, <code>/api/package-data</code>, or <code>/api/package-session</code>.

       npx vercel dev

7. Run the automated contract tests and verify the production bundle before opening a pull request or deploying.

       npm run check

Vite alone does not emulate the Vercel serverless functions. PT package login, direct-token routes, and legacy fallback require the full local Vercel runtime or a preview deployment.

## Environment configuration

Use [.env.example](.env.example) as the inventory. Local <code>.env</code> variants are ignored by Git. Configure runtime values separately in Vercel for Preview and Production, then redeploy so the functions receive the updated values.

### PT-Portal integration

| Variable | Scope | Purpose |
| --- | --- | --- |
| <code>PT_PORTAL_BASE_URL</code> | Server-only, required | PT-Portal production or preview origin, without a trailing slash. Production must use HTTPS. |
| <code>PT_PORTAL_REQUEST_TIMEOUT_MS</code> | Server-only | Upstream request timeout in milliseconds; defaults to 10000. |
| <code>PACKAGE_PORTAL_SESSION_SECRET</code> | Server-only, required for hardened sessions | At least 32 random characters used to encrypt the <code>HttpOnly</code> package-session cookie. Without it, the portal falls back to keeping the token only in in-memory React state. |
| <code>PT_PORTAL_INTEGRATION_SECRET</code> | Server-only, future optional | Shared request-signing secret. Leave unset until signing is implemented and coordinated in both repositories. |

Do not add Supabase service-role keys, MinIO credentials, document tokens, or customer details to this project’s browser environment.

### Legacy Firebase

The following Firebase Admin variables are server secrets required by the legacy lookup, folder management, and purge functions:

- <code>FIREBASE_PROJECT_ID</code>
- <code>FIREBASE_CLIENT_EMAIL</code>
- <code>FIREBASE_PRIVATE_KEY</code>, stored with literal <code>\n</code> line breaks as shown in the example

The browser Firebase configuration currently lives in <code>src/firebase.js</code>. It is public client configuration and is not equivalent to a Firebase Admin credential. The example inventories the conventional <code>VITE_FIREBASE_*</code> names, but the current source does not read them; changing those environment values alone will not change the browser Firebase project.

Any value prefixed with <code>VITE_</code> is embedded into the client bundle and can be read by portal visitors. Never place private keys, integration secrets, R2 credentials, Mailgun credentials, session secrets, or service-role keys in a <code>VITE_</code> variable.

### Legacy Cloudflare R2

The serverless upload, delete, voucher, and purge functions use:

- <code>R2_ACCESS_KEY_ID</code>
- <code>R2_SECRET_ACCESS_KEY</code>
- <code>R2_BUCKET_NAME</code>
- <code>R2_PUBLIC_URL</code>

The current R2 endpoint is configured directly in the API modules, so <code>CLOUDFLARE_ACCOUNT_ID</code> is not consumed. Production <code>R2_PUBLIC_URL</code> must use HTTPS to prevent mixed-content failures.

### Legacy Mailgun and purge automation

- <code>MAILGUN_API_KEY</code>, <code>MAILGUN_DOMAIN</code>, and <code>MAILGUN_SENDER_EMAIL</code> support legacy completion email.
- <code>CRON_SECRET</code> protects <code>/api/purge-old-folders</code>. The same value must exist as the GitHub Actions repository secret named <code>CRON_SECRET</code>.

### Required PT-Portal setting

In the PT-Portal deployment, configure:

    NEXT_PUBLIC_BOOKINGS_PORTAL_URL=https://bookings.piyamtravel.com

This value belongs to PT-Portal, not this repository. It controls generated customer links and transport-voucher QR codes.

## Production security requirements

- Both <code>https://bookings.piyamtravel.com</code> and <code>PT_PORTAL_BASE_URL</code> must have valid HTTPS certificates.
- All customer document URLs must use HTTPS. Do not deploy a production configuration that produces mixed content.
- Keep every server credential out of <code>VITE_*</code> variables and Git history.
- Use separate random secrets for local, Preview, and Production.
- Treat package-document tokens as password-equivalent. Do not copy them into issue trackers, analytics, screenshots, or logs.
- Verify that the proxy preserves the intended client-IP/rate-limit semantics without trusting a browser-supplied forwarding header.
- Secure cookies require HTTPS in Preview and Production. Local HTTP testing does not prove production cookie behavior.

## Deployment

Follow the [deployment and smoke-test checklist](docs/deployment-checklist.md). A preview deployment must pass the source-routing, token-link, document, mobile, and security checks before production promotion.

Four release gates require external access and cannot be completed from this checkout alone:

1. Vercel Preview and Production environment variables must be configured and a deployment created.
2. An authorized operator must validate a real released PT package by reference/surname and through its real access-voucher or transport-voucher QR link.
3. PT-Portal ownership must confirm revoked/disabled-package fallback semantics and customer-specific rate limiting through the Vercel proxy.
4. The Vercel owner must approve access, retention, and redaction controls for the initial token-bearing route in edge request logs.

Do not mark the integration complete until both gates are recorded.
