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
          icon: 'bg-teal-100 text-teal-800 ring-2 ring-teal-200/70',
          variant: 'primary' as const,
        }
      : {
          icon: 'bg-orange-100 text-orange-700 ring-2 ring-orange-200/70',
          variant: 'success' as const,
        }

  return (
    <Card
      className="hover-lift fade-up group relative flex flex-col overflow-hidden p-6 sm:p-7"
      style={{ animationDelay: `${delay}ms` } as CSSProperties}
    >
      <div className="relative">
        <span className={`grid h-14 w-14 place-items-center rounded-2xl ${styles.icon}`}>
          <Icon width={26} height={26} />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#1a1a2e]">{title}</h2>
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
      <section className="fade-up relative overflow-hidden rounded-[2rem] border-2 border-[#1a1a2e]/10 bg-white px-6 py-16 shadow-[6px_6px_0_0_rgba(26,26,46,0.08)] sm:px-10 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-teal-200/60" />
          <div className="absolute right-6 top-8 h-16 w-16 rotate-12 rounded-2xl bg-orange-200/70" />
          <div className="absolute -bottom-8 right-10 h-36 w-36 rounded-full bg-sky-200/50" />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-6xl font-extrabold tracking-tight text-[#1a1a2e] sm:text-7xl lg:text-8xl">
            Học <span className="inline-block -rotate-2 text-teal-700">Vui</span>
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