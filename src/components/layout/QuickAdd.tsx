import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Sparkles, X } from 'lucide-react'
import type { Attachment } from '../../types'
import { getAllDocTypes } from '../../store/docTypes'
import { useAppStore } from '../../store/useAppStore'
import { type QuickDropSuggestion, suggestQuickDrop } from '../../services/ollama'
import { Button } from '../ui/Button'
import { DropZone } from '../media/DropZone'
import { TextInput } from '../ui/TextInput'
import { AttachmentGrid } from '../media/AttachmentGrid'

type QuickType = 'project' | 'opportunity' | 'person' | 'doc' | 'note' | 'expense'

const quickTypes: { value: QuickType; label: string }[] = [
  { value: 'project', label: 'Project' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'person', label: 'Person' },
  { value: 'doc', label: 'Doc' },
  { value: 'note', label: 'Note' },
  { value: 'expense', label: 'Expense' },
]

export function QuickAdd() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<QuickType>('project')
  const [docType, setDocType] = useState('pitch-deck')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [aiSuggestion, setAiSuggestion] = useState<QuickDropSuggestion | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [formError, setFormError] = useState('')
  const addProject = useAppStore((state) => state.addProject)
  const updateProject = useAppStore((state) => state.updateProject)
  const addOpportunity = useAppStore((state) => state.addOpportunity)
  const updateOpportunity = useAppStore((state) => state.updateOpportunity)
  const addPerson = useAppStore((state) => state.addPerson)
  const addDoc = useAppStore((state) => state.addDoc)
  const addNote = useAppStore((state) => state.addNote)
  const addCapitalEntry = useAppStore((state) => state.addCapitalEntry)
  const customDocTemplates = useAppStore((state) => state.customDocTemplates)
  const docTypes = getAllDocTypes(customDocTemplates)

  function reset() {
    setName('')
    setType('project')
    setDocType('pitch-deck')
    setAttachments([])
    setAiSuggestion(null)
    setAiError('')
    setFormError('')
  }

  function parseMoney(value?: string) {
    if (!value) return 0
    const number = Number(value.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(number) ? number : 0
  }

  async function runAiSort() {
    if (!name.trim() && !attachments.length) {
      setFormError('Add a name or attachment before sorting.')
      return
    }
    setAiBusy(true)
    setAiError('')
    setFormError('')
    try {
      const suggestion = await suggestQuickDrop({ text: name, attachmentCount: attachments.length })
      setAiSuggestion(suggestion)
      setType(suggestion.type)
      setName(suggestion.title)
      setDocType(suggestion.docType)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI sort failed.')
    } finally {
      setAiBusy(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const firstAttachment = attachments[0]
    const title = name.trim()
    const suggestion = aiSuggestion

    if (!title && !attachments.length) {
      setFormError('Add a name or attachment before dropping it in.')
      return
    }

    if (type === 'project') {
      const project = addProject({ name: title, coverAttachment: firstAttachment })
      if (suggestion?.summary || suggestion?.projectTags.length) {
        updateProject(project.id, {
          description: suggestion.summary,
          type: suggestion.projectTags,
        })
      }
      navigate(`/projects/${project.id}`)
    }
    if (type === 'opportunity') {
      const opportunity = addOpportunity({
        name: title,
        type: suggestion?.opportunityType || 'accelerator',
        attachment: firstAttachment,
      })
      if (suggestion?.summary || suggestion?.deadline || suggestion?.value) {
        updateOpportunity(opportunity.id, {
          description: suggestion.summary,
          deadline: suggestion.deadline,
          value: suggestion.value,
        })
      }
      navigate(`/pipeline/${opportunity.id}`)
    }
    if (type === 'person') {
      const person = addPerson({ name: title, attachment: firstAttachment })
      navigate(`/network/${person.id}`)
    }
    if (type === 'doc') {
      const doc = addDoc({ name: title, docType, attachment: firstAttachment })
      navigate(`/docs/${doc.id}`)
    }
    if (type === 'note') {
      addNote(title, attachments)
      navigate('/')
    }
    if (type === 'expense') {
      addCapitalEntry({
        description: title,
        amount: parseMoney(suggestion?.value),
        direction: suggestion?.capitalDirection || 'spent',
        bucket: suggestion?.capitalBucket || 'other',
        note: suggestion?.summary || '',
      })
      navigate('/capital')
    }

    reset()
    setOpen(false)
  }

  return (
    <>
      <Button
        className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-2xl shadow-lg lg:bottom-14 lg:right-14"
        variant="primary"
        size="icon"
        aria-label="Quick add"
        onClick={() => setOpen(true)}
        icon={<Plus size={24} aria-hidden="true" />}
      />
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-3 sm:items-center sm:justify-center" role="dialog" aria-modal="true">
          <form className="w-full max-w-2xl rounded-lg border border-line bg-paper p-4 shadow-2xl sm:p-5" onSubmit={submit}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Drop it in</h2>
                <p className="mt-1 text-sm text-gray-500">Name it now. Organize it later.</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Close quick add" onClick={() => setOpen(false)} icon={<X size={18} aria-hidden="true" />} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <TextInput
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setFormError('')
                }}
                placeholder="What is it?"
              />
              <select
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:shadow-focus"
                value={type}
                onChange={(event) => setType(event.target.value as QuickType)}
              >
                {quickTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {type === 'doc' ? (
              <select
                className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:shadow-focus"
                value={docType}
                onChange={(event) => setDocType(event.target.value)}
              >
                {docTypes.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.label}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="mt-3">
              <DropZone
                compact
                label="Attach image, video, or PDF"
                onAttachments={(next) => {
                  setAttachments((current) => [...next, ...current])
                  setFormError('')
                }}
              />
            </div>
            {attachments.length ? <div className="mt-3"><AttachmentGrid attachments={attachments} compact /></div> : null}
            {formError ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
            {aiError ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{aiError}</p> : null}
            {aiSuggestion ? (
              <p className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
                Sorted as {aiSuggestion.type}.
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={runAiSort}
                disabled={aiBusy || (!name.trim() && !attachments.length)}
                icon={<Sparkles size={17} aria-hidden="true" />}
              >
                {aiBusy ? 'Sorting...' : 'AI sort'}
              </Button>
              <Button variant="primary" type="submit">
                Drop it in
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
