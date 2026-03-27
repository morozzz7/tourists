import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const RyazanMap = ({ onSelectPoi }) => {
  const ryazanCenter = [54.6292, 39.7351]
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fallbackLocations = [
    {
      id: 'fallback-1',
      name: 'Рязанский Кремль',
      category: 'attraction',
      coords: [54.6348, 39.7486],
      tags: {},
    },
    {
      id: 'fallback-2',
      name: 'Памятник Есенину',
      category: 'monument',
      coords: [54.636, 39.747],
      tags: {},
    },
    {
      id: 'fallback-3',
      name: 'Грибы с глазами',
      category: 'art',
      coords: [54.6288, 39.7345],
      tags: {},
    },
  ]

  const territories = [
    { id: 't1', name: 'Кремль', bounds: [[54.633, 39.742], [54.638, 39.752]] },
    { id: 't2', name: 'Соборная', bounds: [[54.629, 39.737], [54.634, 39.746]] },
    { id: 't3', name: 'Набережная', bounds: [[54.625, 39.731], [54.631, 39.739]] },
    { id: 't4', name: 'ЦПКиО', bounds: [[54.624, 39.742], [54.629, 39.751]] },
    { id: 't5', name: 'Музейный квартал', bounds: [[54.631, 39.752], [54.636, 39.760]] },
    { id: 't6', name: 'Лыбедский бульвар', bounds: [[54.626, 39.724], [54.632, 39.733]] },
  ]

  const [captured, setCaptured] = useState(new Set(['t1', 't3']))
  const progress = Math.round((captured.size / territories.length) * 100)

  useEffect(() => {
    const fetchPoi = async () => {
      try {
        setLoading(true)
        const query =
          '[out:json][timeout:25];\n' +
          '(\n' +
          '  node["tourism"="attraction"](around:5000,' +
          ryazanCenter[0] +
          ',' +
          ryazanCenter[1] +
          ');\n' +
          '  node["tourism"="museum"](around:5000,' +
          ryazanCenter[0] +
          ',' +
          ryazanCenter[1] +
          ');\n' +
          '  node["historic"="monument"](around:5000,' +
          ryazanCenter[0] +
          ',' +
          ryazanCenter[1] +
          ');\n' +
          '  node["historic"="memorial"](around:5000,' +
          ryazanCenter[0] +
          ',' +
          ryazanCenter[1] +
          ');\n' +
          ');\n' +
          'out body 60;\n'
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: query,
        })
        if (response.ok === false) throw new Error('Overpass error')
        const data = await response.json()
        const normalized = (data.elements || [])
          .filter((el) => el.type === 'node')
          .map((el) => {
            const name =
              el.tags?.name ||
              el.tags?.['name:ru'] ||
              el.tags?.['name:en'] ||
              'Точка интереса'
            const category =
              el.tags?.tourism ||
              el.tags?.historic ||
              el.tags?.amenity ||
              'poi'
            return {
              id: el.id,
              name,
              category,
              coords: [el.lat, el.lon],
              tags: el.tags || {},
            }
          })
          .slice(0, 40)
        if (normalized.length === 0) {
          setLocations(fallbackLocations)
          setError('Точки из API не найдены, показаны демо-локации')
        } else {
          setLocations(normalized)
          setError(null)
        }
      } catch (err) {
        setLocations(fallbackLocations)
        setError('Не удалось загрузить точки интереса, показаны демо-локации')
      } finally {
        setLoading(false)
      }
    }

    fetchPoi()
  }, [ryazanCenter])

  const toggleCapture = (id) => {
    setCaptured((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const progressStyle = { width: progress + '%' }

  return (
    <div className="map-frame">
      <MapContainer center={ryazanCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {territories.map((territory) => (
          <Rectangle
            key={territory.id}
            bounds={territory.bounds}
            pathOptions={{
              color: captured.has(territory.id) ? '#d62f2f' : '#999999',
              fillColor: captured.has(territory.id) ? '#d62f2f' : '#cccccc',
              fillOpacity: captured.has(territory.id) ? 0.35 : 0.15,
              weight: 2,
            }}
            eventHandlers={{
              click: () => toggleCapture(territory.id),
            }}
          />
        ))}
        {locations.map((loc) => (
          <Marker key={loc.id} position={loc.coords}>
            <Popup className="custom-popup">
              <div className="map-popup">
                <h3>{loc.name}</h3>
                <p>Категория: {loc.category}</p>
                <button
                  className="map-popup-btn"
                  onClick={() => onSelectPoi?.(loc)}
                >
                  Открыть карточку
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="map-overlay-card">
        <p className="map-overlay-title">Открытие территорий</p>
        <div className="map-overlay-row">
          <span>Прогресс</span>
          <span className="map-overlay-accent">{progress}%</span>
        </div>
        <div className="map-progress">
          <div className="map-progress-fill" style={progressStyle}></div>
        </div>
        <p className="map-overlay-note">
          Нажми на участок карты, чтобы отметить его как исследованный.
        </p>
        {loading && <p className="map-overlay-status">Загрузка точек...</p>}
        {error && <p className="map-overlay-status">{error}</p>}
      </div>
    </div>
  )
}

export default RyazanMap
