import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Attachment } from '../../types'
import { Button } from '../ui/Button'

export function Lightbox({ attachment, onClose }: { attachment: Attachment | null; onClose: () => void }) {
  useEffect(() => {
    if (!attachment) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [attachment, onClose])

  if (!attachment) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={attachment.label || 'Attachment preview'}
      onClick={onClose}
    >
      <div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
        <Button
          className="absolute right-3 top-3 border-white/20 bg-black/70 text-white hover:bg-black"
          size="icon"
          aria-label="Close preview"
          onClick={onClose}
          icon={<X size={18} aria-hidden="true" />}
        />
        {attachment.type === 'video' ? (
          <video src={attachment.url} controls className="max-h-[86dvh] max-w-full rounded-lg bg-black" />
        ) : (
          <img src={attachment.url} alt={attachment.label || 'Attachment'} className="max-h-[86dvh] max-w-full rounded-lg object-contain" />
        )}
      </div>
    </div>
  )
}
