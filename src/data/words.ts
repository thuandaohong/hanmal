// Truy vấn từ vựng (dữ liệu tạo bởi scripts/build-data.mjs từ krdict).
import raw from './generated/words.json';
import { type Key, type Lang, localize, t } from '../i18n';
import { CHO, decompose } from '../lib/hangul/compose';
import { romanize } from '../lib/hangul/romanize';
import topicsRaw from './topics.json';
import { type Irregular, type Kind, dictionaryForms, guessIrregular } from '../lib/hangul/conjugate';

export type Sense = {
  /** Định nghĩa tiếng Hàn */
  ko: string;
  /** Bản dịch: [từ tương đương, định nghĩa] */
  eq: Partial<Record<Lang, [string, string]>>;
  /** Câu ví dụ (mỗi câu ví dụ có thể là một đoạn hội thoại nhiều dòng) */
  ex: string[][];
};
export type Entry = {
  id: string;
  pos: string;
  origin?: string;
  pron: string[];
  forms?: string[];
  category?: string;
  senses: Sense[];
};
export type Word = { w: string; level: 1 | 2; rank: number; entries: Entry[] };

export const WORDS = raw as Word[];
export const BY_WORD = new Map(WORDS.map((w) => [w.w, w]));

export const wordUrl = (w: string, lang: Lang) => localize(`/word/${w}`, lang);

const plain = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/**
 * Bản dịch ngắn đã làm sạch: bỏ khi chỉ là phiên âm Latin của chính từ đó (번 → "beon"),
 * bỏ phần phiên âm đứng đầu ("chaek; sách" → "sách").
 */
export function equivalentOf(word: string, s: Sense, lang: Lang): string {
  const e = s.eq[lang]?.[0]?.trim() ?? '';
  if (!e || lang === 'ja') return e;
  const rom = plain(romanize(word.replace(/^-|-$/g, '')));
  if (plain(e) === rom) return '';
  const [head, ...rest] = e.split(/;\s*/);
  return rest.length && plain(head) === rom ? rest.join('; ') : e;
}

/** Nghĩa ngắn của từ ở một ngôn ngữ (nghĩa đầu tiên của mục đầu tiên; mục cùng trình độ đã được xếp trước). */
export function gloss(word: Word, lang: Lang): string {
  const override = GLOSS_OVERRIDE[word.w]?.[lang];
  if (override) return override;
  for (const e of word.entries) for (const s of e.senses) {
    const eq = equivalentOf(word.w, s, lang);
    if (eq) return eq;
  }
  // Không có từ tương đương: lấy vế đầu của định nghĩa đã dịch.
  for (const e of word.entries) for (const s of e.senses) {
    const def = s.eq[lang]?.[1]?.split(/[.;。]/)[0]?.trim();
    if (def) return def.length > 60 ? def.slice(0, 57) + '…' : def;
  }
  return '';
}

/** Một nghĩa của krdict không phải nghĩa thông dụng nhất (교수: nghĩa 1 là "việc giảng dạy"). */
const GLOSS_OVERRIDE: Record<string, Partial<Record<Lang, string>>> = {
  교수: { vi: 'giáo sư', ja: '教授', en: 'professor', id: 'profesor' },
};

const KIND: Record<string, Kind> = { 동사: 'verb', 형용사: 'adj', '보조 동사': 'verb', '보조 형용사': 'adj' };
export const kindOf = (e: Entry): Kind | undefined => KIND[e.pos];

const IRREGULARS: Irregular[] = ['regular', 'ㅂ', 'ㄷ', 'ㅅ', '르', '러', 'ㅎ', '우', '여'];

/**
 * Nhóm bất quy tắc của một động/tính từ. Ưu tiên nhóm khớp với các dạng chia trong từ điển
 * (phân biệt được từ đồng âm như 걷다 "đi bộ" / 걷다 "cuộn lên"), nếu không thì đoán từ hình dạng từ.
 */
export function irregularOf(lemma: string, e: Entry): Irregular | undefined {
  const kind = KIND[e.pos];
  if (!kind || !lemma.endsWith('다')) return undefined;
  const guess = guessIrregular(lemma, kind);
  const forms = (e.forms ?? []).filter((f) => !/(거라|너라|여라|마오)$/.test(f));
  if (!forms.length) return guess;
  const fits = (irr: Irregular) => {
    try {
      const ours = new Set(dictionaryForms(lemma, kind, irr));
      return forms.every((f) => ours.has(f));
    } catch {
      return false;
    }
  };
  if (fits(guess)) return guess;
  return IRREGULARS.find(fits) ?? guess;
}

/** Từ sơ cấp bắt đầu bằng một chữ cái (phụ âm đầu hoặc nguyên âm của âm tiết đầu), ưu tiên từ ngắn. */
export function wordsStartingWith(jamo: string, kind: 'consonant' | 'vowel', limit = 8): Word[] {
  return WORDS.filter((w) => {
    if (w.level !== 1 || w.w.length > 3) return false;
    const s = decompose(w.w[0]);
    return !!s && (kind === 'consonant' ? s.c === jamo : s.v === jamo);
  }).slice(0, limit);
}

// ---------- Nhãn hiển thị ----------

