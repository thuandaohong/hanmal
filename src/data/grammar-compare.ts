// Các cặp ngữ pháp dễ nhầm (soạn tay trong grammar-compare.json): điểm khác nhau, mẹo phân biệt, câu ví dụ.
import raw from './grammar-compare.json';
import { type Lang, localize } from '../i18n';
import { GRAMMAR, type GrammarPoint } from './grammar';

export type CompareExample = { ko: string; use: string; tr: Record<Lang, string> };
export type Compare = {
  slug: string;
  /** Tiêu đề riêng khi tên điểm ngữ pháp rộng hơn phần đem so sánh ("부터, 까지" → "까지"). */
  title?: string;
  pair: string[];
  text: Record<Lang, { summary: string; points: string[] }>;
  examples: CompareExample[];
};

export const COMPARES = raw as Compare[];
const BY_SLUG = new Map(GRAMMAR.map((g) => [g.slug, g]));
export const comparePoints = (c: Compare) => c.pair.map((s) => BY_SLUG.get(s)).filter((g): g is GrammarPoint => !!g);
/** Tiêu đề kiểu "-아서/어서 vs -(으)니까". */
export const compareTitle = (c: Compare) => c.title ?? comparePoints(c).map((g) => g.title).join(' vs ');
/** Trình độ của cặp: trình độ cao nhất trong các điểm ngữ pháp. */
export const compareLevel = (c: Compare) => Math.max(...comparePoints(c).map((g) => g.level)) as 1 | 2;
export const compareUrl = (slug: string, lang: Lang) => localize(`/grammar/compare/${slug}`, lang);
/** Các cặp có chứa một điểm ngữ pháp (để hiện "Dễ nhầm với" trên trang ngữ pháp). */
export const comparesFor = (slug: string) => COMPARES.filter((c) => c.pair.includes(slug));
/** Câu sai được đánh dấu bằng "* " ở đầu. */
export const isWrong = (e: CompareExample) => e.ko.startsWith('* ');
