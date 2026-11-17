import { CHOICE_LABELS, type Question } from '../../lib/types'
import { Button, Card } from '../../components/ui'
import { ChoiceGrid } from '../../components/ChoiceGrid'
import { QuestionProgress } from '../../components/QuestionProgress'
import { IconCheck } from '../../components/icons'

export function RevealView({
  question,
  total,
  isLast,
  choiceCounts,
  busy,
  onNext,
  onFinish,
}: {
  question: Question
  total: number
  isLast: boolean
  choiceCounts: number[]
  busy: boolean
  onNext: () => void
  onFinish: () => void
}) {
  return (
    <Card className="fade-up space-y-5 p-5 sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-1.5 text-emerald-300 ring-1 ring-emerald-500/30">
          <IconCheck width={15} height={15} />
          Đáp án đúng: {CHOICE_LABELS[question.correct ?? 0]}
        </span>
        <QuestionProgress current={question.idx} total={total} className="w-40" />
      </div>

      <h1 className="text-center text-2xl font-bold leading-snug text-ink sm:text-4xl lg:text-5xl">
        {question.body}
      </h1>

      <ChoiceGrid question={question} reveal counts={choiceCounts} />

      <div className="flex flex-wrap justify-center gap-3 pt-1">
        {!isLast && (
          <Button variant="primary" size="lg" onClick={onNext} disabled={busy}>
            Câu tiếp theo →
          </Button>
        )}
        <Button variant="dark" size="lg" onClick={onFinish} disabled={busy}>
          Kết thúc &amp; tổng kết
        </Button>
      </div>
    </Card>
  )
}
