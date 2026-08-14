const earthRadiusKm = 6371

export function isValidCoordinate(point) {
  return Boolean(
    point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180
  )
}

export function calculateDistanceKm(origin, destination) {
  if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
    throw new TypeError('Valid origin and destination coordinates are required.')
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const latitudeDifference = toRadians(destination.latitude - origin.latitude)
  const longitudeDifference = toRadians(destination.longitude - origin.longitude)
  const originLatitude = toRadians(origin.latitude)
  const destinationLatitude = toRadians(destination.latitude)
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDifference / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export function rankLocationsByDistance(origin, locations) {
  return locations
    .map((location) => ({
      ...location,
      distanceKm: calculateDistanceKm(origin, location),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)
}

export function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    return 'Unavailable'
  }

  if (distanceKm < 1) {
    return `${Math.max(10, Math.round((distanceKm * 1000) / 10) * 10)} m`
  }

  return `${distanceKm.toFixed(1)} km`
}

export function formatDuration(durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return 'Unavailable'
  }

  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60))

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`
}
