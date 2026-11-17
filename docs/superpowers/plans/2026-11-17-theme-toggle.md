# Light/dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm theme sáng/tối toàn app và nút Giáo viên trên header.

**Architecture:** CSS variables ngữ nghĩa + `@theme inline` (Tailwind v4); theme chọn qua `data-theme` trên `<html>`, lưu `localStorage`, mặc định theo hệ thống. Component dùng token thay lớp màu cứng.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, react-router.

**Spec:** `docs/superpowers/specs/2026-11-17-theme-toggle-design.md`

## Global Constraints

- Không đổi logic phòng chơi, RPC, schema Supabase.
- Mọi màu nền/chữ/viền/vành phải qua token trong spec; không thêm dependency.
- QR code luôn nền trắng; accent tints giữ nguyên.
- Không dùng màu làm tín hiệu duy nhất; giữ `aria-label` cho nút icon.
- Tôn trọng `prefers-reduced-motion` hiện có.

## Review Focus

- Chữ trên nền tint (badge trạng thái) phải đủ tương phản ở theme sáng.
- Dialog backdrop và ConfigBanner không bị "trắng trên trắng" hay "đen trên đen".
- Nút variant `dark` vẫn nổi bật ở cả hai theme.
- QR code/khung QR không bị theme làm mất nền trắng.
- Reload không nháy theme và giữ lựa chọn.

---

### Task 1: Theme tokens, bootstrap và header

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`
- Create: `src/lib/theme.ts`
- Modify: `src/components/icons.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `useTheme(): { theme: 'light' | 'dark'; toggleTheme(): void }` trong `src/lib/theme.ts`; `IconSun`, `IconMoon` trong `src/components/icons.tsx`.

- [ ] **Step 1: Khai báo token trong `src/index.css`**

Thêm `:root` (dark), `[data-theme="light"]` (light), và `@theme inline` mapping `--color-canvas`, `--color-surface`, `--color-surface-2`, `--color-elevated`, `--color-line`, `--color-line-strong`, `--color-ink`, `--color-ink-soft`, `--color-muted`, `--color-subtle`, `--color-scrim`, `--color-tone-violet`, `--color-tone-emerald`, `--color-tone-rose`, `--color-tone-amber`, `--color-tone-sky` đúng bảng trong spec. Đặt `color-scheme` theo theme.

- [ ] **Step 2: Chống nháy theme trong `index.html`**

Chèn script inline trong `<head>`: đọc `localStorage['hv_theme']`; nếu không phải `light|dark` thì dùng `matchMedia('(prefers-color-scheme: light)')`; gán `document.documentElement.dataset.theme`.

- [ ] **Step 3: Viết `src/lib/theme.ts`**

`useTheme` khởi tạo từ `document.documentElement.dataset.theme` (fallback system), `toggleTheme` đổi state, effect gán `dataset.theme` + `localStorage.setItem('hv_theme', theme)`.

- [ ] **Step 4: Thêm icon `IconSun`, `IconMoon`** vào `src/components/icons.tsx` theo pattern `base(p)` hiện có.

- [ ] **Step 5: Cập nhật header `src/App.tsx`**

Thay `bg-[#050507]`/`text-zinc-100` bằng `bg-canvas`/`text-ink` (và các lớp lân cận sang token tương ứng). Thêm trước nút "Trang chủ":
- Nút icon theme: `aria-label` "Chuyển sang giao diện sáng/tối", gọi `toggleTheme()`.
- Khi `!isHostArea`: `Link to="/host"` nhãn "Giáo viên" (hoặc "Quản lý đề" nếu `user`), kèm `IconBoard`.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: PASS, không lỗi TS.

- [ ] **Step 7: Commit**

```bash
git add src/index.css index.html src/lib/theme.ts src/components/icons.tsx src/App.tsx docs/superpowers
git commit -m "feat(theme): add light/dark tokens, toggle and teacher header link"
```

---

### Task 2: Chuyển màu trung tính sang token

