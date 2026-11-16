# Project Plan: Web trò chơi trắc nghiệm kiểu Kahoot (v1)

## 1) Intent đã xác nhận
- **Outcome:** Web trò chơi trắc nghiệm kiểu Kahoot cho nhiều thiết bị qua Internet: giáo viên nhập câu hỏi từ Excel, tạo phòng mã, học sinh tham gia chơi realtime có timer; chấm theo đúng/sai (đúng được điểm như nhau), có tổng hợp điểm & thống kê câu trả lời đúng; lưu trữ để dùng lại và xuất file tổng hợp.
- **User:** Giáo viên (tổ chức) và học sinh trong lớp (mỗi người một thiết bị) tham gia bằng mã phòng, không cần tài khoản đăng nhập.
- **Why now:** Cần công cụ tổ chức trò chơi trắc nghiệm trong lớp học theo cách tương tác realtime.
- **Success (v1):** 1 giáo viên nhập được bộ câu hỏi từ Excel, mở phòng cho ~30–40 học sinh chơi realtime ổn định đến hết ván với timer mỗi câu, điểm tính theo trả lời đúng hiển thị chính xác, có tổng hợp điểm & thống kê câu đúng của từng học sinh, lưu được bộ câu hỏi/kết quả ván và xuất được file (Excel/CSV) tổng hợp điểm học sinh.
- **Constraint:** Nhiều thiết bị qua Internet, đồng bộ realtime; không tài khoản đăng nhập; không ràng buộc công nghệ, ưu tiên dễ triển khai online, chi phí thấp/miễn phí và realtime ổn định.
- **Out of scope (v1):** Thưởng điểm theo tốc độ (để sau); hình ảnh/âm thanh trong câu hỏi; loại câu hỏi ngoài trắc nghiệm 1 đáp án đúng (mặc định 4 lựa chọn); chỉnh sửa khi đang chơi; hệ thống tài khoản.

## 2) Spec v1

### 2.1 Luồng
- **Giáo viên:** tạo/chọn bộ câu hỏi → nhập từ Excel → tạo phòng (mã 6 số + liên kết) → điều khiển ván (bắt đầu, công bố, câu tiếp, kết thúc) → bảng tổng hợp + thống kê → xuất file.
- **Học sinh:** vào bằng mã phòng + tên (không đăng nhập) → lobby → mỗi câu trả lời trong thời gian quy định → xem đáp án đúng khi công bố → bảng xếp hạng cuối ván.

### 2.2 Câu hỏi & chấm điểm
- Trắc nghiệm 1 đáp án đúng, 4 lựa chọn A–D, timer mỗi câu (5–300s).
- Điểm v1: trả lời đúng = **1000 điểm** (như nhau, không thưởng theo tốc độ); sai/không trả lời = 0.
- Chấm & kiểm giờ bằng **đồng hồ server** (RPC `submit_answer`): hết giờ hoặc sai pha → từ chối; mỗi câu chỉ gửi 1 đáp án (khóa chính `(player_id, q_index)`).

### 2.3 Excel
- Cột: `Câu hỏi | A | B | C | D | Đáp án đúng | Thời gian (giây)` — tự nhận dòng tiêu đề, đáp án A/B/C/D hoặc 1/2/3/4, báo lỗi theo số dòng Excel, có tệp mẫu `.xlsx` tải về.

### 2.4 Lưu trữ & xuất file
- Lưu bộ câu hỏi (gắn token máy chủ sở hữu, tái sử dụng được) và toàn bộ kết quả ván (players + answers) trong Postgres.
- Xuất file **CSV** (UTF-8 BOM, mở đúng tiếng Việt trong Excel): tên, tổng điểm, số câu đúng/sai/bỏ qua + thống kê theo từng câu.

### 2.5 Bảo mật (không tài khoản)
- Client không đọc trực tiếp bảng nhạy cảm (RLS chặn toàn bộ); mọi thao tác qua **RPC security definer**: kiểm tra `owner_token`/`host_token`, không lộ đáp án đúng khi chưa `reveal`, không ghi điểm trực tiếp.
- Realtime dùng `postgres_changes` trên `rooms`/`players` (chỉ tín hiệu pha/lobby); host poll `host_snapshot` để xem thống kê.

### 2.6 Tiêu chí nghiệm thu
- [ ] Import Excel hợp lệ tạo được bộ câu hỏi; lỗi báo theo dòng.
- [ ] Tạo phòng, học sinh vào bằng mã + tên, lobby realtime.
- [ ] Host chạy ván với timer; ~30–40 client đồng bộ pha cơ bản.
- [ ] Mỗi học sinh ≤1 đáp án/câu; hết giờ không ghi nhận; đáp án đúng không lộ sớm.
- [ ] Điểm đúng/sai chính xác; tổng hợp & thống kê từng học sinh đúng.
- [ ] Bộ câu hỏi/kết quả được lưu; xuất được file tổng hợp.
- [ ] Deploy online dùng được trên nhiều thiết bị.

## 3) Kế hoạch triển khai (đã thực hiện — xem trạng thái bên dưới)

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 0 | Khởi tạo Vite+React+TS+Tailwind, cấu trúc, env | ✅ |
| 0 | Schema + RPC + RLS + realtime publication (`supabase/migrations/0001_init.sql`) | ✅ (chưa chạy trên Supabase thật) |
| 1 | Bộ câu hỏi: import Excel + validate + lưu/khôi phục + tệp mẫu | ✅ |
| 2 | Tạo phòng mã, join bằng mã+name, lobby realtime | ✅ |
| 3 | Chơi realtime, timer theo server, chấm 1000/0, thống kê câu | ✅ |
| 4 | Bảng tổng hợp, lịch sử phòng, xuất CSV | ✅ |
| 5 | Nghiệm thu end-to-end (cần Supabase thật + 2 tab trình duyệt) | ⬜ cần bạn cấu hình .env |

## 4) Rủi ro & shortcut đã biết
- **Mã phòng 6 chữ số** (~10^6): dễ đoán nếu ai đó cố đoán dãy số — ổn với lớp học, nâng lên mã dài hơn nếu phát triển sự kiện công khai.
- **Token chủ sở hữu/điều khiển lưu ở localStorage**: xóa dữ liệu trình duyệt = mất quyền sửa bộ câu hỏi cũ và không mở lại được lịch sử phòng của máy đó (bộ đề vẫn dùng được nếu biết mã).
- **Poll an toàn 2–3s**: chống mất gói realtime (wifi lớp học); độ trễ thống kê tối đa ~3s.
- **Chưa test 30–40 client thực tế** trên Supabase free tier; chưa kiểm chứng SQL chạy trơn tru trên project thật (sẽ báo lỗi ngay nếu có khi bạn chạy migration).
- **Không có preview bằng ảnh/sound, không lưu lịch sử qua máy khác, không phân quyền theo tài khoản** — out of scope v1.
