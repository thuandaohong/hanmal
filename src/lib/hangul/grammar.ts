// Sinh ví dụ "cách kết hợp" cho một điểm ngữ pháp: gắn mẫu vào vài động từ/danh từ tiêu biểu,
// tự chọn biến thể (-아요/-어요, có hay không 으, lược ㄹ) và xử lý bất quy tắc.
import { decompose } from './compose';
import { attach } from './particles';
import {
  type Kind, conjugate, formal, guessIrregular, infinitive, past, withConsonant, withEu, withEuFinal, withPlainVerb,
} from './conjugate';

export type Example = { base: string; result: string };

/** Động từ tiêu biểu: gốc nguyên âm, phụ âm, ㄹ, bất quy tắc ㄷ, 하다. */
export const SAMPLE_VERBS = ['가다', '먹다', '살다', '듣다', '공부하다'];
const SAMPLE_ADJS = ['예쁘다', '좋다'];
/** Danh từ tiêu biểu: tận cùng nguyên âm, phụ âm, ㄹ. */
export const SAMPLE_NOUNS = ['친구', '학생', '서울'];

const irr = (l: string, k: Kind = 'verb') => guessIrregular(l, k);

/**
 * Tuỳ chỉnh cho những điểm ngữ pháp mà quy tắc chung cho ví dụ chưa tự nhiên:
 * dùng dạng chia đầy đủ, động/tính từ mẫu khác, hoặc giữ nguyên phần sau như tiêu đề.
 */
type Custom = { verbs?: string[]; adjs?: string[]; nouns?: string[]; make?: (lemma: string, kind: Kind) => string; noun?: (noun: string) => string };
const CUSTOM: Record<string, Custom> = {
  'at-eot': { make: (l, k) => conjugate(l, k)['past.polite']! },
  'eul-geoyeyo': { make: (l, k) => conjugate(l, k)['future.polite']! },
  gess: { make: (l) => withConsonant(l, '겠어요') },
  eusi: { make: (l) => withEu(l, irr(l), '시다') },
  'gi-ttaemun': { make: (l) => withConsonant(l, '기 때문에') },
  ieyo: { noun: (n) => attach(n, 'copula') },
  'a-jida': { verbs: [], adjs: ['예쁘다', '좋다', '크다', '춥다'] },
  'a-itda': { verbs: ['앉다', '서다', '가다', '열리다'] },
  'eul-jul-alda': { make: (l, k) => withEuFinal(l, irr(l, k), 'ㄹ', ' 줄 알다') },
  'eulkka-bwa': { make: (l, k) => withEuFinal(l, irr(l, k), 'ㄹ', '까 봐') },
  nyago: { make: (l) => withConsonant(l, '냐고') },
  'na-boda': {
    adjs: SAMPLE_ADJS,
    make: (l, k) => (k === 'verb' ? withConsonant(l, '나 보다') : withEuFinal(l, irr(l, k), 'ㄴ', '가 보다')),
  },
  'euro-inhae': { noun: (n) => attachNominal(n, ['으로 인해', '로 인해']) },
  // Mẫu chỉ hợp với một số loại từ: tính từ, người, nơi chốn, động từ di chuyển…
  'a-boida': { verbs: [], adjs: ['예쁘다', '좋다', '피곤하다', '작다'] },
  'ege-hante': { nouns: ['친구', '학생', '동생'], noun: (n) => n + '에게 / ' + n + '한테' },
  kkeseo: { nouns: ['선생님', '할머니', '부모님'] },
  e: { nouns: ['학교', '집', '서울'] },
  eseo: { nouns: ['학교', '집', '서울'] },
  'neun-gil': { verbs: ['가다', '오다', '돌아오다', '퇴근하다'] },
  'neun-gim': { verbs: ['가다', '나오다', '만들다', '청소하다'], adjs: [] },
  'a-nota': { verbs: ['사다', '만들다', '열다', '준비하다'] },
  'a-gada': { verbs: ['되다', '끝나다', '살다', '준비하다'] },
  dasipi: { verbs: ['알다', '보다', '듣다'] },
};

const hasFinal = (word: string) => !!decompose(word.at(-1)!)?.f;

