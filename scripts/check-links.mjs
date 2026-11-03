// Kiểm tra chất lượng bản build:
// 1. Mọi link nội bộ đều trỏ tới file có thật.
// 2. Trang tiếng Anh, Nhật, Indonesia (mọi trang ngoài /vi/) không lọt chữ tiếng Việt (trừ tên ngôn ngữ trong menu).
//    Gồm href/src (nháy đơn hoặc kép) và URL tuyệt đối của chính site (canonical, hreflang, og:url).
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const SITE = (process.env.SITE_URL || 'https://learhanmal.com').replace(/\/$/, '');
const all = new Set();
for (const e of await readdir(DIST, { recursive: true, withFileTypes: true })) {
  if (e.isFile()) all.add('/' + relative(DIST, join(e.parentPath, e.name)).split(/[\\/]/).join('/'));
}
const exists = (href) => {
  let p;
  try {
    p = decodeURIComponent(href);
  } catch {
    return false; // %ZZ…: URL hỏng
  }
  p = p.replace(/\/$/, '') || '/';
  return p === '/' ? all.has('/index.html') : all.has(p) || all.has(p + '.html') || all.has(p + '/index.html');
};

// Dấu riêng của tiếng Việt (không có trong tiếng Indonesia, Anh, Nhật).
const VI = /[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđơưăĐƠƯĂ]/;
const broken = new Map();
const leaks = new Map();
for (const f of all) {
  if (!f.endsWith('.html')) continue;
  const html = await readFile(join(DIST, f.slice(1)), 'utf8');
  const site = SITE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:href|src|content)=(["'])(?:${site})?(\\/(?!\\/)[^"'#?\\s]*)\\1`, 'g');
  for (const m of html.matchAll(re)) if (!exists(m[2])) broken.set(m[2], (broken.get(m[2]) ?? 0) + 1);
  if (!/^\/vi[/.]/.test(f)) {
    const text = html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
      .replace(/<a[^>]*hreflang="vi"[^>]*>[\s\S]*?<\/a>/g, '')
      // Phần ghi rõ lang="vi" (trang 404 đa ngôn ngữ, tên ngôn ngữ) là cố ý.
      .replace(/<(li|a|span|p)\b[^>]*\slang="vi"[^>]*>[\s\S]*?<\/\1>/g, '')
      .replace(/<[^>]+>/g, '\n');
    for (const line of text.split('\n')) if (VI.test(line)) leaks.set(line.trim().slice(0, 80), f);
  }
}
console.log(`HTML: ${[...all].filter((f) => f.endsWith('.html')).length} trang`);
console.log(`Link hỏng: ${broken.size}`, [...broken].slice(0, 15));
console.log(`Chữ tiếng Việt trong trang en/ja/id: ${leaks.size}`, [...leaks].slice(0, 15));
if (broken.size || leaks.size) process.exit(1);
