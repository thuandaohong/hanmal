// Bản dịch câu ví dụ (krdict chỉ có câu tiếng Hàn): khoá là câu tiếng Hàn, giá trị là [vi, en, ja, id].
import raw from './generated/example-tr.json';
import type { Lang } from '../i18n';

const ORDER: Lang[] = ['vi', 'en', 'ja', 'id'];
const TR = raw as Record<string, string[]>;

/** Bản dịch của một câu ví dụ theo ngôn ngữ trang; chuỗi rỗng nếu chưa có. */
export const exampleTr = (ko: string, lang: Lang) => TR[ko]?.[ORDER.indexOf(lang)] ?? '';
