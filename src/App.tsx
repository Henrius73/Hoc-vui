import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { supabaseConfigured } from './lib/supabase'
import { AuthProvider, useAuth } from './lib/auth'
import { IconArrowLeft } from './components/icons'
import { Button, Loading } from './components/ui'
import Home from './pages/Home'
import Join from './pages/Join'
import StudentRoom from './pages/student-room/StudentRoom'
import HostLibrary from './pages/host-library/HostLibrary'
import HostRoom from './pages/host-room/HostRoom'
import Results from './pages/Results'
import TeacherAuth from './pages/TeacherAuth'

function ConfigBanner() {
  return (
    <div role="alert" className="border-b border-amber-500/30 bg-amber-500/10 text-amber-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-0.5 px-4 py-2.5 text-sm sm:px-6">
        <strong className="font-semibold text-amber-100">Chưa cấu hình Supabase.</strong>
        <span className="text-amber-100/90">
          Chạy <code className="rounded bg-black/30 px-1.5 py-0.5 font-semibold">supabase/migrations/0001_init.sql</code> và{' '}
          <code className="rounded bg-black/30 px-1.5 py-0.5 font-semibold">0002_teacher_auth.sql</code>, điền{' '}
          <code className="rounded bg-black/30 px-1.5 py-0.5 font-semibold">.env</code> rồi tải lại.
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

  return (
    <div className="flex min-h-screen flex-col bg-[#050507] text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-[#050507]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[#050507]/60">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="group inline-flex items-center rounded-lg focus-visible:outline-offset-4">
            <span className="text-xl font-extrabold tracking-tight sm:text-2xl">
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
                Học Vui
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2.5">
            {isHostArea && user && (
              <>
                <span className="hidden max-w-[14rem] truncate text-xs font-medium text-zinc-400 sm:inline">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Đăng xuất
                </Button>
              </>
            )}
            {!isHome && (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-violet-500/60 hover:bg-white/5 hover:text-white"
              >
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
