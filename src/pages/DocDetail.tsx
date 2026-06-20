import { FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Plus, Sparkles } from 'lucide-react'
import type { DocSection } from '../types'
import { completionCount, completionPercent, completionTarget, getAllDocTypes, getDocType } from '../store/docTypes'
import { useAppStore } from '../store/useAppStore'
import { draftDocSection } from '../services/ollama'
import { createId } from '../utils/id'
import { formatDateTime, relativeTime } from '../utils/dates'
import { AttachmentGrid } from '../components/media/AttachmentGrid'
import { DropZone } from '../components/media/DropZone'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { LogComposer } from '../components/ui/LogComposer'
import { LogEntryCard } from '../components/ui/LogEntryCard'
import { NotFound } from '../components/ui/NotFound'
import { PageHeading } from '../components/ui/PageHeading'
import { ProgressBar } from '../components/ui/ProgressBar'
import { TextArea, TextInput, inputClass, labelClass } from '../components/ui/TextInput'

function SectionRow({
  section,
  expanded,
  onToggleExpand,
  onToggleDone,
  onNotes,
  onDraft,
  drafting,
  onMoveUp,
  onMoveDown,
}: {
  section: DocSection
  expanded: boolean
  onToggleExpand: () => void
  onToggleDone: () => void
  onNotes: (notes: string) => void
  onDraft: () => void
  drafting: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="grid gap-3 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-gray-400" aria-hidden="true" />
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 text-signal focus:ring-signal"
            checked={section.done}
            onChange={onToggleDone}
          />
        </div>
        <button type="button" className="min-w-0 text-left text-sm font-medium text-ink" onClick={onToggleExpand}>
          <span className={section.done ? 'line-through decoration-gray-400' : ''}>{section.title}</span>
          {section.optional ? <span className="ml-2 text-xs text-gray-400">optional</span> : null}
        </button>
        <div className="flex items-center gap-1">
          {expanded ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={onDraft}
              disabled={drafting}
              icon={<Sparkles size={15} aria-hidden="true" />}
            >
              {drafting ? 'Drafting...' : 'Draft'}
            </Button>
          ) : null}
          <Button size="icon" variant="ghost" aria-label={`Move ${section.title} up`} onClick={onMoveUp} icon={<ChevronUp size={16} aria-hidden="true" />} />
          <Button size="icon" variant="ghost" aria-label={`Move ${section.title} down`} onClick={onMoveDown} icon={<ChevronDown size={16} aria-hidden="true" />} />
        </div>
      </div>
      {expanded ? (
        <div className="border-t border-line p-3">
          <TextArea value={section.notes || ''} onChange={(event) => onNotes(event.target.value)} placeholder="Draft notes for this section" />
        </div>
      ) : null}
    </div>
  )
}

