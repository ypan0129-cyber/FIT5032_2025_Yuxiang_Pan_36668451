# SilverLink Health

SilverLink Health is a Vue 3 web application that helps older Australians find mental health support services.

## Current stage

A3 Stage 5 implements business requirements D.2 and E.1. An authenticated
member can select trusted services and send a support-plan email with a
generated PDF attachment to the address verified by Firebase Authentication.
The protected server-side workflow runs on Alibaba Cloud Function Compute in
the Hong Kong region, verifies the Firebase ID token and Firestore member role,
applies per-member limits, and sends the message through Resend.

Stages 1-5 are configured and verified. The local `.env.local`, cloud upload
archives and all provider credentials remain ignored by Git.

All new accounts are created with the `member` role. The role is written by the application as a fixed value and enforced again by Firestore Security Rules; users cannot choose or elevate their own role. A Firebase administrator can assign the `staff` role by editing an existing `users/{uid}` document in the Firestore console. Staff accounts can access `/staff`, while member accounts are redirected to the access-denied page.

The public directory still reads its six service records from the local JavaScript data structure. Ratings are stored at `resources/{resourceId}/ratings/{uid}`. Using the authenticated user ID as the document ID ensures that one member has only one rating per resource. Firestore Security Rules validate the resource ID, require an integer score from 1 to 5, and prevent users from writing ratings for another account. Passwords and email addresses are not stored in Firestore.

## Firebase setup

1. Copy `.env.example` to `.env.local`.
2. Add the Firebase Web app configuration for the `sliverlink-health` project to `.env.local`.
3. Enable **Authentication → Sign-in method → Email/Password**.
4. Enable **Authentication → Sign-in method → Google**, select a project
   support email and save the provider configuration.
5. Under **Authentication → Settings → Authorised domains**, add every host
   used for the application. Add `localhost` when it is needed for local popup
   testing and add the Firebase Hosting or custom production domain before
   deployment.
6. Create a Cloud Firestore database in production mode. This project uses the Sydney region (`australia-southeast1`).
7. Publish `firestore.rules` in the Firebase console, or deploy it with `npx firebase-tools deploy --only firestore:rules`.
8. To create a staff account, register a normal member, locate its UID in Firebase Authentication, open the matching `users/{uid}` document, and change only the `role` field from `member` to `staff`. Refresh or sign in again before testing `/staff`.

The real `.env.local` file is ignored by Git. Never add a Firebase service-account private key to this repository. Firebase Web configuration values are client configuration; access control is enforced by Authentication and Firestore Security Rules.

## Security controls

- Vue text interpolation is used for user and resource content. The application
  does not use `v-html`, `innerHTML` or similar direct HTML injection APIs.
- Registration rejects `<` and `>` in profile names on the client, and
  Firestore Security Rules apply the same restriction before storing a profile.
- Email, password, display-name, resource-ID and rating-score limits are checked
  before requests are sent. Firestore Rules independently enforce stored profile,
  role, timestamp and rating values.
- Post-login redirect values are parsed against a fixed application origin, so
  absolute, protocol-relative and backslash-based external redirects are rejected.
- The application defines a Content Security Policy and sends security headers
  from the Vite development and preview servers, including clickjacking,
  content-type, referrer and unnecessary browser-permission restrictions.
- External resource links use `noopener noreferrer` when opening a new tab.
- Authentication is handled by Firebase Authentication. Page guards improve the
  interface, while Firestore Security Rules remain the authoritative data-access
  boundary.

## Run locally

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

Run the validation tests with:

```sh
npm test
```

The interface uses custom CSS and does not use a pre-built CSS template.

