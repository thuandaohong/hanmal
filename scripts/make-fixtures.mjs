// Tạo bộ đáp án kiểm thử cho bộ máy tiếng Hàn từ krdict:
// - tests/fixtures/pron.json: cách đọc chuẩn của từ sơ cấp + trung cấp
// - tests/fixtures/conj.json: các dạng chia của động từ/tính từ sơ cấp + trung cấp
import { writeFile } from 'node:fs/promises';
import { entries } from './lib/krdict.mjs';

// Bỏ dấu nguyên âm dài; một mục có thể ghi nhiều cách đọc cách nhau bởi '/'.
const clean = (p) => p.replace(/ː/g, '').trim();
const pron = [];
const conj = [];
for await (const e of entries()) {
  if (e.unit !== '단어' || !['초급', '중급'].includes(e.level)) continue;
  // [từ, từ loại, các cách đọc chuẩn, có gốc Hán không]
  const prons = [...new Set(e.pron.map(clean))].filter(Boolean);
  if (prons.length) pron.push([e.lemma, e.pos, prons, /[\u3400-\u9fff]/.test(e.origin)]);
  if ((e.pos === '동사' || e.pos === '형용사') && e.forms.length) {
    conj.push([e.lemma, e.pos, e.forms.map((f) => [f.form, [...new Set(f.pron.map(clean))]])]);
  }
}
const dir = new URL('../tests/fixtures/', import.meta.url);
await writeFile(new URL('pron.json', dir), JSON.stringify(pron));
await writeFile(new URL('conj.json', dir), JSON.stringify(conj));
console.log(`pron: ${pron.length} từ, conj: ${conj.length} động/tính từ`);
