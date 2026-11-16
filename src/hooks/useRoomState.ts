import { useCallback, useEffect, useState } from 'react'
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

  useEffect(() => {
    load()
    const poll = opts.pollMs ? setInterval(load, opts.pollMs) : 0
    return () => {
      if (poll) clearInterval(poll)
    }
  }, [load, opts.pollMs])

  const roomId = state?.room_id

  useEffect(() => {
    const sb = supabase
    if (!sb) return

    const ch = sb.channel(`room:${code}`)
    ch.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
      () => {
        load()
      },
    )
    if (roomId) {
      ch.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        () => {
          load()
        },
      )
    }
    ch.subscribe()

    return () => {
      sb.removeChannel(ch)
    }
  }, [code, roomId, load])

  return { state, error, loading, refresh: load }
}
