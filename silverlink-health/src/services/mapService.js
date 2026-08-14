import { isValidCoordinate } from '../utils/geolocation.js'

const geocodingEndpoint = 'https://nominatim.openstreetmap.org/search'
const routingEndpoint = 'https://router.project-osrm.org/route/v1/driving'
const requestTimeoutMs = 12000

function createMapError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

async function fetchJson(url, fetchImplementation) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs)

  try {
    const response = await fetchImplementation(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw createMapError('map/request-failed', 'The mapping service returned an error.')
    }

    return await response.json()
  } catch (error) {
    if (error?.code) {
      throw error
    }

    throw createMapError('map/network-error', 'The mapping service could not be reached.')
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function geocodeAustralianLocation(query, fetchImplementation = fetch) {
  const normalisedQuery = String(query ?? '').trim().replace(/\s+/gu, ' ')

  if (normalisedQuery.length < 2 || normalisedQuery.length > 120) {
    throw createMapError('map/invalid-search', 'Enter a valid Australian suburb or postcode.')
  }

  const url = new URL(geocodingEndpoint)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('countrycodes', 'au')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('q', normalisedQuery)

  const results = await fetchJson(url, fetchImplementation)
  const result = Array.isArray(results) ? results[0] : null
  const point = result
    ? {
        latitude: Number(result.lat),
        longitude: Number(result.lon),
      }
    : null

  if (!isValidCoordinate(point)) {
    throw createMapError('map/no-results', 'No Australian location matched that search.')
  }

  return {
    ...point,
    label: String(result.display_name || normalisedQuery),
  }
}

export function getBrowserPosition(geolocation = globalThis.navigator?.geolocation) {
  if (!geolocation) {
    return Promise.reject(
      createMapError('map/geolocation-unsupported', 'Location is unavailable in this browser.'),
    )
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => {
        const point = {
          latitude: Number(position.coords.latitude),
          longitude: Number(position.coords.longitude),
          accuracyMetres: Number(position.coords.accuracy),
        }

        if (!isValidCoordinate(point)) {
          reject(createMapError('map/geolocation-unavailable', 'Your location was unavailable.'))
          return
        }

        resolve(point)
      },
      (error) => {
        const errorCodes = {
          1: 'map/geolocation-denied',
          2: 'map/geolocation-unavailable',
          3: 'map/geolocation-timeout',
        }
        reject(
          createMapError(
            errorCodes[error?.code] || 'map/geolocation-unavailable',
            'Your location was unavailable.',
          ),
        )
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 10000,
      },
    )
  })
}

export async function getDrivingRoute(origin, destination, fetchImplementation = fetch) {
  if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
    throw createMapError('map/invalid-route', 'Valid route coordinates are required.')
  }

  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`
  const url = new URL(`${routingEndpoint}/${coordinates}`)
  url.searchParams.set('overview', 'full')
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('steps', 'false')

  const result = await fetchJson(url, fetchImplementation)
  const route = result?.code === 'Ok' && Array.isArray(result.routes) ? result.routes[0] : null
  const routeCoordinates = route?.geometry?.coordinates

  if (
    !route ||
    !Number.isFinite(route.distance) ||
    !Number.isFinite(route.duration) ||
    !Array.isArray(routeCoordinates) ||
    routeCoordinates.length < 2
  ) {
    throw createMapError('map/no-route', 'No driving route was available for this destination.')
  }

  const path = routeCoordinates.map((coordinate) => ({
    latitude: Number(coordinate[1]),
    longitude: Number(coordinate[0]),
  }))

  if (!path.every(isValidCoordinate)) {
    throw createMapError('map/invalid-route', 'The route data was incomplete.')
  }

  return {
    distanceKm: route.distance / 1000,
    durationSeconds: route.duration,
    path,
  }
}

export function getMapErrorMessage(error) {
  const messages = {
    'map/invalid-search': 'Enter a valid Australian suburb or postcode.',
    'map/no-results': 'No Australian location matched that search. Try a nearby suburb or postcode.',
    'map/request-failed': 'The mapping service is temporarily unavailable. Please try again.',
    'map/network-error': 'Check your connection and try the map request again.',
    'map/geolocation-unsupported': 'This browser cannot provide your current location.',
    'map/geolocation-denied': 'Location access was denied. Search by suburb or postcode instead.',
    'map/geolocation-unavailable': 'Your current location could not be determined. Search instead.',
    'map/geolocation-timeout': 'Finding your location took too long. Search instead or try again.',
    'map/invalid-route': 'The route could not be calculated for this location.',
    'map/no-route': 'No driving route was available for this destination.',
  }

  return messages[error?.code] || 'The map request could not be completed. Please try again.'
}
