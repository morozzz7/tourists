import './CharacterPortrait.css';

const DEFAULT_AVATAR = `${import.meta.env.BASE_URL}images/esenin.jpg`;

export function CharacterPortraitSkeleton({ caption = 'Загрузка сценария…' }) {
  return (
    <div className="character-portrait character-portrait--skeleton">
      <div className="character-portrait__ring" />
      {caption ? <p className="character-portrait__caption">{caption}</p> : null}
    </div>
  );
}

export default function CharacterPortrait({
  src = DEFAULT_AVATAR,
  alt = 'Персонаж',
  caption,
  isSpeaking,
}) {
  return (
    <div
      className={`character-portrait ${isSpeaking ? 'character-portrait--speaking' : ''}`.trim()}
    >
      <div className="character-portrait__ring">
        <img src={src} alt={alt} className="character-portrait__img" decoding="async" />
      </div>
      {caption ? <p className="character-portrait__caption">{caption}</p> : null}
    </div>
  );
}
