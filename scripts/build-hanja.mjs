// Tạo dữ liệu Hán tự cho bản tiếng Việt và tiếng Nhật:
//   src/data/generated/hanja.json         – chữ Hán xuất hiện trong ≥ 2 từ của bộ từ vựng
//   src/data/generated/hanja-strokes.json – nét viết (KanjiVG)
//   src/data/generated/word-hanja.json    – âm Hán Việt và dạng chữ Nhật của từng từ gốc Hán
// Chạy sau scripts/build-data.mjs: node scripts/build-hanja.mjs
//
// Nguồn: KANJIDIC2 (âm Hàn, Hán Việt, On/Kun, nghĩa tiếng Anh; CC BY-SA 4.0), KanjiVG (CC BY-SA 3.0),
// OpenCC JPShinjitaiCharacters (chữ cũ → chữ mới của Nhật; Apache 2.0).
//
// KANJIDIC2 không xếp âm Hán Việt theo mức thông dụng (生: Sanh, Sinh), nên âm của từng chữ được
// "học" bằng cách đối chiếu các tổ hợp âm với nghĩa tiếng Việt của từ trong krdict (학생 = học sinh).
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const GEN = new URL('../src/data/generated/', import.meta.url);
const CACHE = new URL('../.cache/', import.meta.url);
const KANJIVG = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/';
const OPENCC = 'https://raw.githubusercontent.com/BYVoid/OpenCC/master/data/dictionary/JPShinjitaiCharacters.txt';
const HANJA = /[㐀-鿿豈-﫿]/;
const HANGUL = /[가-힣]/;
const MIN_WORDS = 2;

// Chữ Hán theo cách viết riêng của Hàn Quốc → dạng có trong KANJIDIC2 (dùng để tra âm đọc).
const KOREAN_VARIANT = { 飮: '飲', 敎: '教', 內: '内', 旣: '既', 淸: '清', 說: '説', 歲: '歳', 娛: '娯', 絕: '絶', 靑: '青' };

async function cached(name, url) {
  const file = new URL(name, CACHE);
  if (existsSync(file)) return readFile(file, 'utf8');
  const res = await fetch(url);
  if (!res.ok) {
    if (name.startsWith('kanjivg/')) return null; // chữ không có trong KanjiVG
    throw new Error(`Không tải được ${url}: ${res.status}`);
  }
  const text = await res.text();
  await mkdir(new URL('.', file), { recursive: true });
  await writeFile(file, text);
  return text;
}

const words = JSON.parse(await readFile(new URL('words.json', GEN), 'utf8'));
const kanjidic = JSON.parse(await readFile(new URL('../node_modules/kanjidic2-json/KANJIS.json', import.meta.url), 'utf8'));
const k2 = new Map(kanjidic.map((k) => [k.literal, k]));
const lookup = (c) => k2.get(c) ?? k2.get(KOREAN_VARIANT[c]);
/** Mục KANJIDIC2 có âm Hán Việt: chữ phồn thể của Hàn đôi khi không có, dạng chữ Nhật thì có (歷 → 歴). */
const lookupHv = (c) => [lookup(c), k2.get(shinjitai.get(c))].find((k) => k?.readings?.vietnam?.length);

// Chữ cũ → chữ mới của Nhật (學 → 学).
const shinjitai = new Map();
for (const line of (await cached('JPShinjitaiCharacters.txt', OPENCC)).split('\n')) {
  if (line.startsWith('#') || !line.includes('\t')) continue;
  const [newForm, olds] = line.split('\t');
  // Dòng đầu tiên thắng: "畵 畵 畫" ở cuối file không được ghi đè 畫 → 画.
  for (const old of olds.trim().split(/\s+/)) if (old !== newForm && !shinjitai.has(old)) shinjitai.set(old, newForm);
}
for (const [kr, std] of Object.entries(KOREAN_VARIANT)) if (!shinjitai.has(kr)) shinjitai.set(kr, std);
const toJapanese = (s) => [...s].map((c) => shinjitai.get(c) ?? c).join('');

