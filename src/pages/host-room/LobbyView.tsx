import { QRCodeSVG } from 'qrcode.react'
import type { Player } from '../../lib/types'
import { Button, Card, EmptyState } from '../../components/ui'

export function LobbyView({
  code,
  shareLink,
  players,
  busy,
  onStart,
}: {
  code: string
  shareLink: string
  players: Player[]
  busy: boolean
  onStart: () => void
}) {
  return (
    <Card className="fade-up relative overflow-hidden p-0 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_45%)]"
      />
      <div className="relative space-y-6 px-6 py-8 sm:px-10 sm:py-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-zinc-500">Mã tham gia</p>
            <p className="mt-2 font-mono text-6xl font-bold tracking-[0.14em] text-white sm:text-7xl">
              {code}
            </p>
            <p className="mt-3 max-w-xs text-sm text-zinc-400">
              Học sinh mở trang chủ, nhập <b className="font-mono text-violet-300">mã 6 số</b> hoặc quét mã QR để vào phòng.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-white p-3 shadow-xl shadow-black/30 ring-1 ring-white/20">
            <QRCodeSVG value={shareLink} size={136} level="M" bgColor="#ffffff" fgColor="#09090b" />
          </div>
        </div>

        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          {players.length === 0 ? (
            <EmptyState title="Chưa có học sinh nào" hint="Hãy chiếu mã phòng hoặc QR này để cả lớp cùng tham gia" />
          ) : (
            <>
              <p className="mb-3 text-sm font-medium text-zinc-400">Đã vào phòng ({players.length})</p>
              <ul className="flex flex-wrap justify-center gap-2">
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="pop-in rounded-full border border-zinc-700 bg-zinc-800/80 px-3.5 py-1.5 text-sm font-medium text-zinc-200 shadow-sm"
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="pt-1">
          <Button variant="primary" size="lg" onClick={onStart} disabled={busy} className="min-w-[14rem]">
            {busy ? 'Đang bắt đầu...' : 'Bắt đầu ván chơi'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
