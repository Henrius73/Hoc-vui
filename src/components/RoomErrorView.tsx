import { Link } from 'react-router'
import { Button, ErrorNote, btnClass } from './ui'

export function RoomErrorView({
  error,
  onRetry,
  backTo,
  backLabel = 'Quay lại',
}: {
  error: string
  onRetry?: () => void
  backTo?: string
  backLabel?: string
}) {
  return (
    <div className="mx-auto max-w-md space-y-3 px-4 py-16 text-center">
      <ErrorNote>{error}</ErrorNote>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      )}
      {backTo && (
        <div>
          <Link to={backTo} className={btnClass('outline')}>
            {backLabel}
          </Link>
        </div>
      )}
    </div>
  )
}
