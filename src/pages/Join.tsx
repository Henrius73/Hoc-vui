import { useSearchParams } from 'react-router'
import { Card } from '../components/ui'
import { JoinRoomForm } from '../components/JoinRoomForm'
import { IconPlay } from '../components/icons'

export default function Join() {
  const [params] = useSearchParams()
  const initialCode = params.get('code') ?? ''

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-10rem)] max-w-md items-center px-4 py-10 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-64">
        <div className="mx-auto h-56 w-72 rounded-full bg-violet-600/20 blur-3xl" />
      </div>
      <Card className="fade-up w-full overflow-hidden border-line bg-surface p-0 shadow-2xl shadow-black/40">
        <div className="border-b border-line bg-gradient-to-br from-violet-600/15 via-transparent to-orange-500/10 px-6 py-7 text-center sm:px-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-1 ring-white/10">
            <IconPlay width={26} height={26} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">Tham gia phòng học</h1>
          <p className="mt-1.5 text-sm text-muted">Nhập mã 6 số mà giáo viên đang hiển thị trên màn hình</p>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <JoinRoomForm initialCode={initialCode} autoFocusCode={!initialCode} />
        </div>
      </Card>
    </div>
  )
}
