// App.jsx - исправленная версия
import { useEffect, useRef, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import RyazanMap from './components/Map'
import QRAdmin from './components/QRAdmin'
import PoiWelcome from './components/PoiWelcome'
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
    info: 'Главный исторический комплекс города с соборами, колокольней и панорамой на Оку.',
    coords: [54.6348, 39.7486],
    points: 120,
    qrPoints: 20,
    radius: 160,
    image: '/images/kremlin.jpg',
    character: {
      name: 'Гид Федот',
      text: 'Добро пожаловать в сердце древней Рязани! Посмотри вверх — колокольня хранит сотни лет историй.',
      voice: { rate: 1, pitch: 0.9 },
    },
    active: true,
  },
  {
    id: 'poi-esenin',
    title: 'Памятник Есенину',
    desc: 'Слушай стихи, чтобы открыть редкую карточку.',
    info: 'Монумент поэту у набережной — любимая точка прогулок и городских маршрутов.',
    coords: [54.636, 39.747],
    points: 90,
    qrPoints: 25,
    radius: 140,
    image:
      '/images/%D0%BF%D0%B0%D0%BC%D1%8F%D1%82%D0%BD%D0%B8%D0%BA%D0%B5%D1%81%D0%B5%D0%BD%D0%B8%D0%BD%D1%83.jpg',
    character: {
      name: 'Сергей Есенин',
      text: 'Ты здесь — и строки оживают. Вдохни воздух Оки и запомни этот вид.',
      voice: { rate: 1.05, pitch: 1.2 },
    },
    active: true,
  },
  {
    id: 'poi-mushrooms',
    title: 'Грибы с глазами',
    desc: 'Найди арт-объект и получи бонус за фото.',
    info: 'Городская легенда и любимое место для фото: улыбчивые грибы охраняют район.',
    coords: [54.6288, 39.7345],
    points: 70,
    qrPoints: 15,
    radius: 120,
    image: '/images/mushrooms.jpg',
    character: {
      name: 'Буба',
      text: 'Эти грибы с глазами знают все тайные тропы. Сделай фото и получи дружескую улыбку!',
      voice: { rate: 0.95, pitch: 1.15 },
    },
    active: true,
  },
  {
    id: 'poi-pochtovaya',
    title: 'Почтовая улица',
    desc: 'Прогулка по самой атмосферной улице города.',
    info: 'Пешеходная артерия с историческими фасадами, музыкантами и кофейнями.',
    coords: [54.6299, 39.7365],
    points: 80,
    qrPoints: 20,
    radius: 140,
    image: '/images/post.jpg',
    character: {
      name: 'Курьер Сева',
      text: 'Здесь каждый дом — как открытка. Прислушайся к уличным историям.',
      voice: { rate: 0.98, pitch: 0.95 },
    },
    active: true,
  },
  {
    id: 'poi-drama',
    title: 'Театр драмы',
    desc: 'Сцена, где оживают истории Рязани.',
    info: 'Один из старейших театров страны и главный культурный маяк центра.',
    coords: [54.6292, 39.7322],
    points: 100,
    qrPoints: 25,
    radius: 150,
    image: '/images/drama.jpg',
    character: {
      name: 'Режисёр Алена',
      text: 'Театр — место, где город говорит со сцены. Загляни внутрь и почувствуй магию.',
      voice: { rate: 1.02, pitch: 1.05 },
    },
    active: true,
  },
]

const REWARDS = [
  { id: 'reward-coffee', title: 'Кофе и выпечка', cost: 200 },
  { id: 'reward-bike', title: 'Прокат велосипедов', cost: 350 },
  { id: 'reward-museum', title: 'Билет в музей', cost: 500 },
]

