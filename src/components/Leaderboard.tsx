import type { Player } from '../lib/types'

export const RANK_TONE = [
  'bg-amber-400 text-amber-950 ring-1 ring-amber-300/40',
  'bg-zinc-300 text-zinc-900 ring-1 ring-zinc-200/40',
  'bg-orange-400 text-orange-950 ring-1 ring-orange-300/40',
]
export const RANK_REST = 'bg-line-strong text-ink-soft'

export function Leaderboard({
  players,
  highlightPlayerId,
  limit,
  compact = false,
}: {
  players: Player[]
  highlightPlayerId?: string
  limit?: number
  compact?: boolean
}) {
  const list = limit ? players.slice(0, limit) : players

  return (
    <ol className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {list.map((p, i) => {
        const isMe = highlightPlayerId === p.id
        return (
          <li
            key={p.id}
            className={`flex items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
              compact ? 'py-2' : 'py-2.5'
            } ${
              isMe
                ? 'bg-violet-500/15 font-semibold text-violet-100 ring-1 ring-violet-500/30'
                : 'bg-elevated/50 text-ink-soft'
            }`}
          >
            <span
              className={`grid shrink-0 place-items-center rounded-full font-bold ${
                compact ? 'h-6 w-6 text-[11px]' : 'h-7 w-7 text-xs'
              } ${i < 3 ? RANK_TONE[i] : RANK_REST}`}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <span className="font-bold tabular-nums">{p.score} đ</span>
          </li>
        )
      })}
    </ol>
  )
}
