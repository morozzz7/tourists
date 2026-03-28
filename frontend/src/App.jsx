import { useEffect, useRef, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import RyazanMap from './components/Map'
import QRAdmin from './components/QRAdmin'
import CharacterWelcome from './components/CharacterWelcome'
import mascotImg from './assets/hero.png'
import './App.css'


const demoMessages = [
  {
    from: 'assistant',
    text: 'Привет! Я помогу выбрать маршрут или объяснить, как работают квесты.',
  },
]

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const formatNumber = (value) => value.toLocaleString('ru-RU')
const calculateLevel = (points) => Math.floor(points / 500) + 1
const DISABLE_GEO_CHECK = true
const normalizeName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[ё]/g, 'е')
    .replace(/[^a-zа-я0-9 ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

const TERRITORIES = [
  { id: 't1', name: 'Кремль', bounds: [[54.633, 39.742], [54.638, 39.752]] },
  { id: 't2', name: 'Соборная', bounds: [[54.629, 39.737], [54.634, 39.746]] },
  { id: 't3', name: 'Набережная', bounds: [[54.625, 39.731], [54.631, 39.739]] },
  { id: 't4', name: 'ЦПКиО', bounds: [[54.624, 39.742], [54.629, 39.751]] },
  { id: 't5', name: 'Музейный квартал', bounds: [[54.631, 39.752], [54.636, 39.760]] },
  { id: 't6', name: 'Лыбедский бульвар', bounds: [[54.626, 39.724], [54.632, 39.733]] },
]

const GAME_CARDS = [
  {
    id: 'poi-kremlin',
    title: 'Рязанский Кремль',
    desc: 'Собери карту кремля и открой историческую хронику.',
    info:
      'Главный исторический комплекс города с соборами, колокольней и панорамой на Оку.',
    coords: [54.6348, 39.7486],
    points: 120,
    qrPoints: 20,
    radius: 160,
    image: '/images/kremlin.jpg',
    character: {
      name: 'Гид Федот',
      text:
        'Добро пожаловать в сердце древней Рязани! Посмотри вверх — колокольня хранит сотни лет историй.',
      voice: { rate: 1, pitch: 0.9 },
    },
    active: false,
  },
  {
    id: 'poi-esenin',
    title: 'Памятник Есенину',
    desc: 'Слушай стихи, чтобы открыть редкую карточку.',
    info:
      'Монумент поэту у набережной — любимая точка прогулок и городских маршрутов.',
    coords: [54.636, 39.747],
    points: 90,
    qrPoints: 25,
    radius: 140,
    image: '/images/esenin.jpg',
    character: {
      name: 'Сергей Есенин',
      text:
        'Ты здесь — и строки оживают. Вдохни воздух Оки и запомни этот вид.',
      audio: '/audio/esenin.mp3',
      voice: { rate: 1.05, pitch: 1.2 },
    },
    active: true,
  },
  {
    id: 'poi-mushrooms',
    title: 'Грибы с глазами',
    desc: 'Найди арт-объект и получи бонус за фото.',
    info:
      'Городская легенда и любимое место для фото: улыбчивые грибы охраняют район.',
    coords: [54.6288, 39.7345],
    points: 70,
    qrPoints: 15,
    radius: 120,
    image: '/images/mushrooms.jpg',
    character: {
      name: 'Буба',
      text:
        'Эти грибы с глазами знают все тайные тропы. Сделай фото и получи дружескую улыбку!',
      voice: { rate: 0.95, pitch: 1.15 },
    },
    active: false,
  },
  {
    id: 'poi-theatre',
    title: 'Рязанский театр драмы',
    desc: 'Подними занавес, чтобы открыть городскую сцену.',
    info:
      'Один из старейших театров региона, где каждый сезон звучат премьеры и классика.',
    coords: [54.6322, 39.7325],
    points: 110,
    qrPoints: 20,
    radius: 150,
    image: '/images/drama.jpg',
    character: {
      name: 'Режиссер Аркадий',
      text:
        'Свет рампы уже близко! Представь, как здесь звучит аплодисмент после премьеры.',
      voice: { rate: 0.98, pitch: 0.85 },
    },
    active: false,
  },
  {
    id: 'poi-pedestrian',
    title: 'Почтовая улица',
    desc: 'Найди тайный знак на пешеходной улице.',
    info:
      'Главная прогулочная улица с кофейнями, музыкой и ярмарками в сезон.',
    coords: [54.6299, 39.7378],
    points: 80,
    qrPoints: 15,
    radius: 130,
    image: '/images/post.jpg',
    character: {
      name: 'Курьер Сева',
      text:
        'Быстрый маршрут готов! Слушай шум улицы и собирай отметки на пути.',
      voice: { rate: 1.1, pitch: 1.0 },
    },
    active: false,
  },
]

const REWARDS = [
  { id: 'reward-coffee', title: 'Кофе и выпечка', cost: 200 },
  { id: 'reward-bike', title: 'Прокат велосипедов', cost: 350 },
  { id: 'reward-museum', title: 'Билет в музей', cost: 500 },
]

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

const ensureCsrf = async () => {
  await fetch(`${API_BASE}/api/auth/csrf/`, {
    credentials: 'include',
  })
}

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
    <Link className="primary sidebar-profile-cta" to="/profile">
      В личный кабинет
    </Link>
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
}) => {
  const navigate = useNavigate()
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
        />
      </div>
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
              Список приключений с QR-точками, тайниками и сюжетными линиями.
              Пока пусто, но место уже готово для карточек маршрутов.
            </p>
          </header>
          <div className="cards">
            {['Исторический центр', 'Квест по музеям', 'Природные тропы'].map(
              (title) => (
                <article key={title} className="card">
                  <h3>{title}</h3>
                  <p>Описание маршрута появится здесь.</p>
                  <div className="card-tags">
                    <span>QR</span>
                    <span>60–90 мин</span>
                  </div>
                </article>
              ),
            )}
          </div>
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
            {['Кофе и выпечка', 'Прокат велосипедов', 'Сувениры'].map((title) => (
              <article key={title} className="card">
                <h3>{title}</h3>
                <p>Партнерские предложения появятся здесь.</p>
              </article>
            ))}
          </div>
        </section>

        <section id="loyalty" className="page">
          <header>
            <p className="eyebrow">Система лояльности</p>
            <h2>Паспорт туриста</h2>
            <p>Чем больше открытых точек, тем выше статус и больше бонусов.</p>
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [points, setPoints] = useState(1240)
  const [collectedCards, setCollectedCards] = useState(new Set())
  const [checkinStatus, setCheckinStatus] = useState({})
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [locationError, setLocationError] = useState(null)
  const [activeNarrator, setActiveNarrator] = useState(null)
  const [scannedCards, setScannedCards] = useState(new Set())
  const [capturedTerritories, setCapturedTerritories] = useState(new Set())
  const audioRef = useRef(null)
  const [purchasedRewards, setPurchasedRewards] = useState(new Set())
  const level = calculateLevel(points)
  const nextLevelAt = level * 500
  const pointsToNext = Math.max(nextLevelAt - points, 0)

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
    setLocationStatus('requesting')
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setLocationStatus('ready')
        setLocationError(null)
      },
      (err) => {
        setLocationStatus(err.code === 1 ? 'denied' : 'error')
        setLocationError(err.message || 'Ошибка геолокации')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

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
      } catch (err) {
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

    // TODO: Подключить Ollama здесь.
    // const reply = await fetch('/api/ollama', { method: 'POST', body: JSON.stringify({ prompt: userMessage.text }) })
    // const data = await reply.json()
    // setMessages((prev) => [...prev, { from: 'assistant', text: data.message }])

    setMessages((prev) => [
      ...prev,
      {
        from: 'assistant',
        text: 'Демо-ответ. Подключи Ollama, и я буду отвечать по-настоящему.',
      },
    ])
  }

  const openModal = (type) => {
    setModalType(type)
    setAuthStatus(null)
    setAuthError(null)
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedPoi(null)
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
    if (card.character.audio) {
      const audio = new Audio(card.character.audio)
      audioRef.current = audio
      setActiveNarrator(`${card.id}:${trigger}`)
      audio.onended = () => setActiveNarrator(null)
      audio.onerror = () => {
        setActiveNarrator(null)
      }
      audio.play().catch(() => {
        setActiveNarrator(null)
      })
      return
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

  const isPointInBounds = (coords, bounds) => {
    const [lat, lng] = coords
    const [[lat1, lng1], [lat2, lng2]] = bounds
    const minLat = Math.min(lat1, lat2)
    const maxLat = Math.max(lat1, lat2)
    const minLng = Math.min(lng1, lng2)
    const maxLng = Math.max(lng1, lng2)
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng
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
    const byContains = activeCards.find((card) =>
      poiName.includes(normalizeName(card.title)),
    )
    if (byContains) return byContains
    const esenin = activeCards.find((card) =>
      normalizeName(card.title).includes('есенин'),
    )
    if (esenin && (poiName.includes('есенин') || poiName.includes('yesenin'))) {
      return esenin
    }
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
    if (collectedCards.has(card.id)) {
      setCheckinStatus((prev) => ({
        ...prev,
        [card.id]: 'Эта карточка уже собрана.',
      }))
      return false
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
    if (distance <= card.radius) {
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
      speakCharacter(card, 'qr')
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

  const Shell = ({ children }) => (
    <div className={`app ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <Sidebar {...shellProps} />
      <main className="main">{children}</main>
    </div>
  )

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
              />
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
          path="/campaign/:code/"
          element={
            <Shell>
              <CharacterWelcome />
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
                <div className="cards">
                  {['Исторический центр', 'Квест по музеям', 'Природные тропы'].map(
                    (title) => (
                      <article key={title} className="card">
                        <h3>{title}</h3>
                        <p>Описание маршрута появится здесь.</p>
                      </article>
                    ),
                  )}
                </div>
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
                  {REWARDS.filter((reward) => purchasedRewards.has(reward.id)).length ===
                    0 && (
                    <article className="card">
                      <h3>Награды будут здесь</h3>
                      <p>Собирай баллы, чтобы открыть покупки.</p>
                    </article>
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
                  {[
                    'Исторический центр (8 точек)',
                    'Квест по музеям (5 точек)',
                    'Лесной маршрут Бубы (12 точек)',
                  ].map((title) => (
                    <article key={title} className="card">
                      <h4>{title}</h4>
                      <p>Статус: в процессе</p>
                    </article>
                  ))}
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

              <section className="profile-section">
                <h3 className="section-title">Настройки профиля и данных</h3>
                <form className="profile-form">
                  <label>
                    Имя
                    <input
                      type="text"
                      placeholder="Ваше имя"
                      value={profile.name}
                      onChange={(event) =>
                        setProfile((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={profile.email}
                      onChange={(event) =>
                        setProfile((prev) => ({ ...prev, email: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Город
                    <input type="text" placeholder="Рязань" defaultValue="Рязань" />
                  </label>
                  <div className="profile-actions">
                    <button className="primary" type="button">
                      Сохранить изменения
                    </button>
                    <button className="ghost" type="button">
                      Экспортировать данные
                    </button>
                  </div>
                </form>
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
                <div className="cards">
                  {['Новичок', 'Исследователь', 'Амбассадор'].map((title) => (
                    <article key={title} className="card">
                      <h3>{title}</h3>
                      <p>Условия и бонусы уровня появятся здесь.</p>
                    </article>
                  ))}
                </div>
              </PageShell>
            </Shell>
          }
        />
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
                      value={profile.name}
                      onChange={(event) =>
                        setProfile((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    value={profile.email}
                    onChange={(event) =>
                      setProfile((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                  <input
                    type="password"
                    placeholder="Пароль"
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
