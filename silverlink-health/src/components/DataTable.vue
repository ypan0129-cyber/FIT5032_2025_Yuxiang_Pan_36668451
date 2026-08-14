<script setup>
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  X,
} from '@lucide/vue'
import { computed, ref, useId, watch } from 'vue'
import { downloadTableCsv, downloadTablePdf } from '../services/dataExport'
import {
  filterTableRows,
  normalisePageSize,
  paginateTableRows,
  sortTableRows,
} from '../utils/dataTable'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  caption: {
    type: String,
    required: true,
  },
  rowKey: {
    type: String,
    default: 'id',
  },
  initialSortKey: {
    type: String,
    default: '',
  },
  initialPageSize: {
    type: Number,
    default: 5,
  },
  emptyMessage: {
    type: String,
    default: 'No matching results.',
  },
  exportFileName: {
    type: String,
    default: '',
  },
  exportTitle: {
    type: String,
    default: '',
  },
})

const componentId = useId()
const searchableColumns = computed(() => props.columns.filter((column) => column.searchable))
const searchColumn = ref(searchableColumns.value[0]?.key || '')
const searchTerm = ref('')
const sortKey = ref(props.initialSortKey)
const sortDirection = ref('ascending')
const currentPage = ref(1)
const selectedPageSize = ref(normalisePageSize(props.initialPageSize))
const isExportPanelOpen = ref(false)
const isExporting = ref(false)
const exportMessage = ref('')
const exportError = ref('')

const exportableColumns = computed(() =>
  props.columns.filter((column) => column.exportable !== false),
)
const selectedExportColumnKeys = ref(exportableColumns.value.map((column) => column.key))
const filteredRows = computed(() =>
  filterTableRows(props.rows, searchColumn.value, searchTerm.value),
)
const sortedRows = computed(() =>
  sortTableRows(filteredRows.value, sortKey.value, sortDirection.value),
)
const pageResult = computed(() =>
  paginateTableRows(sortedRows.value, currentPage.value, selectedPageSize.value),
)
const searchColumnLabel = computed(
  () => searchableColumns.value.find((column) => column.key === searchColumn.value)?.label || '',
)
const canExport = computed(
  () =>
    selectedExportColumnKeys.value.length > 0 &&
    sortedRows.value.length > 0 &&
    !isExporting.value,
)

watch([searchColumn, searchTerm, selectedPageSize], () => {
  currentPage.value = 1
})

watch(
  () => pageResult.value.page,
  (validPage) => {
    currentPage.value = validPage
  },
)

function sortBy(column) {
  if (column.sortable === false) {
    return
  }

  if (sortKey.value === column.key) {
    sortDirection.value =
      sortDirection.value === 'ascending' ? 'descending' : 'ascending'
  } else {
    sortKey.value = column.key
    sortDirection.value = 'ascending'
  }

  currentPage.value = 1
}

function getAriaSort(column) {
  if (column.sortable === false) {
    return undefined
  }

  return sortKey.value === column.key ? sortDirection.value : 'none'
}

function getSortLabel(column) {
  if (sortKey.value !== column.key) {
    return `Sort by ${column.label} in ascending order`
  }

  const nextDirection = sortDirection.value === 'ascending' ? 'descending' : 'ascending'
  return `Sort by ${column.label} in ${nextDirection} order`
}

function clearSearch() {
  searchTerm.value = ''
}

function toggleExportPanel() {
  isExportPanelOpen.value = !isExportPanelOpen.value
  exportMessage.value = ''
  exportError.value = ''
}

async function exportTable(format) {
  if (!canExport.value) {
    return
  }

  isExporting.value = true
  exportMessage.value = ''
  exportError.value = ''

  const exportOptions = {
    rows: sortedRows.value,
    columns: props.columns,
    selectedColumnKeys: selectedExportColumnKeys.value,
    fileName: props.exportFileName,
  }

  try {
    if (format === 'csv') {
      downloadTableCsv(exportOptions)
    } else {
      await downloadTablePdf({
        ...exportOptions,
        title: props.exportTitle || props.caption,
      })
    }

    exportMessage.value = `${format.toUpperCase()} export downloaded.`
  } catch {
    exportError.value = `The ${format.toUpperCase()} export could not be created. Please try again.`
  } finally {
    isExporting.value = false
  }
}

function displayValue(value) {
  return value === null || value === undefined || value === '' ? 'Not available' : value
}
</script>

