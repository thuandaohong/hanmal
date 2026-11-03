// Chia động từ và tính từ tiếng Hàn từ dạng từ điển (…다).
// Các nhóm bất quy tắc: ㅂ (돕다 → 도와), ㄷ (듣다 → 들어), ㅅ (낫다 → 나아), 르 (모르다 → 몰라),
// 러 (이르다 → 이르러), ㅎ (그렇다 → 그래), 우 (푸다 → 퍼), 여 (하다 → 해).
// Lược ㄹ (살다 → 사세요) và lược ㅡ (쓰다 → 써) là quy tắc chung nên không tính là bất quy tắc.
import { compose, decompose } from './compose';

export type Kind = 'verb' | 'adj';
export type Irregular = 'regular' | 'ㅂ' | 'ㄷ' | 'ㅅ' | '르' | '러' | 'ㅎ' | '우' | '여';

export const FORM_KEYS = [
  'present.polite', 'present.formal', 'present.informal', 'present.plain',
  'past.polite', 'past.formal', 'past.informal', 'past.plain',
  'future.polite',
  'negative.short', 'negative.long',
  'honorific', 'propose', 'want', 'progressive', 'can',
  'connective.and', 'connective.so', 'connective.if', 'connective.because', 'connective.but',
  'modifier.present', 'modifier.past', 'modifier.future',
  'nominal',
] as const;
export type FormKey = (typeof FORM_KEYS)[number];

/** Dạng chỉ có ở động từ. */
const VERB_ONLY = new Set<FormKey>(['propose', 'want', 'progressive', 'can', 'modifier.past']);

// Danh sách bất quy tắc thường gặp; dữ liệu từ điển của site sẽ ghi đè khi biết chắc.
const IRREGULAR_ㅂ_VERBS = new Set(['돕다', '눕다', '줍다', '굽다', '깁다', '여쭙다', '여쭈다']);
const REGULAR_ㅂ_ADJS = new Set(['좁다', '수줍다', '굽다']);
const IRREGULAR_ㄷ = new Set(['듣다', '걷다', '묻다', '싣다', '깨닫다', '붇다', '일컫다', '긷다', '눋다', '알아듣다', '엿듣다', '되묻다']);
const REGULAR_ㄷ = new Set(['파묻다', '묻다']); // 묻다 "chôn" thường; 묻다 "hỏi" (bất quy tắc) do từ điển xác định
const IRREGULAR_ㅅ = new Set(['낫다', '짓다', '붓다', '잇다', '긋다', '젓다', '잣다']);
// 이르다 (đến), 누르다 (vàng) thuộc nhóm 러 nhưng nghĩa thường gặp hơn (bảo, sớm / ấn) thuộc nhóm 르.
const IRREGULAR_러 = new Set(['푸르다', '노르다']);
const REGULAR_르 = new Set(['따르다', '치르다', '들르다', '다다르다', '뒤따르다', '잇따르다']);
const REGULAR_ㅎ_ADJS = ['좋다'];
/** 그러다/이러다/저러다 chia như bất quy tắc ㅎ: 그래, 그러니. */
const LIKE_ㅎ = new Set(['그러다', '이러다', '저러다', '어쩌다']);
/** Dạng rút gọn chia theo dạng đầy đủ: 머물다 = 머무르다 → 머물러. */
const SHORT_OF: Record<string, string> = { 머물다: '머무르다', 서둘다: '서두르다', 서툴다: '서투르다', 갖다: '가지다' };
const WA = new Set(['돕다', '곱다']);
/** Phủ định ngắn không dùng 안: 이다 → 아니에요, 있다 → 없어요; 아니다 thì không có (chuỗi rỗng = bỏ). */
const NEGATIVE_OF: Record<string, string> = { 이다: '아니에요', 있다: '없어요', 아니다: '' };

const syl = (ch: string) => decompose(ch)!;
const setFinal = (ch: string, f: string) => compose({ ...syl(ch), f });
const replaceLast = (s: string, ch: string) => s.slice(0, -1) + ch;
/** Nguyên âm dương (ㅏ, ㅑ, ㅗ) đi với 아, còn lại đi với 어. */
const yang = (v: string) => v === 'ㅏ' || v === 'ㅑ' || v === 'ㅗ';
const isHada = (stem: string) => stem.endsWith('하');
/** 있다/없다 và từ ghép (맛있다, 재미없다) chia như động từ ở dạng bổ nghĩa hiện tại (있는). */
const isItda = (stem: string) => stem.endsWith('있') || stem.endsWith('없');

