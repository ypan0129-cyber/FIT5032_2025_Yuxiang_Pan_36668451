# A3 Requirements and Evidence Matrix

This document tracks the planned implementation and verification of the
SilverLink Health A3 requirements. A requirement is not marked complete until
its user-visible workflow, automated checks, deployment evidence and any
required manual configuration have been verified.

## Status definitions

- **Baseline present**: relevant functionality exists from A2, but its A3
  acceptance evidence is not complete.
- **Planned**: the implementation stage has been defined but not started.
- **Implemented**: the code and focused automated checks are complete locally.
- **Verified**: the production workflow and requirement-specific acceptance
  checks have been completed.

## D-class requirements

| Requirement | Acceptance evidence | Current status | Planned stage | Implementation evidence | Verification evidence |
| --- | --- | --- | --- | --- | --- |
| D.1 External authentication | Firebase Authentication supports a complete external-provider sign-in flow and creates a safe member profile for a first-time user. | Verified | Stage 1 | `src/auth.js`, `src/components/GoogleSignInButton.vue`, `src/utils/providerProfile.js`, login/register/account views, CSP configuration and focused tests | 20 automated tests and the production build passed; configured Firebase project verified first and repeat Google sign-in, fixed `member` profile creation, account method display, sign-out and protected account access |
| D.2 Email with attachment | An authenticated member can send a support-plan email with a generated PDF attachment to the email address verified by Firebase Authentication. | Verified | Stage 5 | Authenticated Alibaba Cloud Function Compute endpoint, Firebase ID-token verification, Resend integration, in-memory PDF generation and protected support-plan workflow | 45 frontend tests, 17 function tests and the production build passed; the deployed Hong Kong endpoint passed CORS and authentication checks, and the configured test account received the email with a readable PDF attachment |
| D.3 Interactive tables | Two tables support sorting, single-column search and pagination, with no page size above 10 rows. | Verified | Stage 2 | Reusable accessible `DataTable` component, public service comparison table, staff rating-summary table and tested table utilities | 24 automated tests, production build and zero-vulnerability audit passed; desktop/mobile checks verified column search, ascending/descending sort, pagination, 5/10-row limits, contained horizontal scrolling and error-free interaction |
| D.4 Public cloud deployment | The complete application, SPA routes, Firestore rules and serverless functions are available at a public production URL. | Planned: `firebase.json` currently configures Firestore only. | Stage 11 | Firebase Hosting configuration, SPA and API rewrites, production security headers and deployment documentation | Public URL, deployment output and production smoke-test record |

## E-class requirements

| Requirement | Acceptance evidence | Current status | Planned stage | Implementation evidence | Verification evidence |
| --- | --- | --- | --- | --- | --- |
| E.1 Serverless function | Alibaba Cloud Function Compute executes authenticated server-side business logic that cannot safely run in the browser. | Verified | Stage 5 | Node.js 20 support-plan function, Firebase Admin token and role verification, server-side validation, secret-only environment configuration and per-member abuse controls | The Node.js 20 deployment loaded successfully; public preflight returned 204, unauthenticated POST returned 401, and an authenticated invocation generated and delivered the expected email and PDF without exposing credentials |
| E.2 Geolocation | A map provides at least two practical capabilities: finding nearby services from a suburb/postcode or current location, and route planning with distance and estimated time. | Verified | Stage 4 | `/nearby` Leaflet/OpenStreetMap page, six public access points, Australian Nominatim geocoding, browser location handling, distance ranking, OSRM driving routes, route summary and accessible list alternative | 37 automated tests, production build, zero-vulnerability audit and live Nominatim/OSRM smoke checks passed; desktop and 390 x 844 browser checks verified nearest-first sorting, route polyline, distance/time summary, external directions URL, no-result and denied-permission messages, no horizontal overflow and an error-free console |
| E.3 WCAG 2.1 AA accessibility | All completed A3 workflows are audited against WCAG 2.1 AA with automated and documented manual checks. | Baseline present: the app has semantic landmarks, a skip link, labelled forms and visible focus styles, but no complete AA audit. | Stage 10 | Accessibility remediation, route focus/title handling, accessible table/map/chart alternatives and `ACCESSIBILITY.md` | Axe checks plus keyboard, contrast, zoom and screen-reader-oriented manual evidence |
| E.4 Data export | Users can export the current filtered and sorted table data without leaking internal identifiers. | Verified | Stage 3 | Reusable CSV/PDF export service, table column selection, lazy PDF generation and controls on both interactive tables | 27 automated tests, production build and zero-vulnerability audit passed; browser checks verified filtered/sorted CSV and PDF downloads on both tables, selected public columns, mobile layout and error-free interaction; generated PDF also passed visual render and text extraction checks |

