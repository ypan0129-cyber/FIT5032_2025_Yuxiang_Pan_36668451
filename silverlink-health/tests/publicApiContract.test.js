import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

async function readContract() {
  const path = fileURLToPath(new URL('../docs/openapi.json', import.meta.url))
  return JSON.parse(await readFile(path, 'utf8'))
}

test('OpenAPI contract documents both anonymous versioned GET endpoints', async () => {
  const contract = await readContract()
  const listOperation = contract.paths['/api/v1/resources']?.get
  const summaryOperation = contract.paths['/api/v1/resources/{resourceId}/summary']?.get

  assert.equal(contract.openapi, '3.1.0')
  assert.deepEqual(contract.security, [])
  assert.match(contract.servers[0].url, /^https:\/\//u)
  assert.ok(listOperation)
  assert.ok(summaryOperation)
  assert.ok(listOperation.responses['200'].headers['Cache-Control'])
  assert.ok(summaryOperation.responses['200'].headers['Cache-Control'])
  assert.equal(summaryOperation.parameters[0].schema.enum.length, 6)
})

test('OpenAPI public response schemas exclude personal and internal rating fields', async () => {
  const contract = await readContract()
  const publicSchemas = {
    PublicResource: contract.components.schemas.PublicResource,
    ResourceIdentity: contract.components.schemas.ResourceIdentity,
    RatingSummary: contract.components.schemas.RatingSummary,
  }
  const json = JSON.stringify(publicSchemas)

  assert.doesNotMatch(
    json,
    /"(?:uid|email|displayName|role|providerMessageId|score|scoreTotal|scoreDistribution)"/u,
  )
  assert.deepEqual(
    Object.keys(publicSchemas.RatingSummary.properties).sort(),
    ['averageScore', 'ratingCount'],
  )
})