// ---------- Từ gốc Hán ----------
// Âm Hán Việt thống nhất một kiểu: NFC, dấu thanh đặt kiểu cũ (hóa, thủy) để "hoá"/"hóa" là một.
const TONES = /[\u0300\u0301\u0303\u0309\u0323]/;
const canon = (syl) => {
  const d = syl.normalize('NFD').toLowerCase();
  const tone = d.match(TONES)?.[0];
  const base = d.replace(TONES, '').normalize('NFC');
  if (!tone || !/(?<!q)(oa|oe|uy)$/.test(base)) return syl.normalize('NFC').toLowerCase();
  const i = base.length - 2;
  return (base.slice(0, i + 1) + tone + base.slice(i + 1)).normalize('NFC');
};
const canonText = (s) => s.normalize('NFC').toLowerCase().replace(/\p{L}+/gu, canon);
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
// "計劃/計畫" → dạng đầu; "六▽月" → bỏ dấu ▽; bỏ khoảng trắng, gạch nối (先生 님 → 先生님).
const cleanOrigin = (o) => (o ?? '').split('/')[0].replace(/[\s\-·^▽▼]/g, '');
const sino = [];
for (const w of words) {
  for (const e of w.entries) {
    // Gốc từ có thể lai (先生님) hoặc là phần trước 하다/되다 (工夫 → 공부하다).
    const origin = cleanOrigin(e.origin);
    if (!HANJA.test(origin)) continue;
    const stem = w.w.replace(/(하다|되다|다)$/, '');
    const len = [...origin].length;
    if (len !== w.w.length && len !== stem.length) continue;
    const vi = canonText(e.senses.map((s) => s.eq.vi?.[0] ?? '').join(' , '));
    sino.push({ id: e.id, w: w.w, origin, hanjaOnly: [...origin].filter((c) => HANJA.test(c)).join(''), vi, viFold: fold(vi) });
    break;
  }
}

// ---------- Âm Hán Việt ----------
// Ghi đè tay cho vài chữ thông dụng mà nghĩa tiếng Việt thường dịch chứ không đọc âm Hán Việt:
// -적 (的) hay dịch là "mang tính", 시청 (市廳) là "tòa thị chính".
// Một số chữ bị phiếu bầu đẩy sai âm (切 thế/thiết) hoặc KANJIDIC2 ghi âm Nôm trước (歲: tuổi).
const HV_OVERRIDE = {
  的: 'đích', 廳: 'sảnh', 差: 'sai', 較: 'giảo', 切: 'thiết', 洞: 'động', 挑: 'khiêu', 歲: 'tuế', 議: 'nghị', 資: 'tư',
  授: 'thụ', 紹: 'thiệu', 審: 'thẩm', 駐: 'trú', 買: 'mãi', 達: 'đạt',
};
// Âm học từ bản dịch: bỏ các từ thuần Việt hay đứng trong bản dịch (sự giới thiệu, tính chất…).
// Âm "học" được nhưng thực ra là bản dịch (家族 = "gia đình", 每日 = "mỗi ngày"); đã kiểm tra tay.
const LEARN_DENY = new Set('族:đình 地:trường 授:sư 大:đa 資:tài 年:năm 日:ngày 模:bộ 寶:báu 上:tiên 首:tể 詩:thơ 王:hoàng 韻:âm 自:thiên 在:giờ 慢:mãn 主:chúa'.split(' '));
const NOT_HV = new Set(['sự', 'việc', 'cái', 'người', 'nhà', 'làm', 'của', 'các', 'những', 'cuộc', 'nơi', 'được', 'bị', 'có', 'không', 'và', 'là', 'một', 'đi', 'vào', 'ra', 'lên', 'xuống', 'mua', 'bán', 'tuổi', 'nói', 'lịch', 'nghĩa', 'thân', 'cảnh']);
const pairsFile = new URL('sino-pairs.json', CACHE);
const extra = existsSync(pairsFile) ? JSON.parse(await readFile(pairsFile, 'utf8')) : [];
// Âm Nôm lẫn trong KANJIDIC2 (內: nói, nòi; 歲: tuổi): không phải âm Hán Việt.
const NOM = new Set(['nói', 'nòi', 'tuổi']);
const kanjidicHv = (c) => {
  // Bỏ âm trùng do khác dạng Unicode/kiểu bỏ dấu (內: Nội, Nạp, Nội) và âm i/y (lý/lí: giữ âm đầu tiên).
  const out = [];
  const key = (r) => r.replace(/(?<=^[hklmst])y(?=[^a-z]*$)/u, 'i').replace(/(?<=^[hklmst])[ýỳỷỹỵ]$/u, (m) => ({ ý: 'í', ỳ: 'ì', ỷ: 'ỉ', ỹ: 'ĩ', ỵ: 'ị' })[m]);
  for (const r of lookupHv(c)?.readings?.vietnam ?? []) {
    const v = canon(r);
    if (NOM.has(v)) continue;
    if (!out.some((x) => key(x) === key(v))) out.push(v);
  }
  return out;
};

