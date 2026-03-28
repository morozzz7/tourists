import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './CharacterWelcome.css';

export default function CharacterWelcome() {
  const { code } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animation, setAnimation] = useState(false);

  const BASE_URL = 'http://localhost:8000'; // API-бэкенд

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/quests/qr-codes/by_code/`, {
          params: { code }
        });
        
        setCampaign(response.data);
        setLoading(false);
        
        setTimeout(() => setAnimation(true), 100);
      } catch (err) {
        setError('❌ QR-код не найден или уже истек');
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [code]);

  if (loading) {
    return (
      <div className="welcome-container loading">
        <div className="spinner"></div>
        <p>Загружаем встречу...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="welcome-container error">
        <h1>{error}</h1>
        <p><Link to="/">← Вернуться на главную</Link></p>
      </div>
    );
  }

  const characters = {
    'Робот': '🤖',
    'Инопланетянин': '👽',
    'Динозавр': '🦕',
    'Волшебник': '🧙',
    'Пират': '🏴‍☠️',
  };

  return (
    <div className="welcome-container">
      <div className={`character-section ${animation ? 'show' : ''}`}>
        <div className="character-image">
          <div className="avatar">
            {characters[campaign.character] || '😊'}
          </div>
        </div>

        <div className="greeting">
          <h1>Привет! 👋</h1>
          <p className="character-name">
            Я {campaign.character}
          </p>
          <p className="campaign-description">
            {campaign.description}
          </p>
        </div>

        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">{campaign.scans}</span>
            <span className="stat-label">сканирований</span>
          </div>
        </div>

        <button className="action-button">
          Начать приключение →
        </button>
      </div>

      <div className="background-animation">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
    </div>
  );
}