<template>
  <div class="data-table">
    <div
      v-if="searchableColumns.length"
      class="data-table__toolbar"
      role="search"
      :aria-label="`${caption} search`"
    >
      <div class="data-table__field">
        <label :for="`${componentId}-column`">Search column</label>
        <select :id="`${componentId}-column`" v-model="searchColumn">
          <option v-for="column in searchableColumns" :key="column.key" :value="column.key">
            {{ column.label }}
          </option>
        </select>
      </div>

      <div class="data-table__field data-table__field--search">
        <label :for="`${componentId}-search`">Search {{ searchColumnLabel }}</label>
        <div class="data-table__search-input">
          <Search :size="19" aria-hidden="true" />
          <input
            :id="`${componentId}-search`"
            v-model="searchTerm"
            type="search"
            :placeholder="`Search ${searchColumnLabel.toLowerCase()}`"
          />
          <button
            v-if="searchTerm"
            class="data-table__clear"
            type="button"
            aria-label="Clear table search"
            title="Clear table search"
            @click="clearSearch"
          >
            <X :size="18" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="exportFileName" class="data-table__export">
      <button
        class="button button--secondary"
        type="button"
        :aria-expanded="isExportPanelOpen"
        :aria-controls="`${componentId}-export-panel`"
        @click="toggleExportPanel"
      >
        <Download :size="18" aria-hidden="true" />
        Export current results
      </button>

      <div
        v-if="isExportPanelOpen"
        :id="`${componentId}-export-panel`"
        class="data-table__export-panel"
      >
        <fieldset>
          <legend>Columns to export</legend>
          <label v-for="column in exportableColumns" :key="column.key">
            <input
              v-model="selectedExportColumnKeys"
              type="checkbox"
              :value="column.key"
            />
            <span>{{ column.exportLabel || column.label }}</span>
          </label>
        </fieldset>

        <div class="data-table__export-summary">
          <p>{{ sortedRows.length }} {{ sortedRows.length === 1 ? 'row' : 'rows' }}</p>
          <div>
            <button
              class="button button--secondary"
              type="button"
              :disabled="!canExport"
              @click="exportTable('csv')"
            >
              <FileSpreadsheet :size="18" aria-hidden="true" />
              CSV
            </button>
            <button
              class="button button--primary"
              type="button"
              :disabled="!canExport"
              @click="exportTable('pdf')"
            >
              <FileText :size="18" aria-hidden="true" />
              {{ isExporting ? 'Creating...' : 'PDF' }}
            </button>
          </div>
        </div>

        <p v-if="!selectedExportColumnKeys.length" class="data-table__export-error">
          Select at least one column.
        </p>
        <p v-if="exportMessage" class="data-table__export-message" role="status">
          {{ exportMessage }}
        </p>
        <p v-if="exportError" class="data-table__export-error" role="alert">
          {{ exportError }}
        </p>
      </div>
    </div>

    <div
      class="data-table__scroll"
      role="region"
      :aria-label="`${caption}. Scroll horizontally to see all columns on small screens.`"
      tabindex="0"
    >
      <table>
        <caption class="sr-only">
          {{ caption }}
        </caption>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :aria-sort="getAriaSort(column)"
              :class="{ 'data-table__numeric': column.align === 'right' }"
            >
              <button
                v-if="column.sortable !== false"
                class="data-table__sort"
                type="button"
                :aria-label="getSortLabel(column)"
                @click="sortBy(column)"
              >
                <span>{{ column.label }}</span>
                <ArrowUp
                  v-if="sortKey === column.key && sortDirection === 'ascending'"
                  :size="17"
                  aria-hidden="true"
                />
                <ArrowDown
                  v-else-if="sortKey === column.key"
                  :size="17"
                  aria-hidden="true"
                />
                <ArrowUpDown v-else :size="17" aria-hidden="true" />
              </button>
              <span v-else>{{ column.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pageResult.rows" :key="row[rowKey]">
            <td
              v-for="column in columns"
              :key="column.key"
              :class="{ 'data-table__numeric': column.align === 'right' }"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ displayValue(row[column.key]) }}
              </slot>
            </td>
          </tr>
          <tr v-if="!pageResult.rows.length">
            <td :colspan="columns.length" class="data-table__empty">
              {{ emptyMessage }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="data-table__footer">
      <p aria-live="polite">
        Showing {{ pageResult.startIndex }}-{{ pageResult.endIndex }} of
        {{ pageResult.totalRows }} results
      </p>

      <div class="data-table__pagination">
        <label :for="`${componentId}-page-size`">Rows per page</label>
        <select :id="`${componentId}-page-size`" v-model.number="selectedPageSize">
          <option :value="5">5</option>
          <option :value="10">10</option>
        </select>
        <button
          class="icon-button"
          type="button"
          :disabled="pageResult.page === 1"
          aria-label="Previous page"
          title="Previous page"
          @click="currentPage -= 1"
        >
          <ChevronLeft :size="20" aria-hidden="true" />
        </button>
        <span>Page {{ pageResult.page }} of {{ pageResult.pageCount }}</span>
        <button
          class="icon-button"
          type="button"
          :disabled="pageResult.page === pageResult.pageCount"
          aria-label="Next page"
          title="Next page"
          @click="currentPage += 1"
        >
          <ChevronRight :size="20" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table {
  min-width: 0;
}

.data-table__toolbar {
  display: grid;
  grid-template-columns: minmax(180px, 0.7fr) minmax(260px, 1.3fr);
  gap: 18px;
  align-items: end;
  margin-bottom: 20px;
  padding: 20px;
  border: 1px solid var(--colour-border);
  border-radius: var(--radius);
  background: #ffffff;
}

.data-table__field {
  min-width: 0;
}

.data-table__field label {
  display: block;
  margin-bottom: 7px;
  color: var(--colour-heading);
  font-size: 0.88rem;
  font-weight: 700;
}

.data-table__field input,
.data-table__field select,
.data-table__pagination select {
  width: 100%;
  min-height: 46px;
  padding: 9px 11px;
  border: 1px solid #98a8a4;
  border-radius: 4px;
  background: #ffffff;
  color: var(--colour-heading);
}

.data-table__search-input {
  position: relative;
}

.data-table__search-input > svg {
  position: absolute;
  top: 13px;
  left: 12px;
  color: var(--colour-muted);
  pointer-events: none;
}

.data-table__search-input input {
  padding-inline: 40px 46px;
}

.data-table__clear {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--colour-muted);
}

