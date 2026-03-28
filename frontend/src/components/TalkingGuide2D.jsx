import './TalkingGuide2D.css';

/**
 * Простая 2D-фигура гида: анимируется рот во время речи (класс speaking).
 */
export default function TalkingGuide2D({ isSpeaking, name, className = '' }) {
  return (
    <div
      className={`talking-guide2d ${isSpeaking ? 'talking-guide2d--speaking' : ''} ${className}`.trim()}
      role="img"
      aria-label={name ? `Персонаж: ${name}` : 'Персонаж-гид'}
    >
      <svg viewBox="0 0 220 320" xmlns="http://www.w3.org/2000/svg" className="talking-guide2d__svg">
        <defs>
          <linearGradient id="coatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a6cf7" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        {/* Тело / пиджак */}
        <path
          d="M 55       140
             Q 40     200   35      285
             L 185     285
             Q 180     200   165   140
             Q 145     115   110   110
             Q 75      115   55    140 Z"
          fill="url(#coatGrad)"
        />
        <path
          d="M 110 110 L 110 200"
          stroke="#2d3a5c"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Шея */}
        <rect x="92" y="95" width="36" height="28" rx="8" fill="#e8b4a0" />

        {/* Голова */}
        <ellipse cx="110" cy="58" rx="44" ry="48" fill="#f0c4b2" />

        {/* Волосы */}
        <path
          d="M 66 52 Q 110 -5 154 52 Q 158 70 150 78 Q 110 55 70 78 Q 62 70 66 52"
          fill="#3d2914"
        />

        {/* Глаза */}
        <ellipse cx="88" cy="56" rx="8" ry="10" fill="#fff" />
        <ellipse cx="132" cy="56" rx="8" ry="10" fill="#fff" />
        <circle cx="90" cy="58" r="4" fill="#1a1a2e" />
        <circle cx="134" cy="58" r="4" fill="#1a1a2e" />
        <circle cx="92" cy="56" r="1.2" fill="#fff" />
        <circle cx="136" cy="56" r="1.2" fill="#fff" />

        {/* Рот — масштаб анимируется при речи */}
        <ellipse className="talking-guide2d__mouth" cx="110" cy="82" rx="14" ry="6" fill="#b85c6a" />

        {/* Руки */}
        <path
          d="M 55 150 Q 25 200 40 260"
          stroke="#f0c4b2"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 165 150 Q 195 200 180 260"
          stroke="#f0c4b2"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {name ? <p className="talking-guide2d__caption">{name}</p> : null}
    </div>
  );
}
