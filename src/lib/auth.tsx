import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, rpc } from './supabase'
import { hostToken, ownerToken } from './store'

type AuthCtx = {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

async function claimLocalData() {
  try {
    await rpc('claim_local_teacher_data', {
      p_owner: ownerToken(),
      p_host: hostToken(),
    })
  } catch {
    // Bỏ qua nếu chưa chạy migration 0002_teacher_auth.sql hoặc chưa có dữ liệu local
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    const sb = supabase
    if (!sb) return

    let active = true
    sb.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
      if (data.session) claimLocalData()
    })

    const { data: sub } = sb.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
      if (event === 'SIGNED_IN' && nextSession) {
        claimLocalData()
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signInWithPassword(email: string, password: string) {
    if (!supabase) throw new Error('Chưa cấu hình Supabase (.env)')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(translateAuthError(error.message))
  }

  async function signUp(email: string, password: string) {
    if (!supabase) throw new Error('Chưa cấu hình Supabase (.env)')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(translateAuthError(error.message))
    return { needsConfirmation: !data.session }
  }

  async function signInWithGoogle() {
    if (!supabase) throw new Error('Chưa cấu hình Supabase (.env)')
    const redirectTo = `${window.location.origin}${window.location.pathname}#/host`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw new Error(translateAuthError(error.message))
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signInWithPassword,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function translateAuthError(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng'
  if (lower.includes('email not confirmed')) return 'Email chưa được xác nhận — hãy kiểm tra hộp thư'
  if (lower.includes('already registered')) return 'Email này đã được đăng ký'
  if (lower.includes('password should be at least')) return 'Mật khẩu phải có ít nhất 6 ký tự'
  return msg
}
