<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/weather'
const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY

const city = ref('')
const weatherData = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const sourceLabel = ref('')

const temperature = computed(() => {
  return weatherData.value ? Math.round(weatherData.value.main.temp) : null
})

const iconUrl = computed(() => {
  return weatherData.value
    ? `https://openweathermap.org/img/wn/${weatherData.value.weather[0].icon}@2x.png`
    : ''
})

const requestWeather = async (params, label) => {
  if (!apiKey) {
    errorMessage.value = 'Missing VITE_OPENWEATHER_API_KEY in .env.local.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await axios.get(weatherApiUrl, {
      params: { ...params, appid: apiKey, units: 'metric' }
    })
    weatherData.value = response.data
    sourceLabel.value = label
  } catch (error) {
    weatherData.value = null
    const status = error.response?.status
    errorMessage.value =
      status === 404
        ? 'City not found. Try a city and country, for example Clayton, AU.'
        : 'Unable to load weather data. Check your API key and internet connection.'
  } finally {
    loading.value = false
  }
}

const fetchCurrentLocationWeather = () => {
  if (!navigator.geolocation) {
    errorMessage.value = 'Geolocation is not supported by this browser.'
    return
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) =>
      requestWeather({ lat: coords.latitude, lon: coords.longitude }, 'Current location'),
    () => {
      errorMessage.value = 'Location access was not allowed. Search for a city below.'
    }
  )
}

const searchByCity = () => {
  const cityName = city.value.trim()
  if (!cityName) {
    errorMessage.value = 'Enter a city name before searching.'
    return
  }

  requestWeather({ q: cityName }, `Search result for ${cityName}`)
}

onMounted(fetchCurrentLocationWeather)
</script>

<template>
  <div class="weather-page container">
    <section class="weather-header">
      <p class="eyebrow">OpenWeatherMap API</p>
      <h1>Weather by City</h1>
      <p class="intro">Check the weather at your current location or search for any city.</p>

      <form class="search-bar" @submit.prevent="searchByCity">
        <label class="visually-hidden" for="city-search">City name</label>
        <input
          id="city-search"
          v-model="city"
          type="search"
          placeholder="Try Clayton, AU"
          class="search-input"
        />
        <button type="submit" class="search-button">Search</button>
        <button type="button" class="location-button" @click="fetchCurrentLocationWeather">
          Use current location
        </button>
      </form>
    </section>

    <p v-if="loading" class="status-message">Loading weather data...</p>
    <p v-else-if="errorMessage" class="status-message error-message">{{ errorMessage }}</p>

    <main v-if="weatherData" class="weather-card">
      <div class="weather-summary">
        <p class="eyebrow">{{ sourceLabel }}</p>
        <h2>{{ weatherData.name }}, {{ weatherData.sys.country }}</h2>
        <p class="weather-description">{{ weatherData.weather[0].description }}</p>
      </div>
      <div class="weather-reading">
        <img :src="iconUrl" alt="Weather icon" />
        <strong>{{ temperature }} °C</strong>
      </div>
    </main>
  </div>
</template>

<style scoped>
.weather-page {
  max-width: 960px;
  padding-top: 1.5rem;
  padding-bottom: 3rem;
}

.weather-header {
  padding: 2.5rem 0 2rem;
  border-bottom: 1px solid #dee2e6;
}

.eyebrow {
  margin-bottom: 0.35rem;
  color: #0d6efd;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2 {
  color: #1d3557;
  font-weight: 700;
}

h1 {
  margin-bottom: 0.5rem;
}

.intro {
  color: #5c677d;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.5rem;
}

.search-input {
  flex: 1 1 230px;
  min-height: 44px;
  padding: 0.65rem 0.85rem;
  border: 1px solid #adb5bd;
  border-radius: 4px;
}

.search-button,
.location-button {
  min-height: 44px;
  padding: 0.65rem 1rem;
  border: 1px solid #0d6efd;
  border-radius: 4px;
  font-weight: 600;
}

.search-button {
  color: white;
  background: #0d6efd;
}

.location-button {
  color: #0d6efd;
  background: white;
}

.status-message {
  margin: 1.5rem 0;
  padding: 0.85rem 1rem;
  border-left: 4px solid #0d6efd;
  background: #eef5ff;
}

.error-message {
  border-left-color: #dc3545;
  background: #fff1f2;
  color: #842029;
}

.weather-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-top: 1.5rem;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #f8fbff;
}

.weather-description {
  margin-bottom: 0;
  color: #5c677d;
  text-transform: capitalize;
}

.weather-reading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.weather-reading img {
  width: 96px;
  height: 96px;
}

.weather-reading strong {
  color: #1d3557;
  font-size: 2rem;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .weather-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .location-button,
  .search-button {
    flex: 1 1 100%;
  }
}
</style>
