# SilverLink Health

SilverLink Health is a Vue 3 web application that helps older Australians find mental health support services.

## Current stage

Stage 3 adds role-based page access and a helpfulness rating for every support resource. Members can submit one score from 1 to 5 for each resource and update that score later. Everyone can view the aggregate average and rating count. Authorised staff accounts can open a protected resource review workspace.

All new accounts are created with the `member` role. The role is written by the application as a fixed value and enforced again by Firestore Security Rules; users cannot choose or elevate their own role. A Firebase administrator can assign the `staff` role by editing an existing `users/{uid}` document in the Firestore console. Staff accounts can access `/staff`, while member accounts are redirected to the access-denied page.

The public directory still reads its six service records from the local JavaScript data structure. Ratings are stored at `resources/{resourceId}/ratings/{uid}`. Using the authenticated user ID as the document ID ensures that one member has only one rating per resource. Firestore Security Rules validate the resource ID, require an integer score from 1 to 5, and prevent users from writing ratings for another account. Passwords and email addresses are not stored in Firestore.

## Firebase setup

1. Copy `.env.example` to `.env.local`.
2. Add the Firebase Web app configuration for the `sliverlink-health` project to `.env.local`.
3. Enable **Authentication → Sign-in method → Email/Password**.
4. Create a Cloud Firestore database in production mode. This project uses the Sydney region (`australia-southeast1`).
5. Publish `firestore.rules` in the Firebase console, or deploy it with `npx firebase-tools deploy --only firestore:rules`.
6. To create a staff account, register a normal member, locate its UID in Firebase Authentication, open the matching `users/{uid}` document, and change only the `role` field from `member` to `staff`. Refresh or sign in again before testing `/staff`.

The real `.env.local` file is ignored by Git. Never add a Firebase service-account private key to this repository. Firebase Web configuration values are client configuration; access control is enforced by Authentication and Firestore Security Rules.

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

**Planned commit message:** `feat: add staff access and resource ratings`
**Status:** Implementation complete locally; awaiting the user's commit and push.

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

### Later stages and submissions

Add each later feature or submission below this line, keeping all earlier stage
records unchanged. Do not invent a commit hash before the corresponding commit
has been created.

```md
### Stage 4 — Short descriptive title

**Git checkpoint:** `abcdef1` — `commit subject`
**Status:** Pending / committed and pushed to `origin/main`.

- Describe the user-visible feature.
- Describe the relevant data, authentication or security change.
- Record the tests or manual verification completed.
```
