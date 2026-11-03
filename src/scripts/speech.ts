// Phát âm tiếng Hàn bằng giọng đọc có sẵn của trình duyệt (Web Speech API).
// File âm thanh của krdict không được phân phối lại nên site không kèm file âm thanh.

let voice: SpeechSynthesisVoice | null | undefined;

function findVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  return speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ko')) ?? null;
}

/** Trình duyệt có giọng tiếng Hàn không (danh sách giọng có thể tải chậm, nên chờ tối đa 1,5 giây). */
export function hasKoreanVoice(): Promise<boolean> {
  if (!('speechSynthesis' in window)) return Promise.resolve(false);
  voice = findVoice();
  if (voice) return Promise.resolve(true);
  return new Promise((resolve) => {
    const done = () => {
      voice = findVoice();
      resolve(!!voice);
    };
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

export function speak(text: string, rate = 0.85) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = rate;
  voice ??= findVoice();
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

/** Gắn phát âm cho mọi phần tử [data-speak] và hiện thông báo [data-speech-unavailable] nếu thiếu giọng. */
export function initSpeech(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-speak]').forEach((el) => {
    if (el.dataset.speakBound) return;
    el.dataset.speakBound = '1';
    el.addEventListener('click', () => speak(el.dataset.speak!));
  });
  hasKoreanVoice().then((ok) => {
    document.querySelectorAll<HTMLElement>('[data-speech-unavailable]').forEach((n) => (n.hidden = ok));
  });
}
