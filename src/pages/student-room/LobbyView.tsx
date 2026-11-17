import type { Player } from '../../lib/types'
import { Card } from '../../components/ui'
import { IconClock } from '../../components/icons'

export function LobbyView({
  code,
  playerId,
  playerName,
  players,
}: {
  code: string
  playerId: string
  playerName: string
  players: Player[]
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Card className="fade-up overflow-hidden p-0 text-center">
        <div className="border-b border-line bg-gradient-to-b from-violet-600/15 to-transparent px-6 py-8 sm:px-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-1 ring-white/10">
            <IconClock width={26} height={26} />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Đang chờ bắt đầu</h1>
          <p className="mt-2 text-sm text-muted">
            Phòng{' '}
            <b className="rounded-md bg-elevated px-2 py-0.5 font-mono text-base text-tone-violet ring-1 ring-line-strong">
              {code}
            </b>
            {' · '}Bạn là <b className="text-ink">{playerName}</b>
          </p>
        </div>
        <div className="px-6 py-6 sm:px-10">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-muted">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" aria-hidden />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
            </span>
            {players.length} người đã vào phòng
          </div>
          <ul className="flex flex-wrap justify-center gap-2">
            {players.map((p) => (
              <li
                key={p.id}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                  p.id === playerId
                    ? 'border-violet-500/40 bg-violet-500/15 text-tone-violet'
                    : 'border-line-strong bg-elevated/70 text-ink-soft'
                }`}
              >
                {p.name}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-subtle">Giáo viên sẽ bắt đầu ván chơi trong giây lát…</p>
        </div>
      </Card>
    </div>
  )
}
