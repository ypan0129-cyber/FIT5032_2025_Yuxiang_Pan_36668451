<script setup>
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { computed, ref } from 'vue'
import { Bar } from 'vue-chartjs'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const mode = ref('average')
const readyRows = computed(() => props.rows.filter((row) => row.status === 'ready'))
const hasData = computed(() => readyRows.value.some((row) => row.ratingCount > 0))
const modeLabel = computed(() => (mode.value === 'average' ? 'Average score' : 'Rating volume'))

function wrapLabel(label) {
  const lines = []
  let currentLine = ''

  for (const word of label.split(' ')) {
    const candidate = currentLine ? `${currentLine} ${word}` : word

    if (candidate.length > 17 && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = candidate
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

const chartData = computed(() => ({
  labels: readyRows.value.map((row) => wrapLabel(row.title)),
  datasets: [
    {
      label: modeLabel.value,
      data: readyRows.value.map((row) =>
        mode.value === 'average' ? row.averageScore : row.ratingCount,
      ),
      backgroundColor: mode.value === 'average' ? '#147d64' : '#9b4d6f',
      borderRadius: 4,
      borderSkipped: false,
      maxBarThickness: 54,
    },
  ],
}))
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    tooltip: {
      callbacks: {
        title: (contexts) => readyRows.value[contexts[0]?.dataIndex]?.title || '',
        label: (context) =>
          mode.value === 'average'
            ? `Average score: ${Number(context.raw).toFixed(1)} / 5`
            : `Ratings: ${context.raw}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#3f514c',
        autoSkip: false,
        maxRotation: 0,
        minRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      max: mode.value === 'average' ? 5 : undefined,
      ticks: {
        color: '#3f514c',
        precision: mode.value === 'average' ? 1 : 0,
      },
    },
  },
}))
const chartAriaLabel = computed(
  () => `${modeLabel.value} by mental health resource. Equivalent values are available in the table below.`,
)
</script>

<template>
  <div class="rating-chart">
    <div class="rating-chart__heading">
      <h2>Rating analytics</h2>
      <div class="rating-chart__modes" role="group" aria-label="Chart measure">
        <button
          type="button"
          :aria-pressed="mode === 'average'"
          @click="mode = 'average'"
        >
          Average score
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'volume'"
          @click="mode = 'volume'"
        >
          Rating volume
        </button>
      </div>
    </div>

    <p v-if="isLoading" class="rating-chart__state" role="status">Loading chart data...</p>
    <p v-else-if="!hasData" class="rating-chart__state">No rating data is available yet.</p>
    <div v-else class="rating-chart__canvas">
      <Bar
        :key="mode"
        :data="chartData"
        :options="chartOptions"
        role="img"
        :aria-label="chartAriaLabel"
      />
    </div>
  </div>
</template>

<style scoped>
.rating-chart {
  margin-bottom: 36px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--colour-border);
}

.rating-chart__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.rating-chart__heading h2 {
  margin: 0;
  font-size: 1.4rem;
}

.rating-chart__modes {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 3px;
  border: 1px solid var(--colour-border);
  border-radius: 6px;
  background: var(--colour-surface);
}

.rating-chart__modes button {
  min-height: 40px;
  padding: 7px 13px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--colour-muted);
  font-weight: 700;
}

.rating-chart__modes button[aria-pressed='true'] {
  background: #ffffff;
  color: var(--colour-heading);
  box-shadow: 0 1px 3px rgb(25 48 42 / 14%);
}

.rating-chart__canvas {
  position: relative;
  width: 100%;
  height: 360px;
}

.rating-chart__state {
  min-height: 180px;
  display: grid;
  place-items: center;
  margin: 0;
  color: var(--colour-muted);
  text-align: center;
}

@media (max-width: 575px) {
  .rating-chart__heading {
    align-items: stretch;
    flex-direction: column;
  }

  .rating-chart__modes {
    width: 100%;
  }

  .rating-chart__modes button {
    padding-inline: 8px;
  }

  .rating-chart__canvas {
    height: 330px;
  }
}

</style>