const ROUTES = [
  {
    id: 'demo-route',
    title: 'Демо-маршрут: Кремль и набережная',
    subtitle: 'Короткая прогулка, можно завершить сразу',
    rewardPoints: 200,
    summary:
      'Пробный маршрут, чтобы познакомиться с механикой штампов и наград. Подходит для быстрого старта и теста интерфейса.',
    isDemo: true,
    showOnMap: true,
    stops: [
      {
        id: 'd1',
        name: 'Рязанский Кремль',
        address: 'Кремль',
        coords: [54.6348, 39.7486],
        inRoute: true,
      },
      {
        id: 'd2',
        name: 'Памятник Есенину',
        address: 'Трубежная набережная',
        coords: [54.636, 39.747],
        inRoute: true,
      },
      {
        id: 'd3',
        name: 'Грибы с глазами',
        address: 'ул. Ленина, 24',
        coords: [54.6288, 39.7345],
        inRoute: true,
      },
      {
        id: 'd4',
        name: 'Улица Почтовая',
        address: 'ул. Почтовая',
        coords: [54.6299, 39.7365],
        inRoute: true,
      },
    ],
  },
  {
    id: 'mushroom-trail',
    title: 'Экскурсия 1. Грибной маршрут',
    subtitle: 'Бронзовые грибы и городские легенды',
    rewardPoints: 500,
    summary:
      'По всему центру Рязани и даже в отдаленных районах разбросаны маленькие бронзовые грибы. Их не так просто заметить — они прячутся на набережных, у библиотек, в скверах и во дворах. Суть квеста простая — найти их всех. Это отличный повод неспешно прогуляться по городу, заглянуть в места, куда обычно не доходят туристы, и сделать несколько забавных фото.',
    stops: [
      {
        id: 'm1',
        name: 'Гриб-Мудрец',
        address:
          'Первомайский пр-кт 74 корп.1, перед Центральной городской библиотекой имени Сергея Есенина',
        inRoute: true,
      },
      {
        id: 'm2',
        name: 'Грибная капелла',
        address: 'Первомайский пр-кт 68/2, площадь Победы, перед МКЦ',
        inRoute: true,
      },
      {
        id: 'm3',
        name: 'Гриб-Путешественик',
        address: 'Первомайский пр-кт 54, перед конгресс-отелем «Амакс»',
        inRoute: true,
      },
      {
        id: 'm4',
        name: 'Гриб-Коробейник',
        address: 'Площадь Ленина, перед Торговыми рядами на ул. Кольцова',
        inRoute: true,
      },
      {
        id: 'm5',
        name: 'Гриб-Художник',
        address: 'Трубежная набережная рядом с памятником С.А. Есенину',
        inRoute: true,
      },
      {
        id: 'm6',
        name: 'Гриб-Дозорный',
        address: 'Соборный бульвар, вблизи Глебовского моста',
        inRoute: true,
      },
      {
        id: 'm7',
        name: 'Мужичок-Боровичок',
        address: 'ул. Почтовая 60, по центру улицы между лавочками',
        inRoute: true,
      },
      {
        id: 'm8',
        name: 'Грибная команда',
        address:
          'Лыбедский бульвар, рядом с «Ёлкой» на спуске к Мюнстерской площади',
        inRoute: true,
      },
      {
        id: 'm9',
        name: 'Гриб-Профессор',
        address:
          'ул. Ленина 53, рядом с Рязанским институтом (филиалом) Московского политеха',
        inRoute: true,
      },
      {
        id: 'm10',
        name: 'Семейка «Грибы с глазами»',
        address: 'ул. Ленина, 24',
        inRoute: true,
      },
      {
        id: 'm11',
        name: 'Гриб-Пионер',
        address: 'ул. Есенина 46, перед Дворцом Первых',
        inRoute: true,
      },
      {
        id: 'm12',
        name: 'Грибная пара',
        address: 'Театральная площадь возле фонтана',
        inRoute: true,
      },
      {
        id: 'm13',
        name: 'Гриб-Рыбак',
        address: 'район Канищево, ул. Интернациональная 27, рядом со школой №69',
        inRoute: false,
      },
      {
        id: 'm14',
        name: 'Гриб-Строитель',
        address: 'ул. Васильевская 20',
        inRoute: false,
      },
    ],
  },
  {
    id: 'ryazan-contrasts',
    title: 'Экскурсия 2. Контрасты Рязани',
    subtitle: 'История от Кремля до советского наследия',
    rewardPoints: 500,
    summary:
      'Экскурсия проведёт вас через контрасты рязанской истории: от древнего Кремля — духовного символа «голубой Руси», воспетой Есениным, до памятника поэту на набережной, а затем по купеческой Почтовой к советскому наследию — памятнику Ленину, зданию Цирка и площади 26 Бакинских Комиссаров.',
    stops: [
      {
        id: 'r1',
        name: 'Площадь 26 Бакинских комиссаров',
        address: 'Площадь 26 Бакинских комиссаров',
        inRoute: true,
      },
      {
        id: 'r2',
        name: 'Цирк',
        address: 'Здание цирка',
        inRoute: true,
      },
      {
        id: 'r3',
        name: 'Рязанский Кремль',
        address: 'Кремль',
        inRoute: true,
      },
      {
        id: 'r4',
        name: 'Памятник Есенину',
        address: 'Набережная',
        inRoute: true,
      },
      {
        id: 'r5',
        name: 'Улица Почтовая',
        address: 'Пешеходная улица Почтовая',
        inRoute: true,
      },
      {
        id: 'r6',
        name: 'Памятник Ленину',
        address: 'Площадь Ленина',
        inRoute: true,
      },
    ],
  },
  {
    id: 'gastrotour',
    title: 'Гастротур. Центр и крафт',
    subtitle: 'Два дня вкусов Рязани',
    rewardPoints: 800,
    summary:
      'Двухдневный гастротур по Рязани: от традиционной кухни у Кремля до крафтовых баров и прогулки по сосновому лесу в Солотче.',
    stops: [
      {
        id: 'g1',
        name: 'День 1. Завтрак — «Чайная»',
        address: 'ул. Соборная, 14/2',
        inRoute: true,
        note: 'Каравайцы со сметаной или рыбой + сбитень. У Кремля.',
      },
      {
        id: 'g2',
        name: 'День 1. Обед — Кремлёвская трапезная',
        address: 'ул. Кремль, 8',
        inRoute: true,
        note: 'Грибная калья и курятник. На территории Кремля.',
      },
      {
        id: 'g3',
        name: 'День 1. Ужин — «Графин»',
        address: 'ул. Татарская, 36',
        inRoute: true,
        note: 'Особняк XIX века. Котлета из лося или судак по-рязански.',
      },
      {
        id: 'g4',
        name: 'День 1. Бар — «ДУДКИ»',
        address: 'ул. Ленина, 41А',
        inRoute: true,
        note: '40 сортов крафтового пива, пивная тарелка.',
      },
      {
        id: 'g5',
        name: 'День 2. Завтрак — «Лыбедь»',
        address: 'Лыбедский бульвар, 1',
        inRoute: true,
        note: 'Блинчики с белыми грибами или драники с форелью.',
      },
      {
        id: 'g6',
        name: 'День 2. Обед — «Хорошие Руки. Рыба»',
        address: 'ул. Семинарская, 1',
        inRoute: true,
        note: 'Том-ям, паста с морепродуктами, поке с угрём.',
      },
      {
        id: 'g7',
        name: 'День 2. Ужин — «Старый Мельник»',
        address: 'Рязанская обл., Солотча, д. 24',
        inRoute: true,
        note: 'Кафе в сосновом лесу. Пельмени с бобрятиной, калинник.',
      },
      {
        id: 'g8',
        name: 'День 2. Бар — Grillside Rock Bar',
        address: 'ул. Почтовая, 54 корп. 2',
        inRoute: true,
        note: 'Живая музыка, крафтовое пиво, коктейли, стейки и бургеры.',
      },
    ],
  },
]