/** Gắn một mẫu đuôi (dạng bắt đầu bằng "-") vào động/tính từ. */
function attachVerbal(lemma: string, kind: Kind, forms: string[]): string | undefined {
  const irr = guessIrregular(lemma, kind);
  const rest = forms.map((f) => f.slice(1));
  const find = (re: RegExp) => rest.find((r) => re.test(r));

  // Quá khứ: -았/었X → 갔X, 먹었X
  const pastForm = find(/^[았었였]/);
  if (pastForm) {
    const x = pastForm.slice(1);
    return past(infinitive(lemma, irr).short) + (x === '-' ? '어요' : x);
  }
  // -아/어X → 가X, 먹어X, 해X
  const aForm = find(/^[아어여]/);
  if (aForm && rest.some((r) => r.startsWith('어'))) return infinitive(lemma, irr).short + aForm.slice(1);

  // Lời nói gián tiếp, hiện tại dạng thường: -는다고/-ㄴ다고/-다고, -는대요…
  const plain = find(/^는다|^는대/);
  if (plain && kind === 'verb') return withPlainVerb(lemma).slice(0, -1) + plain.slice(1);

  // Bổ nghĩa: -는X (động từ), -(으)ㄴX (tính từ)
  const neun = find(/^는/);
  if (neun && kind === 'verb') return withConsonant(lemma, neun);
  const eun = find(/^은/);
  if (eun) return withEuFinal(lemma, irr, 'ㄴ', eun.slice(1));
  const eul = find(/^을/);
  if (eul) return withEuFinal(lemma, irr, 'ㄹ', eul.slice(1));
  const eup = find(/^읍/);
  if (eup) return withEuFinal(lemma, irr, 'ㅂ', eup.slice(1));
  const seup = find(/^습/);
  if (seup) return formal(lemma).replace(/니다$/, seup.slice(1));
  const eu = find(/^으/);
  if (eu) return withEu(lemma, irr, eu.slice(1));

  // Đuôi bắt đầu bằng phụ âm: -고, -지만, -기, -네요, -느라고…
  const first = rest[0];
  if (/^[ㄱ-ㅎ]/.test(first)) return undefined; // dạng chỉ là chữ cái (-ㄴ, -ㄹ) đã xử lý ở trên
  return withConsonant(lemma, first);
}

/** Gắn tiểu từ/cụm đi sau danh từ, chọn biến thể theo phụ âm cuối: 학생은 / 친구는, 서울로. */
function attachNominal(noun: string, forms: string[]): string {
  const consonant = hasFinal(noun);
  const rieul = decompose(noun.at(-1)!)?.f === 'ㄹ';
  // Biến thể dành cho danh từ có phụ âm cuối thường bắt đầu bằng 은, 이, 을, 과, 으.
  const afterConsonant = forms.find((f) => /^(은|이|을|과|으)/.test(f));
  const afterVowel = forms.find((f) => f !== afterConsonant && afterConsonant && f.length < afterConsonant.length + 1);
  if (afterConsonant && afterVowel) {
    // 으로/로: sau ㄹ dùng 로.
    const pick = consonant && !(rieul && afterConsonant.startsWith('으')) ? afterConsonant : afterVowel;
    return noun + pick;
  }
  return noun + forms[0];
}

/** Ví dụ cách kết hợp của một điểm ngữ pháp. */
export function formExamples(forms: string[], slug = ''): Example[] {
  const custom = CUSTOM[slug] ?? {};
  const nouns = custom.nouns ?? SAMPLE_NOUNS;
  if (custom.noun) return nouns.map((base) => ({ base, result: custom.noun!(base) }));
  const verbal = forms.filter((f) => f.startsWith('-'));
  if (!verbal.length) return nouns.map((base) => ({ base, result: attachNominal(base, forms) }));

  const make = (base: string, kind: Kind) => (custom.make ? custom.make(base, kind) : attachVerbal(base, kind, verbal));
  // Có biến thể cho tính từ (-(으)ㄴ…) khác động từ (-는…) thì thêm ví dụ tính từ.
  const adjs = custom.adjs ?? (verbal.some((f) => f.startsWith('-는')) && verbal.some((f) => /^-[ㄴ은]/.test(f)) ? SAMPLE_ADJS : []);
  const out: Example[] = [];
  for (const base of custom.verbs ?? SAMPLE_VERBS) {
    const result = make(base, 'verb');
    if (result) out.push({ base, result });
  }
  for (const base of adjs) {
    const result = make(base, 'adj');
    if (result) out.push({ base, result });
  }
  return out;
}
