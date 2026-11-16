import type { ComponentType, CSSProperties, SVGProps } from 'react'
import { Link } from 'react-router'
import { IconBoard, IconPlay } from '../components/icons'
import { Card, btnClass } from '../components/ui'

function RoleCard({
  to,
  icon: Icon,
  tone,
  title,
  cta,
  delay = 0,
}: {
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: 'indigo' | 'emerald'
  title: string
  cta: string
  delay?: number
}) {
  const styles =
    tone === 'indigo'
      ? {
          icon: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
          variant: 'primary' as const,
        }
      : {
          icon: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
          variant: 'success' as const,
        }

  return (
    <Card
      className="hover-lift fade-up group relative flex flex-col overflow-hidden p-6 sm:p-7"
      style={{ animationDelay: `${delay}ms` } as CSSProperties}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${
          tone === 'indigo' ? 'bg-violet-600/20' : 'bg-emerald-500/15'
        }`}
      />
      <div className="relative">
        <span className={`grid h-14 w-14 place-items-center rounded-2xl ${styles.icon}`}>
          <Icon width={26} height={26} />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">{title}</h2>
      </div>
      <Link to={to} className={`relative mt-6 ${btnClass(styles.variant, 'lg', 'w-full')}`}>
        {cta}
      </Link>
    </Card>
  )
}

export default function Home() {
  return (
    <div className="relative mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 overflow-hidden">
        <div className="absolute left-1/2 top-[-6rem] h-72 w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl" />
      </div>

      <section className="fade-up relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#0e0e12] px-6 py-16 text-center shadow-2xl shadow-black/30 sm:px-10 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="absolute -right-10 top-10 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-violet-200">
            Quiz lớp học
          </p>
          <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
              Học Vui
            </span>
          </h1>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <RoleCard
          to="/host"
          icon={IconBoard}
          tone="indigo"
          title="Giáo viên"
          cta="Vào khu vực giáo viên"
          delay={60}
        />
        <RoleCard
          to="/join"
          icon={IconPlay}
          tone="emerald"
          title="Học sinh"
          cta="Vào phòng"
          delay={120}
        />
      </section>
    </div>
  )
}
