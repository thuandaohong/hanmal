import { describe, expect, it } from 'vitest';
import { compose, decompose, disassemble, hasBatchim, initials } from '../src/lib/hangul/compose';
import { assemble } from '../src/lib/hangul/keyboard';
import { attach } from '../src/lib/hangul/particles';

describe('compose', () => {
  it('tách và ghép âm tiết', () => {
    expect(decompose('한')).toEqual({ c: 'ㅎ', v: 'ㅏ', f: 'ㄴ' });
    expect(compose({ c: 'ㄱ', v: 'ㅡ', f: 'ㄹ' })).toBe('글');
    expect(decompose('a')).toBeNull();
  });
  it('tách chuỗi thành chữ cái', () => {
    expect(disassemble('한국어')).toBe('ㅎㅏㄴㄱㅜㄱㅇㅓ');
    expect(disassemble('닭', true)).toBe('ㄷㅏㄹㄱ');
    expect(disassemble('과', true)).toBe('ㄱㅗㅏ');
  });
  it('phụ âm cuối và chữ cái đầu', () => {
    expect(hasBatchim('학생')).toBe(true);
    expect(hasBatchim('친구')).toBe(false);
    expect(initials('한국어')).toBe('ㅎㄱㅇ');
  });
});

describe('particles', () => {
  it('chọn tiểu từ', () => {
    expect(attach('학생', 'topic')).toBe('학생은');
    expect(attach('친구', 'topic')).toBe('친구는');
    expect(attach('책', 'object')).toBe('책을');
    expect(attach('서울', 'direction')).toBe('서울로');
    expect(attach('집', 'direction')).toBe('집으로');
    expect(attach('의사', 'copula')).toBe('의사예요');
  });
});

describe('keyboard', () => {
  const cases: [string, string][] = [
    ['ㅎㅏㄴㄱㅡㄹ', '한글'], ['ㄱㅏㄱㅏ', '가가'], ['ㄷㅏㄹㄱㅇㅣ', '닭이'], ['ㄷㅏㄹㄱㅣ', '달기'],
    ['ㄱㅗㅏ', '과'], ['ㅇㅢㅅㅏ', '의사'], ['ㄱㅏㅂㅅ', '값'], ['ㄱㅏㅂㅅㅇㅣ', '값이'], ['ㄱㅏㅂㅅㅣ', '갑시'],
    ['ㅎㅏㄴ ㄱㅡㄹ', '한 글'], ['ㄱ', 'ㄱ'], ['ㅏ', 'ㅏ'], ['ㅂㅏㅂㅁㅓㄱㅇㅓ', '밥먹어'],
  ];
  for (const [input, expected] of cases) it(`${input} → ${expected}`, () => expect(assemble(input)).toBe(expected));
});
