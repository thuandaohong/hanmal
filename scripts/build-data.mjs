// Tạo dữ liệu cho site từ krdict:
//   src/data/generated/words.json    – từ vựng sơ cấp + trung cấp đã chọn (giới hạn WORD_LIMIT)
//   src/data/generated/grammar.json  – các mục ngữ pháp (문법‧표현) kèm bản dịch
//
//   node scripts/build-data.mjs            (WORD_LIMIT mặc định 3950, vừa gói Cloudflare miễn phí)
//   WORD_LIMIT=6000 node scripts/build-data.mjs
//
// Từ sơ cấp lấy hết; từ trung cấp xếp theo tần suất kết hợp: tần suất trong câu ví dụ của krdict
// (văn viết) và tần suất phụ đề phim (FrequencyWords, văn nói). File kết quả được commit vào repo.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { entries, KRDICT_LANGS } from './lib/krdict.mjs';

const WORD_LIMIT = Number(process.env.WORD_LIMIT || 3950);
const LANGS = Object.keys(KRDICT_LANGS);
const OUT = new URL('../src/data/generated/', import.meta.url);
const CACHE = new URL('../.cache/', import.meta.url);
const FREQ_URL = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ko/ko_50k.txt';

const clean = (s) => s.replace(/[ː:]/g, '').trim();
const MAX_SENSES = 4;
const MAX_EXAMPLES = 2;

/** Gọn một nghĩa: định nghĩa tiếng Hàn, bản dịch 4 ngôn ngữ, tối đa 2 câu ví dụ dạng câu. */
function compactSense(s) {
  const examples = s.examples
    .filter((e) => e.type === '문장' || e.type === '대화')
    .slice(0, MAX_EXAMPLES)
    .map((e) => e.text);
  const eq = {};
  for (const l of LANGS) if (s.eq[l]) {
    // Bản dịch (trừ tiếng Nhật) đôi khi dính một mẩu tiếng Hàn ở cuối: "sudah, telah, pasti 마무".
    const lemma = l === 'ja' ? s.eq[l].lemma : s.eq[l].lemma.replace(/\s+[가-힣]{1,3}$/, '');
    eq[l] = [lemma, s.eq[l].def];
  }
  return { ko: s.def, eq, ex: examples };
}

