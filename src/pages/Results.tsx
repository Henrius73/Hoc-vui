import { Link, useParams } from 'react-router'
import { hostToken } from '../lib/store'
import { downloadCsv } from '../lib/csv'
import { CHOICE_LABELS, choiceStyle, type HostState } from '../lib/types'
import { useRoomState } from '../hooks/useRoomState'
import { Button, Card, EmptyState, ErrorNote, Loading, btnClass } from '../components/ui'
import { IconDownload } from '../components/icons'

const RANK_TONE = [
  'bg-amber-400 text-amber-950',
  'bg-slate-300 text-slate-800',
  'bg-orange-300 text-orange-900',
]
const RANK_REST = 'bg-slate-100 text-slate-600'

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  )
}

export default function Results() {
  const { code = '' } = useParams()
  const { state, error, refresh } = useRoomState<HostState>(code, {
    host: true,
    hostToken: hostToken(),
  })

  if (error && !state) {
    return (
      <div className="mx-auto max-w-md space-y-3 px-4 py-16 text-center">
        <ErrorNote>{error}</ErrorNote>
        <Button variant="outline" onClick={refresh}>
          Thử lại
        </Button>
        <div>
          <Link to="/host" className={btnClass('outline')}>
            Quay lại thư viện
          </Link>
        </div>
      </div>
    )
  }
  if (!state) return <Loading label="Đang tải kết quả..." />

  const stats = state.stats
  const hasAnswers = state.per_question.some((x) => x.answered > 0)
  const topScore = state.players.length ? state.players[0].score : 0
  const avg = state.players.length
    ? Math.round(state.players.reduce((sum, p) => sum + p.score, 0) / state.players.length)
    : 0

  function exportCsv() {
    const rows: (string | number)[][] = [
      [`Kết quả phòng ${state!.code}`],
      [],
      ['Tên học sinh', 'Tổng điểm', 'Số câu trả lời', 'Số câu đúng', 'Số câu sai', 'Bỏ qua'],
      ...state!.players.map((p) => [
        p.name,
        p.score,
        p.answered ?? 0,
        p.correct ?? 0,
        (p.answered ?? 0) - (p.correct ?? 0),
        state!.total - (p.answered ?? 0),
      ]),
      [],
      ['Câu hỏi', 'Số người trả lời', 'Số câu trả lời đúng'],
      ...state!.per_question.map((x) => [x.idx, x.answered, x.correct]),
    ]
    downloadCsv(`ket-qua-phong-${state!.code}`, rows)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bảng tổng hợp</h1>
          <p className="mt-1 text-sm text-slate-600">
            Phòng <b className="font-mono text-base">{state.code}</b> ·{' '}
            {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="success" onClick={exportCsv} disabled={state.players.length === 0}>
            <IconDownload width={16} height={16} /> Tải file điểm (CSV)
          </Button>
          <Link to="/host" className={btnClass('outline')}>
            Thư viện
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Học sinh" value={state.players.length} />
        <Kpi label="Số câu" value={state.total} />
        <Kpi label="Điểm cao nhất" value={topScore} />
        <Kpi label="Điểm trung bình" value={avg} />
      </div>

      {/* Bảng tổng hợp */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th scope="col" className="p-3 font-semibold">#</th>
                <th scope="col" className="p-3 font-semibold">Tên học sinh</th>
                <th scope="col" className="p-3 text-right font-semibold">Điểm</th>
                <th scope="col" className="p-3 text-right font-semibold">Đúng</th>
                <th scope="col" className="p-3 text-right font-semibold">Sai</th>
                <th scope="col" className="p-3 text-right font-semibold">Bỏ qua</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {state.players.map((p, i) => {
                const correct = p.correct ?? 0
                const answered = p.answered ?? 0
                return (
                  <tr key={p.id} className={i < 3 ? 'bg-amber-50/60' : i % 2 ? 'bg-slate-50' : ''}>
                    <td className="p-3">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                          i < 3 ? RANK_TONE[i] : RANK_REST
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-right font-bold text-indigo-700">{p.score}</td>
                    <td className="p-3 text-right font-medium text-emerald-700">{correct}</td>
                    <td className="p-3 text-right text-rose-700">{answered - correct}</td>
                    <td className="p-3 text-right text-slate-500">{state.total - answered}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {state.players.length === 0 && (
          <EmptyState title="Chưa có học sinh nào trong phòng" hint="Học sinh vào bằng mã phòng trước khi ván bắt đầu." />
        )}
      </Card>

      {/* Thống kê theo câu */}
      {hasAnswers && (
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Thống kê trả lời đúng theo từng câu</h2>
          <ul className="space-y-2.5 text-sm">
            {state.per_question.map((x) => {
              const pct = state.players.length ? (x.correct / state.players.length) * 100 : 0
              return (
                <li key={x.idx} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 font-medium">Câu {x.idx}</span>
                  <div
                    aria-hidden
                    className="h-4 flex-1 overflow-hidden rounded-full bg-slate-200"
                  >
                    <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-28 shrink-0 text-right text-slate-600">
                    {x.correct}/{state.players.length} đúng
                  </span>
                </li>
              )
            })}
          </ul>

          {stats.length > 0 && state.question && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Phân bố lựa chọn — câu {state.question.idx}
                {state.phase === 'reveal' && (
                  <span className="ml-2 normal-case text-emerald-700">
                    (đáp án đúng: {CHOICE_LABELS[state.question.correct ?? 0]})
                  </span>
                )}
              </h3>
              <ul className="space-y-2">
                {[0, 1, 2, 3].map((i) => {
                  const n = stats.filter((s) => s.choice === i).length
                  const ok = stats.filter((s) => s.choice === i && s.correct).length
                  const pct = state.players.length ? (n / state.players.length) * 100 : 0
                  const { bg } = choiceStyle(i, 'normal')
                  return (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="w-6 shrink-0 font-bold">{CHOICE_LABELS[i]}</span>
                      <div aria-hidden className="h-4 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div className={`h-full rounded-full ${bg}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-32 shrink-0 text-right text-slate-600">
                        {n} người
                        {state.phase === 'reveal' && ` · ${ok} đúng`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
