import { useEffect, useState } from 'react'
import type { Question } from '../lib/types'

/** Số giây còn lại của câu hiện tại, tính theo đồng hồ server (server_now - started_at). */
export function useRemainingMs(serverNow: string | undefined, question: Question | null) {
  const [ms, setMs] = useState(0)

  useEffect(() => {
    if (!question?.started_at || !serverNow) {
      setMs(0)
      return
    }
    const offset = Date.parse(serverNow) - Date.now()
    const end = Date.parse(question.started_at) + question.seconds * 1000
    const tick = () => setMs(Math.max(0, end - (Date.now() + offset)))
    tick()
    const t = setInterval(tick, 200)
    return () => clearInterval(t)
  }, [serverNow, question?.started_at, question?.seconds])

  return ms
}
