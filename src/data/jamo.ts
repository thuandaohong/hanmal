// 40 chữ cái Hangul: 19 phụ âm (kể cả 5 phụ âm căng) và 21 nguyên âm.
// Nét viết vẽ tay trong khung 109×109 (cùng hệ toạ độ với KanjiVG), theo thứ tự nét chuẩn:
// trên trước dưới sau, trái trước phải sau; nét ngang viết trái → phải, nét dọc viết trên → dưới.

export type JamoKind = 'consonant' | 'vowel';
export type ConsonantGroup = 'plain' | 'aspirated' | 'tense';
export type VowelGroup = 'basic' | 'compound';
export type Place = 'velar' | 'alveolar' | 'bilabial' | 'palatal' | 'glottal';

export type Jamo = {
  char: string;
  kind: JamoKind;
  /** Tên tiếng Hàn của chữ cái (기역, 니은…) */
  name: string;
  group: ConsonantGroup | VowelGroup;
  /** Phiên âm Latin chuẩn: [đầu âm tiết, cuối âm tiết] (nguyên âm chỉ có một) */
  roman: [string, string?];
  /** Ký hiệu IPA gần đúng */
  ipa: string;
  place?: Place;
  /** Chữ cái dễ nhầm hoặc cùng nhóm */
  related: string[];
  strokes: string[];
};

// ---------- Nét viết ----------
const C: Record<string, string[]> = {
  ㄱ: ['M28,30 L78,30 L72,86'],
  ㄴ: ['M32,24 L32,78 L84,78'],
  ㄷ: ['M30,28 L80,28', 'M30,28 L30,80 L82,80'],
  ㄹ: ['M28,24 L78,24 L78,52', 'M30,52 L78,52', 'M30,52 L30,82 L82,82'],
  ㅁ: ['M30,28 L30,82', 'M30,28 L78,28 L78,82', 'M30,82 L78,82'],
  ㅂ: ['M32,22 L32,84', 'M76,22 L76,84', 'M32,52 L76,52', 'M32,84 L76,84'],
  ㅅ: ['M55,24 Q50,60 22,86', 'M54,50 Q66,72 88,86'],
  ㅇ: ['M54,24 C34,24 24,38 24,55 C24,72 36,86 54,86 C72,86 84,72 84,55 C84,38 74,24 54,24'],
  ㅈ: ['M26,28 L82,28', 'M56,28 Q50,62 22,86', 'M55,54 Q66,72 88,86'],
  ㅊ: ['M54,12 L54,24', 'M26,30 L82,30', 'M56,30 Q50,62 22,88', 'M55,56 Q66,74 88,88'],
  ㅋ: ['M28,28 L78,28 L72,86', 'M30,56 L76,56'],
  ㅌ: ['M30,26 L80,26', 'M30,54 L78,54', 'M30,26 L30,82 L82,82'],
  ㅍ: ['M22,26 L86,26', 'M40,26 L40,80', 'M68,26 L68,80', 'M20,82 L88,82'],
  ㅎ: ['M54,10 L54,22', 'M26,30 L82,30', 'M54,42 C40,42 34,52 34,62 C34,74 42,84 54,84 C66,84 74,74 74,62 C74,52 68,42 54,42'],
};

