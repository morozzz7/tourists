import React, { useState } from 'react';
import axios from 'axios';
import './QRAdmin.css';

export default function QRAdmin() {
  const [form, setForm] = useState({
    name: '',
    character: '',
    description: '',
    quantity: 10
  });
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const characters = [
    'Робот', 'Инопланетянин', 'Динозавр', 
    'Волшебник', 'Пират'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const campaignRes = await axios.post('/api/quests/qr-campaigns/', {
        name: form.name,
        character: form.character,
        description: form.description
      });

      const qrRes = await axios.post(
        `/api/quests/qr-campaigns/${campaignRes.data.id}/generate_qr_codes/`,
        { quantity: form.quantity }
      );

      setQrCodes(qrRes.data.qr_codes);
      setForm({ name: '', character: '', description: '', quantity: 10 });
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при создании кампании');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (qr) => {
    const link = document.createElement('a');
    link.href = qr.image;
    link.download = `qr-${qr.code}.png`;
    link.click();
  };

  const downloadAllQRs = () => {
    qrCodes.forEach(qr => downloadQR(qr));
  };

  return (
    <div className="qr-admin">
      <h1>📱 Создание QR-кампаний</h1>

      <form onSubmit={handleSubmit} className="qr-form">
        <div className="form-group">
          <label>Название кампании</label>
          <input
            type="text"
            placeholder="например: Летний фестиваль"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Персонаж</label>
          <select
            value={form.character}
            onChange={(e) => setForm({...form, character: e.target.value})}
            required
          >
            <option value="">Выберите персонажа</option>
            {characters.map(char => (
              <option key={char} value={char}>{char}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Описание</label>
          <textarea
            placeholder="Опишите кампанию..."
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Количество QR-кодов</label>
          <input
            type="number"
            min="1"
            max="100"
            value={form.quantity}
            onChange={(e) => setForm({...form, quantity: parseInt(e.target.value)})}
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '⏳ Создание...' : '✨ Создать кампанию'}
        </button>
      </form>

      {qrCodes.length > 0 && (
        <div className="qr-results">
          <h2>✅ Создано {qrCodes.length} QR-кодов</h2>
          
          <button onClick={downloadAllQRs} className="download-all-btn">
            📥 Скачать все ({qrCodes.length})
          </button>

          <div className="qr-grid">
            {qrCodes.map(qr => (
              <div key={qr.code} className="qr-card">
                <div className="qr-image-wrapper">
                  <img src={qr.image} alt={qr.code} />
                </div>
                <p className="qr-code">{qr.code}</p>
                <p className="qr-url">{qr.url}</p>
                <button 
                  onClick={() => downloadQR(qr)}
                  className="download-btn"
                >
                  💾 Скачать
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}