const LEVELS = [
  {
    rank: 1,
    title: 'Прохожий',
    threshold: '0',
    bonus: 'Начальный уровень',
  },
  {
    rank: 2,
    title: 'Гость Рязани',
    threshold: '500',
    bonus: '+5% к баллам за тесты',
  },
  {
    rank: 3,
    title: 'Студент-краевед',
    threshold: '1 500',
    bonus: 'Доступ к скрытым маршрутам',
  },
  {
    rank: 4,
    title: 'Постоянный житель',
    threshold: '3 000',
    bonus: '+10% к баллам за чекины',
  },
  {
    rank: 5,
    title: 'Знаток Почтовой',
    threshold: '5 500',
    bonus: 'Уникальная цифровая ачивка',
  },
  {
    rank: 6,
    title: 'Гид-любитель',
    threshold: '8 500',
    bonus: 'Скидка 5% у всех партнеров (постоянная)',
  },
  {
    rank: 7,
    title: 'Хранитель традиций',
    threshold: '12 000',
    bonus: '+20% к баллам за всё',
  },
  {
    rank: 8,
    title: 'Посол Рязани',
    threshold: '17 000',
    bonus: 'Ранний доступ к новым квестам',
  },
  {
    rank: 9,
    title: 'Легенда города',
    threshold: '25 000',
    bonus: 'Бесплатный мерч в инфоцентре',
  },
  {
    rank: 10,
    title: 'Князь/Княгиня Рязанская',
    threshold: '40 000',
    bonus: 'VIP-статус: максимальные скидки (15–20%)',
  },
]

