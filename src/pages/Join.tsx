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
    <div className="mx-auto max-w-sm px-4 py-10">
      <Card className="fade-up p-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <IconPlay width={26} height={26} />
          </span>
          <h1 className="mt-3 text-xl font-bold tracking-tight">Vào phòng</h1>
          <p className="mt-1 text-sm text-slate-600">Nhập mã phòng giáo viên chiếu lên lớp</p>
        </div>

        {existing && (
          <p className="mb-4 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm text-indigo-700">
            Bạn đã tham gia phòng này với tên <b>{existing.name}</b>.
          </p>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Mã phòng (6 chữ số)
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="off"
              placeholder="123456"
              aria-label="Mã phòng 6 chữ số"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center font-mono text-2xl tracking-[0.35em] placeholder:text-slate-300 focus:border-indigo-500"
            />
          </label>
          <label className="block text-sm font-medium">
            Tên của bạn
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder="VD: An"
              maxLength={20}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 placeholder:text-slate-400 focus:border-indigo-500"
            />
          </label>
        </div>

        {err && (
          <div className="mt-4">
            <ErrorNote>{err}</ErrorNote>
          </div>
        )}

        <Button
          variant="success"
          size="lg"
          onClick={join}
          disabled={busy}
          className="mt-5 w-full"
        >
          {busy ? 'Đang vào...' : existing ? 'Vào lại phòng' : 'Tham gia'}
        </Button>
      </Card>
    </div>
  )
}
