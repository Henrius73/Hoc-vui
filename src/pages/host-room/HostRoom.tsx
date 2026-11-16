import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { rpc } from '../../lib/supabase'
import { hostToken } from '../../lib/store'
import type { HostState } from '../../lib/types'
import { useRoomState } from '../../hooks/useRoomState'
import { useRemainingMs } from '../../hooks/useRemainingMs'
import { Button, ConfirmDialog, ConnectionBanner, ErrorNote, Loading } from '../../components/ui'
import { RoomErrorView } from '../../components/RoomErrorView'
import { IconCopy, IconUsers } from '../../components/icons'
import { LobbyView } from './LobbyView'
import { QuestionView } from './QuestionView'
import { RevealView } from './RevealView'
import { FinishedView } from './FinishedView'

export default function HostRoom() {
  const { code = '' } = useParams()
  const nav = useNavigate()
  const { state, error, refresh } = useRoomState<HostState>(code, {
    host: true,
    hostToken: hostToken(),
    pollMs: 2000,
  })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<number | null>(null)
  const remaining = useRemainingMs(state?.server_now, state?.question ?? null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    }
  }, [])

  const isGameActive = state?.phase === 'question' || state?.phase === 'reveal'
  useEffect(() => {
    if (!isGameActive) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isGameActive])

  async function act(action: 'start' | 'reveal' | 'next' | 'finish', qi?: number) {
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      await rpc<boolean>('host_action', {
        p_host: hostToken(),
        p_code: code,
        p_action: action,
        p_q_index: qi ?? null,
      })
      await refresh()
      setConfirmFinish(false)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !state) {
    return <RoomErrorView error={error} onRetry={refresh} backTo="/host" backLabel="Quay lại thư viện" />
  }
  if (!state) return <Loading label="Đang tải phòng..." />

  const q = state.question
  const isLast = state.q_index >= state.total
  const answeredCount = state.stats.length
  const choiceCount = [0, 0, 0, 0]
  state.stats.forEach((s) => (choiceCount[s.choice] += 1))
  const shareLink = `${window.location.origin}${window.location.pathname}#/join?code=${state.code}`

  async function copyLink() {
    try {
      await navigator.clipboard?.writeText(shareLink)
      setCopied(true)
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setErr('Không thể sao chép tự động — hãy copy mã phòng ở trên.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-[#121216]/90 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="leading-tight">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500">Mã phòng</p>
            <p className="font-mono text-2xl font-bold tracking-[0.18em] text-violet-300 sm:text-3xl">{state.code}</p>
          </div>
          <Button variant="outline" size="sm" onClick={copyLink} aria-label="Sao chép liên kết phòng">
            <IconCopy width={16} height={16} />
            {copied ? 'Đã sao chép' : 'Sao chép liên kết'}
          </Button>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-sm font-semibold text-zinc-100">
          <IconUsers width={16} height={16} /> {state.players.length} học sinh
        </span>
      </div>

      {error && <ConnectionBanner message={error} />}
      {err && <ErrorNote>{err}</ErrorNote>}

      {state.phase === 'lobby' && (
        <LobbyView
          code={state.code}
          shareLink={shareLink}
          players={state.players}
          busy={busy}
          onStart={() => act('start', 1)}
        />
      )}

      {state.phase === 'question' && q && (
        <QuestionView
          question={q}
          total={state.total}
          playerCount={state.players.length}
          answeredCount={answeredCount}
          choiceCounts={choiceCount}
          remainingMs={remaining}
          busy={busy}
          onReveal={() => act('reveal')}
          onFinishRequest={() => setConfirmFinish(true)}
        />
      )}

      {state.phase === 'reveal' && q && (
        <RevealView
          question={q}
          total={state.total}
          isLast={isLast}
          choiceCounts={choiceCount}
          busy={busy}
          onNext={() => act('next')}
          onFinish={() => act('finish')}
        />
      )}

      {state.phase === 'finished' && (
        <FinishedView
          playerCount={state.players.length}
          total={state.total}
          onViewResults={() => nav(`/host/results/${state.code}`)}
        />
      )}

      <ConfirmDialog
        open={confirmFinish}
        title="Kết thúc ván ngay?"
        message="Ván chơi sẽ chuyển sang màn hình tổng kết điểm và học sinh không thể tiếp tục trả lời."
        confirmLabel="Kết thúc ván"
        danger
        busy={busy}
        onConfirm={() => act('finish')}
        onCancel={() => setConfirmFinish(false)}
      />
    </div>
  )
}
