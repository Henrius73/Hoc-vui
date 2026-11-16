import { Card } from '../components/ui'
import { JoinRoomForm } from '../components/JoinRoomForm'
import { IconPlay, IconTrophy, IconUsers } from '../components/icons'

export default function Home() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 overflow-hidden">
        <div className="absolute left-1/2 top-[-6rem] h-72 w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl" />
      </div>

      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <section className="fade-up space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-violet-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
            Trò chơi trắc nghiệm lớp học
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
              Học Vui
            </span>
          </h1>

          <p className="mx-auto max-w-lg text-base leading-relaxed text-zinc-300 sm:text-lg lg:mx-0">
            Sẵn sàng thi đấu cùng cả lớp chưa? Nhập mã phòng 6 số từ giáo viên, chọn tên thật chất và chinh phục bảng xếp hạng!
          </p>

          <ul className="mx-auto grid max-w-lg grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:mx-0">
            <li className="flex items-center gap-3 rounded-2xl border border-zinc-800/80 bg-[#121216]/80 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
                <IconUsers width={18} height={18} />
              </span>
              <span className="text-sm font-medium text-zinc-200">Vào ngay không cần tài khoản</span>
            </li>
            <li className="flex items-center gap-3 rounded-2xl border border-zinc-800/80 bg-[#121216]/80 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
                <IconTrophy width={18} height={18} />
              </span>
              <span className="text-sm font-medium text-zinc-200">Đúng mỗi câu +1000 điểm</span>
            </li>
          </ul>
        </section>

        <Card
          className="fade-up overflow-hidden border-zinc-800 bg-[#0f0f14] p-0 shadow-2xl shadow-black/40"
          style={{ animationDelay: '60ms' }}
        >
          <div className="flex items-center gap-3 border-b border-zinc-800 bg-gradient-to-r from-violet-600/15 via-transparent to-orange-500/10 px-6 py-5 sm:px-7">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-1 ring-white/10">
              <IconPlay width={22} height={22} />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-white">Vào phòng chơi</h2>
              <p className="text-xs text-zinc-400">Nhập mã 6 số đang chiếu trên bảng</p>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <JoinRoomForm />
          </div>
        </Card>
      </div>
    </div>
  )
}
