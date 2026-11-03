// Phiên âm tên riêng sang Hangul theo 외래어 표기법 (Viện Quốc ngữ Quốc gia Hàn Quốc)
// và cách báo chí Hàn thường viết. Hỗ trợ: tiếng Việt, Nhật, Anh, Indonesia.
import { compose } from './compose';

export type NameSource = 'vi' | 'ja' | 'en' | 'id';
export type NamePart = { input: string; hangul: string };

type Syl = { c: string; v: string; f: string; short?: boolean };

/** Bán nguyên âm y/w ghép với nguyên âm: y+ㅏ → ㅑ, w+ㅏ → ㅘ. */
const Y_GLIDE: Record<string, string> = { ㅏ: 'ㅑ', ㅐ: 'ㅒ', ㅓ: 'ㅕ', ㅔ: 'ㅖ', ㅗ: 'ㅛ', ㅜ: 'ㅠ', ㅣ: 'ㅣ', ㅡ: 'ㅣ' };
const W_GLIDE: Record<string, string> = { ㅏ: 'ㅘ', ㅐ: 'ㅙ', ㅓ: 'ㅝ', ㅔ: 'ㅞ', ㅣ: 'ㅟ', ㅗ: 'ㅝ', ㅜ: 'ㅜ', ㅡ: 'ㅜ' };

const render = (syls: Syl[]): string => {
  try {
    return syls.map((s) => compose({ c: s.c, v: s.v, f: s.f })).join('');
  } catch {
    return '';
  }
};

/* ------------------------------------------------------------------ */
/* Tiếng Việt — 베트남어 표기법                                          */
/* ------------------------------------------------------------------ */

const VI_TONES = /[̣̀́̃̉]/g;
const VI_VOWEL = /[aăâeêioôơuưy]/;
const VI_V: Record<string, string> = {
  a: 'ㅏ', ă: 'ㅏ', â: 'ㅓ', e: 'ㅐ', ê: 'ㅔ', i: 'ㅣ', y: 'ㅣ', o: 'ㅗ', ô: 'ㅗ', ơ: 'ㅓ', u: 'ㅜ', ư: 'ㅡ',
};
/** Nhóm nguyên âm có cách viết riêng (ia → 이어, ưa → 으어, uyê → 우예…). */
const VI_RUN: Record<string, string[]> = {
  ia: ['ㅣ', 'ㅓ'], ya: ['ㅣ', 'ㅓ'], ua: ['ㅜ', 'ㅓ'], ưa: ['ㅡ', 'ㅓ'], uyê: ['ㅜ', 'ㅖ'], uya: ['ㅜ', 'ㅣ', 'ㅓ'],
};
const VI_INITIALS = [
  'ngh', 'ng', 'nh', 'ch', 'gh', 'gi', 'kh', 'ph', 'qu', 'th', 'tr',
  'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'x', 'f', 'j', 'w', 'z',
];
const VI_C: Record<string, string> = {
  b: 'ㅂ', c: 'ㄲ', ch: 'ㅉ', d: 'ㅈ', đ: 'ㄷ', g: 'ㄱ', gh: 'ㄱ', gi: 'ㅈ', h: 'ㅎ', k: 'ㄲ', kh: 'ㅋ', l: 'ㄹ',
  m: 'ㅁ', n: 'ㄴ', ng: 'ㅇ', ngh: 'ㅇ', nh: 'ㄴ', p: 'ㅃ', ph: 'ㅍ', qu: 'ㄲ', r: 'ㄹ', s: 'ㅅ', t: 'ㄸ',
  th: 'ㅌ', tr: 'ㅉ', v: 'ㅂ', x: 'ㅆ', f: 'ㅍ', j: 'ㅈ', w: 'ㅂ', z: 'ㅈ', '': 'ㅇ',
};
const VI_FINALS = ['ng', 'nh', 'ch', 'c', 'm', 'n', 'p', 't'];
const VI_F: Record<string, string> = { ng: 'ㅇ', nh: 'ㄴ', ch: 'ㄱ', c: 'ㄱ', m: 'ㅁ', n: 'ㄴ', p: 'ㅂ', t: 'ㅅ' };

/** Viết không dấu ("Nguyen", "Tuan", "Duong") → đoán nguyên âm có dấu phổ biến nhất trong tên. */
function viGuessRun(run: string, init: string, fin: string): string {
  let r = run.replace('uye', 'uyê').replace(/^ye/, 'yê').replace('ie', 'iê').replace('uo', 'ươ');
  if (r === 'ua' && init !== 'qu' && (fin === 'n' || fin === 't')) r = 'uâ';
  return r;
}

