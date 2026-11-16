import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router'
import { rpc } from '../../lib/supabase'
import { getPlayer } from '../../lib/store'
import type { RoomState } from '../../lib/types'
import { useRoomState } from '../../hooks/useRoomState'
import { useRemainingMs } from '../../hooks/useRemainingMs'
import { Loading } from '../../components/ui'
import { RoomErrorView } from '../../components/RoomErrorView'
import { LobbyView } from './LobbyView'
import { FinishedView } from './FinishedView'
import { QuestionPlayView } from './QuestionPlayView'

export default function StudentRoom() {
  const { code = '' } = useParams()
  const player = getPlayer(code)
  if (!player) return <Navigate to={`/join?code=${code}`} replace />
  return <PlayerRoom code={code} player={player} />
}

function PlayerRoom({
  code,
  player,
}: {
  code: string
  player: { id: string; name: string }
}) {
  const { state, error, refresh } = useRoomState<RoomState>(code, {
    playerId: player.id,
    pollMs: 3000,
  })
  const [sent, setSent] = useState<{ qIndex: number; choice: number } | null>(null)
  const [submitErr, setSubmitErr] = useState<string | null>(null)
  const remaining = useRemainingMs(state?.server_now, state?.question ?? null)

  useEffect(() => {
    if (
      state?.phase !== 'question' ||
      !state.auto_reveal ||
      !state.question?.started_at ||
      !state.server_now
    ) {
      return
    }
    const offset = Date.parse(state.server_now) - Date.now()
    const end = Date.parse(state.question.started_at) + state.question.seconds * 1000
    const delay = Math.max(0, end - (Date.now() + offset)) + 350
    const t = window.setTimeout(() => {
      refresh()
    }, delay)
    return () => window.clearTimeout(t)
  }, [
    state?.phase,
    state?.auto_reveal,
    state?.question?.idx,
    state?.question?.started_at,
    state?.question?.seconds,
    state?.server_now,
    refresh,
  ])

  async function submit(choice: number) {
    if (!state || state.phase !== 'question' || answered) return
    setSent({ qIndex: state.q_index, choice })
    setSubmitErr(null)
    try {
      await rpc<boolean>('submit_answer', {
        p_code: code,
        p_player: player.id,
        p_q_index: state.q_index,
        p_choice: choice,
      })
      refresh()
    } catch (e) {
      setSubmitErr((e as Error).message)
      setSent(null)
    }
  }

  if (!state) {
    return error ? (
      <RoomErrorView error={error} onRetry={refresh} />
    ) : (
      <Loading label="Đang vào phòng..." />
    )
  }

  const pendingChoice = sent?.qIndex === state.q_index ? sent.choice : null
  const answered = Boolean(state.mine?.answered) || pendingChoice !== null
  const myScore = state.players.find((p) => p.id === player.id)?.score ?? 0

  if (state.phase === 'lobby') {
    return (
      <LobbyView
        code={state.code}
        playerId={player.id}
        playerName={player.name}
        players={state.players}
      />
    )
  }

  if (state.phase === 'finished') {
    return (
      <FinishedView
        playerId={player.id}
        myScore={myScore}
        myCorrect={state.mine?.my_correct ?? 0}
        total={state.total}
        players={state.players}
      />
    )
  }

  if (!state.question) return <Loading label="Đang tải câu hỏi..." />

  return (
    <QuestionPlayView
      phase={state.phase}
      question={state.question}
      total={state.total}
      playerId={player.id}
      playerName={player.name}
      myScore={myScore}
      players={state.players}
      mine={state.mine}
      pendingChoice={pendingChoice}
      answered={answered}
      autoReveal={Boolean(state.auto_reveal)}
      remainingMs={remaining}
      syncError={error}
      submitError={submitErr}
      onSubmit={submit}
    />
  )
}
