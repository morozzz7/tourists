/**
 * Файл texts.docx — UTF-8: заголовок, (Голос: …), полный монолог для озвучки.
 * На экране показываем только screenQuote; озвучивается speechText целиком.
 */

/** Текст слева на странице (только четверостишие). */
export const ESENIN_SCREEN_QUOTE = `"Не жалею, не зову, не плачу,
Все пройдет, как с белых яблонь дым.
Увяданья золотом охваченный,
Я не буду больше молодым…"`;

/**
 * Мужской спокойный повествовательный темп (браузерный TTS приближает к заданному стилю).
 */
export function eseninNarrationVoice() {
  return { rate: 1.0, pitch: 0.88 };
}

export function parseEseninTextsDocx(raw) {
  const text = String(raw || '').replace(/^\uFEFF/, '').trim();
  if (!text) {
    return {
      title: '',
      speechText: '',
      voice: eseninNarrationVoice(),
      voiceLine: '',
      screenQuote: ESENIN_SCREEN_QUOTE,
    };
  }

  const voiceMatch = text.match(/\(Голос:[^)]+\)/);
  if (!voiceMatch) {
    return {
      title: '',
      speechText: text.replace(/\s+/g, ' ').trim(),
      voice: eseninNarrationVoice(),
      voiceLine: '',
      screenQuote: ESENIN_SCREEN_QUOTE,
    };
  }

  const voiceLine = voiceMatch[0];
  const voice = eseninNarrationVoice();
  const before = text.slice(0, text.indexOf(voiceLine)).trim();
  const title = before.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0] || '';
  let speechText = text.slice(text.indexOf(voiceLine) + voiceLine.length).trim();
  speechText = speechText.replace(/^[\s«"„]+/u, '').replace(/[»"“]+\s*$/u, '').trim();

  return { title, speechText, voice, voiceLine, screenQuote: ESENIN_SCREEN_QUOTE };
}

export function isEseninPoi(poi) {
  if (!poi?.title) return false;
  const t = String(poi.title).toLowerCase().replace(/ё/g, 'е');
  return t.includes('есенин');
}
