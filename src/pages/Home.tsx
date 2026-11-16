import { Link } from 'react-router'
import { btnClass, Card } from '../components/ui'
import { IconBoard, IconPlay } from '../components/icons'
import type { ComponentType, CSSProperties, SVGProps } from 'react'

function RoleCard({
  to,
  icon: Icon,
  tone,
  title,
  desc,
  cta,
  delay = 0,
}: {
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: 'indigo' | 'emerald'
  title: string
  desc: string
  cta: string
  delay?: number
}) {
  const iconTone =
    tone === 'indigo' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
  const variant = tone === 'indigo' ? 'primary' : 'success'
  return (
    <Card className="hover-lift fade-up flex flex-col gap-3 p-5" style={{ animationDelay: `${delay}ms` } as CSSProperties}>
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${iconTone}`}>
        <Icon width={24} height={24} />
      </span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
      </div>
      <Link to={to} className={`mt-auto ${btnClass(variant, 'lg', 'w-full')}`}>
        {cta}
      </Link>
    </Card>
  )
}

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:py-12">
      <div className="fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 px-6 py-12 text-center text-white shadow-xl sm:px-12">
        <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Realtime · không cần tài khoản
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Học Vui</h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-300">
            Giáo viên soạn câu hỏi từ Excel, mở phòng bằng mã 6 số. Cả lớp tham gia từ điện thoại,
            trả lời theo đồng hồ đếm ngược — điểm và xếp hạng hiện ra ngay.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RoleCard
          to="/host"
          icon={IconBoard}
          tone="indigo"
          title="Tôi là giáo viên"
          desc="Soạn bộ câu hỏi từ Excel, mở phòng, điều khiển ván và tổng kết điểm."
          cta="Vào khu vực giáo viên"
          delay={60}
        />
        <RoleCard
          to="/join"
          icon={IconPlay}
          tone="emerald"
          title="Tôi là học sinh"
          desc="Nhập mã phòng và tên của bạn để tham gia trò chơi."
          cta="Vào phòng"
          delay={120}
        />
      </div>

      <Card className="fade-up p-5" >
        <h2 className="font-semibold">Cách chơi trong 3 bước</h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-600">
          <li>
            <b className="text-slate-900">1.</b> Giáo viên nhập bộ câu hỏi từ Excel →{' '}
            <b className="text-slate-900">Mở phòng</b> → chiếu mã lên lớp.
          </li>
          <li>
            <b className="text-slate-900">2.</b> Học sinh mở trang, chọn{' '}
            <b className="text-slate-900">Tôi là học sinh</b>, nhập mã phòng + tên.
          </li>
          <li>
            <b className="text-slate-900">3.</b> Giáo viên <b className="text-slate-900">Bắt đầu</b>{' '}
            → cả lớp trả lời theo timer → tổng kết + tải file điểm.
          </li>
        </ol>
      </Card>
    </div>
  )
}