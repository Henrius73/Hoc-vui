import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { rpc } from '../lib/supabase'
import { ownerToken, hostToken } from '../lib/store'
import { parseQuizFile, downloadTemplate } from '../lib/excel'
import type { Phase, ParsedQuestion } from '../lib/types'
import { Button, Card, EmptyState, ErrorNote, Loading, StepTitle, btnClass } from '../components/ui'
import { IconDownload } from '../components/icons'

type QuizItem = { id: string; name: string; created_at: string; count: number }
type RoomItem = { code: string; quiz: string; created_at: string; phase: Phase; players: number }
type Preview = { name: string; questions: ParsedQuestion[]; errors: string[] }

const SAMPLE: ParsedQuestion[] = [
  { body: 'Thủ đô của Việt Nam là?', a: 'Hà Nội', b: 'Đà Lạt', c: 'Huế', d: 'Nha Trang', correct: 0, seconds: 20 },
  { body: '5 + 7 = ?', a: '10', b: '11', c: '12', d: '13', correct: 2, seconds: 15 },
  { body: 'Hành tinh nào gần Mặt Trời nhất?', a: 'Trái Đất', b: 'Sao Kim', c: 'Sao Thủy', d: 'Sao Hỏa', correct: 2, seconds: 20 },
  { body: 'Biển lớn nhất thế giới?', a: 'Đại Tây Dương', b: 'Băng Dương', c: 'Thái Bình Dương', d: 'Ấn Độ Dương', correct: 2, seconds: 20 },
  { body: 'Nước sôi ở 100 độ C ở áp suất...', a: 'thường', b: 'cao', c: 'thấp', d: 'không xác định', correct: 0, seconds: 20 },
]

const PHASE_LABEL: Record<Phase, { text: string; dot: string }> = {
  lobby: { text: 'Đang chờ', dot: 'bg-slate-400' },
  question: { text: 'Đang chơi', dot: 'bg-indigo-500' },
  reveal: { text: 'Đã công bố', dot: 'bg-amber-500' },
  finished: { text: 'Đã kết thúc', dot: 'bg-emerald-600' },
}

const FILE_INPUT =
  'block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700'

export default function HostLibrary() {
  const nav = useNavigate()
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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

  async function onFile(file: File | undefined) {
    if (!file) return
    setErr(null)
    const res = await parseQuizFile(file)
    const name = file.name.replace(/\.(xlsx|xls)$/i, '')
    setPreview({ name, ...res })
  }

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
    }
  }

  async function removeQuiz(id: string, name: string) {
    if (!confirm(`Xóa bộ "${name}"?`)) return
    setErr(null)
    try {
      await rpc<void>('delete_quiz', { p_owner: ownerToken(), p_id: id })
      await load()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Khu vực giáo viên</h1>
        <p className="mt-1 text-sm text-slate-600">
          Soạn câu hỏi từ Excel → mở phòng bằng mã 6 số → điều khiển ván → tổng kết và tải file điểm.
        </p>
      </div>

      {err && <ErrorNote>{err}</ErrorNote>}

      {/* 1. Thêm câu hỏi */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StepTitle n={1}>Thêm câu hỏi</StepTitle>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <IconDownload width={16} height={16} /> Tải tệp Excel mẫu
          </Button>
        </div>
        <p className="text-sm text-slate-600">
          Cột: <b>Câu hỏi · A · B · C · D · Đáp án đúng · Thời gian (giây)</b> — đáp án đúng ghi
          A/B/C/D (hoặc 1/2/3/4), thời gian 5–300 giây (để trống = 20s).
        </p>
        <input type="file" accept=".xlsx,.xls" onChange={(e) => onFile(e.target.files?.[0])} className={FILE_INPUT} />

        {preview && (
          <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
            <label className="block text-sm font-medium">
              Tên bộ câu hỏi
              <input
                value={preview.name}
                onChange={(e) => setPreview({ ...preview, name: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-indigo-500"
              />
            </label>
            <p className="text-sm font-semibold">
              Đã đọc được {preview.questions.length} câu hỏi
              {preview.errors.length > 0 && (
                <span className="font-normal text-rose-700"> · {preview.errors.length} lỗi</span>
              )}
            </p>
            <ul className="max-h-56 divide-y overflow-auto rounded-lg border border-slate-200 bg-white text-sm">
              {preview.questions.map((q, i) => (
                <li key={i} className="px-3 py-2">
                  <b>{i + 1}.</b> {q.body}
                  <span className="ml-2 text-slate-500">
                    · đúng: {['A', 'B', 'C', 'D'][q.correct]} · {q.seconds}s
                  </span>
                </li>
              ))}
            </ul>
            {preview.errors.length > 0 && (
              <ul className="list-inside list-disc space-y-0.5 text-sm font-medium text-rose-700">
                {preview.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Button onClick={saveQuiz} disabled={busy}>
                {busy ? 'Đang lưu...' : 'Lưu bộ câu hỏi'}
              </Button>
              <Button variant="outline" onClick={() => setPreview(null)}>
                Hủy
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 2. Thư viện */}
      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StepTitle n={2}>Bộ câu hỏi của tôi</StepTitle>
          <Button variant="outline" size="sm" onClick={createSample} disabled={busy}>
            + Tạo bộ mẫu
          </Button>
        </div>
        {!loaded ? (
          <Loading label="Đang tải thư viện..." />
        ) : quizzes.length === 0 ? (
          <EmptyState
            title="Chưa có bộ câu hỏi nào"
            hint="Nhập từ Excel ở bước 1, hoặc tạo bộ mẫu 5 câu để dùng thử ngay."
          />
        ) : (
          <ul className="divide-y">
            {quizzes.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{q.name}</p>
                  <p className="text-sm text-slate-500">
                    <span className="mr-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      {q.count} câu
                    </span>
                    {new Date(q.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="success" size="sm" onClick={() => openRoom(q.id)} disabled={q.count === 0}>
                    Mở phòng
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => removeQuiz(q.id, q.name)}>
                    Xóa
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 3. Lịch sử phòng */}
      <Card className="space-y-3 p-5">
        <StepTitle n={3}>Phòng đã mở</StepTitle>
        {!loaded ? (
          <Loading label="Đang tải danh sách phòng..." />
        ) : rooms.length === 0 ? (
          <EmptyState title="Chưa có phòng nào" hint="Chọn “Mở phòng” ở bước 2 để bắt đầu ván chơi." />
        ) : (
          <ul className="divide-y">
            {rooms.map((r) => (
              <li key={r.code} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-xl font-bold tracking-wider">{r.code}</span>
                  <span className="text-sm font-medium text-slate-700">{r.quiz}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <span aria-hidden className={`h-2 w-2 rounded-full ${PHASE_LABEL[r.phase].dot}`} />
                    {PHASE_LABEL[r.phase].text} · {r.players} người ·{' '}
                    {new Date(r.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <Link
                  to={`/host/results/${r.code}`}
                  className={btnClass('outline', 'sm', 'shrink-0')}
                >
                  Xem kết quả
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
