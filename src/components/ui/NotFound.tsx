import { Link } from 'react-router-dom'
import { Button } from './Button'

export function NotFound({ backTo = '/', label = 'Go home' }: { backTo?: string; label?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-6">
      <h1 className="text-xl font-semibold text-ink">Nothing here yet.</h1>
      <p className="mt-2 text-sm text-gray-500">This item may have been moved or deleted.</p>
      <Link to={backTo} className="mt-4 inline-block">
        <Button variant="primary">{label}</Button>
      </Link>
    </div>
  )
}
