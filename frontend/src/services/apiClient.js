// Базовый адрес API берется из переменной окружения Vite.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// Чтение cookie (используется для CSRF).
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// Получение CSRF cookie.
const ensureCsrf = async () => {
  await fetch(`${API_BASE}/api/auth/csrf/`, {
    credentials: 'include',
  })
}

export { API_BASE, getCookie, ensureCsrf }