// ---------- Đọc krdict ----------
const byLemma = new Map(); // lemma → [entry…]
const grammarEntries = new Map(); // dạng → các mục krdict
const exampleTokens = new Map(); // token → số lần xuất hiện trong câu ví dụ
const sinoPairs = []; // [từ, gốc Hán, nghĩa tiếng Việt]
const allLemmas = new Set(); // mọi mục từ krdict: để nhận ra token thực ra là một từ khác
let total = 0;
for await (const e of entries()) {
  total++;
  if (e.unit === '단어') allLemmas.add(e.lemma);
  for (const s of e.senses) for (const ex of s.examples) for (const line of ex.text) {
    for (const tok of line.split(/[\s.,!?'"“”‘’()]+/)) if (tok) exampleTokens.set(tok, (exampleTokens.get(tok) ?? 0) + 1);
  }
  // Ngữ pháp: cụm ngữ pháp (문법‧표현), đuôi (어미) và tiểu từ (조사).
  if (e.unit === '문법‧표현' || (e.unit === '단어' && (e.pos === '어미' || e.pos === '조사'))) {
    if (!grammarEntries.has(e.lemma)) grammarEntries.set(e.lemma, []);
    grammarEntries.get(e.lemma).push(e);
    if (e.unit === '문법‧표현') continue;
  }
  // Mọi từ gốc Hán kèm nghĩa tiếng Việt: dùng để học âm Hán Việt của từng chữ (scripts/build-hanja.mjs).
  if (e.unit === '단어' && /[\u3400-\u9fff]/.test(e.origin)) {
    const vi = e.senses.map((s) => s.eq.vi?.lemma).filter(Boolean).join(' , ');
    if (vi) sinoPairs.push([e.lemma, e.origin, vi]);
  }
  if (e.unit !== '단어' || !['초급', '중급'].includes(e.level)) continue;
  if (!byLemma.has(e.lemma)) byLemma.set(e.lemma, []);
  byLemma.get(e.lemma).push(e);
}
console.log(`krdict: ${total} mục, ${byLemma.size} từ sơ/trung cấp, ${grammarEntries.size} dạng ngữ pháp`);

// ---------- Ngữ pháp: ghép danh sách tự soạn (src/data/grammar-list.json) với krdict ----------
const grammarList = JSON.parse(await readFile(new URL('../src/data/grammar-list.json', import.meta.url), 'utf8'));
const MAX_GRAMMAR_EXAMPLES = 6;
const grammar = [];
const missingForms = [];
// Thứ tự ưu tiên: cụm ngữ pháp (문법‧표현) trước đuôi/tiểu từ đồng dạng (-다고 "nghe nói" trước -다고 "để").
const unitOrder = (e) => (e.unit === '문법‧표현' ? 0 : 1);
for (const { entryIds, senseOrder, manual, ...point } of grammarList) {
  // entryIds: chỉ dùng những mục krdict này (loại từ đồng dạng mang nghĩa khác, ví dụ -던? câu hỏi so với -던 định ngữ).
  const pick = (list) => [...list].filter((e) => !entryIds || entryIds.includes(e.id)).sort((a, b) => unitOrder(a) - unitOrder(b));
  const found = point.forms.map((f) => [f, pick(grammarEntries.get(f) ?? [])]);
  for (const [f] of found) if (!grammarEntries.get(f)?.length && !manual) missingForms.push(`${point.slug}: ${f}`);
  const primary = found.find(([, list]) => list.length)?.[1] ?? [];
  let senses = primary.flatMap((e) => e.senses);
  // senseOrder: sắp lại nghĩa khi nghĩa chính của điểm ngữ pháp không đứng đầu trong krdict.
  if (senseOrder) senses = senseOrder.map((i) => senses[i]).filter(Boolean);
  // Câu ví dụ: trước hết theo thứ tự nghĩa đã chọn, rồi từ các biến thể khác (-아요, -어요, -여요…).
  const examples = [];
  const addFrom = (list) => {
    for (const s of list) for (const ex of s.examples) {
      if ((ex.type === '문장' || ex.type === '대화') && examples.length < MAX_GRAMMAR_EXAMPLES && !examples.some((x) => x[0] === ex.text[0])) examples.push(ex.text);
    }
  };
  addFrom(senses);
  for (const [, list] of found) addFrom(senseOrder ? [] : list.flatMap((e) => e.senses));
  grammar.push({
    ...point,
    pos: manual ? 'expression' : primary[0]?.unit === '문법‧표현' ? 'expression' : primary[0]?.pos === '조사' ? 'particle' : 'ending',
    // manual: nghĩa và câu ví dụ tự soạn khi krdict không có mục tương ứng (-(으)ㄹ 거예요).
    senses: manual ? manual.senses.map((s) => ({ ...s, ex: [] })) : senses.slice(0, MAX_SENSES).map((s) => ({ ...compactSense(s), ex: [] })),
    examples: manual ? manual.examples : examples,
  });
}
if (missingForms.length) console.log(`Dạng ngữ pháp không có trong krdict (${missingForms.length}):`, missingForms.join(' | '));
const emptyPoints = grammar.filter((g) => !g.senses.length).map((g) => g.slug);
if (emptyPoints.length) console.log('Điểm ngữ pháp không có dữ liệu:', emptyPoints.join(', '));

// ---------- Tần suất ----------
async function subtitleFreq() {
  const file = new URL('ko_50k.txt', CACHE);
  if (!existsSync(file)) {
    await mkdir(CACHE, { recursive: true });
    const res = await fetch(FREQ_URL);
    if (!res.ok) throw new Error(`Không tải được danh sách tần suất: ${res.status}`);
    await writeFile(file, await res.text());
  }
  const map = new Map();
  for (const line of (await readFile(file, 'utf8')).split('\n')) {
    const [w, n] = line.split(' ');
    if (w) map.set(w, Number(n));
  }
  return map;
}
const subtitle = await subtitleFreq();

const PARTICLES = ['은', '는', '이', '가', '을', '를', '에', '에서', '의', '도', '와', '과', '로', '으로', '만'];
// Danh từ một âm tiết dễ trùng với dạng khác (게 = 것이, 하는, 서로…): chỉ đếm khi có tiểu từ
// không trùng với đuôi động từ, và tổ hợp đó không phải là một từ khác trong từ điển.
const SAFE_PARTICLES = ['을', '를', '이', '가', '의', '과', '와', '에서'];
const NOUNISH = ['서', '요', '야', '선', '까지', '부터', '에는', '에도', '서는', '로는', '랑', '하고', '처럼', '보다'];
// Token vừa là danh từ vừa là dạng chia của động từ sơ cấp (보고 = 보다 + -고), hoặc danh từ ngắn + tiểu từ
// (수도 = 수 + 도): chỉ tính một phần tư.
const VERB_ENDINGS = ['고', '면', '는', '지', '게', '기', '니', '자', '며', '서', '요', '죠', '네', '래', '러'];
const FUNCTION_NOUNS = ['수', '것', '게', '데', '줄', '때', '서', '거', '건', '걸'];
let beginnerStems;
function ambiguousToken(w) {
  beginnerStems ??= new Set(words.filter((x) => x.level === 1 && x.verbal && x.lemma.endsWith('다')).map((x) => x.lemma.slice(0, -1)));
  // Âm tiết = gốc động từ sơ cấp + ㄴ/ㄹ (온 = 오- + -ㄴ, 볼 = 보- + -ㄹ).
  const code = w.charCodeAt(w.length - 1) - 0xac00;
  const fin = code % 28;
  if (code >= 0 && code < 11172 && (fin === 4 || fin === 8)) {
    if (beginnerStems.has(w.slice(0, -1) + String.fromCharCode(0xac00 + code - fin))) return true;
  }
  for (let k = 1; k < w.length; k++) {
    const head = w.slice(0, k), tail = w.slice(k);
    if (beginnerStems.has(head) && VERB_ENDINGS.includes(tail)) return true;
    if (FUNCTION_NOUNS.includes(head) && PARTICLES.includes(tail)) return true;
  }
  return false;
}

/** Tần suất các dạng chia của một gốc động từ (bỏ token trùng với danh từ + tiểu từ: 여기, 여기서). */
function verbalCounts(table, stems) {
  const sums = new Map(stems.map((s) => [s, 0]));
  const byLen = new Map();
  for (const st of stems) byLen.set(st.length, true);
  for (const [w, c] of table) for (const k of byLen.keys()) {
    if (w.length <= k) continue;
    const st = w.slice(0, k);
    if (!sums.has(st)) continue;
    const rest = w.slice(k);
    if (allLemmas.has(w)) continue;
    // Gốc trùng với một từ khác (여기다 / 여기): bỏ các dạng danh từ + tiểu từ (여기서, 여기는).
    if (allLemmas.has(st) && (PARTICLES.includes(rest) || NOUNISH.includes(rest))) continue;
    sums.set(st, sums.get(st) + c);
  }
  return sums;
}

/** Tổng số lần một từ xuất hiện trong một bảng tần suất. */
function count(table, verbSums, lemma, verbal, nominal) {
  if (verbal && lemma.endsWith('다') && lemma.length > 2) return verbSums.get(lemma.slice(0, -1)) ?? 0;
  if (lemma.length === 1 && nominal) {
    let n = 0;
    for (const p of SAFE_PARTICLES) if (!allLemmas.has(lemma + p)) n += table.get(lemma + p) ?? 0;
    return n;
  }
  let n = (table.get(lemma) ?? 0) * (ambiguousToken(lemma) ? 0.25 : 1);
  for (const p of PARTICLES) n += table.get(lemma + p) ?? 0;
  return n;
}

// Gom theo gốc trước để không phải quét cả bảng cho từng động từ.
const words = [...byLemma.entries()].map(([lemma, list]) => {
  const verbal = list.some((e) => e.pos === '동사' || e.pos === '형용사');
  const nominal = list.every((e) => ['명사', '의존 명사', '대명사', '수사'].includes(e.pos));
  return { lemma, list, verbal, nominal, level: list.some((e) => e.level === '초급') ? 1 : 2 };
});
/** Thứ hạng theo tần suất; các từ bằng điểm nhận thứ hạng trung bình (không thiên vị thứ tự từ điển ㄱ, ㄴ…). */
const rank = (key) => {
  const sorted = [...words].sort((a, b) => b[key] - a[key]);
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j < sorted.length && sorted[j][key] === sorted[i][key]) j++;
    for (let k = i; k < j; k++) sorted[k][key + 'Rank'] = (i + j - 1) / 2;
    i = j;
  }
};
const stems = words.filter((w) => w.verbal && w.lemma.endsWith('다') && w.lemma.length > 2).map((w) => w.lemma.slice(0, -1));
const exampleVerbs = verbalCounts(exampleTokens, stems);
const subtitleVerbs = verbalCounts(subtitle, stems);
for (const w of words) {
  w.ex = count(exampleTokens, exampleVerbs, w.lemma, w.verbal, w.nominal);
  w.sub = count(subtitle, subtitleVerbs, w.lemma, w.verbal, w.nominal);
}
rank('ex');
rank('sub');
// Điểm kết hợp: trung bình thứ hạng, văn viết (câu ví dụ) có trọng số cao hơn.
for (const w of words) w.score = w.exRank * 0.65 + w.subRank * 0.35;
if (process.env.DEBUG_WORDS) for (const w of words) if (process.env.DEBUG_WORDS.split(",").includes(w.lemma)) console.log(w.lemma, w.ex, w.sub, w.exRank, w.subRank, w.score);

const beginner = words.filter((w) => w.level === 1);
const intermediate = words.filter((w) => w.level === 2).sort((a, b) => a.score - b.score || (a.lemma < b.lemma ? -1 : 1));
const chosen = [...beginner, ...intermediate.slice(0, Math.max(0, WORD_LIMIT - beginner.length))];
chosen.sort((a, b) => a.level - b.level || a.score - b.score || (a.lemma < b.lemma ? -1 : 1));

// ---------- Xuất ----------
const levelOf = (e, wordLevel) => (({ 초급: 1, 중급: 2 })[e.level] === wordLevel ? 0 : 1);
const out = chosen.map((w, i) => ({
  w: w.lemma,
  level: w.level,
  rank: i,
  // Từ đồng âm: mục cùng trình độ với từ đứng trước (수 "số" trước 수 "thứ Tư"), giữ thứ tự từ điển trong cùng nhóm.
  entries: [...w.list].sort((a, b) => levelOf(a, w.level) - levelOf(b, w.level)).map((e) => ({
    id: e.id,
    pos: e.pos,
    origin: e.origin || undefined,
    pron: [...new Set(e.pron.map(clean))].filter(Boolean),
    forms: e.forms.length ? e.forms.map((f) => f.form.trim()) : undefined,
    category: e.category || undefined,
    senses: e.senses.slice(0, MAX_SENSES).map(compactSense),
  })),
}));

await mkdir(OUT, { recursive: true });
await writeFile(new URL('words.json', OUT), JSON.stringify(out));
await writeFile(new URL('grammar.json', OUT), JSON.stringify(grammar));
await writeFile(new URL('sino-pairs.json', CACHE), JSON.stringify(sinoPairs));
console.log(
  `words.json: ${out.length} từ (sơ cấp ${beginner.length}, trung cấp ${out.length - beginner.length}/${intermediate.length}), ` +
    `grammar.json: ${grammar.length} điểm ngữ pháp`,
);
console.log('Trung cấp đầu bảng:', intermediate.slice(0, 15).map((w) => w.lemma).join(' '));
console.log('Trung cấp bị loại (mẫu):', intermediate.slice(WORD_LIMIT - beginner.length, WORD_LIMIT - beginner.length + 15).map((w) => w.lemma).join(' '));