// KANJIDIC2 thiếu nhiều âm Hán Việt (號 chỉ có "hào", thiếu "hiệu"; 政 thiếu "chính").
// Học âm còn thiếu bằng cách gióng chữ Hán với nghĩa tiếng Việt: 信號 = "tín hiệu", 信 = tín → 號 = hiệu.
// Chỉ nhận âm mới khi gặp ít nhất LEARN_MIN lần.
const LEARN_MIN = 3;
const learned = new Map(); // chữ → Map(âm → số lần)
const alignSources = [...extra.map(([, origin, vi]) => [origin, vi]), ...words.flatMap((w) => w.entries.map((e) => [e.origin ?? '', e.senses.map((s) => s.eq.vi?.[0] ?? '').join(' , ')]))];
for (const [origin, viRaw] of alignSources) {
  const chars = [...cleanOrigin(origin)];
  if (chars.length < 2 || !chars.every((c) => HANJA.test(c))) continue;
  for (const phrase of canonText(viRaw).split(/[,;()]/)) {
    const syl = phrase.split(/[^\p{L}]+/u).filter(Boolean);
    // Chỉ gióng khi cả cụm dịch có đúng số âm tiết bằng số chữ Hán ("tín hiệu" = 信號),
    // không trượt cửa sổ trong cụm dài ("sự giới thiệu" ≠ 紹介 = "sự giới").
    if (syl.length !== chars.length) continue;
    for (let start = 0; start === 0; start++) {
      const window = syl.slice(start, start + chars.length);
      const misses = chars.map((c, i) => (kanjidicHv(c).includes(window[i]) ? -1 : i)).filter((i) => i >= 0);
      if (misses.length !== 1) continue; // cần đúng một chữ chưa khớp để gióng chắc chắn
      const i = misses[0];
      if (NOT_HV.has(window[i])) continue;
      if (!learned.has(chars[i])) learned.set(chars[i], new Map());
      const m = learned.get(chars[i]);
      m.set(window[i], (m.get(window[i]) ?? 0) + 1);
    }
  }
}
// Âm Hán Việt và âm Hàn cùng gốc nên phụ âm đầu tương ứng có quy luật. Âm học được mà không
// tương ứng với âm Hàn của chữ thì nhiều khả năng là bản dịch (市廳 = "tòa thị chính") nên bị loại.
const INITIAL_MATCH = {
  ㄱ: ['c', 'k', 'q', 'g', 'gi', 'kh', 'h', 'nh'],
  ㄴ: ['n', 'nh', 'l'],
  ㄷ: ['đ', 'd', 'th', 'tr', 'ch'],
  ㄹ: ['l', 'n'],
  ㅁ: ['m', 'v', 'b'],
  ㅂ: ['b', 'ph', 'p'],
  ㅅ: ['s', 't', 'th', 'x', 'tr', 'ch', 'd', 'th'],
  ㅇ: ['', 'v', 'd', 'gi', 'ng', 'nh', 'h', 'y', 'u', 'o', 'a', 'â', 'ă', 'e', 'ê', 'i', 'ô', 'ơ', 'ư', 'l', 'ngh'],
  ㅈ: ['ch', 'tr', 't', 'th', 'd', 'gi', 'đ', 'x', 's'],
  ㅊ: ['th', 'x', 's', 'tr', 'ch', 't'],
  ㅋ: ['kh', 'kh'],
  ㅌ: ['th', 'đ', 't'],
  ㅍ: ['ph', 'b', 'p'],
  ㅎ: ['h', 'kh', 'ng', 'nh', 'gi', 'qu'],
};
const viInitial = (syl) => {
  const s = syl.normalize('NFC');
  for (const ini of ['ngh', 'ng', 'nh', 'ch', 'tr', 'th', 'kh', 'ph', 'gi', 'qu']) if (s.startsWith(ini)) return ini;
  return /^[bcdđghklmnpqrstvx]/.test(s) ? s[0] : '';
};
const koInitial = (c) => (lookup(c)?.readings?.korean_h ?? []).map((k) => {
  const code = k.charCodeAt(0) - 0xac00;
  return code >= 0 ? 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'[Math.floor(code / 588)] : '';
});
const plausible = (c, r) => {
  const vi = viInitial(r);
  return koInitial(c).some((k) => (INITIAL_MATCH[k] ?? []).includes(vi));
};

