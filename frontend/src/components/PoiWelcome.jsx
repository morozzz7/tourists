// src/components/PoiWelcome.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TalkingGuide2D from './TalkingGuide2D';
import CharacterPortrait from './CharacterPortrait';
import { ESENIN_SCREEN_QUOTE, isEseninPoi, parseEseninTextsDocx } from '../utils/parseEseninTextsDocx';
import { pickRussianMaleVoice } from '../utils/ttsVoice';
import './PoiWelcome.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const TEXTS_DOC_URL = `${import.meta.env.BASE_URL}texts.docx`;
const ESENIN_PORTRAIT = `${import.meta.env.BASE_URL}images/realesenin.jpg`;
const ESENIN_MONUMENT = `${import.meta.env.BASE_URL}images/%D0%BF%D0%B0%D0%BC%D1%8F%D1%82%D0%BD%D0%B8%D0%BA%D0%B5%D1%81%D0%B5%D0%BD%D0%B8%D0%BD%D1%83.jpg`;
/** Запись голоса (файл ГолосЕсенина.mp3 → golos-esenina.mp3 в public/audio/) */
const ESENIN_AUDIO_SRC = `${import.meta.env.BASE_URL}audio/golos-esenina.mp3`;

function speakNarration({ text, rate, pitch, preferMaleVoice = false }, { onStart, onEnd }) {
  const t = (text || '').trim();
  if (!t || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  const start = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(t);
    utterance.lang = 'ru-RU';
    utterance.rate = Number(rate) || 1;
    utterance.pitch = Number(pitch) || 1;
    if (preferMaleVoice) {
      const v = pickRussianMaleVoice();
      if (v) utterance.voice = v;
    }
    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  };

  if (preferMaleVoice && !pickRussianMaleVoice()) {
    const onVoices = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
      start();
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    window.speechSynthesis.getVoices();
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
      start();
    }, 500);
    return;
  }

  start();
}

