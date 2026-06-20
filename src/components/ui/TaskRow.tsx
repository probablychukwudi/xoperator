import type { Task } from '../../types'
import { formatShortDate } from '../../utils/dates'
import { Badge } from './Badge'

function urgencyTone(urgency: string) {
  if (urgency === 'now') return 'red' as const
  if (urgency === 'week') return 'amber' as const
  return 'neutral' as const
}

export function TaskRow({
  task,
  onToggle,
  onUrgencyChange,
  onDueDateChange,
}: {
  task: Task
  onToggle: () => void
  onUrgencyChange?: (urgency: Task['urgency']) => void
  onDueDateChange?: (date: string) => void
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-line bg-white p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <label className="flex min-w-0 items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-gray-300 text-signal focus:ring-signal"
          checked={task.done}
          onChange={onToggle}
        />
        <span className={task.done ? 'truncate text-sm text-gray-400 line-through' : 'truncate text-sm font-medium text-ink'}>
          {task.title}
        </span>
      </label>
      {onUrgencyChange ? (
        <select
          className="rounded-lg border border-line bg-white px-2 py-2 text-sm outline-none focus:border-signal focus:shadow-focus"
          value={task.urgency}
          onChange={(event) => onUrgencyChange(event.target.value as Task['urgency'])}
        >
          <option value="now">now</option>
          <option value="week">this week</option>
          <option value="soon">soon</option>
        </select>
      ) : (
        <Badge tone={urgencyTone(task.urgency)}>{task.urgency === 'week' ? 'this week' : task.urgency}</Badge>
      )}
      {onDueDateChange ? (
        <input
          type="date"
          className="rounded-lg border border-line bg-white px-2 py-2 text-sm outline-none focus:border-signal focus:shadow-focus"
          value={task.dueDate || ''}
          onChange={(event) => onDueDateChange(event.target.value)}
        />
      ) : (
        <span className="text-xs font-medium text-gray-500">{formatShortDate(task.dueDate)}</span>
      )}
    </div>
  )
}
