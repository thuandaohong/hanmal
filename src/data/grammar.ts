// Ngữ pháp: danh sách tự soạn (grammar-list.json) ghép với định nghĩa, bản dịch và câu ví dụ của krdict.
import raw from './generated/grammar.json';
import { type Key, type Lang, localize } from '../i18n';
import type { Sense } from './words';

export type GrammarPoint = {
  slug: string;
  level: 1 | 2;
  title: string;
  forms: string[];
  pos: 'ending' | 'particle' | 'expression';
  senses: Sense[];
  examples: string[][];
};

export const GRAMMAR = raw as GrammarPoint[];
export const grammarUrl = (slug: string, lang: Lang) => localize(`/grammar/${slug}`, lang);
export const kindKey = (g: GrammarPoint) => `grammar.kind.${g.pos}` as Key;

/** Ý nghĩa ngắn theo ngôn ngữ: định nghĩa đã dịch của nghĩa đầu tiên. */
export const grammarMeaning = (g: GrammarPoint, lang: Lang) => g.senses.map((s) => s.eq[lang]?.[1]?.trim()).find(Boolean) ?? '';

/**
 * "Từ tương đương" của bản dịch. Bỏ qua khi chỉ là phiên âm Latin (bản tiếng Anh: "-ayo")
 * hoặc khi bản dịch để trống.
 */
export function equivalent(s: Sense, lang: Lang): string {
  const e = s.eq[lang]?.[0]?.trim() ?? '';
  if (!e || /^-?[a-z]+(?:[-\s][a-z]+)*-?$/.test(e) && lang === 'en') return '';
  return e;
}
