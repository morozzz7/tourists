// Модалка маршрута: управление, штампы и завершение.
import React from 'react'

const RouteModal = ({
  selectedRoute,
  myRoutes,
  completedRoutes,
  activeRouteId,
  getRouteStamps,
  onAddRoute,
  onStartRoute,
  onPauseRoute,
  onToggleStamp,
  onCompleteRoute,
}) => {
  if (!selectedRoute) return null

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
            onClick={() => onAddRoute(selectedRoute.id)}
            disabled={completedRoutes.has(selectedRoute.id)}
          >
            Добавить к себе
          </button>
        )}
        {activeRouteId !== selectedRoute.id && (
          <button
            className="primary"
            type="button"
            onClick={() => onStartRoute(selectedRoute.id)}
            disabled={completedRoutes.has(selectedRoute.id)}
          >
            {completedRoutes.has(selectedRoute.id)
              ? 'Маршрут завершен'
              : 'Начать маршрут'}
          </button>
        )}
        {activeRouteId === selectedRoute.id && (
          <button className="ghost" type="button" onClick={onPauseRoute}>
            Пауза
          </button>
        )}
      </div>
      <div className="route-stops">
        {selectedRoute.stops.map((stop) => {
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
                onChange={() => onToggleStamp(selectedRoute.id, stop.id)}
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
      <div className="route-complete">
        <p>
          Штампы: {stampsCount} / {requiredStops.length}
        </p>
        <button
          className="primary"
          type="button"
          disabled={!completed || alreadyCompleted}
          onClick={() => onCompleteRoute(selectedRoute)}
        >
          {alreadyCompleted
            ? 'Маршрут завершен'
            : `Завершить и получить +${selectedRoute.rewardPoints}`}
        </button>
      </div>
    </div>
  )
}

export default RouteModal
