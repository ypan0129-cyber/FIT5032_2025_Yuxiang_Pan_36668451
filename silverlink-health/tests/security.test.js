import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { containsUnsafeMarkup, getSafeRedirectTarget } from '../src/utils/security.js'

test('getSafeRedirectTarget keeps valid application routes', () => {
  assert.equal(getSafeRedirectTarget('/account'), '/account')
  assert.equal(getSafeRedirectTarget('/staff?from=login#summary'), '/staff?from=login#summary')
})

test('getSafeRedirectTarget rejects external and malformed redirects', () => {
  assert.equal(getSafeRedirectTarget('https://example.com'), '/account')
  assert.equal(getSafeRedirectTarget('//example.com'), '/account')
  assert.equal(getSafeRedirectTarget('/\\example.com'), '/account')
  assert.equal(getSafeRedirectTarget('javascript:alert(1)'), '/account')
  assert.equal(getSafeRedirectTarget(null), '/account')
})

test('containsUnsafeMarkup detects HTML delimiters in plain text input', () => {
  assert.equal(containsUnsafeMarkup('Jane Citizen'), false)
  assert.equal(containsUnsafeMarkup('<script>alert(1)</script>'), true)
  assert.equal(containsUnsafeMarkup('Jane > Citizen'), true)
})

test('application source avoids direct HTML injection APIs', async () => {
  const sourceDirectory = fileURLToPath(new URL('../src/', import.meta.url))
  const sourceEntries = await readdir(sourceDirectory, { recursive: true, withFileTypes: true })
  const sourceFiles = sourceEntries
    .filter((entry) => entry.isFile() && /\.(js|vue)$/u.test(entry.name))
    .map((entry) => `${entry.parentPath}/${entry.name}`)
  const source = (await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))).join('\n')

  assert.doesNotMatch(source, /\bv-html\b|\.innerHTML\b|insertAdjacentHTML/u)
})

test('development and document CSP allow the Google authentication loader', async () => {
  const [indexHtml, viteConfig] = await Promise.all([
    readFile(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8'),
    readFile(fileURLToPath(new URL('../vite.config.js', import.meta.url)), 'utf8'),
  ])
  const googleLoaderSource = /script-src 'self' https:\/\/apis\.google\.com/u

  assert.match(indexHtml, googleLoaderSource)
  assert.match(viteConfig, googleLoaderSource)
})
