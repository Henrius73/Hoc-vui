import { Link } from 'react-router'
import { Button, Card, btnClass } from '../../components/ui'
import { IconTrophy } from '../../components/icons'

export function FinishedView({
  playerCount,
  total,
  onViewResults,
}: {
  playerCount: number
  total: number
  onViewResults: () => void
}) {
  return (
    <Card className="fade-up space-y-5 p-8 text-center sm:p-10">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
        <IconTrophy width={34} height={34} />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Ván chơi đã kết thúc</h1>
        <p className="mt-2 text-muted">
          Tổng hợp điểm và thống kê của <b className="text-ink-soft">{playerCount}</b> học sinh ·{' '}
          <b className="text-ink-soft">{total}</b> câu hỏi
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="primary" size="lg" onClick={onViewResults}>
          Xem bảng tổng hợp
        </Button>
        <Link to="/host" className={btnClass('outline', 'lg')}>
          Về thư viện
        </Link>
      </div>
    </Card>
  )
}
