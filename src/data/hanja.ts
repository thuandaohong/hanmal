// Hán tự (dữ liệu tạo bởi scripts/build-hanja.mjs). Chỉ dùng cho bản tiếng Việt và tiếng Nhật.
import raw from './generated/hanja.json';
import strokesRaw from './generated/hanja-strokes.json';
import wordHanjaRaw from './generated/word-hanja.json';
import { type Lang, localize } from '../i18n';

export type Hanja = {
  c: string;
  /** Âm Hàn */
  ko: string[];
  /** Âm Hán Việt, âm thông dụng nhất đứng đầu */
  hv: string[];
  /** Dạng chữ Nhật (chữ mới nếu khác) */
  ja: string;
  on: string[];
  kun: string[];
  en: string[];
  strokes?: number;
  /** Các từ trong bộ từ vựng có chứa chữ này */
  words: string[];
};
/** id: mục krdict có gốc Hán này (từ đồng âm có thể có gốc khác). */
export type WordHanja = { id: string; hv: string; ja: string; hanja: string; sure: boolean };

export const HANJA = raw as Hanja[];
export const BY_HANJA = new Map(HANJA.map((h) => [h.c, h]));
export const HANJA_STROKES = strokesRaw as Record<string, string[]>;
export const WORD_HANJA = wordHanjaRaw as Record<string, WordHanja>;

export const hanjaUrl = (c: string, lang: Lang) => localize(`/hanja/${c}`, lang);
