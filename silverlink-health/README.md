# SilverLink Health

SilverLink Health is a Vue 3 web application that helps older Australians find mental health support services.

## Current stage

A3 Stage 1 implements business requirement D.1 with Google Authentication in
addition to the existing Email/Password workflow. A first-time Google user gets
a Firestore profile with the fixed `member` role, while repeat sign-ins reuse the
existing profile without overwriting its role or name. The login, registration
and account pages now expose the provider workflow and sign-in method.

The implementation and configured Firebase workflow have been verified. Google
is enabled for the project, `localhost` is authorised for local testing, and
first sign-in, repeat sign-in, sign-out, fixed-role profile creation and protected
account access all complete successfully. The local `.env.local` remains ignored
by Git.

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

### Later stages and submissions

Add each later feature or submission below this line, keeping all earlier stage
records unchanged. Do not invent a commit hash before the corresponding commit
has been created.

```md
### Stage 5 — Short descriptive title

**Git checkpoint:** `abcdef1` — `commit subject`
**Status:** Pending / committed and pushed to `origin/main`.

- Describe the user-visible feature.
- Describe the relevant data, authentication or security change.
- Record the tests or manual verification completed.
```
