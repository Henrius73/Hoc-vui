import { useState, type DragEvent } from 'react'
import { parseQuizFile, downloadTemplate } from '../../lib/excel'
import type { ParsedQuestion } from '../../lib/types'
import { Button, Card, StepTitle } from '../../components/ui'
import { IconDownload } from '../../components/icons'

export type QuizPreview = {
  fileName: string
  name: string
  questions: ParsedQuestion[]
  errors: string[]
}

export function QuizImportCard({
  preview,
  busy,
  onPreviewChange,
  onSave,
  onError,
}: {
  preview: QuizPreview | null
  busy: boolean
  onPreviewChange: (p: QuizPreview | null) => void
  onSave: () => void
  onError: (msg: string | null) => void
}) {
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    onError(null)
    const res = await parseQuizFile(file)
    const name = file.name.replace(/\.(xlsx|xls)$/i, '')
    onPreviewChange({ fileName: file.name, name, ...res })
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  return (
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

        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`block cursor-pointer rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
            dragging
              ? 'border-violet-400 bg-violet-500/15'
              : 'border-zinc-700 bg-zinc-900/40 hover:border-violet-500/50 hover:bg-violet-500/5'
          }`}
        >
          <span className="sr-only">Chọn file Excel câu hỏi</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
            className="hidden"
          />
          <span className="block text-sm font-medium text-zinc-300">
            {dragging ? 'Thả file Excel vào đây' : 'Nhấn để chọn hoặc kéo thả file Excel (.xlsx, .xls)'}
          </span>
          <span className="mt-1 block text-xs text-zinc-500">Hỗ trợ .xlsx, .xls</span>
        </label>

        {preview && (
          <div className="fade-up space-y-4 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-400">
              Tệp đã chọn: <span className="font-mono text-zinc-200">{preview.fileName}</span>
            </p>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block">
                <span className="text-sm font-medium text-zinc-200">Tên bộ câu hỏi</span>
                <input
                  value={preview.name}
                  onChange={(e) => onPreviewChange({ ...preview, name: e.target.value })}
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
                {preview.errors.map((err, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden>•</span>
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={onSave} disabled={busy}>
                {busy ? 'Đang lưu...' : 'Lưu bộ câu hỏi'}
              </Button>
              <Button variant="outline" onClick={() => onPreviewChange(null)} disabled={busy}>
                Hủy
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
