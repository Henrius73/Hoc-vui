export type Phase = 'lobby' | 'question' | 'reveal' | 'finished'

export type Question = {
  idx: number
  body: string
  a: string
  b: string
  c: string
  d: string
  correct: number | null
  seconds: number
  started_at: string | null
}

export type Player = {
  id: string
  name: string
  score: number
  answered?: number
  correct?: number
}

export type Mine = {
  answered: boolean
  choice: number | null
  is_correct: boolean | null
  points: number | null
  my_correct: number | null
}

export type RoomState = {
  room_id: string
  code: string
  phase: Phase
  q_index: number
  total: number
  server_now: string
  question: Question | null
  players: Player[]
  mine: Mine | null
}

export type Stat = { player: string; choice: number; correct: boolean; points: number }
export type PerQuestion = { idx: number; answered: number; correct: number }

export type HostState = RoomState & {
  stats: Stat[]
  per_question: PerQuestion[]
}

export type ParsedQuestion = {
  body: string
  a: string
  b: string
  c: string
  d: string
  correct: number
  seconds: number
}

export const CHOICE_LABELS = ['A', 'B', 'C', 'D'] as const

// 4 màu lựa chọn (độ đậm đạt tương phản chữ trắng/đen >= 4.5:1)
const CHOICE_BG = [
  'bg-rose-700 hover:bg-rose-800 active:bg-rose-900',
  'bg-sky-700 hover:bg-sky-800 active:bg-sky-900',
  'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',
  'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900',
] as const

/** Trả về lớp màu chữ + nền cho nút đáp án theo trạng thái (đúng/sai luôn kèm icon, không chỉ màu). */
export function choiceStyle(
  i: number,
  mode: 'normal' | 'correct' | 'wrong',
): { bg: string; fg: string } {
  const motion = 'transition-all duration-200 ease-out'
  if (mode === 'correct') return { bg: `bg-emerald-700 ${motion}`, fg: 'text-white' }
  if (mode === 'wrong') return { bg: `bg-rose-700 ${motion}`, fg: 'text-white' }
  // vàng (C) dùng chữ đậm trên nền sáng để giữ tương phản
  return { bg: `${CHOICE_BG[i]} ${motion}`, fg: i === 2 ? 'text-amber-950' : 'text-white' }
}
