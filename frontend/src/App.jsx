import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import RyazanMap from './components/Map'
import QRAdmin from './components/QRAdmin'
import CharacterWelcome from './components/CharacterWelcome'
import mascotImg from './assets/hero.png'
import './App.css'

const menu = [
  { id: 'routes', label: 'Экскурсии и квесты' },
  { id: 'kids', label: 'Детский аудиогид' },
  { id: 'achievements', label: 'Достижения' },
  { id: 'rewards', label: 'Награды' },
  { id: 'loyalty', label: 'Система лояльности' },
  { id: 'faq', label: 'Часто задаваемые вопросы' },
]

const demoMessages = [
  {
    from: 'assistant',
    text: 'Привет! Я помогу выбрать маршрут или объяснить, как работают квесты.',
  },
]

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

const Home = ({ onOpenMap, onOpenModal, onSelectPoi }) => (
  <div className="app">
    <aside className="sidebar">
      <div className="account">
        <div className="avatar" aria-hidden="true"></div>
        <div>
          <p className="account-title">Гость</p>
          <p className="account-subtitle">Рязань, на старте</p>
        </div>
      </div>
      <nav className="menu">
        {menu.map((item) => (
          <a key={item.id} href={`/#${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>
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
    </aside>

    <main className="main">
      <section id="home" className="hero">
        <div className="map-wrap">
          <div className="map-header">
            <div>
              <p className="eyebrow">Геймификация туризма 2026</p>
              <h1>Рязань как игра: маршруты, квесты, достижения</h1>
              <p className="lead">
                Исследуй Рязанскую область через QR-квесты, интерактивную карту
                и реальные награды.
              </p>
            </div>
            <div className="register-card">
              <p className="register-title">Войти или создать профиль</p>
              <p className="register-subtitle">
                Сохраняй прогресс и обменивай баллы на призы.
              </p>
              <button className="primary" onClick={() => onOpenModal('register')}>
                Регистрация
              </button>
              <button className="ghost" onClick={() => onOpenModal('register')}>
                Войти
              </button>
            </div>
          </div>

          <div className="map-shell">
            <button className="map-full-btn" onClick={onOpenMap}>
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
            <button className="primary" onClick={() => onOpenModal('survey')}>
              Пройти тестирование
            </button>
          </div>
          <div className="mascot" aria-hidden="true">
            <img src={mascotImg} alt="" />
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

function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [messages, setMessages] = useState(demoMessages)
  const [input, setInput] = useState('')
  const [modalType, setModalType] = useState(null)
  const [selectedPoi, setSelectedPoi] = useState(null)
  const [poiSummary, setPoiSummary] = useState(null)

  useEffect(() => {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

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
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedPoi(null)
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
              onOpenMap={() => window.location.assign('/map')}
              onOpenModal={openModal}
              onSelectPoi={handleSelectPoi}
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
                <h3>Регистрация</h3>
                <p className="modal-subtitle">
                  Создай профиль, чтобы сохранять прогресс и баллы.
                </p>
                <form className="modal-form">
                  <input type="text" placeholder="Имя" />
                  <input type="email" placeholder="Email" />
                  <input type="password" placeholder="Пароль" />
                  <button className="primary" type="button">
                    Создать аккаунт
                  </button>
                </form>
              </div>
            )}

            {modalType === 'survey' && (
              <div className="modal-body">
                <h3>Анкета интересов</h3>
                <p className="modal-subtitle">
                  Расскажи, что тебе нравится, чтобы мы собрали подходящие маршруты.
                </p>
                <form className="modal-form">
                  <label className="checkbox">
                    <input type="checkbox" /> История и архитектура
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" /> Природа и парки
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" /> Семейные прогулки
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" /> Музеи и выставки
                  </label>
                  <button className="primary" type="button">
                    Сохранить
                  </button>
                </form>
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
