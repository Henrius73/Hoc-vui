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
    <div role="alert" className="border-b border-amber-300 bg-amber-100 text-amber-950">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-x-2 gap-y-0.5 px-4 py-2.5 text-sm">
        <strong>Chưa cấu hình Supabase.</strong>
        <span>
          Chạy file <code className="font-semibold">supabase/migrations/0001_init.sql</code> trong
          SQL Editor, điền <code className="font-semibold">.env</code> (xem README) rồi tải lại trang.
        </span>
      </div>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight hover:text-white">
            Học Vui
          </Link>
          <span className="hidden border-l border-slate-700 pl-3 text-xs text-slate-400 sm:inline">
            Trò chơi trắc nghiệm cả lớp
          </span>
          {pathname !== '/' && (
            <Link
              to="/"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
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
