// Cách đọc thực tế theo các quy tắc trong 표준 발음법 (quy tắc phát âm chuẩn).
// Các hiện tượng phụ thuộc từ vựng (căng hoá trong từ ghép, chèn ㄴ…) không suy ra được từ chữ viết;
// với từ có trong từ điển, site dùng cách đọc chuẩn của krdict, bộ máy này là phương án dự phòng.
import { SPLIT_FINAL, type Syllable, compose, decompose } from './compose';

export type Rule =
  | 'linking' // 연음: phụ âm cuối nối sang âm tiết bắt đầu bằng nguyên âm
  | 'palatalization' // 구개음화: ㄷ/ㅌ + 이 → 지/치
  | 'aspiration' // 격음화: ㄱ/ㄷ/ㅂ/ㅈ gặp ㅎ → ㅋ/ㅌ/ㅍ/ㅊ
  | 'hDrop' // ㅎ 탈락: ㅎ cuối trước nguyên âm hoặc ㄴ
  | 'neutralization' // 음절의 끝소리 규칙: phụ âm cuối về 7 âm đại diện
  | 'nasalization' // 비음화: ㄱ/ㄷ/ㅂ trước ㄴ/ㅁ → ㅇ/ㄴ/ㅁ
  | 'rieulNasalization' // ㄹ의 비음화: ㄹ sau ㅁ/ㅇ/ㄱ/ㅂ → ㄴ
  | 'liquidization' // 유음화: ㄴ+ㄹ, ㄹ+ㄴ → ㄹㄹ
  | 'tensification' // 경음화: căng hoá phụ âm đầu
  | 'ui' // ㅢ đọc thành ㅣ sau phụ âm
  | 'yeo'; // 져/쪄/쳐 đọc thành 저/쩌/처

/** Danh từ tận cùng ㄺ (không phải gốc động/tính từ). */
const RG_NOUNS = new Set(['닭', '흙', '칡', '삵']);

export type Change = { rule: Rule; at: number };

export type PronounceOptions = {
  /** Vị trí âm tiết cuối của gốc động/tính từ trong chuỗi (căng hoá sau gốc kết thúc bằng ㄴ/ㅁ). */
  stemEnd?: number;
  /** Từ gốc Hán: căng hoá ㄷ/ㅅ/ㅈ sau ㄹ (갈등 → 갈뜽). */
  sino?: boolean;
  /** Có căng hoá không (phiên âm Latin chuẩn không thể hiện căng hoá). Mặc định: có. */
  tense?: boolean;
  /** Danh từ: ㄱ/ㄷ/ㅂ + ㅎ không bật hơi khi phiên âm Latin (백화점 → baekhwajeom). */
  noun?: boolean;
  /** Có đơn giản hoá nguyên âm không (ㅢ → ㅣ sau phụ âm, 져 → 저). Phiên âm Latin giữ nguyên chữ viết. Mặc định: có. */
  vowels?: boolean;
};

const ASPIRATE: Record<string, string> = { ㄱ: 'ㅋ', ㄷ: 'ㅌ', ㅂ: 'ㅍ', ㅈ: 'ㅊ' };
const TENSE: Record<string, string> = { ㄱ: 'ㄲ', ㄷ: 'ㄸ', ㅂ: 'ㅃ', ㅅ: 'ㅆ', ㅈ: 'ㅉ' };
const NASAL: Record<string, string> = { ㄱ: 'ㅇ', ㄷ: 'ㄴ', ㅂ: 'ㅁ' };

