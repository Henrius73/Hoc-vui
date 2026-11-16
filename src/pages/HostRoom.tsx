import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { rpc } from '../lib/supabase'
import { hostToken } from '../lib/store'
import { CHOICE_LABELS, choiceStyle, type HostState } from '../lib/types'
import { useRoomState } from '../hooks/useRoomState'
import { useRemainingMs } from '../hooks/useRemainingMs'
import { Button, Card, EmptyState, ErrorNote, Loading, btnClass } from '../components/ui'
import { IconCheck, IconCopy, IconTrophy, IconUsers } from '../components/icons'

export default function HostRoom() {
  const { code = '' } = useParams()
  const nav = useNavigate()
  const { state, error, refresh } = useRoomState<HostState>(code, {
    host: true,
    hostToken: hostToken(),
    pollMs: 2000,
  })
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const remaining = useRemainingMs(state?.server_now, state?.question ?? null)

  async function act(action: 'start' | 'reveal' | 'next' | 'finish', qi?: number) {
    setErr(null)
    try {
      await rpc<boolean>('host_action', {
        p_host: hostToken(),
        p_code: code,
        p_action: action,
        p_q_index: qi ?? null,
      })
      refresh()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  if (error && !state) {
    return (
      <div className="mx-auto max-w-md space-y-3 px-4 py-16 text-center">
        <ErrorNote>{error}</ErrorNote>
        <Link to="/host" className={btnClass('outline')}>
          Quay lại thư viện
        </Link>
      </div>
    )
  }
  if (!state) return <Loading label="Đang tải phòng..." />

  const q = state.question
  const isLast = state.q_index >= state.total
  const answeredCount = state.stats.length
  const choiceCount = [0, 0, 0, 0]
  state.stats.forEach((s) => (choiceCount[s.choice] += 1))
  const shareLink = `${window.location.origin}/#/join?code=${state.code}`
  const secs = Math.ceil(remaining / 1000)

  function copyLink() {
    navigator.clipboard?.writeText(shareLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-5">
      {/* Thanh mã phòng */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Mã phòng
          </span>
          <span className="font-mono text-3xl font-bold tracking-widest text-indigo-700">
            {state.code}
          </span>
          <Button variant="outline" size="sm" onClick={copyLink} aria-label="Sao chép liên kết phòng">
            <IconCopy width={16} height={16} />
            {copied ? 'Đã copy' : 'Copy liên kết'}
          </Button>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
          <IconUsers width={16} height={16} /> {state.players.length} học sinh
        </span>
      </div>

      {err && <ErrorNote>{err}</ErrorNote>}

      {state.phase === 'lobby' && (
        <Card className="fade-up space-y-5 p-6 text-center sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Mã vào phòng
            </p>
            <p className="mt-2 font-mono text-6xl font-bold tracking-[0.12em] text-indigo-700 sm:text-7xl">
              {state.code}
            </p>
          </div>
          <p className="mx-auto max-w-lg text-slate-600">
            Học sinh mở trang, chọn <b>“Tôi là học sinh”</b>, nhập{' '}
            <b className="font-mono">mã 6 số</b> ở trên và tên để vào phòng.
          </p>
          {state.players.length === 0 ? (
            <EmptyState title="Chưa có học sinh nào vào phòng" hint="Chia sẻ mã phòng cho lớp" />
          ) : (
            <ul className="flex flex-wrap justify-center gap-2">
              {state.players.map((p) => (
                <li
                  key={p.id}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm"
                >
                  {p.name}
                </li>
              ))}
            </ul>
          )}
          <Button variant="primary" size="lg" onClick={() => act('start', 1)}>
            Bắt đầu ván chơi
          </Button>
        </Card>
      )}

      {state.phase === 'question' && q && (
        <Card className="fade-up space-y-4 p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-600">
              Câu {q.idx}/{state.total}
            </h2>
            <span
              className={`font-mono text-3xl font-bold ${secs <= 5 ? 'text-rose-700 timer-pulse' : 'text-slate-900'}`}
              aria-hidden
            >
              {secs}s
            </span>
          </div>
          <div aria-hidden className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-200 ${secs <= 5 ? 'bg-rose-600' : 'bg-indigo-600'}`}
              style={{ width: `${Math.max(0, Math.min(100, (remaining / (q.seconds * 1000)) * 100))}%` }}
            />
          </div>
          <h1 className="text-center text-2xl font-bold leading-snug sm:text-4xl">{q.body}</h1>
          <div className="grid gap-3 sm:grid-cols-2">
            {[q.a, q.b, q.c, q.d].map((text, i) => {
              const { bg, fg } = choiceStyle(i, 'normal')
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 rounded-xl p-4 sm:p-5 ${bg} ${fg}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/15 text-sm font-bold"
                    >
                      {CHOICE_LABELS[i]}
                    </span>
                    <span className="min-w-0 break-words font-semibold sm:text-lg">{text}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-black/15 px-3 py-1 text-lg font-bold">
                    {choiceCount[i]}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <IconUsers width={16} height={16} />
            Đã trả lời: <b>{answeredCount}/{state.players.length}</b>
            <span className="text-slate-400">· cập nhật tối đa ~3 giây</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="amber" size="lg" onClick={() => act('reveal')}>
              Công bố đáp án
            </Button>
            <Button
              variant="danger"
              size="lg"
              onClick={() => {
                if (confirm('Kết thúc ván ngay?')) act('finish')
              }}
            >
              Kết thúc ván
            </Button>
          </div>
        </Card>
      )}

      {state.phase === 'reveal' && q && (
        <Card className="fade-up space-y-4 p-5 sm:p-7">
          <p className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-emerald-800">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1">
              <IconCheck width={15} height={15} />
              Đáp án đúng: {CHOICE_LABELS[q.correct ?? 0]}
            </span>
            <span className="text-slate-500">
              Câu {q.idx}/{state.total}
            </span>
          </p>
          <h1 className="text-center text-2xl font-bold leading-snug sm:text-4xl">{q.body}</h1>
          <div className="grid gap-3 sm:grid-cols-2">
            {[q.a, q.b, q.c, q.d].map((text, i) => {
              const mode = q.correct === i ? 'correct' : 'normal'
              const { bg, fg } = choiceStyle(i, mode)
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 rounded-xl p-4 sm:p-5 ${bg} ${fg}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/15 text-sm font-bold"
                    >
                      {CHOICE_LABELS[i]}
                    </span>
                    <span className="min-w-0 break-words font-semibold sm:text-lg">{text}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {mode === 'correct' && <IconCheck width={20} height={20} />}
                    <span className="rounded-full bg-black/15 px-3 py-1 text-lg font-bold">
                      {choiceCount[i]}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {!isLast && (
              <Button variant="primary" size="lg" onClick={() => act('next')}>
                Câu tiếp theo →
              </Button>
            )}
            <Button variant="dark" size="lg" onClick={() => act('finish')}>
              Kết thúc &amp; tổng kết
            </Button>
          </div>
        </Card>
      )}

      {state.phase === 'finished' && (
        <Card className="fade-up space-y-4 p-8 text-center">
          <IconTrophy width={52} height={52} className="mx-auto text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Ván đã kết thúc</h1>
          <p className="text-slate-600">
            Tổng hợp điểm và thống kê của {state.players.length} học sinh · {state.total} câu hỏi
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="primary" size="lg" onClick={() => nav(`/host/results/${state.code}`)}>
              Xem bảng tổng hợp
            </Button>
            <Link to="/host" className={btnClass('outline', 'lg')}>
              Về thư viện
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
