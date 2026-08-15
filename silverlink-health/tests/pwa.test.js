import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

async function readSource(relativePath) {
  return readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

test('PWA configuration precaches only static assets without API runtime caches', async () => {
  const viteConfig = await readSource('../vite.config.js')
  const pwaStart = viteConfig.indexOf('VitePWA({')
  const pwaEnd = viteConfig.indexOf('\n      }),\n      {', pwaStart)
  const pwaConfig = viteConfig.slice(pwaStart, pwaEnd)

  assert.notEqual(pwaStart, -1)
  assert.notEqual(pwaEnd, -1)
  assert.match(pwaConfig, /registerType: 'autoUpdate'/u)
  assert.match(pwaConfig, /navigateFallback: '\/index\.html'/u)
  assert.match(pwaConfig, /runtimeCaching: \[\]/u)
  assert.match(pwaConfig, /\^\\\/api\\\//u)
  assert.match(
    pwaConfig,
    /account\|admin\|staff\|support-plan\|login\|register\|nearby/u,
  )
  assert.doesNotMatch(
    pwaConfig,
    /firebase|googleapis|fcapp|nominatim|openstreetmap|project-osrm/u,
  )
})

test('PWA manifest defines an installable standalone application shell', async () => {
  const [viteConfig, indexHtml] = await Promise.all([
    readSource('../vite.config.js'),
    readSource('../index.html'),
  ])

  assert.match(viteConfig, /name: 'SilverLink Health'/u)
  assert.match(viteConfig, /display: 'standalone'/u)
  assert.match(viteConfig, /start_url: '\/'/u)
  assert.match(viteConfig, /icon-192\.png/u)
  assert.match(viteConfig, /icon-512\.png/u)
  assert.match(indexHtml, /name="theme-color" content="#24665f"/u)
})

test('offline and saved routes are public while network-backed routes are guarded', async () => {
  const router = await readSource('../src/router/index.js')

  assert.match(router, /path: '\/saved', name: 'saved-resources'/u)
  assert.match(router, /path: '\/offline', name: 'offline'/u)
  assert.match(router, /path: '\/nearby'[\s\S]*requiresOnline: true/u)
  assert.match(router, /path: '\/account'[\s\S]*requiresAuth: true[\s\S]*requiresOnline: true/u)
  assert.match(router, /navigator\.onLine === false/u)
})

test('resource interfaces expose saved state and suppress live actions offline', async () => {
  const [app, header, card, detail] = await Promise.all([
    readSource('../src/App.vue'),
    readSource('../src/components/AppHeader.vue'),
    readSource('../src/components/ResourceCard.vue'),
    readSource('../src/views/ResourceDetailView.vue'),
  ])

  assert.match(app, /<ConnectivityStatus/u)
  assert.match(header, /to="\/saved">Saved resources/u)
  assert.match(card, /:aria-pressed="isSaved"/u)
  assert.match(card, /toggleSavedResource/u)
  assert.match(detail, /<ResourceRating v-if="isOnline"/u)
  assert.match(detail, /Website unavailable offline/u)
})
