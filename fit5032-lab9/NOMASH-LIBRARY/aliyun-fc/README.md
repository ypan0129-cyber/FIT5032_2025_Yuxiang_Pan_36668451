# Alibaba Cloud Function Compute deployment

This folder is a Node.js Express Web Function for Alibaba Cloud Function Compute. It exposes:

- `GET /countBooks`
- `GET /sellBookData`

By default, both endpoints use `books.json`. To demonstrate the HD Firestore requirement, configure the deployed function to read the existing Firestore `books` collection.

## Local test

```bash
npm install
PORT=9000 npm start
```

Then test:

```bash
curl http://127.0.0.1:9000/countBooks
curl http://127.0.0.1:9000/sellBookData
```

## Build the upload package

Install production dependencies and create the ZIP file:

```bash
npm install --omit=dev
npm run package
```

Upload `aliyun-fc-deploy.zip` from the parent project folder.

## Function Compute settings

- Function type: Web Function
- Runtime: Custom Runtime
- Upload method: ZIP package
- Startup command: `node app.js`
- Listening port: `9000`
- Memory: `512 MB`
- Minimum instances: `0`
- HTTP trigger authentication: No Authentication (for assessed-lab testing only)

The public trigger URL has a form similar to `https://example.cn-hangzhou.fcapp.run`. Use the same function for both endpoint paths.

## Optional Firestore mode for the HD task

Do not commit a Firebase service-account key. Create a narrowly scoped service account that can only read Firestore, download its JSON key, and convert it to a one-line Base64 value on macOS:

```bash
base64 -i /absolute/path/to/service-account.json | tr -d '\n'
```

Add these environment variables in the Alibaba Cloud function configuration:

```text
DATA_SOURCE=firestore
FIREBASE_SERVICE_ACCOUNT_BASE64=the-generated-base64-value
FIRESTORE_COLLECTION=books
```

Never include the Base64 value, key file, billing details, passwords, or verification codes in screenshots or Git.
