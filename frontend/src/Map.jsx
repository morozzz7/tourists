import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Rectangle,
  CircleMarker,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/mushroom.png',
  iconUrl: '/mushroom.png',
  iconSize: [36, 36],
  iconAnchor: [18, 34],
  popupAnchor: [0, -32],
  shadowUrl: undefined,
})

const RYAZAN_CENTER = [54.6292, 39.7351]
const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || ''
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]
const CACHE_KEY = 'ryazan-poi-cache-v1'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000
const WIKI_CACHE_KEY = 'ryazan-wiki-summary-v1'
const WIKI_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const YANDEX_LANG = 'ru_RU'
const WIKI_SUMMARY_ENDPOINT = 'https://ru.wikipedia.org/api/rest_v1/page/summary/'
const WIKI_SEARCH_ENDPOINT = 'https://ru.wikipedia.org/w/rest.php/v1/search/page'
const FALLBACK_LOCATIONS = [
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
const TERRITORIES = [
  { id: 't1', name: 'Кремль', bounds: [[54.633, 39.742], [54.638, 39.752]] },
  { id: 't2', name: 'Соборная', bounds: [[54.629, 39.737], [54.634, 39.746]] },
  { id: 't3', name: 'Набережная', bounds: [[54.625, 39.731], [54.631, 39.739]] },
  { id: 't4', name: 'ЦПКиО', bounds: [[54.624, 39.742], [54.629, 39.751]] },
  { id: 't5', name: 'Музейный квартал', bounds: [[54.631, 39.752], [54.636, 39.760]] },
  { id: 't6', name: 'Лыбедский бульвар', bounds: [[54.626, 39.724], [54.632, 39.733]] },
]

const fetchFromOverpass = async (query) => {
  let lastError = null
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          lastError = new Error(`Overpass ${response.status}`)
          continue
        }
        throw new Error(`Overpass ${response.status}`)
      }
      return await response.json()
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || new Error('Overpass error')
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const readWikiCache = () => {
  try {
    const raw = localStorage.getItem(WIKI_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed?.ts || !parsed?.data) return {}
    if (Date.now() - parsed.ts > WIKI_CACHE_TTL_MS) return {}
    return parsed.data
  } catch {
    return {}
  }
}

const writeWikiCache = (data) => {
  try {
    localStorage.setItem(
      WIKI_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data }),
    )
  } catch {
    // ignore cache write errors
  }
}

const fetchWikiSummary = async (title) => {
  const encodedTitle = encodeURIComponent(title)
  const summaryResponse = await fetch(`${WIKI_SUMMARY_ENDPOINT}${encodedTitle}`)
  if (summaryResponse.ok) {
    return await summaryResponse.json()
  }
  if (summaryResponse.status !== 404) {
    throw new Error('Wikipedia summary error')
  }
  const searchParams = new URLSearchParams({
    q: title,
    limit: '1',
  })
  const searchResponse = await fetch(`${WIKI_SEARCH_ENDPOINT}?${searchParams.toString()}`)
  if (!searchResponse.ok) {
    throw new Error('Wikipedia search error')
  }
  const searchData = await searchResponse.json()
  const first = searchData?.pages?.[0]
  if (!first?.title) return null
  const fallbackSummary = await fetch(
    `${WIKI_SUMMARY_ENDPOINT}${encodeURIComponent(first.title)}`,
  )
  if (!fallbackSummary.ok) return null
  return await fallbackSummary.json()
}

const normalizeSummary = (summary) => {
  if (!summary) return null
  const extract = summary.extract || ''
  const short =
    extract.length > 240 ? extract.slice(0, 237).trimEnd() + '…' : extract
  return {
    title: summary.title || '',
    extract: short || 'Описание не найдено',
    url: summary?.content_urls?.desktop?.page || '',
  }
}

const runWithConcurrency = async (items, limit, handler) => {
  const queue = [...items]
  const workers = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const item = queue.shift()
      await handler(item)
    }
  })
  await Promise.all(workers)
}

const readPoiCache = ({ allowStale = false } = {}) => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.data || !parsed?.ts) return null
    if (!allowStale && Date.now() - parsed.ts > CACHE_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

const writePoiCache = (data) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data }),
    )
  } catch {
    // ignore cache write errors
  }
}

let yandexLoaderPromise = null

