// Smoke test end-to-end cho backend Supabase (RPC + RLS).
// Chạy: node scripts/smoke.mjs   (cần .env đã điền)
// Kiểm tra: lưu bộ câu hỏi, tạo phòng, vào phòng, realtime state,
// chấm 1000 điểm, 1 đáp án/câu, chặn muộn theo giờ server, không lộ
// đáp án đúng trước khi công bố, RLS chặn đọc bảng nhạy cảm.
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    }),
)

const URL_ = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!URL_ || !KEY) {
  console.error('.env thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_PUBLISHABLE_KEY')
  process.exit(1)
}

let pass = 0
let fail = 0
const ok = (cond, label) => {
  if (cond) {
    pass++
    console.log(`  PASS  ${label}`)
  } else {
    fail++
    console.log(`  FAIL  ${label}`)
  }
}

async function rpc(fn, body) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`${fn} -> HTTP ${r.status}: ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : null
}

async function rest(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  const text = await r.text()
  return { status: r.status, body: text ? JSON.parse(text) : null }
}

const OWNER = 'smoketest_owner_token_0001'
const HOST = 'smoketest_host_token_0001'
const WRONG_HOST = 'smoketest_wrong_host_9999'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  console.log('1) Migration + bộ câu hỏi')
  const qids = [
    { body: 'Smoke: 1+1 = ?', a: '1', b: '2', c: '3', d: '4', correct: 1, seconds: 30 },
    { body: 'Smoke: 2+2 = ?', a: '4', b: '5', c: '6', d: '7', correct: 0, seconds: 30 },
    { body: 'Smoke: câu hết giờ (5s)', a: 'x', b: 'y', c: 'z', d: 'w', correct: 3, seconds: 5 },
  ]
  const quizId = await rpc('save_quiz', {
    p_owner: OWNER,
    p_name: 'SMOKE TEST (xóa được)',
    p_questions: qids,
    p_id: null,
  })
  ok(typeof quizId === 'string' && quizId.length > 10, 'save_quiz tạo được bộ câu hỏi')
  const list1 = await rpc('list_quizzes', { p_owner: OWNER })
  ok(list1.some((q) => q.id === quizId), 'list_quizzes thấy bộ vừa tạo')
  const list2 = await rpc('list_quizzes', { p_owner: 'khac_token_khac_0000' })
  ok(!list2.some((q) => q.id === quizId), 'token khác không thấy bộ của mình')

  console.log('2) Vào phòng')
  const code = await rpc('create_room', { p_owner: OWNER, p_host: HOST, p_quiz: quizId })
  ok(/^\d{6}$/.test(code), `create_room trả mã 6 số (${code})`)
  const pid = await rpc('join_room', { p_code: code, p_name: 'SmokeHS' })
  ok(typeof pid === 'string', 'join_room trả về id học sinh')
  const state0 = await rpc('get_room_state', { p_code: code, p_player: pid })
  ok(state0.phase === 'lobby' && state0.players.length === 1, 'state ban đầu = lobby, 1 học sinh')

  console.log('3) Chạy ván: pha câu hỏi, không lộ đáp án đúng')
  const started = await rpc('host_action', {
    p_host: HOST,
    p_code: code,
    p_action: 'start',
    p_q_index: 1,
  })
  ok(started === true, 'host start được câu 1')
  const state1 = await rpc('get_room_state', { p_code: code, p_player: pid })
  ok(state1.phase === 'question' && state1.question.idx === 1, 'phase = question, câu 1')
  ok(state1.question.correct === null, 'KHÔNG lộ đáp án đúng khi chưa công bố')

  console.log('4) Chấm điểm: đúng = 1000, 1 đáp án/câu')
  const r1 = await rpc('submit_answer', { p_code: code, p_player: pid, p_q_index: 1, p_choice: 1 })
  ok(r1 === true, 'trả lời đúng (B) -> true')
  const r2 = await rpc('submit_answer', { p_code: code, p_player: pid, p_q_index: 1, p_choice: 0 })
  ok(r2 === false, 'gửi lần 2 cùng câu -> false (bị chặn)')
  const st = await rest(`players?id=eq.${pid}&select=total_score`)
  ok(st.body?.[0]?.total_score === 1000, 'tổng điểm học sinh = 1000')

  console.log('5) Phân quyền host')
  let denied = false
  try {
    await rpc('host_snapshot', { p_host: WRONG_HOST, p_code: code, p_player: null })
  } catch {
    denied = true
  }
  ok(denied, 'host token sai không đọc được snapshot')
  const snap = await rpc('host_snapshot', { p_host: HOST, p_code: code, p_player: null })
  ok(snap.stats.length === 1 && snap.stats[0].correct === true, 'host thấy 1 câu trả lời đúng')

  console.log('6) Công bố rồi sang câu 2')
  await rpc('host_action', { p_host: HOST, p_code: code, p_action: 'reveal' })
  const state2 = await rpc('get_room_state', { p_code: code, p_player: pid })
  ok(state2.question.correct === 1, 'SAU công bố mới thấy đáp án đúng')
  await rpc('host_action', { p_host: HOST, p_code: code, p_action: 'next' })
  const state3 = await rpc('get_room_state', { p_code: code, p_player: pid })
  ok(state3.phase === 'question' && state3.question.idx === 2, 'sang câu 2')
  const stale = await rpc('submit_answer', { p_code: code, p_player: pid, p_q_index: 1, p_choice: 0 })
  ok(stale === false, 'trả lời câu cũ sau khi sang câu -> false')
  // câu 2 đáp án đúng = A(0) -> cố tình trả lời SAI B(1) để kiểm tra điểm không tăng
  await rpc('submit_answer', { p_code: code, p_player: pid, p_q_index: 2, p_choice: 1 })

  console.log('7) Hết giờ (câu 3, 5 giây, theo đồng hồ server)')
  await rpc('host_action', { p_host: HOST, p_code: code, p_action: 'reveal' })
  await rpc('host_action', { p_host: HOST, p_code: code, p_action: 'next' })
  await sleep(6000)
  const late = await rpc('submit_answer', { p_code: code, p_player: pid, p_q_index: 3, p_choice: 3 })
  ok(late === false, 'gửi sau khi hết 5s -> false (chặn muộn)')

  console.log('8) Kết thúc + lịch sử + RLS')
  await rpc('host_action', { p_host: HOST, p_code: code, p_action: 'finish' })
  let joinClosed = false
  try {
    await rpc('join_room', { p_code: code, p_name: 'VaoMuon' })
  } catch (e) {
    joinClosed = /kết thúc/i.test(String(e.message))
  }
  ok(joinClosed, 'ván kết thúc -> không join được nữa')
  const rooms = await rpc('list_rooms', { p_host: HOST })
  ok(rooms.some((r) => r.code === code && r.players === 1), 'list_rooms thấy phòng + số HS')
  const final = await rpc('get_room_state', { p_code: code, p_player: pid })
  ok(final.players[0].score === 1000 && final.mine.my_correct === 1, 'tổng kết: 1000 điểm, đúng 1 câu')
  const hostKeys = await rest('host_keys?select=*')
  ok(hostKeys.body?.length === 0, 'RLS: không đọc được host_keys trực tiếp')
  const questions = await rest('questions?select=*')
  ok(questions.body?.length === 0, 'RLS: không đọc được questions (đáp án) trực tiếp')
} catch (e) {
  fail++
  console.error('  LỖI DỪNG:', e.message)
  console.error(
    '(Nếu là HTTP 404 "Could not find the function" -> bạn chưa chạy supabase/migrations/0001_init.sql trong SQL Editor)',
  )
}

console.log(`\nKết quả: ${pass} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
