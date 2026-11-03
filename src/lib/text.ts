// Tiện ích xử lý chuỗi dùng chung cho lúc build và trên trình duyệt.

/** Bỏ dấu (tiếng Việt, Indonesia…) và chữ hoa: "Học" → "hoc", "Đại" → "dai". */
export const foldAccents = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();

/** Đường dẫn công khai của trang: bỏ đuôi .html do build dạng file ("/a/b.html" → "/a/b"). */
export const publicPath = (pathname: string) => pathname.replace(/(\/index)?\.html$/, '') || '/';
