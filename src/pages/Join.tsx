import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { rpc } from '../lib/supabase'
import { getPlayer, setPlayer } from '../lib/store'
import { Button, Card, ErrorNote } from '../components/ui'
import { IconPlay } from '../components/icons'

export default function Join() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [code, setCode] = useState(params.get('code') ?? '')
  const [name, setName] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const existing = getPlayer(code.trim())

  async function join() {
    const c = code.trim()
    if (!/^\d{6}$/.test(c)) {
      setErr('Mã phòng phải gồm 6 chữ số')
      return
    }
    const n = name.trim()
    if (!n || n.length > 20) {
      setErr('Tên phải có 1–20 ký tự')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const id = await rpc<string>('join_room', { p_code: c, p_name: n })
      setPlayer(c, id, n)
      nav(`/room/${c}`)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-md items-center px-4 py-10 sm:px-6">
      <Card className="fade-up w-full overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-white px-6 py-6 text-center sm:px-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-4 ring-emerald-100">
            <IconPlay width={26} height={26} />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Tham gia phòng học</h1>
          <p className="mt-1.5 text-sm text-slate-600">Nhập mã 6 số mà giáo viên đang hiển thị trên màn hình</p>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
          {existing && (
            <p className="rounded-xl border border-indigo-100 bg-indigo-50 px-3.5 py-3 text-sm text-indigo-800">
              Bạn đã từng vào phòng này với tên <b>{existing.name}</b>. Bạn có thể vào lại.
            </p>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Mã phòng</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="000000"
                aria-label="Mã phòng 6 chữ số"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-3 text-center font-mono text-3xl font-semibold tracking-[0.35em] text-slate-900 placeholder:text-slate-300 transition-colors focus:border-indigo-500 focus:bg-white"
              />
              <span className="mt-1.5 block text-xs text-slate-500">Gồm đúng 6 chữ số</span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Tên hiển thị</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                placeholder="Ví dụ: Minh An"
                maxLength={20}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:bg-white"
              />
              <span className="mt-1.5 block text-xs text-slate-500">Tối đa 20 ký tự, hiển thị với cả lớp</span>
            </label>
          </div>

          {err && <ErrorNote>{err}</ErrorNote>}

          <Button variant="success" size="lg" onClick={join} disabled={busy} className="w-full">
            {busy ? 'Đang vào phòng...' : existing ? 'Vào lại phòng' : 'Tham gia ngay'}
          </Button>
        </div>
      </Card>
    </div>
  )
}