# SilverLink Health

SilverLink Health is a Vue 3 web application that helps older Australians find mental health support services.

## Current stage

Stage 2 adds Firebase Authentication with email/password sign-in, a protected member account page, and a Firestore profile document for every registered member. The public resource directory continues to use local sample data until a later stage.

All new accounts are created with the `member` role. The role is written by the application as a fixed value and enforced again by Firestore Security Rules; users cannot choose or elevate their own role. Staff permissions will be added in a later stage by an administrator editing the role in the Firebase console.

## Firebase setup

1. Copy `.env.example` to `.env.local`.
2. Add the Firebase Web app configuration for the `sliverlink-health` project to `.env.local`.
3. Enable **Authentication → Sign-in method → Email/Password**.
4. Create a Cloud Firestore database in production mode. This project uses the Sydney region (`australia-southeast1`).
5. Publish `firestore.rules` in the Firebase console (or deploy it with the Firebase CLI).

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
