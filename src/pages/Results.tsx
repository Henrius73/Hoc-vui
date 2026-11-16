import { Link, useParams } from 'react-router'
import { hostToken } from '../lib/store'
import { downloadResultsExcel } from '../lib/excel'
import { CHOICE_LABELS, choiceStyle, type HostState } from '../lib/types'
import { useRoomState } from '../hooks/useRoomState'
import { Button, Card, ConnectionBanner, EmptyState, Loading, PageHeader, btnClass } from '../components/ui'
import { RANK_REST, RANK_TONE } from '../components/Leaderboard'
import { RoomErrorView } from '../components/RoomErrorView'
import { IconDownload } from '../components/icons'

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card className="relative overflow-hidden p-4 sm:p-5">
      <div aria-hidden className={`absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full blur-2xl ${accent ?? 'bg-violet-500/20'}`} />
      <p className="relative text-xs font-semibold tracking-wide text-zinc-400">{label}</p>
      <p className="relative mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">{value}</p>
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
    return <RoomErrorView error={error} onRetry={refresh} backTo="/host" backLabel="Quay lại thư viện" />
  }
  if (!state) return <Loading label="Đang tải kết quả..." />

  const stats = state.stats
  const hasAnswers = state.per_question.some((x) => x.answered > 0)
  const topScore = state.players.length ? state.players[0].score : 0
  const avg = state.players.length
    ? Math.round(state.players.reduce((sum, p) => sum + p.score, 0) / state.players.length)
    : 0

  async function exportExcel() {
    const summary: (string | number)[][] = [
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
    ]
    const perQuestion: (string | number)[][] = [
      ['Câu hỏi', 'Số người trả lời', 'Số câu trả lời đúng'],
      ...state!.per_question.map((x) => [x.idx, x.answered, x.correct]),
    ]
    await downloadResultsExcel(`ket-qua-phong-${state!.code}`, summary, perQuestion)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Kết quả ván chơi"
        title="Bảng tổng hợp"
        desc={`Phòng ${state.code} · ${state.total} câu hỏi`}
        action={
          <>
            <Button variant="success" onClick={exportExcel} disabled={state.players.length === 0}>
              <IconDownload width={16} height={16} /> Tải Excel
            </Button>
            <Link to="/host" className={btnClass('outline')}>
              Thư viện
            </Link>
          </>
        }
      />

      {error && <ConnectionBanner message={error} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Học sinh" value={state.players.length} accent="bg-sky-500/20" />
        <Kpi label="Số câu" value={state.total} accent="bg-violet-500/20" />
        <Kpi label="Điểm cao nhất" value={topScore} accent="bg-amber-500/20" />
        <Kpi label="Điểm trung bình" value={avg} accent="bg-emerald-500/20" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-zinc-800 bg-zinc-900/40 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-white">Xếp hạng học sinh</h2>
          <p className="mt-0.5 text-sm text-zinc-400">Sắp xếp theo tổng điểm giảm dần</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-transparent text-left text-zinc-400">
              <tr className="border-b border-zinc-800">
                <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Hạng</th>
                <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Tên học sinh</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-6">Điểm</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-6">Đúng</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-6">Sai</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-6">Bỏ qua</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {state.players.map((p, i) => {
                const correct = p.correct ?? 0
                const answered = p.answered ?? 0
                return (
                  <tr key={p.id} className={`transition-colors hover:bg-white/[0.03] ${i < 3 ? 'bg-violet-500/[0.04]' : ''}`}>
                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={`inline-grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                          i < 3 ? RANK_TONE[i] : RANK_REST
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-100 sm:px-6">{p.name}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-violet-300 sm:px-6">{p.score}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-400 sm:px-6">{correct}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-rose-400 sm:px-6">{answered - correct}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-500 sm:px-6">{state.total - answered}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {state.players.length === 0 && (
          <div className="p-6">
            <EmptyState title="Chưa có học sinh nào" hint="Kết quả sẽ hiển thị khi có người tham gia phòng." />
          </div>
        )}
      </Card>

      {hasAnswers && (
        <Card className="space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-white">Tỉ lệ trả lời đúng theo câu</h2>
            <p className="mt-0.5 text-sm text-zinc-400">So với tổng số học sinh trong phòng</p>
          </div>
          <ul className="space-y-3 text-sm">
            {state.per_question.map((x) => {
              const pct = state.players.length ? (x.correct / state.players.length) * 100 : 0
              return (
                <li key={x.idx} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 font-semibold text-zinc-300">Câu {x.idx}</span>
                  <div aria-hidden className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-inset ring-zinc-700/70">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-28 shrink-0 text-right font-medium tabular-nums text-zinc-400">
                    {x.correct}/{state.players.length} đúng
                  </span>
                </li>
              )
            })}
          </ul>

          {stats.length > 0 && state.question && (
            <div className="border-t border-zinc-800 pt-5">
              <h3 className="mb-3 text-sm font-semibold tracking-wide text-zinc-400">
                Phân bố lựa chọn — câu {state.question.idx}
                {state.phase === 'reveal' && (
                  <span className="ml-2 font-semibold text-emerald-400">
                    (đúng: {CHOICE_LABELS[state.question.correct ?? 0]})
                  </span>
                )}
              </h3>
              <ul className="space-y-2.5">
                {[0, 1, 2, 3].map((i) => {
                  const n = stats.filter((s) => s.choice === i).length
                  const ok = stats.filter((s) => s.choice === i && s.correct).length
                  const pct = state.players.length ? (n / state.players.length) * 100 : 0
                  const { bg } = choiceStyle(i, 'normal')
                  return (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-zinc-800 font-bold text-zinc-200">
                        {CHOICE_LABELS[i]}
                      </span>
                      <div aria-hidden className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-inset ring-zinc-700/70">
                        <div className={`h-full rounded-full ${bg}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-36 shrink-0 text-right font-medium tabular-nums text-zinc-400">
                        {n} người{state.phase === 'reveal' ? ` · ${ok} đúng` : ''}
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
