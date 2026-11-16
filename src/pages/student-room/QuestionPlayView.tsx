import type { Mine, Phase, Player, Question } from '../../lib/types'
import { Card, ConnectionBanner, ErrorNote } from '../../components/ui'
import { ChoiceGrid } from '../../components/ChoiceGrid'
import { Leaderboard } from '../../components/Leaderboard'
import { TimerBar } from '../../components/TimerBar'
import { IconCheck, IconClock, IconX } from '../../components/icons'

export function QuestionPlayView({
  phase,
  question,
  total,
  playerId,
  playerName,
  myScore,
  players,
  mine,
  pendingChoice,
  answered,
  remainingMs,
  syncError,
  submitError,
  onSubmit,
}: {
  phase: Phase
  question: Question
  total: number
  playerId: string
  playerName: string
  myScore: number
  players: Player[]
  mine: Mine | null
  pendingChoice: number | null
  answered: boolean
  remainingMs: number
  syncError: string | null
  submitError: string | null
  onSubmit: (choice: number) => void
}) {
  const reveal = phase === 'reveal'
  const secs = Math.ceil(remainingMs / 1000)
  const urgent = secs <= 5
  const timedOut = !reveal && secs <= 0
  const choiceDisabled = reveal || phase !== 'question' || answered || timedOut

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
            Câu {question.idx}/{total}
          </span>
          <span aria-hidden className="hidden items-center gap-1 sm:flex">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 === question.idx
                    ? 'w-7 bg-violet-500'
                    : i + 1 < question.idx
                      ? 'w-1.5 bg-violet-400/50'
                      : 'w-1.5 bg-zinc-700'
                }`}
              />
            ))}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900/80 px-3.5 py-1.5 text-sm font-semibold text-zinc-200 shadow-sm">
          {playerName} <span className="text-zinc-600">·</span> <span className="text-violet-300">{myScore} đ</span>
        </span>
      </div>

      {syncError && <ConnectionBanner message={syncError} />}

      {!reveal && (
        <div className="rounded-2xl border border-zinc-800 bg-[#121216] px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className={`inline-flex items-center gap-1.5 ${urgent ? 'text-rose-400 timer-pulse' : 'text-zinc-300'}`}>
              <IconClock width={16} height={16} />
              {timedOut ? 'Đã hết giờ' : `Còn ${secs}s`}
            </span>
            <span className="text-xs font-medium text-zinc-500 sm:text-sm">
              {timedOut ? 'Chờ giáo viên công bố đáp án' : 'Hết giờ sẽ khóa trả lời'}
            </span>
          </div>
          <div className="mt-2">
            <TimerBar remainingMs={remainingMs} totalSeconds={question.seconds} heightClass="h-2.5" />
          </div>
        </div>
      )}

      <Card key={question.idx} className="fade-up relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />
        <h1 className="text-center text-xl font-semibold leading-snug text-white sm:text-2xl lg:text-[1.7rem]">
          {question.body}
        </h1>
      </Card>

      <ChoiceGrid
        interactive
        question={question}
        reveal={reveal}
        disabled={choiceDisabled}
        selectedIdx={mine?.choice ?? pendingChoice}
        onSelect={onSubmit}
      />

      {submitError && <ErrorNote>{submitError}</ErrorNote>}

      {phase === 'question' && answered && !submitError && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
          </span>
          Đã ghi nhận câu trả lời — chờ giáo viên công bố đáp án
        </div>
      )}

      {phase === 'question' && !answered && timedOut && !submitError && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-center text-sm font-medium text-zinc-300">
          Đã hết thời gian trả lời — chờ giáo viên công bố đáp án
        </div>
      )}

      {reveal && (
        <Card className="fade-up space-y-4 p-5 sm:p-6">
          <div className="text-center">
            {mine?.answered ? (
              mine.is_correct ? (
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                  <IconCheck width={20} height={20} /> Chính xác! +{mine.points} điểm
                </p>
              ) : (
                <p className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-4 py-2 font-bold text-rose-300 ring-1 ring-rose-500/30">
                  <IconX width={20} height={20} /> Chưa đúng — 0 điểm
                </p>
              )
            ) : (
              <p className="inline-flex rounded-full bg-zinc-800 px-4 py-2 font-medium text-zinc-400">
                Bạn chưa trả lời câu này
              </p>
            )}
          </div>
          <div>
            <h2 className="mb-2 text-center text-xs font-semibold tracking-[0.16em] text-zinc-500">
              Bảng xếp hạng tạm thời
            </h2>
            <Leaderboard players={players} highlightPlayerId={playerId} limit={8} compact />
          </div>
        </Card>
      )}
    </div>
  )
}
