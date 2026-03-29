// Модалка регистрации/входа.
import React from 'react'

const AuthModal = ({
  authMode,
  setAuthMode,
  profile,
  setProfile,
  password,
  setPassword,
  authLoading,
  authStatus,
  authError,
  onSubmit,
}) => (
  <div className="modal-body">
    <div className="modal-head">
      <h3>{authMode === 'register' ? 'Регистрация' : 'Вход'}</h3>
      <div className="modal-switch">
        <button
          className={`ghost ${authMode === 'register' ? 'active' : ''}`}
          type="button"
          onClick={() => setAuthMode('register')}
        >
          Регистрация
        </button>
        <button
          className={`ghost ${authMode === 'login' ? 'active' : ''}`}
          type="button"
          onClick={() => setAuthMode('login')}
        >
          Вход
        </button>
      </div>
    </div>
    <p className="modal-subtitle">
      {authMode === 'register'
        ? 'Создай профиль, чтобы сохранять прогресс и баллы.'
        : 'Войди, чтобы продолжить путешествие.'}
    </p>
    <form className="modal-form">
      {authMode === 'register' && (
        <input
          type="text"
          placeholder="Имя"
          autoComplete="name"
          value={profile.name}
          onChange={(event) =>
            setProfile((prev) => ({ ...prev, name: event.target.value }))
          }
        />
      )}
      <input
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={profile.email}
        onChange={(event) =>
          setProfile((prev) => ({ ...prev, email: event.target.value }))
        }
      />
      <input
        type="password"
        placeholder="Пароль"
        autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button
        className="primary"
        type="button"
        onClick={onSubmit}
        disabled={authLoading}
      >
        {authLoading
          ? 'Подождите...'
          : authMode === 'register'
            ? 'Создать аккаунт'
            : 'Войти'}
      </button>
      {authStatus && <p className="modal-success">{authStatus}</p>}
      {authError && <p className="modal-error">{authError}</p>}
    </form>
  </div>
)

export default AuthModal
