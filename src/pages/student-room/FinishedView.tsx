import type { Player } from '../../lib/types'
import { Card } from '../../components/ui'
import { Leaderboard } from '../../components/Leaderboard'
import { IconTrophy } from '../../components/icons'

export function FinishedView({
  playerId,
  myScore,
  myCorrect,
  total,
  players,
}: {
  playerId: string
  myScore: number
  myCorrect: number
  total: number
  players: Player[]
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-center sm:px-6">
      <div className="fade-up">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 text-tone-amber ring-1 ring-amber-500/30">
          <IconTrophy width={34} height={34} />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink">Hoàn thành!</h1>
        <p className="mt-1 text-muted">Ván chơi đã kết thúc</p>
      </div>
      <Card className="fade-up overflow-hidden p-0">
        <div className="bg-gradient-to-b from-violet-600/15 to-transparent px-6 py-6">
          <p className="text-sm font-medium text-muted">Điểm của bạn</p>
          <p className="mt-1 text-6xl font-bold tracking-tight text-tone-violet">{myScore}</p>
          <p className="mt-2 inline-flex rounded-full border border-line-strong bg-surface-2/70 px-3 py-1 text-sm font-medium text-ink-soft">
            Đúng {myCorrect}/{total} câu
          </p>
        </div>
        <div className="border-t border-line p-5 text-left sm:p-6">
          <h2 className="mb-3 text-center text-sm font-semibold tracking-[0.16em] text-subtle">Bảng xếp hạng</h2>
          <Leaderboard players={players} highlightPlayerId={playerId} />
        </div>
      </Card>
    </div>
  )
}
