import test from 'node:test'
import assert from 'node:assert/strict'
import {
  geocodeAustralianLocation,
  getBrowserPosition,
  getDrivingRoute,
} from '../src/services/mapService.js'

function jsonResponse(data, ok = true) {
  return {
    ok,
    async json() {
      return data
    },
  }
}

test('geocodeAustralianLocation constrains searches to Australia', async () => {
  let requestedUrl
  const location = await geocodeAustralianLocation('Clayton 3168', async (url) => {
    requestedUrl = url
    return jsonResponse([
      {
        lat: '-37.9208',
        lon: '145.1205',
        display_name: 'Clayton, Melbourne, Victoria, 3168, Australia',
      },
    ])
  })

  assert.equal(requestedUrl.searchParams.get('countrycodes'), 'au')
  assert.equal(requestedUrl.searchParams.get('q'), 'Clayton 3168')
  assert.deepEqual(location, {
    latitude: -37.9208,
    longitude: 145.1205,
    label: 'Clayton, Melbourne, Victoria, 3168, Australia',
  })
})

test('geocodeAustralianLocation reports no-result and invalid-input errors', async () => {
  await assert.rejects(
    geocodeAustralianLocation('x', async () => jsonResponse([])),
    { code: 'map/invalid-search' },
  )
  await assert.rejects(
    geocodeAustralianLocation('Unknown place', async () => jsonResponse([])),
    { code: 'map/no-results' },
  )
})

test('getBrowserPosition maps coordinates and permission denial', async () => {
  const position = await getBrowserPosition({
    getCurrentPosition(success) {
      success({ coords: { latitude: -37.81, longitude: 144.96, accuracy: 25 } })
    },
  })

  assert.deepEqual(position, {
    latitude: -37.81,
    longitude: 144.96,
    accuracyMetres: 25,
  })

  await assert.rejects(
    getBrowserPosition({
      getCurrentPosition(_success, failure) {
        failure({ code: 1 })
      },
    }),
    { code: 'map/geolocation-denied' },
  )
})

test('getDrivingRoute validates and converts OSRM geometry', async () => {
  let requestedUrl
  const route = await getDrivingRoute(
    { latitude: -37.81, longitude: 144.96 },
    { latitude: -37.92, longitude: 145.12 },
    async (url) => {
      requestedUrl = url
      return jsonResponse({
        code: 'Ok',
        routes: [
          {
            distance: 21400,
            duration: 1860,
            geometry: {
              coordinates: [
                [144.96, -37.81],
                [145.12, -37.92],
              ],
            },
          },
        ],
      })
    },
  )

  assert.match(requestedUrl.pathname, /144\.96,-37\.81;145\.12,-37\.92/u)
  assert.deepEqual(route, {
    distanceKm: 21.4,
    durationSeconds: 1860,
    path: [
      { latitude: -37.81, longitude: 144.96 },
      { latitude: -37.92, longitude: 145.12 },
    ],
  })
})

test('getDrivingRoute rejects missing route data', async () => {
  await assert.rejects(
    getDrivingRoute(
      { latitude: -37.81, longitude: 144.96 },
      { latitude: -37.92, longitude: 145.12 },
      async () => jsonResponse({ code: 'NoRoute', routes: [] }),
    ),
    { code: 'map/no-route' },
  )
})
