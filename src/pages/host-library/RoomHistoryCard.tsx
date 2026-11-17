import { Link } from 'react-router'
import type { Phase } from '../../lib/types'
import { Button, Card, EmptyState, Loading, StepTitle, btnClass } from '../../components/ui'
import { IconTrash } from '../../components/icons'

export type RoomItem = {
  code: string
  quiz: string
  created_at: string
  phase: Phase
  players: number
}

const PHASE_LABEL: Record<Phase, { text: string; cls: string }> = {
  lobby: { text: 'Đang chờ', cls: 'bg-elevated text-ink-soft ring-line-strong' },
  question: { text: 'Đang chơi', cls: 'bg-violet-500/15 text-violet-300 ring-violet-500/30' },
  reveal: { text: 'Đã công bố', cls: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  finished: { text: 'Đã kết thúc', cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
}

export function RoomHistoryCard({
  loaded,
  rooms,
  busy = false,
  onDeleteRequest,
}: {
  loaded: boolean
  rooms: RoomItem[]
  busy?: boolean
  onDeleteRequest: (room: RoomItem) => void
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line bg-surface-2/40 px-5 py-4 sm:px-6">
        <StepTitle n={3}>Phòng đã mở</StepTitle>
      </div>
      <div className="px-5 py-4 sm:px-6">
        {!loaded ? (
          <Loading label="Đang tải danh sách phòng..." />
        ) : rooms.length === 0 ? (
          <EmptyState title="Chưa có phòng nào" hint="Mở một phòng từ bộ câu hỏi để bắt đầu." />
        ) : (
          <ul className="space-y-3">
            {rooms.map((r) => (
              <li key={r.code} className="rounded-xl border border-line bg-surface-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-lg font-bold tracking-wider text-ink">{r.code}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${PHASE_LABEL[r.phase].cls}`}
                      >
                        {PHASE_LABEL[r.phase].text}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-ink-soft">{r.quiz}</p>
                    <p className="mt-1 text-xs text-subtle">
                      {r.players} người · {new Date(r.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {r.phase !== 'finished' && (
                      <Link to={`/host/room/${r.code}`} className={btnClass('primary', 'sm')}>
                        Điều khiển
                      </Link>
                    )}
                    <Link to={`/host/results/${r.code}`} className={btnClass('outline', 'sm')}>
                      Kết quả
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDeleteRequest(r)}
                      disabled={busy}
                      aria-label={`Xóa lịch sử phòng ${r.code}`}
                    >
                      <IconTrash width={14} height={14} /> Xóa
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
