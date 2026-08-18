<script setup>
import {
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Search,
} from '@lucide/vue'
import { computed, ref } from 'vue'
import ServiceMap from '../components/ServiceMap.vue'
import { serviceLocations } from '../data/serviceLocations'
import {
  geocodeAustralianLocation,
  getBrowserPosition,
  getDrivingRoute,
  getMapErrorMessage,
} from '../services/mapService'
import {
  formatDistance,
  formatDuration,
  rankLocationsByDistance,
} from '../utils/geolocation'

const searchQuery = ref('')
const origin = ref(null)
const originLabel = ref('')
const selectedLocationId = ref('')
const route = ref(null)
const isSearching = ref(false)
const isLocating = ref(false)
const isRouting = ref(false)
const searchError = ref('')
const routeError = ref('')
const mapError = ref('')

const rankedLocations = computed(() => {
  if (!origin.value) {
    return serviceLocations.map((location) => ({ ...location }))
  }

  return rankLocationsByDistance(origin.value, serviceLocations)
})

const selectedLocation = computed(() =>
  serviceLocations.find((location) => location.id === selectedLocationId.value),
)

const routeLink = computed(() => {
  if (!origin.value || !selectedLocation.value) {
    return ''
  }

  const originCoordinates = `${origin.value.latitude},${origin.value.longitude}`
  const destinationCoordinates = `${selectedLocation.value.latitude},${selectedLocation.value.longitude}`

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originCoordinates)}&destination=${encodeURIComponent(destinationCoordinates)}&travelmode=driving`
})

const isBusy = computed(() => isSearching.value || isLocating.value || isRouting.value)

function clearRoute() {
  route.value = null
  routeError.value = ''
}

function setOrigin(nextOrigin, label) {
  origin.value = nextOrigin
  originLabel.value = label
  selectedLocationId.value = ''
  clearRoute()
}

async function searchLocation() {
  isSearching.value = true
  searchError.value = ''
  clearRoute()

  try {
    const result = await geocodeAustralianLocation(searchQuery.value)
    setOrigin(result, result.label)
  } catch (error) {
    searchError.value = getMapErrorMessage(error)
  } finally {
    isSearching.value = false
  }
}

async function useCurrentLocation() {
  isLocating.value = true
  searchError.value = ''
  clearRoute()

  try {
    const result = await getBrowserPosition()
    setOrigin(result, 'Your current location')
  } catch (error) {
    searchError.value = getMapErrorMessage(error)
  } finally {
    isLocating.value = false
  }
}

function selectLocation(locationId) {
  selectedLocationId.value = locationId

  if (route.value && route.value.locationId !== locationId) {
    clearRoute()
  }
}

async function planRoute(location) {
  selectedLocationId.value = location.id
  routeError.value = ''

  if (!origin.value) {
    routeError.value = 'Choose a suburb, postcode or current location first.'
    return
  }

  isRouting.value = true

  try {
    const result = await getDrivingRoute(origin.value, location)
    route.value = {
      ...result,
      locationId: location.id,
    }
  } catch (error) {
    route.value = null
    routeError.value = getMapErrorMessage(error)
  } finally {
    isRouting.value = false
  }
}
</script>

<template>
  <section class="page-intro" aria-labelledby="map-title">
    <div class="site-container page-intro__inner">
      <p class="eyebrow">Nearby support</p>
      <h1 id="map-title">Find a service near you</h1>
      <p>Search a suburb or postcode, or use your current location to compare nearby public mental health access points.</p>
    </div>
  </section>

  <section class="section" aria-labelledby="map-search-title">
    <div class="site-container">
      <div class="map-search-panel">
        <div class="section-heading">
          <p class="eyebrow">Start point</p>
          <h2 id="map-search-title">Where are you starting from?</h2>
        </div>

        <form class="map-search-form" role="search" @submit.prevent="searchLocation">
          <div class="form-field map-search-form__query">
            <label for="location-search">Suburb or postcode</label>
            <div class="input-with-icon">
              <Search :size="20" aria-hidden="true" />
              <input
                id="location-search"
                v-model="searchQuery"
                type="search"
                autocomplete="postal-code"
                placeholder="For example, Clayton 3168"
                :disabled="isBusy"
              />
            </div>
          </div>
          <button class="button button--primary" type="submit" :disabled="isBusy">
            <Search :size="18" aria-hidden="true" />
            {{ isSearching ? 'Searching...' : 'Search area' }}
          </button>
          <button
            class="button button--secondary"
            type="button"
            :disabled="isBusy"
            @click="useCurrentLocation"
          >
            <LocateFixed :size="18" aria-hidden="true" />
            {{ isLocating ? 'Finding you...' : 'Use current location' }}
          </button>
        </form>

        <p class="field-hint">Your location is used for this search and route only. It is not saved.</p>
        <p v-if="originLabel" class="map-origin" role="status" aria-live="polite">
          <MapPin :size="18" aria-hidden="true" />
          Starting from <strong>{{ originLabel }}</strong>
        </p>
        <p v-if="searchError" class="form-notice form-notice--error" role="alert">
          {{ searchError }}
        </p>
      </div>

      <p v-if="mapError" class="form-notice form-notice--error" role="alert">{{ mapError }}</p>

      <div class="map-layout">
        <div class="map-layout__visual">
          <div class="results-heading">
            <div>
              <h2 id="map-visual-title">Service map</h2>
              <p>{{ rankedLocations.length }} access points shown</p>
            </div>
          </div>
          <ServiceMap
            :locations="rankedLocations"
            :origin="origin"
            :route="route"
            :selected-location-id="selectedLocationId"
            @select="selectLocation"
            @map-error="mapError = 'The map could not be loaded. Use the service list below.'"
          />
        </div>

        <aside class="map-route-panel" aria-labelledby="route-summary-title">
          <Route :size="25" aria-hidden="true" />
          <h2 id="route-summary-title">Route plan</h2>

          <template v-if="route && selectedLocation">
            <p>Driving route to <strong>{{ selectedLocation.name }}</strong>.</p>
            <dl class="map-route-summary">
              <div>
                <dt>Distance</dt>
                <dd>{{ formatDistance(route.distanceKm) }}</dd>
              </div>
              <div>
                <dt>Estimated drive</dt>
                <dd>{{ formatDuration(route.durationSeconds) }}</dd>
              </div>
            </dl>
            <a
              class="button button--primary button--full"
              :href="routeLink"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation :size="18" aria-hidden="true" />
              Open directions
              <ExternalLink :size="16" aria-hidden="true" />
            </a>
          </template>
          <p v-else class="map-route-panel__empty">
            Choose a start point, then select a service to see driving distance and estimated time.
          </p>

          <p v-if="routeError" class="form-notice form-notice--error" role="alert">
            {{ routeError }}
          </p>
        </aside>
      </div>

      <div class="map-results-heading results-heading">
        <div>
          <h2 id="nearby-results-title">Nearby access points</h2>
          <p aria-live="polite">
            {{ origin ? 'Sorted by distance from your start point.' : 'Showing Melbourne public access points.' }}
          </p>
        </div>
      </div>

      <ol class="service-location-list" aria-labelledby="nearby-results-title">
        <li
          v-for="location in rankedLocations"
          :key="location.id"
          class="service-location"
          :class="{ 'service-location--selected': selectedLocationId === location.id }"
        >
          <div class="service-location__heading">
            <div>
              <p class="eyebrow">{{ location.provider }}</p>
              <h3>{{ location.name }}</h3>
            </div>
            <p class="service-location__distance">
              {{ origin ? formatDistance(location.distanceKm) : 'Melbourne access point' }}
            </p>
          </div>
          <p class="service-location__address">
            <MapPin :size="18" aria-hidden="true" />
            {{ location.address }}
          </p>
          <div class="service-location__actions">
            <a class="text-link" :href="location.website" target="_blank" rel="noopener noreferrer">
              Service information
              <span class="sr-only"> (opens in a new tab)</span>
              <ExternalLink :size="16" aria-hidden="true" />
            </a>
            <button
              class="button button--secondary"
              type="button"
              :disabled="isBusy"
              @click="planRoute(location)"
            >
              <Navigation :size="18" aria-hidden="true" />
              {{ isRouting && selectedLocationId === location.id ? 'Planning...' : 'Plan route' }}
            </button>
          </div>
        </li>
      </ol>

      <p class="map-safety-note">
        These are public mental health access points, not emergency response locations. Call the
        service before travelling. In an emergency, call Triple Zero (000).
      </p>
    </div>
  </section>
</template>

<style scoped>
.map-search-panel {
  margin-bottom: 42px;
  padding: 28px;
  border: 1px solid var(--colour-border);
  border-radius: var(--radius);
  background: var(--colour-surface);
}

.map-search-panel .section-heading {
  margin-bottom: 24px;
}

.map-search-panel h2 {
  margin-bottom: 0;
  font-size: 1.5rem;
}

.map-search-form {
  display: grid;
  grid-template-columns: minmax(240px, 1.5fr) auto auto;
  align-items: end;
  gap: 14px;
}

.map-search-form__query {
  min-width: 0;
}

.map-search-form .button {
  min-height: 48px;
}

.map-search-panel .field-hint {
  margin: 12px 0 0;
}

.map-origin {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 18px 0 0;
  color: var(--colour-primary-dark);
}

.map-origin svg {
  flex: 0 0 auto;
}

.map-search-panel .form-notice {
  margin-top: 18px;
}

.map-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(270px, 0.7fr);
  gap: 26px;
  align-items: start;
}

.map-layout__visual .results-heading {
  margin-bottom: 16px;
}

.map-layout__visual .results-heading h2,
.map-layout__visual .results-heading p {
  margin-bottom: 0;
}

.map-route-panel {
  min-width: 0;
  padding: 26px;
  border: 1px solid var(--colour-border);
  border-radius: var(--radius);
  background: var(--colour-surface);
}

.map-route-panel > svg {
  margin-bottom: 18px;
  color: var(--colour-primary);
}

.map-route-panel h2 {
  margin-bottom: 12px;
  font-size: 1.35rem;
}

.map-route-panel > p {
  color: var(--colour-muted);
}

.map-route-panel__empty {
  margin-bottom: 0;
}

.map-route-summary {
  margin: 22px 0;
  border-top: 1px solid var(--colour-border);
}

.map-route-summary > div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid var(--colour-border);
}

.map-route-summary dt {
  color: var(--colour-muted);
  font-weight: 700;
}

.map-route-summary dd {
  margin: 0;
  color: var(--colour-heading);
  font-weight: 700;
  text-align: right;
}

.map-results-heading {
  margin-top: 62px;
}

.service-location-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: service-location;
}

.service-location {
  min-width: 0;
  padding: 23px;
  border: 1px solid var(--colour-border);
  border-radius: var(--radius);
  background: #ffffff;
  counter-increment: service-location;
}

.service-location--selected {
  border-color: var(--colour-primary);
  box-shadow: 0 0 0 2px var(--colour-primary-light);
}

.service-location__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.service-location__heading .eyebrow {
  margin-bottom: 5px;
  font-size: 0.7rem;
}

.service-location h3 {
  margin-bottom: 0;
  font-size: 1.05rem;
}

.service-location__distance {
  flex: 0 0 auto;
  margin: 3px 0 0;
  color: var(--colour-primary-dark);
  font-size: 0.86rem;
  font-weight: 700;
  text-align: right;
}

.service-location__address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 18px 0;
  color: var(--colour-muted);
  font-size: 0.9rem;
}

.service-location__address svg {
  flex: 0 0 auto;
  margin-top: 3px;
  color: var(--colour-primary);
}

.service-location__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 16px;
  border-top: 1px solid var(--colour-border);
}

.service-location__actions .button {
  min-height: 42px;
  padding: 8px 13px;
  font-size: 0.86rem;
}

.map-safety-note {
  margin: 28px 0 0;
  padding: 15px 17px;
  border-left: 4px solid #d39a16;
  background: #fff8e6;
  color: #5f4a17;
  font-size: 0.88rem;
}

@media (max-width: 991px) {
  .map-layout {
    grid-template-columns: 1fr;
  }

  .map-route-panel {
    max-width: 620px;
  }
}

@media (max-width: 767px) {
  .map-search-panel {
    padding: 22px 20px;
  }

  .map-search-form {
    grid-template-columns: 1fr;
  }

  .map-search-form .button {
    width: 100%;
  }

  .service-location-list {
    grid-template-columns: 1fr;
  }

  .service-location__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .service-location__actions .button,
  .service-location__actions .text-link {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .service-location__heading {
    display: block;
  }

  .service-location__distance {
    margin-top: 8px;
    text-align: left;
  }
}
</style>
