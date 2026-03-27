import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textAlign: 'center'
    }}>
      <h1 style={{ color: 'white', fontSize: '48px', marginBottom: '40px' }}>
        🎉 Добро пожаловать!
      </h1>
      
      <button 
        onClick={() => navigate('/admin/qr')}
        style={{
          padding: '15px 40px',
          fontSize: '18px',
          fontWeight: 'bold',
          background: 'white',
          color: '#667eea',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
        }}
      >
        📱 Создать QR-код
      </button>
    </div>
  );
}