const POS_KEY: Record<string, Key> = {
  명사: 'pos.noun', 동사: 'pos.verb', 형용사: 'pos.adjective', 부사: 'pos.adverb', 관형사: 'pos.determiner',
  '의존 명사': 'pos.boundNoun', 수사: 'pos.numeral', 대명사: 'pos.pronoun', 감탄사: 'pos.interjection',
  접사: 'pos.affix', '보조 동사': 'pos.auxVerb', '보조 형용사': 'pos.auxAdjective', '품사 없음': 'pos.none',
};
export const posLabel = (pos: string, lang: Lang) => (POS_KEY[pos] ? t(lang, POS_KEY[pos]) : pos);

export function irregularLabel(irr: Irregular, lang: Lang): string {
  if (irr === 'regular') return t(lang, 'irr.regular');
  if (irr === '여') return t(lang, 'irr.hada');
  return t(lang, 'irr.label', { type: irr });
}

// ---------- Theo trình độ, chữ cái đầu ----------
export const LEVELS = [
  // Sơ cấp và trung cấp của krdict tương ứng gần với TOPIK I và TOPIK II (cấp 3–4).
  { level: 1 as const, slug: 'beginner', key: 'nav.beginner' as Key, topik: 'TOPIK I' },
  { level: 2 as const, slug: 'intermediate', key: 'nav.intermediate' as Key, topik: 'TOPIK II' },
];
export const byLevel = (level: 1 | 2) => WORDS.filter((w) => w.level === level);

/** Phụ âm đầu cơ bản của từ (phụ âm căng gộp vào phụ âm thường: 꽃 → ㄱ). */
const BASE_OF: Record<string, string> = { ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ' };
export function initialGroup(word: string): string {
  const c = decompose(word.replace(/^-/, '')[0] ?? '')?.c ?? '';
  return BASE_OF[c] ?? c;
}
const ORDER = CHO.filter((c) => !BASE_OF[c]);
/** Phụ âm căng gộp chung nhóm: ㄱ → ㄲ. */
export const TENSE_OF: Record<string, string> = Object.fromEntries(Object.entries(BASE_OF).map(([t, b]) => [b, t]));

/** Gom từ theo phụ âm đầu, mỗi nhóm xếp theo thứ tự từ điển tiếng Hàn. */
export function groupByInitial(list: Word[]): { initial: string; words: Word[] }[] {
  const collator = new Intl.Collator('ko');
  return ORDER.map((initial) => ({
    initial,
    words: list.filter((w) => initialGroup(w.w) === initial).sort((a, b) => collator.compare(a.w, b.w)),
  })).filter((g) => g.words.length);
}

// ---------- Chủ đề ----------
export type Topic = {
  ko: string;
  slug: string;
  name: Record<Lang, string>;
  subs: { ko: string; name: Record<Lang, string> }[];
};
export const TOPICS = topicsRaw as Topic[];

type TopicRef = { topic: Topic; sub?: Topic['subs'][number] };
const topicCache = new Map<Word, TopicRef | undefined>();

/** Chủ đề của một từ: chủ đề lớn và chủ đề con theo phân loại của krdict. */
export function topicOf(word: Word): TopicRef | undefined {
  if (topicCache.has(word)) return topicCache.get(word);
  const cat = word.entries.find((e) => e.category)?.category;
  let ref: TopicRef | undefined;
  if (cat) {
    const [top, subKo] = cat.split(' > ');
    const topic = TOPICS.find((x) => x.ko === top);
    if (topic) ref = { topic, sub: topic.subs.find((s) => s.ko === subKo) };
  }
  topicCache.set(word, ref);
  return ref;
}

let bySub: Map<object, Word[]> | undefined;
/** Các từ khác cùng chủ đề con (hoặc cùng chủ đề lớn nếu không có chủ đề con). */
export function sameTopic(word: Word, limit = 12): Word[] {
  if (!bySub) {
    bySub = new Map();
    for (const w of WORDS) {
      const ref = topicOf(w);
      if (!ref) continue;
      const key = ref.sub ?? ref.topic;
      if (!bySub.has(key)) bySub.set(key, []);
      bySub.get(key)!.push(w);
    }
  }
  const ref = topicOf(word);
  if (!ref) return [];
  return (bySub.get(ref.sub ?? ref.topic) ?? []).filter((w) => w !== word).slice(0, limit);
}

/** Từ trước và sau trong cùng trình độ (theo thứ tự thông dụng). */
export function neighbors(word: Word): [Word | undefined, Word | undefined] {
  const i = word.rank; // rank chính là vị trí trong WORDS
  const prev = WORDS[i - 1]?.level === word.level ? WORDS[i - 1] : undefined;
  const next = WORDS[i + 1]?.level === word.level ? WORDS[i + 1] : undefined;
  return [prev, next];
}

/** Các từ trong một chủ đề lớn, gom theo chủ đề con (theo thứ tự thông dụng). */
export function wordsInTopic(topic: Topic): { sub?: Topic['subs'][number]; words: Word[] }[] {
  const inTopic = WORDS.filter((w) => topicOf(w)?.topic === topic);
  const groups = topic.subs.map((sub) => ({ sub, words: inTopic.filter((w) => topicOf(w)?.sub === sub) }));
  const rest = inTopic.filter((w) => !topicOf(w)?.sub);
  return [...groups, ...(rest.length ? [{ sub: undefined, words: rest }] : [])].filter((g) => g.words.length);
}
