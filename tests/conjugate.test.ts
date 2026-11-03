import { describe, expect, it } from 'vitest';
import conj from './fixtures/conj.json';
import { type Irregular, type Kind, conjugate, dictionaryForms, guessIrregular } from '../src/lib/hangul/conjugate';

type Row = [string, string, [string, string[]][]];
const KIND: Record<string, Kind> = { 동사: 'verb', 형용사: 'adj' };
const CLASSES: Irregular[] = ['regular', 'ㅂ', 'ㄷ', 'ㅅ', '르', '러', 'ㅎ', '우', '여'];
// Mệnh lệnh cổ (-거라, -너라, -여라) không thuộc phạm vi công cụ.
const SKIP = /(거라|너라|여라|마오|아니라)$/;

const matches = (lemma: string, kind: Kind, irr: Irregular, forms: [string, string[]][]) => {
  let ours: Set<string>;
  try {
    ours = new Set(dictionaryForms(lemma, kind, irr));
  } catch {
    return false; // nhóm không áp dụng được cho từ này (ví dụ 르 với gốc một âm tiết)
  }
  return forms.every(([f]) => SKIP.test(f.trim()) || ours.has(f.trim()));
};

describe('conjugate – ví dụ', () => {
  const cases: [string, Kind, Partial<Record<string, string>>][] = [
    ['먹다', 'verb', { 'present.polite': '먹어요', 'present.formal': '먹습니다', 'past.polite': '먹었어요', 'future.polite': '먹을 거예요', 'present.plain': '먹는다', 'modifier.present': '먹는', 'connective.if': '먹으면', propose: '먹읍시다' }],
    ['가다', 'verb', { 'present.polite': '가요', 'present.formal': '갑니다', 'past.polite': '갔어요', 'present.plain': '간다', honorific: '가세요' }],
    ['보다', 'verb', { 'present.polite': '봐요', 'past.polite': '봤어요' }],
    ['마시다', 'verb', { 'present.polite': '마셔요', 'past.polite': '마셨어요' }],
    ['되다', 'verb', { 'present.polite': '돼요' }],
    ['하다', 'verb', { 'present.polite': '해요', 'past.polite': '했어요', 'present.formal': '합니다' }],
    ['공부하다', 'verb', { 'negative.short': '공부 안 해요', 'present.polite': '공부해요' }],
    ['살다', 'verb', { 'present.formal': '삽니다', honorific: '사세요', 'modifier.present': '사는', 'present.plain': '산다', 'connective.if': '살면', 'future.polite': '살 거예요', 'modifier.past': '산' }],
    ['쓰다', 'verb', { 'present.polite': '써요', 'past.polite': '썼어요' }],
    ['받아쓰다', 'verb', { 'present.polite': '받아써요' }],
    ['아프다', 'adj', { 'present.polite': '아파요', 'modifier.present': '아픈' }],
    ['머물다', 'verb', { 'present.polite': '머물러요' }],
    ['그러다', 'verb', { 'present.polite': '그래요' }],
    ['바쁘다', 'adj', { 'present.polite': '바빠요', 'modifier.present': '바쁜' }],
    ['돕다', 'verb', { 'present.polite': '도와요', 'connective.if': '도우면', 'modifier.past': '도운' }],
    ['춥다', 'adj', { 'present.polite': '추워요', 'modifier.present': '추운', 'present.formal': '춥습니다' }],
    ['듣다', 'verb', { 'present.polite': '들어요', 'connective.because': '들으니까', 'present.formal': '듣습니다' }],
    ['낫다', 'verb', { 'present.polite': '나아요', 'connective.if': '나으면' }],
    ['모르다', 'verb', { 'present.polite': '몰라요', 'past.polite': '몰랐어요' }],
    ['부르다', 'verb', { 'present.polite': '불러요' }],
    ['그렇다', 'adj', { 'present.polite': '그래요', 'modifier.present': '그런', 'connective.if': '그러면' }],
    ['하얗다', 'adj', { 'present.polite': '하얘요' }],
    ['좋다', 'adj', { 'present.polite': '좋아요', 'modifier.present': '좋은' }],
    ['맛있다', 'adj', { 'modifier.present': '맛있는', 'present.plain': '맛있다' }],
    ['푸다', 'verb', { 'present.polite': '퍼요' }],
    ['아니다', 'adj', { 'present.polite': '아니에요', 'present.formal': '아닙니다' }],
  ];
  for (const [lemma, kind, expected] of cases) {
    it(lemma, () => expect(conjugate(lemma, kind)).toMatchObject(expected));
  }
  it('tính từ không có dạng rủ rê, tiếp diễn', () => {
    const forms = conjugate('예쁘다', 'adj');
    expect(forms.propose).toBeUndefined();
    expect(forms.progressive).toBeUndefined();
  });
});

describe('conjugate – đối chiếu krdict', () => {
  const rows = (conj as Row[]).filter(([, pos]) => KIND[pos]);
  it('mọi động/tính từ đều chia đúng với ít nhất một nhóm bất quy tắc (≥ 99%)', () => {
    const miss = rows.filter(([lemma, pos, forms]) => !CLASSES.some((c) => matches(lemma, KIND[pos], c, forms)));
    console.log(`conjugate coverage: ${(100 - (miss.length / rows.length) * 100).toFixed(2)}%`, miss.slice(0, 30).map((r) => r[0] + ':' + r[2].map((f) => f[0]).join(',')));
    expect(1 - miss.length / rows.length).toBeGreaterThanOrEqual(0.99);
  });
  it('đoán nhóm bất quy tắc từ hình dạng từ (≥ 97%)', () => {
    const miss = rows.filter(([lemma, pos, forms]) => !matches(lemma, KIND[pos], guessIrregular(lemma, KIND[pos]), forms));
    console.log(`guessIrregular: ${(100 - (miss.length / rows.length) * 100).toFixed(2)}%`);
    for (const [lemma, pos, forms] of miss) {
      const ours = dictionaryForms(lemma, KIND[pos], guessIrregular(lemma, KIND[pos]));
      console.log(`  ${lemma} (${guessIrregular(lemma, KIND[pos])}) krdict=${forms.map((f) => f[0]).join(',')} ours=${ours.join(',')}`);
    }
    expect(1 - miss.length / rows.length).toBeGreaterThanOrEqual(0.97);
  });
});
