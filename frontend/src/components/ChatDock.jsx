// Док‑панель чата помощника.
import React from 'react'

const ChatDock = ({
  chatOpen,
  setChatOpen,
  messages,
  input,
  setInput,
  onSend,
  mascotImg,
}) => (
  <div className={`chat-dock ${chatOpen ? 'open' : ''}`}>
    <button
      className="chat-fab"
      onClick={() => setChatOpen((prev) => !prev)}
      aria-label="Открыть чат с помощником"
    >
      <img src={mascotImg} alt="" />
    </button>
    <div className="chat-panel">
      <header className="chat-header">
        <div>
          <p className="chat-title">AI-помощник</p>
          <p className="chat-subtitle">Спроси про маршруты или баллы</p>
        </div>
        <button className="chat-close" onClick={() => setChatOpen(false)}>
          Закрыть
        </button>
      </header>
      <div className="chat-body">
        {messages.map((message, index) => (
          <div
            key={`${message.from}-${index}`}
            className={`chat-bubble ${message.from}`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Напишите сообщение..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSend()
          }}
        />
        <button className="primary" onClick={onSend}>
          Отправить
        </button>
      </div>
    </div>
  </div>
)

export default ChatDock