## F.1 innovation features

The four selected innovations are deliberately tied to the existing resource
directory, Firebase ratings and role model rather than being standalone demos.

| Innovation | Acceptance evidence | Status | Planned stage | Implementation evidence | Verification evidence |
| --- | --- | --- | --- | --- | --- |
| Firestore analytics | Interactive charts display privacy-safe rating aggregates sourced from Firestore and include an equivalent data table. | Verified | Stage 6 | Server-authoritative transactional rating writes, `ratingAnalytics` documents, staff rebuild operation, private-rating Firestore rules, Chart.js segmented chart and searchable/exportable table equivalent | 49 frontend tests, 25 function tests, 5 Firestore emulator tests, Node.js 20 execution, production build and zero-vulnerability production audits passed; deployed routes passed CORS/authentication/origin checks, staff rebuilt all six aggregates, member rating writes updated matching chart/table values, and desktop plus 390 x 844 mobile checks passed |
| Administrator dashboard | A separate `admin` role can view system-level user, role, rating and email metrics through server-authorised operations. | Verified | Stage 7 | Protected `/admin` route and navigation, server-authorised `POST /admin/metrics`, field-limited aggregate queries, admin-only role enforcement and responsive dashboard states | 55 frontend tests, 30 function tests, 6 Firestore emulator tests, Node.js 20 execution, production build and zero-vulnerability production audits passed; deployed route returned 204/401/403 for CORS/authentication/origin checks, configured administrator metrics and refresh passed, member/staff access was denied, and desktop plus 390 x 844 mobile checks passed |
| Public REST API | At least two versioned, read-only endpoints expose resources and rating summaries without personal data. | Verified | Stage 8 | Anonymous `GET /api/v1/resources` and `GET /api/v1/resources/{resourceId}/summary` Alibaba Cloud routes, privacy-limited response builders, wildcard public-read CORS, bounded caching, stable errors and an OpenAPI 3.1 contract | 57 frontend tests, 37 function tests, Node.js 20 execution, production build, zero-vulnerability production audits and `git diff --check` passed; production routes returned 200 with six allowlisted resources and the expected 300/60-second caches, preflight/unknown/method cases returned 204/404/405, protected routes retained 401/403 boundaries, a structured privacy scan passed, and a browser cross-origin fetch completed without CORS errors |
| Offline support | The application reports connectivity state and lets users open previously saved public resources while offline. | Planned | Stage 9 | PWA service worker, offline fallback, connectivity status and locally saved resources | Browser offline/reconnect checks confirming that private authentication data is not cached |

## Cross-stage quality gates

Every implementation stage must preserve the existing A-C workflows and pass:

```sh
npm test
npm run build
npm audit --omit=dev
git diff --check
```

Stages that change Firebase access control or Functions must also run their
focused rule/function tests. Stages that change user-visible behavior must
include browser verification at desktop and mobile sizes. Test, deployment and
manual-review results must be recorded truthfully; planned work is not evidence
of completion.

## Planned commit sequence

| Stage | Scope | Planned commit subject |
| --- | --- | --- |
| 0 | Secure baseline and requirements matrix | `chore(a3): establish secure implementation baseline` |
| 1 | D.1 external-provider authentication | `feat(auth): add Google provider authentication` |
| 2 | D.3 interactive tables | `feat(tables): add searchable sortable paginated data tables` |
| 3 | E.4 CSV and PDF export | `feat(export): add CSV and PDF data exports` |
| 4 | E.2 nearby search and route planning | `feat(map): add nearby service search and route planning` |
| 5 | D.2 attachment email and E.1 serverless logic | `feat(email): send support plans with PDF attachments` |
| 6 | F.1 Firestore analytics | `feat(analytics): add privacy-safe Firestore rating charts` |
| 7 | F.1 administrator dashboard | `feat(admin): add role-protected administration dashboard` |
| 8 | F.1 public API | `feat(api): expose public resource REST endpoints` |
| 9 | F.1 offline support | `feat(pwa): add offline status and saved resources` |
| 10 | E.3 WCAG 2.1 AA remediation | `feat(a11y): complete WCAG 2.1 AA remediation` |
| 11 | D.4 production deployment | `chore(deploy): configure Firebase production hosting` |
| 12 | Research and demonstration evidence | `docs(a3): add research and demonstration evidence` |

Commits must represent real, reviewable work. They must not be empty, backdated,
or later squashed into a single submission commit. Environment files, API keys,
service-account credentials and provider secrets must never be committed.
