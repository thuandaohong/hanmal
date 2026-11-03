# hanmal

Website tĩnh học tiếng Hàn cho người nói tiếng Việt, Nhật, Anh và Indonesia, từ bảng chữ Hangul đến trình độ trung cấp.
Astro + Tailwind CSS v4, deploy lên Cloudflare Pages. **Cần Node 22.22 trở lên.**

```bash
npm install
npm run dev         # http://localhost:4321
npm test            # kiểm thử bộ máy tiếng Hàn (đối chiếu với từ điển krdict)
npm run build       # kiểm tra i18n → sinh route ngôn ngữ → build → kiểm tra số file, link hỏng, chữ chưa dịch
npm run preview:cf  # chạy bản build bằng môi trường mô phỏng Cloudflare (wrangler)
```

## Nội dung

| Phần | Đường dẫn | Ghi chú |
|---|---|---|
| Hangul | `/hangul`, `/hangul/[chữ cái]`, `/hangul/syllables`, `/hangul/batchim`, `/hangul/quiz` | 40 chữ cái, nét viết vẽ tay |
| Từ vựng | `/vocabulary/beginner`, `/vocabulary/intermediate` (+ `/[phụ âm đầu]`), `/vocabulary/topics/[chủ đề]`, `/word/[từ]` | 3.950 từ, 14 chủ đề |
| Ngữ pháp | `/grammar`, `/grammar/[điểm]` | 158 điểm, bảng cách kết hợp tự sinh |
| Ngữ pháp dễ nhầm | `/grammar/compare`, `/grammar/compare/[cặp]` | Soạn tay trong `src/data/grammar-compare.json` (điểm khác nhau, mẹo, ví dụ có bản dịch 4 ngôn ngữ) |
| Hán tự | `/vi/hanja`, `/ja/hanja` (+ `/[chữ]`) | 729 chữ, **chỉ bản tiếng Việt và tiếng Nhật** (`src/locale-pages/hanja/`) |
| Công cụ | `/tools/conjugator`, `/tools/pronunciation`, `/tools/romanizer`, `/tools/korean-name`, `/tools/keyboard`, `/search`, `/flashcards`, `/hangul/quiz` | Chạy trên trình duyệt |

## Đa ngôn ngữ

- Tiếng Anh ở URL gốc; tiếng Việt `/vi/`, tiếng Nhật `/ja/`, tiếng Indonesia `/id/`.
- Chuỗi giao diện trong `src/i18n/locales/*.json`. Build dừng nếu thiếu khoá hoặc sai biến.
- Route ngôn ngữ phụ do `scripts/gen-locale-routes.mjs` tự sinh (không commit).
  Trang chỉ dành cho một số ngôn ngữ ghi `// @locales: vi ja` trong frontmatter. Trang không có bản tiếng Anh
  (Hán tự) nằm ở `src/locale-pages/` thay vì `src/pages/`, để không bị build ở URL gốc.
- Nghĩa từ vựng và ngữ pháp lấy từ bản dịch có sẵn trong krdict; tên chủ đề dịch trong `src/data/topics.json`.

## Dữ liệu

```bash
npm run data       # build-data.mjs (từ vựng, ngữ pháp) rồi build-hanja.mjs (Hán tự, âm Hán Việt)
npm run fixtures   # tạo dữ liệu đối chiếu cho kiểm thử
```

Dữ liệu tải về `.cache/` (không commit); kết quả nằm trong `src/data/generated/` (có commit), nên khi deploy không cần chạy lại.
Nguồn, giấy phép, cách chọn từ và cách tính âm Hán Việt: xem `docs/DATA.md`.

Bản dịch câu ví dụ (krdict chỉ có câu tiếng Hàn) nằm ở `src/data/generated/example-tr.json`: khoá là câu tiếng Hàn, giá trị `[vi, en, ja, id]`.
File này không do `npm run data` tạo, nên chạy lại script không làm mất; câu mới chưa có bản dịch thì chỉ hiện tiếng Hàn.
Sơ cấp và trung cấp được ghi kèm TOPIK I và TOPIK II trên trang danh sách, trang từ và trang ngữ pháp.

Số từ mặc định là 3.950 để vừa giới hạn 20.000 file của Cloudflare Pages gói miễn phí. Với gói trả phí:

```bash
WORD_LIMIT=6000 npm run data
MAX_FILES=95000 npm run build
```

## Bộ máy tiếng Hàn (`src/lib/hangul/`)

| File | Chức năng | Độ chính xác (so với krdict) |
|---|---|---|
| `compose.ts` | Tách/ghép âm tiết, chữ cái đầu, phụ âm cuối | – |
| `pronounce.ts` | Cách đọc thực tế, ghi lại luật biến âm đã áp dụng | 96,9% trên 5.587 từ |
| `romanize.ts` | Phiên âm Latin chuẩn (Revised Romanization) | 34/34 ví dụ chính thức |
| `conjugate.ts` | Chia động/tính từ, 25 dạng, 8 nhóm bất quy tắc | 99,8% dạng chia; đoán nhóm 99,4% |
| `grammar.ts` | Bảng cách kết hợp của điểm ngữ pháp | – |
| `particles.ts`, `keyboard.ts` | Chọn tiểu từ; ghép chữ cho bàn phím 2 hàng | – |
| `names.ts` | Phiên tên tiếng Việt, Nhật, Anh, Indonesia sang Hangul (theo 외래어 표기법) | Có kiểm thử theo ví dụ chuẩn |

## Deploy lên Cloudflare Pages

1. Push repo lên GitHub.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**, chọn repo.
3. Preset **Astro**; build command **`npm run build`** (bắt buộc: bước này sinh route ja/en/id và chạy kiểm tra; `astro build` trực tiếp chỉ ra bản tiếng Việt); thư mục output `dist`.
4. Biến môi trường:
   - `NODE_VERSION=22.22.0` (repo đã có `.node-version`, Cloudflare tự đọc)
   - `SITE_URL=https://ten-mien-cua-ban` (canonical, sitemap, ảnh chia sẻ; mặc định `https://learnhanmal.com`)
   - `PUBLIC_CF_BEACON_TOKEN=…` (tuỳ chọn, Cloudflare Web Analytics)

## SEO

- Mỗi trang có title/description riêng (kiểm tra: không trùng), canonical, hreflang cho từng bản ngôn ngữ có thật
  và `x-default` trỏ về bản tiếng Anh; sitemap dùng cùng mã ngôn ngữ (vi, ja, en, id).
- Trang từ: title chứa nghĩa ngắn ("학교 nghĩa là gì? Trường học"), description có từ loại, trình độ, cách đọc chuẩn;
  JSON-LD `DefinedTerm` + `BreadcrumbList`. Trang ngữ pháp: `LearningResource`. Trang chủ: `WebSite` + `SearchAction`.
- Danh sách trình độ tách theo phụ âm đầu để mỗi trang dưới ~120 KB (trước đây 700–860 KB).