/** Thu nhỏ ngang và dịch chuyển một path (chỉ gồm toạ độ tuyệt đối "x,y"). */
const squeeze = (d: string, dx: number) =>
  d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(Number(x) * 0.5 + dx).toFixed(1)},${y}`);
/** Phụ âm căng: hai bản thu nhỏ của phụ âm gốc đặt cạnh nhau (ㄲ = ㄱ + ㄱ). */
const doubled = (base: string) => [...C[base].map((d) => squeeze(d, 2)), ...C[base].map((d) => squeeze(d, 52))];

const V: Record<string, string[]> = {
  ㅏ: ['M48,16 L48,92', 'M48,52 L74,52'],
  ㅑ: ['M46,16 L46,92', 'M46,42 L72,42', 'M46,64 L72,64'],
  ㅓ: ['M32,52 L58,52', 'M60,16 L60,92'],
  ㅕ: ['M32,42 L58,42', 'M32,64 L58,64', 'M60,16 L60,92'],
  ㅗ: ['M54,38 L54,62', 'M16,64 L92,64'],
  ㅛ: ['M42,38 L42,62', 'M66,38 L66,62', 'M16,64 L92,64'],
  ㅜ: ['M16,44 L92,44', 'M54,44 L54,74'],
  ㅠ: ['M16,44 L92,44', 'M42,44 L42,74', 'M66,44 L66,74'],
  ㅡ: ['M16,54 L92,54'],
  ㅣ: ['M54,16 L54,92'],
  ㅐ: ['M38,16 L38,92', 'M38,52 L60,52', 'M64,12 L64,96'],
  ㅒ: ['M38,16 L38,92', 'M38,42 L58,42', 'M38,64 L58,64', 'M64,12 L64,96'],
  ㅔ: ['M24,52 L44,52', 'M46,16 L46,92', 'M68,12 L68,96'],
  ㅖ: ['M24,42 L44,42', 'M24,64 L44,64', 'M46,16 L46,92', 'M68,12 L68,96'],
  ㅘ: ['M36,44 L36,64', 'M12,66 L60,66', 'M70,12 L70,96', 'M70,54 L92,54'],
  ㅙ: ['M30,44 L30,64', 'M10,66 L50,66', 'M60,12 L60,96', 'M60,54 L76,54', 'M82,10 L82,98'],
  ㅚ: ['M38,44 L38,64', 'M12,66 L64,66', 'M76,12 L76,96'],
  ㅝ: ['M10,44 L62,44', 'M36,44 L36,72', 'M58,58 L74,58', 'M76,12 L76,96'],
  ㅞ: ['M8,44 L50,44', 'M28,44 L28,72', 'M46,58 L60,58', 'M62,12 L62,96', 'M84,10 L84,98'],
  ㅟ: ['M12,44 L64,44', 'M38,44 L38,74', 'M76,12 L76,96'],
  ㅢ: ['M12,62 L66,62', 'M78,12 L78,96'],
};

// ---------- Thông tin chữ cái ----------
const consonant = (
  char: string, name: string, group: ConsonantGroup, roman: [string, string?], ipa: string, place: Place, related: string[],
  strokes: string[],
): Jamo => ({ char, kind: 'consonant', name, group, roman, ipa, place, related, strokes });

const vowel = (char: string, name: string, group: VowelGroup, roman: string, ipa: string, related: string[]): Jamo => ({
  char, kind: 'vowel', name, group, roman: [roman], ipa, related, strokes: V[char],
});

export const CONSONANTS: Jamo[] = [
  consonant('ㄱ', '기역', 'plain', ['g', 'k'], 'k / g', 'velar', ['ㅋ', 'ㄲ'], C.ㄱ),
  consonant('ㄴ', '니은', 'plain', ['n', 'n'], 'n', 'alveolar', ['ㄷ', 'ㄹ'], C.ㄴ),
  consonant('ㄷ', '디귿', 'plain', ['d', 't'], 't / d', 'alveolar', ['ㅌ', 'ㄸ'], C.ㄷ),
  consonant('ㄹ', '리을', 'plain', ['r', 'l'], 'ɾ / l', 'alveolar', ['ㄴ'], C.ㄹ),
  consonant('ㅁ', '미음', 'plain', ['m', 'm'], 'm', 'bilabial', ['ㅂ', 'ㅇ'], C.ㅁ),
  consonant('ㅂ', '비읍', 'plain', ['b', 'p'], 'p / b', 'bilabial', ['ㅍ', 'ㅃ'], C.ㅂ),
  consonant('ㅅ', '시옷', 'plain', ['s', 't'], 's / ɕ', 'alveolar', ['ㅆ', 'ㅈ'], C.ㅅ),
  consonant('ㅇ', '이응', 'plain', ['', 'ng'], '∅ / ŋ', 'glottal', ['ㅎ', 'ㅁ'], C.ㅇ),
  consonant('ㅈ', '지읒', 'plain', ['j', 't'], 'tɕ / dʑ', 'palatal', ['ㅊ', 'ㅉ'], C.ㅈ),
  consonant('ㅊ', '치읓', 'aspirated', ['ch', 't'], 'tɕʰ', 'palatal', ['ㅈ', 'ㅉ'], C.ㅊ),
  consonant('ㅋ', '키읔', 'aspirated', ['k', 'k'], 'kʰ', 'velar', ['ㄱ', 'ㄲ'], C.ㅋ),
  consonant('ㅌ', '티읕', 'aspirated', ['t', 't'], 'tʰ', 'alveolar', ['ㄷ', 'ㄸ'], C.ㅌ),
  consonant('ㅍ', '피읖', 'aspirated', ['p', 'p'], 'pʰ', 'bilabial', ['ㅂ', 'ㅃ'], C.ㅍ),
  consonant('ㅎ', '히읗', 'aspirated', ['h', 't'], 'h', 'glottal', ['ㅇ'], C.ㅎ),
  consonant('ㄲ', '쌍기역', 'tense', ['kk', 'k'], 'k͈', 'velar', ['ㄱ', 'ㅋ'], doubled('ㄱ')),
  consonant('ㄸ', '쌍디귿', 'tense', ['tt'], 't͈', 'alveolar', ['ㄷ', 'ㅌ'], doubled('ㄷ')),
  consonant('ㅃ', '쌍비읍', 'tense', ['pp'], 'p͈', 'bilabial', ['ㅂ', 'ㅍ'], doubled('ㅂ')),
  consonant('ㅆ', '쌍시옷', 'tense', ['ss', 't'], 's͈', 'alveolar', ['ㅅ'], doubled('ㅅ')),
  consonant('ㅉ', '쌍지읒', 'tense', ['jj'], 't͈ɕ', 'palatal', ['ㅈ', 'ㅊ'], doubled('ㅈ')),
];

export const VOWELS: Jamo[] = [
  vowel('ㅏ', '아', 'basic', 'a', 'a', ['ㅑ', 'ㅓ']),
  vowel('ㅑ', '야', 'basic', 'ya', 'ja', ['ㅏ', 'ㅕ']),
  vowel('ㅓ', '어', 'basic', 'eo', 'ʌ', ['ㅗ', 'ㅕ']),
  vowel('ㅕ', '여', 'basic', 'yeo', 'jʌ', ['ㅓ', 'ㅛ']),
  vowel('ㅗ', '오', 'basic', 'o', 'o', ['ㅓ', 'ㅛ']),
  vowel('ㅛ', '요', 'basic', 'yo', 'jo', ['ㅗ', 'ㅕ']),
  vowel('ㅜ', '우', 'basic', 'u', 'u', ['ㅡ', 'ㅠ']),
  vowel('ㅠ', '유', 'basic', 'yu', 'ju', ['ㅜ']),
  vowel('ㅡ', '으', 'basic', 'eu', 'ɯ', ['ㅜ']),
  vowel('ㅣ', '이', 'basic', 'i', 'i', ['ㅢ']),
  vowel('ㅐ', '애', 'compound', 'ae', 'ɛ', ['ㅔ']),
  vowel('ㅒ', '얘', 'compound', 'yae', 'jɛ', ['ㅖ']),
  vowel('ㅔ', '에', 'compound', 'e', 'e', ['ㅐ']),
  vowel('ㅖ', '예', 'compound', 'ye', 'je', ['ㅒ']),
  vowel('ㅘ', '와', 'compound', 'wa', 'wa', ['ㅝ']),
  vowel('ㅙ', '왜', 'compound', 'wae', 'wɛ', ['ㅚ', 'ㅞ']),
  vowel('ㅚ', '외', 'compound', 'oe', 'we', ['ㅙ', 'ㅞ']),
  vowel('ㅝ', '워', 'compound', 'wo', 'wʌ', ['ㅘ']),
  vowel('ㅞ', '웨', 'compound', 'we', 'we', ['ㅙ', 'ㅚ']),
  vowel('ㅟ', '위', 'compound', 'wi', 'wi', ['ㅢ']),
  vowel('ㅢ', '의', 'compound', 'ui', 'ɰi', ['ㅟ', 'ㅣ']),
];

export const JAMO: Jamo[] = [...CONSONANTS, ...VOWELS];

/** 14 phụ âm cơ bản và 10 nguyên âm cơ bản (bảng ghép vần truyền thống 가갸거겨…) */
export const BASIC_CONSONANTS = CONSONANTS.filter((c) => c.group !== 'tense');
export const BASIC_VOWELS = VOWELS.filter((v) => v.group === 'basic');

/** 7 âm đại diện của phụ âm cuối và các phụ âm cuối đọc giống nó. */
export const BATCHIM: { sound: string; roman: string; finals: string[]; example: string }[] = [
  { sound: 'ㄱ', roman: 'k', finals: ['ㄱ', 'ㅋ', 'ㄲ', 'ㄳ', 'ㄺ'], example: '부엌' },
  { sound: 'ㄴ', roman: 'n', finals: ['ㄴ', 'ㄵ', 'ㄶ'], example: '앉다' },
  { sound: 'ㄷ', roman: 't', finals: ['ㄷ', 'ㅅ', 'ㅆ', 'ㅈ', 'ㅊ', 'ㅌ', 'ㅎ'], example: '꽃' },
  { sound: 'ㄹ', roman: 'l', finals: ['ㄹ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㅀ'], example: '여덟' },
  { sound: 'ㅁ', roman: 'm', finals: ['ㅁ', 'ㄻ'], example: '삶' },
  { sound: 'ㅂ', roman: 'p', finals: ['ㅂ', 'ㅍ', 'ㅄ', 'ㄿ'], example: '앞' },
  { sound: 'ㅇ', roman: 'ng', finals: ['ㅇ'], example: '강' },
];
