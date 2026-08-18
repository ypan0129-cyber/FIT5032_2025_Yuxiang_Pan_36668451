<script setup>
import 'leaflet/dist/leaflet.css'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  locations: {
    type: Array,
    required: true,
  },
  origin: {
    type: Object,
    default: null,
  },
  route: {
    type: Object,
    default: null,
  },
  selectedLocationId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select', 'map-error'])
const mapElement = ref(null)
let leaflet
let map
let markerLayer
let routeLayer

function getPointArray(point) {
  return [point.latitude, point.longitude]
}

function resetLayer(layer) {
  if (layer) {
    layer.clearLayers()
  }
}

function renderLayers() {
  if (!map || !leaflet || !markerLayer || !routeLayer) {
    return
  }

  resetLayer(markerLayer)
  resetLayer(routeLayer)

  const boundsPoints = []

  props.locations.forEach((location) => {
    const isSelected = location.id === props.selectedLocationId
    const marker = leaflet.circleMarker(getPointArray(location), {
      radius: isSelected ? 10 : 7,
      color: isSelected ? '#164b46' : '#24665f',
      fillColor: isSelected ? '#e0a21a' : '#24665f',
      fillOpacity: 0.95,
      weight: 2,
    })

    marker.bindTooltip(location.name, { direction: 'top', offset: [0, -8] })
    marker.on('click', () => emit('select', location.id))
    marker.addTo(markerLayer)
    boundsPoints.push(getPointArray(location))
  })

  if (props.origin) {
    const originPoint = getPointArray(props.origin)
    leaflet
      .circleMarker(originPoint, {
        radius: 8,
        color: '#742525',
        fillColor: '#b03a3a',
        fillOpacity: 0.9,
        weight: 2,
      })
      .bindTooltip('Your starting point', { direction: 'top', offset: [0, -8] })
      .addTo(markerLayer)
    boundsPoints.push(originPoint)
  }

  if (props.route?.path?.length > 1) {
    const routePoints = props.route.path.map(getPointArray)
    leaflet
      .polyline(routePoints, {
        color: '#e0a21a',
        opacity: 0.95,
        weight: 5,
      })
      .addTo(routeLayer)
    map.fitBounds(routePoints, { padding: [34, 34], maxZoom: 14 })
  } else if (boundsPoints.length > 1) {
    map.fitBounds(boundsPoints, { padding: [34, 34], maxZoom: 13 })
  } else if (boundsPoints.length === 1) {
    map.setView(boundsPoints[0], 12)
  }
}

onMounted(async () => {
  try {
    const leafletModule = await import('leaflet')
    leaflet = leafletModule.default || leafletModule
    map = leaflet.map(mapElement.value, {
      center: [-37.8136, 144.9631],
      zoom: 10,
      scrollWheelZoom: false,
    })
    leaflet
      .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      })
      .addTo(map)
    markerLayer = leaflet.layerGroup().addTo(map)
    routeLayer = leaflet.layerGroup().addTo(map)
    renderLayers()
    await nextTick()
    map.invalidateSize()
  } catch (error) {
    emit('map-error', error)
  }
})

watch(
  () => [props.locations, props.origin, props.route, props.selectedLocationId],
  () => renderLayers(),
  { deep: true },
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
  }
})
</script>

<template>
  <div class="service-map">
    <div
      ref="mapElement"
      class="service-map__canvas"
      role="region"
      aria-label="Interactive map of nearby mental health access points"
      aria-describedby="service-map-description"
    ></div>
    <p id="service-map-description" class="service-map__note">
      Map data &copy; OpenStreetMap contributors. Use the service list below if you do not use the
      map.
    </p>
  </div>
</template>

<style scoped>
.service-map {
  min-width: 0;
}

.service-map__canvas {
  min-height: 460px;
  border: 1px solid var(--colour-border);
  border-radius: var(--radius);
  background: #dcebe7;
}

.service-map__note {
  margin: 8px 0 0;
  color: var(--colour-muted);
  font-size: 0.78rem;
}

@media (max-width: 767px) {
  .service-map__canvas {
    min-height: 360px;
  }
}
</style>
