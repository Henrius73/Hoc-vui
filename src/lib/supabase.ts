import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabaseConfigured = Boolean(url && key)

export const supabase = supabaseConfigured ? createClient(url!, key!) : null

export async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Chưa cấu hình Supabase (.env)')
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}