const loadYandexMaps = (apiKey) => {
  if (!apiKey) return Promise.reject(new Error('Missing Yandex API key'))
  if (window.ymaps) return Promise.resolve(window.ymaps)
  if (yandexLoaderPromise) return yandexLoaderPromise

  yandexLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=${YANDEX_LANG}`
    script.async = true
    script.onload = () => resolve(window.ymaps)
    script.onerror = () => reject(new Error('Failed to load Yandex Maps'))
    document.head.appendChild(script)
  })

  return yandexLoaderPromise
}

const RyazanMap = ({
  onSelectPoi,
  userLocation,
  locationStatus,
  locationError,
  autoCapturedIds,
}) => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [provider, setProvider] = useState('leaflet')
  const [wikiById, setWikiById] = useState({})
  const [yandexReady, setYandexReady] = useState(false)
  const yandexContainerRef = useRef(null)
  const yandexMapRef = useRef(null)

  const [captured, setCaptured] = useState(new Set(['t1', 't3']))
  const effectiveCaptured = useMemo(
    () =>
      new Set([
        ...captured,
        ...(autoCapturedIds ? Array.from(autoCapturedIds) : []),
      ]),
    [captured, autoCapturedIds],
  )
  const progress = Math.round(
    (effectiveCaptured.size / TERRITORIES.length) * 100,
  )

  useEffect(() => {
    const fetchPoi = async () => {
      try {
        setLoading(true)
        setError(null)
        const cached = readPoiCache()
        if (cached) {
          setLocations(cached)
          setLoading(false)
          return
        }
        const query =
          '[out:json][timeout:25];\n' +
          '(\n' +
          '  node["tourism"="attraction"](around:5000,' +
          RYAZAN_CENTER[0] +
          ',' +
          RYAZAN_CENTER[1] +
          ');\n' +
          '  node["tourism"="museum"](around:5000,' +
          RYAZAN_CENTER[0] +
          ',' +
          RYAZAN_CENTER[1] +
          ');\n' +
          '  node["historic"="monument"](around:5000,' +
          RYAZAN_CENTER[0] +
          ',' +
          RYAZAN_CENTER[1] +
          ');\n' +
          '  node["historic"="memorial"](around:5000,' +
          RYAZAN_CENTER[0] +
          ',' +
          RYAZAN_CENTER[1] +
          ');\n' +
          ');\n' +
          'out body 60;\n'
        const data = await fetchFromOverpass(query)
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
          setLocations(FALLBACK_LOCATIONS)
          setError('Точки из API не найдены, показаны демо-локации')
        } else {
          setLocations(normalized)
          writePoiCache(normalized)
          setError(null)
        }
      } catch {
        const cached = readPoiCache({ allowStale: true })
        if (cached) {
          setLocations(cached)
          setError('Показаны кешированные точки, обновление не удалось')
        } else {
          setLocations(FALLBACK_LOCATIONS)
          setError('Не удалось загрузить точки интереса, показаны демо-локации')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPoi()
  }, [])

  useEffect(() => {
    if (!locations.length) return

    let cancelled = false
    const cached = readWikiCache()
    const updates = {}

    locations.forEach((loc) => {
      const cachedItem = cached[loc.name]
      if (cachedItem) {
        updates[loc.id] = cachedItem
      }
    })
    if (Object.keys(updates).length) {
      setWikiById((prev) => ({ ...prev, ...updates }))
    }

    const toFetch = locations.filter((loc) => !cached[loc.name])

    runWithConcurrency(toFetch, 3, async (loc) => {
      try {
        const summary = await fetchWikiSummary(loc.name)
        const normalized = normalizeSummary(summary)
        if (!normalized) return
        cached[loc.name] = normalized
        if (cancelled) return
        setWikiById((prev) => ({ ...prev, [loc.id]: normalized }))
        writeWikiCache(cached)
      } catch {
        // ignore summary errors
      }
    })

    return () => {
      cancelled = true
    }
  }, [locations])

  useEffect(() => {
    if (provider !== 'yandex') return undefined
    if (!YANDEX_API_KEY) return undefined

    let destroyed = false

    loadYandexMaps(YANDEX_API_KEY)
      .then((ymaps) => {
        ymaps.ready(() => {
          if (destroyed || !yandexContainerRef.current) return
          if (yandexMapRef.current) return
          yandexMapRef.current = new ymaps.Map(
            yandexContainerRef.current,
            {
              center: RYAZAN_CENTER,
              zoom: 13,
              controls: ['zoomControl'],
            },
            {
              suppressMapOpenBlock: true,
            },
          )
          setYandexReady(true)
        })
      })
      .catch(() => {
        setError('Не удалось загрузить Яндекс.Карты')
      })

    return () => {
      destroyed = true
      if (yandexMapRef.current) {
        yandexMapRef.current.destroy()
        yandexMapRef.current = null
      }
      setYandexReady(false)
    }
  }, [provider])

  useEffect(() => {
    if (provider !== 'yandex') return
    if (!yandexReady) return
    const map = yandexMapRef.current
    if (!map) return

    map.geoObjects.removeAll()

    TERRITORIES.forEach((territory) => {
      const [[lat1, lon1], [lat2, lon2]] = territory.bounds
      const isCaptured = effectiveCaptured.has(territory.id)
      const polygon = new window.ymaps.Polygon(
        [
          [
            [lat1, lon1],
            [lat1, lon2],
            [lat2, lon2],
            [lat2, lon1],
            [lat1, lon1],
          ],
        ],
        {},
        {
          fillColor: isCaptured ? '#d62f2f55' : '#cccccc55',
          strokeColor: isCaptured ? '#d62f2f' : '#999999',
          strokeWidth: 2,
        },
      )
      polygon.events.add('click', () => toggleCapture(territory.id))
      map.geoObjects.add(polygon)
    })

    locations.forEach((loc) => {
      const wiki = wikiById[loc.id]
      const title = escapeHtml(wiki?.title || loc.name)
      const desc = escapeHtml(wiki?.extract || loc.tags?.address || loc.tags?.menu || 'Точка маршрута')
      const link = wiki?.url
        ? `<br/><a href="${escapeHtml(wiki.url)}" target="_blank" rel="noreferrer">Статья</a>`
        : ''
      const placemark = new window.ymaps.Placemark(
        loc.coords,
        {
          balloonContent: `<strong>${title}</strong><br/>${desc}${link}`,
        },
        {
          iconLayout: 'default#image',
          iconImageHref: '/mushroom.ico',
          iconImageSize: [36, 36],
          iconImageOffset: [-18, -34],
        },
      )
      placemark.events.add('click', () => onSelectPoi?.(loc))
      map.geoObjects.add(placemark)
    })

    if (userLocation) {
      const userPlacemark = new window.ymaps.Placemark(
        [userLocation.lat, userLocation.lng],
        {
          balloonContent: 'Вы здесь',
        },
        {
          preset: 'islands#blueCircleDotIcon',
        },
      )
      map.geoObjects.add(userPlacemark)
    }
  }, [
    provider,
    yandexReady,
    locations,
    effectiveCaptured,
    onSelectPoi,
    wikiById,
    userLocation,
  ])

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
      {provider === 'leaflet' && (
        <MapContainer
          center={RYAZAN_CENTER}
          zoom={14}
          style={{ height: '100%', width: '100%', minHeight: '520px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {TERRITORIES.map((territory) => (
            <Rectangle
              key={territory.id}
              bounds={territory.bounds}
              pathOptions={{
                color: effectiveCaptured.has(territory.id) ? '#d62f2f' : '#999999',
                fillColor: effectiveCaptured.has(territory.id)
                  ? '#d62f2f'
                  : '#cccccc',
                fillOpacity: effectiveCaptured.has(territory.id) ? 0.35 : 0.15,
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
                  <h3>{wikiById[loc.id]?.title || loc.name}</h3>
                  <p>{wikiById[loc.id]?.extract || 'Описание не найдено'}</p>
                  {wikiById[loc.id]?.url && (
                    <a
                      className="map-popup-link"
                      href={wikiById[loc.id].url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Статья
                    </a>
                  )}
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
          {userLocation && (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={9}
              pathOptions={{
                color: '#1d7be8',
                fillColor: '#3ea0ff',
                fillOpacity: 0.8,
              }}
            >
              <Popup>Вы здесь</Popup>
            </CircleMarker>
          )}
        </MapContainer>
      )}

      {provider === 'yandex' && (
        <div
          className="map-yandex"
          ref={yandexContainerRef}
          aria-label="Yandex map"
        >
          {!YANDEX_API_KEY && (
            <div className="map-provider-warning">
              Нужен ключ Яндекс.Карт. Добавь `VITE_YANDEX_MAPS_API_KEY` в `.env`.
            </div>
          )}
        </div>
      )}

      <div className="map-overlay-card">
        <p className="map-overlay-title">Открытие территорий</p>
        <div className="map-provider-toggle">
          <button
            className={`map-provider-btn ${provider === 'leaflet' ? 'active' : ''}`}
            onClick={() => setProvider('leaflet')}
            type="button"
          >
            Leaflet
          </button>
          <button
            className={`map-provider-btn ${provider === 'yandex' ? 'active' : ''}`}
            onClick={() => setProvider('yandex')}
            type="button"
          >
            Яндекс
          </button>
        </div>
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
        {locationStatus === 'denied' && (
          <p className="map-overlay-status">Геолокация отключена в браузере.</p>
        )}
        {locationStatus === 'requesting' && (
          <p className="map-overlay-status">Определяем ваше местоположение…</p>
        )}
        {locationStatus === 'error' && (
          <p className="map-overlay-status">
            Не удалось определить позицию{locationError ? `: ${locationError}` : '.'}
          </p>
        )}
      </div>
    </div>
  )
}

export default RyazanMap
