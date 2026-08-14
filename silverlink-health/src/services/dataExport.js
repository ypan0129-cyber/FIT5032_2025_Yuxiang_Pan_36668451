const spreadsheetFormulaPattern = /^[\t\r ]*[=+\-@]/u

function normaliseCellValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return String(value)
}

function protectSpreadsheetCell(value) {
  const cellValue = normaliseCellValue(value)

  return spreadsheetFormulaPattern.test(cellValue) ? `'${cellValue}` : cellValue
}

function escapeCsvCell(value) {
  return `"${protectSpreadsheetCell(value).replaceAll('"', '""')}"`
}

export function prepareTableExport(rows, columns, selectedColumnKeys) {
  const selectedKeys = new Set(selectedColumnKeys)
  const exportColumns = columns.filter(
    (column) => column.exportable !== false && selectedKeys.has(column.key),
  )

  return {
    headers: exportColumns.map((column) => column.exportLabel || column.label),
    rows: rows.map((row) =>
      exportColumns.map((column) =>
        normaliseCellValue(
          typeof column.exportValue === 'function'
            ? column.exportValue(row)
            : row[column.key],
        ),
      ),
    ),
  }
}

export function createCsvContent(exportData) {
  const lines = [exportData.headers, ...exportData.rows].map((row) =>
    row.map(escapeCsvCell).join(','),
  )

  return `\uFEFF${lines.join('\r\n')}\r\n`
}

export function normaliseExportFilename(baseName, extension) {
  const safeBaseName = String(baseName ?? '')
    .trim()
    .toLocaleLowerCase('en-AU')
    .replace(/[^a-z0-9_-]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 80)

  return `${safeBaseName || 'silverlink-export'}.${extension}`
}

function triggerDownload(blob, fileName) {
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = fileName
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(downloadUrl)
}

export function downloadTableCsv({ rows, columns, selectedColumnKeys, fileName }) {
  const exportData = prepareTableExport(rows, columns, selectedColumnKeys)
  const csvContent = createCsvContent(exportData)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })

  triggerDownload(blob, normaliseExportFilename(fileName, 'csv'))
}

export async function createTablePdfBlob({ title, headers, rows }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const orientation = headers.length > 4 ? 'landscape' : 'portrait'
  const document = new jsPDF({ orientation, unit: 'pt', format: 'a4' })

  document.setProperties({
    title,
    subject: 'SilverLink Health table export',
    creator: 'SilverLink Health',
  })
  document.setFont('helvetica', 'bold')
  document.setFontSize(18)
  document.setTextColor(21, 37, 43)
  document.text(title, 40, 42)
  document.setFont('helvetica', 'normal')
  document.setFontSize(9)
  document.setTextColor(92, 106, 112)
  document.text(`Rows exported: ${rows.length}`, 40, 60)

  autoTable(document, {
    head: [headers],
    body: rows,
    startY: 76,
    margin: { top: 42, right: 40, bottom: 40, left: 40 },
    theme: 'grid',
    styles: {
      cellPadding: 5,
      font: 'helvetica',
      fontSize: 8,
      lineColor: [204, 214, 211],
      lineWidth: 0.5,
      overflow: 'linebreak',
      textColor: [36, 49, 57],
      valign: 'top',
    },
    headStyles: {
      fillColor: [36, 102, 95],
      fontStyle: 'bold',
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [244, 247, 246],
    },
  })

  const pageCount = document.getNumberOfPages()

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    document.setPage(pageNumber)
    document.setFont('helvetica', 'normal')
    document.setFontSize(8)
    document.setTextColor(92, 106, 112)
    document.text(
      `SilverLink Health | Page ${pageNumber} of ${pageCount}`,
      document.internal.pageSize.getWidth() - 40,
      document.internal.pageSize.getHeight() - 20,
      { align: 'right' },
    )
  }

  return new Blob([document.output('arraybuffer')], { type: 'application/pdf' })
}

export async function downloadTablePdf({
  rows,
  columns,
  selectedColumnKeys,
  fileName,
  title,
}) {
  const exportData = prepareTableExport(rows, columns, selectedColumnKeys)
  const blob = await createTablePdfBlob({ title, ...exportData })

  triggerDownload(blob, normaliseExportFilename(fileName, 'pdf'))
}
