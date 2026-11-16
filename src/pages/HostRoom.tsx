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
  const urgent = secs <= 5

  function copyLink() {
    navigator.clipboard?.writeText(shareLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-[#121216]/90 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="leading-tight">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500">Mã phòng</p>
            <p className="font-mono text-2xl font-bold tracking-[0.18em] text-violet-300 sm:text-3xl">{state.code}</p>
          </div>
          <Button variant="outline" size="sm" onClick={copyLink} aria-label="Sao chép liên kết phòng">
            <IconCopy width={16} height={16} />
            {copied ? 'Đã sao chép' : 'Sao chép liên kết'}
          </Button>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-sm font-semibold text-zinc-100">
          <IconUsers width={16} height={16} /> {state.players.length} học sinh
        </span>
      </div>

      {err && <ErrorNote>{err}</ErrorNote>}

      {state.phase === 'lobby' && (
        <Card className="fade-up relative overflow-hidden p-0 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_45%)]" />
          <div className="relative space-y-6 px-6 py-10 sm:px-10 sm:py-12">
            <div>
              <p className="text-sm font-semibold tracking-[0.22em] text-zinc-500">Mã tham gia</p>
              <p className="mt-3 font-mono text-6xl font-bold tracking-[0.14em] text-white sm:text-7xl lg:text-8xl">
                {state.code}
              </p>
            </div>
            <p className="mx-auto max-w-xl text-base text-zinc-400">
              Học sinh truy cập trang web, chọn <b className="text-zinc-200">“Tôi là học sinh”</b>, nhập <b className="font-mono text-violet-300">mã 6 số</b> và tên để vào phòng.
            </p>
            <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              {state.players.length === 0 ? (
                <EmptyState title="Chưa có học sinh nào" hint="Hãy chiếu mã phòng này để cả lớp cùng tham gia" />
              ) : (
                <>
                  <p className="mb-3 text-sm font-medium text-zinc-400">Đã vào phòng ({state.players.length})</p>
                  <ul className="flex flex-wrap justify-center gap-2">
                    {state.players.map((p) => (
                      <li
                        key={p.id}
                        className="pop-in rounded-full border border-zinc-700 bg-zinc-800/80 px-3.5 py-1.5 text-sm font-medium text-zinc-200 shadow-sm"
                      >
                        {p.name}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="pt-1">
              <Button variant="primary" size="lg" onClick={() => act('start', 1)} className="min-w-[14rem]">
                Bắt đầu ván chơi
              </Button>
            </div>
          </div>
        </Card>
      )}

      {state.phase === 'question' && q && (
        <Card className="fade-up space-y-5 p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                Câu {q.idx}/{state.total}
              </span>
              <span className="text-sm font-medium text-zinc-400">Đang thu câu trả lời</span>
            </div>
            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${urgent ? 'bg-rose-500/15' : 'bg-zinc-800/80'}`}>
              <span className="text-xs font-semibold tracking-wider text-zinc-400">Còn lại</span>
              <span
                className={`font-mono text-3xl font-bold leading-none ${urgent ? 'text-rose-400 timer-pulse' : 'text-white'}`}
                aria-hidden
              >
                {secs}s
              </span>
            </div>
          </div>
          <div aria-hidden className="h-3 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-inset ring-zinc-700/70">
            <div
              className={`h-full rounded-full transition-all duration-200 ${urgent ? 'bg-rose-500' : 'bg-violet-500'}`}
              style={{ width: `${Math.max(0, Math.min(100, (remaining / (q.seconds * 1000)) * 100))}%` }}
            />
          </div>
          <h1 className="text-center text-2xl font-bold leading-snug text-white sm:text-4xl lg:text-5xl">{q.body}</h1>
          <div className="grid gap-3 sm:grid-cols-2">
            {[q.a, q.b, q.c, q.d].map((text, i) => {
              const { bg, fg } = choiceStyle(i, 'normal')
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-4 rounded-2xl p-4 shadow-sm sm:p-5 ${bg} ${fg}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/15 text-sm font-bold"
                    >
                      {CHOICE_LABELS[i]}
                    </span>
                    <span className="min-w-0 break-words font-semibold sm:text-lg lg:text-xl">{text}</span>
                  </span>
                  <span className="shrink-0 rounded-xl bg-black/15 px-3 py-1.5 text-xl font-bold tabular-nums sm:text-2xl">
                    {choiceCount[i]}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex flex-col items-center gap-4 pt-1 sm:flex-row sm:justify-between">
            <p className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300">
              <IconUsers width={16} height={16} />
              Đã trả lời: <b className="text-white">{answeredCount}/{state.players.length}</b>
              <span className="text-zinc-500">· cập nhật ~3 giây</span>
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
          </div>
        </Card>
      )}

      {state.phase === 'reveal' && q && (
        <Card className="fade-up space-y-5 p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-1.5 text-emerald-300 ring-1 ring-emerald-500/30">
              <IconCheck width={15} height={15} />
              Đáp án đúng: {CHOICE_LABELS[q.correct ?? 0]}
            </span>
            <span className="rounded-full bg-zinc-800 px-3 py-1.5 text-zinc-300">
              Câu {q.idx}/{state.total}
            </span>
          </div>
          <h1 className="text-center text-2xl font-bold leading-snug text-white sm:text-4xl lg:text-5xl">{q.body}</h1>
          <div className="grid gap-3 sm:grid-cols-2">
            {[q.a, q.b, q.c, q.d].map((text, i) => {
              const mode = q.correct === i ? 'correct' : 'normal'
              const { bg, fg } = choiceStyle(i, mode)
              const correct = q.correct === i
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-4 rounded-2xl p-4 shadow-sm transition-all sm:p-5 ${bg} ${fg} ${correct ? 'ring-4 ring-white/30' : 'opacity-80'}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/15 text-sm font-bold"
                    >
                      {CHOICE_LABELS[i]}
                    </span>
                    <span className="min-w-0 break-words font-semibold sm:text-lg lg:text-xl">{text}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {correct && <IconCheck width={22} height={22} />}
                    <span className="rounded-xl bg-black/15 px-3 py-1.5 text-xl font-bold tabular-nums sm:text-2xl">
                      {choiceCount[i]}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
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
        <Card className="fade-up space-y-5 p-8 text-center sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
            <IconTrophy width={34} height={34} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Ván chơi đã kết thúc</h1>
            <p className="mt-2 text-zinc-400">
              Tổng hợp điểm và thống kê của <b className="text-zinc-200">{state.players.length}</b> học sinh · <b className="text-zinc-200">{state.total}</b> câu hỏi
            </p>
          </div>
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
