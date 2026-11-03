// Cấu hình chung của site. Đổi tên/thương hiệu tại đây.
import { type Key, type Lang, linker, t } from '../i18n';

export const SITE = {
  name: 'hanmal',
  nameParts: ['han', 'mal'] as const,
  /** Chữ trên biểu tượng */
  mark: '한',
  /** Email liên hệ (trang Chính sách quyền riêng tư) */
  contactEmail: 'thuandao93haiduong@gmail.com',
};

export type NavLink = { label: string; href: string };
export type NavGroup = { title?: string; links: NavLink[] };
export type NavMenu = { label: string; href?: string; groups: NavGroup[] };

/** Module Hán tự chỉ có ở bản tiếng Việt (âm Hán Việt) và tiếng Nhật (kanji). */
export const HANJA_LANGS: Lang[] = ['vi', 'ja'];
export const hasHanja = (lang: Lang) => HANJA_LANGS.includes(lang);

const links = (lang: Lang, items: [Key, string][]): NavLink[] => {
  const l = linker(lang);
  return items.map(([key, path]) => ({ label: t(lang, key), href: l(path) }));
};

export function nav(lang: Lang): NavMenu[] {
  const l = linker(lang);
  return [
    {
      label: t(lang, 'nav.hangul'),
      groups: [
        {
          links: links(lang, [
            ['nav.hangulChart', '/hangul'],
            ['nav.syllables', '/hangul/syllables'],
            ['nav.batchim', '/hangul/batchim'],
            ['nav.quiz', '/hangul/quiz'],
          ]),
        },
      ],
    },
    {
      label: t(lang, 'nav.vocabulary'),
      groups: [
        {
          links: [
            { label: `${t(lang, 'nav.beginner')} · TOPIK I`, href: l('/vocabulary/beginner') },
            { label: `${t(lang, 'nav.intermediate')} · TOPIK II`, href: l('/vocabulary/intermediate') },
            ...links(lang, [
              ['nav.byTopic', '/vocabulary/topics'],
              ['nav.flashcards', '/flashcards'],
            ]),
          ],
        },
      ],
    },
    {
      label: t(lang, 'nav.grammar'),
      groups: [
        {
          links: [
            { label: `${t(lang, 'nav.beginner')} · TOPIK I`, href: `${l('/grammar')}#level-1` },
            { label: `${t(lang, 'nav.intermediate')} · TOPIK II`, href: `${l('/grammar')}#level-2` },
            ...links(lang, [
              ['nav.grammarCompare', '/grammar/compare'],
              ['nav.allGrammar', '/grammar'],
            ]),
          ],
        },
      ],
    },
    {
      label: t(lang, 'nav.tools'),
      groups: [
        {
          links: links(lang, [
            ['nav.conjugator', '/tools/conjugator'],
            ['nav.pronunciation', '/tools/pronunciation'],
            ['nav.romanizer', '/tools/romanizer'],
            ['nav.koreanName', '/tools/korean-name'],
            ['nav.keyboard', '/tools/keyboard'],
            ['nav.search', '/search'],
          ]),
        },
      ],
    },
  ];
}

export function footer(lang: Lang): { title: string; links: NavLink[] }[] {
  return [
    {
      title: t(lang, 'nav.hangul'),
      links: links(lang, [
        ['nav.hangulChart', '/hangul'],
        ['nav.syllables', '/hangul/syllables'],
        ['nav.batchim', '/hangul/batchim'],
        ['nav.quiz', '/hangul/quiz'],
      ]),
    },
    {
      title: t(lang, 'footer.learn'),
      links: links(lang, [
        ['nav.beginner', '/vocabulary/beginner'],
        ['nav.intermediate', '/vocabulary/intermediate'],
        ['nav.byTopic', '/vocabulary/topics'],
        ['nav.grammar', '/grammar'],
        ['nav.grammarCompare', '/grammar/compare'],
        ...(hasHanja(lang) ? ([['nav.hanja', '/hanja']] as [Key, string][]) : []),
      ]),
    },
    {
      title: t(lang, 'nav.tools'),
      links: links(lang, [
        ['nav.conjugator', '/tools/conjugator'],
        ['nav.pronunciation', '/tools/pronunciation'],
        ['nav.romanizer', '/tools/romanizer'],
        ['nav.koreanName', '/tools/korean-name'],
        ['nav.flashcards', '/flashcards'],
      ]),
    },
    {
      title: t(lang, 'footer.info'),
      links: links(lang, [
        ['footer.about', '/about'],
        ['footer.credits', '/credits'],
        ['footer.privacy', '/privacy'],
      ]),
    },
  ];
}