let added = 0;
const extraHv = new Map();
for (const [c, m] of learned) {
  const rs = [...m].filter(([r, n]) => n >= LEARN_MIN && !kanjidicHv(c).includes(r) && plausible(c, r) && !LEARN_DENY.has(`${c}:${r}`)).map(([r]) => r);
  if (rs.length) {
    extraHv.set(c, rs);
    added += rs.length;
  }
}
if (process.env.DEBUG_HV) console.log([...extraHv].map(([c, r]) => c + ":" + r.join("/")).join(" "));
console.log(`Học thêm ${added} âm Hán Việt còn thiếu trong KANJIDIC2 cho ${extraHv.size} chữ`);
const hvOf = (c) => [...kanjidicHv(c), ...(extraHv.get(c) ?? [])];
const votes = new Map(); // chữ → Map(âm → điểm)
const vote = (c, r, weight) => {
  if (!votes.has(c)) votes.set(c, new Map());
  const m = votes.get(c);
  m.set(r, (m.get(r) ?? 0) + weight);
};
function combos(chars) {
  let out = [[]];
  for (const c of chars) {
    const rs = hvOf(c);
    if (!rs.length) return [];
    out = out.flatMap((prefix) => rs.map((r) => [...prefix, r]));
    if (out.length > 512) return [];
  }
  return out;
}
const confirmed = new Map(); // từ → âm Hán Việt khớp với nghĩa
const unconfirmedHit = new Map(); // khớp với nghĩa nhưng nhờ âm tự học
// Đối chiếu thêm toàn bộ từ gốc Hán của krdict (không chỉ bộ từ đã chọn) để có nhiều phiếu hơn.
for (const [lemma, origin, viRaw] of extra) {
  const hanjaOnly = [...origin].filter((c) => HANJA.test(c));
  if (hanjaOnly.length < 2 || hanjaOnly.length !== [...cleanOrigin(origin)].length) continue;
  const vi = canonText(viRaw);
  const all = combos(hanjaOnly);
  let hits = all.filter((c) => vi.includes(c.join(' ')));
  if (hits.length !== 1) hits = all.filter((c) => fold(vi).includes(fold(c.join(' '))));
  if (hits.length === 1) hanjaOnly.forEach((c, i) => vote(c, hits[0][i], 3));
}
console.log(`Đối chiếu thêm ${extra.length} từ gốc Hán của krdict`);
for (const s of sino) {
  const chars = [...s.hanjaOnly];
  const all = combos(chars);
  // Ưu tiên khớp nguyên dấu (kinh tế ≠ kinh tể), sau đó mới khớp không dấu.
  let hits = all.filter((c) => s.vi.includes(c.join(' ')));
  if (hits.length !== 1) hits = all.filter((c) => s.viFold.includes(fold(c.join(' '))));
  if (hits.length === 1 && !chars.some((c, i) => HV_OVERRIDE[c] && HV_OVERRIDE[c] !== hits[0][i])) {
    // "Chắc chắn" chỉ khi mọi âm đều có trong KANJIDIC2 hoặc ghi đè tay (âm tự học có thể sai).
    if (chars.every((c, i) => kanjidicHv(c).includes(hits[0][i]) || HV_OVERRIDE[c] === hits[0][i])) confirmed.set(s.w, hits[0]);
    else unconfirmedHit.set(s.w, hits[0]);
    chars.forEach((c, i) => vote(c, hits[0][i], 3));
  }
  // Phiếu phụ: âm của từng chữ xuất hiện nguyên văn trong nghĩa (교장 = hiệu trưởng → 校: hiệu).
  const tokens = new Set(s.vi.split(/[^\p{L}]+/u));
  for (const c of chars) for (const r of hvOf(c)) if (tokens.has(r)) vote(c, r, 1);
}
const rankedHv = (c) => {
  if (HV_OVERRIDE[c]) return [HV_OVERRIDE[c], ...hvOf(c).filter((r) => r !== HV_OVERRIDE[c])];
  const m = votes.get(c);
  const rs = hvOf(c);
  // Điểm phiếu trước; bằng nhau thì giữ thứ tự của KANJIDIC2.
  return rs.map((r, i) => [r, (m?.get(r) ?? 0) * 1000 - i]).sort((a, b) => b[1] - a[1]).map(([r]) => r);
};

