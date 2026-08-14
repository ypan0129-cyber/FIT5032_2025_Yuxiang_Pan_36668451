import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterTableRows,
  MAX_TABLE_PAGE_SIZE,
  normalisePageSize,
  paginateTableRows,
  sortTableRows,
} from '../src/utils/dataTable.js'

const rows = [
  { id: 'a', name: 'Lifeline Australia', category: 'Crisis support', score: 4.2 },
  { id: 'b', name: 'Beyond Blue', category: 'Anxiety and stress', score: null },
  { id: 'c', name: 'FriendLine', category: 'Social connection', score: 3.8 },
]

test('filterTableRows searches only the selected column without mutating rows', () => {
  assert.deepEqual(
    filterTableRows(rows, 'category', 'crisis').map((row) => row.id),
    ['a'],
  )
  assert.deepEqual(filterTableRows(rows, 'name', 'crisis'), [])
  assert.equal(rows.length, 3)
})

test('sortTableRows supports stable text and numeric ordering', () => {
  assert.deepEqual(
    sortTableRows(rows, 'name', 'ascending').map((row) => row.id),
    ['b', 'c', 'a'],
  )
  assert.deepEqual(
    sortTableRows(rows, 'score', 'descending').map((row) => row.id),
    ['a', 'c', 'b'],
  )
})

test('paginateTableRows clamps invalid pages and reports the visible range', () => {
  const result = paginateTableRows(
    Array.from({ length: 12 }, (_, index) => ({ id: index + 1 })),
    3,
    5,
  )

  assert.deepEqual(result.rows.map((row) => row.id), [11, 12])
  assert.deepEqual(
    {
      page: result.page,
      pageCount: result.pageCount,
      startIndex: result.startIndex,
      endIndex: result.endIndex,
    },
    { page: 3, pageCount: 3, startIndex: 11, endIndex: 12 },
  )
  assert.equal(paginateTableRows(rows, 99, 5).page, 1)
  assert.equal(paginateTableRows(Array.from({ length: 12 }), 99, 5).page, 3)
})

test('table page sizes never exceed the ten-row requirement', () => {
  assert.equal(normalisePageSize(0), 5)
  assert.equal(normalisePageSize(8), 8)
  assert.equal(normalisePageSize(50), MAX_TABLE_PAGE_SIZE)
  assert.equal(paginateTableRows(Array.from({ length: 20 }), 1, 50).rows.length, 10)
})
