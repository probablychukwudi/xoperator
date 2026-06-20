import { FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { PERSON_RELATIONSHIPS, PERSON_STATUSES, useAppStore } from '../store/useAppStore'
import { relativeTime } from '../utils/dates'
import { Button } from '../components/ui/Button'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { LogComposer } from '../components/ui/LogComposer'
import { LogEntryCard } from '../components/ui/LogEntryCard'
import { MarkdownText } from '../components/ui/MarkdownText'
import { NotFound } from '../components/ui/NotFound'
import { PageHeading } from '../components/ui/PageHeading'
import { TextArea, TextInput, inputClass, labelClass } from '../components/ui/TextInput'

export function PersonDetail() {
  const { personId } = useParams()
  const person = useAppStore((state) => state.people.find((item) => item.id === personId))
  const opportunities = useAppStore((state) => state.opportunities)
  const updatePerson = useAppStore((state) => state.updatePerson)
  const addContactLog = useAppStore((state) => state.addContactLog)
  const [urlLabel, setUrlLabel] = useState('')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  if (!person || !personId) return <NotFound backTo="/network" label="Back to network" />
  const currentPerson = person

  function submitUrl(event: FormEvent) {
    event.preventDefault()
    const nextUrl = url.trim()
    if (!nextUrl) {
      setUrlError('Paste a URL before adding a link.')
      return
    }
    try {
      const parsed = new URL(nextUrl)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol')
    } catch {
      setUrlError('Use a full URL that starts with http:// or https://.')
      return
    }
    updatePerson(currentPerson.id, {
      urls: [
        ...currentPerson.urls,
        {
          label: urlLabel.trim() || 'Link',
          url: nextUrl,
        },
      ],
    })
    setUrlLabel('')
    setUrl('')
    setUrlError('')
  }

  function removeUrl(index: number) {
    updatePerson(currentPerson.id, { urls: currentPerson.urls.filter((_, itemIndex) => itemIndex !== index) })
  }

  function toggleOpportunity(opportunityId: string) {
    const linked = currentPerson.linkedOpportunityIds.includes(opportunityId)
    updatePerson(currentPerson.id, {
      linkedOpportunityIds: linked
        ? currentPerson.linkedOpportunityIds.filter((id) => id !== opportunityId)
        : [...currentPerson.linkedOpportunityIds, opportunityId],
    })
  }

  return (
    <div>
      <Link to="/network" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-signal">
        <ArrowLeft size={16} aria-hidden="true" />
        Network
      </Link>
      <PageHeading title={person.name} eyebrow={`Updated ${relativeTime(person.updatedAt)}`} />

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <section className="space-y-5">
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-4 text-base font-semibold">Info</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className={labelClass}>Name</span>
                <TextInput value={person.name} onChange={(event) => updatePerson(person.id, { name: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Email</span>
                <TextInput type="email" value={person.email || ''} onChange={(event) => updatePerson(person.id, { email: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Role</span>
                <TextInput value={person.role || ''} onChange={(event) => updatePerson(person.id, { role: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Company</span>
                <TextInput value={person.company || ''} onChange={(event) => updatePerson(person.id, { company: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Relationship</span>
                <select className={inputClass} value={person.relationship} onChange={(event) => updatePerson(person.id, { relationship: event.target.value })}>
                  {PERSON_RELATIONSHIPS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Status</span>
                <select className={inputClass} value={person.status} onChange={(event) => updatePerson(person.id, { status: event.target.value })}>
                  {PERSON_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="md:col-span-2">
                <span className={labelClass}>Notes</span>
                <TextArea value={person.notes || ''} onChange={(event) => updatePerson(person.id, { notes: event.target.value })} />
              </label>
            </div>
            <div className="mt-4 rounded-lg bg-paper p-3">
              <MarkdownText text={person.notes} />
            </div>
          </div>

          <div className="space-y-4">
            <LogComposer onSave={(text, attachments) => addContactLog(person.id, text, attachments)} buttonLabel="Save contact note" />
            {person.contactLog.length ? person.contactLog.map((entry) => <LogEntryCard key={entry.id} entry={entry} />) : <EmptyPrompt title="No contact notes yet." />}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Links</h2>
            <form className="grid gap-2" onSubmit={submitUrl}>
              <TextInput value={urlLabel} onChange={(event) => setUrlLabel(event.target.value)} placeholder="Label, like LinkedIn" />
              <TextInput
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value)
                  setUrlError('')
                }}
                placeholder="https://..."
              />
              {urlError ? <p className="text-sm font-medium text-red-700">{urlError}</p> : null}
              <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
                Add link
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              {person.urls.length ? (
                person.urls.map((item, index) => (
                  <div key={`${item.url}-${index}`} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-line bg-paper p-2">
                    <a href={item.url} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-signal hover:underline">
                      {item.label}
                    </a>
                    <Button size="icon" variant="ghost" aria-label={`Remove ${item.label}`} onClick={() => removeUrl(index)} icon={<Trash2 size={16} aria-hidden="true" />} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No links yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Linked opportunities</h2>
            {opportunities.length ? (
              <div className="space-y-2">
                {opportunities.map((opportunity) => (
                  <label key={opportunity.id} className="flex items-center gap-3 rounded-lg border border-line bg-paper p-3">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-signal focus:ring-signal"
                      checked={person.linkedOpportunityIds.includes(opportunity.id)}
                      onChange={() => toggleOpportunity(opportunity.id)}
                    />
                    <span className="min-w-0 truncate text-sm font-medium">{opportunity.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <EmptyPrompt title="No opportunities yet." />
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
