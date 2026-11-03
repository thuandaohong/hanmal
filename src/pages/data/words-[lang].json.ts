// Dữ liệu gọn cho tìm kiếm và flashcards, mỗi ngôn ngữ một file: /data/words-vi.json…
// words: [từ, phiên âm Latin, nghĩa, trình độ (1|2), slug chủ đề hoặc ''] (theo thứ tự thông dụng)
import { TOPICS, WORDS, gloss, topicOf } from '../../data/words';
import { LANGS, type Lang } from '../../i18n';
import { romanize } from '../../lib/hangul/romanize';

export function getStaticPaths() {
  return LANGS.map((lang) => ({ params: { lang } }));
}

export function GET({ params }: { params: { lang: Lang } }) {
  const lang = params.lang;
  const words = WORDS.map((w) => [w.w, romanize(w.w), gloss(w, lang), w.level, topicOf(w)?.topic.slug ?? '']);
  const topics = TOPICS.map((tp) => [tp.slug, tp.name[lang]]);
  return new Response(JSON.stringify({ words, topics }), { headers: { 'Content-Type': 'application/json' } });
}
