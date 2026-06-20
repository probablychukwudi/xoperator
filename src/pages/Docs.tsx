import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { completionCount, completionPercent, completionTarget, getAllDocTypes, getDocType } from '../store/docTypes'
import { useAppStore } from '../store/useAppStore'
import { relativeTime } from '../utils/dates'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { PageHeading } from '../components/ui/PageHeading'
import { ProgressBar } from '../components/ui/ProgressBar'
import { TextInput, inputClass } from '../components/ui/TextInput'

const statusRank: Record<string, number> = {
  'in-progress': 0,
  'not-started': 1,
  done: 2,
}

export function Docs() {
  const docs = useAppStore((state) => state.docs)
  const projects = useAppStore((state) => state.projects)
  const customDocTemplates = useAppStore((state) => state.customDocTemplates)
  const addDoc = useAppStore((state) => state.addDoc)
  const [name, setName] = useState('')
  const [docType, setDocType] = useState('pitch-deck')
  const [status, setStatus] = useState('all')
  const [projectId, setProjectId] = useState('all')
  const [error, setError] = useState('')
  const docTypes = getAllDocTypes(customDocTemplates)

  const filtered = useMemo(
    () =>
      docs
        .filter((doc) => status === 'all' || doc.status === status)
        .filter((doc) => projectId === 'all' || doc.linkedProjectId === projectId)
        .sort((a, b) => statusRank[a.status] - statusRank[b.status] || b.updatedAt.localeCompare(a.updatedAt)),
    [docs, projectId, status],
  )

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Name the doc before adding it.')
      return
    }
    addDoc({ name: name.trim(), docType })
    setName('')
    setDocType('pitch-deck')
    setError('')
  }

  return (
    <div>
      <PageHeading title="Docs" eyebrow="Strategic documents" />
      <form className="mb-4 grid gap-3 rounded-lg border border-line bg-white p-3 md:grid-cols-[1fr_260px_auto]" onSubmit={submit}>
        <TextInput
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
          placeholder="Doc name"
        />
        <select className={inputClass} value={docType} onChange={(event) => setDocType(event.target.value)}>
          {docTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
        <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
          Add doc
        </Button>
        {error ? <p className="text-sm font-medium text-red-700 md:col-span-3">{error}</p> : null}
      </form>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="in-progress">in progress</option>
          <option value="not-started">not started</option>
          <option value="done">done</option>
        </select>
        <select className={inputClass} value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          <option value="all">All linked projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((doc) => {
            const percent = completionPercent(doc)
            const count = completionCount(doc)
            const target = completionTarget(doc)
            return (
              <Link key={doc.id} to={`/docs/${doc.id}`} className="rounded-lg border border-line bg-white p-4 transition hover:border-signal">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-ink">{doc.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">{getDocType(doc.docType, customDocTemplates).label}</p>
                  </div>
                  <Badge tone={doc.status === 'done' ? 'green' : doc.status === 'in-progress' ? 'amber' : 'neutral'}>{doc.status.replace('-', ' ')}</Badge>
                </div>
                <ProgressBar value={percent} />
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-gray-500">
                  <span>
                    {Math.min(count, target)} / {target} sections done
                  </span>
                  <span>Updated {relativeTime(doc.updatedAt)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyPrompt />
      )}
    </div>
  )
}
