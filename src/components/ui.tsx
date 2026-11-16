import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

const BTN = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  success: 'bg-emerald-700 text-white hover:bg-emerald-800',
  amber: 'bg-amber-700 text-white hover:bg-amber-800',
  dark: 'bg-slate-800 text-white hover:bg-slate-900',
  outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50',
} as const

const SIZE = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
} as const

export type ButtonVariant = keyof typeof BTN
export type ButtonSize = keyof typeof SIZE

export function btnClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra = '',
): string {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${BTN[variant]} ${SIZE[size]} ${extra}`
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
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 ${className}`} {...rest}>
      {children}
    </section>
  )
}

export function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-lg font-semibold">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">
        {n}
      </span>
      {children}
    </h2>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
      {children}
    </p>
  )
}

export function Loading({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-slate-300" />
      <p className="text-sm text-slate-600">{label}</p>
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
    <div role="status" className="py-8 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-slate-100" />
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}