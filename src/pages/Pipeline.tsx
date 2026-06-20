import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock3, MessageCircle, Plus, Users } from 'lucide-react'
import { OPPORTUNITY_STAGE_TRACKS, OPPORTUNITY_TYPES, opportunityStageTrackFor, useAppStore } from '../store/useAppStore'
import { daysUntil, formatShortDate } from '../utils/dates'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { PageHeading } from '../components/ui/PageHeading'
import { TextInput, inputClass } from '../components/ui/TextInput'
import { cx } from '../utils/cx'

function deadlineTone(days: number | null) {
  if (days === null) return 'neutral' as const
  if (days < 0) return 'red' as const
  if (days <= 7) return 'amber' as const
  return 'green' as const
}

function deadlineLabel(days: number | null) {
  if (days === null) return 'No deadline'
  if (days < 0) return `${Math.abs(days)} days late`
  if (days === 0) return 'Due today'
  return `${days} days left`
}

export function Pipeline() {
  const opportunities = useAppStore((state) => state.opportunities)
  const customOpportunityStages = useAppStore((state) => state.customOpportunityStages)
  const addOpportunity = useAppStore((state) => state.addOpportunity)
  const [name, setName] = useState('')
  const [type, setType] = useState('accelerator')
  const [view, setView] = useState<'board' | 'list' | 'timeline' | 'due'>('board')
  const [error, setError] = useState('')

  const grouped = useMemo(() => {
    return opportunities.reduce<Record<string, typeof opportunities>>((groups, opportunity) => {
      const key = opportunity.type || 'other'
      groups[key] = groups[key] || []
      groups[key].push(opportunity)
      return groups
    }, {})
  }, [opportunities])

  const boardStages = useMemo(() => {
    const preferred = ['Researching', 'Applying', 'Submitted', 'In Convo', 'Decision', 'Won', 'Passed']
    const customStages = OPPORTUNITY_TYPES.flatMap((type) => customOpportunityStages[type] || [])
    const customStageSet = new Set(customStages)
    const allStages = Array.from(new Set([...Object.values(OPPORTUNITY_STAGE_TRACKS).flat(), ...OPPORTUNITY_TYPES.flatMap((type) => opportunityStageTrackFor(type, customOpportunityStages))]))
    const activeStages = new Set(opportunities.map((opportunity) => opportunity.stage))
    return [...preferred, ...allStages.filter((stage) => !preferred.includes(stage))]
      .filter((stage) => activeStages.has(stage) || preferred.includes(stage) || customStageSet.has(stage))
      .slice(0, 12)
  }, [customOpportunityStages, opportunities])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Name the opportunity before adding it.')
      return
    }
    addOpportunity({ name: name.trim(), type })
    setName('')
    setType('accelerator')
    setError('')
  }

  return (
    <div>
      <PageHeading title="Pipeline" eyebrow="External opportunities" />
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="inline-flex w-fit rounded-xl bg-[#f3f3f3] p-1">
          {[
            ['board', 'Board'],
            ['list', 'List'],
            ['timeline', 'Timeline'],
            ['due', 'Due Tasks'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cx(
                'min-h-8 rounded-lg px-3 text-sm font-medium transition focus:outline-none focus-visible:shadow-focus',
                view === value ? 'bg-white text-ink shadow-[0_1px_4px_rgb(0_0_0/0.06)]' : 'text-gray-500 hover:text-ink',
              )}
              onClick={() => setView(value as typeof view)}
            >
              {label}
            </button>
          ))}
        </div>
        <form className="grid flex-1 gap-3 rounded-2xl border border-line bg-white p-3 md:grid-cols-[1fr_180px_auto]" onSubmit={submit}>
          <TextInput
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            placeholder="Opportunity name"
          />
          <select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}>
            {OPPORTUNITY_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
            Add opportunity
          </Button>
          {error ? <p className="text-sm font-medium text-red-700 md:col-span-3">{error}</p> : null}
        </form>
      </div>

      {view === 'board' ? (
        <div className="-mx-2 overflow-x-auto px-2 pb-4">
          <div className="flex min-w-max gap-3">
            {boardStages.map((stage, index) => {
              const rows = opportunities.filter((opportunity) => opportunity.stage === stage)
              const accent = ['bg-sky-400', 'bg-amber-400', 'bg-violet-400', 'bg-emerald-400', 'bg-rose-400'][index % 5]
              return (
                <section key={stage} className="min-h-[480px] w-[240px] rounded-2xl bg-[#f6f6f6] p-2">
                  <div className="mb-2 flex h-10 items-center justify-between px-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={cx('h-5 w-1 rounded-full', accent)} />
                      <h2 className="truncate text-sm font-semibold text-ink">{stage}</h2>
                      <span className="rounded-md bg-[#ededed] px-1.5 py-0.5 text-xs font-medium text-gray-400">{rows.length}</span>
                    </div>
                    <Plus size={16} className="text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="space-y-3">
                    {rows.map((opportunity) => {
                      const days = daysUntil(opportunity.deadline)
                      return (
                        <Link
                          key={opportunity.id}
                          to={`/pipeline/${opportunity.id}`}
                          className="block rounded-xl border border-line bg-white shadow-[0_2px_8px_rgb(0_0_0/0.05)] transition hover:-translate-y-px hover:shadow-[0_6px_16px_rgb(0_0_0/0.08)]"
                        >
                          <div className="border-b border-line px-3 py-2 text-xs font-medium text-gray-400">
                            Type: {opportunity.type}
                          </div>
                          <div className="p-3">
                            <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-ink">{opportunity.name}</h3>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <Badge tone="blue">{opportunity.type}</Badge>
                              {opportunity.value ? <Badge tone="amber">{opportunity.value}</Badge> : null}
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[0.68rem] font-medium text-gray-400">
                              <span className="inline-flex items-center gap-1">
                                <Users size={13} aria-hidden="true" />
                                1
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MessageCircle size={13} aria-hidden="true" />
                                {opportunity.log.length}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock3 size={13} aria-hidden="true" />
                                {days === null ? 'open' : days < 0 ? 'late' : `${days}d`}
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                    <button type="button" className="flex h-10 items-center gap-2 px-2 text-sm font-medium text-gray-500">
                      <Plus size={16} aria-hidden="true" />
                      Add new
                    </button>
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      ) : null}

      {opportunities.length && view !== 'board' ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, rows]) => (
            <section key={group}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{group}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {rows
                  .slice()
                  .sort((a, b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'))
                  .map((opportunity) => {
                    const days = daysUntil(opportunity.deadline)
                    return (
                      <Link key={opportunity.id} to={`/pipeline/${opportunity.id}`} className="rounded-2xl border border-line bg-white p-4 shadow-[0_2px_8px_rgb(0_0_0/0.04)] transition hover:border-gray-300">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-ink">{opportunity.name}</h3>
                            <p className="mt-1 text-sm text-gray-500">{opportunity.value || 'No value logged'}</p>
                          </div>
                          <Badge tone="blue">{opportunity.stage}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{opportunity.type}</Badge>
                          <Badge tone={deadlineTone(days)}>{deadlineLabel(days)}</Badge>
                          <span className="text-xs font-medium text-gray-500">Deadline {formatShortDate(opportunity.deadline)}</span>
                        </div>
                      </Link>
                    )
                  })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        view === 'board' || opportunities.length ? null : <EmptyPrompt />
      )}
    </div>
  )
}
