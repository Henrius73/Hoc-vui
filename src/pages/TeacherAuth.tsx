import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { supabaseConfigured } from '../lib/supabase'
import { Button, Card, ErrorNote, Loading } from '../components/ui'
import { IconBoard } from '../components/icons'

export default function TeacherAuth() {
  const { user, loading, signInWithPassword, signUp, signInWithGoogle } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/host'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <Loading label="Đang kiểm tra phiên đăng nhập..." />
  if (user) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setErr('Vui lòng nhập đầy đủ email và mật khẩu')
      return
    }
    if (password.length < 6) {
      setErr('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setBusy(true)
    setErr(null)
    setNotice(null)
    try {
      if (mode === 'login') {
        await signInWithPassword(trimmedEmail, password)
        nav(from, { replace: true })
      } else {
        const res = await signUp(trimmedEmail, password)
        if (res.needsConfirmation) {
          setNotice('Đã tạo tài khoản! Hãy kiểm tra email để xác nhận trước khi đăng nhập.')
          setMode('login')
        } else {
          nav(from, { replace: true })
        }
      }
    } catch (error) {
      setErr((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setBusy(true)
    setErr(null)
    try {
      await signInWithGoogle()
    } catch (error) {
      setErr((error as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-10rem)] max-w-md items-center px-4 py-10 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-64">
        <div className="mx-auto h-56 w-72 rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <Card className="fade-up w-full overflow-hidden border-line bg-surface p-0 shadow-2xl shadow-black/40">
        <div className="border-b border-line bg-gradient-to-br from-violet-600/15 via-transparent to-orange-500/10 px-6 py-7 text-center sm:px-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-1 ring-white/10">
            <IconBoard width={26} height={26} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
            {mode === 'login' ? 'Giáo viên đăng nhập' : 'Tạo tài khoản giáo viên'}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Đồng bộ bộ câu hỏi và lịch sử phòng trên mọi thiết bị
          </p>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
          {!supabaseConfigured && (
            <ErrorNote>Chưa cấu hình Supabase (.env) nên chưa thể đăng nhập.</ErrorNote>
          )}

          {notice && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-sm font-medium text-tone-emerald">
              {notice}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="giaovien@truong.edu.vn"
                className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface-2 px-3.5 py-2.5 text-ink placeholder:text-subtle transition-colors focus:border-violet-500 focus:ring-0"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink-soft">Mật khẩu</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Ít nhất 6 ký tự"
                className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface-2 px-3.5 py-2.5 text-ink placeholder:text-subtle transition-colors focus:border-violet-500 focus:ring-0"
              />
            </label>

            {err && <ErrorNote>{err}</ErrorNote>}

            <Button type="submit" variant="primary" size="lg" disabled={busy || !supabaseConfigured} className="w-full">
              {busy
                ? 'Đang xử lý...'
                : mode === 'login'
                  ? 'Đăng nhập'
                  : 'Đăng ký tài khoản'}
            </Button>
          </form>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-line" />
            <span className="mx-3 shrink text-xs font-medium text-subtle">hoặc</span>
            <div className="flex-grow border-t border-line" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={busy || !supabaseConfigured}
            onClick={handleGoogle}
            className="w-full"
          >
            Tiếp tục với Google
          </Button>

          <p className="text-center text-sm text-muted">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setErr(null)
                setNotice(null)
              }}
              className="font-semibold text-tone-violet hover:text-tone-violet"
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  )
}
