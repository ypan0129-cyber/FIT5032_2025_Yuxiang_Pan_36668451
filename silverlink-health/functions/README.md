# Cloud API function

This package runs the public resource API, support-plan, rating-analytics and
administrator workflows as an Alibaba Cloud Function Compute event function.
The versioned public API accepts anonymous `GET` requests. Every `POST` route
still requires and verifies a Firebase ID token because browser clients cannot
create Alibaba Cloud request signatures.

The function reads the authenticated member role from Firestore, applies the
email quota, creates the PDF in memory and sends it through Resend. Support-plan
content is not persisted. Rating writes run in a Firestore transaction that
updates the member's private rating and the public aggregate together. The
administrator metrics route reads only the fields needed to return system-level
counts and never returns user identifiers or contact details.

## API routes

| Route | Access | Purpose |
| --- | --- | --- |
| `GET /api/v1/resources` | Public | List the six published support resources. |
| `GET /api/v1/resources/{resourceId}/summary` | Public | Read a privacy-safe average score and rating count. |
| `POST /` or `/support-plan` | `member` with verified email | Send the support-plan email and PDF. |
| `POST /ratings/{resourceId}` | `member` | Save one score and update its aggregate. |
| `POST /rating-analytics/rebuild` | `staff` | Rebuild all six aggregates from legacy ratings. |
| `POST /admin/metrics` | `admin` | Return aggregate user-role, rating and current email-dispatch metrics. |

Public routes allow cross-origin reads, return versioned JSON and use short
`Cache-Control` lifetimes. Their OpenAPI 3.1 contract is in
`docs/openapi.json`. All POST routes reject missing or revoked Firebase ID
tokens. The server reads the caller's Firestore profile before performing a
role-protected operation.
Firestore rules allow clients to read only their own profile and rating, expose
only known aggregate documents, and prevent browser clients from listing
administrative source collections.

## Function Compute configuration

- Region: China (Hong Kong), `cn-hongkong`
- Function type: Event function
- Runtime: Node.js 20
- Handler: `src/index.handler`
- Memory: 512 MB
- Timeout: 60 seconds
- Internet access: enabled
- HTTP trigger authentication: anonymous
- HTTP methods: `GET`, `POST` and `OPTIONS`

Hong Kong is used so outbound access to Firebase and Resend does not depend on
the availability of Google services from a mainland China region.

## Environment variables

Configure these values in Function Compute. Never put their real values in
Git, application logs or chat messages.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend sending credential. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | One-line Firebase Admin service-account JSON. |
| `EMAIL_FROM` | Optional verified sender; defaults to `SilverLink Health <onboarding@resend.dev>`. |
| `ALLOWED_ORIGINS` | Comma-separated exact frontend origins. Defaults to the two local Vite origins. |

Instead of `FIREBASE_SERVICE_ACCOUNT_JSON`, the function also accepts
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`.

## Upload package

Install production dependencies and create the ignored upload archive from
this directory:

```sh
npm ci --omit=dev
zip -r silverlink-support-plan-fc.zip package.json package-lock.json src node_modules
```

After the HTTP trigger is deployed, set `VITE_SUPPORT_PLAN_API_URL` in the
frontend `.env.local` file to the full HTTPS trigger URL and restart Vite. The
build injects only that URL's exact origin into the Content Security Policy.

Deploy `firestore.rules` after updating the function. Sign in with the existing
staff account, open `/staff`, and select **Rebuild analytics** once to create or
refresh the aggregate documents for ratings saved before this API was added.
