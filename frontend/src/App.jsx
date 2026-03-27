import { useEffect, useState } from 'react'
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

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

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

const FullMapPage = ({ onSelectPoi }) => {
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
        <RyazanMap onSelectPoi={onSelectPoi} />
      </div>
    </div>
  )
}

const Home = ({
  onOpenModal,
  onSelectPoi,
  onToggleTheme,
  theme,
  sidebarOpen,
  onToggleSidebar,
  user,
  onLogout,
}) => {
  const navigate = useNavigate()
  return (
    <div className={`app ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
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
          </div>
        </div>
        <nav className="menu">
          <Link to="/routes">Экскурсии и квесты</Link>
          <Link to="/kids">Детский аудиогид</Link>
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
            Собери первые 300 баллов за прогулку по центру и открой сезонные
            трофеи.
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

      <main className="main">
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
              <RyazanMap onSelectPoi={onSelectPoi} />
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

        <section id="achievements" className="page">
          <header>
            <p className="eyebrow">Достижения</p>
            <h2>Коллекция наград</h2>
            <p>
              Раздел для медалей, серий посещений и особых статусов — пока
              макет.
            </p>
          </header>
          <div className="cards achievements">
            {['Первооткрыватель', 'Ночной исследователь', 'Летописец'].map(
              (title) => (
                <article key={title} className="card">
                  <h3>{title}</h3>
                  <p>Условие получения появится здесь.</p>
                </article>
              ),
            )}
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
            <h2>Статус туриста</h2>
            <p>Чем больше открытых точек, тем выше статус и больше бонусов.</p>
          </header>
          <div className="cards">
            {['Новичок', 'Исследователь', 'Амбассадор'].map((title) => (
              <article key={title} className="card">
                <h3>{title}</h3>
                <p>Условия и бонусы уровня появятся здесь.</p>
              </article>
            ))}
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
      </main>
    </div>
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

  useEffect(() => {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

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

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              onOpenModal={openModal}
              onSelectPoi={handleSelectPoi}
              onToggleTheme={toggleTheme}
              theme={theme}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              user={user}
              onLogout={handleLogout}
            />
          }
        />
        <Route path="/map" element={<FullMapPage onSelectPoi={handleSelectPoi} />} />
        <Route path="/admin/qr" element={<QRAdmin />} />
        <Route path="/campaign/:code/" element={<CharacterWelcome />} />
        <Route
          path="/routes"
          element={
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
          }
        />
        <Route
          path="/kids"
          element={
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
          }
        />
        <Route
          path="/achievements"
          element={
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
          }
        />
        <Route
          path="/rewards"
          element={
            <PageShell title="Награды" subtitle="Список доступных призов и скидок.">
              <div className="cards">
                {['Кофе и выпечка', 'Прокат велосипедов', 'Сувениры'].map((title) => (
                  <article key={title} className="card">
                    <h3>{title}</h3>
                    <p>Партнерские предложения появятся здесь.</p>
                  </article>
                ))}
              </div>
            </PageShell>
          }
        />
        <Route
          path="/profile"
          element={
            <PageShell
              title="Личный кабинет"
              subtitle="Ваш прогресс, достижения и награды."
            >
              <div className="profile-card">
                <div className="profile-avatar"></div>
                <div>
                  <p className="profile-name">{profile.name || 'Гость'}</p>
                  <p className="profile-email">{profile.email || 'Не указан'}</p>
                </div>
              </div>
              <div className="cards">
                {['Первооткрыватель', 'Городской следопыт'].map((title) => (
                  <article key={title} className="card">
                    <h3>{title}</h3>
                    <p>Достижение открывает награду.</p>
                  </article>
                ))}
              </div>
              <div className="cards">
                {['Скидка на кофе', 'Билет в музей'].map((title) => (
                  <article key={title} className="card">
                    <h3>{title}</h3>
                    <p>Награда за достижение.</p>
                  </article>
                ))}
              </div>
            </PageShell>
          }
        />
        <Route
          path="/loyalty"
          element={
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
          }
        />
        <Route
          path="/faq"
          element={
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
                <h3>{selectedPoi.name}</h3>
                <p className="modal-subtitle">
                  История и информация из открытых источников.
                </p>
                {poiSummary && <p className="poi-summary">{poiSummary}</p>}
                <div className="poi-meta">
                  <span>Категория: {selectedPoi.category || 'Точка интереса'}</span>
                  <span>QR: {selectedPoi.qr || 'Ожидает интеграции'}</span>
                </div>
                <div className="poi-qr">
                  <div className="qr-placeholder">QR</div>
                  <p>
                    Здесь будет показан QR-код и сценарий персонажа (интеграция
                    наработок коллеги).
                  </p>
                </div>
                <button className="primary" type="button">
                  Отметить как посещено
                </button>
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
