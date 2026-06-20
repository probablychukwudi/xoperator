import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { OPPORTUNITY_TYPES, opportunityStageTrackFor, useAppStore } from '../store/useAppStore'
import { daysUntil, formatShortDate, relativeTime } from '../utils/dates'
import { AttachmentGrid } from '../components/media/AttachmentGrid'
import { DropZone } from '../components/media/DropZone'
import { Badge } from '../components/ui/Badge'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { LogComposer } from '../components/ui/LogComposer'
import { LogEntryCard } from '../components/ui/LogEntryCard'
import { MarkdownText } from '../components/ui/MarkdownText'
import { NotFound } from '../components/ui/NotFound'
import { PageHeading } from '../components/ui/PageHeading'
import { StageTrack } from '../components/ui/StageTrack'
import { TextArea, TextInput, inputClass, labelClass } from '../components/ui/TextInput'

function deadlineTone(days: number | null) {
  if (days === null) return 'neutral' as const
  if (days < 0) return 'red' as const
  if (days <= 7) return 'amber' as const
  return 'green' as const
}

export function OpportunityDetail() {
  const { opportunityId } = useParams()
  const opportunity = useAppStore((state) => state.opportunities.find((item) => item.id === opportunityId))
  const people = useAppStore((state) => state.people)
  const customOpportunityStages = useAppStore((state) => state.customOpportunityStages)
  const updateOpportunity = useAppStore((state) => state.updateOpportunity)
  const setOpportunityStage = useAppStore((state) => state.setOpportunityStage)
  const addOpportunityLog = useAppStore((state) => state.addOpportunityLog)

  if (!opportunity || !opportunityId) return <NotFound backTo="/pipeline" label="Back to pipeline" />

  const stages = opportunityStageTrackFor(opportunity.type, customOpportunityStages)
  const days = daysUntil(opportunity.deadline)

  return (
    <div>
      <Link to="/pipeline" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-signal">
        <ArrowLeft size={16} aria-hidden="true" />
        Pipeline
      </Link>
      <PageHeading title={opportunity.name} eyebrow={`Updated ${relativeTime(opportunity.updatedAt)}`} />

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <section className="space-y-5">
          <div className="rounded-lg border border-line bg-white p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge>{opportunity.type}</Badge>
              <Badge tone="blue">{opportunity.stage}</Badge>
              <Badge tone={deadlineTone(days)}>{days === null ? 'No deadline' : `${days} days`}</Badge>
            </div>
            <StageTrack stages={stages} current={opportunity.stage} onSelect={(stage) => setOpportunityStage(opportunity.id, stage)} />
          </div>

          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-4 text-base font-semibold">Info</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className={labelClass}>Name</span>
                <TextInput value={opportunity.name} onChange={(event) => updateOpportunity(opportunity.id, { name: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Type</span>
                <select
                  className={inputClass}
                  value={opportunity.type}
                  onChange={(event) => {
                    const type = event.target.value
                    updateOpportunity(opportunity.id, { type, stage: opportunityStageTrackFor(type, customOpportunityStages)[0] })
                  }}
                >
                  {OPPORTUNITY_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Value / prize</span>
                <TextInput value={opportunity.value || ''} onChange={(event) => updateOpportunity(opportunity.id, { value: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Deadline</span>
                <TextInput type="date" value={opportunity.deadline || ''} onChange={(event) => updateOpportunity(opportunity.id, { deadline: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>URL</span>
                <TextInput value={opportunity.url || ''} onChange={(event) => updateOpportunity(opportunity.id, { url: event.target.value })} placeholder="https://..." />
              </label>
              <label>
                <span className={labelClass}>Contact person</span>
                <select
                  className={inputClass}
                  value={opportunity.contactPersonId || ''}
                  onChange={(event) => updateOpportunity(opportunity.id, { contactPersonId: event.target.value || undefined })}
                >
                  <option value="">No contact linked</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="md:col-span-2">
                <span className={labelClass}>Notes</span>
                <TextArea value={opportunity.description || ''} onChange={(event) => updateOpportunity(opportunity.id, { description: event.target.value })} />
              </label>
            </div>
            <div className="mt-4 rounded-lg bg-paper p-3">
              <MarkdownText text={opportunity.description} />
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Deadline {formatShortDate(opportunity.deadline)}</p>
          </div>

          <div className="space-y-4">
            <LogComposer onSave={(text, attachments) => addOpportunityLog(opportunity.id, text, attachments)} buttonLabel="Save pipeline update" />
            {opportunity.log.length ? opportunity.log.map((entry) => <LogEntryCard key={entry.id} entry={entry} />) : <EmptyPrompt title="No updates yet." />}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Attachments</h2>
            {opportunity.attachments.length ? <AttachmentGrid attachments={opportunity.attachments} compact /> : <EmptyPrompt title="No attachments yet." />}
            <div className="mt-3">
              <DropZone compact label="Attach file" onAttachments={(attachments) => addOpportunityLog(opportunity.id, 'Attached media', attachments)} />
            </div>
          </div>
          {opportunity.url ? (
            <a
              href={opportunity.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-line bg-white p-4 text-sm font-medium text-signal hover:border-signal"
            >
              Open opportunity page
            </a>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