function viWord(raw: string): string {
  const w = raw.toLowerCase().normalize('NFD').replace(VI_TONES, '').normalize('NFC').replace(/[^a-zăâđêôơư]/g, '');
  const ascii = !/[ăâđêôơư]/.test(w);
  const out: Syl[] = [];
  let i = 0;
  while (i < w.length) {
    // phụ âm đầu
    let init = VI_INITIALS.find((p) => w.startsWith(p, i)) ?? '';
    let j = i + init.length;
    if ((init === 'gi' || init === 'qu') && !VI_VOWEL.test(w[j] ?? '')) j--; // "gìn": i là nguyên âm
    // nguyên âm
    let k = j;
    while (k < w.length && VI_VOWEL.test(w[k])) k++;
    let run = w.slice(j, k);
    if (!run) {
      i = Math.max(k, i + 1); // phụ âm lẻ không có nguyên âm: bỏ qua
      continue;
    }
    // phụ âm cuối (không lấy nếu ngay sau là nguyên âm — đó là âm tiết kế tiếp)
    let fin = '';
    for (const f of VI_FINALS) {
      if (w.startsWith(f, k) && !VI_VOWEL.test(w[k + f.length] ?? '')) {
        fin = f;
        break;
      }
    }
    i = k + fin.length;
    if (ascii) run = viGuessRun(run, init, fin);

    let vs: string[] = VI_RUN[run] ? [...VI_RUN[run]] : [...run].map((ch) => VI_V[ch]);
    if (!init && run.startsWith('yê')) vs = ['ㅖ', ...vs.slice(2)]; // Yến → 옌
    if (init === 'ngh') init = 'ng';
    if (init === 'ng') out.push({ c: 'ㅇ', v: 'ㅡ', f: 'ㅇ' }); // Nguyễn → 응우옌
    if (init === 'nh') vs[0] === 'ㅡ' ? vs.unshift('ㅣ') : (vs[0] = Y_GLIDE[vs[0]] ?? vs[0]);
    if (init === 'qu') vs[0] = W_GLIDE[vs[0]] ?? vs[0];

    const f = fin ? VI_F[fin] : '';
    const last = vs[vs.length - 1];
    // nh/ch sau a, e, ê → 아인/아익 (Anh 아인, Bạch 바익)
    if ((fin === 'nh' || fin === 'ch') && ['ㅏ', 'ㅐ', 'ㅔ'].includes(last)) vs.push('ㅣ');
    const c0 = init === 'ng' ? 'ㅇ' : VI_C[init];
    vs.forEach((v, n) => out.push({ c: n === 0 ? c0 : 'ㅇ', v, f: n === vs.length - 1 ? f : '' }));
  }
  return render(out);
}

/* ------------------------------------------------------------------ */
/* Tiếng Nhật — 일본어 표기법                                            */
/* ------------------------------------------------------------------ */

type Vow = 'a' | 'i' | 'u' | 'e' | 'o';
type Mora = { c: string; v: Vow; y?: boolean } | { n: true } | { q: true };

const KANA: Record<string, [string, Vow]> = {};
const row = (kana: string, cons: string[] | string, vowels = 'aiueo') =>
  [...kana].forEach((k, i) => (KANA[k] = [Array.isArray(cons) ? cons[i] : cons, vowels[i] as Vow]));
