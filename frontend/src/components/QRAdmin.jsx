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
  const [error, setError] = useState(null); // Добавляем состояние для отображения ошибки

  // !!! ВАЖНО: Замените на URL вашего бэкенда !!!
  const BASE_URL = 'http://localhost:8000'; // Изменено на порт 5173
  const FRONTEND_BASE_URL = 'http://localhost:5173';

  const characters = [
    'Робот', 'Инопланетянин', 'Динозавр',
    'Волшебник', 'Пират'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Очищаем предыдущие ошибки

    try {
      // Шаг 1: Создание кампании
      console.log('Отправка запроса на создание кампании:', {
        name: form.name,
        character: form.character,
        description: form.description
      });

      const campaignRes = await axios.post(`${BASE_URL}/api/quests/qr-campaigns/`, {
        name: form.name,
        character: form.character,
        description: form.description
      });

      console.log('Ответ сервера на создание кампании:', campaignRes.data);

      // Проверяем, что campaignRes.data и campaignRes.data.id существуют
      if (!campaignRes.data || !campaignRes.data.id) {
        throw new Error("Не удалось получить ID кампании из ответа сервера. Проверьте ответ API.");
      }

      const campaignId = campaignRes.data.id;

      // Шаг 2: Генерация QR-кодов для созданной кампании
      console.log(`Отправка запроса на генерацию ${form.quantity} QR-кодов для кампании ID: ${campaignId}`);

      const qrRes = await axios.post(
        `${BASE_URL}/api/quests/qr-campaigns/${campaignId}/generate_qr_codes/`,
        { quantity: form.quantity }
      );

      console.log('Ответ сервера на генерацию QR-кодов:', qrRes.data);

      setQrCodes(qrRes.data.qr_codes || []); // Убедитесь, что qr_codes это массив
      setForm({ name: '', character: '', description: '', quantity: 10 }); // Сбрасываем форму
      alert('Кампания и QR-коды успешно созданы!');

    } catch (error) {
      console.error('Детальная ошибка при создании кампании:', error);

      let errorMessage = 'Произошла непредвиденная ошибка при создании кампании.';
      if (error.response) {
        // Ошибка от сервера (например, 400, 500)
        errorMessage = `Ошибка сервера (${error.response.status}): ${JSON.stringify(error.response.data)}`;
        if (error.response.status === 403) {
            errorMessage += '. Возможно, проблема с CSRF-токеном или аутентификацией.';
        }
      } else if (error.request) {
        // Запрос был отправлен, но ответа не получено (проблема сети, CORS, или сервер не отвечает)
        errorMessage = 'Не удалось получить ответ от сервера. Проверьте подключение, URL бэкенда и настройки CORS.';
      } else {
        // Что-то пошло не так при настройке запроса или выполнении JavaScript
        errorMessage = `Ошибка запроса: ${error.message}`;
      }
      setError(errorMessage); // Устанавливаем ошибку для отображения пользователю
      alert(errorMessage); // Также показываем alert для немедленного уведомления
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (qr) => {
    // В идеале, image должен быть data-URL или полным URL изображения.
    // Если qr.image содержит просто имя файла, вам понадобится полный URL до файла.
    if (!qr.image || qr.image.startsWith('data:')) { // Проверка на data-URL
      const link = document.createElement('a');
      link.href = qr.image;
      link.download = `qr-${qr.code}.png`;
      document.body.appendChild(link); // Добавляем ссылку в DOM
      link.click();
      document.body.removeChild(link); // Убираем ссылку после клика
    } else {
      // Если qr.image это относительный путь, например '/media/qrcodes/qr-123.png'
      // Вам нужно будет добавить BASE_URL к нему
      const imageUrl = qr.image.startsWith('http') ? qr.image : `${BASE_URL}${qr.image}`;
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `qr-${qr.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadAllQRs = () => {
    qrCodes.forEach(qr => downloadQR(qr));
  };

  return (
    <div className="qr-admin">
      <h1>📱 Создание QR-кампаний</h1>

      <form onSubmit={handleSubmit} className="qr-form">
        <div className="form-group">
          <label htmlFor="campaignName">Название кампании</label>
          <input
            id="campaignName"
            type="text"
            placeholder="например: Летний фестиваль"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="characterSelect">Персонаж</label>
          <select
            id="characterSelect"
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
          <label htmlFor="descriptionTextarea">Описание</label>
          <textarea
            id="descriptionTextarea"
            placeholder="Опишите кампанию..."
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="quantityInput">Количество QR-кодов</label>
          <input
            id="quantityInput"
            type="number"
            min="1"
            max="100"
            value={form.quantity}
            onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 1})} // Гарантируем число
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '⏳ Создание...' : '✨ Создать кампанию'}
        </button>
      </form>

      {error && ( // Отображаем ошибку, если она есть
        <div className="error-message">
          <p>🚫 Ошибка: {error}</p>
        </div>
      )}

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
                  {/* Убедитесь, что qr.image содержит полный URL или data-URL */}
                  {/* Если qr.image - относительный путь, например '/media/qrcodes/...' */}
                  {/* <img src={`${BASE_URL}${qr.image}`} alt={qr.code} /> */}
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