.data-table__clear:hover {
  background: var(--colour-primary-light);
  color: var(--colour-primary-dark);
}

.data-table__export {
  margin-bottom: 20px;
}

.data-table__export-panel {
  margin-top: 14px;
  padding: 18px 20px;
  border: 1px solid var(--colour-border);
  border-radius: var(--radius);
  background: #ffffff;
}

.data-table__export-panel fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  margin: 0;
  padding: 0;
  border: 0;
}

.data-table__export-panel legend {
  width: 100%;
  margin-bottom: 10px;
  padding: 0;
  color: var(--colour-heading);
  font-size: 0.88rem;
  font-weight: 700;
}

.data-table__export-panel label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  font-size: 0.88rem;
}

.data-table__export-panel input {
  width: 19px;
  height: 19px;
  margin: 0;
  accent-color: var(--colour-primary);
}

.data-table__export-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--colour-border);
}

.data-table__export-summary p,
.data-table__export-message,
.data-table__export-error {
  margin: 0;
  font-size: 0.86rem;
}

.data-table__export-summary p {
  color: var(--colour-muted);
}

.data-table__export-summary > div {
  display: flex;
  gap: 10px;
}

.data-table__export-message,
.data-table__export-error {
  margin-top: 12px;
}

.data-table__export-message {
  color: var(--colour-primary-dark);
}

.data-table__export-error {
  color: #8f2f2f;
}

.data-table__scroll {
  overflow-x: auto;
  border: 1px solid var(--colour-border);
  border-radius: var(--radius);
  background: #ffffff;
}

table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--colour-border);
  text-align: left;
  vertical-align: top;
}

th {
  background: var(--colour-surface);
  color: var(--colour-heading);
  font-size: 0.84rem;
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr:hover {
  background: #f8faf9;
}

.data-table__sort {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-weight: 700;
  text-align: left;
}

.data-table__sort svg {
  flex: 0 0 auto;
  color: var(--colour-primary);
}

.data-table__numeric {
  text-align: right;
}

.data-table__numeric .data-table__sort {
  margin-left: auto;
}

.data-table__empty {
  padding-block: 34px;
  color: var(--colour-muted);
  text-align: center;
}

.data-table__footer {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 16px;
}

.data-table__footer p {
  margin: 0;
  color: var(--colour-muted);
  font-size: 0.86rem;
}

.data-table__pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.data-table__pagination label {
  font-size: 0.84rem;
  font-weight: 700;
}

.data-table__pagination select {
  width: 72px;
  min-height: 42px;
  padding-block: 7px;
}

.data-table__pagination .icon-button {
  display: grid;
}

.data-table__pagination span {
  min-width: 94px;
  font-size: 0.86rem;
  text-align: center;
}

@media (max-width: 767px) {
  .data-table__toolbar {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .data-table__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .data-table__pagination {
    width: 100%;
    flex-wrap: wrap;
  }

  .data-table__export-summary {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .data-table__pagination label {
    width: calc(100% - 82px);
  }

  .data-table__pagination {
    justify-content: space-between;
  }

  .data-table__export-summary > div,
  .data-table__export-summary .button {
    width: 100%;
  }
}
</style>
