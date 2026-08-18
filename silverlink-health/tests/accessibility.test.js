import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { getDocumentTitle } from '../src/utils/accessibility.js'

async function readSource(relativePath) {
  return readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

test('document titles use a stable application suffix and fallback', () => {
  assert.equal(getDocumentTitle('Resources'), 'Resources | SilverLink Health')
  assert.equal(getDocumentTitle('  '), 'SilverLink Health')
  assert.equal(getDocumentTitle(null), 'SilverLink Health')
})

test('router defines page titles and moves focus to the main landmark after navigation', async () => {
  const router = await readSource('../src/router/index.js')

  assert.match(router, /meta: \{ title: 'Home' \}/u)
  assert.match(router, /meta: \{ title: 'Resources' \}/u)
  assert.match(router, /router\.afterEach/u)
  assert.match(router, /document\.title = getDocumentTitle\(to\.meta\.title\)/u)
  assert.match(router, /focusMainContent\(document\)/u)
})

test('mobile navigation supports Escape and returns focus to its trigger', async () => {
  const header = await readSource('../src/components/AppHeader.vue')

  assert.match(header, /ref="menuButton"/u)
  assert.match(header, /event\.key === 'Escape'/u)
  assert.match(header, /menuButton\.value\?\.focus\(\)/u)
  assert.match(header, /:aria-expanded="isMenuOpen"/u)
})

test('map, external links and motion preferences have accessible alternatives', async () => {
  const [map, resourceDetail, mapView, style] = await Promise.all([
    readSource('../src/components/ServiceMap.vue'),
    readSource('../src/views/ResourceDetailView.vue'),
    readSource('../src/views/MapView.vue'),
    readSource('../src/style.css'),
  ])

  assert.match(map, /role="region"/u)
  assert.match(map, /aria-describedby="service-map-description"/u)
  assert.doesNotMatch(map, /role="application"/u)
  assert.match(resourceDetail, /opens in a new tab/u)
  assert.match(mapView, /opens in a new tab/u)
  assert.match(style, /prefers-reduced-motion/u)
  assert.match(style, /forced-colors: active/u)
})

test('completed workflows retain semantic form, table and chart contracts', async () => {
  const [app, dataTable, chart, supportPlan] = await Promise.all([
    readSource('../src/App.vue'),
    readSource('../src/components/DataTable.vue'),
    readSource('../src/components/RatingAnalyticsChart.vue'),
    readSource('../src/views/SupportPlanView.vue'),
  ])

  assert.match(app, /id="main-content" tabindex="-1"/u)
  assert.match(dataTable, /<caption class="sr-only">/u)
  assert.match(dataTable, /aria-sort="getAriaSort\(column\)"/u)
  assert.match(chart, /role="img"/u)
  assert.match(chart, /Equivalent values are available in the table below/u)
  assert.match(supportPlan, /aria-describedby/u)
  assert.match(supportPlan, /aria-invalid/u)
})
