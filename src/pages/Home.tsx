import { Link } from 'react-router'
import { btnClass, Card } from '../components/ui'
import { IconBoard, IconPlay } from '../components/icons'
import type { ComponentType, CSSProperties, SVGProps } from 'react'

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
          icon: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/60',
          variant: 'primary' as const,
        }
      : {
          icon: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60',
          variant: 'success' as const,
        }

  return (
    <Card
      className="hover-lift fade-up group relative flex flex-col overflow-hidden p-6 sm:p-7"
      style={{ animationDelay: `${delay}ms` } as CSSProperties}
    >
      <div
        aria-hidden
        className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-60 blur-2xl ${
          tone === 'indigo' ? 'bg-indigo-200' : 'bg-emerald-200'
        }`}
      />
      <div className="relative">
        <span className={`grid h-12 w-12 place-items-center rounded-xl ${styles.icon}`}>
          <Icon width={24} height={24} />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      </div>
      <Link to={to} className={`relative mt-6 ${btnClass(styles.variant, 'lg', 'w-full')}`}>
        {cta}
      </Link>
    </Card>
  )
}

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <section className="fade-up relative overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-950 px-6 py-16 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_45%)]" />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-indigo-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
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