# Học Vui — Trò chơi trắc nghiệm cả lớp

Giáo viên nhập bộ câu hỏi từ Excel, tạo phòng bằng mã 6 số; học sinh vào bằng mã + tên, trả lời theo timer, điểm tính theo trả lời đúng (1000 điểm/câu), có tổng hợp điểm + thống kê từng học sinh và xuất file Excel.

**Vite + React 19 + TypeScript + Tailwind v4 + Supabase (Postgres) · không cần tài khoản đăng nhập.**

## Chạy local

```bash
npm install
npm run dev        # http://localhost:5173
```

## Cấu hình Supabase (bắt buộc, làm 1 lần)

1. Tạo project tại [supabase.com](https://supabase.com).
2. **SQL Editor** → chạy lần lượt các file trong [`supabase/migrations/`](supabase/migrations/) theo thứ tự `0001_init.sql` → `0004_delete_room.sql` (hoặc dùng `npx supabase db push`).
3. Tạo file `.env` ở gốc dự án (copy từ `.env.example`) và điền:

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Lấy ở **Project Settings → API Keys**. Chỉ dùng publishable key — **không bao giờ** đặt secret key trong `.env`.

4. Khởi động lại `npm run dev`.

> Chưa cấu hình thì trang hiển thị hướng dẫn; điền đủ `.env` là dùng được ngay.

## Dùng trong lớp

1. Mở `/host` → **Tải tệp Excel mẫu**, soạn câu hỏi theo cột
   `Câu hỏi | A | B | C | D | Đáp án đúng | Thời gian (giây)` → nhập lại tệp vào app → **Lưu bộ câu hỏi**.
2. **Mở phòng** → chiếu mã 6 số + liên kết lên lớp.
3. Học sinh mở trang → **Tôi là học sinh** → nhập mã + tên → **Tham gia**.
4. Giáo viên: **Bắt đầu** → mỗi câu bấm **Công bố đáp án** → **Câu tiếp theo** → **Kết thúc & tổng kết**.
5. Bảng tổng hợp: xem/tải file Excel tổng hợp điểm và thống kê đúng theo từng câu.
   Phòng đã mở và kết quả lưu lại trong mục **Phòng đã mở**.

## Kiểm tra nhanh (khuyến nghị trước buổi học)

```bash
node scripts/smoke.mjs
```

Test end-to-end thẳng trên Supabase thật: lưu bộ câu hỏi → tạo phòng → vào → chấm điểm (đúng = 1000,
1 đáp án/câu, chặn muộn theo giờ server, không lộ đáp án trước công bố) → kết thúc → RLS. **23/23 pass.**

> Mỗi lần chạy tạo 1 bộ "SMOKE TEST" + 1 phòng test (không xóa được qua app vì phòng đã tồn tại).
> Dọn một lần bằng SQL ở Supabase SQL Editor (nếu muốn):

```sql
delete from public.rooms
where id in (select room_id from public.host_keys where host_token = 'smoketest_host_token_0001');
delete from public.quiz_sets where owner_token = 'smoketest_owner_token_0001';
```

## Deploy (Vercel)

- Import repo → Framework Preset **Vite** → thêm env `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` → Deploy.
- Dùng **HashRouter** nên không cần cấu hình rewrite (vào `/join` trực tiếp không bị 404).
- Sau khi có domain: thêm domain vào Supabase **Authentication → URL Configuration** (không bắt buộc — app không dùng Auth, chỉ cần nó cho dashboard).

## Cấu trúc

```
src/
  lib/      supabase.ts (client + rpc), store.ts (token máy, phiên học sinh),
            excel.ts (đọc/xuất Excel + tệp mẫu), types.ts
  hooks/    useRoomState.ts (snapshot + realtime + poll), useRemainingMs.ts (đồng hồ server)
  pages/    Home, Join, StudentRoom, HostLibrary, HostRoom, Results
supabase/
  migrations/ 0001_init.sql — bảng + RLS + RPC (save_quiz, create_room, join_room,
               get_room_state, host_snapshot, host_action, submit_answer, list_rooms, ...)
               0002_teacher_auth.sql — gắn dữ liệu với auth.uid()
               0003_auto_reveal.sql — tự công bố đáp án khi hết giờ
               0004_delete_room.sql — RPC delete_room (xóa lịch sử phòng)
```

Chi tiết spec + kế hoạch + shortcut đã biết: xem [`project.md`](project.md).
