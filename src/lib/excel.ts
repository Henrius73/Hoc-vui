import type { ParsedQuestion } from './types'

export type ParseResult = { questions: ParsedQuestion[]; errors: string[] }

const norm = (s: unknown): string =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim()

/** Cột gợi ý: Câu hỏi | A | B | C | D | Đáp án đúng | Thời gian (giây) */
export async function parseQuizFile(file: File): Promise<ParseResult> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return { questions: [], errors: ['Tệp không có sheet nào'] }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as unknown[][]

  // Tìm dòng tiêu đề; không thấy thì dùng thứ tự cột cố định
  let headerRow = rows.findIndex((r) => r.some((c) => /^(cau hoi|question)/.test(norm(c))))
  let cols: { body: number; a: number; b: number; c: number; d: number; correct: number; seconds: number } | null = null
  if (headerRow >= 0) {
    const h = rows[headerRow].map(norm)
    const find = (...keys: string[]) => h.findIndex((c) => keys.some((k) => c === k || c.startsWith(k)))
    cols = {
      body: find('cau hoi', 'question'),
      a: find('a'),
      b: find('b'),
      c: find('c'),
      d: find('d'),
      correct: find('dap an', 'correct'),
      seconds: find('thoi gian', 'giay', 'time'),
    }
    if (Object.values(cols).some((i) => i < 0)) cols = null // tên cột lạ → fallback positional
  }
  if (!cols) {
    headerRow = -1
    cols = { body: 0, a: 1, b: 2, c: 3, d: 4, correct: 5, seconds: 6 }
  }

  const questions: ParsedQuestion[] = []
  const errors: string[] = []

  rows.forEach((row, i) => {
    if (i <= headerRow) return
    const body = String(row[cols!.body] ?? '').trim()
    if (!body) return // bỏ qua dòng trống
    const rowNum = i + 1 // số dòng Excel (1-based)

    const a = String(row[cols!.a] ?? '').trim()
    const b = String(row[cols!.b] ?? '').trim()
    const c = String(row[cols!.c] ?? '').trim()
    const d = String(row[cols!.d] ?? '').trim()
    if (!a || !b || !c || !d) {
      errors.push(`Dòng ${rowNum}: thiếu đáp án (cần đủ A, B, C, D)`)
      return
    }

    const rawCorrect = norm(row[cols!.correct]).replace(/[.:)]/g, '').trim()
    let correct = -1
    if (/^[a-d]$/.test(rawCorrect)) correct = 'abcd'.indexOf(rawCorrect)
    else if (/^[1-4]$/.test(rawCorrect)) correct = parseInt(rawCorrect, 10) - 1
    if (correct < 0) {
      errors.push(`Dòng ${rowNum}: đáp án đúng phải là A/B/C/D hoặc 1/2/3/4`)
      return
    }

    const rawSec = String(row[cols!.seconds] ?? '').trim()
    let seconds = 20
    if (rawSec) {
      const n = Number(rawSec)
      if (!Number.isInteger(n) || n < 5 || n > 300) {
        errors.push(`Dòng ${rowNum}: thời gian phải là số nguyên 5–300 giây`)
        return
      }
      seconds = n
    }

    questions.push({ body, a, b, c, d, correct, seconds })
  })

  if (questions.length === 0 && errors.length === 0) {
    errors.push('Không tìm thấy câu hỏi nào (kiểm tra sheet đầu tiên của tệp)')
  }
  return { questions, errors }
}

/** Tải tệp Excel mẫu 7 cột. */
export async function downloadTemplate(): Promise<void> {
  const XLSX = await import('xlsx')
  const rows = [
    ['Câu hỏi', 'A', 'B', 'C', 'D', 'Đáp án đúng', 'Thời gian (giây)'],
    ['Thủ đô của Việt Nam là?', 'Hà Nội', 'Đà Lạt', 'Huế', 'Nha Trang', 'A', 20],
    ['5 + 7 = ?', '10', '11', '12', '13', 'C', 15],
    ['Hành tinh nào gần Mặt Trời nhất?', 'Trái Đất', 'Sao Kim', 'Sao Thủy', 'Sao Hỏa', 'C', 20],
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 14 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Câu hỏi')
  XLSX.writeFile(wb, 'mau-cau-hoi.xlsx')
}
