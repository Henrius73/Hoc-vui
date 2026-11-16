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
  'bg-amber-400 text-amber-950',
  'bg-slate-300 text-slate-800',
  'bg-orange-300 text-orange-900',
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
      <div className="mx-auto max-w-xl px-4 py-10">
        <Card className="fade-up space-y-5 p-6 text-center sm:p-8">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
            <IconClock width={26} height={26} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Chờ giáo viên bắt đầu...</h1>
          <p className="text-sm text-slate-600">
            Phòng <b className="font-mono text-base">{state.code}</b> · bạn tham gia với tên{' '}
            <b>{player.name}</b>
          </p>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-500">
              Đã vào phòng: {state.players.length} người
            </p>
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
          </div>
        </Card>
      </div>
    )
  }

  if (state.phase === 'finished') {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-10 text-center">
        <div className="fade-up">
          <IconTrophy width={52} height={52} className="mx-auto text-amber-500" />
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Ván đã kết thúc</h1>
        </div>
        <Card className="fade-up p-5">
          <p className="text-sm text-slate-500">Kết quả của bạn</p>
          <p className="mt-1 text-5xl font-bold text-indigo-700">{myScore}</p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            điểm · đúng {state.mine?.my_correct ?? 0}/{state.total} câu
          </p>
        </Card>
        <Card className="fade-up p-4 text-left">
          <h2 className="mb-3 text-center font-semibold">Bảng xếp hạng</h2>
          <ol className="space-y-1.5">
            {state.players.map((p, i) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  p.id === player.id ? 'bg-indigo-50 font-semibold text-indigo-800' : 'bg-slate-50'
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    i < 3 ? RANK_TONE[i] : RANK_REST
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="font-bold">{p.score} đ</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    )
  }

  const q = state.question
  if (!q) return <Loading label="Đang tải câu hỏi..." />

  const reveal = state.phase === 'reveal'
  const secs = Math.ceil(remaining / 1000)
  const pct = Math.max(0, Math.min(100, (remaining / (q.seconds * 1000)) * 100))

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-5">
      {/* Tiến độ + thông tin người chơi */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-600">
            Câu {q.idx}/{state.total}
          </span>
          <span aria-hidden className="hidden items-center gap-1 sm:flex">
            {Array.from({ length: state.total }, (_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i + 1 === q.idx
                    ? 'w-6 bg-indigo-600'
                    : i + 1 < q.idx
                      ? 'w-2 bg-indigo-300'
                      : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
          {player.name} · {myScore} đ
        </span>
      </div>

      {/* Đồng hồ */}
      {!reveal && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className={`inline-flex items-center gap-1.5 ${secs <= 5 ? 'text-rose-700 timer-pulse' : 'text-slate-700'}`}>
              <IconClock width={16} height={16} /> {secs}s
            </span>
            <span className="text-slate-500">Hết giờ sẽ không nhận trả lời</span>
          </div>
          <div aria-hidden className="h-2.5 overflow-hidden rounded-full bg-slate-300">
            <div
              className={`h-full rounded-full transition-all duration-200 ${secs <= 5 ? 'bg-rose-600' : 'bg-indigo-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Câu hỏi */}
      <Card key={q.idx} className="fade-up p-5 sm:p-7">
        <h1 className="text-center text-xl font-semibold leading-snug sm:text-2xl">{q.body}</h1>
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
              className={`pop-in flex min-h-16 items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all duration-200 ease-out disabled:cursor-default sm:text-lg ${bg} ${fg} ${
                mine ? 'ring-4 ring-slate-900/25' : ''
              } ${!reveal && state.phase === 'question' && !answered ? 'active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md' : ''}`}
              style={{ animationDelay: `${i * 40}ms` } as CSSProperties}
            >
              <span
                aria-hidden
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/15 text-sm font-bold"
              >
                {CHOICE_LABELS[i]}
              </span>
              <span className="min-w-0 flex-1 font-semibold">{text}</span>
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
        <p className="text-center font-semibold text-indigo-700">
          Đã trả lời — chờ giáo viên công bố đáp án
        </p>
      )}

      {reveal && (
        <Card className="fade-up space-y-4 p-4 sm:p-5">
          <div className="text-center">
            {state.mine?.answered ? (
              state.mine.is_correct ? (
                <p className="inline-flex items-center gap-2 font-bold text-emerald-700">
                  <IconCheck width={20} height={20} /> Đúng! Bạn được {state.mine.points} điểm
                </p>
              ) : (
                <p className="inline-flex items-center gap-2 font-bold text-rose-700">
                  <IconX width={20} height={20} /> Chưa đúng — bạn được 0 điểm
                </p>
              )
            ) : (
              <p className="font-medium text-slate-500">Bạn không trả lời câu này</p>
            )}
          </div>
          <div>
            <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-wider text-slate-500">
              Xếp hạng
            </h2>
            <ol className="space-y-1.5">
              {state.players.slice(0, 8).map((p, i) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm ${
                    p.id === player.id ? 'bg-indigo-50 font-semibold text-indigo-800' : 'bg-slate-50'
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                      i < 3 ? RANK_TONE[i] : RANK_REST
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="font-bold">{p.score} đ</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      )}
    </div>
  )
}
