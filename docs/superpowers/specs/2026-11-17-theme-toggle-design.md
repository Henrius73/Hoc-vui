# Light/dark theme + teacher header link — Design

Date: 2026-11-17
Status: approved (approach A)

## Intent

Cho phép người dùng chuyển giao diện **sáng/tối** toàn app, và thêm nút trên header để giáo viên đi nhanh tới khu đăng nhập/quản lý đề.

## Goals

- Một nút toggle sáng/tối trên header, lưu lựa chọn, mặc định theo hệ thống, không nháy theme khi tải.
- Toàn bộ màn hình (trang chủ, join, phòng học sinh, host library, host room, kết quả, đăng nhập) hiển thị đúng ở cả hai theme.
- Nút **Giáo viên** trên header (ẩn khi đang ở `/host*`), dẫn tới `/host`; chưa đăng nhập thì guard tự chuyển `/host/login`. Khi đã đăng nhập, nhãn đổi thành **Quản lý đề**.

## Non-goals

- Không đổi logic phòng chơi, RPC, dữ liệu Supabase.
- Không thêm theme thứ ba (sepia/high-contrast).
- Không đổi bố cục/typography, chỉ đổi màu.

## Decisions

- **Cách A — token màu ngữ nghĩa**: khai báo CSS variables + `@theme inline` của Tailwind v4, đổi theme bằng `data-theme` trên `<html>`. Các file component thay lớp zinc/white bằng token ngữ nghĩa.
- Theme lưu ở `localStorage['hv_theme']` (`'light' | 'dark'`); chưa có thì theo `prefers-color-scheme`.
- Script inline trong `index.html` set `data-theme` trước khi React mount để tránh flash.
- Accent (violet/emerald/rose/amber) giữ nguyên nền tint, nhưng chữ accent dùng token `text-tone-*` để đủ tương phản ở theme sáng.
- QR code luôn nằm trên nền trắng (bắt buộc để quét), không theo theme.
- Nút "dark" trong `ui.tsx` đổi sang `bg-ink text-canvas` để đúng ở cả hai theme.

## Token map

| Token | Dark | Light |
|---|---|---|
| `canvas` | `#050507` | `#f7f7fb` |
| `surface` | `#121216` | `#ffffff` |
| `surface-2` | `#18181b` | `#f4f4f7` |
| `elevated` | `#27272a` | `#ececf1` |
| `line` | `#27272f` | `#e4e4e7` |
| `line-strong` | `#3f3f46` | `#d4d4d8` |
| `ink` | `#f4f4f5` | `#18181b` |
| `ink-soft` | `#d4d4d8` | `#3f3f46` |
| `muted` | `#a1a1aa` | `#52525b` |
| `subtle` | `#71717a` | `#71717a` |
| `scrim` | `rgba(0,0,0,.7)` | `rgba(0,0,0,.55)` |
| `tone-violet` | `#a78bfa` | `#6d28d9` |
| `tone-emerald` | `#6ee7b7` | `#065f46` |
| `tone-rose` | `#fda4af` | `#be123c` |
| `tone-amber` | `#fcd34d` | `#92400e` |
| `tone-sky` | `#7dd3fc` | `#0369a1` |

Thay thế:
- `bg-[#050507]` → `bg-canvas`; `bg-[#121216]` → `bg-surface`; `bg-[#16161b]` / `bg-zinc-900*` → `bg-surface-2*`; `bg-zinc-800*` → `bg-elevated*`; `bg-zinc-700` → `bg-line-strong`.
- `text-white|zinc-100` → `text-ink`; `text-zinc-200|300` → `text-ink-soft`; `text-zinc-400` → `text-muted`; `text-zinc-500|600` → `text-subtle`.
- `border-zinc-800*` / `divide-zinc-800*` → `border-line` / `divide-line`; `border-zinc-700*|zinc-600` / `ring-zinc-700*` → `border-line-strong` / `ring-line-strong`.
- `text-{violet,emerald,rose,amber,sky}-{50..400}` (chữ trên nền tint) → `text-tone-*`.
- `bg-black/70` → `bg-scrim`; `bg-black/30` → `bg-line/40`; `hover:bg-white/5|/[0.03]` → `hover:bg-ink/5`.

## Verification

- `npm run build` pass.
- `git grep` không còn `bg-zinc-9`, `text-zinc-1`, `border-zinc-8` trong `src/` (trừ trường hợp cố ý: QR trắng, accent giữ nguyên).
- Thủ công: bật/tắt theme ở trang chủ, join, `/host/login`, `/host`, phòng host, phòng học sinh; reload giữ lựa chọn; kiểm tra nút Giáo viên khi chưa/đã đăng nhập.
