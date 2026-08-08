# FIT5032 Assessed Lab 9: Alibaba Cloud Guide

## Implemented work

- `aliyun-fc/app.js`: an Express Web Function prepared for Alibaba Cloud Function Compute.
- `GET /countBooks`: counts records in the bundled JSON dataset or a configured Firestore collection.
- `GET /sellBookData`: returns the records as a priced JSON data product.
- `Book Counter`: a Vue page that calls `countBooks` with Axios.
- `Book Data Marketplace`: a Vue page that calls `sellBookData` and displays the quote and records.
- `aliyun-fc-deploy.zip`: the deployment package, including production dependencies.

## Local test

Open two terminals in the project folder.

Terminal 1:

```bash
PORT=9100 npm run start:aliyun
```

Terminal 2:

```bash
VITE_FUNCTIONS_BASE_URL=http://127.0.0.1:9100 npm run dev -- --port 5174
```

Open `http://127.0.0.1:5174/#/CountBookAPI`, click **Get Book Count**, and verify the result is `5`.

Open `http://127.0.0.1:5174/#/GetAllBookAPI` and verify that five records and an AUD 2.50 package quote are shown.

## Deploy to Alibaba Cloud Function Compute

1. Register an Alibaba Cloud account, complete real-name verification, and activate Function Compute.
2. Open `https://fcnext.console.aliyun.com`.
3. Select a mainland China region, such as China (Hangzhou).
4. Select **Function Management > Function List > Create Function**.
5. Select **Web Function**.
6. Use these settings:

```text
Function name: fit5032-lab9-book-api
vCPU: 0.35
Memory: 512 MB
Minimum instances: 0
Single-instance concurrency: 20
Runtime: Custom Runtime
Upload method: ZIP package
Startup command: node app.js
Listening port: 9000
Execution timeout: 60 seconds
```

7. Upload `aliyun-fc-deploy.zip` from the project root.
8. Do not enable VPC, NAS, OSS, or a minimum instance for this lab unless the console requires it.
9. Create or edit the HTTP trigger and set authentication to **No Authentication** for assessed-lab testing.
10. Deploy the code and wait until the function status is healthy.
11. Open the **Triggers** tab and copy the public address, similar to `https://example.cn-hangzhou.fcapp.run`.

Test all three URLs:

```text
https://YOUR_FC_URL/
https://YOUR_FC_URL/countBooks
https://YOUR_FC_URL/sellBookData
```

The count endpoint must return JSON containing `"count": 5`.

## Connect the Vue application

Create `.env.local` in the project root and add the trigger base URL without a trailing slash:

```text
VITE_FUNCTIONS_BASE_URL=https://YOUR_FC_URL
```

Restart the frontend:

```bash
npm run dev
```

Verify that both application pages now display the `fcapp.run` endpoints instead of `127.0.0.1`.

## Optional Firestore mode for Task 9.2

The cloud function is still hosted by Alibaba Cloud. Firestore is used only as the source dataset when the assessment requires it.

1. Create a Firebase project on the free plan and create a `books` collection.
2. Create a dedicated Google Cloud service account with the **Cloud Datastore Viewer** role only.
3. Download its JSON key and convert it to one-line Base64 on macOS:

```bash
base64 -i /absolute/path/to/service-account.json | tr -d '\n'
```

4. In Alibaba Cloud Function Compute, add these environment variables:

```text
DATA_SOURCE=firestore
FIREBASE_SERVICE_ACCOUNT_BASE64=the-generated-base64-value
FIRESTORE_COLLECTION=books
```

5. Deploy or restart the function and test `/sellBookData` again.
6. Confirm the response contains `"source": "firestore"` and the Vue page shows **Live Firestore data**.

Never commit or screenshot the service-account key, its Base64 value, passwords, billing details, or verification codes.

## Submission screenshots

Screenshots showing `127.0.0.1` prove local testing only and should not be used as final deployment evidence.

### Task 9.1: Pass and Credit

1. Alibaba Cloud Function Compute function details: show `fit5032-lab9-book-api`, its healthy/deployed status, region, and your account identity in the same screenshot.
2. Trigger configuration: show the public `fcapp.run` URL and **No Authentication** setting. Keep your account identity visible.
3. Browser > Book Counter: show the returned number, the `fcapp.run/countBooks` endpoint, and the browser address bar.
4. Optional: open `/countBooks` directly and show the JSON response.

### Task 9.2: Distinction and High Distinction

1. VS Code: show the `loadBooks` and `/sellBookData` sections in `aliyun-fc/app.js`.
2. Browser > Book Data Marketplace: show the data-source badge, record count, price per record, package quote, and delivered catalogue.
3. If Firestore mode is used, show the Firestore `books` collection in a separate screenshot, without exposing credentials.

Place the screenshots in one PDF in this order: cloud deployment, trigger URL, running count result, HD function code, marketplace result, and Firestore source data when used.
