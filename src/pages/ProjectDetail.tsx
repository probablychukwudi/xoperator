import { FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import type { Attachment, EntityStatus, UrgencyLevel } from '../types'
import { PROJECT_STATUSES, PROJECT_TYPES, useAppStore } from '../store/useAppStore'
import { relativeTime } from '../utils/dates'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { LogComposer } from '../components/ui/LogComposer'
import { LogEntryCard } from '../components/ui/LogEntryCard'
import { MarkdownText } from '../components/ui/MarkdownText'
import { NotFound } from '../components/ui/NotFound'
import { PageHeading } from '../components/ui/PageHeading'
import { TaskRow } from '../components/ui/TaskRow'
import { TextArea, TextInput, inputClass, labelClass } from '../components/ui/TextInput'
import { AttachmentGrid } from '../components/media/AttachmentGrid'
import { DropZone } from '../components/media/DropZone'
import { cx } from '../utils/cx'

const tabs = ['Overview', 'Build log', 'Artifacts', 'Actions'] as const
const artifactTypes = ['firmware', 'frontend', 'backend', 'schematic', 'spec', 'dataset', 'model', 'teardown', 'video', 'other']

export function ProjectDetail() {
  const { projectId } = useParams()
  const project = useAppStore((state) => state.projects.find((item) => item.id === projectId))
  const updateProject = useAppStore((state) => state.updateProject)
  const addProjectLog = useAppStore((state) => state.addProjectLog)
  const addProjectArtifact = useAppStore((state) => state.addProjectArtifact)
  const addProjectTask = useAppStore((state) => state.addProjectTask)
  const updateProjectTask = useAppStore((state) => state.updateProjectTask)
  const toggleProjectTask = useAppStore((state) => state.toggleProjectTask)
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskUrgency, setTaskUrgency] = useState<UrgencyLevel>('soon')
  const [taskDue, setTaskDue] = useState('')
  const [artifactName, setArtifactName] = useState('')
  const [artifactType, setArtifactType] = useState('other')
  const [artifactUrl, setArtifactUrl] = useState('')
  const [artifactAttachment, setArtifactAttachment] = useState<Attachment | undefined>()
  const [taskError, setTaskError] = useState('')
  const [artifactError, setArtifactError] = useState('')

  if (!project || !projectId) return <NotFound backTo="/projects" label="Back to projects" />
  const currentProject = project

  function toggleTag(tag: string) {
    const next = currentProject.type.includes(tag) ? currentProject.type.filter((item) => item !== tag) : [...currentProject.type, tag]
    updateProject(currentProject.id, { type: next })
  }

  function submitTask(event: FormEvent) {
    event.preventDefault()
    if (!taskTitle.trim()) {
      setTaskError('Name the task before adding it.')
      return
    }
    addProjectTask(currentProject.id, { title: taskTitle.trim(), urgency: taskUrgency, dueDate: taskDue || undefined })
    setTaskTitle('')
    setTaskUrgency('soon')
    setTaskDue('')
    setTaskError('')
  }

  function submitArtifact(event: FormEvent) {
    event.preventDefault()
    if (!artifactName.trim() && !artifactAttachment && !artifactUrl.trim()) {
      setArtifactError('Add a name, link, or file before saving an artifact.')
      return
    }
    addProjectArtifact(currentProject.id, {
      name: artifactName,
      type: artifactType,
      url: artifactUrl.trim() || undefined,
      attachment: artifactAttachment,
    })
    setArtifactName('')
    setArtifactType('other')
    setArtifactUrl('')
    setArtifactAttachment(undefined)
    setArtifactError('')
  }

  function setCover(attachments: Attachment[]) {
    const cover = attachments[0]
    if (!cover) return
    updateProject(currentProject.id, { coverAttachment: cover })
    addProjectLog(currentProject.id, 'Updated cover media', [cover])
  }

  return (
    <div>
      <Link to="/projects" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-signal">
        <ArrowLeft size={16} aria-hidden="true" />
        Projects
      </Link>
      <PageHeading title={project.name} eyebrow={`Updated ${relativeTime(project.updatedAt)}`} />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={cx(
              'min-h-10 shrink-0 rounded-lg border px-3 text-sm font-medium focus:outline-none focus-visible:shadow-focus',
              activeTab === tab ? 'border-ink bg-ink text-white' : 'border-line bg-white text-gray-700 hover:border-signal',
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' ? (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Cover</h2>
            {project.coverAttachment ? <AttachmentGrid attachments={[project.coverAttachment]} /> : <EmptyPrompt title="Add a cover image or video." />}
            <div className="mt-3">
              <DropZone label="Replace cover" onAttachments={setCover} />
            </div>
          </section>
          <section className="rounded-lg border border-line bg-white p-4">
            <div className="grid gap-4">
              <label>
                <span className={labelClass}>Name</span>
                <TextInput value={project.name} onChange={(event) => updateProject(project.id, { name: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Status</span>
                <select
                  className={inputClass}
                  value={project.status}
                  onChange={(event) => updateProject(project.id, { status: event.target.value as EntityStatus })}
                >
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <span className={labelClass}>Type tags</span>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_TYPES.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={cx(
                        'min-h-9 rounded-lg border px-3 text-sm font-medium focus:outline-none focus-visible:shadow-focus',
                        project.type.includes(tag) ? 'border-signal bg-teal-50 text-teal-800' : 'border-line bg-white text-gray-600',
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <label>
                <span className={labelClass}>Description</span>
                <TextArea value={project.description || ''} onChange={(event) => updateProject(project.id, { description: event.target.value })} />
              </label>
              <div className="rounded-lg bg-paper p-3">
                <MarkdownText text={project.description} />
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'Build log' ? (
        <section className="space-y-4">
          <LogComposer onSave={(text, attachments) => addProjectLog(project.id, text, attachments)} buttonLabel="Save build entry" />
          {project.buildLog.length ? project.buildLog.map((entry) => <LogEntryCard key={entry.id} entry={entry} />) : <EmptyPrompt title="Drop the first build note." />}
        </section>
      ) : null}

      {activeTab === 'Artifacts' ? (
        <section className="space-y-4">
          <form className="rounded-lg border border-line bg-white p-4" onSubmit={submitArtifact}>
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_1fr]">
              <TextInput
                value={artifactName}
                onChange={(event) => {
                  setArtifactName(event.target.value)
                  setArtifactError('')
                }}
                placeholder="Artifact name"
              />
              <select className={inputClass} value={artifactType} onChange={(event) => setArtifactType(event.target.value)}>
                {artifactTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <TextInput
                value={artifactUrl}
                onChange={(event) => {
                  setArtifactUrl(event.target.value)
                  setArtifactError('')
                }}
                placeholder="Link URL"
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <DropZone
                compact
                label="Attach file"
                onAttachments={(attachments) => {
                  setArtifactAttachment(attachments[0])
                  setArtifactError('')
                }}
              />
              <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
                Add artifact
              </Button>
            </div>
            {artifactError ? <p className="mt-3 text-sm font-medium text-red-700">{artifactError}</p> : null}
            {artifactAttachment ? <div className="mt-3"><AttachmentGrid attachments={[artifactAttachment]} compact /></div> : null}
          </form>

          {project.artifacts.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {project.artifacts.map((artifact) => (
                <article key={artifact.id} className="rounded-lg border border-line bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h2 className="text-sm font-semibold text-ink">{artifact.name}</h2>
                    <Badge>{artifact.type}</Badge>
                  </div>
                  {artifact.attachment ? <AttachmentGrid attachments={[artifact.attachment]} compact /> : null}
                  {artifact.url ? (
                    <a href={artifact.url} target="_blank" rel="noreferrer" className="mt-3 block truncate text-sm font-medium text-signal hover:underline">
                      {artifact.url}
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyPrompt title="No artifacts yet." />
          )}
        </section>
      ) : null}

      {activeTab === 'Actions' ? (
        <section className="space-y-4">
          <form className="grid gap-3 rounded-lg border border-line bg-white p-4 lg:grid-cols-[1fr_160px_160px_auto]" onSubmit={submitTask}>
            <TextInput
              value={taskTitle}
              onChange={(event) => {
                setTaskTitle(event.target.value)
                setTaskError('')
              }}
              placeholder="Task name"
            />
            <select className={inputClass} value={taskUrgency} onChange={(event) => setTaskUrgency(event.target.value as UrgencyLevel)}>
              <option value="now">now</option>
              <option value="week">this week</option>
              <option value="soon">soon</option>
            </select>
            <TextInput type="date" value={taskDue} onChange={(event) => setTaskDue(event.target.value)} />
            <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
              Add task
            </Button>
            {taskError ? <p className="text-sm font-medium text-red-700 lg:col-span-4">{taskError}</p> : null}
          </form>
          {project.tasks.length ? (
            <div className="space-y-2">
              {project.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleProjectTask(project.id, task.id)}
                  onUrgencyChange={(urgency) => updateProjectTask(project.id, task.id, { urgency })}
                  onDueDateChange={(dueDate) => updateProjectTask(project.id, task.id, { dueDate })}
                />
              ))}
            </div>
          ) : (
            <EmptyPrompt title="No tasks yet." />
          )}
        </section>
      ) : null}
    </div>
  )
}
