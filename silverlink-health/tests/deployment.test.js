import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

async function readJson(relativePath) {
  const source = await readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

  return JSON.parse(source)
}

function getHeaders(hosting, source) {
  const rule = hosting.headers.find((entry) => entry.source === source)

  return Object.fromEntries(rule?.headers.map(({ key, value }) => [key, value]) || [])
}

test('Firebase Hosting publishes the production build with SPA route fallback', async () => {
  const [firebaseConfig, projectConfig] = await Promise.all([
    readJson('../firebase.json'),
    readJson('../.firebaserc'),
  ])

  assert.equal(projectConfig.projects.default, 'sliverlink-health')
  assert.equal(firebaseConfig.hosting.public, 'dist')
  assert.deepEqual(firebaseConfig.hosting.rewrites, [
    { source: '**', destination: '/index.html' },
  ])
  assert.equal(firebaseConfig.emulators.hosting.host, '127.0.0.1')
  assert.equal(firebaseConfig.emulators.hosting.port, 5002)
})

test('Firebase Hosting sends production security headers on every route', async () => {
  const { hosting } = await readJson('../firebase.json')
  const headers = getHeaders(hosting, '**')
  const policy = headers['Content-Security-Policy']

  assert.match(policy, /default-src 'self'/u)
  assert.match(policy, /frame-ancestors 'none'/u)
  assert.match(policy, /script-src 'self' https:\/\/apis\.google\.com/u)
  assert.match(policy, /https:\/\/silverlort-plan-hwzxoajaze\.cn-hongkong\.fcapp\.run/u)
  assert.doesNotMatch(policy, /localhost|127\.0\.0\.1|ws:/u)
  assert.equal(headers['Cache-Control'], 'no-cache, no-store, must-revalidate')
  assert.equal(headers['Permissions-Policy'], 'camera=(), geolocation=(self), microphone=()')
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin')
  assert.equal(headers['X-Content-Type-Options'], 'nosniff')
  assert.equal(headers['X-Frame-Options'], 'DENY')
})

test('hashed assets are immutable while the PWA entry points revalidate', async () => {
  const { hosting } = await readJson('../firebase.json')

  assert.equal(
    getHeaders(hosting, '/assets/**')['Cache-Control'],
    'public, max-age=31536000, immutable',
  )

  for (const source of ['/index.html', '/sw.js', '/registerSW.js', '/manifest.webmanifest']) {
    assert.equal(
      getHeaders(hosting, source)['Cache-Control'],
      'no-cache, no-store, must-revalidate',
    )
  }
})

test('deployment scripts build before publishing only authorised Firebase targets', async () => {
  const { scripts } = await readJson('../package.json')

  assert.equal(scripts['deploy:hosting'], 'npm run build && firebase deploy --only hosting')
  assert.equal(
    scripts['deploy:production'],
    'npm run build && firebase deploy --only hosting,firestore:rules',
  )
  assert.doesNotMatch(scripts['deploy:production'], /functions|storage|database/u)
})
