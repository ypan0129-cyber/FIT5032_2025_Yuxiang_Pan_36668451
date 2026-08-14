export const MAX_TABLE_PAGE_SIZE = 10
export const DEFAULT_TABLE_PAGE_SIZE = 5

const tableCollator = new Intl.Collator('en-AU', {
  numeric: true,
  sensitivity: 'base',
})

export function normalisePageSize(pageSize) {
  const numericPageSize = Number(pageSize)

  if (!Number.isInteger(numericPageSize) || numericPageSize < 1) {
    return DEFAULT_TABLE_PAGE_SIZE
  }

  return Math.min(numericPageSize, MAX_TABLE_PAGE_SIZE)
}

export function filterTableRows(rows, columnKey, searchTerm) {
  const query = String(searchTerm ?? '').trim().toLocaleLowerCase('en-AU')

  if (!query || !columnKey) {
    return [...rows]
  }

  return rows.filter((row) =>
    String(row[columnKey] ?? '').toLocaleLowerCase('en-AU').includes(query),
  )
}

function compareTableValues(leftValue, rightValue) {
  if (
    typeof leftValue === 'number' &&
    Number.isFinite(leftValue) &&
    typeof rightValue === 'number' &&
    Number.isFinite(rightValue)
  ) {
    return leftValue - rightValue
  }

  return tableCollator.compare(String(leftValue), String(rightValue))
}

export function sortTableRows(rows, columnKey, direction = 'ascending') {
  if (!columnKey) {
    return [...rows]
  }

  const directionMultiplier = direction === 'descending' ? -1 : 1

  return rows
    .map((row, originalIndex) => ({ row, originalIndex }))
    .sort((left, right) => {
      const leftValue = left.row[columnKey]
      const rightValue = right.row[columnKey]
      const leftIsEmpty = leftValue === null || leftValue === undefined || leftValue === ''
      const rightIsEmpty = rightValue === null || rightValue === undefined || rightValue === ''

      if (leftIsEmpty || rightIsEmpty) {
        if (leftIsEmpty && rightIsEmpty) {
          return left.originalIndex - right.originalIndex
        }

        return leftIsEmpty ? 1 : -1
      }

      const comparison = compareTableValues(leftValue, rightValue)

      return comparison === 0
        ? left.originalIndex - right.originalIndex
        : comparison * directionMultiplier
    })
    .map(({ row }) => row)
}

export function paginateTableRows(rows, requestedPage, requestedPageSize) {
  const pageSize = normalisePageSize(requestedPageSize)
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const numericPage = Number(requestedPage)
  const page = Number.isInteger(numericPage)
    ? Math.min(Math.max(numericPage, 1), pageCount)
    : 1
  const startOffset = (page - 1) * pageSize
  const pageRows = rows.slice(startOffset, startOffset + pageSize)

  return {
    rows: pageRows,
    page,
    pageCount,
    pageSize,
    totalRows: rows.length,
    startIndex: pageRows.length ? startOffset + 1 : 0,
    endIndex: startOffset + pageRows.length,
  }
}
