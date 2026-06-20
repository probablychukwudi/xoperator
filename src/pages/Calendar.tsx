import { FormEvent, useMemo, useRef, useState } from 'react'
import { addDays, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { ExternalCalendar } from '../types'
import { fetchIcsCalendar, normalizeCalendarUrl, parseIcsCalendar, type ParsedIcsEvent } from '../services/ics'
import { PageHeading } from '../components/ui/PageHeading'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { TextInput } from '../components/ui/TextInput'
import { cx } from '../utils/cx'

interface CalendarItem {
  id: string
  title: string
  date: string
  type: 'task' | 'opportunity' | 'doc' | 'capital' | 'reminder' | 'external'
  href?: string
  externalUrl?: string
  calendarName?: string
  allDay?: boolean
  startsAt?: string
}

const toneByType: Record<CalendarItem['type'], 'neutral' | 'green' | 'amber' | 'red' | 'blue'> = {
  task: 'red',
  opportunity: 'amber',
  doc: 'blue',
  capital: 'green',
  reminder: 'amber',
  external: 'neutral',
}

function safeParse(value: string) {
  const date = parseISO(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function dateKey(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = safeParse(value)
  return date ? format(date, 'yyyy-MM-dd') : value.slice(0, 10)
}

function timeLabel(item: CalendarItem) {
  if (item.allDay || !item.startsAt || /^\d{4}-\d{2}-\d{2}$/.test(item.startsAt)) return 'All day'
  const date = safeParse(item.startsAt)
  return date ? format(date, 'h:mm a') : 'All day'
}

function syncMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Calendar sync failed.'
}

function eventInputFromParsed(events: ParsedIcsEvent[]) {
  return events.map((event) => ({
    uid: event.uid,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    allDay: event.allDay,
    location: event.location,
    description: event.description,
    url: event.url,
  }))
}

export function Calendar() {
  const projects = useAppStore((state) => state.projects)
  const opportunities = useAppStore((state) => state.opportunities)
  const docs = useAppStore((state) => state.docs)
  const capital = useAppStore((state) => state.capital)
  const reminders = useAppStore((state) => state.reminders)
  const externalCalendars = useAppStore((state) => state.externalCalendars)
  const externalCalendarEvents = useAppStore((state) => state.externalCalendarEvents)
  const addExternalCalendar = useAppStore((state) => state.addExternalCalendar)
  const updateExternalCalendar = useAppStore((state) => state.updateExternalCalendar)
  const removeExternalCalendar = useAppStore((state) => state.removeExternalCalendar)
  const replaceExternalCalendarEvents = useAppStore((state) => state.replaceExternalCalendarEvents)
  const [cursor, setCursor] = useState(() => new Date())
  const [calendarName, setCalendarName] = useState('')
  const [calendarUrl, setCalendarUrl] = useState('')
  const [calendarError, setCalendarError] = useState('')
  const [calendarStatus, setCalendarStatus] = useState('')
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const items = useMemo<CalendarItem[]>(() => {
    const calendarById = new Map(externalCalendars.map((calendar) => [calendar.id, calendar]))
    const taskItems = projects.flatMap((project) =>
      project.tasks
        .filter((task) => task.dueDate && !task.done)
        .map((task) => ({
          id: task.id,
          title: task.title,
          date: task.dueDate!,
          type: 'task' as const,
          href: `/projects/${project.id}`,
        })),
    )

    const opportunityItems = opportunities
      .filter((opportunity) => opportunity.deadline)
      .map((opportunity) => ({
        id: opportunity.id,
        title: opportunity.name,
        date: opportunity.deadline!,
        type: 'opportunity' as const,
        href: `/pipeline/${opportunity.id}`,
      }))

    const docItems = docs
      .filter((doc) => doc.status === 'in-progress')
      .map((doc) => ({
        id: doc.id,
        title: doc.name,
        date: doc.updatedAt.slice(0, 10),
        type: 'doc' as const,
        href: `/docs/${doc.id}`,
      }))

    const capitalItems = capital.map((entry) => ({
      id: entry.id,
      title: entry.description,
      date: entry.date,
      type: 'capital' as const,
      href: '/capital',
    }))

    const reminderItems = reminders
      .filter((reminder) => reminder.dueDate && !reminder.done)
      .map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        date: reminder.dueDate,
        type: 'reminder' as const,
        href: reminder.linkedHref || '/customize',
      }))

    const externalItems = externalCalendarEvents.map((event) => {
      const calendar = calendarById.get(event.calendarId)
      return {
        id: event.id,
        title: event.title,
        date: dateKey(event.startsAt),
        type: 'external' as const,
        externalUrl: event.url,
        calendarName: calendar?.name || 'External',
        allDay: event.allDay,
        startsAt: event.startsAt,
      }
    })

    return [...taskItems, ...opportunityItems, ...docItems, ...capitalItems, ...reminderItems, ...externalItems].sort(
      (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
    )
  }, [capital, docs, externalCalendarEvents, externalCalendars, opportunities, projects, reminders])

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor))
    const end = endOfWeek(endOfMonth(cursor))
    const days: Date[] = []
    for (let day = start; day <= end; day = addDays(day, 1)) {
      days.push(day)
    }
    return days
  }, [cursor])

  const upcoming = items.filter((item) => {
    const itemDate = safeParse(item.date)
    return itemDate && itemDate >= startOfMonth(cursor) && itemDate <= endOfMonth(cursor)
  })

  function itemsForDay(day: Date) {
    return items.filter((item) => {
      const itemDate = safeParse(item.date)
      return itemDate ? isSameDay(itemDate, day) : false
    })
  }

  async function syncCalendar(calendar: ExternalCalendar) {
    if (!calendar.url) {
      setCalendarError('Imported calendar files cannot sync. Import a newer .ics file instead.')
      return
    }

    setCalendarError('')
    setCalendarStatus('')
    setSyncingId(calendar.id)
    updateExternalCalendar(calendar.id, { syncError: '' })

    try {
      const events = await fetchIcsCalendar(calendar.url)
      replaceExternalCalendarEvents(calendar.id, eventInputFromParsed(events))
      updateExternalCalendar(calendar.id, {
        lastSyncedAt: new Date().toISOString(),
        syncError: '',
      })
      setCalendarStatus(`${calendar.name} synced.`)
    } catch (error) {
      const message = syncMessage(error)
      updateExternalCalendar(calendar.id, { syncError: message })
      setCalendarError(message)
    } finally {
      setSyncingId(null)
    }
  }

  async function submitExternalCalendar(event: FormEvent) {
    event.preventDefault()
    if (!calendarName.trim()) {
      setCalendarError('Add a calendar name before subscribing.')
      return
    }
    if (!calendarUrl.trim()) {
      setCalendarError('Paste an .ics calendar URL before subscribing.')
      return
    }

    let normalizedUrl = ''
    try {
      normalizedUrl = normalizeCalendarUrl(calendarUrl)
    } catch (error) {
      setCalendarError(syncMessage(error))
      return
    }

    const calendar = addExternalCalendar({
      name: calendarName.trim(),
      source: 'url',
      url: normalizedUrl,
    })

    setCalendarName('')
    setCalendarUrl('')
    await syncCalendar(calendar)
  }

  async function importCalendarFile(file?: File) {
    if (!file) return
    setCalendarError('')
    setCalendarStatus('')
    setSyncingId('import')

    try {
      const text = await file.text()
      const events = parseIcsCalendar(text)
      if (!events.length) throw new Error('No events were found in that file.')
      const calendar = addExternalCalendar({
        name: file.name.replace(/\.ics$/i, '') || 'Imported calendar',
        source: 'file',
      })
      replaceExternalCalendarEvents(calendar.id, eventInputFromParsed(events))
      updateExternalCalendar(calendar.id, {
        lastSyncedAt: new Date().toISOString(),
        syncError: '',
      })
      setCalendarStatus(`${calendar.name} imported.`)
    } catch (error) {
      setCalendarError(syncMessage(error))
    } finally {
      setSyncingId(null)
    }
  }

  function renderCalendarChip(item: CalendarItem) {
    const className = 'block truncate rounded-md bg-[#f3f3f3] px-2 py-1 text-[0.68rem] font-medium text-gray-600 hover:bg-gray-200'

    if (item.href) {
      return (
        <a key={item.id} href={`#${item.href}`} className={className}>
          {item.title}
        </a>
      )
    }

    if (item.externalUrl) {
      return (
        <a key={item.id} href={item.externalUrl} target="_blank" rel="noreferrer" className={className}>
          {item.title}
        </a>
      )
    }

    return (
      <div key={item.id} className={className}>
        {item.title}
      </div>
    )
  }

  function renderUpcomingItem(item: CalendarItem) {
    const content = (
      <>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Badge tone={toneByType[item.type]}>{item.type}</Badge>
          <time className="text-xs font-medium text-gray-400">
            {format(safeParse(item.date) || new Date(), 'MMM d')} {item.type === 'external' ? timeLabel(item) : ''}
          </time>
        </div>
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-ink">{item.title}</p>
        {item.calendarName ? <p className="mt-1 truncate text-xs font-medium text-gray-400">{item.calendarName}</p> : null}
      </>
    )
    const className = 'block rounded-xl border border-line bg-white p-3 shadow-[0_2px_8px_rgb(0_0_0/0.04)] transition hover:-translate-y-px'

    if (item.href) {
      return (
        <a key={`${item.type}-${item.id}`} href={`#${item.href}`} className={className}>
          {content}
        </a>
      )
    }

    if (item.externalUrl) {
      return (
        <a key={`${item.type}-${item.id}`} href={item.externalUrl} target="_blank" rel="noreferrer" className={className}>
          {content}
        </a>
      )
    }

    return (
      <div key={`${item.type}-${item.id}`} className={className}>
        {content}
      </div>
    )
  }

  return (
    <div>
      <PageHeading title="Calendar" eyebrow="Schedule" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#f3f3f3] p-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Previous month"
            onClick={() => setCursor((date) => addDays(startOfMonth(date), -1))}
            icon={<ChevronLeft size={17} aria-hidden="true" />}
          />
          <div className="min-w-40 px-3 text-center text-sm font-semibold">{format(cursor, 'MMMM yyyy')}</div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Next month"
            onClick={() => setCursor((date) => addDays(endOfMonth(date), 1))}
            icon={<ChevronRight size={17} aria-hidden="true" />}
          />
        </div>
        <Button className="self-start sm:self-auto" variant="secondary" icon={<CalendarDays size={17} aria-hidden="true" />} onClick={() => setCursor(new Date())}>
          Today
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl bg-[#f6f6f6] p-3">
          <div className="grid grid-cols-7 gap-2 px-1 pb-2 text-xs font-medium text-gray-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day) => {
              const dayItems = itemsForDay(day)
              return (
                <div
                  key={day.toISOString()}
                  className={cx(
                    'min-h-[112px] rounded-xl border border-line bg-white p-2 shadow-[0_1px_5px_rgb(0_0_0/0.04)]',
                    !isSameMonth(day, cursor) && 'bg-[#fafafa] text-gray-300',
                  )}
                >
                  <div
                    className={cx(
                      'mb-2 flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold',
                      isSameDay(day, new Date()) ? 'bg-ink text-white' : 'text-gray-500',
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map((item) => (
                      renderCalendarChip(item)
                    ))}
                    {dayItems.length > 3 ? <div className="px-2 text-[0.68rem] font-medium text-gray-400">+{dayItems.length - 3} more</div> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl bg-[#f6f6f6] p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink">This month</h2>
              <span className="rounded-md bg-[#ededed] px-1.5 py-0.5 text-xs font-medium text-gray-400">{upcoming.length}</span>
            </div>
            <div className="space-y-2">
              {upcoming.length ? (
                upcoming.map((item) => renderUpcomingItem(item))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-sm font-medium text-gray-500">
                  Nothing scheduled this month.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-[#f6f6f6] p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink">External calendars</h2>
              <span className="rounded-md bg-[#ededed] px-1.5 py-0.5 text-xs font-medium text-gray-400">{externalCalendars.length}</span>
            </div>
            <form className="space-y-2" onSubmit={submitExternalCalendar}>
              <TextInput
                value={calendarName}
                onChange={(event) => {
                  setCalendarName(event.target.value)
                  setCalendarError('')
                }}
                placeholder="Calendar name"
              />
              <TextInput
                value={calendarUrl}
                onChange={(event) => {
                  setCalendarUrl(event.target.value)
                  setCalendarError('')
                }}
                placeholder="https:// or webcal:// .ics URL"
              />
              <Button
                className="w-full"
                variant="primary"
                type="submit"
                disabled={Boolean(syncingId)}
                icon={<RefreshCw size={17} aria-hidden="true" />}
              >
                {syncingId && syncingId !== 'import' ? 'Syncing...' : 'Subscribe & sync'}
              </Button>
            </form>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".ics,text/calendar"
                className="sr-only"
                aria-label="Import .ics file"
                onChange={(event) => {
                  void importCalendarFile(event.target.files?.[0])
                  event.currentTarget.value = ''
                }}
              />
              <Button
                className="w-full"
                variant="secondary"
                disabled={Boolean(syncingId)}
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload size={17} aria-hidden="true" />}
              >
                {syncingId === 'import' ? 'Importing...' : 'Import .ics'}
              </Button>
            </div>
            {calendarError ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{calendarError}</p> : null}
            {calendarStatus ? <p className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">{calendarStatus}</p> : null}

            {externalCalendars.length ? (
              <div className="mt-3 space-y-2">
                {externalCalendars.map((calendar) => (
                  <div key={calendar.id} className="rounded-xl border border-line bg-white p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: calendar.color }} />
                          <p className="truncate text-sm font-semibold text-ink">{calendar.name}</p>
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-gray-400">
                          {calendar.lastSyncedAt ? `Synced ${format(safeParse(calendar.lastSyncedAt) || new Date(), 'MMM d, h:mm a')}` : calendar.source}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${calendar.name}`}
                        onClick={() => removeExternalCalendar(calendar.id)}
                        icon={<Trash2 size={16} aria-hidden="true" />}
                      />
                    </div>
                    {calendar.syncError ? <p className="mb-2 text-xs font-medium text-red-700">{calendar.syncError}</p> : null}
                    {calendar.url ? (
                      <Button
                        className="w-full"
                        size="sm"
                        variant="secondary"
                        disabled={syncingId === calendar.id}
                        onClick={() => void syncCalendar(calendar)}
                        icon={<RefreshCw size={15} aria-hidden="true" />}
                      >
                        {syncingId === calendar.id ? 'Syncing...' : 'Sync'}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  )
}
