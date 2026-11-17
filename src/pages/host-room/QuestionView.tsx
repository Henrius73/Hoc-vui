import type { Question } from '../../lib/types'
import { Button, Card } from '../../components/ui'
import { ChoiceGrid } from '../../components/ChoiceGrid'
import { TimerBar } from '../../components/TimerBar'
import { QuestionProgress } from '../../components/QuestionProgress'
import { IconUsers } from '../../components/icons'

export function QuestionView({
  question,
  total,
  playerCount,
  answeredCount,
  choiceCounts,
  remainingMs,
  busy,
  onReveal,
  onFinishRequest,
}: {
  question: Question
  total: number
  playerCount: number
  answeredCount: number
  choiceCounts: number[]
  remainingMs: number
  busy: boolean
  onReveal: () => void
  onFinishRequest: () => void
}) {
  const secs = Math.ceil(remainingMs / 1000)
  const urgent = secs <= 5

  return (
    <Card className="fade-up space-y-5 p-5 sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <QuestionProgress current={question.idx} total={total} className="w-full max-w-[16rem]" />
          <span className="text-sm font-medium text-muted">Đang thu câu trả lời</span>
        </div>
        <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${urgent ? 'bg-rose-500/15' : 'bg-elevated/80'}`}>
          <span className="text-xs font-semibold tracking-wider text-muted">Còn lại</span>
          <span
            className={`font-mono text-3xl font-bold leading-none ${urgent ? 'text-tone-rose timer-pulse' : 'text-ink'}`}
            aria-hidden
          >
            {secs}s
          </span>
        </div>
      </div>

      <TimerBar remainingMs={remainingMs} totalSeconds={question.seconds} />

      <h1 className="text-center text-2xl font-bold leading-snug text-ink sm:text-4xl lg:text-5xl">
        {question.body}
      </h1>

      <ChoiceGrid question={question} reveal={false} counts={choiceCounts} />

      <div className="flex flex-col items-center gap-4 pt-1 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3 rounded-full border border-line-strong bg-elevated/60 px-4 py-2 text-sm font-medium text-ink-soft">
          <IconUsers width={16} height={16} />
          <span>
            Đã trả lời: <b className="text-ink">{answeredCount}/{playerCount}</b>
          </span>
          {playerCount > 0 && (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="h-2 w-16 overflow-hidden rounded-full bg-line-strong">
                <span
                  className="block h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (answeredCount / playerCount) * 100)}%` }}
                />
              </span>
              <span className="text-xs font-semibold tabular-nums text-tone-emerald">
                {Math.round((answeredCount / playerCount) * 100)}%
              </span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="amber" size="lg" onClick={onReveal} disabled={busy}>
            Công bố đáp án
          </Button>
          <Button variant="danger" size="lg" onClick={onFinishRequest} disabled={busy}>
            Kết thúc ván
          </Button>
        </div>
      </div>
    </Card>
  )
}
