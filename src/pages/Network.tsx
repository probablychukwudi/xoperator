import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PERSON_RELATIONSHIPS, PERSON_STATUSES, useAppStore } from '../store/useAppStore'
import { formatShortDate } from '../utils/dates'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { PageHeading } from '../components/ui/PageHeading'
import { TextInput, inputClass } from '../components/ui/TextInput'

const statusRank: Record<string, number> = {
  'to contact': 0,
  'in convo': 1,
  active: 2,
  cold: 3,
  hired: 4,
  declined: 5,
}

export function Network() {
  const people = useAppStore((state) => state.people)
  const addPerson = useAppStore((state) => state.addPerson)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('all')
  const [status, setStatus] = useState('all')
  const [error, setError] = useState('')

  const filtered = useMemo(
    () =>
      people
        .filter((person) => relationship === 'all' || person.relationship === relationship)
        .filter((person) => status === 'all' || person.status === status)
        .sort((a, b) => (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) || b.updatedAt.localeCompare(a.updatedAt)),
    [people, relationship, status],
  )

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Name the person before adding them.')
      return
    }
    addPerson({ name: name.trim() })
    setName('')
    setError('')
  }

  return (
    <div>
      <PageHeading title="Network" eyebrow="People who matter" />
      <form className="mb-4 grid gap-3 rounded-lg border border-line bg-white p-3 sm:grid-cols-[1fr_auto]" onSubmit={submit}>
        <TextInput
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
          placeholder="Person name"
        />
        <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
          Add person
        </Button>
        {error ? <p className="text-sm font-medium text-red-700 sm:col-span-2">{error}</p> : null}
      </form>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <select className={inputClass} value={relationship} onChange={(event) => setRelationship(event.target.value)}>
          <option value="all">All relationships</option>
          {PERSON_RELATIONSHIPS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {PERSON_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((person) => {
            const lastContact = person.contactLog[0]?.createdAt
            return (
              <Link key={person.id} to={`/network/${person.id}`} className="rounded-lg border border-line bg-white p-4 transition hover:border-signal">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                    {person.name.slice(0, 1).toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="truncate text-base font-semibold text-ink">{person.name}</h2>
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-signal" aria-label={person.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {[person.role, person.company].filter(Boolean).join(' / ') || 'No role yet'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{person.relationship}</Badge>
                  <Badge tone={person.status === 'to contact' || person.status === 'in convo' ? 'amber' : 'neutral'}>{person.status}</Badge>
                </div>
                <p className="mt-4 text-xs font-medium text-gray-500">Last contact {formatShortDate(lastContact)}</p>
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
