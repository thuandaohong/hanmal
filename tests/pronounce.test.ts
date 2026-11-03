import { describe, expect, it } from 'vitest';
import pron from './fixtures/pron.json';
import { pronounceText } from '../src/lib/hangul/pronounce';

type Row = [string, string, string[], boolean];
const VERBAL = new Set(['동사', '형용사', '보조 동사', '보조 형용사']);

/** Cách đọc dự đoán cho một mục từ điển (động/tính từ: đánh dấu ranh giới gốc trước 다). */
export const predict = ([word, pos, , sino]: Row) =>
  pronounceText(word, { stemEnd: VERBAL.has(pos) && word.endsWith('다') ? [...word].length - 2 : undefined, sino });

describe('pronounce – ví dụ chuẩn', () => {
  const cases: [string, string, object?][] = [
    ['음악', '으막'], ['닭이', '달기'], ['앉아', '안자'], ['값이', '갑씨'], ['좋아', '조아'], ['않아', '아나'],
    ['놓고', '노코'], ['많다', '만타'], ['축하', '추카'], ['밝히다', '발키다'], ['굳이', '구지'], ['같이', '가치'],
    ['닫히다', '다치다'], ['국물', '궁물'], ['입니다', '임니다'], ['받는', '반는'], ['심리', '심니'], ['종로', '종노'],
    ['국립', '궁닙'], ['신라', '실라'], ['설날', '설랄'], ['학교', '학꾜'], ['먹다', '먹따'], ['꽃', '꼳'],
    ['부엌', '부억'], ['희망', '히망'], ['읽다', '익따'], ['맑게', '말께'], ['놓는', '논는'], ['싫어', '시러'],
    ['앉고', '안꼬', { stemEnd: 0 }], ['갈등', '갈뜽', { sino: true }], ['생산량', '생산냥'],
  ];
  for (const [input, expected, opts] of cases) {
    it(`${input} → ${expected}`, () => expect(pronounceText(input, opts)).toBe(expected));
  }
});

describe('pronounce – đối chiếu krdict', () => {
  it('đúng ít nhất 95% cách đọc chuẩn của từ sơ cấp + trung cấp', () => {
    const rows = pron as Row[];
    const wrong = rows.filter((r) => !r[2].includes(predict(r)));
    const acc = 1 - wrong.length / rows.length;
    console.log(`pronounce: ${(acc * 100).toFixed(2)}% (${rows.length - wrong.length}/${rows.length})`);
    expect(acc).toBeGreaterThanOrEqual(0.95);
  });
});
