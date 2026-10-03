# Bản Đồ Kiếm Tiền — by Tân AI

Bách khoa toàn thư về mọi cách kiếm tiền: từ xưa đến nay, online đến offline, đầu tư, kinh doanh, nghề nghiệp.

**Ứng dụng được phát triển bởi Tân AI.**

## Tính năng
- 107 cách kiếm tiền thuộc 12 lĩnh vực, mỗi cách có: vốn, thu nhập tham khảo, độ khó, rủi ro, các bước bắt đầu, ưu/nhược điểm, lời khuyên
- Tìm kiếm tiếng Việt (gõ có dấu hoặc không dấu), lọc theo vốn / online-offline / thụ động, sắp xếp
- Trắc nghiệm 6 câu: Tân AI gợi ý cách kiếm tiền phù hợp với bạn
- Công cụ: máy tính lãi kép, tự do tài chính (quy tắc 4%), quy tắc 6 chiếc hũ
- Lịch sử kiếm tiền từ 10.000 TCN đến kỷ nguyên AI
- Cảnh báo lừa đảo & 8 dấu hiệu nhận biết
- Lưu yêu thích, chia sẻ link từng cách, giao diện sáng/tối, tương thích điện thoại

## Cấu trúc
- `index.html` — bản hoàn chỉnh 1 file, mở trực tiếp hoặc đưa lên hosting là chạy
- `ban-do-kiem-tien-cloudflare.zip` — gói deploy Cloudflare Pages
- `src/` — mã nguồn (style, dữ liệu, logic). Sửa xong chạy `python3 build.py` để tạo lại `index.html` và file zip

## Đưa lên online (miễn phí)
**Cloudflare Pages:** dash.cloudflare.com → Workers & Pages → Create → Pages → Upload assets → kéo thả file `ban-do-kiem-tien-cloudflare.zip` → Deploy.

**Netlify:** app.netlify.com/drop → kéo thả thư mục chứa `index.html`.
