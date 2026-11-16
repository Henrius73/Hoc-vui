import { HashRouter, Routes, Route, Link, useLocation } from 'react-router'
import { supabaseConfigured } from './lib/supabase'
import { IconArrowLeft } from './components/icons'
import Home from './pages/Home'
import Join from './pages/Join'
import StudentRoom from './pages/StudentRoom'
import HostLibrary from './pages/HostLibrary'
import HostRoom from './pages/HostRoom'
import Results from './pages/Results'

function ConfigBanner() {
  return (
    <div role="alert" className="border-b border-amber-200 bg-amber-50 text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-0.5 px-4 py-2.5 text-sm sm:px-6">
        <strong className="font-semibold">Chưa cấu hình Supabase.</strong>
        <span className="text-amber-900/90">
          Chạy <code className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold">supabase/migrations/0001_init.sql</code>, điền{' '}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold">.env</code> rồi tải lại.
        </span>
      </div>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 text-white backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="group inline-flex items-center rounded-lg focus-visible:outline-offset-4">
            <span className="text-xl font-extrabold tracking-tight sm:text-2xl">
              <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                Học Vui
              </span>
            </span>
          </Link>
          {!isHome && (
            <Link
              to="/"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <IconArrowLeft width={16} height={16} /> Trang chủ
            </Link>
          )}
        </div>
      </header>
      {!supabaseConfigured && <ConfigBanner />}
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<Join />} />
          <Route path="/room/:code" element={<StudentRoom />} />
          <Route path="/host" element={<HostLibrary />} />
          <Route path="/host/room/:code" element={<HostRoom />} />
          <Route path="/host/results/:code" element={<Results />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Shell>
    </HashRouter>
  )
}