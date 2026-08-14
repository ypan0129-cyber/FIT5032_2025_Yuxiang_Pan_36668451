import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateDistanceKm,
  formatDistance,
  formatDuration,
  isValidCoordinate,
  rankLocationsByDistance,
} from '../src/utils/geolocation.js'

const melbourne = { latitude: -37.8136, longitude: 144.9631 }
const clayton = { latitude: -37.9208, longitude: 145.1205 }

test('isValidCoordinate accepts geographic bounds and rejects malformed points', () => {
  assert.equal(isValidCoordinate(melbourne), true)
  assert.equal(isValidCoordinate({ latitude: -91, longitude: 0 }), false)
  assert.equal(isValidCoordinate({ latitude: 0, longitude: Number.NaN }), false)
  assert.equal(isValidCoordinate(null), false)
})

test('calculateDistanceKm returns a realistic great-circle distance', () => {
  const distance = calculateDistanceKm(melbourne, clayton)

  assert.ok(distance > 17)
  assert.ok(distance < 20)
  assert.equal(calculateDistanceKm(melbourne, melbourne), 0)
})

test('rankLocationsByDistance returns a new nearest-first list', () => {
  const locations = [
    { id: 'clayton', ...clayton },
    { id: 'cbd', ...melbourne },
  ]
  const ranked = rankLocationsByDistance(melbourne, locations)

  assert.deepEqual(ranked.map((location) => location.id), ['cbd', 'clayton'])
  assert.equal('distanceKm' in locations[0], false)
})

test('distance and route duration values have readable labels', () => {
  assert.equal(formatDistance(0.42), '420 m')
  assert.equal(formatDistance(12.345), '12.3 km')
  assert.equal(formatDuration(1800), '30 min')
  assert.equal(formatDuration(4500), '1 hr 15 min')
})
