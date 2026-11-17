export function QuestionProgress({
  current,
  total,
  className = '',
}: {
  current: number
  total: number
  className?: string
}) {
  const safeTotal = Math.max(1, total)
  const pct = Math.max(0, Math.min(100, (current / safeTotal) * 100))

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        role="progressbar"
        aria-label="Tiến độ câu hỏi"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={current}
        className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-elevated ring-1 ring-inset ring-line-strong/70"
      >
        <div
          className="progress-fill h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 shadow-[0_0_10px_rgba(217,70,239,0.35)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-subtle">
        Câu <span className="text-ink">{current}</span>
        <span className="text-subtle">/{total}</span>
      </span>
    </div>
  )
}
