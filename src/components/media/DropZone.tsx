import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import type { Attachment } from '../../types'
import { createAttachmentFromFile } from '../../store/media'
import { cx } from '../../utils/cx'

interface DropZoneProps {
  onAttachments: (attachments: Attachment[]) => void
  label?: string
  compact?: boolean
}

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf'])
const ACCEPTED = Array.from(ACCEPTED_TYPES).join(',')

export function DropZone({ onAttachments, label = 'Attach media', compact }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)
    if (!fileArray.length) return
    const unsupported = fileArray.filter((file) => !ACCEPTED_TYPES.has(file.type))
    if (unsupported.length) {
      setError(`Unsupported file type: ${unsupported[0].name}.`)
      return
    }
    setError('')
    setIsWorking(true)
    try {
      const attachments = await Promise.all(fileArray.map((file) => createAttachmentFromFile(file)))
      onAttachments(attachments)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not store that file.')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div
      className={cx(
        'rounded-lg border border-dashed bg-white text-sm transition',
        isDragging ? 'border-signal bg-teal-50' : 'border-gray-300',
        compact ? 'p-3' : 'p-5',
      )}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        void handleFiles(event.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.target.files) void handleFiles(event.target.files)
          event.currentTarget.value = ''
        }}
      />
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:shadow-focus"
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={18} aria-hidden="true" />
        {isWorking ? 'Storing...' : label}
      </button>
      {error ? <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-center text-xs font-medium text-red-700">{error}</p> : null}
      {!compact ? <p className="mt-2 text-center text-xs text-gray-500">JPG, PNG, GIF, WebP, MP4, MOV, or PDF</p> : null}
    </div>
  )
}
