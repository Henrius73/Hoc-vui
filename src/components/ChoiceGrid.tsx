import type { CSSProperties } from 'react'
import { CHOICE_LABELS, choiceStyle, type Question } from '../lib/types'
import { IconCheck, IconX } from './icons'

type BaseProps = {
  question: Question
  reveal: boolean
}

type InteractiveProps = BaseProps & {
  interactive: true
  disabled: boolean
  selectedIdx: number | null
  onSelect: (index: number) => void
}

type DisplayProps = BaseProps & {
  interactive?: false
  counts: number[]
}

export function ChoiceGrid(props: InteractiveProps | DisplayProps) {
  const { question, reveal } = props
  const choices = [question.a, question.b, question.c, question.d]

  if (props.interactive) {
    const { disabled, selectedIdx, onSelect } = props
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {choices.map((text, i) => {
          const mode =
            reveal && question.correct === i
              ? 'correct'
              : reveal && selectedIdx === i
                ? 'wrong'
                : 'normal'
          const { bg, fg } = choiceStyle(i, mode)
          const mine = !reveal && selectedIdx === i

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              disabled={disabled}
              className={`pop-in group flex min-h-[4.5rem] items-center gap-3 rounded-2xl px-4 py-3.5 text-left shadow-sm transition-all duration-200 ease-out disabled:cursor-default sm:text-lg ${bg} ${fg} ${
                mine ? 'ring-4 ring-white/30 ring-offset-2 ring-offset-[#050507]' : ''
              } ${!disabled ? 'active:scale-[0.985] hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110' : ''}`}
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
    )
  }

  const { counts } = props
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {choices.map((text, i) => {
        const isCorrect = reveal && question.correct === i
        const mode = isCorrect ? 'correct' : 'normal'
        const { bg, fg } = choiceStyle(i, mode)

        return (
          <div
            key={i}
            className={`flex items-center justify-between gap-4 rounded-2xl p-4 shadow-sm transition-all sm:p-5 ${bg} ${fg} ${
              reveal ? (isCorrect ? 'ring-4 ring-white/30' : 'opacity-80') : ''
            }`}
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
              {isCorrect && <IconCheck width={22} height={22} />}
              <span className="rounded-xl bg-black/15 px-3 py-1.5 text-xl font-bold tabular-nums sm:text-2xl">
                {counts[i] ?? 0}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
