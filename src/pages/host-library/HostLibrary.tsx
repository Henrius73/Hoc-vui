import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { rpc } from '../../lib/supabase'
import { ownerToken, hostToken } from '../../lib/store'
import type { ParsedQuestion } from '../../lib/types'
import { ConfirmDialog, ErrorNote, PageHeader } from '../../components/ui'
import { QuizImportCard, type QuizPreview } from './QuizImportCard'
import { QuizListCard, type QuizItem } from './QuizListCard'
import { RoomHistoryCard, type RoomItem } from './RoomHistoryCard'

const SAMPLE: ParsedQuestion[] = [
  { body: 'Thủ đô của Việt Nam là?', a: 'Hà Nội', b: 'Đà Lạt', c: 'Huế', d: 'Nha Trang', correct: 0, seconds: 20 },
  { body: '5 + 7 = ?', a: '10', b: '11', c: '12', d: '13', correct: 2, seconds: 15 },
  { body: 'Hành tinh nào gần Mặt Trời nhất?', a: 'Trái Đất', b: 'Sao Kim', c: 'Sao Thủy', d: 'Sao Hỏa', correct: 2, seconds: 20 },
  { body: 'Biển lớn nhất thế giới?', a: 'Đại Tây Dương', b: 'Băng Dương', c: 'Thái Bình Dương', d: 'Ấn Độ Dương', correct: 2, seconds: 20 },
  { body: 'Nước sôi ở 100 độ C ở áp suất...', a: 'thường', b: 'cao', c: 'thấp', d: 'không xác định', correct: 0, seconds: 20 },
]

export default function HostLibrary() {
  const nav = useNavigate()
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [preview, setPreview] = useState<QuizPreview | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuizItem | null>(null)

  const load = useCallback(async () => {
    try {
      const [q, r] = await Promise.all([
        rpc<QuizItem[]>('list_quizzes', { p_owner: ownerToken() }),
        rpc<RoomItem[]>('list_rooms', { p_host: hostToken() }),
      ])
      setQuizzes(q)
      setRooms(r)
      setErr(null)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!preview) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [preview])

  async function saveQuiz() {
    if (!preview) return
    if (preview.questions.length === 0) {
      setErr('Không có câu hỏi hợp lệ để lưu')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await rpc<string>('save_quiz', {
        p_owner: ownerToken(),
        p_name: preview.name.trim() || 'Bộ câu hỏi',
        p_questions: preview.questions,
        p_id: null,
      })
      setPreview(null)
      await load()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function createSample() {
    setBusy(true)
    setErr(null)
    try {
      await rpc<string>('save_quiz', {
        p_owner: ownerToken(),
        p_name: 'Bộ câu hỏi mẫu',
        p_questions: SAMPLE,
        p_id: null,
      })
      await load()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function openRoom(quizId: string) {
    setOpeningId(quizId)
    setErr(null)
    try {
      const code = await rpc<string>('create_room', {
        p_owner: ownerToken(),
        p_host: hostToken(),
        p_quiz: quizId,
      })
      nav(`/host/room/${code}`)
    } catch (e) {
      setErr((e as Error).message)
      setOpeningId(null)
    }
  }

  async function confirmRemoveQuiz() {
    if (!deleteTarget) return
    setBusy(true)
    setErr(null)
    try {
      await rpc<void>('delete_quiz', { p_owner: ownerToken(), p_id: deleteTarget.id })
      setDeleteTarget(null)
      await load()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader eyebrow="Dành cho giáo viên" title="Thư viện & phòng chơi" />

      {err && <ErrorNote>{err}</ErrorNote>}

      <QuizImportCard
        preview={preview}
        busy={busy}
        onPreviewChange={setPreview}
        onSave={saveQuiz}
        onError={setErr}
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <QuizListCard
          loaded={loaded}
          quizzes={quizzes}
          busy={busy}
          openingId={openingId}
          onCreateSample={createSample}
          onOpenRoom={openRoom}
          onDeleteRequest={setDeleteTarget}
        />

        <RoomHistoryCard loaded={loaded} rooms={rooms} />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa bộ câu hỏi?"
        message={`Bạn chắc chắn muốn xóa bộ "${deleteTarget?.name ?? ''}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa bộ câu hỏi"
        danger
        busy={busy}
        onConfirm={confirmRemoveQuiz}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
