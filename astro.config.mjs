// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Đặt SITE_URL trong biến môi trường của Cloudflare Pages khi có domain thật.
const site = process.env.SITE_URL || 'https://hanmal.pages.dev';

export default defineConfig({
  site,
  // Xuất dạng /trang.html để Cloudflare Pages phục vụ thẳng /trang, không chuyển hướng sang /trang/.
  trailingSlash: 'never',
  build: { format: 'file' },
  // Tiếng Anh ở URL gốc; tiếng Việt, Nhật, Indonesia có tiền tố.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'vi', 'ja', 'id'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      i18n: { defaultLocale: 'en', locales: { en: 'en', vi: 'vi', ja: 'ja', id: 'id' } }, // cùng mã với hreflang trong HTML
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