row('あいうえお', '');
row('かきくけこ', 'k');
row('がぎぐげご', 'g');
row('さしすせそ', ['s', 'sh', 's', 's', 's']);
row('ざじずぜぞ', ['z', 'j', 'z', 'z', 'z']);
row('たちつてと', ['t', 'ch', 'ts', 't', 't']);
row('だぢづでど', ['d', 'j', 'z', 'd', 'd']);
row('なにぬねの', 'n');
row('はひふへほ', ['h', 'h', 'f', 'h', 'h']);
row('ばびぶべぼ', 'b');
row('ぱぴぷぺぽ', 'p');
row('まみむめも', 'm');
row('やゆよ', 'y', 'auo');
row('らりるれろ', 'r');
row('わをゐゑ', ['w', '', '', ''], 'aoie');
row('ゔ', 'v', 'u');
const SMALL_Y: Record<string, Vow> = { ゃ: 'a', ゅ: 'u', ょ: 'o' };
const SMALL_V: Record<string, Vow> = { ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o', ゎ: 'a' };

function kanaMoras(text: string): Mora[] {
  const out: Mora[] = [];
  for (const ch0 of text) {
    const code = ch0.charCodeAt(0);
    const ch = code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : ch0; // katakana → hiragana
    const prev = out[out.length - 1];
    if (ch === 'ん') out.push({ n: true });
    else if (ch === 'っ') out.push({ q: true });
    else if (KANA[ch]) {
      const [c, v] = KANA[ch];
      out.push(c === 'y' ? { c: '', v, y: true } : { c, v });
    } else if (SMALL_Y[ch] && prev && 'v' in prev) {
      prev.v = SMALL_Y[ch];
      if (!['sh', 'j', 'ch'].includes(prev.c)) prev.y = true;
    } else if (SMALL_V[ch] && prev && 'v' in prev) {
      if (prev.c === '' && prev.v === 'u') prev.c = 'w'; // ウィ → 위
      prev.v = SMALL_V[ch];
      if (ch === 'ゎ') prev.c = 'w';
    }
    // ー, ・ và ký tự khác: bỏ (trường âm không ghi)
  }
  return out;
}

const ROMAJI: Record<string, Mora> = {};
{
  const add = (key: string, c: string, v: Vow, y = false) => (ROMAJI[key] = y ? { c, v, y } : { c, v });
  for (const v of 'aiueo' as unknown as Vow[]) {
    add(v, '', v);
    for (const c of ['k', 'g', 's', 'z', 't', 'd', 'n', 'h', 'b', 'p', 'm', 'r', 'v']) add(c + v, c, v);
    add('l' + v, 'r', v);
    add('f' + v, 'f', v);
    add('w' + v, v === 'o' ? '' : 'w', v);
    add('sh' + v, 'sh', v);
    add('ch' + v, 'ch', v);
    add('j' + v, 'j', v);
  }
  Object.assign(ROMAJI, {
    si: { c: 'sh', v: 'i' }, zi: { c: 'j', v: 'i' }, ti: { c: 'ch', v: 'i' }, di: { c: 'j', v: 'i' },
    tu: { c: 'ts', v: 'u' }, tsu: { c: 'ts', v: 'u' }, du: { c: 'z', v: 'u' }, hu: { c: 'f', v: 'u' },
    ya: { c: '', v: 'a', y: true }, yu: { c: '', v: 'u', y: true }, yo: { c: '', v: 'o', y: true }, ye: { c: '', v: 'e', y: true },
  });
  for (const v of ['a', 'u', 'o'] as Vow[]) {
    for (const c of ['k', 'g', 'n', 'h', 'b', 'p', 'm', 'r']) add(c + 'y' + v, c, v, true);
    add('sy' + v, 'sh', v);
    add('zy' + v, 'j', v);
    add('jy' + v, 'j', v);
    add('ty' + v, 'ch', v);
    add('cy' + v, 'ch', v);
  }
}

function romajiMoras(text: string): Mora[] {
  const s = text.toLowerCase().normalize('NFD').replace(/[̄̂]/g, '').normalize('NFC').replace(/[^a-z']/g, '');
  const out: Mora[] = [];
  const vowel = (ch: string | undefined) => !!ch && 'aiueo'.includes(ch);
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    const nx = s[i + 1];
    const prev = out[out.length - 1];
    if (ch === "'") {
      i++;
      continue;
    }
    if (ch === 'n' && !vowel(nx) && nx !== 'y') {
      out.push({ n: true });
      i += nx === "'" ? 2 : 1;
      continue;
    }
    if (ch === 'm' && nx && 'bmp'.includes(nx)) {
      out.push({ n: true }); // Shimbashi
      i++;
      continue;
    }
    if (ch === 'h' && prev && 'v' in prev && prev.v === 'o' && !vowel(nx) && nx !== 'y') {
      i++; // Satoh: trường âm
      continue;
    }
    if (!vowel(ch) && (nx === ch || (ch === 't' && nx === 'c'))) {
      out.push({ q: true }); // kk, tt, tch → っ
      i++;
      continue;
    }
    const key = [3, 2, 1].map((n) => s.slice(i, i + n)).find((k) => ROMAJI[k]);
    if (key) {
      out.push({ ...ROMAJI[key] });
      i += key.length;
    } else i++;
  }
  return out;
}

/** Trường âm không ghi: おう/oo/uu/ii/aa/ee → một nguyên âm (giữ えい, giữ う trước nguyên âm như いのうえ). */
function dropLong(ms: Mora[]): Mora[] {
  const out: Mora[] = [];
  ms.forEach((m, i) => {
    const prev = out[out.length - 1];
    const next = ms[i + 1];
    const bare = (x: Mora | undefined) => !!x && 'v' in x && x.c === '' && !x.y;
    if (bare(m) && prev && 'v' in prev && !bare(next) && 'v' in m) {
      if (m.v === prev.v || (prev.v === 'o' && m.v === 'u')) return;
    }
    out.push(m);
  });
  return out;
}

const JA_C: Record<string, [string, string]> = {
  k: ['ㄱ', 'ㅋ'], t: ['ㄷ', 'ㅌ'], ch: ['ㅈ', 'ㅊ'], g: ['ㄱ', 'ㄱ'], s: ['ㅅ', 'ㅅ'], sh: ['ㅅ', 'ㅅ'], z: ['ㅈ', 'ㅈ'],
  j: ['ㅈ', 'ㅈ'], ts: ['ㅆ', 'ㅆ'], d: ['ㄷ', 'ㄷ'], n: ['ㄴ', 'ㄴ'], h: ['ㅎ', 'ㅎ'], b: ['ㅂ', 'ㅂ'], p: ['ㅍ', 'ㅍ'],
  m: ['ㅁ', 'ㅁ'], r: ['ㄹ', 'ㄹ'], v: ['ㅂ', 'ㅂ'], '': ['ㅇ', 'ㅇ'], w: ['ㅇ', 'ㅇ'], f: ['ㅍ', 'ㅍ'],
};
const JA_V: Record<Vow, string> = { a: 'ㅏ', i: 'ㅣ', u: 'ㅜ', e: 'ㅔ', o: 'ㅗ' };

function jaFromMoras(ms: Mora[]): string {
  const out: Syl[] = [];
  for (const m of dropLong(ms)) {
    const last = out[out.length - 1];
    if ('n' in m) {
      if (last && !last.f) last.f = 'ㄴ';
      continue;
    }
    if ('q' in m) {
      if (last && !last.f) last.f = 'ㅅ';
      continue;
    }
    let v = JA_V[m.v];
    if (m.v === 'u' && ['s', 'z', 'ts'].includes(m.c)) v = 'ㅡ'; // す 스, ず 즈, つ 쓰
    if (m.y || m.c === 'sh') v = Y_GLIDE[v];
    if (m.c === 'w') v = W_GLIDE[v];
    let c = JA_C[m.c][out.length === 0 ? 0 : 1];
    if (m.c === 'f' && m.v === 'u') c = 'ㅎ'; // ふ 후
    out.push({ c, v, f: '' });
  }
  return render(out);
}

/** Họ phổ biến viết bằng kanji (đọc cố định). Kanji khác không đoán được → ''. */
const JA_KANJI: Record<string, string> = {
  佐藤: 'さとう', 鈴木: 'すずき', 高橋: 'たかはし', 田中: 'たなか', 伊藤: 'いとう', 渡辺: 'わたなべ', 渡邊: 'わたなべ',
  山本: 'やまもと', 中村: 'なかむら', 小林: 'こばやし', 加藤: 'かとう', 吉田: 'よしだ', 山田: 'やまだ', 佐々木: 'ささき',
  山口: 'やまぐち', 松本: 'まつもと', 井上: 'いのうえ', 木村: 'きむら', 林: 'はやし', 斎藤: 'さいとう', 清水: 'しみず',
  山崎: 'やまざき', 森: 'もり', 池田: 'いけだ', 橋本: 'はしもと', 阿部: 'あべ', 石川: 'いしかわ', 山下: 'やました',
  中島: 'なかじま', 石井: 'いしい', 小川: 'おがわ', 前田: 'まえだ', 岡田: 'おかだ', 長谷川: 'はせがわ', 藤田: 'ふじた',
  後藤: 'ごとう', 近藤: 'こんどう', 村上: 'むらかみ', 遠藤: 'えんどう', 青木: 'あおき', 坂本: 'さかもと', 福田: 'ふくだ',
};
const HAS_KANJI = /[㐀-䶿一-鿿々]/;
const HAS_KANA = /[ぁ-ゖァ-ヺ]/;

function jaWord(w: string): string {
  if (HAS_KANJI.test(w)) return JA_KANJI[w] ? jaFromMoras(kanaMoras(JA_KANJI[w])) : '';
  return jaFromMoras(HAS_KANA.test(w) ? kanaMoras(w) : romajiMoras(w));
}

/* ------------------------------------------------------------------ */
/* Bộ ghép âm tiết cho chữ Latin (tiếng Anh dự phòng, Indonesia)         */
/* ------------------------------------------------------------------ */

type LTok = { t: 'C'; k: string } | { t: 'V'; v: string[]; short?: boolean };
const L_C: Record<string, string> = {
  p: 'ㅍ', b: 'ㅂ', t: 'ㅌ', d: 'ㄷ', k: 'ㅋ', g: 'ㄱ', f: 'ㅍ', v: 'ㅂ', s: 'ㅅ', z: 'ㅈ', th: 'ㅅ', sh: 'ㅅ',
  ch: 'ㅊ', j: 'ㅈ', m: 'ㅁ', n: 'ㄴ', ng: 'ㅇ', l: 'ㄹ', r: 'ㄹ', h: 'ㅎ',
};
const SONORANT = new Set(['m', 'n', 'ng', 'l', 'r', 'y', 'w']);
/** Phụ âm cuối: trả về 받침, null = thêm ㅡ (스, 드…), 'drop' = bỏ. */
type Coda = (k: string, short: boolean) => string | null | 'drop';

function assembleLatin(toks: LTok[], coda: Coda): string {
  const out: Syl[] = [];
  const pushV = (c: string, vs: string[], short = false) =>
    vs.forEach((v, n) => out.push({ c: n === 0 ? c : 'ㅇ', v, f: '', short: short && vs.length === 1 }));
  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    if (tok.t === 'V') {
      pushV('ㅇ', tok.v, tok.short);
      continue;
    }
    const k = tok.k;
    const next = toks[i + 1];
    const next2 = toks[i + 2];
    const last = out[out.length - 1];
    if (k === 'y' || k === 'w') {
      const G = k === 'y' ? Y_GLIDE : W_GLIDE;
      if (next?.t === 'V') {
        pushV('ㅇ', [G[next.v[0]] ?? next.v[0], ...next.v.slice(1)]);
        i++;
      } else pushV('ㅇ', [k === 'y' ? 'ㅣ' : 'ㅜ']);
      continue;
    }
    if (next?.t === 'V') {
      if (k === 'l' && toks[i - 1]?.t === 'V' && last && !last.f) last.f = 'ㄹ'; // l giữa nguyên âm → ㄹㄹ
      if (k === 'ng') {
        if (last && !last.f) last.f = 'ㅇ';
        pushV('ㅇ', next.v, next.short);
      } else {
        const v0 = k === 'sh' ? Y_GLIDE[next.v[0]] ?? next.v[0] : next.v[0];
        pushV(L_C[k], [v0, ...next.v.slice(1)], next.short);
      }
      i++;
      continue;
    }
    if (next?.t === 'C' && next2?.t === 'V' && L_C[k] && k !== 'ng') {
      // phụ âm + y/w + nguyên âm: Wahyu 휴, Dwight 드와이트, Gwen 궨
      if (next.k === 'y' || (next.k === 'w' && ['k', 'g', 'h'].includes(k))) {
        const G = next.k === 'y' ? Y_GLIDE : W_GLIDE;
        pushV(L_C[k], [G[next2.v[0]] ?? next2.v[0], ...next2.v.slice(1)]);
        i += 2;
        continue;
      }
      // cụm phụ âm + l/r: Clint 클린트, Putri 푸트리
      if ((next.k === 'l' || next.k === 'r') && !SONORANT.has(k) && k !== 'h') {
        out.push({ c: L_C[k], v: 'ㅡ', f: next.k === 'l' ? 'ㄹ' : '' });
        continue;
      }
    }
    if (!L_C[k]) continue;
    const f = coda(k, !!last?.short);
    if (f === 'drop') continue;
    if (f && last && !last.f) {
      last.f = f;
      continue;
    }
    if (k === 'ng') continue;
    out.push({ c: L_C[k], v: ['sh', 'ch', 'j'].includes(k) ? 'ㅣ' : 'ㅡ', f: '' });
  }
  return render(out);
}

/* ------------------------------------------------------------------ */
/* Tiếng Indonesia — 말레이인도네시아어 표기법                            */
/* ------------------------------------------------------------------ */

const ID_V: Record<string, string> = { a: 'ㅏ', e: 'ㅔ', i: 'ㅣ', o: 'ㅗ', u: 'ㅜ' };
const ID_CODA: Coda = (k) =>
  (({ k: 'ㄱ', p: 'ㅂ', t: 'ㅅ', m: 'ㅁ', n: 'ㄴ', ng: 'ㅇ', l: 'ㄹ', h: 'drop' }) as Record<string, string>)[k] ?? null;

function idWord(raw: string): string {
  const s = raw.toLowerCase().replace(/[^a-z]/g, '').replace(/oe/g, 'u').replace(/dj/g, 'j').replace(/tj/g, 'c');
  const toks: LTok[] = [];
  const C = (k: string) => {
    const p = toks[toks.length - 1];
    if (!(p?.t === 'C' && p.k === k)) toks.push({ t: 'C', k });
  };
  const isV = (ch?: string) => !!ch && 'aeiou'.includes(ch);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const two = s.slice(i, i + 2);
    if (isV(ch)) toks.push({ t: 'V', v: [ID_V[ch]] });
    else if (two === 'ng') (C('ng'), i++);
    else if (two === 'ny') (C('n'), C('y'), i++);
    else if (two === 'sy') (C('sh'), i++);
    else if (two === 'kh') (C('k'), i++);
    else if (ch === 'y' || ch === 'w') isV(s[i + 1]) ? C(ch) : toks.push({ t: 'V', v: [ch === 'y' ? 'ㅣ' : 'ㅜ'] });
    else C(({ c: 'ch', q: 'k', x: 's' } as Record<string, string>)[ch] ?? ch);
  }
  return assembleLatin(toks, ID_CODA);
}

