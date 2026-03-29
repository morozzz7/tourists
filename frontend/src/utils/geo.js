// Утилиты геометрии: расстояние и проверка попадания в границы.
const toRadians = (value) => (value * Math.PI) / 180

const getDistanceMeters = (from, to) => {
  const R = 6371000
  const dLat = toRadians(to.lat - from.lat)
  const dLon = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const isPointInBounds = (coords, bounds) => {
  const [lat, lng] = coords
  const [[lat1, lng1], [lat2, lng2]] = bounds
  const minLat = Math.min(lat1, lat2)
  const maxLat = Math.max(lat1, lat2)
  const minLng = Math.min(lng1, lng2)
  const maxLng = Math.max(lng1, lng2)
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng
}

export { toRadians, getDistanceMeters, isPointInBounds }
