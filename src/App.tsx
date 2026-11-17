import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { supabaseConfigured } from './lib/supabase'
import { AuthProvider, useAuth } from './lib/auth'
import { IconArrowLeft, IconBoard, IconMoon, IconSun } from './components/icons'
import { Button, Loading } from './components/ui'
import { useTheme } from './lib/theme'
import Home from './pages/Home'
import Join from './pages/Join'
import StudentRoom from './pages/student-room/StudentRoom'
import HostLibrary from './pages/host-library/HostLibrary'
import HostRoom from './pages/host-room/HostRoom'
import Results from './pages/Results'
import TeacherAuth from './pages/TeacherAuth'

const HEADER_LINK =
  'inline-flex items-center gap-1.5 rounded-full border border-line-strong/80 px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-violet-500/60 hover:bg-ink/5 hover:text-ink'

function ConfigBanner() {
  return (
    <div role="alert" className="border-b border-amber-500/30 bg-amber-500/10 text-tone-amber">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-0.5 px-4 py-2.5 text-sm sm:px-6">
        <strong className="font-semibold text-tone-amber">Chưa cấu hình Supabase.</strong>
        <span className="text-tone-amber/90">
          Chạy <code className="rounded bg-line/40 px-1.5 py-0.5 font-semibold">supabase/migrations/0001_init.sql</code> và{' '}
          <code className="rounded bg-line/40 px-1.5 py-0.5 font-semibold">0002_teacher_auth.sql</code>, điền{' '}
          <code className="rounded bg-line/40 px-1.5 py-0.5 font-semibold">.env</code> rồi tải lại.
        </span>
      </div>
    </div>
  )
}

function RequireTeacherAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading label="Đang kiểm tra đăng nhập..." />
  if (!user) {
    return <Navigate to="/host/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const isHome = pathname === '/'
  const isHostArea = pathname.startsWith('/host')
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-canvas/80 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/60">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="group inline-flex items-center rounded-lg focus-visible:outline-offset-4">
            <span className="text-xl font-extrabold tracking-tight sm:text-2xl">
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
                Học Vui
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-strong/80 text-ink-soft transition-colors hover:border-violet-500/60 hover:bg-ink/5 hover:text-ink"
            >
              {theme === 'dark' ? <IconSun width={16} height={16} /> : <IconMoon width={16} height={16} />}
            </button>
            {!isHostArea && (
              <Link to="/host" className={HEADER_LINK}>
                <IconBoard width={16} height={16} /> {user ? 'Quản lý đề' : 'Giáo viên'}
              </Link>
            )}
            {isHostArea && user && (
              <>
                <span className="hidden max-w-[14rem] truncate text-xs font-medium text-muted sm:inline">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Đăng xuất
                </Button>
              </>
            )}
            {!isHome && (
              <Link to="/" className={HEADER_LINK}>
                <IconArrowLeft width={16} height={16} /> Trang chủ
              </Link>
            )}
          </div>
        </div>
      </header>
      {!supabaseConfigured && <ConfigBanner />}
      <main className="relative flex-1">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/join" element={<Join />} />
            <Route path="/room/:code" element={<StudentRoom />} />
            <Route path="/host/login" element={<TeacherAuth />} />
            <Route
              path="/host"
              element={
                <RequireTeacherAuth>
                  <HostLibrary />
                </RequireTeacherAuth>
              }
            />
            <Route
              path="/host/room/:code"
              element={
                <RequireTeacherAuth>
                  <HostRoom />
                </RequireTeacherAuth>
              }
            />
            <Route
              path="/host/results/:code"
              element={
                <RequireTeacherAuth>
                  <Results />
                </RequireTeacherAuth>
              }
            />
            <Route path="*" element={<Home />} />
          </Routes>
        </Shell>
      </HashRouter>
    </AuthProvider>
  )
}