/* ------------------------------------------------------------------ */
/* Tiếng Anh — từ điển tên quen dùng + quy tắc dự phòng                 */
/* ------------------------------------------------------------------ */

const EN_DICT: Record<string, string> = {
  // tên nam
  john: '존', michael: '마이클', david: '데이비드', james: '제임스', robert: '로버트', william: '윌리엄',
  richard: '리처드', joseph: '조지프', thomas: '토머스', charles: '찰스', christopher: '크리스토퍼', daniel: '대니얼',
  matthew: '매슈', anthony: '앤서니', mark: '마크', donald: '도널드', steven: '스티븐', stephen: '스티븐', paul: '폴',
  andrew: '앤드루', joshua: '조슈아', kenneth: '케네스', kevin: '케빈', brian: '브라이언', george: '조지',
  timothy: '티머시', ronald: '로널드', edward: '에드워드', jason: '제이슨', jeffrey: '제프리', ryan: '라이언',
  jacob: '제이컵', gary: '개리', nicholas: '니컬러스', eric: '에릭', jonathan: '조너선', larry: '래리',
  justin: '저스틴', scott: '스콧', brandon: '브랜던', benjamin: '벤저민', samuel: '새뮤얼', frank: '프랭크',
  gregory: '그레고리', alexander: '알렉산더', patrick: '패트릭', jack: '잭', dennis: '데니스', jerry: '제리',
  tyler: '타일러', aaron: '에런', henry: '헨리', adam: '애덤', peter: '피터', nathan: '네이선', zachary: '재커리',
  kyle: '카일', noah: '노아', ethan: '이선', jeremy: '제러미', christian: '크리스천', sean: '숀', austin: '오스틴',
  harry: '해리', oliver: '올리버', lucas: '루커스', mason: '메이슨', liam: '리엄', logan: '로건', luke: '루크',
  jake: '제이크', tom: '톰', tony: '토니', mike: '마이크', bob: '밥', bill: '빌', jim: '짐', joe: '조', sam: '샘',
  ben: '벤', max: '맥스', leo: '레오', alex: '알렉스', chris: '크리스', dan: '댄', steve: '스티브', tim: '팀',
  nick: '닉', matt: '맷', ted: '테드', fred: '프레드', arthur: '아서', albert: '앨버트', martin: '마틴',
  simon: '사이먼', philip: '필립', louis: '루이스', ian: '이언', neil: '닐', carl: '칼', victor: '빅터',
  vincent: '빈센트', harrison: '해리슨', isaac: '아이작', elijah: '일라이자', gabriel: '게이브리얼', owen: '오언',
  jordan: '조던', dylan: '딜런', evan: '에번', hugh: '휴', keith: '키스', roger: '로저', walter: '월터',
  raymond: '레이먼드', bruce: '브루스', wayne: '웨인', ralph: '랠프', roy: '로이', eugene: '유진', russell: '러셀',
  bobby: '보비', johnny: '조니', billy: '빌리', tommy: '토미', jimmy: '지미', danny: '대니', leonard: '레너드',
  elvis: '엘비스', jamie: '제이미', charlie: '찰리', freddie: '프레디', archie: '아치', jesse: '제시',
  // tên nữ
  mary: '메리', patricia: '퍼트리샤', jennifer: '제니퍼', linda: '린다', elizabeth: '엘리자베스', barbara: '바버라',
  susan: '수전', jessica: '제시카', sarah: '세라', karen: '캐런', nancy: '낸시', lisa: '리사', betty: '베티',
  margaret: '마거릿', sandra: '샌드라', ashley: '애슐리', kimberly: '킴벌리', emily: '에밀리', donna: '도나',
  michelle: '미셸', dorothy: '도러시', carol: '캐럴', amanda: '어맨다', melissa: '멀리사', deborah: '데버라',
  stephanie: '스테퍼니', rebecca: '리베카', laura: '로라', sharon: '섀런', cynthia: '신시아', kathleen: '캐슬린',
  amy: '에이미', angela: '앤절라', anna: '애나', emma: '에마', olivia: '올리비아', sophia: '소피아', sophie: '소피',
  isabella: '이저벨라', ava: '에이바', mia: '미아', charlotte: '샬럿', amelia: '어밀리아', harper: '하퍼',
  evelyn: '에벌린', abigail: '애비게일', ella: '엘라', grace: '그레이스', chloe: '클로이', lily: '릴리',
  hannah: '해나', zoe: '조이', natalie: '내털리', victoria: '빅토리아', alice: '앨리스', julia: '줄리아',
  rachel: '레이철', rose: '로즈', kate: '케이트', katie: '케이티', jane: '제인', jenny: '제니', julie: '줄리',
  helen: '헬렌', lucy: '루시', anne: '앤', ann: '앤', diana: '다이애나', madison: '매디슨', samantha: '서맨사',
  megan: '메건', lauren: '로런', nicole: '니콜', christina: '크리스티나', catherine: '캐서린', katherine: '캐서린',
  ruth: '루스', joan: '조앤', judy: '주디', martha: '마사', heather: '헤더', amber: '앰버', brittany: '브리트니',
  tiffany: '티파니', monica: '모니카', erica: '에리카', elsa: '엘사', ellie: '엘리', ivy: '아이비', bella: '벨라',
  stella: '스텔라', ruby: '루비', daisy: '데이지', scarlett: '스칼릿', audrey: '오드리', claire: '클레어',
  eva: '에바', nora: '노라', hazel: '헤이즐', violet: '바이올렛', penelope: '퍼넬러피', layla: '레일라',
  aria: '아리아', luna: '루나', jasmine: '재스민', paige: '페이지', molly: '몰리', holly: '홀리', emilia: '에밀리아',
  // họ
  smith: '스미스', johnson: '존슨', williams: '윌리엄스', brown: '브라운', jones: '존스', garcia: '가르시아',
  miller: '밀러', davis: '데이비스', rodriguez: '로드리게스', martinez: '마르티네스', hernandez: '에르난데스',
  lopez: '로페스', gonzalez: '곤살레스', wilson: '윌슨', anderson: '앤더슨', taylor: '테일러', moore: '무어',
  jackson: '잭슨', lee: '리', perez: '페레스', thompson: '톰프슨', white: '화이트', harris: '해리스',
  sanchez: '산체스', clark: '클라크', ramirez: '라미레스', lewis: '루이스', robinson: '로빈슨', walker: '워커',
  young: '영', allen: '앨런', king: '킹', wright: '라이트', torres: '토레스', hill: '힐', flores: '플로레스',
  green: '그린', adams: '애덤스', nelson: '넬슨', baker: '베이커', hall: '홀', rivera: '리베라',
  campbell: '캠벨', mitchell: '미첼', carter: '카터', roberts: '로버츠', turner: '터너', phillips: '필립스',
  parker: '파커', evans: '에번스', edwards: '에드워즈', collins: '콜린스', stewart: '스튜어트', morris: '모리스',
  murphy: '머피', cook: '쿡', rogers: '로저스', morgan: '모건', cooper: '쿠퍼', peterson: '피터슨', reed: '리드',
  bailey: '베일리', bell: '벨', kelly: '켈리', howard: '하워드', ward: '워드', cox: '콕스',
  richardson: '리처드슨', wood: '우드', watson: '왓슨', brooks: '브룩스', bennett: '베넷', gray: '그레이',
  hughes: '휴스', price: '프라이스', myers: '마이어스', long: '롱', foster: '포스터', sanders: '샌더스',
  ross: '로스', powell: '파월', sullivan: '설리번', jenkins: '젠킨스', perry: '페리', butler: '버틀러',
  barnes: '반스', fisher: '피셔', henderson: '헨더슨', coleman: '콜먼', simmons: '시먼스', patterson: '패터슨',
  graham: '그레이엄', hamilton: '해밀턴', wallace: '월리스', west: '웨스트', cole: '콜', hayes: '헤이스',
  gibson: '깁슨', ford: '포드', marshall: '마셜', owens: '오언스', kennedy: '케네디', wells: '웰스',
  black: '블랙', stone: '스톤', hunt: '헌트', palmer: '파머', lincoln: '링컨', washington: '워싱턴',
  jefferson: '제퍼슨', potter: '포터', shakespeare: '셰익스피어', newton: '뉴턴', darwin: '다윈',
  swift: '스위프트', jobs: '잡스', gates: '게이츠', murray: '머리', obrien: '오브라이언', mcdonald: '맥도널드',
};

