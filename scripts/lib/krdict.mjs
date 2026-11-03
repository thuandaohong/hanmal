// Đọc dữ liệu Từ điển tiếng Hàn cơ bản (한국어기초사전, krdict) dạng XML LMF.
// Nguồn: bản sao trên GitHub của spellcheck-ko (CC BY-SA 2.0 KR). Tải về .cache/krdict/ khi cần.
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import sax from 'sax';

const BASE = 'https://raw.githubusercontent.com/spellcheck-ko/korean-dict-nikl-krdict/master/';
const FILES = [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 51947].map((n) => `${n}.xml`);
export const CACHE = new URL('../../.cache/krdict/', import.meta.url);

/** Mã ngôn ngữ của site ↔ tên ngôn ngữ trong krdict. */
export const KRDICT_LANGS = { vi: '베트남어', ja: '일본어', en: '영어', id: '인도네시아어' };

export async function fetchKrdict() {
  await mkdir(CACHE, { recursive: true });
  for (const f of FILES) {
    const dest = new URL(f, CACHE);
    if (existsSync(dest)) continue;
    console.log(`Tải ${f}…`);
    const res = await fetch(BASE + f);
    if (!res.ok) throw new Error(`Không tải được ${f}: ${res.status}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
}

// Một số bản dịch chứa '<' '>' chưa mã hoá bên trong thuộc tính val, làm hỏng XML.
const VAL = /val="([^"]*)"/g;
// Một số chuỗi bị mã hoá hai lần (&amp;quot; → &quot; sau khi sax giải mã), vài bản dịch dính rác biên tập.
const ENTITIES = { '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&apos;': "'", '&#39;': "'" };
export const cleanText = (s) =>
  s
    .replace(/&(quot|amp|lt|gt|apos|#39);/g, (m) => ENTITIES[m])
    .replace(/\t\([^)]*\)/g, '') // "んですね\t(略待上称)"
    .replace(/\+?본문 한글/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const sanitize = (line) => line.replace(VAL, (_, v) => `val="${v.replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`);

/**
 * Duyệt từng mục từ. Mỗi mục:
 * { id, unit, pos, lemma, homonym, level, category, origin, pron: string[],
 *   forms: [{ form, pron }], senses: [{ def, annotation, examples: [{ type, text: string[] }], eq: { vi: { lemma, def }, … } }] }
 */
export async function* entries() {
  await fetchKrdict();
  const langOf = Object.fromEntries(Object.entries(KRDICT_LANGS).map(([k, v]) => [v, k]));
  for (const f of FILES) {
    const queue = [];
    const parser = sax.parser(true, { trim: false });
    const stack = [];
    let entry = null, sense = null, example = null, eq = null, wordForm = null;
    parser.onopentag = (node) => {
      stack.push(node.name);
      const a = node.attributes;
      switch (node.name) {
        case 'LexicalEntry':
          entry = { id: a.val, pron: [], forms: [], senses: [], origin: '', category: '', level: '', unit: '', pos: '', lemma: '', homonym: 0 };
          break;
        case 'Sense':
          sense = { def: '', annotation: '', examples: [], eq: {} };
          break;
        case 'SenseExample':
          example = { type: '', text: [] };
          break;
        case 'Equivalent':
          eq = { lang: '', lemma: '', def: '' };
          break;
        case 'WordForm':
          wordForm = { type: '', form: '', pron: [] };
          break;
        case 'feat': {
          const parent = stack[stack.length - 2];
          const att = a.att;
          const val = cleanText(a.val ?? '');
          if (!entry) break;
          if (parent === 'LexicalEntry') {
            if (att === 'lexicalUnit') entry.unit = val;
            else if (att === 'partOfSpeech') entry.pos = val;
            else if (att === 'vocabularyLevel') entry.level = val;
            else if (att === 'semanticCategory') entry.category = val;
            else if (att === 'homonym_number') entry.homonym = Number(val);
            else if (att === 'origin') entry.origin = val;
          } else if (parent === 'Lemma' && att === 'writtenForm') entry.lemma = val;
          else if (parent === 'WordForm' && wordForm) {
            if (att === 'type') wordForm.type = val;
            else if (att === 'writtenForm') wordForm.form = val;
            else if (att === 'pronunciation') wordForm.pron.push(val);
          } else if (parent === 'Sense' && sense) {
            if (att === 'definition') sense.def = val;
            else if (att === 'annotation') sense.annotation = val;
          } else if (parent === 'SenseExample' && example) {
            if (att === 'type') example.type = val;
            else if (att === 'example') example.text.push(val);
          } else if (parent === 'Equivalent' && eq) {
            if (att === 'language') eq.lang = val;
            else if (att === 'lemma') eq.lemma = val.trim();
            else if (att === 'definition') eq.def = val.trim();
          }
          break;
        }
      }
    };
    parser.onclosetag = (name) => {
      stack.pop();
      if (name === 'WordForm' && entry && wordForm) {
        if (wordForm.type === '발음') entry.pron.push(...wordForm.pron);
        else if (wordForm.type === '활용') entry.forms.push({ form: wordForm.form, pron: wordForm.pron });
        wordForm = null;
      } else if (name === 'SenseExample' && sense && example) {
        sense.examples.push(example);
        example = null;
      } else if (name === 'Equivalent' && sense && eq) {
        const code = langOf[eq.lang];
        if (code) sense.eq[code] = { lemma: eq.lemma, def: eq.def };
        eq = null;
      } else if (name === 'Sense' && entry && sense) {
        entry.senses.push(sense);
        sense = null;
      } else if (name === 'LexicalEntry' && entry) {
        queue.push(entry);
        entry = null;
      }
    };
    parser.onerror = (e) => {
      throw new Error(`${f}: ${e.message}`);
    };
    const rl = createInterface({ input: createReadStream(new URL(f, CACHE), 'utf8'), crlfDelay: Infinity });
    for await (const line of rl) {
      parser.write(sanitize(line) + '\n');
      while (queue.length) yield queue.shift();
    }
    parser.close();
    while (queue.length) yield queue.shift();
  }
}
