// Tách và ghép âm tiết Hangul theo công thức Unicode:
// âm tiết = 0xAC00 + (đầu × 21 + giữa) × 28 + cuối.

/** 19 phụ âm đầu (초성) */
export const CHO = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
/** 21 nguyên âm (중성) */
export const JUNG = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
/** 27 phụ âm cuối (종성), vị trí 0 là "không có" */
export const JONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];

const BASE = 0xac00;
const LAST = 0xd7a3;

/** Một âm tiết dưới dạng ba chữ cái: đầu, giữa, cuối ('' nếu không có). */
export type Syllable = { c: string; v: string; f: string };

export const isSyllable = (ch: string) => {
  const code = ch.charCodeAt(0);
  return ch.length === 1 && code >= BASE && code <= LAST;
};

export function decompose(ch: string): Syllable | null {
  if (!isSyllable(ch)) return null;
  const n = ch.charCodeAt(0) - BASE;
  return { c: CHO[Math.floor(n / 588)], v: JUNG[Math.floor((n % 588) / 28)], f: JONG[n % 28] };
}

export function compose({ c, v, f }: Syllable): string {
  const ci = CHO.indexOf(c);
  const vi = JUNG.indexOf(v);
  const fi = JONG.indexOf(f);
  if (ci < 0 || vi < 0 || fi < 0) throw new Error(`Không ghép được: ${c}+${v}+${f}`);
  return String.fromCharCode(BASE + (ci * 21 + vi) * 28 + fi);
}

/** Phụ âm cuối kép → hai phụ âm đơn. */
export const SPLIT_FINAL: Record<string, [string, string]> = {
  ㄳ: ['ㄱ', 'ㅅ'], ㄵ: ['ㄴ', 'ㅈ'], ㄶ: ['ㄴ', 'ㅎ'], ㄺ: ['ㄹ', 'ㄱ'], ㄻ: ['ㄹ', 'ㅁ'], ㄼ: ['ㄹ', 'ㅂ'],
  ㄽ: ['ㄹ', 'ㅅ'], ㄾ: ['ㄹ', 'ㅌ'], ㄿ: ['ㄹ', 'ㅍ'], ㅀ: ['ㄹ', 'ㅎ'], ㅄ: ['ㅂ', 'ㅅ'],
};

/** Nguyên âm ghép → hai nguyên âm (dùng khi tách để học). */
export const SPLIT_VOWEL: Record<string, [string, string]> = {
  ㅘ: ['ㅗ', 'ㅏ'], ㅙ: ['ㅗ', 'ㅐ'], ㅚ: ['ㅗ', 'ㅣ'], ㅝ: ['ㅜ', 'ㅓ'], ㅞ: ['ㅜ', 'ㅔ'], ㅟ: ['ㅜ', 'ㅣ'], ㅢ: ['ㅡ', 'ㅣ'],
};

/**
 * Tách chuỗi thành chữ cái: "한국" → "ㅎㅏㄴㄱㅜㄱ".
 * full = true thì tách cả phụ âm cuối kép và nguyên âm ghép: "닭" → "ㄷㅏㄹㄱ".
 */
export function disassemble(text: string, full = false): string {
  let out = '';
  for (const ch of text) {
    const s = decompose(ch);
    if (!s) {
      out += ch;
      continue;
    }
    out += s.c;
    out += full && SPLIT_VOWEL[s.v] ? SPLIT_VOWEL[s.v].join('') : s.v;
    out += full && SPLIT_FINAL[s.f] ? SPLIT_FINAL[s.f].join('') : s.f;
  }
  return out;
}

/** Từ có kết thúc bằng phụ âm cuối (받침) không: dùng để chọn 은/는, 이/가, 을/를… */
export function hasBatchim(word: string): boolean {
  const s = decompose(word.at(-1) ?? '');
  return !!s && s.f !== '';
}

/** Phụ âm đầu của từng âm tiết (초성): "한국어" → "ㅎㄱㅇ". Dùng cho tìm kiếm theo chữ cái đầu. */
export const initials = (text: string) => [...text].map((ch) => decompose(ch)?.c ?? ch).join('');

/** Chuỗi → mảng âm tiết (ký tự không phải Hangul giữ nguyên dạng chuỗi). */
export const toSyllables = (text: string): (Syllable | string)[] => [...text].map((ch) => decompose(ch) ?? ch);

/** Mảng âm tiết → chuỗi. */
export const fromSyllables = (parts: (Syllable | string)[]) =>
  parts.map((p) => (typeof p === 'string' ? p : compose(p))).join('');
