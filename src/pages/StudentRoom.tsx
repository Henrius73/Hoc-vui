import { useState, type CSSProperties } from 'react'
import { useParams, Navigate } from 'react-router'
import { rpc } from '../lib/supabase'
import { getPlayer } from '../lib/store'
import { CHOICE_LABELS, choiceStyle, type RoomState } from '../lib/types'
import { useRoomState } from '../hooks/useRoomState'
import { useRemainingMs } from '../hooks/useRemainingMs'
import { Button, Card, ErrorNote, Loading } from '../components/ui'
import { IconCheck, IconClock, IconTrophy, IconX } from '../components/icons'

const RANK_TONE = [
  'bg-amber-400 text-amber-950 ring-1 ring-amber-500/30',
  'bg-slate-300 text-slate-800 ring-1 ring-slate-400/30',
  'bg-orange-300 text-orange-900 ring-1 ring-orange-400/30',
]
const RANK_REST = 'bg-slate-100 text-slate-600'

export default function StudentRoom() {
  const { code = '' } = useParams()
  const player = getPlayer(code)
  if (!player) return <Navigate to={`/join?code=${code}`} replace />
  return <PlayerRoom code={code} player={player} />
}

function PlayerRoom({
  code,
  player,
}: {
  code: string
  player: { id: string; name: string }
}) {
  const { state, error, refresh } = useRoomState<RoomState>(code, {
    playerId: player.id,
    pollMs: 3000,
  })
  const [sentFor, setSentFor] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const remaining = useRemainingMs(state?.server_now, state?.question ?? null)

  async function submit(choice: number) {
    if (!state || state.phase !== 'question' || answered) return
    setSentFor(state.q_index)
    setErr(null)
    try {
      await rpc<boolean>('submit_answer', {
        p_code: code,
        p_player: player.id,
        p_q_index: state.q_index,
        p_choice: choice,
      })
      refresh()
    } catch (e) {
      setErr((e as Error).message)
      setSentFor(null)
    }
  }

  if (!state) {
    return error ? (
      <div className="mx-auto max-w-md space-y-3 px-4 py-16 text-center">
        <ErrorNote>{error}</ErrorNote>
        <Button variant="outline" onClick={refresh}>
          Thử lại
        </Button>
      </div>
    ) : (
      <Loading label="Đang vào phòng..." />
    )
  }

  const answered = state.mine?.answered || sentFor === state.q_index
  const myScore = state.players.find((p) => p.id === player.id)?.score ?? 0

  if (state.phase === 'lobby') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Card className="fade-up overflow-hidden p-0 text-center">
          <div className="border-b border-slate-100 bg-gradient-to-b from-indigo-50/70 to-white px-6 py-8 sm:px-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
              <IconClock width={26} height={26} />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Đang chờ bắt đầu</h1>
            <p className="mt-2 text-sm text-slate-600">
              Phòng <b className="rounded-md bg-white px-2 py-0.5 font-mono text-base text-slate-900 ring-1 ring-slate-200">{state.code}</b>
              {' · '}Bạn là <b className="text-slate-900">{player.name}</b>
            </p>
          </div>
          <div className="px-6 py-6 sm:px-10">
            <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" aria-hidden />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
              </span>
              {state.players.length} người đã vào phòng
            </div>
            <ul className="flex flex-wrap justify-center gap-2">
              {state.players.map((p) => (
                <li
                  key={p.id}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                    p.id === player.id
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {p.name}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-slate-500">Giáo viên sẽ bắt đầu ván chơi trong giây lát…</p>
          </div>
        </Card>
      </div>
    )
  }

  if (state.phase === 'finished') {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-center sm:px-6">
        <div className="fade-up">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600 ring-8 ring-amber-50">
            <IconTrophy width={34} height={34} />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Hoàn thành!</h1>
          <p className="mt-1 text-slate-600">Ván chơi đã kết thúc</p>
        </div>
        <Card className="fade-up overflow-hidden p-0">
          <div className="bg-gradient-to-b from-indigo-50/60 to-white px-6 py-6">
            <p className="text-sm font-medium text-slate-500">Điểm của bạn</p>
            <p className="mt-1 text-6xl font-bold tracking-tight text-indigo-700">{myScore}</p>
            <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
              Đúng {state.mine?.my_correct ?? 0}/{state.total} câu
            </p>
          </div>
          <div className="border-t border-slate-100 p-5 text-left sm:p-6">
            <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Bảng xếp hạng</h2>
            <ol className="space-y-2">
              {state.players.map((p, i) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    p.id === player.id
                      ? 'bg-indigo-50 font-semibold text-indigo-900 ring-1 ring-indigo-200/70'
                      : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      i < 3 ? RANK_TONE[i] : RANK_REST
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="font-bold tabular-nums">{p.score} đ</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      </div>
    )
  }

  const q = state.question
  if (!q) return <Loading label="Đang tải câu hỏi..." />

  const reveal = state.phase === 'reveal'
  const secs = Math.ceil(remaining / 1000)
  const pct = Math.max(0, Math.min(100, (remaining / (q.seconds * 1000)) * 100))
  const urgent = secs <= 5

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      {/* Thanh thông tin */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            Câu {q.idx}/{state.total}
          </span>
          <span aria-hidden className="hidden items-center gap-1 sm:flex">
            {Array.from({ length: state.total }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 === q.idx
                    ? 'w-7 bg-indigo-600'
                    : i + 1 < q.idx
                      ? 'w-1.5 bg-indigo-300'
                      : 'w-1.5 bg-slate-300'
                }`}
              />
            ))}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">
          {player.name} <span className="text-slate-400">·</span> <span className="text-indigo-700">{myScore} đ</span>
        </span>
      </div>

      {/* Đồng hồ */}
      {!reveal && (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className={`inline-flex items-center gap-1.5 ${urgent ? 'text-rose-700 timer-pulse' : 'text-slate-700'}`}>
              <IconClock width={16} height={16} /> Còn {secs}s
            </span>
            <span className="text-xs font-medium text-slate-400 sm:text-sm">Hết giờ sẽ khóa trả lời</span>
          </div>
          <div aria-hidden className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70">
            <div
              className={`h-full rounded-full transition-all duration-200 ${urgent ? 'bg-rose-500' : 'bg-indigo-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Câu hỏi */}
      <Card key={q.idx} className="fade-up relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
        <h1 className="text-center text-xl font-semibold leading-snug text-slate-900 sm:text-2xl lg:text-[1.7rem]">
          {q.body}
        </h1>
      </Card>

      {/* Lựa chọn */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[q.a, q.b, q.c, q.d].map((text, i) => {
          const mode = reveal && q.correct === i ? 'correct' : reveal && state.mine?.choice === i ? 'wrong' : 'normal'
          const { bg, fg } = choiceStyle(i, mode)
          const mine = !reveal && state.mine?.choice === i
          return (
            <button
              key={i}
              onClick={() => submit(i)}
              disabled={reveal || state.phase !== 'question' || answered}
              className={`pop-in group flex min-h-[4.5rem] items-center gap-3 rounded-2xl px-4 py-3.5 text-left shadow-sm transition-all duration-200 ease-out disabled:cursor-default sm:text-lg ${bg} ${fg} ${
                mine ? 'ring-4 ring-slate-900/20 ring-offset-2 ring-offset-transparent' : ''
              } ${!reveal && state.phase === 'question' && !answered ? 'active:scale-[0.985] hover:-translate-y-0.5 hover:shadow-lg' : ''}`}
              style={{ animationDelay: `${i * 45}ms` } as CSSProperties}
            >
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/15 text-sm font-bold backdrop-blur-[1px]"
              >
                {CHOICE_LABELS[i]}
              </span>
              <span className="min-w-0 flex-1 font-semibold leading-snug">{text}</span>
              {mode === 'correct' && <IconCheck className="shrink-0" width={22} height={22} />}
              {mode === 'correct' && <span className="sr-only">Đáp án đúng.</span>}
              {mode === 'wrong' && <IconX className="shrink-0" width={22} height={22} />}
              {mode === 'wrong' && <span className="sr-only">Lựa chọn của bạn (sai).</span>}
            </button>
          )
        })}
      </div>

      {err && <ErrorNote>{err}</ErrorNote>}

      {state.phase === 'question' && answered && !err && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
          </span>
          Đã ghi nhận câu trả lời — chờ giáo viên công bố đáp án
        </div>
      )}

      {reveal && (
        <Card className="fade-up space-y-4 p-5 sm:p-6">
          <div className="text-center">
            {state.mine?.answered ? (
              state.mine.is_correct ? (
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 font-bold text-emerald-800 ring-1 ring-emerald-200">
                  <IconCheck width={20} height={20} /> Chính xác! +{state.mine.points} điểm
                </p>
              ) : (
                <p className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 font-bold text-rose-800 ring-1 ring-rose-200">
                  <IconX width={20} height={20} /> Chưa đúng — 0 điểm
                </p>
              )
            ) : (
              <p className="inline-flex rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-600">
                Bạn chưa trả lời câu này
              </p>
            )}
          </div>
          <div>
            <h2 className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Bảng xếp hạng tạm thời
            </h2>
            <ol className="space-y-1.5">
              {state.players.slice(0, 8).map((p, i) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                    p.id === player.id
                      ? 'bg-indigo-50 font-semibold text-indigo-900 ring-1 ring-indigo-200/70'
                      : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                      i < 3 ? RANK_TONE[i] : RANK_REST
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="font-bold tabular-nums">{p.score} đ</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      )}
    </div>
  )
}