/** Âm đại diện của phụ âm cuối (음절의 끝소리 규칙). */
const NEUTRAL: Record<string, string> = {
  ㄱ: 'ㄱ', ㄲ: 'ㄱ', ㅋ: 'ㄱ', ㄳ: 'ㄱ', ㄺ: 'ㄱ',
  ㄴ: 'ㄴ', ㄵ: 'ㄴ', ㄶ: 'ㄴ',
  ㄷ: 'ㄷ', ㅅ: 'ㄷ', ㅆ: 'ㄷ', ㅈ: 'ㄷ', ㅊ: 'ㄷ', ㅌ: 'ㄷ', ㅎ: 'ㄷ',
  ㄹ: 'ㄹ', ㄼ: 'ㄹ', ㄽ: 'ㄹ', ㄾ: 'ㄹ', ㅀ: 'ㄹ',
  ㅁ: 'ㅁ', ㄻ: 'ㅁ',
  ㅂ: 'ㅂ', ㅍ: 'ㅂ', ㅄ: 'ㅂ', ㄿ: 'ㅂ',
  ㅇ: 'ㅇ',
};

/** Hình vị độc lập bắt đầu bằng nguyên âm: phụ âm cuối phía trước về âm đại diện trước khi nối. */
const INDEPENDENT = new Set(['없', '옷']);

/** Hậu tố gốc Hán mà ㄴ+ㄹ đọc thành ㄴㄴ chứ không phải ㄹㄹ (생산량 → 생산냥). */
const NN_SUFFIX = new Set(['량', '력', '론', '료', '란', '령', '로']);

/**
 * Cách đọc của một chuỗi Hangul. Trả về chuỗi đã biến âm và danh sách luật đã áp dụng.
 * Mỗi cụm chữ Hangul liền nhau (một 어절) được xử lý riêng; ký tự khác giữ nguyên.
 */
export function pronounce(text: string, opts: PronounceOptions = {}): { text: string; changes: Change[] } {
  const changes: Change[] = [];
  let out = '';
  let offset = 0;
  for (const run of text.split(/([^가-힣]+)/)) {
    if (!run) continue;
    if (/^[가-힣]+$/.test(run)) {
      const syl = [...run].map((ch) => decompose(ch)!);
      // stemEnd tính trên toàn chuỗi; -1 = đã biết là không có ranh giới gốc trong cụm này.
      const se = opts.stemEnd === undefined ? undefined : opts.stemEnd >= offset && opts.stemEnd < offset + syl.length ? opts.stemEnd - offset : -1;
      const local = applyRules(syl, opts, se);
      changes.push(...local.map((c) => ({ ...c, at: c.at + offset })));
      out += syl.map(compose).join('');
    } else {
      out += run;
    }
    offset += [...run].length;
  }
  return { text: out, changes };
}

