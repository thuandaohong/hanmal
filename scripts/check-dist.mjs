// Chặn deploy vượt giới hạn file của Cloudflare Pages (gói miễn phí: 20.000 file).
// Đổi ngưỡng bằng biến môi trường MAX_FILES khi dùng gói trả phí.
import { readdir } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIMIT = Number(process.env.MAX_FILES || 19500);
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
let files = 0;
const byTop = {};
for (const e of await readdir(dist, { recursive: true, withFileTypes: true })) {
  if (!e.isFile()) continue;
  files++;
  const top = relative(dist, e.parentPath).split(/[\\/]/)[0] || '.';
  byTop[top] = (byTop[top] ?? 0) + 1;
}
console.log(`dist: ${files} file (ngưỡng ${LIMIT})`, byTop);
if (files > LIMIT) {
  console.error(`Vượt ngưỡng ${LIMIT} file. Giảm số từ (WORD_LIMIT) hoặc tăng MAX_FILES nếu dùng gói trả phí.`);
  process.exit(1);
}
