import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

const BTN = {
  primary:
    'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/25',
  success:
    'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/25',
  amber: 'bg-amber-600 text-white shadow-sm shadow-amber-600/20 hover:bg-amber-700',
  dark: 'bg-slate-900 text-white shadow-sm shadow-slate-900/20 hover:bg-slate-800',
  outline:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm',
  danger: 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 hover:border-rose-300',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
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
  return `inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none ${BTN[variant]} ${SIZE[size]} ${extra}`
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
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40 ${className}`}
      {...rest}
    >
      {children}
    </section>
  )
}

export function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-base font-semibold text-slate-900 sm:text-lg">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm shadow-indigo-600/30">
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
      className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800"
    >
      <span aria-hidden className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
      <span>{children}</span>
    </p>
  )
}

export function Loading({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-4 h-11 w-11 animate-pulse rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
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
    <div role="status" className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/70">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 7h16M7 12h10M9 17h6" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
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
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">{desc}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}