function applyRules(s: Syllable[], opts: PronounceOptions, stemEnd?: number): Change[] {
  const tense = opts.tense !== false;
  const changes: Change[] = [];
  const mark = (rule: Rule, at: number) => changes.push({ rule, at });

  // ㅢ sau phụ âm (không phải ㅇ) đọc là ㅣ: 희망 → 히망.
  if (opts.vowels !== false) {
    s.forEach((x, i) => {
      if (x.v === 'ㅢ' && x.c !== 'ㅇ') {
        x.v = 'ㅣ';
        mark('ui', i);
      }
    });
  }

  for (let i = 0; i < s.length; i++) {
    const cur = s[i];
    const next = s[i + 1];
    if (!cur.f) continue;
    if (!next) {
      // Âm tiết cuối: chỉ còn quy tắc âm đại diện.
      const n = NEUTRAL[cur.f];
      if (n && n !== cur.f) {
        cur.f = n;
        mark('neutralization', i);
      }
      continue;
    }

    const [first, second] = SPLIT_FINAL[cur.f] ?? [cur.f, ''];
    const hasH = cur.f === 'ㅎ' || second === 'ㅎ';

    // 1. Phụ âm cuối có ㅎ (ㅎ, ㄶ, ㅀ).
    if (hasH) {
      const keep = cur.f === 'ㅎ' ? '' : first;
      if (ASPIRATE[next.c] && next.c !== 'ㅂ') {
        // 놓고 → 노코, 많다 → 만타, 싫지 → 실치
        next.c = ASPIRATE[next.c];
        cur.f = keep;
        mark('aspiration', i);
      } else if (next.c === 'ㅅ') {
        // 닿소 → 다쏘, 않소 → 안쏘
        if (tense) next.c = 'ㅆ';
        cur.f = keep;
        mark('tensification', i + 1);
      } else if (next.c === 'ㅇ') {
        // 좋아 → 조아, 않아 → 아나, 싫어 → 시러
        cur.f = keep;
        mark('hDrop', i);
        if (keep) {
          next.c = keep;
          cur.f = '';
          mark('linking', i);
        }
        continue;
      } else if (next.c === 'ㄴ') {
        // 놓는 → 논는, 않네 → 안네, 뚫네 → 뚤레
        cur.f = keep || 'ㄴ';
        if (keep) mark('hDrop', i);
        else mark('nasalization', i);
      }
    }

    // 2. Nối âm khi âm tiết sau bắt đầu bằng nguyên âm.
    if (next.c === 'ㅇ' && cur.f && cur.f !== 'ㅇ') {
      if (INDEPENDENT.has(compose(next))) {
        // Trước hình vị độc lập như 없, 옷: về âm đại diện rồi mới nối (맛없다 → 마덥따, 겉옷 → 거돋).
        next.c = NEUTRAL[cur.f] ?? cur.f;
        cur.f = '';
        mark('neutralization', i);
        mark('linking', i);
        continue;
      }
      if (second) {
        // 닭이 → 달기, 앉아 → 안자, 값이 → 갑씨
        cur.f = first;
        next.c = second === 'ㅅ' && tense ? 'ㅆ' : second;
      } else {
        next.c = cur.f;
        cur.f = '';
      }
      mark('linking', i);
      // 굳이 → 구지, 같이 → 가치, 붙여 (붙이어) → 부처
      if ((next.v === 'ㅣ' || next.v === 'ㅕ') && (next.c === 'ㄷ' || next.c === 'ㅌ')) {
        next.c = next.c === 'ㄷ' ? 'ㅈ' : 'ㅊ';
        mark('palatalization', i + 1);
      }
      continue;
    }

    // 3. Gặp ㅎ ở âm tiết sau: bật hơi (축하 → 추카, 밝히다 → 발키다, 닫히다 → 다치다).
    if (next.c === 'ㅎ' && cur.f) {
      const tail = second || cur.f;
      const base = { ㄱ: 'ㄱ', ㄲ: 'ㄱ', ㅋ: 'ㄱ', ㄷ: 'ㄷ', ㅅ: 'ㄷ', ㅆ: 'ㄷ', ㅌ: 'ㄷ', ㅈ: 'ㅈ', ㅊ: 'ㅈ', ㅂ: 'ㅂ', ㅍ: 'ㅂ' }[tail];
      if (base && opts.noun && !second && ['ㄱ', 'ㄷ', 'ㅂ'].includes(base) && cur.f === base) {
        // Phiên âm danh từ: giữ phụ âm cuối và ㅎ (묵호 → Mukho, 백화점 → baekhwajeom).
        continue;
      }
      if (base) {
        next.c = ASPIRATE[base];
        cur.f = second ? first : '';
        mark('aspiration', i);
        if ((next.v === 'ㅣ' || next.v === 'ㅕ') && next.c === 'ㅌ') {
          next.c = 'ㅊ';
          mark('palatalization', i + 1);
        }
        continue;
      }
    }

    // 4. Âm đại diện. Ngoại lệ: ㄺ trước ㄱ đọc ㄹ (맑게 → 말께), 밟- đọc ㅂ (밟다 → 밥따).
    const before = cur.f;
    let n = NEUTRAL[cur.f] ?? cur.f;
    // ㄺ + ㄱ → ㄹ chỉ ở gốc động/tính từ (맑게 → 말께); danh từ giữ ㄱ (닭고기 → 닥꼬기).
    if (cur.f === 'ㄺ' && next.c === 'ㄱ' && (stemEnd === i || (stemEnd === undefined && !RG_NOUNS.has(compose(cur))))) n = 'ㄹ';
    if (cur.f === 'ㄼ' && cur.c === 'ㅂ' && cur.v === 'ㅏ') n = 'ㅂ';
    if (n !== before) {
      cur.f = n;
      mark('neutralization', i);
    }

    // 5. Căng hoá.
    if (tense && TENSE[next.c]) {
      // Không biết vị trí gốc: ㄵ/ㄻ/ㄼ/ㄾ trước phụ âm gần như chỉ gặp ở gốc động/tính từ (앉다 → 안따, 젊다 → 점따).
      const stemBoundary = stemEnd === i || (stemEnd === undefined && ['ㄵ', 'ㄻ', 'ㄼ', 'ㄾ'].includes(before));
      if (
        ['ㄱ', 'ㄷ', 'ㅂ'].includes(cur.f) ||
        // ㄺ đọc ㄹ trước ㄱ nhưng vẫn làm căng (맑게 → 말께)
        before === 'ㄺ' ||
        // Gốc động/tính từ tận cùng ㄴ, ㅁ (kể cả ㄵ, ㄻ) hoặc ㄼ, ㄾ: 신고 → 신꼬, 앉고 → 안꼬, 넓게 → 널께
        (stemBoundary && next.c !== 'ㅂ' && (['ㄴ', 'ㅁ'].includes(cur.f) || ['ㄼ', 'ㄾ'].includes(before))) ||
        // Từ gốc Hán: ㄹ + ㄷ/ㅅ/ㅈ (갈등 → 갈뜽, 발전 → 발쩐), trừ đuôi 다 của động từ (병들다)
        (opts.sino && !stemBoundary && cur.f === 'ㄹ' && ['ㄷ', 'ㅅ', 'ㅈ'].includes(next.c))
      ) {
        next.c = TENSE[next.c];
        mark('tensification', i + 1);
      }
    }

    // 6. ㄹ sau phụ âm khác ㄴ/ㄹ đọc thành ㄴ (심리 → 심니, 국립 → 궁닙).
    if (next.c === 'ㄹ' && ['ㅁ', 'ㅇ', 'ㄱ', 'ㅂ', 'ㄷ'].includes(cur.f)) {
      next.c = 'ㄴ';
      mark('rieulNasalization', i + 1);
    }

    // 7. Mũi hoá (국물 → 궁물, 입니다 → 임니다).
    if (NASAL[cur.f] && (next.c === 'ㄴ' || next.c === 'ㅁ')) {
      cur.f = NASAL[cur.f];
      mark('nasalization', i);
    }

    // 8. ㄹ hoá (신라 → 실라, 설날 → 설랄). Hậu tố gốc Hán như -량, -력 đọc ㄴㄴ (생산량 → 생산냥).
    if (cur.f === 'ㄴ' && next.c === 'ㄹ') {
      if (i >= 1 && NN_SUFFIX.has(compose(next))) {
        next.c = 'ㄴ';
        mark('rieulNasalization', i + 1);
      } else {
        cur.f = 'ㄹ';
        mark('liquidization', i);
      }
    } else if (cur.f === 'ㄹ' && next.c === 'ㄴ') {
      next.c = 'ㄹ';
      mark('liquidization', i + 1);
    }
  }

  // 져/쪄/쳐 đọc là 저/쩌/처 (가져가다 → 가저가다).
  if (opts.vowels !== false) {
    s.forEach((x, i) => {
      if (x.v === 'ㅕ' && ['ㅈ', 'ㅉ', 'ㅊ'].includes(x.c)) {
        x.v = 'ㅓ';
        mark('yeo', i);
      }
    });
  }
  return changes;
}

/** Chỉ lấy chuỗi đã biến âm. */
export const pronounceText = (text: string, opts?: PronounceOptions) => pronounce(text, opts).text;
