# Production deployment

SilverLink Health uses Firebase Hosting for the Vue/PWA frontend and Firestore
Security Rules. The authenticated server-side API remains on Alibaba Cloud
Function Compute. This arrangement works on the Firebase Spark plan because it
does not deploy Firebase Cloud Functions or require a Hosting rewrite to a
billable Google Cloud service.

## Production endpoints

- Primary frontend: `https://sliverlink-health.web.app`
- Alternate Firebase frontend: `https://sliverlink-health.firebaseapp.com`
- Alibaba Cloud API: `https://silverlort-plan-hwzxoajaze.cn-hongkong.fcapp.run`

## One-time cloud configuration

Before the first Hosting deployment, update the Alibaba Cloud function's
`ALLOWED_ORIGINS` environment variable to this exact comma-separated value:

```text
http://localhost:5173,http://127.0.0.1:5173,https://sliverlink-health.web.app,https://sliverlink-health.firebaseapp.com
```

Redeploy the current Function Compute code after saving the environment change.
Do not change the anonymous HTTP-trigger setting: public `GET` routes remain
anonymous, while protected `POST` routes verify Firebase ID tokens themselves.

In Firebase Authentication, confirm that both Firebase Hosting domains appear
under **Settings → Authorised domains**. Firebase normally adds its default
Hosting domains automatically, but both entries must be present for Google
popup sign-in on the deployed site.

## Release procedure

1. Confirm `.env.local` contains all `VITE_FIREBASE_*` values and the full
   `VITE_SUPPORT_PLAN_API_URL`. Never commit this file.
2. Run the quality gates:

   ```sh
   npm test
   npm run test:functions
   npm run build
   npm audit --omit=dev
   npm --prefix functions audit --omit=dev
   git diff --check
   ```

3. Authenticate the local Firebase CLI when necessary:

   ```sh
   npx firebase-tools login
   ```

4. Validate the selected project and deployment without publishing:

   ```sh
   npx firebase-tools use
   npx firebase-tools deploy --only hosting,firestore:rules --dry-run
   ```

5. Publish the already tested build and rules:

   ```sh
   npm run deploy:production
   ```

The production script builds first and deploys only Hosting and Firestore
Rules. It cannot deploy Firebase Functions, Storage or unrelated resources.

## Production acceptance checks

Record the deployment output and test both Firebase domains before marking D.4
verified. At minimum confirm:

- `/`, `/resources/lifeline-australia`, `/saved`, `/nearby`, `/login` and a
  not-found route load directly and after refresh;
- HTTPS responses include the configured CSP, permissions, referrer,
  clickjacking and content-type headers;
- HTML and service-worker responses revalidate, while hashed `/assets/` files
  use immutable caching;
- Email/Password and Google login work from the public origin;
- a verified member can send a support plan, save a rating and access their own
  profile without a CORS error;
- staff analytics and administrator metrics keep their role boundaries;
- the public REST endpoints still return only allowlisted public data;
- the PWA registers and previously saved public resources remain available
  offline; and
- desktop and `390 x 844` layouts have no horizontal page overflow or console
  errors.

If a release needs to be rolled back, use **Firebase Console → Hosting →
Release history** to restore the last known-good version. A frontend rollback
does not change the separately deployed Alibaba Cloud function.

## Stage 11 production release record

The first production release completed successfully on 19 August 2026. The
Firebase CLI compiled and published `firestore.rules`, uploaded 20 generated
Hosting files, finalised the Hosting version and released it to both default
Firebase domains. The local deployment cache under `.firebase/` is ignored.

Network acceptance confirmed that both domains and representative direct SPA
routes returned HTTPS `200`, including the resource detail, saved, nearby,
login and not-found routes. The public responses carried the configured
security headers, HTML and service-worker entry points used no-store caching,
and hash-named assets used immutable caching.

The Alibaba Cloud endpoint returned an allowed `204` CORS preflight for both
Firebase domains, retained a `401` boundary without a Firebase token, and its
public API returned the six allowlisted resources without personal or internal
rating fields. Browser checks confirmed the expected pages, route titles,
login controls, no console errors and no horizontal overflow across four
workflows at `390 x 844`.

The automated browser environment did not expose the Service Worker API and did
not hold a test Firebase account. A real-account Google sign-in, authenticated
support-plan request and public-origin offline reload remain the final manual
acceptance checks before D.4 is marked fully verified.
