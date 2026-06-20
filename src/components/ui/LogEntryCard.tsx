import type { LogEntry } from '../../types'
import { formatDateTime } from '../../utils/dates'
import { AttachmentGrid } from '../media/AttachmentGrid'
import { MarkdownText } from './MarkdownText'

export function LogEntryCard({ entry }: { entry: LogEntry }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <time className="text-xs font-medium text-gray-500">{formatDateTime(entry.createdAt)}</time>
      </div>
      <MarkdownText text={entry.text} />
      {entry.attachments.length ? <div className="mt-4"><AttachmentGrid attachments={entry.attachments} limit={3} compact /></div> : null}
    </article>
  )
}