export function DocDetail() {
  const { docId } = useParams()
  const doc = useAppStore((state) => state.docs.find((item) => item.id === docId))
  const projects = useAppStore((state) => state.projects)
  const customDocTemplates = useAppStore((state) => state.customDocTemplates)
  const updateDoc = useAppStore((state) => state.updateDoc)
  const toggleDocSection = useAppStore((state) => state.toggleDocSection)
  const updateDocSection = useAppStore((state) => state.updateDocSection)
  const moveDocSection = useAppStore((state) => state.moveDocSection)
  const addDocVersion = useAppStore((state) => state.addDocVersion)
  const addDocLog = useAppStore((state) => state.addDocLog)
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [versionLabel, setVersionLabel] = useState('')
  const [draftingSectionId, setDraftingSectionId] = useState<string | null>(null)
  const [aiError, setAiError] = useState('')
  const [sectionError, setSectionError] = useState('')

  if (!doc || !docId) return <NotFound backTo="/docs" label="Back to docs" />
  const currentDoc = doc

  const docTypes = getAllDocTypes(customDocTemplates)
  const type = getDocType(currentDoc.docType, customDocTemplates)
  const percent = completionPercent(currentDoc)
  const count = completionCount(currentDoc)
  const target = completionTarget(currentDoc)

  function submitSection(event: FormEvent) {
    event.preventDefault()
    if (!newSectionTitle.trim()) {
      setSectionError('Name the section before adding it.')
      return
    }
    updateDoc(currentDoc.id, {
      sections: [
        ...currentDoc.sections,
        {
          id: createId('sec'),
          title: newSectionTitle.trim(),
          done: false,
        },
      ],
    })
    setNewSectionTitle('')
    setSectionError('')
  }

  async function draftSection(section: DocSection) {
    setDraftingSectionId(section.id)
    setAiError('')
    setExpandedSectionId(section.id)
    try {
      const draft = await draftDocSection({
        docName: currentDoc.name,
        docType: type.label,
        sectionTitle: section.title,
        existingNotes: section.notes || '',
        completedSections: currentDoc.sections.filter((item) => item.done).map((item) => item.title),
      })
      const existing = section.notes?.trim()
      updateDocSection(currentDoc.id, section.id, {
        notes: existing ? `${existing}\n\n${draft}` : draft,
      })
      updateDoc(currentDoc.id, { status: 'in-progress' })
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI draft failed.')
    } finally {
      setDraftingSectionId(null)
    }
  }

  return (
    <div>
      <Link to="/docs" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-signal">
        <ArrowLeft size={16} aria-hidden="true" />
        Docs
      </Link>
      <PageHeading title={doc.name} eyebrow={`Updated ${relativeTime(doc.updatedAt)}`} />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div className="rounded-lg border border-line bg-white p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge tone="blue">{type.label}</Badge>
              <Badge tone={doc.status === 'done' ? 'green' : doc.status === 'in-progress' ? 'amber' : 'neutral'}>{doc.status.replace('-', ' ')}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className={labelClass}>Doc name</span>
                <TextInput value={doc.name} onChange={(event) => updateDoc(doc.id, { name: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Status</span>
                <select className={inputClass} value={doc.status} onChange={(event) => updateDoc(doc.id, { status: event.target.value as typeof doc.status })}>
                  <option value="not-started">not started</option>
                  <option value="in-progress">in progress</option>
                  <option value="done">done</option>
                </select>
              </label>
              <label>
                <span className={labelClass}>Doc type</span>
                <select
                  className={inputClass}
                  value={doc.docType}
                  onChange={(event) => updateDoc(doc.id, { docType: event.target.value })}
                >
                  {docTypes.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Linked project</span>
                <select
                  className={inputClass}
                  value={doc.linkedProjectId || ''}
                  onChange={(event) => updateDoc(doc.id, { linkedProjectId: event.target.value || undefined })}
                >
                  <option value="">No linked project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4">
              <ProgressBar value={percent} />
              <p className="mt-2 text-xs font-medium text-gray-500">
                {Math.min(count, target)} / {target} sections done
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Sections</h2>
            </div>
            {aiError ? <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{aiError}</p> : null}
            <div className="space-y-2">
              {doc.sections.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  expanded={expandedSectionId === section.id}
                  onToggleExpand={() => setExpandedSectionId(expandedSectionId === section.id ? null : section.id)}
                  onToggleDone={() => toggleDocSection(doc.id, section.id)}
                  onNotes={(notes) => updateDocSection(doc.id, section.id, { notes })}
                  onDraft={() => draftSection(section)}
                  drafting={draftingSectionId === section.id}
                  onMoveUp={() => moveDocSection(doc.id, section.id, 'up')}
                  onMoveDown={() => moveDocSection(doc.id, section.id, 'down')}
                />
              ))}
            </div>
            <form className="mt-3 grid gap-3 rounded-lg border border-line bg-white p-3 sm:grid-cols-[1fr_auto]" onSubmit={submitSection}>
              <TextInput
                value={newSectionTitle}
                onChange={(event) => {
                  setNewSectionTitle(event.target.value)
                  setSectionError('')
                }}
                placeholder="New section title"
              />
              <Button type="submit" variant="primary" icon={<Plus size={17} aria-hidden="true" />}>
                Add section
              </Button>
              {sectionError ? <p className="text-sm font-medium text-red-700 sm:col-span-2">{sectionError}</p> : null}
            </form>
          </div>

          <div className="space-y-4">
            <LogComposer onSave={(text, attachments) => addDocLog(doc.id, text, attachments)} buttonLabel="Save doc note" />
            {doc.log.length ? doc.log.map((entry) => <LogEntryCard key={entry.id} entry={entry} />) : <EmptyPrompt title="No doc notes yet." />}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Versions</h2>
            <label>
              <span className={labelClass}>Version label</span>
              <TextInput value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} placeholder="v2 after partner feedback" />
            </label>
            <div className="mt-3">
              <DropZone
                compact
                label="Attach document"
                onAttachments={(attachments) => {
                  const attachment = attachments[0]
                  if (!attachment) return
                  addDocVersion(doc.id, attachment, versionLabel || undefined)
                  setVersionLabel('')
                }}
              />
            </div>
            <div className="mt-4 space-y-3">
              {doc.versions.length ? (
                doc.versions.map((version) => (
                  <div key={version.id} className="rounded-lg border border-line bg-paper p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold">{version.label || version.attachment.label || 'Document version'}</p>
                      <time className="shrink-0 text-xs font-medium text-gray-500">{formatDateTime(version.createdAt)}</time>
                    </div>
                    <AttachmentGrid attachments={[version.attachment]} compact />
                  </div>
                ))
              ) : (
                <EmptyPrompt title="No versions attached." />
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
