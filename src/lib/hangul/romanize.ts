// Phiên âm Latin theo Revised Romanization of Korean (국어의 로마자 표기법, 2000).
// Phiên theo cách đọc (nối âm, mũi hoá, ㄹ hoá, bật hơi, vòm hoá) nhưng không thể hiện căng hoá
// và giữ nguyên nguyên âm theo chữ viết (희 → hui, 져 → jyeo).
import { decompose } from './compose';
import { pronounceText } from './pronounce';

const INITIAL: Record<string, string> = {
  ㄱ: 'g', ㄲ: 'kk', ㄴ: 'n', ㄷ: 'd', ㄸ: 'tt', ㄹ: 'r', ㅁ: 'm', ㅂ: 'b', ㅃ: 'pp', ㅅ: 's', ㅆ: 'ss',
  ㅇ: '', ㅈ: 'j', ㅉ: 'jj', ㅊ: 'ch', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 'h',
};
const VOWEL: Record<string, string> = {
  ㅏ: 'a', ㅐ: 'ae', ㅑ: 'ya', ㅒ: 'yae', ㅓ: 'eo', ㅔ: 'e', ㅕ: 'yeo', ㅖ: 'ye', ㅗ: 'o', ㅘ: 'wa', ㅙ: 'wae',
  ㅚ: 'oe', ㅛ: 'yo', ㅜ: 'u', ㅝ: 'wo', ㅞ: 'we', ㅟ: 'wi', ㅠ: 'yu', ㅡ: 'eu', ㅢ: 'ui', ㅣ: 'i',
};
// Sau khi biến âm, phụ âm cuối chỉ còn 7 âm đại diện.
const FINAL: Record<string, string> = { ㄱ: 'k', ㄴ: 'n', ㄷ: 't', ㄹ: 'l', ㅁ: 'm', ㅂ: 'p', ㅇ: 'ng' };

/** Phiên âm Latin một chuỗi: "한국어" → "hangugeo", "신라" → "silla". */
export function romanize(text: string, opts: { noun?: boolean } = {}): string {
  const spoken = pronounceText(text, { tense: false, vowels: false, noun: opts.noun });
  let out = '';
  let prevFinal = '';
  for (const ch of spoken) {
    const s = decompose(ch);
    if (!s) {
      out += ch;
      prevFinal = '';
      continue;
    }
    // ㄹ đứng sau ㄹ cuối viết là l (ㄹㄹ → ll).
    out += s.c === 'ㄹ' && prevFinal === 'ㄹ' ? 'l' : INITIAL[s.c];
    out += VOWEL[s.v];
    out += FINAL[s.f] ?? '';
    prevFinal = s.f;
  }
  return out;
}
