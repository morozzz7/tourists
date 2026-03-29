// Карточки маршрутов с единым рендером в разных разделах.
import React from 'react'

const RouteCards = ({ routes, completedRoutes, onOpenRoute }) => {
  const availableRoutes = routes.filter((route) => !completedRoutes.has(route.id))

  return (
    <div className="cards">
      {availableRoutes.map((route) => (
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
  )
}

export default RouteCards
