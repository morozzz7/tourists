# Геймификация туризма в регионе

Проект для **Чемпионата по продуктовому программированию Рязанской области 2026**.  
Команда: **Код и Кофе**.

Описание: веб‑сервис с интерактивной картой, маршрутами и QR‑квестами для вовлечения туристов в исследование региона. Пользователь выбирает маршрут, проходит точки интереса, подтверждает посещения через QR, накапливает баллы и обменивает их на награды. В сервисе предусмотрены профиль и история маршрутов, чтобы сохранять прогресс.

## Функционал
- Интерактивная карта с POI и маршрутами.
- QR‑подтверждение посещений.
- Баллы, профиль, история маршрутов.

## Стек
- Frontend: React + Vite
- Backend: Django + DRF
- БД: PostgreSQL
- Карты: Leaflet / Yandex Maps

## Запуск (Windows / Linux)

## 1. Backend
### Установка зависимостей
```bash
python -m venv venv
source venv/bin/activate            # Linux/Mac
venv\Scripts\activate               # Windows
pip install -r requirements.txt
```

### Переменные окружения
`.env` (пример):
```
DEBUG=True
SECRET_KEY=...
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173
DB_NAME=tourism
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

### Миграции и запуск
```bash
python manage.py migrate
python manage.py runserver
```

## 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Опционально в `frontend/.env`:
```
VITE_API_BASE=http://localhost:8000
```

---

## Деплой (кратко)
## Фронт отдельно
```bash
cd frontend
npm install
npm run build
```
Залить `frontend/dist` на статический хостинг (Netlify/Vercel/Cloudflare Pages).

## Бэк отдельно
1. `DEBUG=False`
2. `ALLOWED_HOSTS=ваш-домен`
3. `FRONTEND_URL=https://ваш-фронт`
4. `pip install -r requirements.txt`
5. `python manage.py migrate`
6. `python manage.py collectstatic --noinput`
7. Запуск через gunicorn + nginx

---

## Roadmap
1. ИИ‑помощник по маршрутам.
2. Партнерские награды.
3. Лидерборды и командные маршруты.
4. AR‑сцены у ключевых POI.
