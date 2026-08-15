import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

async function readSource(relativePath) {
  return readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

test('administrator route and navigation require the dedicated admin role', async () => {
  const [router, header] = await Promise.all([
    readSource('../src/router/index.js'),
    readSource('../src/components/AppHeader.vue'),
  ])

  assert.match(router, /path: '\/admin'[\s\S]*requiredRole: 'admin'/u)
  assert.match(header, /role === 'admin'[\s\S]*to="\/admin"/u)
})

test('account and rating views recognise administrator access separately', async () => {
  const [account, rating, denied] = await Promise.all([
    readSource('../src/views/AccountView.vue'),
    readSource('../src/components/ResourceRating.vue'),
    readSource('../src/views/AccessDeniedView.vue'),
  ])

  assert.match(account, /admin: 'Administrator'/u)
  assert.match(account, /to="\/admin">Open administration/u)
  assert.match(rating, /\['staff', 'admin'\]/u)
  assert.doesNotMatch(denied, /staff role required|Staff access required/u)
})
