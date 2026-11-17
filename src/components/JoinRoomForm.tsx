import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { rpc } from '../lib/supabase'
import { getLastPlayerName, getPlayer, setLastPlayerName, setPlayer } from '../lib/store'
import { Button, ErrorNote } from './ui'

export function JoinRoomForm({
  initialCode = '',
  autoFocusCode = false,
}: {
  initialCode?: string
  autoFocusCode?: boolean
}) {
  const nav = useNavigate()
  const [code, setCode] = useState(initialCode.replace(/\D/g, '').slice(0, 6))
  const [name, setName] = useState(() => getLastPlayerName())
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const trimmedCode = code.trim()
  const existing = /^\d{6}$/.test(trimmedCode) ? getPlayer(trimmedCode) : null

  async function join(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(trimmedCode)) {
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
      const id = await rpc<string>('join_room', { p_code: trimmedCode, p_name: n })
      setPlayer(trimmedCode, id, n)
      nav(`/room/${trimmedCode}`)
    } catch (error) {
      setErr((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={join} className="space-y-4">
      {existing && (
        <div className="fade-up space-y-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3.5 text-sm text-violet-100">
          <p>
            Bạn đã từng vào phòng <b>{trimmedCode}</b> với tên <b>{existing.name}</b>.
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => nav(`/room/${trimmedCode}`)}
          >
            Vào lại ngay với tên {existing.name}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Mã phòng 6 số</span>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              if (err) setErr(null)
            }}
            inputMode="numeric"
            autoComplete="off"
            autoFocus={autoFocusCode}
            placeholder="000000"
            aria-label="Mã phòng 6 chữ số"
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface-2 px-3 py-3 text-center font-mono text-3xl font-bold tracking-[0.35em] text-ink placeholder:text-subtle transition-colors focus:border-violet-500 focus:ring-0"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">
            {existing ? 'Hoặc nhập tên mới để tham gia lại' : 'Tên của bạn'}
          </span>
          <input
            value={name}
            onChange={(e) => {
              const next = e.target.value.slice(0, 20)
              setName(next)
              setLastPlayerName(next)
              if (err) setErr(null)
            }}
            placeholder="Ví dụ: Minh An"
            maxLength={20}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface-2 px-3.5 py-3 text-ink placeholder:text-subtle transition-colors focus:border-violet-500 focus:ring-0"
          />
          <span className="mt-1.5 block text-xs text-subtle">Tối đa 20 ký tự, hiển thị với cả lớp</span>
        </label>
      </div>

      {err && <ErrorNote>{err}</ErrorNote>}

      <Button type="submit" variant="success" size="lg" disabled={busy} className="w-full">
        {busy ? 'Đang vào phòng...' : 'Vào phòng ngay'}
      </Button>
    </form>
  )
}
