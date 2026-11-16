import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

const BTN = {
  primary:
    'bg-violet-600 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500 hover:shadow-violet-500/30',
  success:
    'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500',
  amber: 'bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400',
  dark: 'bg-zinc-100 text-zinc-900 shadow-lg hover:bg-white',
  outline:
    'bg-transparent text-zinc-200 border border-zinc-700 hover:border-violet-500 hover:text-white hover:bg-white/5',
  danger: 'bg-transparent text-rose-400 border border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300',
  ghost: 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-100',
} as const

const SIZE = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-[15px] rounded-xl',
} as const

export type ButtonVariant = keyof typeof BTN
export type ButtonSize = keyof typeof SIZE

export function btnClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra = '',
): string {
  return `inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none ${BTN[variant]} ${SIZE[size]} ${extra}`
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  return <button className={btnClass(variant, size, className)} {...rest} />
}

export function Card({ children, className = '', ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800/80 bg-[#121216]/90 shadow-lg shadow-black/20 backdrop-blur-sm ${className}`}
      {...rest}
    >
      {children}
    </section>
  )
}

export function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-base font-semibold text-white sm:text-lg">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-600 text-xs font-bold text-white shadow-sm shadow-violet-600/30">
        {n}
      </span>
      {children}
    </h2>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm font-medium text-rose-200"
    >
      <span aria-hidden className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
      <span>{children}</span>
    </p>
  )
}

export function Loading({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-4 h-11 w-11 animate-pulse rounded-2xl bg-gradient-to-br from-violet-600/40 to-fuchsia-500/30 ring-1 ring-white/10" />
      <p className="text-sm font-medium text-zinc-400">{label}</p>
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div role="status" className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400 ring-1 ring-zinc-700">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 7h16M7 12h10M9 17h6" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow?: string
  title: string
  desc?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-violet-400">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">{desc}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}