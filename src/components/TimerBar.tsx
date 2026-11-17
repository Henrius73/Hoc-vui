export function TimerBar({
  remainingMs,
  totalSeconds,
  heightClass = 'h-3',
}: {
  remainingMs: number
  totalSeconds: number
  heightClass?: string
}) {
  const secs = Math.ceil(remainingMs / 1000)
  const urgent = secs <= 5
  const pct = Math.max(0, Math.min(100, (remainingMs / (totalSeconds * 1000)) * 100))

  return (
    <div
      aria-hidden
      className={`${heightClass} overflow-hidden rounded-full bg-elevated ring-1 ring-inset ring-line-strong/70`}
    >
      <div
        className={`h-full rounded-full transition-all duration-200 ${urgent ? 'bg-rose-500' : 'bg-violet-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
