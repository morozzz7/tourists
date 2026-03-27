import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RyazanMap = () => {
  const ryazanCenter = [54.6292, 39.7351]; // Ryazan center coordinates

  const locations = [
    { id: 1, name: 'Рязанский Кремль', coords: [54.6348, 39.7486], discovered: true },
    { id: 2, name: 'Памятник Есенину', coords: [54.6360, 39.7470], discovered: false },
    { id: 3, name: 'Грибы с глазами', coords: [54.6288, 39.7345], discovered: true },
  ];

  const territories = [
    { id: 't1', name: 'Кремль', bounds: [[54.633, 39.742], [54.638, 39.752]] },
    { id: 't2', name: 'Соборная', bounds: [[54.629, 39.737], [54.634, 39.746]] },
    { id: 't3', name: 'Набережная', bounds: [[54.625, 39.731], [54.631, 39.739]] },
    { id: 't4', name: 'ЦПКиО', bounds: [[54.624, 39.742], [54.629, 39.751]] },
    { id: 't5', name: 'Музейный квартал', bounds: [[54.631, 39.752], [54.636, 39.760]] },
    { id: 't6', name: 'Лыбедский бульвар', bounds: [[54.626, 39.724], [54.632, 39.733]] },
  ];

  const [captured, setCaptured] = useState(new Set(['t1', 't3']));
  const progress = Math.round((captured.size / territories.length) * 100);

  const toggleCapture = (id) => {
    setCaptured((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="map-frame">
      <MapContainer center={ryazanCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {territories.map((territory) => (
          <Rectangle
            key={territory.id}
            bounds={territory.bounds}
            pathOptions={{
              color: captured.has(territory.id) ? '#8D8741' : '#999999',
              fillColor: captured.has(territory.id) ? '#8D8741' : '#cccccc',
              fillOpacity: captured.has(territory.id) ? 0.35 : 0.15,
              weight: 2,
            }}
            eventHandlers={{
              click: () => toggleCapture(territory.id),
            }}
          />
        ))}
        {locations.map((loc) => (
          <Marker 
            key={loc.id} 
            position={loc.coords}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <h3 className="font-bold text-accent">{loc.name}</h3>
                <p className="text-xs mb-2">{loc.discovered ? 'Локация открыта! ✅' : 'Найдите QR-код, чтобы открыть локацию'}</p>
                <button className="bg-accent text-white px-3 py-1 rounded-lg text-[10px] font-bold">
                  Подробнее
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="map-overlay-card">
        <p className="map-overlay-title">Открытие территорий</p>
        <div className="map-overlay-row">
          <span>Прогресс</span>
          <span className="map-overlay-accent">{progress}%</span>
        </div>
        <div className="map-progress">
          <div className="map-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="map-overlay-note">
          Нажми на участок карты, чтобы отметить его как исследованный.
        </p>
      </div>
    </div>
  );
};

export default RyazanMap;