/** Đoán nhóm bất quy tắc từ hình dạng từ (dùng khi từ điển không có thông tin). */
export function guessIrregular(lemma: string, kind: Kind): Irregular {
  const stem = lemma.slice(0, -1);
  const last = syl(stem.at(-1)!);
  if (isHada(stem)) return '여';
  if (lemma === '푸다') return '우';
  if (LIKE_ㅎ.has(lemma)) return 'ㅎ';
  if (IRREGULAR_러.has(lemma)) return '러';
  if (stem.endsWith('르') && stem.length > 1 && !REGULAR_르.has(lemma)) return '르';
  if (last.f === 'ㅂ') return kind === 'adj' ? (REGULAR_ㅂ_ADJS.has(lemma) ? 'regular' : 'ㅂ') : IRREGULAR_ㅂ_VERBS.has(lemma) ? 'ㅂ' : 'regular';
  if (last.f === 'ㄷ' && [...IRREGULAR_ㄷ].some((w) => lemma.endsWith(w)) && !REGULAR_ㄷ.has(lemma)) return 'ㄷ';
  if (last.f === 'ㅅ' && [...IRREGULAR_ㅅ].some((w) => lemma.endsWith(w))) return 'ㅅ';
  if (last.f === 'ㅎ' && kind === 'adj' && !REGULAR_ㅎ_ADJS.some((w) => lemma.endsWith(w))) return 'ㅎ';
  return 'regular';
}

/**
 * Dạng 아/어 (dùng cho -아요, -아서, quá khứ). Trả về dạng rút gọn (가, 봐, 마셔)
 * và dạng đầy đủ nếu có (보아, 마시어).
 */
export function infinitive(lemma: string, irr: Irregular): { short: string; full: string } {
  const stem = lemma.slice(0, -1);
  const lastCh = stem.at(-1)!;
  const last = syl(lastCh);
  const prev = stem.length > 1 ? syl(stem.at(-2)!) : null;
  const same = (s: string) => ({ short: s, full: s });

  if (lemma === '아니다') return same('아니어');
  if (lemma === '이다') return same('이어');
  if (SHORT_OF[lemma]) {
    const full = SHORT_OF[lemma];
    return infinitive(full, guessIrregular(full, 'verb'));
  }
  switch (irr) {
    case '여':
      return { short: replaceLast(stem, '해'), full: stem + '여' };
    case 'ㅎ': {
      const v = last.v === 'ㅑ' || last.v === 'ㅕ' ? 'ㅒ' : 'ㅐ';
      return same(replaceLast(stem, compose({ c: last.c, v, f: '' })));
    }
    case '우':
      return same(replaceLast(stem, compose({ c: last.c, v: 'ㅓ', f: '' })));
    case '르': {
      const before = stem.slice(0, -2) + setFinal(stem.at(-2)!, 'ㄹ');
      return same(before + (prev && yang(prev.v) ? '라' : '러'));
    }
    case '러':
      return same(stem + '러');
    case 'ㅂ': {
      const base = replaceLast(stem, setFinal(lastCh, ''));
      return same(base + (WA.has(lemma) ? '와' : '워'));
    }
    case 'ㄷ':
      return same(replaceLast(stem, setFinal(lastCh, 'ㄹ')) + (yang(last.v) ? '아' : '어'));
    case 'ㅅ':
      return same(replaceLast(stem, setFinal(lastCh, '')) + (yang(last.v) ? '아' : '어'));
  }

  // Quy tắc thường.
  if (last.f) return same(stem + (yang(last.v) ? '아' : '어'));
  if (last.v === 'ㅡ') {
    // Lược ㅡ: 쓰다 → 써, 바쁘다 → 바빠, 예쁘다 → 예뻐.
    // Động từ ghép kiểu 받아쓰다 xét riêng phần sau (쓰다 → 써).
    const compound = stem.length >= 3 && !!prev && !prev.f && prev.c === 'ㅇ' && ['ㅏ', 'ㅓ', 'ㅕ'].includes(prev.v);
    const v = prev && !compound && yang(prev.v) ? 'ㅏ' : 'ㅓ';
    return same(replaceLast(stem, compose({ c: last.c, v, f: '' })));
  }
  const contract: Record<string, [string, string]> = {
    ㅏ: ['ㅏ', '아'], ㅓ: ['ㅓ', '어'], ㅕ: ['ㅕ', '어'], ㅐ: ['ㅐ', '어'], ㅔ: ['ㅔ', '어'],
    ㅗ: ['ㅘ', '아'], ㅜ: ['ㅝ', '어'], ㅣ: ['ㅕ', '어'], ㅚ: ['ㅙ', '어'],
  };
  const c = contract[last.v];
  if (!c) return same(stem + '어'); // 쉬다 → 쉬어, 띄다 → 띄어
  const short = replaceLast(stem, compose({ c: last.c, v: c[0], f: '' }));
  // 가다, 서다, 켜다 không có dạng đầy đủ khác (가아 không dùng).
  const full = ['ㅏ', 'ㅓ', 'ㅕ'].includes(last.v) ? short : stem + c[1];
  return { short, full };
}

