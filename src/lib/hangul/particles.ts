// Chọn tiểu từ (조사) theo phụ âm cuối của danh từ: 학생은 / 친구는, 책을 / 사과를…
import { decompose } from './compose';

/** [dạng sau phụ âm cuối, dạng sau nguyên âm] */
export const PARTICLES = {
  topic: ['은', '는'],
  subject: ['이', '가'],
  object: ['을', '를'],
  and: ['과', '와'],
  direction: ['으로', '로'],
  copula: ['이에요', '예요'],
} as const;

/** Gắn tiểu từ: attach('학생', 'topic') → '학생은'. Riêng 으로/로: sau ㄹ dùng 로 (서울로). */
export function attach(noun: string, kind: keyof typeof PARTICLES): string {
  const last = decompose(noun.at(-1) ?? '');
  const [afterConsonant, afterVowel] = PARTICLES[kind];
  const consonant = !!last?.f && !(kind === 'direction' && last.f === 'ㄹ');
  return noun + (consonant ? afterConsonant : afterVowel);
}
