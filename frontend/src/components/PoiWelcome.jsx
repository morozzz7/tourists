// src/components/PoiWelcome.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PoiWelcome.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function PoiWelcome() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [poi, setPoi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkinStatus, setCheckinStatus] = useState('');

  useEffect(() => {
    const fetchPoi = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/quests/qr-by-code/`, {
          params: { code }
        });
        setPoi(response.data);
      } catch (err) {
        setError('QR-код не найден или недействителен');
      } finally {
        setLoading(false);
      }
    };
    fetchPoi();
  }, [code]);

  const handleCheckIn = async () => {
    // Отправить запрос на бэкенд для зачёта посещения
    // Здесь нужно реализовать логику проверки геолокации и начисления баллов
    // Аналогично handleCheckIn в App.jsx, но с запросами к API
    try {
      const response = await axios.post(`${API_BASE}/api/quests/poi-checkin/`, {
        poi_id: poi.id
      }, { withCredentials: true });
      setCheckinStatus(response.data.message);
    } catch (err) {
      setCheckinStatus(err.response?.data?.error || 'Ошибка при зачёте');
    }
  };

  if (loading) return <div className="welcome-container loading">Загрузка...</div>;
  if (error) return <div className="welcome-container error">{error}</div>;

  return (
    <div className="welcome-container">
      <div className="poi-card">
        <img src={poi.image} alt={poi.title} className="poi-image" />
        <h1>{poi.title}</h1>
        <p className="poi-info">{poi.info}</p>
        <div className="character-card">
          <p><strong>{poi.character_name}</strong></p>
          <p>{poi.character_text}</p>
        </div>
        <div className="poi-actions">
          <button onClick={() => navigate('/')} className="ghost">На главную</button>
          <button onClick={handleCheckIn} className="primary">Я здесь!</button>
        </div>
        {checkinStatus && <p className="status">{checkinStatus}</p>}
      </div>
    </div>
  );
}