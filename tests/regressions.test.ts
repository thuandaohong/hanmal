// Các lỗi phát hiện trong đợt review (giữ lại để không tái phát).
import { describe, expect, test } from 'vitest';
import { conjugate } from '../src/lib/hangul/conjugate';
import { pronounceText } from '../src/lib/hangul/pronounce';
import { romanize } from '../src/lib/hangul/romanize';
import { formExamples } from '../src/lib/hangul/grammar';

describe('chia động/tính từ', () => {
  test.each([
    ['갖다', 'honorific', '가지세요'], ['갖다', 'connective.if', '가지면'], ['갖다', 'modifier.past', '가진'], ['갖다', 'connective.and', '갖고'],
    ['서툴다', 'present.polite', '서툴러요'],
    ['이다', 'present.polite', '이에요'], ['이다', 'negative.short', '아니에요'], ['있다', 'negative.short', '없어요'],
    ['좋아하다', 'negative.short', '안 좋아해요'], ['공부하다', 'negative.short', '공부 안 해요'],
  ])('%s %s → %s', (lemma, form, expected) => {
    expect(conjugate(lemma, 'verb')[form as 'honorific']).toBe(expected);
  });
  test('아니다 không có phủ định ngắn', () => expect(conjugate('아니다', 'adj')['negative.short']).toBeUndefined());
});

describe('phát âm và phiên âm', () => {
  test.each([['붙여', '부처'], ['닫혀', '다처'], ['닭고기', '닥꼬기'], ['맑게', '말께'], ['앉다', '안따'], ['젊다', '점따']])('%s → [%s]', (w, p) =>
    expect(pronounceText(w)).toBe(p));
  test.each([['없이', 'eopsi'], ['값이', 'gapsi'], ['좋소', 'joso']])('%s → %s', (w, r) => expect(romanize(w)).toBe(r));
  test.each([['백화점', 'baekhwajeom'], ['묵호', 'mukho'], ['집현전', 'jiphyeonjeon']])('danh từ %s → %s', (w, r) =>
    expect(romanize(w, { noun: true })).toBe(r));
});

describe('ví dụ cách kết hợp ngữ pháp', () => {
  const results = (forms: string[], slug: string) => formExamples(forms, slug).map((e) => e.result);
  test('-아/어 보이다 chỉ với tính từ', () => expect(results(['-아 보이다', '-어 보이다', '-여 보이다'], 'a-boida')).toContain('피곤해 보이다'));
  test('께서 với người', () => expect(results(['께서'], 'kkeseo')).toEqual(['선생님께서', '할머니께서', '부모님께서']));
  test('-는 길에 với động từ di chuyển', () => expect(results(['-는 길에'], 'neun-gil')[0]).toBe('가는 길에'));
});