/** Gốc dùng trước đuôi bắt đầu bằng (으): cho biết có cần 으 không và gốc có phải gốc ㄹ không. */
function euStem(lemma: string, irr: Irregular): { stem: string; eu: boolean; rieul: boolean } {
  // 갖다 = 가지다: 가지세요, 가지면, 가진 (không phải 갖으세요).
  if (SHORT_OF[lemma]) return euStem(SHORT_OF[lemma], guessIrregular(SHORT_OF[lemma], 'verb'));
  const stem = lemma.slice(0, -1);
  const lastCh = stem.at(-1)!;
  const last = syl(lastCh);
  switch (irr) {
    case 'ㅂ':
      return { stem: replaceLast(stem, setFinal(lastCh, '')) + '우', eu: false, rieul: false };
    case 'ㄷ':
      return { stem: replaceLast(stem, setFinal(lastCh, 'ㄹ')), eu: true, rieul: false };
    case 'ㅅ':
      return { stem: replaceLast(stem, setFinal(lastCh, '')), eu: true, rieul: false };
    case 'ㅎ':
      return { stem: replaceLast(stem, setFinal(lastCh, '')), eu: false, rieul: false };
  }
  if (last.f === 'ㄹ') return { stem, eu: false, rieul: true };
  return { stem, eu: !!last.f, rieul: false };
}

/** Gắn đuôi dạng âm tiết có (으): 니, 면, 니까, 세요, 러… (먹으니, 가니, 사니, 살면). */
export function withEu(lemma: string, irr: Irregular, ending: string): string {
  const { stem, eu, rieul } = euStem(lemma, irr);
  if (eu) return stem + '으' + ending;
  // Gốc ㄹ: ㄹ rụng trước ㄴ, ㅅ (사니, 사세요) nhưng giữ trước 면, 러 (살면, 살러).
  if (rieul && /^[니세시]/.test(ending)) return replaceLast(stem, setFinal(stem.at(-1)!, '')) + ending;
  return stem + ending;
}

/** Gắn đuôi là phụ âm cuối có (으): ㄴ, ㄹ, ㅂ (먹은, 간, 산, 먹을, 살, 갑시다). */
export function withEuFinal(lemma: string, irr: Irregular, final: 'ㄴ' | 'ㄹ' | 'ㅂ', rest = ''): string {
  const { stem, eu, rieul } = euStem(lemma, irr);
  if (eu) return stem + setFinal('으', final) + rest;
  return replaceLast(stem, setFinal(stem.at(-1)!, rieul && final === 'ㄹ' ? 'ㄹ' : final)) + rest;
}

/** Đuôi bắt đầu bằng phụ âm, gắn thẳng vào gốc (고, 지, 기…); gốc ㄹ rụng trước ㄴ (사는). */
export function withConsonant(lemma: string, ending: string): string {
  const stem = lemma.slice(0, -1);
  const last = syl(stem.at(-1)!);
  // Gốc ㄹ rụng trước ㄴ, ㅂ, ㅅ (사는, 사네요, 사세요).
  if (last.f === 'ㄹ' && /^[는느니네나냐습세]/.test(ending)) return replaceLast(stem, setFinal(stem.at(-1)!, '')) + ending;
  return stem + ending;
}

/** 습니다 / ㅂ니다 */
export function formal(lemma: string): string {
  const stem = lemma.slice(0, -1);
  const last = syl(stem.at(-1)!);
  if (last.f && last.f !== 'ㄹ') return stem + '습니다';
  return replaceLast(stem, setFinal(stem.at(-1)!, 'ㅂ')) + '니다';
}

/** Thêm ㅆ vào âm tiết cuối: 먹어 → 먹었, 가 → 갔. */
export const past = (inf: string) => replaceLast(inf, setFinal(inf.at(-1)!, 'ㅆ'));

