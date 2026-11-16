import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

const BTN = {
  primary:
    'bg-teal-700 text-white shadow-md shadow-teal-800/20 hover:bg-teal-800 hover:shadow-teal-800/30',
  success:
    'bg-orange-500 text-white shadow-md shadow-orange-600/25 hover:bg-orange-600',
  amber: 'bg-amber-500 text-amber-950 shadow-md hover:bg-amber-400',
  dark: 'bg-[#1a1a2e] text-white shadow-md hover:bg-[#2d2d44]',
  outline:
    'bg-white text-[#1a1a2e] border-2 border-[#1a1a2e]/15 hover:border-teal-700 hover:text-teal-800 shadow-sm',
  danger: 'bg-white text-rose-700 border-2 border-rose-200 hover:bg-rose-50',
  ghost: 'bg-transparent text-[#5c5f6e] hover:bg-black/5 hover:text-[#1a1a2e]',
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
      className={`rounded-2xl border-2 border-[#1a1a2e]/10 bg-white shadow-[4px_4px_0_0_rgba(26,26,46,0.08)] ${className}`}
      {...rest}
    >
      {children}
    </section>
  )
}

export function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-base font-semibold text-[#1a1a2e] sm:text-lg">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-teal-700 text-xs font-bold text-white shadow-sm shadow-teal-700/30">
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
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1a2e] sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#5c5f6e]">{desc}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}