# Nguồn dữ liệu (kết quả giai đoạn 0)

| Dữ liệu | Nguồn | Giấy phép | Ghi chú |
|---|---|---|---|
| Từ vựng, cấp độ, cách đọc chuẩn, ví dụ, chủ đề, nghĩa 10 ngôn ngữ, dạng chia, 985 mục ngữ pháp | Từ điển tiếng Hàn cơ bản (한국어기초사전, krdict) của Viện Quốc ngữ Quốc gia, bản XML năm 2019 trên GitHub `spellcheck-ko/korean-dict-nikl-krdict` | CC BY-SA 2.0 KR | **Không** dùng file âm thanh (không được phân phối lại) |
| Âm Hàn, Hán Việt, âm On/Kun của chữ Hán | KANJIDIC2 (EDRDG), gói npm `kanjidic2-json` | CC BY-SA 4.0 | Biến thể riêng của Hàn (敎, 內, 飮…) ánh xạ thủ công; chữ phồn thể thiếu âm Hán Việt tra qua dạng chữ Nhật (歷 → 歴) |
| Nét viết chữ Hán | KanjiVG | CC BY-SA 3.0 | 726/729 chữ |
| Chữ cũ → chữ mới của Nhật (學 → 学) | OpenCC `JPShinjitaiCharacters.txt` | Apache 2.0 | 154 chữ cần chuyển |
| Thứ tự ưu tiên từ trung cấp | FrequencyWords (hermitdave), tần suất phụ đề | MIT | Chỉ dùng để xếp hạng, không đăng lại |

## Số liệu krdict (từ đơn, cấp sơ cấp + trung cấp)

- 5.922 mục, 5.408 dạng viết không trùng (1.778 sơ cấp, 3.734 trung cấp).
- Bản dịch Việt, Nhật, Anh, Indonesia: 100%. Cách đọc chuẩn: 94,6%. Câu ví dụ: 99,4%. Từ gốc (chữ Hán): 54%. Chủ đề: 67%.
- 1.379 chữ Hán xuất hiện trong toàn bộ 5.408 từ; với 3.950 từ đã chọn, 729 chữ xuất hiện ở ít nhất 2 từ (có trang riêng).

## Ngân sách file (Cloudflare Pages miễn phí: 20.000; ngưỡng an toàn 19.500)

Tổng ≈ 4 × W + 2 × (H + 1) + 4 × 262 + ~46 file tĩnh/asset, với W = số từ (`WORD_LIMIT`), H = số Hán tự có trang.

- Bản hiện tại: W = 3.950 (toàn bộ 1.778 từ sơ cấp + 2.172 trung cấp), H = 729 → **18.342 file**.
- Mỗi ngôn ngữ có 262 trang không phải từ vựng/Hán tự (Hangul, ngữ pháp, chủ đề, công cụ, 404…).
- H tăng theo W (thêm từ thì thêm chữ Hán xuất hiện ≥ 2 lần), nên khi tăng `WORD_LIMIT` cần chạy lại cả
  `npm run data` rồi xem số file mà `check-dist` in ra.
- Thêm Hán tự cho en/id sẽ tốn thêm 2 × (H + 1) ≈ 1.460 file.

## Âm Hán Việt của từ gốc Hán (scripts/build-hanja.mjs)

KANJIDIC2 thiếu nhiều âm Hán Việt (號 chỉ có "hào", thiếu "hiệu") và không xếp theo mức thông dụng (生: Sanh, Sinh).
Cách làm:
1. **Học âm còn thiếu** bằng cách gióng chữ Hán với nghĩa tiếng Việt của hơn 32.000 từ gốc Hán trong krdict
   (信號 = "tín hiệu", biết 信 = tín → 號 = hiệu). Chỉ gióng khi cả cụm dịch có đúng số âm tiết bằng số chữ Hán
   (không trượt trong cụm dài: "sự giới thiệu" ≠ 紹介), chỉ nhận âm gặp ≥ 3 lần, có phụ âm đầu tương ứng với âm Hàn
   (để loại bản dịch như 市廳 = "tòa thị chính"), và loại các âm đã kiểm tra tay là bản dịch (家族 ≠ "gia đình").
   Từ chỉ khớp được nhờ âm tự học thì không được đánh dấu "chắc chắn".
2. **Chọn âm** bằng phiếu: tổ hợp âm khớp nguyên văn với nghĩa tiếng Việt (ưu tiên khớp có dấu).
3. Ghi đè tay cho vài chữ hay bị dịch nghĩa thay vì đọc âm: 的 đích, 廳 sảnh, 差 sai, 較 giảo.

Kết quả: 1.997 từ gốc Hán, 703 từ khớp trực tiếp với nghĩa; phần còn lại ghép từ âm đã học của từng chữ.
Kiểm tra mẫu ngẫu nhiên cho thấy phần lớn đúng, nhưng vẫn có thể còn sai ở chữ ít gặp.
