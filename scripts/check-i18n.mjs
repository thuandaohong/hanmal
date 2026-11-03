// Kiểm tra các file dịch: cùng bộ khoá với vi.json, cùng biến {tên}, không có chuỗi rỗng.
import { readFileSync } from 'node:fs';

const DIR = new URL('../src/i18n/locales/', import.meta.url);
const load = (l) => JSON.parse(readFileSync(new URL(`${l}.json`, DIR), 'utf8'));
const base = load('vi');
const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const errors = [];
for (const lang of ['ja', 'en', 'id']) {
  const d = load(lang);
  for (const k of Object.keys(base)) {
    if (!(k in d)) errors.push(`${lang}: thiếu khoá "${k}"`);
    else if (!d[k].trim()) errors.push(`${lang}: "${k}" rỗng`);
    else if (vars(d[k]) !== vars(base[k])) errors.push(`${lang}: "${k}" khác biến ({${vars(base[k])}} ≠ {${vars(d[k])}})`);
  }
  for (const k of Object.keys(d)) if (!(k in base)) errors.push(`${lang}: khoá thừa "${k}"`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`i18n: ${Object.keys(base).length} khoá, đủ cho 4 ngôn ngữ`);