**Files (toàn bộ file có lớp zinc/white):**
- Modify: `src/components/ui.tsx`, `ChoiceGrid.tsx`, `Leaderboard.tsx`, `JoinRoomForm.tsx`, `TimerBar.tsx`, `QuestionProgress.tsx`
- Modify: `src/pages/Home.tsx`, `Join.tsx`, `Results.tsx`, `TeacherAuth.tsx`
- Modify: `src/pages/host-library/*.tsx`, `src/pages/host-room/*.tsx`, `src/pages/student-room/*.tsx`

**Interfaces:**
- Consumes: token từ Task 1.

- [ ] **Step 1: Thay theo bảng map của spec**

Nền: `bg-[#050507]`→`bg-canvas`; `bg-[#121216]/90`→`bg-surface/90`; `bg-[#121216]`→`bg-surface`; `bg-[#16161b]`→`bg-surface-2`; `bg-zinc-900*`→`bg-surface-2*`; `bg-zinc-800*`→`bg-elevated*`; `bg-zinc-700`→`bg-line-strong`.
Chữ: như bảng. Viền/vành/divide như bảng.
Không đổi `bg-white` của khung QR và `bgColor="#ffffff"` của `QRCodeSVG`.

- [ ] **Step 2: Rà các chỗ đặc biệt**

`ConfirmDialog` backdrop → `bg-scrim`; `ConfigBanner` dùng `bg-amber-500/10`, chữ token `text-tone-amber`, code chip `bg-line/40`; `BTN.dark` → `bg-ink text-canvas hover:bg-ink-soft`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Kiểm tra sót màu tối**

Run: `git grep -nE "bg-zinc-9|bg-zinc-8|text-zinc-(1|2|3)|border-zinc-(7|8)|divide-zinc-8|ring-zinc-7" -- src`
Expected: chỉ còn các trường hợp cố ý (nếu có), không còn lớp nền/chữ chính.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "refactor(theme): replace hardcoded dark colors with semantic tokens"
```

---

### Task 3: Accent tones và tương phản theme sáng

**Files:**
- Modify: các file còn lớp `text-{violet,emerald,rose,amber,sky}-{50..400}`, `hover:text-*`.

- [ ] **Step 1: Thay chữ accent bằng `text-tone-*`**

`text-violet-100|200|300` → `text-tone-violet`; `text-emerald-200|300|400` → `text-tone-emerald`; `text-rose-200|300|400` → `text-tone-rose`; `text-amber-50|100|200|300|400` → `text-tone-amber`; `text-sky-*` chữ → `text-tone-sky`. Giữ `text-amber-950`, `text-orange-950` (chữ trên nền đặc).

- [ ] **Step 2: Sửa hover/focus accent**

`hover:text-violet-300` → `hover:text-tone-violet`; `hover:text-rose-300` → `hover:text-tone-rose`; `hover:text-white` → `hover:text-ink`.

- [ ] **Step 3: Build + kiểm tra thủ công bằng dev server**

Run: `npm run dev`
Expected: mở lần lượt `/`, `/join`, `/host/login`, `/host`; bật/tắt theme; reload giữ lựa chọn; badge trạng thái đọc rõ ở nền sáng; QR vẫn trắng.

- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "fix(theme): adapt accent text and status chips for light mode"
```

---

### Task 4: Kiểm thử tổng thể & tài liệu

**Files:**
- Modify: `README.md` (ghi chú theme + nút Giáo viên)

- [ ] **Step 1: Chạy build cuối**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 2: Checklist thủ công**

- Toggle ở header đổi ngay, icon/aria đúng.
- `/host` khi chưa đăng nhập → `/host/login`.
- Nút Giáo viên ẩn trong `/host*`, hiện ở trang khác.
- Luồng host: tạo phòng, bắt đầu, công bố, kết thúc; theme không làm mất chữ.
- Luồng học sinh: vào phòng, trả lời, xem reveal.

- [ ] **Step 3: Cập nhật README + commit**

```bash
git add README.md
git commit -m "docs: note light/dark theme and teacher header shortcut"
```
