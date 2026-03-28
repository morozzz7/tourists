/**
 * Пытается выбрать русский голос с мужским тембром (зависит от ОС/браузера).
 */
export function pickRussianMaleVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  const ru = voices.filter((v) => (v.lang || '').toLowerCase().startsWith('ru'));
  if (!ru.length) return null;

  const score = (v) => {
    const n = `${v.name} ${v.voiceURI || ''}`.toLowerCase();
    let s = 0;
    if (/female|женск|milena|irina|ирина|elena|елена|natali/i.test(n)) s -= 6;
    if (/male|муж|pavel|павел|dmitr|дмитр|filipp|филипп/i.test(n)) s += 3;
    if (/yuri|юрий|aleksei|алекс|иван|sergey|сергей/i.test(n)) s += 2;
    if (/microsoft|google|premium/i.test(n)) s += 1;
    return s;
  };

  const sorted = [...ru].sort((a, b) => score(b) - score(a));
  return sorted[0] || null;
}
