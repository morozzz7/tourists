// Хук управления прогрессом пользователя: загрузка, локальные состояния, сохранение в API.
import { useEffect, useRef, useState } from 'react'
import { API_BASE, ensureCsrf, getCookie } from '../services/apiClient'
import { parseRouteStamps, parseSet, serializeRouteStamps } from '../utils/collections'

// Сбор payload для сохранения в API.
const buildPayload = ({
  points,
  collectedCards,
  purchasedRewards,
  myRoutes,
  completedRoutes,
  routeStamps,
  activeRouteId,
}) => ({
  points,
  collected_cards: Array.from(collectedCards),
  purchased_rewards: Array.from(purchasedRewards),
  started_routes: Array.from(myRoutes),
  completed_routes: Array.from(completedRoutes),
  route_stamps: serializeRouteStamps(routeStamps),
  active_route_id: activeRouteId || '',
})

// Нормализация данных из API (защита от null/undefined).
const normalizeServerData = (data) => ({
  points: typeof data?.points === 'number' ? data.points : 0,
  collectedCards: parseSet(data?.collected_cards),
  purchasedRewards: parseSet(data?.purchased_rewards),
  myRoutes: parseSet(data?.started_routes),
  completedRoutes: parseSet(data?.completed_routes),
  routeStamps: parseRouteStamps(data?.route_stamps),
  activeRouteId: data?.active_route_id || null,
})

const useProgress = ({ user, guestPoints = 0 }) => {
  const [points, setPoints] = useState(guestPoints)
  const [collectedCards, setCollectedCards] = useState(new Set())
  const [purchasedRewards, setPurchasedRewards] = useState(new Set())
  const [myRoutes, setMyRoutes] = useState(new Set())
  const [activeRouteId, setActiveRouteId] = useState(null)
  const [routeStamps, setRouteStamps] = useState({})
  const [completedRoutes, setCompletedRoutes] = useState(new Set())
  const [progressReady, setProgressReady] = useState(false)

  const saveTimerRef = useRef(null)
  const lastSavedRef = useRef('')

  // Сброс прогресса для гостя.
  const resetToGuest = () => {
    setPoints(guestPoints)
    setCollectedCards(new Set())
    setPurchasedRewards(new Set())
    setMyRoutes(new Set())
    setCompletedRoutes(new Set())
    setRouteStamps({})
    setActiveRouteId(null)
    setProgressReady(false)
    lastSavedRef.current = ''
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
  }

  // Загрузка прогресса при входе.
  useEffect(() => {
    if (!user) {
      resetToGuest()
      return
    }

    const loadProgress = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/progress/`, {
          credentials: 'include',
        })
        if (!response.ok) return
        const data = await response.json()
        const normalized = normalizeServerData(data)
        setPoints(normalized.points)
        setCollectedCards(normalized.collectedCards)
        setPurchasedRewards(normalized.purchasedRewards)
        setMyRoutes(normalized.myRoutes)
        setCompletedRoutes(normalized.completedRoutes)
        setRouteStamps(normalized.routeStamps)
        setActiveRouteId(normalized.activeRouteId)
        const payload = buildPayload({
          points: normalized.points,
          collectedCards: normalized.collectedCards,
          purchasedRewards: normalized.purchasedRewards,
          myRoutes: normalized.myRoutes,
          completedRoutes: normalized.completedRoutes,
          routeStamps: normalized.routeStamps,
          activeRouteId: normalized.activeRouteId,
        })
        lastSavedRef.current = JSON.stringify(payload)
        setProgressReady(true)
      } catch {
        // ignore
      }
    }

    loadProgress()
  }, [user?.email])

  // Автосохранение с debounce.
  useEffect(() => {
    if (!user || !progressReady) return undefined
    const payload = buildPayload({
      points,
      collectedCards,
      purchasedRewards,
      myRoutes,
      completedRoutes,
      routeStamps,
      activeRouteId,
    })
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

  return {
    points,
    setPoints,
    collectedCards,
    setCollectedCards,
    purchasedRewards,
    setPurchasedRewards,
    myRoutes,
    setMyRoutes,
    activeRouteId,
    setActiveRouteId,
    routeStamps,
    setRouteStamps,
    completedRoutes,
    setCompletedRoutes,
    resetToGuest,
  }
}

export default useProgress
