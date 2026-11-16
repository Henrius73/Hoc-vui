import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, rpc } from '../lib/supabase'
import type { HostState, RoomState } from '../lib/types'

type Options = {
  playerId?: string | null
  host?: boolean
  hostToken?: string
  pollMs?: number
}

/**
 * Nạp trạng thái phòng (student: get_room_state, host: host_snapshot),
 * đồng bộ qua realtime (postgres_changes) + poll an toàn chống mất gói.
 */
export function useRoomState<T extends RoomState | HostState = RoomState>(
  code: string,
  opts: Options,
) {
  const [state, setState] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const s = opts.host
        ? await rpc<T>('host_snapshot', {
            p_host: opts.hostToken,
            p_code: code,
            p_player: opts.playerId ?? null,
          })
        : await rpc<T>('get_room_state', { p_code: code, p_player: opts.playerId ?? null })
      setState(s)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [code, opts.host, opts.hostToken, opts.playerId])

  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    loadRef.current()
    const sb = supabase
    if (!sb) return
    const refresh = () => loadRef.current()
    const ch = sb.channel(`room:${code}`)
    ch.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
      refresh,
    )
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players' }, refresh)
    ch.subscribe()
    const poll = opts.pollMs ? setInterval(refresh, opts.pollMs) : 0
    return () => {
      if (poll) clearInterval(poll)
      sb.removeChannel(ch)
    }
    // pollMs ổn định theo từng trang (host 2s, student 3s)
  }, [code, opts.pollMs])

  const refresh = useCallback(() => loadRef.current(), [])

  return { state, error, loading, refresh }
}
