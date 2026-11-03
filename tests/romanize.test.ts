import { describe, expect, it } from 'vitest';
import { romanize } from '../src/lib/hangul/romanize';

// Ví dụ trong quy định phiên âm Latin chính thức của Hàn Quốc.
describe('romanize', () => {
  const cases: [string, string][] = [
    ['한국어', 'hangugeo'], ['한글', 'hangeul'], ['서울', 'seoul'], ['부산', 'busan'], ['백마', 'baengma'],
    ['신문로', 'sinmunno'], ['종로', 'jongno'], ['왕십리', 'wangsimni'], ['별내', 'byeollae'], ['신라', 'silla'],
    ['해돋이', 'haedoji'], ['같이', 'gachi'], ['굳히다', 'guchida'], ['좋고', 'joko'], ['놓다', 'nota'],
    ['잡혀', 'japyeo'], ['낳지', 'nachi'], ['압구정', 'apgujeong'], ['낙동강', 'nakdonggang'], ['죽변', 'jukbyeon'],
    ['낙성대', 'nakseongdae'], ['합정', 'hapjeong'], ['팔당', 'paldang'], ['울산', 'ulsan'], ['구미', 'gumi'],
    ['영동', 'yeongdong'], ['옥천', 'okcheon'], ['월곶', 'wolgot'], ['벚꽃', 'beotkkot'], ['한밭', 'hanbat'],
    ['광희문', 'gwanghuimun'], ['의정부', 'uijeongbu'], ['가져', 'gajyeo'], ['학교', 'hakgyo'],
  ];
  for (const [input, expected] of cases) {
    it(`${input} → ${expected}`, () => expect(romanize(input)).toBe(expected));
  }
});
