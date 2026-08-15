# Cloud API function

This package runs the support-plan and rating-analytics workflows as an Alibaba
Cloud Function Compute event function. The HTTP trigger is public at the cloud
layer because browser clients cannot create Alibaba Cloud request signatures.
The function still requires and verifies a Firebase ID token on every `POST`
request.

The function reads the authenticated member role from Firestore, applies the
email quota, creates the PDF in memory and sends it through Resend. Support-plan
content is not persisted. Rating writes run in a Firestore transaction that
updates the member's private rating and the public aggregate together.

## API routes

| Route | Required role | Purpose |
| --- | --- | --- |
| `POST /` or `/support-plan` | `member` with verified email | Send the support-plan email and PDF. |
| `POST /ratings/{resourceId}` | `member` | Save one score and update its aggregate. |
| `POST /rating-analytics/rebuild` | `staff` | Rebuild all six aggregates from legacy ratings. |

All routes reject missing or revoked Firebase ID tokens. Firestore rules allow
clients to read only their own rating, expose only known aggregate documents,
and prevent browser clients from writing either data type.

## Function Compute configuration

- Region: China (Hong Kong), `cn-hongkong`
- Function type: Event function
- Runtime: Node.js 20
- Handler: `src/index.handler`
- Memory: 512 MB
- Timeout: 60 seconds
- Internet access: enabled
- HTTP trigger authentication: anonymous
- HTTP methods: `POST` and `OPTIONS`

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