The home page photograph is loaded from a local copy of an [Unsplash image](https://images.unsplash.com/photo-1508963493744-76fce69379c0).

## Development and submission history (append-only)

This log keeps the project history in chronological order. Completed stages and
submission checkpoints are appended below; earlier entries must not be replaced
when a later stage is finished.

### Stage 1 — Responsive public interface

**Git checkpoint:** [`0ad6acd`](https://github.com/ypan0129-cyber/FIT5032_2025_Yuxiang_Pan_36668451/commit/0ad6acd) — `feat: build SilverLink Health responsive interface`
**Status:** Committed and pushed to `origin/main`.

- Built the responsive public interface with Vue 3, Vue Router and Vite.
- Added the home page, resource directory, resource detail pages, access-denied
  page and not-found page.
- Added six Australian mental-health support resources in local JavaScript data.
- Added keyword search, support-category filtering and delivery-mode filtering.
- Added responsive layouts for desktop, tablet and mobile users, with basic
  accessibility support and clear emergency contact information.
- Used custom CSS instead of a pre-built CSS template.

### Stage 2 — Firebase member authentication

**Git checkpoint:** [`1e307c5`](https://github.com/ypan0129-cyber/FIT5032_2025_Yuxiang_Pan_36668451/commit/1e307c5) — `feat: add Firebase member authentication`
**Status:** Committed and pushed to `origin/main`.

- Connected Firebase Authentication with Email/Password sign-in.
- Added registration, login, logout and persistent authentication state.
- Added the protected `/account` route and safe redirects for unauthorised users.
- Created a Firestore `users/{uid}` profile for each registered account.
- Assigned every new registration the fixed `member` role; users cannot choose
  or elevate their own role.
- Added Firestore Security Rules that prevent profile listing, role elevation
  and access to another user's profile.
- Kept the real `.env.local` file outside Git and confirmed that passwords are
  managed by Firebase Authentication rather than stored in Firestore.

### Stage 3 — Staff access and resource ratings

**Git checkpoint:** [`913bb12`](https://github.com/ypan0129-cyber/FIT5032_2025_Yuxiang_Pan_36668451/commit/913bb12) — `feat: add staff access and resource ratings`
**Status:** Committed and pushed to `origin/main`.

- Added `member` and `staff` role-aware navigation, account information and
  protected `/staff` route handling.
- Added an access-denied page for members who try to open staff-only features.
- Added a 1–5 helpfulness rating for every support resource.
- Allowed each member to create one rating per resource and update that rating
  later using `resources/{resourceId}/ratings/{uid}`.
- Added public average-score and rating-count summaries for each resource.
- Allowed staff to review summaries without submitting member ratings.
- Extended Firestore Security Rules to validate resource IDs, rating ownership,
  timestamps and integer scores from 1 to 5.
- Verification completed: 8 automated tests passed, the production build passed,
  and mobile layout checks found no horizontal overflow.

### Stage 4 — Application security hardening

**Git checkpoint:** [`ee08535`](https://github.com/ypan0129-cyber/FIT5032_2025_Yuxiang_Pan_36668451/commit/ee08535) — `feat: add application security protections`
**Status:** Committed and pushed to `origin/main`.

- Added a plain-text validation boundary for profile names and mirrored the
  restriction in Firestore Security Rules.
- Added maximum email and password lengths to both validation logic and form
  controls.
- Replaced the basic login redirect check with same-origin URL parsing to block
  external redirect variants.
- Added a Content Security Policy and browser security headers for local
  development and preview testing.
- Added explicit `noopener noreferrer` protection to external resource links.
- Added automated tests for malicious profile markup, oversized credentials,
  unsafe redirects and direct HTML injection APIs.
- Compiled the updated Firestore Rules with the local emulator, published them
  to Firebase and confirmed that the security policy still permits rating reads.
- Browser verification confirmed that malicious markup is displayed only as
  rejected plain text, with no script dialog or Content Security Policy errors.
- Verification completed: 14 automated tests passed, the production build passed,
  `npm audit --omit=dev` found no vulnerabilities, and `git diff --check` passed.

### A3 Stage 0 — Secure implementation baseline

**Git checkpoint:** [`387a758`](https://github.com/ypan0129-cyber/FIT5032_2025_Yuxiang_Pan_36668451/commit/387a758) — `chore(a3): establish secure implementation baseline`
**Status:** Committed and pushed to `origin/main`.

- Added the A3 requirements and evidence matrix with staged D–F delivery gates.
- Recorded the planned reviewable commit sequence for later A3 work.
- Updated vulnerable transitive build dependencies without changing the runtime
  application behavior.
- Verification completed: the existing 14 automated tests and production build
  passed, and `npm audit --omit=dev` found no vulnerabilities.

### A3 Stage 1 — Google provider authentication

**Git checkpoints:** `dca6644` — `feat(auth): add Google provider authentication`; `9100487` — `fix(auth): allow Google sign-in loader in CSP`
**Status:** Committed, pushed to `origin/main` and verified with the configured Firebase project.

- Added reusable Google popup sign-in controls to the login and registration
  pages while preserving the Email/Password workflow and safe redirects.
- Creates a fixed-role `member` profile for first-time provider users and reads,
  rather than overwrites, an existing profile on repeat sign-in.
- Rejects unsafe provider display names and falls back to a valid email-derived
  or application display name.
- Shows the Firebase sign-in method on the protected account page.
- Added focused provider-profile and Firestore role-boundary tests. No Firebase
  configuration or secrets are stored in the repository.
- Updated the Content Security Policy to allow Firebase's exact Google API
  script origin while retaining the existing restrictive default policy.
- Verification completed: 20 automated tests and the production build passed;
  desktop/mobile layout checks passed; and first and repeat Google sign-in,
  fixed `member` profile creation, sign-in method display, sign-out and protected
  account access succeeded against the configured Firebase project.

### A3 Stage 2 — Interactive data tables

**Git checkpoint:** `f0cbb9d` — `feat(tables): add searchable sortable paginated data tables`
**Status:** Committed, pushed to `origin/main` and verified on desktop and mobile.

- Added a reusable accessible data-table component with explicit column
  selection for search, sortable column headers and clear ascending/descending
  state.
- Added 5/10-row page-size controls and enforced the 10-row maximum in the data
  utility layer, independent of the interface control.
- Added a public service comparison table and replaced the staff summary cards
  with a live rating-summary table while preserving refresh and failure states.
- Kept wide tables inside labelled horizontal scroll regions so the page does
  not overflow on narrow mobile viewports.
- Verification completed: 24 automated tests and the production build passed,
  `npm audit --omit=dev` found no vulnerabilities, and manual desktop/mobile
  checks covered search, sort, pagination, refresh and console errors.

### A3 Stage 3 — CSV and PDF data exports

**Git checkpoint:** `76bfdd7` — `feat(export): add CSV and PDF data exports`
**Status:** Committed, pushed to `origin/main` and verified on desktop and mobile.

- Added reusable CSV and PDF export services that receive the table's complete
  filtered and sorted result set rather than only the visible page.
- Added explicit public-column selection and kept internal identifiers outside
  export definitions on both the resource comparison and staff rating tables.
- Escaped CSV punctuation, added spreadsheet formula-injection protection and
  normalised download filenames.
- Added a lazily loaded PDF generator with A4 orientation selection, table
  headings, alternating row treatment, wrapping and page numbering.
- Verification completed: 27 automated tests and the production build passed,
  `npm audit --omit=dev` found no vulnerabilities, browser checks covered both
  file types and both tables, and a generated PDF passed visual rendering and
  text extraction checks without clipping or missing content.

### A3 Stage 4 — Nearby service search and route planning

**Git checkpoint:** `da09711` — `feat(map): add nearby service search and route planning`
**Status:** Committed, pushed to `origin/main` and verified on desktop and mobile.

- Added a `/nearby` workflow with an interactive Leaflet/OpenStreetMap map and
  an accessible list of six Melbourne public mental-health access points.
- Added Australian suburb/postcode geocoding and optional browser geolocation,
  then ranked services by great-circle distance from the selected start point.
- Added OSRM driving routes with a map polyline, distance, estimated drive time
  and a protected external directions link.
- Added explicit CSP and browser-permission policy entries for map tiles,
  geocoding, routing and same-origin geolocation.
- Verification completed: 37 automated tests, the production build,
  `npm audit --omit=dev` and `git diff --check` passed. Live Nominatim and OSRM
  requests succeeded, and browser checks covered route rendering, distance
  sorting, no-result handling, denied-location fallback, an error-free console
  and a 390 x 844 mobile layout without horizontal overflow.

### A3 Stage 5 — Support-plan email with PDF attachment

**Git checkpoints:** `2a6fa6e` — `feat(email): send support plans with PDF attachments`; `0c79bf9` — `refactor(email): move support plan function to Alibaba Cloud`; `c242d28` — `fix(function): support Alibaba Node 20 runtime`
**Status:** Committed, pushed to `origin/main` and verified against Firebase, Alibaba Cloud Function Compute and Resend.

- Added a protected `/support-plan` workflow where a verified member selects
  one to three services, a contact preference and optional plain-text notes.
- Added server-authoritative Firebase ID-token and Firestore member-role checks;
  the recipient always comes from the verified token and cannot be supplied by
  the browser.
- Added in-memory PDF generation, escaped HTML/text email content, Resend
  delivery, one-minute cooldown and five-message daily member limit.
- Migrated the function from Blaze-dependent Firebase Functions to an Alibaba
  Cloud Node.js 20 event function in `cn-hongkong`, with exact-origin CORS and
  CSP configuration and environment-only credentials.
- Verification completed: 45 frontend tests and 17 function tests passed under
  the supported runtime, production builds and zero-vulnerability audits
  passed, the deployed endpoint returned the expected 204/401 boundary
  responses, and a real authenticated member received the email and readable
  PDF attachment.

### Later stages and submissions

Add each later feature or submission below this line, keeping all earlier stage
records unchanged. Do not invent a commit hash before the corresponding commit
has been created.
