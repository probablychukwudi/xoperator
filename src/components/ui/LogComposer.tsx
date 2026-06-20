import { useState } from 'react'
import type { Attachment } from '../../types'
import { Button } from './Button'
import { TextArea } from './TextInput'
import { DropZone } from '../media/DropZone'
import { AttachmentGrid } from '../media/AttachmentGrid'

export function LogComposer({
  placeholder = 'Drop the update here...',
  buttonLabel = 'Save update',
  onSave,
}: {
  placeholder?: string
  buttonLabel?: string
  onSave: (text: string, attachments: Attachment[]) => void
}) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])

  function submit() {
    if (!text.trim() && !attachments.length) return
    onSave(text, attachments)
    setText('')
    setAttachments([])
  }

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <TextArea value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} />
      {attachments.length ? <div className="mt-3"><AttachmentGrid attachments={attachments} compact /></div> : null}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DropZone compact label="Attach file" onAttachments={(next) => setAttachments((current) => [...next, ...current])} />
        <Button variant="primary" onClick={submit} disabled={!text.trim() && !attachments.length}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  )
}
