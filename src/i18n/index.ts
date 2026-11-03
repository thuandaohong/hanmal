// Đa ngôn ngữ: tiếng Anh (mặc định, URL gốc), tiếng Việt (/vi/), tiếng Nhật (/ja/), tiếng Indonesia (/id/).
// Chuỗi giao diện nằm trong locales/*.json; scripts/check-i18n.mjs bảo đảm các file có cùng bộ khoá.
import vi from './locales/vi.json';
import ja from './locales/ja.json';
import en from './locales/en.json';
import id from './locales/id.json';

export const LANGS = ['en', 'vi', 'ja', 'id'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export const LANG_META: Record<Lang, { label: string; short: string; ogLocale: string }> = {
  en: { label: 'English', short: 'EN', ogLocale: 'en_US' },
  vi: { label: 'Tiếng Việt', short: 'VI', ogLocale: 'vi_VN' },
  ja: { label: '日本語', short: 'JA', ogLocale: 'ja_JP' },
  id: { label: 'Bahasa Indonesia', short: 'ID', ogLocale: 'id_ID' },
};

export type Key = keyof typeof vi;
const DICTS: Record<Lang, Record<Key, string>> = { vi, ja, en, id };

/** Ngôn ngữ của trang hiện tại, lấy từ Astro.currentLocale. */
export const getLang = (astro: { currentLocale?: string }): Lang =>
  (LANGS as readonly string[]).includes(astro.currentLocale ?? '') ? (astro.currentLocale as Lang) : DEFAULT_LANG;

/** Chuỗi dịch, thay {tên} bằng giá trị trong vars: t('vi', 'home.words', { n: 3 }). */
export function t(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  // Số ít: dùng khoá "<key>One" nếu có (en: "1 stroke" thay vì "1 strokes").
  const one = vars && Number(vars.n) === 1 ? DICTS[lang][`${key}One` as Key] : undefined;
  const s = one ?? DICTS[lang][key] ?? DICTS[DEFAULT_LANG][key];
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;
}

/** Hàm dịch gắn sẵn ngôn ngữ: const tr = translator(lang); tr('nav.vocabulary'). */
export const translator = (lang: Lang) => (key: Key, vars?: Record<string, string | number>) => t(lang, key, vars);

const PREFIX = new RegExp(`^/(${LANGS.filter((l) => l !== DEFAULT_LANG).join('|')})(?=/|$)`);

/** Bỏ tiền tố ngôn ngữ: "/vi/vocabulary" → "/vocabulary". */
export const stripLang = (path: string) => path.replace(PREFIX, '') || '/';

/** Đường dẫn của trang ở ngôn ngữ cho trước: localize("/vocabulary", "ja") → "/ja/vocabulary". */
export function localize(path: string, lang: Lang) {
  const base = stripLang(path);
  if (lang === DEFAULT_LANG) return base;
  return base === '/' ? `/${lang}` : `/${lang}${base}`;
}

/** Hàm tạo link theo ngôn ngữ: const l = linker(lang); l('/vocabulary'). */
export const linker = (lang: Lang) => (path: string) => localize(path, lang);