const POINTS_SOURCES = [
  'Check-in в точке (GPS): 50–100 баллов (зависит от удаленности места).',
  'Прохождение мини‑теста (3 вопроса): 150 баллов (по 50 за верный ответ).',
  'Завершение полного маршрута: +500 баллов бонусом.',
  'Загрузка фото с места: +50 баллов (после модерации или проверки ИИ).',
  'Ежедневный вход в приложение: 10–20 баллов.',
]

const REWARD_TIERS = [
  {
    title: 'Кофейни и заведения',
    items: [
      '200–300 баллов: бесплатный сироп или добавка к кофе.',
      '500–700 баллов: скидка 15–20% на любой напиток.',
      '1 200–1 500 баллов: купон на бесплатный кофе (капучино/раф 0.3).',
      '2 500 баллов: сет «Завтрак туриста» со скидкой 50%.',
    ],
  },
  {
    title: 'Микротранспорт и досуг',
    items: [
      '400 баллов: промокод на отмену платного старта на самокате.',
      '800–1 000 баллов: 15–20 минут бесплатной поездки на самокате/велосипеде.',
      '2 000 баллов: скидка 30% на билет на теплоход по Оке.',
      '5 000 баллов: бесплатный билет на прогулочный теплоход или экскурсию с гидом.',
    ],
  },
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
        <div className="cards">
          {ROUTES.filter((route) => !completedRoutes.has(route.id)).map((route) => (
            <article key={route.id} className="card route-card">
              <h3>{route.title}</h3>
              <p>{route.subtitle}</p>
              <div className="card-tags">
                <span>{route.stops.filter((stop) => stop.inRoute).length} точек</span>
                <span>+{route.rewardPoints} баллов</span>
              </div>
              <button
                className="ghost"
                type="button"
                onClick={() => onOpenRoute(route)}
              >
                Подробнее
              </button>
            </article>
          ))}
        </div>
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
        <div className="cards">
          {ROUTES.filter((route) => !completedRoutes.has(route.id)).map((route) => (
            <article key={route.id} className="card route-card">
              <h3>{route.title}</h3>
              <p>{route.subtitle}</p>
              <div className="card-tags">
                <span>{route.stops.filter((stop) => stop.inRoute).length} точек</span>
                <span>+{route.rewardPoints} баллов</span>
              </div>
              <button
                className="ghost"
                type="button"
                onClick={() => onOpenModal('route', route)}
              >
                Подробнее
              </button>
            </article>
          ))}
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [points, setPoints] = useState(1240)
  const [collectedCards, setCollectedCards] = useState(new Set())
  const [checkinStatus, setCheckinStatus] = useState({})
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [locationError, setLocationError] = useState(null)
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
    setMyRoutes((prev) => new Set(prev).add(routeId))
  }

  const handleStartRoute = (routeId) => {
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
                <div className="cards">
          {ROUTES.filter((route) => !completedRoutes.has(route.id)).map((route) => (
            <article key={route.id} className="card route-card">
              <h3>{route.title}</h3>
              <p>{route.subtitle}</p>
                      <div className="card-tags">
                        <span>
                          {route.stops.filter((stop) => stop.inRoute).length} точек
                        </span>
                        <span>+{route.rewardPoints} баллов</span>
                      </div>
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => openModal('route', route)}
                      >
                        Подробнее
                      </button>
            </article>
          ))}
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
                    >
                      Добавить к себе
                    </button>
                  )}
                  {activeRouteId !== selectedRoute.id && (
                    <button
                      className="primary"
                      type="button"
                      onClick={() => handleStartRoute(selectedRoute.id)}
                    >
                      Начать маршрут
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