export default function PoiWelcome() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [poi, setPoi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkinStatus, setCheckinStatus] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [eseninDoc, setEseninDoc] = useState(null);
  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPositionSec, setAudioPositionSec] = useState(0);

  const isEsenin = useMemo(() => (poi ? isEseninPoi(poi) : false), [poi]);

  const narration = useMemo(() => {
    if (!poi || isEsenin) return null;
    const text = (poi.character_text || '').trim();
    if (!text) return null;
    return {
      text,
      rate: Number(poi.character_voice_rate) || 1,
      pitch: Number(poi.character_voice_pitch) || 1,
      preferMaleVoice: false,
    };
  }, [poi, isEsenin]);

  const bubbleText = useMemo(() => {
    if (!poi) return '';
    if (isEsenin) {
      if (eseninDoc && typeof eseninDoc === 'object' && eseninDoc.screenQuote) {
        return eseninDoc.screenQuote;
      }
      return ESENIN_SCREEN_QUOTE;
    }
    return poi.character_text || '';
  }, [poi, isEsenin, eseninDoc]);

  const speakFromStart = useCallback(() => {
    if (!narration?.text) return;
    speakNarration(
      {
        text: narration.text,
        rate: narration.rate,
        pitch: narration.pitch,
        preferMaleVoice: narration.preferMaleVoice,
      },
      {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      },
    );
  }, [narration]);

  const toggleEseninAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => {});
    else a.pause();
  }, []);

  const restartEseninAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    void a.play().catch(() => {});
  }, []);

  const startSpeech = useCallback(() => speakFromStart(), [speakFromStart]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    setTtsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  useEffect(() => {
    const fetchPoi = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/qr-by-code/`, {
          params: { code },
        });
        setPoi(response.data);
      } catch {
        setError('QR-код не найден или недействителен');
      } finally {
        setLoading(false);
      }
    };
    fetchPoi();
  }, [code]);

  useEffect(() => {
    if (!poi || !isEseninPoi(poi)) {
      setEseninDoc(null);
      return;
    }
    let cancelled = false;
    setEseninDoc('loading');
    fetch(TEXTS_DOC_URL)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((raw) => {
        if (cancelled) return;
        setEseninDoc(parseEseninTextsDocx(raw));
      })
      .catch(() => {
        if (!cancelled) setEseninDoc('error');
      });
    return () => {
      cancelled = true;
    };
  }, [poi]);

  useEffect(() => {
    if (isEsenin) return;
    if (!narration?.text?.trim()) return;

    const timer = window.setTimeout(() => speakFromStart(), 450);

    return () => {
      window.clearTimeout(timer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, [narration, speakFromStart, isEsenin]);

  useEffect(() => {
    if (!isEsenin) return;
    if (eseninDoc === 'loading' || eseninDoc === null) return;

    const a = audioRef.current;
    if (!a) return;

    const timer = window.setTimeout(() => {
      void a.play().catch(() => {});
    }, 450);

    return () => {
      window.clearTimeout(timer);
      a.pause();
    };
  }, [isEsenin, eseninDoc]);

  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCheckIn = async () => {
    try {
      const response = await axios.post(
        `${API_BASE}/api/poi-checkin-by-qr/`,
        { code },
        { withCredentials: true },
      );
      setCheckinStatus(response.data.message);
    } catch (err) {
      setCheckinStatus(err.response?.data?.error || 'Ошибка при зачёте');
    }
  };

  if (loading) {
    return (
      <div className="welcome-container loading poi-welcome-theme">
        <div className="welcome-loading-inner">
          <div className="spinner poi-welcome-spinner" />
          <p>Загрузка карточки…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="welcome-container error poi-welcome-theme">
        <h1>{error}</h1>
        <p>
          <button type="button" className="poi-welcome-btn poi-welcome-btn--primary" onClick={() => navigate('/')}>
            На главную
          </button>
        </p>
      </div>
    );
  }

  const imageSrc = poi.image && String(poi.image).trim() ? poi.image : null;
  const monumentSrc = isEsenin ? imageSrc || ESENIN_MONUMENT : imageSrc;
  const eseninCaption = poi.character_name || 'Сергей Есенин';
  const portraitSpeaking = isEsenin ? audioPlaying : isSpeaking;

  const eseninListenLabel = audioPlaying
    ? 'Пауза'
    : audioPositionSec > 0.2
      ? 'Продолжить'
      : 'Слушать монолог';

  return (
    <div className="welcome-container poi-welcome-page poi-welcome-theme">
      <audio
        ref={audioRef}
        className="poi-welcome-audio-el"
        src={isEsenin ? ESENIN_AUDIO_SRC : undefined}
        preload="auto"
        playsInline
        onPlay={() => setAudioPlaying(true)}
        onPause={() => setAudioPlaying(false)}
        onEnded={() => {
          setAudioPlaying(false);
          setAudioPositionSec(0);
        }}
        onTimeUpdate={(e) => setAudioPositionSec(e.currentTarget.currentTime)}
      />

      <div className={`poi-welcome-card ${isEsenin ? 'poi-welcome-card--esenin' : ''}`.trim()}>
        <div className="poi-welcome-stage">
          {isEsenin ? (
            <CharacterPortrait
              src={ESENIN_PORTRAIT}
              alt="Сергей Есенин"
              caption={eseninCaption}
              isSpeaking={portraitSpeaking}
            />
          ) : (
            <TalkingGuide2D isSpeaking={isSpeaking} name={poi.character_name} />
          )}

          <div className="poi-welcome-speech-bubble" aria-live="polite">
            <p className="poi-welcome-speech-label">
              {isEsenin ? 'Фрагмент стихотворения' : 'Рассказывает персонаж'}
            </p>
            <p className={`poi-welcome-speech-text ${isEsenin ? 'poi-welcome-speech-text--pre' : ''}`}>
              {bubbleText ||
                'Текст для озвучки задайте в админке (поле «Текст персонажа»).'}
            </p>
          </div>
          <div
            className={`poi-welcome-audio-row ${isEsenin ? 'poi-welcome-audio-row--dual' : ''}`.trim()}
          >
            {isEsenin ? (
              <>
                <button type="button" className="poi-welcome-speak-btn" onClick={toggleEseninAudio}>
                  {eseninListenLabel}
                </button>
                <button
                  type="button"
                  className="poi-welcome-speak-btn poi-welcome-speak-btn--secondary"
                  onClick={restartEseninAudio}
                >
                  С начала
                </button>
              </>
            ) : ttsSupported ? (
              <button
                type="button"
                className="poi-welcome-speak-btn"
                onClick={startSpeech}
                disabled={isSpeaking || !narration?.text?.trim()}
              >
                {isSpeaking ? 'Говорит…' : 'Прослушать снова'}
              </button>
            ) : (
              <p className="poi-welcome-tts-warning">Озвучка недоступна в этом браузере.</p>
            )}
          </div>
        </div>

        <div
          className={`poi-welcome-details ${isEsenin ? 'poi-welcome-details--esenin' : ''}`.trim()}
        >
          {isEsenin ? (
            <>
              <figure className="poi-welcome-monument">
                <img src={monumentSrc} alt={poi.title} className="poi-welcome-monument__img" />
                <figcaption className="poi-welcome-monument__cap">{poi.title}</figcaption>
              </figure>
              <div className="poi-actions">
                <button type="button" onClick={() => navigate('/')} className="ghost poi-welcome-ghost">
                  На главную
                </button>
                <button type="button" onClick={handleCheckIn} className="primary poi-welcome-primary">
                  Я здесь!
                </button>
              </div>
            </>
          ) : (
            <>
              {imageSrc ? (
                <img src={imageSrc} alt={poi.title} className="poi-image" />
              ) : (
                <div className="poi-image poi-image--placeholder" role="img" aria-label={poi.title}>
                  <span>{poi.title}</span>
                </div>
              )}
              <h1>{poi.title}</h1>
              <p className="poi-info">{poi.info || poi.description}</p>
              <div className="poi-actions">
                <button type="button" onClick={() => navigate('/')} className="ghost poi-welcome-ghost">
                  На главную
                </button>
                <button type="button" onClick={handleCheckIn} className="primary poi-welcome-primary">
                  Я здесь!
                </button>
              </div>
            </>
          )}
          {checkinStatus ? <p className="status">{checkinStatus}</p> : null}
        </div>
      </div>
    </div>
  );
}
