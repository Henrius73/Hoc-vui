import { Button, Card, EmptyState, Loading, StepTitle } from '../../components/ui'

export type QuizItem = {
  id: string
  name: string
  created_at: string
  count: number
}

export function QuizListCard({
  loaded,
  quizzes,
  busy,
  openingId,
  autoReveal,
  onAutoRevealChange,
  onCreateSample,
  onOpenRoom,
  onDeleteRequest,
}: {
  loaded: boolean
  quizzes: QuizItem[]
  busy: boolean
  openingId: string | null
  autoReveal: boolean
  onAutoRevealChange: (v: boolean) => void
  onCreateSample: () => void
  onOpenRoom: (id: string) => void
  onDeleteRequest: (item: QuizItem) => void
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2/40 px-5 py-4 sm:px-6">
        <StepTitle n={2}>Bộ câu hỏi của tôi</StepTitle>
        <Button variant="outline" size="sm" onClick={onCreateSample} disabled={busy}>
          + Tạo bộ mẫu
        </Button>
      </div>
      <div className="border-b border-line/80 bg-surface-2/20 px-5 py-3 sm:px-6">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft select-none">
          <input
            type="checkbox"
            checked={autoReveal}
            onChange={(e) => onAutoRevealChange(e.target.checked)}
            className="h-4 w-4 rounded border-line-strong bg-elevated text-violet-600 focus:ring-violet-500"
          />
          <span>Tự động công bố đáp án khi hết giờ (không cần bấm tay)</span>
        </label>
      </div>
      <div className="px-5 py-4 sm:px-6">
        {!loaded ? (
          <Loading label="Đang tải thư viện..." />
        ) : quizzes.length === 0 ? (
          <EmptyState
            title="Chưa có bộ câu hỏi"
            hint="Nhập từ Excel ở bước 1, hoặc tạo nhanh bộ mẫu 5 câu để dùng thử."
          />
        ) : (
          <ul className="space-y-3">
            {quizzes.map((q) => {
              const isOpening = openingId === q.id
              return (
                <li
                  key={q.id}
                  className="hover-lift flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{q.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/30">
                        {q.count} câu
                      </span>
                      <span>{new Date(q.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => onOpenRoom(q.id)}
                      disabled={q.count === 0 || busy || Boolean(openingId)}
                    >
                      {isOpening ? 'Đang mở...' : 'Mở phòng'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDeleteRequest(q)}
                      disabled={busy || Boolean(openingId)}
                    >
                      Xóa
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}
