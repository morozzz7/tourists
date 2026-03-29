// App.jsx - исправленная версия
import { useEffect, useRef, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import RyazanMap from './components/Map'
import RouteCards from './components/RouteCards'
import QRAdmin from './components/QRAdmin'
import PoiWelcome from './components/PoiWelcome'
import mascotImg from './assets/hero.png'
import TERRITORIES from './data/territories'
import {
  GAME_CARDS,
  REWARDS,
  ROUTES,
  LEVELS,
  POINTS_SOURCES,
  REWARD_TIERS,
} from './data/gameData'
import { API_BASE, ensureCsrf, getCookie } from './services/apiClient'
import { getDistanceMeters, isPointInBounds } from './utils/geo'
import { formatNumber, normalizeName } from './utils/text'
import { parseSet, parseRouteStamps, serializeRouteStamps } from './utils/collections'
import './App.css'

const demoMessages = [
  {
    from: 'assistant',
    text: 'Привет! Я помогу выбрать маршрут или объяснить, как работают квесты.',
  },
]

const GUEST_POINTS = 1240
const DEMO_CARD_ID = 'poi-esenin'

const calculateLevel = (points) => Math.floor(points / 500) + 1
const DISABLE_GEO_CHECK = false
const DISABLE_GEO_WATCH = false

const PageShell = ({ title, subtitle, children }) => (
  <div className="page page-standalone">
    <header>
      <p className="eyebrow">Раздел</p>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
    {children}
  </div>
)

const Sidebar = ({
  onOpenModal,
  onToggleTheme,
  theme,
  sidebarOpen,
  onToggleSidebar,
  user,
  onLogout,
  points,
  level,
}) => (
  <aside className="sidebar">
    <button className="sidebar-toggle" onClick={onToggleSidebar}>
      {sidebarOpen ? 'Свернуть' : 'Меню'}
    </button>
    <div className="account">
      <div className="avatar" aria-hidden="true"></div>
      <div className="account-info">
        <p className="account-title">{user?.name || user?.email || 'Гость'}</p>
        <p className="account-subtitle">
          {user ? 'Профиль активен' : 'Рязань, на старте'}
        </p>
        <p className="account-level">
          Уровень {level} · {formatNumber(points)} баллов
        </p>
      </div>
    </div>
    <nav className="menu">
      <Link to="/routes">Экскурсии и квесты</Link>
      <Link to="/kids">Детский аудиогид</Link>
      <Link to="/cards">Коллекционные карточки</Link>
      <Link to="/achievements">Достижения</Link>
      <Link to="/rewards">Награды</Link>
      <Link to="/loyalty">Система лояльности</Link>
      <Link to="/faq">Часто задаваемые вопросы</Link>
      <Link to="/profile">Личный кабинет</Link>
    </nav>
    <div className="auth-actions">
      {!user && (
        <>
          <button className="primary" onClick={() => onOpenModal('register')}>
            Регистрация
          </button>
          <button className="ghost" onClick={() => onOpenModal('register')}>
            Войти
          </button>
        </>
      )}
      {user && (
        <button className="ghost" onClick={onLogout}>
          Выйти
        </button>
      )}
    </div>
    <div className="sidebar-note">
      <p className="note-title">Найди свой маршрут</p>
      <p className="note-text">
        Собери первые 300 баллов за прогулку по центру и открой сезонные трофеи.
      </p>
    </div>
    <Link className="ghost link-map" to="/map">
      Открыть большую карту
    </Link>
    <Link className="ghost link-map" to="/admin/qr">
      QR-админ
    </Link>
    <button className="theme-toggle" onClick={onToggleTheme}>
      {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
    </button>
  </aside>
)

const FullMapPage = ({
  onSelectPoi,
  userLocation,
  locationStatus,
  locationError,
  autoCapturedIds,
  onOpenRoute,
  routeStops,
  routePath,
  completedRoutes,
}) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams();
  const poiId = searchParams.get('poi_id');
  const [openedPoiId, setOpenedPoiId] = useState(null)

  useEffect(() => {
    if (poiId && poiId !== openedPoiId) {
      const fetchAndOpenPoi = async () => {
        try {
          const response = await fetch(`${API_BASE}/api/pois/${poiId}/`)
          const poiData = await response.json()

          const poiForModal = {
            id: poiData.id,
            name: poiData.title,
            category: 'poi',
            coords: [poiData.coords_lat, poiData.coords_lng],
            description: poiData.description,
            info: poiData.info,
            points: poiData.points,
            qrPoints: poiData.qr_points,
            image: poiData.image,
            character: {
              name: poiData.character_name,
              text: poiData.character_text,
              voice: {
                rate: poiData.character_voice_rate,
                pitch: poiData.character_voice_pitch
              }
            }
          }

          onSelectPoi(poiForModal)
          setOpenedPoiId(poiId)

          // Убираем параметр из URL
          navigate('/map', { replace: true })
        } catch (error) {
          console.error('Error loading POI:', error)
        }
      }

      fetchAndOpenPoi()
    }
  }, [poiId, onSelectPoi, navigate, openedPoiId])

  return (
    <div className="map-page">
      <div className="map-page-header">
        <div>
          <p className="eyebrow">Карта</p>
          <h2>Большая карта Рязани</h2>
          <p>Точки интереса, QR и прогресс территорий — всё на одном экране.</p>
        </div>
        <button className="ghost" onClick={() => navigate('/')}>
          Назад
        </button>
      </div>
      <div className="map-page-body">
        <RyazanMap
          onSelectPoi={onSelectPoi}
          userLocation={userLocation}
          locationStatus={locationStatus}
          locationError={locationError}
          autoCapturedIds={autoCapturedIds}
          routeStops={routeStops}
          routePath={routePath}
        />
      </div>
      <section className="page">
        <header>
          <p className="eyebrow">Маршруты</p>
          <h2>Выбери экскурсию</h2>
          <p>Сравни маршруты и открой подробности одним кликом.</p>
        </header>
        <RouteCards
          routes={ROUTES}
          completedRoutes={completedRoutes}
          onOpenRoute={onOpenRoute}
        />
      </section>
    </div>
  )
}

const Home = ({
  onOpenModal,
  onSelectPoi,
  userLocation,
  locationStatus,
  locationError,
  autoCapturedIds,
  routeStops,
  routePath,
  completedRoutes,
}) => {
  const navigate = useNavigate()
  return (
    <>
      <section id="home" className="hero">
        <div className="map-wrap">
          <div className="map-header">
            <div>
              <p className="eyebrow">Геймификация туризма 2026</p>
              <h1>Рязань - территория открытий</h1>
              <p className="lead">
                Исследуй Рязанскую область через QR-квесты, интерактивную карту
                и реальные награды.
              </p>
            </div>
            <div className="register-card">
              <p className="register-title">Войти или создать профиль</p>
              <p className="register-subtitle">
                Кнопки регистрации находятся в блоке личного кабинета слева.
              </p>
            </div>
          </div>

          <div className="map-shell">
            <button className="map-full-btn" onClick={() => navigate('/map')}>
              На весь экран
            </button>
            <RyazanMap
              onSelectPoi={onSelectPoi}
              userLocation={userLocation}
              locationStatus={locationStatus}
              locationError={locationError}
              autoCapturedIds={autoCapturedIds}
              routeStops={routeStops}
              routePath={routePath}
            />
            <div className="map-mask" aria-hidden="true"></div>
            <div className="map-legend">
              <span className="legend-dot"></span>
              <p>Рязанская область в фокусе</p>
            </div>
          </div>
        </div>

        <div className="mascot-panel">
          <div className="speech">
            <p className="speech-title">Привет! Давай начнем путешествие.</p>
            <p>
              Хочешь узнать больше о Рязани и Рязанской области? Пройди
              небольшую анкету, чтобы я знал, что тебе нравится.
            </p>
            <button className="primary" onClick={() => onOpenModal('legend')}>
              Легенда помощника
            </button>
          </div>
          <div
            className="mascot"
            role="button"
            tabIndex={0}
            onClick={() => onOpenModal('legend')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onOpenModal('legend')
            }}
          >
            <img src={mascotImg} alt="Буба" />
            <p className="mascot-name">Буба, проводник по Рязани</p>
          </div>
        </div>
      </section>

      <section id="routes" className="page">
        <header>
          <p className="eyebrow">Экскурсии и квесты</p>
          <h2>Лента маршрутов</h2>
          <p>
            Городские квесты, гастротуры и прогулки с бонусами.
          </p>
        </header>
        <RouteCards
          routes={ROUTES}
          completedRoutes={completedRoutes}
          onOpenRoute={(route) => onOpenModal('route', route)}
        />
      </section>

      <section id="kids" className="page">
        <header>
          <p className="eyebrow">Персонажи для детей</p>
          <h2>Сказочный аудиогид</h2>
          <p>
            Для семей с детьми: персонаж ведет ребенка по короткому пешему
            маршруту, рассказывает истории в игровой форме и предлагает
            простые задания с QR-сканированием.
          </p>
        </header>
        <div className="cards">
          <article className="card">
            <h3>Маршрут для малышей</h3>
            <p>6 точек в пешей доступности, 30–40 минут.</p>
            <div className="card-tags">
              <span>Аудиогид</span>
              <span>QR</span>
            </div>
          </article>
          <article className="card">
            <h3>Мини‑тест в конце</h3>
            <p>3 вопроса по маршруту, +50 баллов.</p>
            <div className="card-tags">
              <span>Игра</span>
              <span>Баллы</span>
            </div>
          </article>
        </div>
      </section>

      <section id="rewards" className="page">
        <header>
          <p className="eyebrow">Награды</p>
          <h2>Баллы и призы</h2>
          <p>Баллы за коды, маршруты и тесты можно обменять на скидки и подарки.</p>
        </header>
        <div className="cards">
          {REWARD_TIERS.map((tier) => (
            <article key={tier.title} className="card">
              <h3>{tier.title}</h3>
              <ul className="info-list">
                {tier.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="loyalty" className="page">
        <header>
          <p className="eyebrow">Система лояльности</p>
          <h2>Паспорт туриста</h2>
          <p>Собирай штампы за маршруты и смотри прогресс в личном кабинете.</p>
        </header>
        <div className="stamp-row">
          <div className="stamp-slot" aria-label="Штамп 1"></div>
          <div className="stamp-slot" aria-label="Штамп 2"></div>
          <div className="stamp-slot" aria-label="Штамп 3"></div>
        </div>
      </section>

      <section id="faq" className="page">
        <header>
          <p className="eyebrow">FAQ</p>
          <h2>Часто задаваемые вопросы</h2>
          <p>
            Готовый блок для вопросов: как начисляются баллы, где получать
            награды, как работает QR-сканер.
          </p>
        </header>
        <div className="faq">
          <article>
            <h3>Как начисляются баллы?</h3>
            <p>Ответ появится после заполнения базы маршрутов.</p>
          </article>
          <article>
            <h3>Можно ли проходить маршруты без гида?</h3>
            <p>Да, будут доступны самостоятельные и групповые форматы.</p>
          </article>
          <article>
            <h3>Где получить призы?</h3>
            <p>Список партнеров появится в разделе лояльности.</p>
          </article>
        </div>
      </section>
    </>
  )
}

function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [messages, setMessages] = useState(demoMessages)
  const [input, setInput] = useState('')
  const [modalType, setModalType] = useState(null)
  const [selectedPoi, setSelectedPoi] = useState(null)
  const [poiSummary, setPoiSummary] = useState(null)
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [authMode, setAuthMode] = useState('register')
  const [authStatus, setAuthStatus] = useState(null)
  const [authError, setAuthError] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 901px)').matches : true,
  )
  const [points, setPoints] = useState(GUEST_POINTS)
  const [collectedCards, setCollectedCards] = useState(new Set())
  const [checkinStatus, setCheckinStatus] = useState({})
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [locationError, setLocationError] = useState(null)
  const lastGeoRef = useRef(null)
  const lastGeoTsRef = useRef(0)
  const [activeNarrator, setActiveNarrator] = useState(null)
  const [_scannedCards, setScannedCards] = useState(new Set())
  const [capturedTerritories, setCapturedTerritories] = useState(new Set())
  const audioRef = useRef(null)
  const [purchasedRewards, setPurchasedRewards] = useState(new Set())
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [myRoutes, setMyRoutes] = useState(new Set())
  const [activeRouteId, setActiveRouteId] = useState(null)
  const [routeStamps, setRouteStamps] = useState({})
  const [completedRoutes, setCompletedRoutes] = useState(new Set())
  const [progressReady, setProgressReady] = useState(false)
  const saveTimerRef = useRef(null)
  const lastSavedRef = useRef('')
  const level = calculateLevel(points)
  const nextLevelAt = level * 500
  const pointsToNext = Math.max(nextLevelAt - points, 0)
  const activeRoute = ROUTES.find((route) => route.id === activeRouteId) || null
  const activeRouteStops = activeRoute
    ? activeRoute.stops.filter((stop) => Array.isArray(stop.coords))
    : []
  const activeRoutePath =
    userLocation && activeRouteStops.length
      ? [
        [userLocation.lat, userLocation.lng],
        ...activeRouteStops.map((stop) => stop.coords),
      ]
      : []

  useEffect(() => {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported')
      return undefined
    }
    if (DISABLE_GEO_WATCH) {
      setLocationStatus('idle')
      return undefined
    }
    setLocationStatus('requesting')
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
        const now = Date.now()
        const last = lastGeoRef.current
        const lastTs = lastGeoTsRef.current
        const movedEnough =
          !last || getDistanceMeters(last, nextLocation) >= 100
        const timeEnough = now - lastTs >= 60000
        if (!last || movedEnough || timeEnough) {
          lastGeoRef.current = nextLocation
          lastGeoTsRef.current = now
          setUserLocation(nextLocation)
          setLocationStatus((prev) => (prev === 'ready' ? prev : 'ready'))
          setLocationError(null)
        }
      },
      (err) => {
        setLocationStatus(err.code === 1 ? 'denied' : 'error')
        setLocationError(err.message || 'Ошибка геолокации')
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60000,
        timeout: 15000,
      },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const resetProgressToGuest = () => {
    setPoints(GUEST_POINTS)
    setCollectedCards(new Set())
    setPurchasedRewards(new Set())
    setMyRoutes(new Set())
    setCompletedRoutes(new Set())
    setRouteStamps({})
    setActiveRouteId(null)
  }

  const applyProgress = (data) => {
    setPoints(typeof data?.points === 'number' ? data.points : 0)
    setCollectedCards(parseSet(data?.collected_cards))
    setPurchasedRewards(parseSet(data?.purchased_rewards))
    setMyRoutes(parseSet(data?.started_routes))
    setCompletedRoutes(parseSet(data?.completed_routes))
    setRouteStamps(parseRouteStamps(data?.route_stamps))
    setActiveRouteId(data?.active_route_id || null)
  }

  const buildProgressPayload = () => ({
    points,
    collected_cards: Array.from(collectedCards),
    purchased_rewards: Array.from(purchasedRewards),
    started_routes: Array.from(myRoutes),
    completed_routes: Array.from(completedRoutes),
    route_stamps: serializeRouteStamps(routeStamps),
    active_route_id: activeRouteId || '',
  })

  const loadProgress = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/progress/`, {
        credentials: 'include',
      })
      if (!response.ok) return
      const data = await response.json()
      applyProgress(data)
      const serialized = JSON.stringify({
        points: typeof data?.points === 'number' ? data.points : 0,
        collected_cards: Array.isArray(data?.collected_cards) ? data.collected_cards : [],
        purchased_rewards: Array.isArray(data?.purchased_rewards) ? data.purchased_rewards : [],
        started_routes: Array.isArray(data?.started_routes) ? data.started_routes : [],
        completed_routes: Array.isArray(data?.completed_routes) ? data.completed_routes : [],
        route_stamps: typeof data?.route_stamps === 'object' && data?.route_stamps ? data.route_stamps : {},
        active_route_id: data?.active_route_id || '',
      })
      lastSavedRef.current = serialized
      setProgressReady(true)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/me/`, {
          credentials: 'include',
        })
        if (!response.ok) return
        const data = await response.json()
        if (data.authenticated) {
          setUser({ name: data.name, email: data.email })
          setProfile({ name: data.name || '', email: data.email || '' })
        }
      } catch {
        // ignore
      }
    }
    fetchMe()
  }, [])

  useEffect(() => {
    if (!user) {
      setProgressReady(false)
      lastSavedRef.current = ''
      return
    }
    setProgressReady(false)
    loadProgress()
  }, [user?.email])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedPoi?.name) {
        setPoiSummary(null)
        return
      }
      try {
        const response = await fetch(
          `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            selectedPoi.name,
          )}`,
        )
        if (response.ok === false) throw new Error('Wiki error')
        const data = await response.json()
        setPoiSummary(data.extract || null)
      } catch {
        setPoiSummary(null)
      }
    }

    fetchSummary()
  }, [selectedPoi])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMessage = { from: 'user', text: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    setMessages((prev) => [
      ...prev,
      {
        from: 'assistant',
        text: 'Демо-ответ. Подключи Ollama, и я буду отвечать по-настоящему.',
      },
    ])
  }

  const openModal = (type, payload = null) => {
    setModalType(type)
    setAuthStatus(null)
    setAuthError(null)
    if (type === 'route') {
      setSelectedRoute(payload)
    }
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedPoi(null)
    setSelectedRoute(null)
    setAuthStatus(null)
    setAuthError(null)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  const getRouteStamps = (routeId) => routeStamps[routeId] || new Set()

  const toggleRouteStamp = (routeId, stopId) => {
    setRouteStamps((prev) => {
      const next = { ...prev }
      const current = new Set(next[routeId] || [])
      if (current.has(stopId)) {
        current.delete(stopId)
      } else {
        current.add(stopId)
      }
      next[routeId] = current
      return next
    })
  }

  const handleAddRoute = (routeId) => {
    if (completedRoutes.has(routeId)) return
    setMyRoutes((prev) => new Set(prev).add(routeId))
  }

  const handleStartRoute = (routeId) => {
    if (completedRoutes.has(routeId)) return
    setActiveRouteId(routeId)
    setMyRoutes((prev) => new Set(prev).add(routeId))
  }

  const handleCompleteRoute = (route) => {
    if (!route) return
    setCompletedRoutes((prev) => new Set(prev).add(route.id))
    setActiveRouteId((prev) => (prev === route.id ? null : prev))
    setMyRoutes((prev) => {
      const next = new Set(prev)
      next.delete(route.id)
      return next
    })
    setPoints((prev) => prev + route.rewardPoints)
    setSelectedRoute(null)
    setModalType(null)
  }

  useEffect(() => {
    if (!user || !progressReady) return undefined
    const payload = buildProgressPayload()
    const serialized = JSON.stringify(payload)
    if (serialized === lastSavedRef.current) return undefined
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(async () => {
      try {
        await ensureCsrf()
        const csrf = getCookie('csrftoken')
        const response = await fetch(`${API_BASE}/api/progress/`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrf || '',
          },
          body: serialized,
        })
        if (response.ok) {
          lastSavedRef.current = serialized
        }
      } catch {
        // ignore
      }
    }, 500)
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [
    user,
    progressReady,
    points,
    collectedCards,
    purchasedRewards,
    myRoutes,
    completedRoutes,
    routeStamps,
    activeRouteId,
  ])

  const handleAuth = async () => {
    setAuthLoading(true)
    setAuthError(null)
    setAuthStatus(null)
    try {
      await ensureCsrf()
      const csrf = getCookie('csrftoken')
      const payload =
        authMode === 'register'
          ? { name: profile.name, email: profile.email, password }
          : { email: profile.email, password }
      const response = await fetch(
        `${API_BASE}/api/auth/${authMode === 'register' ? 'register' : 'login'}/`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrf || '',
          },
          body: JSON.stringify(payload),
        },
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Ошибка авторизации')
      }
      setUser({ name: data.name, email: data.email })
      setAuthStatus(authMode === 'register' ? 'Аккаунт создан.' : 'Вход выполнен.')
      setPassword('')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await ensureCsrf()
      const csrf = getCookie('csrftoken')
      await fetch(`${API_BASE}/api/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrf || '',
        },
      })
      setUser(null)
      setProfile({ name: '', email: '' })
      resetProgressToGuest()
      setProgressReady(false)
      lastSavedRef.current = ''
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    } catch {
      // ignore
    }
  }

  const handleSelectPoi = (poi) => {
    setSelectedPoi(poi)
    setModalType('poi')
  }

  const speakCharacter = (card, trigger) => {
    if (!card?.character?.text) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(card.character.text)
    utterance.lang = 'ru-RU'
    utterance.rate = card.character.voice?.rate || 1
    utterance.pitch = card.character.voice?.pitch || 1
    setActiveNarrator(`${card.id}:${trigger}`)
    utterance.onend = () => setActiveNarrator(null)
    window.speechSynthesis.speak(utterance)
  }

  const tryCaptureTerritory = (coords) => {
    const territory = TERRITORIES.find((item) => isPointInBounds(coords, item.bounds))
    if (!territory) return
    setCapturedTerritories((prev) => {
      if (prev.has(territory.id)) return prev
      const next = new Set(prev)
      next.add(territory.id)
      return next
    })
  }

  const getMatchedCard = (poi) => {
    if (!poi) return null
    const activeCards = GAME_CARDS.filter((card) => card.active)
    if (!activeCards.length) return null
    const poiName = normalizeName(poi.name)
    const byName = activeCards.find((card) => normalizeName(card.title) === poiName)
    if (byName) return byName
    if (!poi.coords) return null
    let best = null
    let bestDistance = Infinity
    activeCards.forEach((card) => {
      const dist = getDistanceMeters(
        { lat: poi.coords[0], lng: poi.coords[1] },
        { lat: card.coords[0], lng: card.coords[1] },
      )
      if (dist < bestDistance) {
        bestDistance = dist
        best = card
      }
    })
    if (bestDistance <= 250) return best
    if (DISABLE_GEO_CHECK) return best
    return null
  }

  const handleCheckIn = (card) => {
    if (collectedCards.has(card.id) && card.id !== DEMO_CARD_ID) {
      setCheckinStatus((prev) => ({
        ...prev,
        [card.id]: 'Эта карточка уже собрана.',
      }))
      return false
    }
    if (card.id === DEMO_CARD_ID && collectedCards.has(card.id)) {
      setCheckinStatus((prev) => ({
        ...prev,
        [card.id]: 'Демо: карточка снова засчитана.',
      }))
      return true
    }
    if (!userLocation && !DISABLE_GEO_CHECK) {
      setCheckinStatus((prev) => ({
        ...prev,
        [card.id]: 'Включи геолокацию, чтобы отметить посещение.',
      }))
      return false
    }
    const distance = DISABLE_GEO_CHECK
      ? 0
      : getDistanceMeters(userLocation, {
        lat: card.coords[0],
        lng: card.coords[1],
      })
    if (distance <= card.radius || card.id === DEMO_CARD_ID) {
      setCollectedCards((prev) => {
        const next = new Set(prev)
        next.add(card.id)
        return next
      })
      setPoints((prev) => prev + card.points)
      setCheckinStatus((prev) => ({
        ...prev,
        [card.id]: `Засчитано! +${card.points} баллов.`,
      }))
      tryCaptureTerritory(card.coords)
      return true
    } else {
      setCheckinStatus((prev) => ({
        ...prev,
        [card.id]: `Ты далековато: ${Math.round(distance)} м. Подойди ближе.`,
      }))
      return false
    }
  }

  const handleQrScan = (card) => {
    if (!userLocation && !DISABLE_GEO_CHECK) {
      setCheckinStatus((prev) => ({
        ...prev,
        [card.id]: 'Включи геолокацию, чтобы подтвердить QR.',
      }))
      return
    }
    const distance = DISABLE_GEO_CHECK
      ? 0
      : getDistanceMeters(userLocation, {
        lat: card.coords[0],
        lng: card.coords[1],
      })
    if (distance <= card.radius) {
      setScannedCards((prev) => {
        if (prev.has(card.id)) return prev
        const next = new Set(prev)
        next.add(card.id)
        setPoints((pointsPrev) => pointsPrev + (card.qrPoints || 0))
        return next
      })
      setCheckinStatus((prev) => ({
        ...prev,
        [card.id]: `QR подтвержден. +${card.qrPoints || 0} баллов.`,
      }))
      if (card.id !== 'poi-esenin') {
        speakCharacter(card, 'qr')
      }
    } else {
      setCheckinStatus((prev) => ({
        ...prev,
        [card.id]: `Для QR нужно подойти ближе: ${Math.round(distance)} м.`,
      }))
    }
  }

  const handlePoiCheckIn = () => {
    if (!selectedPoi) return
    const matched = getMatchedCard(selectedPoi)
    if (!matched || !matched.active) {
      setCheckinStatus((prev) => ({
        ...prev,
        [selectedPoi.id]: 'Эта точка пока без коллекционной карточки.',
      }))
      return
    }
    const ok = handleCheckIn({
      ...matched,
      coords: selectedPoi.coords || matched.coords,
    })
    if (ok) {
      speakCharacter(matched, 'checkin')
    }
  }

  const handleBuyReward = (reward) => {
    if (purchasedRewards.has(reward.id)) return
    if (points < reward.cost) {
      setCheckinStatus((prev) => ({
        ...prev,
        [reward.id]: 'Недостаточно баллов.',
      }))
      return
    }
    setPoints((prev) => prev - reward.cost)
    setPurchasedRewards((prev) => {
      const next = new Set(prev)
      next.add(reward.id)
      return next
    })
    setCheckinStatus((prev) => ({
      ...prev,
      [reward.id]: `Награда "${reward.title}" добавлена.`,
    }))
  }

  const shellProps = {
    onOpenModal: openModal,
    onToggleTheme: toggleTheme,
    theme,
    sidebarOpen,
    onToggleSidebar: () => setSidebarOpen((prev) => !prev),
    user,
    onLogout: handleLogout,
    points,
    level,
  }

  const Shell = ({ children }) => {
    const location = useLocation()
    const isHome = location.pathname === '/'
    return (
      <div className={`app ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <button
          type="button"
          className="mobile-menu-fab"
          aria-label="Открыть меню"
          onClick={() => setSidebarOpen(true)}
        >
          Меню
        </button>
        <div
          className="sidebar-backdrop"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
        <Sidebar {...shellProps} />
        <main className="main">
          {!isHome && (
            <div className="back-home">
              <Link className="ghost" to="/">
                ← На главную
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Shell>
              <Home
                onOpenModal={openModal}
                onSelectPoi={handleSelectPoi}
                userLocation={userLocation}
                locationStatus={locationStatus}
                locationError={locationError}
                autoCapturedIds={capturedTerritories}
                routeStops={activeRouteStops}
                routePath={activeRoutePath}
                completedRoutes={completedRoutes}
              />
            </Shell>
          }
        />
        <Route
          path="/map"
          element={
            <Shell>
              <FullMapPage
                onSelectPoi={handleSelectPoi}
                userLocation={userLocation}
                locationStatus={locationStatus}
                locationError={locationError}
                autoCapturedIds={capturedTerritories}
                onOpenRoute={(route) => openModal('route', route)}
                routeStops={activeRouteStops}
                routePath={activeRoutePath}
                completedRoutes={completedRoutes}
              />
            </Shell>
          }
        />
        <Route
          path="/scan/:code"
          element={
            <Shell>
              <PoiWelcome />
            </Shell>
          }
        />
        <Route
          path="/admin/qr"
          element={
            <Shell>
              <QRAdmin />
            </Shell>
          }
        />
        <Route
          path="/routes"
          element={
            <Shell>
              <PageShell
                title="Экскурсии и квесты"
                subtitle="Сюжетные маршруты, QR-точки и задания."
              >
                <RouteCards
                  routes={ROUTES}
                  completedRoutes={completedRoutes}
                  onOpenRoute={(route) => openModal('route', route)}
                />
              </PageShell>
            </Shell>
          }
        />
        <Route
          path="/cards"
          element={
            <Shell>
              <PageShell
                title="Коллекционные карточки"
                subtitle="Собирай карточки, отмечая посещение на карте."
              >
                <div className="cards collectibles">
                  {GAME_CARDS.map((card) => {
                    const collected = collectedCards.has(card.id)
                    return (
                      <article key={card.id} className="card collectible-card">
                        <img
                          className="collectible-photo"
                          src={card.image}
                          alt={card.title}
                          loading="lazy"
                          onError={(e) => { e.target.src = '/placeholder.png' }}
                        />
                        <div className="collectible-head">
                          <h3>{card.title}</h3>
                          <span className="collectible-points">
                            +{card.points} баллов
                          </span>
                        </div>
                        <p>{card.desc}</p>
                        <p className="collectible-info">{card.info}</p>
                        <div className="character-card">
                          <div>
                            <p className="character-name">{card.character.name}</p>
                            <p className="character-text">{card.character.text}</p>
                          </div>
                          <span className="character-chip">ИИ-персонаж</span>
                        </div>
                        <div className="card-tags">
                          <span>
                            {card.active
                              ? collected
                                ? 'Собрано'
                                : 'Ожидает посещения'
                              : 'Скоро в игре'}
                          </span>
                          <span>Радиус: {card.radius} м</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </PageShell>
            </Shell>
          }
        />
        <Route
          path="/kids"
          element={
            <Shell>
              <PageShell
                title="Детский аудиогид"
                subtitle="Короткие маршруты и игровые истории для детей."
              >
                <div className="cards">
                  <article className="card">
                    <h3>Маршрут для малышей</h3>
                    <p>6 точек, 30–40 минут, QR-навигация.</p>
                  </article>
                  <article className="card">
                    <h3>Мини‑тест в конце</h3>
                    <p>3 вопроса по маршруту, +50 баллов.</p>
                  </article>
                </div>
              </PageShell>
            </Shell>
          }
        />
        <Route
          path="/achievements"
          element={
            <Shell>
              <PageShell
                title="Достижения"
                subtitle="Серии посещений, статусы и коллекции."
              >
                <div className="cards">
                  {['Первооткрыватель', 'Ночной исследователь', 'Летописец'].map(
                    (title) => (
                      <article key={title} className="card">
                        <h3>{title}</h3>
                        <p>Условие получения появится здесь.</p>
                      </article>
                    ),
                  )}
                </div>
              </PageShell>
            </Shell>
          }
        />
        <Route
          path="/rewards"
          element={
            <Shell>
              <PageShell
                title="Награды"
                subtitle="Список доступных призов и скидок."
              >
                <div className="cards">
                  {REWARDS.filter((reward) => !purchasedRewards.has(reward.id)).map(
                    (reward) => (
                      <article key={reward.id} className="card">
                        <h3>{reward.title}</h3>
                        <p>Стоимость: {reward.cost} баллов.</p>
                        <button
                          className="primary"
                          type="button"
                          onClick={() => handleBuyReward(reward)}
                          disabled={points < reward.cost}
                        >
                          Купить
                        </button>
                        {checkinStatus[reward.id] && (
                          <p className="collectible-status">
                            {checkinStatus[reward.id]}
                          </p>
                        )}
                      </article>
                    ),
                  )}
                </div>
              </PageShell>
            </Shell>
          }
        />
        <Route
          path="/profile"
          element={
            <Shell>
              <PageShell
                title="Личный кабинет"
                subtitle="Ваш прогресс, достижения и настройки."
              >
                <section className="profile-hero">
                  <div className="profile-card">
                    <div className="profile-avatar"></div>
                    <div>
                      <p className="profile-name">{profile.name || 'Гость'}</p>
                      <p className="profile-email">{profile.email || 'Не указан'}</p>
                    </div>
                  </div>
                  <div className="profile-stats">
                    <div className="stat">
                      <p className="stat-label">Накоплено баллов</p>
                      <p className="stat-value">{formatNumber(points)}</p>
                    </div>
                    <div className="stat">
                      <p className="stat-label">Текущий уровень</p>
                      <p className="stat-value">{level}</p>
                    </div>
                    <div className="stat">
                      <p className="stat-label">До следующего уровня</p>
                      <p className="stat-value">{formatNumber(pointsToNext)} баллов</p>
                    </div>
                  </div>
                </section>

                <section className="profile-section">
                  <h3 className="section-title">Мои маршруты</h3>
                  <div className="cards">
                    {ROUTES.filter((route) => myRoutes.has(route.id)).length === 0 ? (
                      <p className="collectible-empty">
                        Пока нет добавленных маршрутов.
                      </p>
                    ) : (
                      ROUTES.filter((route) => myRoutes.has(route.id)).map((route) => (
                        <article key={route.id} className="card">
                          <h4>{route.title}</h4>
                          <p>Статус: в процессе</p>
                        </article>
                      ))
                    )}
                  </div>
                </section>

                <section className="profile-section">
                  <h3 className="section-title">Пройденные маршруты</h3>
                  <div className="cards">
                    {ROUTES.filter((route) => completedRoutes.has(route.id)).length ===
                      0 ? (
                      <p className="collectible-empty">
                        Пока нет завершённых маршрутов.
                      </p>
                    ) : (
                      ROUTES.filter((route) => completedRoutes.has(route.id)).map(
                        (route) => (
                          <article key={route.id} className="card">
                            <h4>{route.title}</h4>
                            <p>Награда получена: +{route.rewardPoints} баллов</p>
                          </article>
                        ),
                      )
                    )}
                  </div>
                </section>

                <section className="profile-section">
                  <h3 className="section-title">Мои достижения</h3>
                  <div className="badge-grid">
                    {[
                      { title: 'Первооткрыватель', desc: '+100 баллов' },
                      { title: 'Городской следопыт', desc: '5 маршрутов' },
                      { title: 'Ночной исследователь', desc: 'вечерний квест' },
                      { title: 'Летописец', desc: '10 QR-точек' },
                      { title: 'Друзья Бубы', desc: 'семейный маршрут' },
                    ].map((item, index) => (
                      <article key={item.title} className="badge">
                        <div className={`badge-icon badge-${index + 1}`}>
                          {item.title[0]}
                        </div>
                        <div>
                          <p className="badge-title">{item.title}</p>
                          <p className="badge-desc">{item.desc}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="profile-section">
                  <h3 className="section-title">Собранные карточки</h3>
                  {GAME_CARDS.filter((card) => collectedCards.has(card.id)).length ===
                    0 ? (
                    <p className="collectible-empty">
                      Пока нет собранных карточек. Отметь посещение на карте.
                    </p>
                  ) : (
                    <div className="cards collectibles">
                      {GAME_CARDS.filter((card) => collectedCards.has(card.id)).map(
                        (card) => (
                          <article key={card.id} className="card collectible-card">
                            <img
                              className="collectible-photo"
                              src={card.image}
                              alt={card.title}
                              loading="lazy"
                              onError={(e) => { e.target.src = '/placeholder.png' }}
                            />
                            <div className="collectible-head">
                              <h3>{card.title}</h3>
                              <span className="collectible-points">
                                +{card.points} баллов
                              </span>
                            </div>
                            <p>{card.desc}</p>
                            <p className="collectible-info">{card.info}</p>
                            <div className="character-card">
                              <div>
                                <p className="character-name">{card.character.name}</p>
                                <p className="character-text">{card.character.text}</p>
                              </div>
                              <span className="character-chip">ИИ-персонаж</span>
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  )}
                </section>

                <section className="profile-section">
                  <h3 className="section-title">Мои награды</h3>
                  {REWARDS.filter((reward) => purchasedRewards.has(reward.id)).length ===
                    0 ? (
                    <p className="collectible-empty">
                      Пока нет купленных наград. Загляни в раздел «Награды».
                    </p>
                  ) : (
                    <div className="cards">
                      {REWARDS.filter((reward) => purchasedRewards.has(reward.id)).map(
                        (reward) => (
                          <article key={reward.id} className="card">
                            <h3>{reward.title}</h3>
                            <p>Оплачено: {reward.cost} баллов.</p>
                          </article>
                        ),
                      )}
                    </div>
                  )}
                </section>
              </PageShell>
            </Shell>
          }
        />
        <Route
          path="/loyalty"
          element={
            <Shell>
              <PageShell
                title="Система лояльности"
                subtitle="Статусы туриста и уровни опыта."
              >
                <p className="page-note">
                  Статус зависит от суммарного опыта за все время, даже если
                  баллы тратятся на награды. Повышение открывает бонусы и
                  доступ к новым квестам.
                </p>
                <div className="levels-table">
                  <div className="levels-row levels-head">
                    <span>№</span>
                    <span>Статус</span>
                    <span>Порог</span>
                    <span>Бонус</span>
                  </div>
                  {LEVELS.map((levelItem) => (
                    <div key={levelItem.rank} className="levels-row">
                      <span>{levelItem.rank}</span>
                      <span>{levelItem.title}</span>
                      <span>{levelItem.threshold}</span>
                      <span>{levelItem.bonus}</span>
                    </div>
                  ))}
                </div>
                <div className="cards">
                  <article className="card">
                    <h3>За что начислять баллы</h3>
                    <ul className="info-list">
                      {POINTS_SOURCES.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  {REWARD_TIERS.map((tier) => (
                    <article key={tier.title} className="card">
                      <h3>{tier.title}</h3>
                      <ul className="info-list">
                        {tier.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </PageShell>
            </Shell>
          }
        />
        <Route path="/campaign/:code/" element={<PoiWelcome />} />
        <Route path="/scan/:code/" element={<PoiWelcome />} />
        <Route
          path="/faq"
          element={
            <Shell>
              <PageShell
                title="FAQ"
                subtitle="Ответы на частые вопросы о квестах и наградах."
              >
                <div className="faq">
                  <article>
                    <h3>Как начисляются баллы?</h3>
                    <p>Ответ появится после заполнения базы маршрутов.</p>
                  </article>
                  <article>
                    <h3>Можно ли проходить маршруты без гида?</h3>
                    <p>Да, будут доступны самостоятельные и групповые форматы.</p>
                  </article>
                  <article>
                    <h3>Где получить призы?</h3>
                    <p>Список партнеров появится в разделе лояльности.</p>
                  </article>
                </div>
              </PageShell>
            </Shell>
          }
        />
      </Routes>

      {modalType && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <button className="modal-close" onClick={closeModal}>
              Закрыть
            </button>

            {modalType === 'register' && (
              <div className="modal-body">
                <div className="modal-head">
                  <h3>{authMode === 'register' ? 'Регистрация' : 'Вход'}</h3>
                  <div className="modal-switch">
                    <button
                      className={`ghost ${authMode === 'register' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setAuthMode('register')}
                    >
                      Регистрация
                    </button>
                    <button
                      className={`ghost ${authMode === 'login' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setAuthMode('login')}
                    >
                      Вход
                    </button>
                  </div>
                </div>
                <p className="modal-subtitle">
                  {authMode === 'register'
                    ? 'Создай профиль, чтобы сохранять прогресс и баллы.'
                    : 'Войди, чтобы продолжить путешествие.'}
                </p>
                <form className="modal-form">
                  {authMode === 'register' && (
                    <input
                      type="text"
                      placeholder="Имя"
                      autoComplete="name"
                      value={profile.name}
                      onChange={(event) =>
                        setProfile((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    value={profile.email}
                    onChange={(event) =>
                      setProfile((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                  <input
                    type="password"
                    placeholder="Пароль"
                    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    className="primary"
                    type="button"
                    onClick={handleAuth}
                    disabled={authLoading}
                  >
                    {authLoading
                      ? 'Подождите...'
                      : authMode === 'register'
                        ? 'Создать аккаунт'
                        : 'Войти'}
                  </button>
                  {authStatus && <p className="modal-success">{authStatus}</p>}
                  {authError && <p className="modal-error">{authError}</p>}
                </form>
              </div>
            )}

            {modalType === 'legend' && (
              <div className="modal-body">
                <h3>Легенда Бубы</h3>
                <p className="modal-subtitle">
                  Буба — хранитель рязанских троп. Он появился из старого леса,
                  чтобы помогать путешественникам находить тайные истории города.
                </p>
                <p>
                  Говорят, что его грибная шляпа меняет цвет, когда рядом есть
                  новая история или забытая легенда.
                </p>
                <button className="primary" type="button" onClick={closeModal}>
                  Спасибо, Буба!
                </button>
              </div>
            )}

            {modalType === 'route' && selectedRoute && (
              <div className="modal-body route-modal">
                <div className="modal-head">
                  <h3>{selectedRoute.title}</h3>
                  <p className="modal-subtitle">{selectedRoute.subtitle}</p>
                </div>
                <p className="modal-subtitle">{selectedRoute.summary}</p>
                <div className="route-actions">
                  {!myRoutes.has(selectedRoute.id) && (
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => handleAddRoute(selectedRoute.id)}
                      disabled={completedRoutes.has(selectedRoute.id)}
                    >
                      Добавить к себе
                    </button>
                  )}
                  {activeRouteId !== selectedRoute.id && (
                    <button
                      className="primary"
                      type="button"
                      onClick={() => handleStartRoute(selectedRoute.id)}
                      disabled={completedRoutes.has(selectedRoute.id)}
                    >
                      {completedRoutes.has(selectedRoute.id)
                        ? 'Маршрут завершен'
                        : 'Начать маршрут'}
                    </button>
                  )}
                  {activeRouteId === selectedRoute.id && (
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => setActiveRouteId(null)}
                    >
                      Пауза
                    </button>
                  )}
                </div>
                <div className="route-stops">
                  {selectedRoute.stops.map((stop) => {
                    const stamps = getRouteStamps(selectedRoute.id)
                    const checked = stamps.has(stop.id)
                    const disabled = activeRouteId !== selectedRoute.id || !stop.inRoute
                    return (
                      <label
                        key={stop.id}
                        className={`route-stop ${stop.inRoute ? '' : 'route-stop-muted'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleRouteStamp(selectedRoute.id, stop.id)}
                        />
                        <div>
                          <p className="route-stop-title">{stop.name}</p>
                          <p className="route-stop-meta">{stop.address}</p>
                          {stop.note && (
                            <p className="route-stop-note">{stop.note}</p>
                          )}
                          {!stop.inRoute && (
                            <p className="route-stop-note">
                              Не входит в маршрут, только отметка на карте.
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
                {(() => {
                  const requiredStops = selectedRoute.stops.filter((stop) => stop.inRoute)
                  const stamps = getRouteStamps(selectedRoute.id)
                  const completed = selectedRoute.isDemo
                    ? true
                    : requiredStops.every((stop) => stamps.has(stop.id))
                  const alreadyCompleted = completedRoutes.has(selectedRoute.id)
                  const stampsCount = selectedRoute.isDemo
                    ? requiredStops.length
                    : stamps.size
                  return (
                    <div className="route-complete">
                      <p>
                        Штампы: {stampsCount} / {requiredStops.length}
                      </p>
                      <button
                        className="primary"
                        type="button"
                        disabled={!completed || alreadyCompleted}
                        onClick={() => handleCompleteRoute(selectedRoute)}
                      >
                        {alreadyCompleted
                          ? 'Маршрут завершен'
                          : `Завершить и получить +${selectedRoute.rewardPoints}`}
                      </button>
                    </div>
                  )
                })()}
              </div>
            )}

            {modalType === 'poi' && selectedPoi && (
              <div className="modal-body">
                {(() => {
                  const matched = getMatchedCard(selectedPoi)
                  const key = matched ? matched.id : selectedPoi.id
                  const collected =
                    matched && matched.active ? collectedCards.has(matched.id) : false
                  return (
                    <>
                      <h3>{selectedPoi.name}</h3>
                      <p className="modal-subtitle">
                        История и информация из открытых источников.
                      </p>
                      {matched && matched.active && (
                        <>
                          <img
                            className="collectible-photo"
                            src={matched.image}
                            alt={matched.title}
                            onError={(e) => { e.target.src = '/placeholder.png' }}
                          />
                          <p className="collectible-info">{matched.info}</p>
                          <div className="character-card">
                            <div>
                              <p className="character-name">
                                {matched.character.name}
                              </p>
                              <p className="character-text">
                                {matched.character.text}
                              </p>
                            </div>
                            <span className="character-chip">ИИ-персонаж</span>
                          </div>
                        </>
                      )}
                      {poiSummary && <p className="poi-summary">{poiSummary}</p>}
                      <div className="poi-meta">
                        <span>
                          Категория: {selectedPoi.category || 'Точка интереса'}
                        </span>
                        <span>QR: {selectedPoi.qr || 'Ожидает интеграции'}</span>
                      </div>
                      <div className="poi-qr">
                        <div className="qr-placeholder">QR</div>
                        <p>Сканируй QR, чтобы услышать историю персонажа.</p>
                      </div>
                      <div className="collectible-actions">
                        <button
                          className="ghost"
                          type="button"
                          onClick={() =>
                            matched &&
                            matched.active &&
                            handleQrScan({
                              ...matched,
                              coords: selectedPoi.coords || matched.coords,
                            })
                          }
                          disabled={!matched || !matched.active}
                        >
                          Сканировать QR
                        </button>
                        <button
                          className="primary"
                          type="button"
                          onClick={handlePoiCheckIn}
                          disabled={collected || !matched || !matched.active}
                        >
                          {collected ? 'Уже собрано' : 'Я здесь!'}
                        </button>
                      </div>
                      {activeNarrator?.startsWith(matched?.id || '') && (
                        <p className="collectible-status">Идёт озвучка персонажа…</p>
                      )}
                      {matched && !matched.active && (
                        <p className="collectible-status">
                          Эта карточка скоро появится в коллекции.
                        </p>
                      )}
                      {checkinStatus[key] && (
                        <p className="collectible-status">{checkinStatus[key]}</p>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`chat-dock ${chatOpen ? 'open' : ''}`}>
        <button
          className="chat-fab"
          onClick={() => setChatOpen((prev) => !prev)}
          aria-label="Открыть чат с помощником"
        >
          <img src={mascotImg} alt="" />
        </button>
        <div className="chat-panel">
          <header className="chat-header">
            <div>
              <p className="chat-title">AI-помощник</p>
              <p className="chat-subtitle">Спроси про маршруты или баллы</p>
            </div>
            <button className="chat-close" onClick={() => setChatOpen(false)}>
              Закрыть
            </button>
          </header>
          <div className="chat-body">
            {messages.map((message, index) => (
              <div
                key={`${message.from}-${index}`}
                className={`chat-bubble ${message.from}`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Напишите сообщение..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSend()
              }}
            />
            <button className="primary" onClick={handleSend}>
              Отправить
            </button>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App
