// Dữ liệu từ điển cho công cụ (không phụ thuộc ngôn ngữ):
// verbs: { từ: [v|a, nhóm bất quy tắc] } – loại từ và nhóm chia của động/tính từ có trong từ điển
// pron:  { từ: cách đọc chuẩn } – chỉ những từ đọc khác chữ viết
import { WORDS, irregularOf, kindOf } from '../../data/words';

export function GET() {
  const verbs: Record<string, [string, string]> = {};
  const pron: Record<string, string> = {};
  for (const w of WORDS) {
    for (const e of w.entries) {
      const kind = kindOf(e);
      const irr = irregularOf(w.w, e);
      if (kind && irr && !verbs[w.w]) verbs[w.w] = [kind === 'verb' ? 'v' : 'a', irr];
      const p = e.pron[0];
      if (p && p !== w.w && !pron[w.w]) pron[w.w] = p;
    }
  }
  return new Response(JSON.stringify({ verbs, pron }), { headers: { 'Content-Type': 'application/json' } });
}
