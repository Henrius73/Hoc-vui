import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { rpc } from '../lib/supabase'
import { ownerToken, hostToken } from '../lib/store'
import { parseQuizFile, downloadTemplate } from '../lib/excel'
import type { Phase, ParsedQuestion } from '../lib/types'
import { Button, Card, EmptyState, ErrorNote, Loading, PageHeader, StepTitle, btnClass } from '../components/ui'
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

const PHASE_LABEL: Record<Phase, { text: string; cls: string }> = {
  lobby: { text: 'Đang chờ', cls: 'bg-zinc-800 text-zinc-200 ring-zinc-700' },
  question: { text: 'Đang chơi', cls: 'bg-violet-500/15 text-violet-300 ring-violet-500/30' },
  reveal: { text: 'Đã công bố', cls: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  finished: { text: 'Đã kết thúc', cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
}

const FILE_INPUT =
  'block w-full cursor-pointer rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-400 transition-colors hover:border-violet-500/50 hover:bg-violet-500/5 file:hidden'

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
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Dành cho giáo viên"
        title="Thư viện & phòng chơi"
      />

      {err && <ErrorNote>{err}</ErrorNote>}

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/40 px-5 py-4 sm:px-6">
          <StepTitle n={1}>Thêm bộ câu hỏi</StepTitle>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <IconDownload width={16} height={16} /> Tải file Excel mẫu
          </Button>
        </div>
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <p className="text-sm leading-relaxed text-zinc-400">
            Định dạng cột: <b className="text-zinc-200">Câu hỏi · A · B · C · D · Đáp án đúng · Thời gian (giây)</b>.
            Đáp án đúng ghi A/B/C/D (hoặc 1–4), thời gian 5–300 giây (mặc định 20s).
          </p>
          <label className="block">
            <span className="sr-only">Chọn file Excel câu hỏi</span>
            <input type="file" accept=".xlsx,.xls" onChange={(e) => onFile(e.target.files?.[0])} className={FILE_INPUT} />
            <span className="mt-2 block text-center text-xs text-zinc-500">Hỗ trợ .xlsx, .xls — nhấn để chọn file</span>
          </label>

          {preview && (
            <div className="fade-up space-y-4 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-200">Tên bộ câu hỏi</span>
                  <input
                    value={preview.name}
                    onChange={(e) => setPreview({ ...preview, name: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-[#18181d] px-3.5 py-2.5 text-white focus:border-violet-500"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                    {preview.questions.length} câu hợp lệ
                  </span>
                  {preview.errors.length > 0 && (
                    <span className="rounded-full bg-rose-500/15 px-3 py-1 font-semibold text-rose-300 ring-1 ring-rose-500/30">
                      {preview.errors.length} lỗi
                    </span>
                  )}
                </div>
              </div>

              <ul className="max-h-60 divide-y divide-zinc-800 overflow-auto rounded-xl border border-zinc-800 bg-[#121216] text-sm">
                {preview.questions.map((q, i) => (
                  <li key={i} className="flex gap-3 px-3.5 py-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-zinc-800 text-[11px] font-bold text-zinc-300">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-zinc-100">{q.body}</span>
                      <span className="ml-2 text-zinc-500">
                        · Đáp án {['A', 'B', 'C', 'D'][q.correct]} · {q.seconds}s
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              {preview.errors.length > 0 && (
                <ul className="space-y-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {preview.errors.map((e, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden>•</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={saveQuiz} disabled={busy}>
                  {busy ? 'Đang lưu...' : 'Lưu bộ câu hỏi'}
                </Button>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/40 px-5 py-4 sm:px-6">
            <StepTitle n={2}>Bộ câu hỏi của tôi</StepTitle>
            <Button variant="outline" size="sm" onClick={createSample} disabled={busy}>
              + Tạo bộ mẫu
            </Button>
          </div>
          <div className="px-5 py-4 sm:px-6">
            {!loaded ? (
              <Loading label="Đang tải thư viện..." />
            ) : quizzes.length === 0 ? (
              <EmptyState
                title="Chưa có bộ câu hỏi"
                hint="Nhập từ Excel ở bước 1, hoặc tạo nhanh bộ mẫu 5 câu để dùng thử."
              />
            ) : (
              <ul className="space-y-3">
                {quizzes.map((q) => (
                  <li
                    key={q.id}
                    className="hover-lift flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-[#16161b] p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{q.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                        <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/30">
                          {q.count} câu
                        </span>
                        <span>{new Date(q.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
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
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-800 bg-zinc-900/40 px-5 py-4 sm:px-6">
            <StepTitle n={3}>Phòng đã mở</StepTitle>
          </div>
          <div className="px-5 py-4 sm:px-6">
            {!loaded ? (
              <Loading label="Đang tải danh sách phòng..." />
            ) : rooms.length === 0 ? (
              <EmptyState title="Chưa có phòng nào" hint="Mở một phòng từ bộ câu hỏi để bắt đầu." />
            ) : (
              <ul className="space-y-3">
                {rooms.map((r) => (
                  <li key={r.code} className="rounded-xl border border-zinc-800 bg-[#16161b] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-lg font-bold tracking-wider text-white">{r.code}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${PHASE_LABEL[r.phase].cls}`}>
                            {PHASE_LABEL[r.phase].text}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-zinc-300">{r.quiz}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {r.players} người · {new Date(r.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <Link to={`/host/results/${r.code}`} className={btnClass('outline', 'sm', 'shrink-0')}>
                        Kết quả
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
