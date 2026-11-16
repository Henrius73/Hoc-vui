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

/** Token chủ sở hữu bộ câu hỏi — lưu trên máy (localStorage), không cần tài khoản. */
export function ownerToken(): string {
  return ls('hv_owner_token')
}

/** Token điều khiển phòng — cũng trên máy, dùng để xem lại lịch sử phòng/kết quả. */
export function hostToken(): string {
  return ls('hv_host_token')
}

export function getPlayer(code: string): { id: string; name: string } | null {
  try {
    const raw = sessionStorage.getItem(`hv_player_${code}`)
    return raw ? (JSON.parse(raw) as { id: string; name: string }) : null
  } catch {
    return null
  }
}

export function setPlayer(code: string, id: string, name: string): void {
  sessionStorage.setItem(`hv_player_${code}`, JSON.stringify({ id, name }))
}