/** Chia đầy đủ. Dạng không áp dụng cho tính từ (như rủ rê, tiếp diễn) sẽ không có trong kết quả. */
export function conjugate(lemma: string, kind: Kind, irr: Irregular = guessIrregular(lemma, kind)): Partial<Record<FormKey, string>> {
  if (!lemma.endsWith('다') || lemma.length < 2 || !decompose(lemma.at(-2)!)) {
    throw new Error(`Không phải dạng từ điển của động/tính từ: ${lemma}`);
  }
  const stem = lemma.slice(0, -1);
  const inf = infinitive(lemma, irr).short;
  const pastStem = past(inf);
  const verbal = kind === 'verb';
  const polite = lemma === '아니다' ? '아니에요' : lemma === '이다' ? '이에요' : inf + '요';

  // Động từ dạng danh từ + 하다 (공부하다) đặt 안 trước 하다: 공부 안 해요.
  // -아/어하다 (좋아하다, 슬퍼하다) là một động từ: 안 좋아해요.
  const before = stem.length >= 2 ? syl(stem.at(-2)!) : null;
  const aeoHada = !!before && !before.f && (['ㅘ', 'ㅝ'].includes(before.v) || (['ㅇ', 'ㅍ', 'ㅃ'].includes(before.c) && ['ㅏ', 'ㅓ', 'ㅕ'].includes(before.v)));
  const negShort = NEGATIVE_OF[lemma] ??
    (verbal && isHada(stem) && stem.length >= 3 && !aeoHada ? `${stem.slice(0, -1)} 안 ${polite.slice(stem.length - 1)}` : `안 ${polite}`);

  const plain = verbal && !isItda(stem) ? withPlainVerb(lemma) : lemma;
  const presentMod = verbal || isItda(stem) ? withConsonant(lemma, '는') : withEuFinal(lemma, irr, 'ㄴ');

  const forms: Record<FormKey, string> = {
    'present.polite': polite,
    'present.formal': formal(lemma),
    'present.informal': lemma === '아니다' ? '아니야' : lemma === '이다' ? '이야' : inf,
    'present.plain': plain,
    'past.polite': pastStem + '어요',
    'past.formal': pastStem + '습니다',
    'past.informal': pastStem + '어',
    'past.plain': pastStem + '다',
    'future.polite': withEuFinal(lemma, irr, 'ㄹ', ' 거예요'),
    'negative.short': negShort,
    'negative.long': stem + '지 않아요',
    honorific: withEu(lemma, irr, '세요'),
    propose: withEuFinal(lemma, irr, 'ㅂ', '시다'),
    want: stem + '고 싶어요',
    progressive: stem + '고 있어요',
    can: withEuFinal(lemma, irr, 'ㄹ', ' 수 있어요'),
    'connective.and': stem + '고',
    'connective.so': lemma === '아니다' ? '아니라서' : lemma === '이다' ? '이라서' : inf + '서',
    'connective.if': withEu(lemma, irr, '면'),
    'connective.because': withEu(lemma, irr, '니까'),
    'connective.but': stem + '지만',
    'modifier.present': presentMod,
    'modifier.past': withEuFinal(lemma, irr, 'ㄴ'),
    'modifier.future': withEuFinal(lemma, irr, 'ㄹ'),
    nominal: stem + '기',
  };
  return Object.fromEntries(FORM_KEYS.filter((k) => (verbal || !VERB_ONLY.has(k)) && forms[k]).map((k) => [k, forms[k]]));
}

/** Hiện tại dạng thường của động từ: 먹는다, 간다, 산다. */
export function withPlainVerb(lemma: string): string {
  const stem = lemma.slice(0, -1);
  const last = syl(stem.at(-1)!);
  if (last.f && last.f !== 'ㄹ') return stem + '는다';
  return replaceLast(stem, setFinal(stem.at(-1)!, 'ㄴ')) + '다';
}

/** Các dạng mà từ điển krdict liệt kê (dùng để kiểm thử và để suy ra nhóm bất quy tắc). */
export function dictionaryForms(lemma: string, kind: Kind, irr: Irregular): string[] {
  const inf = infinitive(lemma, irr);
  const stem = lemma.slice(0, -1);
  return [
    inf.short,
    inf.full,
    withEu(lemma, irr, '니'),
    withConsonant(lemma, '는'),
    withEuFinal(lemma, irr, 'ㄴ'),
    formal(lemma),
    past(inf.short) + '습니다',
    stem + '고',
    stem + '지',
  ];
}