const EN_CODA: Coda = (k, short) => {
  const always: Record<string, string> = { m: 'ㅁ', n: 'ㄴ', ng: 'ㅇ', l: 'ㄹ' };
  if (always[k]) return always[k];
  if (k === 'r' || k === 'h') return 'drop'; // r sau nguyên âm không đọc (car 카)
  if (short && (k === 'p' || k === 't' || k === 'k')) return { p: 'ㅂ', t: 'ㅅ', k: 'ㄱ' }[k];
  return null;
};

function enTokens(w: string): LTok[] {
  // c/g mềm trước e/i/y (đánh dấu bằng chữ hoa), âm câm đầu từ
  let s = w.replace(/c(?=[eiy])/g, 'S').replace(/g(?=[ey])/g, 'J').replace(/^kn/, 'n').replace(/^wr/, 'r');
  let longAt = -1;
  // e câm cuối từ; "magic e" làm nguyên âm trước đọc dài (Blake 블레이크)
  if (s.length >= 3 && /[^aeiouy]e$/.test(s)) {
    s = s.slice(0, -1);
    const m = /(^|[^aeiou])([aeiouy])[^aeiouy]$/.exec(s);
    if (m) longAt = m.index + m[1].length;
  }
  const toks: LTok[] = [];
  const isV = (ch?: string) => !!ch && 'aeiou'.includes(ch);
  const V = (v: string[], short = false) => toks.push({ t: 'V', v, short });
  const C = (k: string) => {
    const p = toks[toks.length - 1];
    if (!(p?.t === 'C' && p.k === k)) toks.push({ t: 'C', k });
  };
  const DI: Record<string, string[]> = {
    ee: ['ㅣ'], ea: ['ㅣ'], ie: ['ㅣ'], ei: ['ㅣ'], oo: ['ㅜ'], ou: ['ㅏ', 'ㅜ'], ai: ['ㅔ', 'ㅣ'], ay: ['ㅔ', 'ㅣ'],
    oa: ['ㅗ'], oi: ['ㅗ', 'ㅣ'], oy: ['ㅗ', 'ㅣ'], au: ['ㅗ'], aw: ['ㅗ'], ew: ['ㅜ'], ue: ['ㅜ'],
  };
  const SHORT: Record<string, string> = { a: 'ㅐ', e: 'ㅔ', i: 'ㅣ', o: 'ㅗ', u: 'ㅓ', y: 'ㅣ' };
  const LONG: Record<string, string[]> = { a: ['ㅔ', 'ㅣ'], e: ['ㅣ'], i: ['ㅏ', 'ㅣ'], o: ['ㅗ'], u: ['ㅜ'], y: ['ㅏ', 'ㅣ'] };
  const R_COLOR: Record<string, string> = { a: 'ㅏ', e: 'ㅓ', i: 'ㅓ', o: 'ㅗ', u: 'ㅓ' };
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    const nx = s[i + 1];
    const two = s.slice(i, i + 2);
    const vowelHere = isV(ch) || (ch === 'y' && i > 0 && !isV(nx));
    if (vowelHere) {
      if (s.startsWith('igh', i)) (V(['ㅏ', 'ㅣ']), (i += 3));
      else if (isV(ch) && nx === 'r' && !isV(s[i + 2]) && s[i + 2] !== 'y' && s[i + 2] !== 'r') (V([R_COLOR[ch]]), (i += 2));
      else if (two === 'ey') (V(i + 2 === s.length ? ['ㅣ'] : ['ㅔ', 'ㅣ']), (i += 2));
      else if (two === 'ow') (V(i + 2 === s.length ? ['ㅗ'] : ['ㅏ', 'ㅜ']), (i += 2));
      else if (DI[two]) (V(DI[two]), (i += 2));
      else if (i === longAt) (V(LONG[ch]), i++);
      else (V([ch === 'a' && i === s.length - 1 ? 'ㅏ' : SHORT[ch]], true), i++);
      continue;
    }
    if (s.startsWith('tch', i)) (C('ch'), (i += 3));
    else if (['ch', 'sh', 'th'].includes(two)) (C(two), (i += 2));
    else if (two === 'ph') (C('f'), (i += 2));
    else if (two === 'wh') (C('w'), (i += 2));
    else if (two === 'ck') (C('k'), (i += 2));
    else if (two === 'gh') i += 2; // gh câm (Leigh, Hugh)
    else if (two === 'qu') (C('k'), C('w'), (i += 2));
    else if (two === 'ng') {
      C('ng');
      const after = s[i + 2];
      if (after && (isV(after) || after === 'l' || after === 'r')) C('g'); // England 잉글랜드
      i += 2;
    } else if (ch === 'x') (C('k'), C('s'), i++);
    else {
      const map: Record<string, string> = { c: 'k', q: 'k', S: 's', J: 'j' };
      if (ch === 'w' && !isV(nx)) V(['ㅜ']);
      else if (ch === 'y') C('y');
      else C(map[ch] ?? ch);
      i++;
    }
  }
  return toks;
}

function enWord(raw: string): string {
  const w = raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  return EN_DICT[w] ?? assembleLatin(enTokens(w), EN_CODA);
}

/* ------------------------------------------------------------------ */

const CONVERT: Record<NameSource, (w: string) => string> = { vi: viWord, ja: jaWord, en: enWord, id: idWord };

/**
 * Phiên âm tên sang Hangul. Mỗi từ (tách theo khoảng trắng, gạch nối, ・) là một phần, giữ thứ tự.
 * hangul = '' khi không phiên âm được (ví dụ kanji không có trong từ điển → giao diện hỏi lại bằng kana).
 */
export function nameToHangul(name: string, source: NameSource): NamePart[] {
  const convert = CONVERT[source];
  return name
    .trim()
    .split(/[\s\-‐‑–—_・･]+/)
    .filter(Boolean)
    .map((input) => ({ input, hangul: convert(input) }));
}

/** Có trong từ điển tên tiếng Anh không (để kiểm thử độ phủ). */
export const EN_NAME_COUNT = Object.keys(EN_DICT).length;
