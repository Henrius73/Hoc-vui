const PLAYER_PREFIX = 'hv_player_'
const LAST_NAME_KEY = 'hv_player_name'
const PLAYER_TTL_MS = 24 * 60 * 60 * 1000 // 24 giờ

type StoredPlayer = {
  id: string
  name: string
  savedAt: number
}

function randToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
}

function ls(key: string): string {
  let v = localStorage.getItem(key)
  if (!v) {
    v = randToken()
    localStorage.setItem(key, v)
  }
  return v
}

function cleanupExpiredPlayers(): void {
  const now = Date.now()
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(PLAYER_PREFIX)) continue
      const raw = localStorage.getItem(k)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw) as Partial<StoredPlayer>
        if (!parsed.savedAt || now - parsed.savedAt > PLAYER_TTL_MS) {
          localStorage.removeItem(k)
        }
      } catch {
        localStorage.removeItem(k)
      }
    }
  } catch {
    // Bỏ qua nếu trình duyệt chặn truy cập storage
  }
}

/** Token chủ sở hữu bộ câu hỏi — lưu trên máy (localStorage), không cần tài khoản. */
export function ownerToken(): string {
  return ls('hv_owner_token')
}

/** Token điều khiển phòng — cũng trên máy, dùng để xem lại lịch sử phòng/kết quả. */
export function hostToken(): string {
  return ls('hv_host_token')
}

export function getPlayer(code: string): { id: string; name: string } | null {
  if (!code) return null
  try {
    const key = `${PLAYER_PREFIX}${code}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredPlayer>
    if (!parsed.id || !parsed.name) return null
    if (parsed.savedAt && Date.now() - parsed.savedAt > PLAYER_TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    return { id: parsed.id, name: parsed.name }
  } catch {
    return null
  }
}

export function setPlayer(code: string, id: string, name: string): void {
  cleanupExpiredPlayers()
  const payload: StoredPlayer = { id, name, savedAt: Date.now() }
  localStorage.setItem(`${PLAYER_PREFIX}${code}`, JSON.stringify(payload))
  setLastPlayerName(name)
}

export function getLastPlayerName(): string {
  try {
    return localStorage.getItem(LAST_NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setLastPlayerName(name: string): void {
  try {
    const trimmed = name.slice(0, 20)
    if (trimmed) {
      localStorage.setItem(LAST_NAME_KEY, trimmed)
    } else {
      localStorage.removeItem(LAST_NAME_KEY)
    }
  } catch {
    // Bỏ qua nếu trình duyệt chặn truy cập storage
  }
}
