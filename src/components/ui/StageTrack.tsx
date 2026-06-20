import { Check } from 'lucide-react'
import { cx } from '../../utils/cx'

export function StageTrack({
  stages,
  current,
  onSelect,
}: {
  stages: string[]
  current: string
  onSelect: (stage: string) => void
}) {
  const currentIndex = Math.max(0, stages.indexOf(current))

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" role="list" aria-label="Stage track">
      {stages.map((stage, index) => {
        const active = stage === current
        const complete = index < currentIndex
        return (
          <button
            key={stage}
            type="button"
            className={cx(
              'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition focus:outline-none focus-visible:shadow-focus',
              active
                ? 'border-signal bg-signal text-white'
                : complete
                  ? 'border-teal-200 bg-teal-50 text-teal-800'
                  : 'border-line bg-white text-gray-600 hover:border-signal',
            )}
            onClick={() => onSelect(stage)}
          >
            {complete ? <Check size={15} aria-hidden="true" /> : null}
            {stage}
          </button>
        )
      })}
    </div>
  )
}
