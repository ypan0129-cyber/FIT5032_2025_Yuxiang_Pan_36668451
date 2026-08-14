import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createCsvContent,
  normaliseExportFilename,
  prepareTableExport,
} from '../src/services/dataExport.js'

const columns = [
  { key: 'id', label: 'Internal ID', exportable: false },
  { key: 'name', label: 'Service' },
  { key: 'category', label: 'Concern' },
  { key: 'score', label: 'Average', exportValue: (row) => `${row.score} / 5` },
]

const rows = [
  {
    id: 'private-document-id',
    name: 'Example, "Support" Service',
    category: '=HYPERLINK("https://unsafe.example")',
    score: 4.5,
  },
]

test('prepareTableExport includes selected public columns in display order', () => {
  const result = prepareTableExport(rows, columns, ['name', 'score', 'id'])

  assert.deepEqual(result.headers, ['Service', 'Average'])
  assert.deepEqual(result.rows, [['Example, "Support" Service', '4.5 / 5']])
  assert.doesNotMatch(JSON.stringify(result), /private-document-id/u)
})

test('createCsvContent escapes punctuation and spreadsheet formulas', () => {
  const result = prepareTableExport(rows, columns, ['name', 'category'])
  const csv = createCsvContent(result)

  assert.match(csv, /^\uFEFF"Service","Concern"\r\n/u)
  assert.match(csv, /"Example, ""Support"" Service"/u)
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/unsafe\.example""\)"/u)
  assert.match(csv, /\r\n$/u)
})

test('normaliseExportFilename strips paths and unsupported characters', () => {
  assert.equal(normaliseExportFilename('../../Rating Summary 2026', 'pdf'), 'rating-summary-2026.pdf')
  assert.equal(normaliseExportFilename('', 'csv'), 'silverlink-export.csv')
})
