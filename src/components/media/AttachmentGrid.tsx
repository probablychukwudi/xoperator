import { useEffect, useState } from 'react'
import { ExternalLink, FileText, ImageIcon, PlaySquare } from 'lucide-react'
import type { Attachment } from '../../types'
import { getMediaBlob } from '../../store/media'
import { cx } from '../../utils/cx'
import { Lightbox } from './Lightbox'

function iconFor(type: Attachment['type']) {
  if (type === 'video') return <PlaySquare size={18} aria-hidden="true" />
  if (type === 'pdf') return <FileText size={18} aria-hidden="true" />
  if (type === 'link') return <ExternalLink size={18} aria-hidden="true" />
  return <ImageIcon size={18} aria-hidden="true" />
}

function AttachmentTile({ attachment, compact }: { attachment: Attachment; compact?: boolean }) {
  const [previewUrl, setPreviewUrl] = useState(attachment.url)
  const [lightbox, setLightbox] = useState<Attachment | null>(null)

  useEffect(() => {
    let revokeUrl = ''
    let active = true

    if (!attachment.idbKey) {
      setPreviewUrl(attachment.url)
      return undefined
    }

    getMediaBlob(attachment.idbKey).then((blob) => {
      if (!blob || !active) return
      const objectUrl = URL.createObjectURL(blob)
      revokeUrl = objectUrl
      setPreviewUrl(objectUrl)
    })

    return () => {
      active = false
      if (revokeUrl) URL.revokeObjectURL(revokeUrl)
    }
  }, [attachment.idbKey, attachment.url])

  const resolvedAttachment = { ...attachment, url: previewUrl }

  if (attachment.type === 'link') {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-gray-700 hover:border-signal hover:text-signal"
      >
        {iconFor(attachment.type)}
        <span className="truncate">{attachment.label || attachment.url}</span>
      </a>
    )
  }

  if (attachment.type === 'pdf') {
    return (
      <a
        href={previewUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-gray-700 hover:border-signal hover:text-signal"
      >
        {iconFor(attachment.type)}
        <span className="truncate">{attachment.label || 'PDF attachment'}</span>
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        className={cx(
          'group relative overflow-hidden rounded-lg border border-line bg-gray-100 text-left focus:outline-none focus-visible:shadow-focus',
          compact ? 'h-24' : 'aspect-video min-h-36',
        )}
        onClick={() => setLightbox(resolvedAttachment)}
        aria-label={`Open ${attachment.label || attachment.type}`}
      >
        {attachment.type === 'video' ? (
          <>
            <video src={previewUrl} className="h-full w-full object-cover" muted />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
              <PlaySquare size={30} aria-hidden="true" />
            </span>
          </>
        ) : (
          <img src={previewUrl} alt={attachment.label || 'Attachment'} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        )}
        {attachment.label ? (
          <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-md bg-black/70 px-2 py-1 text-xs text-white">
            {attachment.label}
          </span>
        ) : null}
      </button>
      <Lightbox attachment={lightbox} onClose={() => setLightbox(null)} />
    </>
  )
}

export function AttachmentGrid({
  attachments,
  limit,
  compact,
}: {
  attachments: Attachment[]
  limit?: number
  compact?: boolean
}) {
  const visible = limit ? attachments.slice(0, limit) : attachments
  const remaining = limit ? Math.max(0, attachments.length - limit) : 0

  if (!attachments.length) return null

  return (
    <div className={cx('grid gap-3', compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
      {visible.map((attachment) => (
        <AttachmentTile key={attachment.id} attachment={attachment} compact={compact} />
      ))}
      {remaining > 0 ? (
        <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm font-medium text-gray-500">
          +{remaining} more
        </div>
      ) : null}
    </div>
  )
}
