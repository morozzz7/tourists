// src/components/QRAdmin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QRAdmin.css';

const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function QRAdmin() {
  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    const fetchPois = async () => {
      setFetchLoading(true);
      setError(null);
      try {
        console.log('🔍 Запрос к:', `${BASE_URL}/api/pois/`);
        const res = await axios.get(`${BASE_URL}/api/pois/`, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('📦 Ответ сервера:', res.data);
        console.log('📊 Тип ответа:', typeof res.data);
        console.log('📊 Массив?', Array.isArray(res.data));
        
        let poisData = [];
        if (Array.isArray(res.data)) {
          poisData = res.data;
        } else if (res.data.results && Array.isArray(res.data.results)) {
          poisData = res.data.results;
        }
        
        console.log('✅ Загружено POI:', poisData.length);
        setPois(poisData);
        
        if (poisData.length === 0) {
          setError('Нет доступных точек. Добавьте их через админку Django.');
        }
      } catch (err) {
        console.error('❌ Ошибка загрузки:', err);
        if (err.response) {
          setError(`Ошибка ${err.response.status}: ${err.response.statusText}`);
        } else if (err.request) {
          setError('Сервер не отвечает. Проверьте, запущен ли бэкенд на порту 8000');
        } else {
          setError(`Ошибка: ${err.message}`);
        }
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchPois();
  }, []);

  const generateQR = async () => {
    if (!selectedPoi) {
      setError('Выберите точку интереса');
      return;
    }
    
    setLoading(true);
    setError(null);
    setQrCode(null);
    
    try {
      console.log('🎯 Генерация QR для POI:', selectedPoi);
      const res = await axios.post(
        `${BASE_URL}/api/pois/${selectedPoi}/generate_qr/`,
        {},
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      console.log('✅ QR создан:', res.data);
      setQrCode(res.data);
    } catch (err) {
      console.error('❌ Ошибка генерации QR:', err);
      if (err.response) {
        setError(`Ошибка ${err.response.status}: ${err.response.data?.error || err.response.statusText}`);
      } else if (err.request) {
        setError('Сервер не отвечает');
      } else {
        setError(`Ошибка: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Ссылка скопирована');
  };

  if (fetchLoading) {
    return (
      <div className="qr-admin">
        <h1>Генерация QR-кодов для памятников</h1>
        <div className="loading">⏳ Загрузка списка памятников...</div>
      </div>
    );
  }

  return (
    <div className="qr-admin">
      <h1>📱 Генерация QR-кодов для памятников</h1>
      
      {error && (
        <div className="error-message">
          ⚠️ {error}
          {error.includes('Сервер не отвечает') && (
            <button onClick={() => window.location.reload()} className="retry-btn">
              Повторить
            </button>
          )}
        </div>
      )}
      
      <div className="form-group">
        <label>Выберите памятник</label>
        <select 
          value={selectedPoi} 
          onChange={(e) => {
            setSelectedPoi(e.target.value);
            setError(null);
            setQrCode(null);
          }}
        >
          <option value="">-- выберите --</option>
          {pois.map(poi => (
            <option key={poi.id} value={poi.id}>
              {poi.title}
            </option>
          ))}
        </select>
        {pois.length === 0 && (
          <p className="hint">
            📭 Нет доступных памятников. 
            <a href="http://localhost:8000/admin/quests/pointofinterest/" target="_blank">
              Добавьте их через админку
            </a>
          </p>
        )}
        {pois.length > 0 && (
          <p className="hint">✅ Доступно: {pois.length} памятников</p>
        )}
      </div>
      
      <button 
        onClick={generateQR} 
        disabled={!selectedPoi || loading}
        className="generate-btn"
      >
        {loading ? '⏳ Генерация...' : '✨ Создать QR-код'}
      </button>
      
      {qrCode && (
        <div className="qr-result">
          <h3>✅ QR-код готов!</h3>
          <div className="qr-image">
            <img src={qrCode.image} alt="QR code" />
          </div>
          <div className="qr-info">
            <p><strong>Код:</strong> <code>{qrCode.code}</code></p>
            <p><strong>Ссылка:</strong> 
              <a href={qrCode.url} target="_blank">{qrCode.url}</a>
              <button onClick={() => copyToClipboard(qrCode.url)} className="copy-btn">
                📋
              </button>
            </p>
            <p><strong>Памятник:</strong> {qrCode.poi_title}</p>
          </div>
        </div>
      )}
    </div>
  );
}