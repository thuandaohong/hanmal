// Ghép chữ cái thành âm tiết theo cách gõ bàn phím 2 hàng (두벌식):
// "ㅎㅏㄴㄱㅡㄹ" → "한글", "ㄱㅏㄱㅏ" → "가가" (phụ âm cuối nhảy sang âm tiết sau khi gặp nguyên âm).
import { CHO, JONG, JUNG, compose } from './compose';

const VOWEL_PAIR: Record<string, string> = {
  ㅗㅏ: 'ㅘ', ㅗㅐ: 'ㅙ', ㅗㅣ: 'ㅚ', ㅜㅓ: 'ㅝ', ㅜㅔ: 'ㅞ', ㅜㅣ: 'ㅟ', ㅡㅣ: 'ㅢ',
};
const FINAL_PAIR: Record<string, string> = {
  ㄱㅅ: 'ㄳ', ㄴㅈ: 'ㄵ', ㄴㅎ: 'ㄶ', ㄹㄱ: 'ㄺ', ㄹㅁ: 'ㄻ', ㄹㅂ: 'ㄼ', ㄹㅅ: 'ㄽ', ㄹㅌ: 'ㄾ', ㄹㅍ: 'ㄿ', ㄹㅎ: 'ㅀ', ㅂㅅ: 'ㅄ',
};
const SPLIT: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(FINAL_PAIR).map(([pair, f]) => [f, [pair[0], pair[1]]]),
);

const isVowel = (j: string) => JUNG.includes(j);
const isConsonant = (j: string) => CHO.includes(j) || JONG.includes(j);

type Block = { c: string; v: string; f: string };

/** Ghép một chuỗi chữ cái (và ký tự khác) thành văn bản Hangul. */
export function assemble(input: string): string {
  let out = '';
  let cur: Block | null = null;
  const flush = () => {
    if (!cur) return;
    if (cur.c && cur.v) out += compose(cur);
    else out += cur.c + cur.v; // chữ cái đứng riêng
    cur = null;
  };
  for (const j of input) {
    if (isVowel(j)) {
      if (cur && cur.c && cur.v && cur.f) {
        // Phụ âm cuối (hoặc nửa sau của phụ âm kép) nhảy sang âm tiết mới.
        const [keep, move] = SPLIT[cur.f] ?? ['', cur.f];
        cur.f = keep;
        flush();
        cur = { c: move, v: j, f: '' };
      } else if (cur && cur.v && !cur.f && VOWEL_PAIR[cur.v + j]) {
        cur.v = VOWEL_PAIR[cur.v + j];
      } else if (cur && cur.c && !cur.v) {
        cur.v = j;
      } else {
        flush();
        cur = { c: '', v: j, f: '' };
      }
    } else if (isConsonant(j)) {
      if (cur && cur.c && cur.v && !cur.f && JONG.includes(j)) {
        cur.f = j;
      } else if (cur && cur.c && cur.v && cur.f && FINAL_PAIR[cur.f + j]) {
        cur.f = FINAL_PAIR[cur.f + j];
      } else {
        flush();
        cur = { c: j, v: '', f: '' };
      }
    } else {
      flush();
      out += j;
    }
  }
  flush();
  return out;
}

/** Xoá một chữ cái cuối (phím Backspace trên bàn phím ảo): làm việc trên chuỗi chữ cái gốc. */
export const backspace = (jamo: string) => [...jamo].slice(0, -1).join('');
