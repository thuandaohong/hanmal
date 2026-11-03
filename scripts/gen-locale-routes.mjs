// Sinh route cho các ngôn ngữ phụ (vi, ja, id) trong src/pages/<lang>/ bằng cách bọc lại trang gốc.
// Mỗi trang tự đọc ngôn ngữ từ Astro.currentLocale nên chỉ cần một bản mã nguồn.
// Trang chỉ dành cho một số ngôn ngữ ghi chú `// @locales: vi ja` trong frontmatter.
// Trang không có bản tiếng Anh (ngôn ngữ mặc định, URL gốc) nằm ở src/locale-pages/ để Astro không build
// chúng ở URL gốc; script này chỉ sinh route cho các ngôn ngữ ghi trong @locales.
// Chạy tự động trước `dev` và `build`; các thư mục sinh ra không được commit.
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCALES = ['vi', 'ja', 'id'];
const PAGES = fileURLToPath(new URL('../src/pages/', import.meta.url));
const LOCALE_PAGES = fileURLToPath(new URL('../src/locale-pages/', import.meta.url));
// Không cần bản dịch: endpoint dữ liệu, robots.txt.
const SKIP = [new RegExp(`^(${LOCALES.join('|')})/`), /^data\//, /\.ts$/];

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

for (const l of LOCALES) await rm(join(PAGES, l), { recursive: true, force: true });

const counts = Object.fromEntries(LOCALES.map((l) => [l, 0]));
for (const root of [PAGES, LOCALE_PAGES]) {
  for await (const file of walk(root)) {
    const rel = relative(root, file).split('\\').join('/');
    if (!rel.endsWith('.astro') || SKIP.some((re) => re.test(rel))) continue;
    const src = await readFile(file, 'utf8');
    const only = src.match(/\/\/ @locales:([^\n]*)/)?.[1].trim().split(/\s+/);
    if (root === LOCALE_PAGES && !only) throw new Error(`${rel}: trang trong src/locale-pages/ phải có // @locales`);
    if (root === PAGES && only && !only.includes('en')) {
      throw new Error(`${rel}: trang không có bản tiếng Anh phải nằm trong src/locale-pages/`);
    }
    const dynamic = /export (async )?function getStaticPaths|export const getStaticPaths/.test(src);
    for (const lang of LOCALES) {
      if (only && !only.includes(lang)) continue;
      const target = join(PAGES, lang, rel);
      let imp = relative(dirname(target), file).split('\\').join('/');
      if (!imp.startsWith('.')) imp = './' + imp;
      const body = dynamic
        ? `---\n// Tự sinh bởi scripts/gen-locale-routes.mjs – không sửa tay.\nimport Page, { getStaticPaths as paths } from '${imp}';\nexport const getStaticPaths = paths;\n---\n<Page {...Astro.props} />\n`
        : `---\n// Tự sinh bởi scripts/gen-locale-routes.mjs – không sửa tay.\nimport Page from '${imp}';\n---\n<Page {...Astro.props} />\n`;
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, body);
      counts[lang]++;
    }
  }
}
console.log('Route ngôn ngữ phụ:', Object.entries(counts).map(([l, n]) => `${l} ${n}`).join(', '));
