import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { relativeTime } from '../utils/dates'
import { Button } from '../components/ui/Button'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { PageHeading } from '../components/ui/PageHeading'
import { TextInput } from '../components/ui/TextInput'
import { Badge } from '../components/ui/Badge'
import { AttachmentGrid } from '../components/media/AttachmentGrid'

export function Projects() {
  const projects = useAppStore((state) => state.projects)
  const addProject = useAppStore((state) => state.addProject)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const sorted = useMemo(() => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [projects])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Name the project before adding it.')
      return
    }
    addProject({ name: name.trim() })
    setName('')
    setError('')
  }

  return (
    <div>
      <PageHeading title="Projects" eyebrow="Things being built" />
      <form className="mb-5 grid gap-3 rounded-lg border border-line bg-white p-3 sm:grid-cols-[1fr_auto]" onSubmit={submit}>
        <TextInput
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
          placeholder="New project name"
        />
        <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
          Add project
        </Button>
      </form>
      {error ? <p className="-mt-3 mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {sorted.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="overflow-hidden rounded-lg border border-line bg-white transition hover:border-signal">
              <div className="h-36 bg-gray-100">
                {project.coverAttachment ? (
                  <AttachmentGrid attachments={[project.coverAttachment]} compact />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-medium text-gray-400">No cover</div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="line-clamp-2 text-base font-semibold text-ink">{project.name}</h2>
                  <Badge tone={project.status === 'active' ? 'green' : 'neutral'}>{project.status}</Badge>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {project.type.length ? project.type.slice(0, 3).map((tag) => <Badge key={tag}>{tag}</Badge>) : <Badge>untagged</Badge>}
                </div>
                <p className="line-clamp-2 min-h-10 text-sm text-gray-500">{project.description || 'No description yet.'}</p>
                <p className="mt-4 text-xs font-medium text-gray-500">Updated {relativeTime(project.updatedAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyPrompt />
      )}
    </div>
  )
}