const wordHanja = {};
for (const s of sino) {
  const hv = confirmed.get(s.w) ?? unconfirmedHit.get(s.w) ?? [...s.hanjaOnly].map((c) => rankedHv(c)[0]);
  // Có chữ không có âm Hán Việt: không hiện âm cho từ này.
  if (hv.some((r) => !r)) {
    wordHanja[s.w] = { id: s.id, hv: '', ja: toJapanese(s.origin), hanja: s.origin, sure: false };
    continue;
  }
  // Phần thuần Hàn giữ nguyên và gom lại: 先生님 → "tiên sinh + 님", 火나다 → "hỏa + 나다".
  let i = 0;
  const runs = [];
  for (const c of s.origin) {
    if (HANJA.test(c)) runs.push({ ko: false, text: hv[i++] });
    else if (runs.at(-1)?.ko) runs.at(-1).text += c;
    else runs.push({ ko: true, text: c });
  }
  const text = runs.reduce((acc, r, j) => (j === 0 ? r.text : `${acc}${r.ko || runs[j - 1].ko ? ' + ' : ' '}${r.text}`), '');
  wordHanja[s.w] = { id: s.id, hv: text, ja: toJapanese(s.origin), hanja: s.origin, sure: confirmed.has(s.w) };
}

// ---------- Chữ Hán có trang riêng ----------
const usage = new Map();
for (const s of sino) for (const c of new Set(s.hanjaOnly)) usage.set(c, [...(usage.get(c) ?? []), s.w]);
const chars = [...usage].filter(([c, ws]) => ws.length >= MIN_WORDS && lookup(c)).sort((a, b) => b[1].length - a[1].length);

const strokes = {};
const hanja = [];
let noStrokes = 0;
for (const [c, ws] of chars) {
  const k = lookup(c);
  const r = k.readings ?? {};
  const hex = c.codePointAt(0).toString(16).padStart(5, '0');
  const svg = await cached(`kanjivg/${hex}.svg`, `${KANJIVG}${hex}.svg`);
  if (svg) strokes[c] = [...svg.matchAll(/<path id="kvg:[^"]*-s\d+"[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  else noStrokes++;
  hanja.push({
    c,
    ko: r.korean_h ?? [],
    hv: rankedHv(c).map((x) => x[0].toUpperCase() + x.slice(1)),
    ja: toJapanese(c),
    on: r.ja_on ?? [],
    kun: r.ja_kun ?? [],
    en: (k.meanings?.en ?? []).slice(0, 5),
    strokes: k.strokeCounts?.[0],
    words: ws,
  });
}

await writeFile(new URL('hanja.json', GEN), JSON.stringify(hanja));
await writeFile(new URL('hanja-strokes.json', GEN), JSON.stringify(strokes));
await writeFile(new URL('word-hanja.json', GEN), JSON.stringify(wordHanja));
console.log(
  `Từ gốc Hán: ${sino.length}, khớp âm Hán Việt với nghĩa: ${confirmed.size}. ` +
    `Hán tự có trang: ${hanja.length} (thiếu nét viết: ${noStrokes}).`,
);
const sample = ['학생', '경제', '도서관', '대학교', '선생님', '병원', '공부하다', '학교', '생일', '시간', '교장', '운동장', '사랑하다', '전화'];
console.log(sample.map((w) => `${w}=${wordHanja[w]?.hanja}/${wordHanja[w]?.hv}/${wordHanja[w]?.ja}`).join('\n'));
