import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { DashboardWidgetId, RecentDrop } from '../types'
import { useAppStore } from '../store/useAppStore'
import { formatShortDate, relativeTime } from '../utils/dates'
import { Button } from '../components/ui/Button'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { PageHeading } from '../components/ui/PageHeading'
import { Badge } from '../components/ui/Badge'
import { AttachmentGrid } from '../components/media/AttachmentGrid'

export function Home() {
  const projects = useAppStore((state) => state.projects)
  const opportunities = useAppStore((state) => state.opportunities)
  const people = useAppStore((state) => state.people)
  const docs = useAppStore((state) => state.docs)
  const capital = useAppStore((state) => state.capital)
  const notes = useAppStore((state) => state.notes)
  const profile = useAppStore((state) => state.workspaceProfile)
  const dashboardWidgets = useAppStore((state) => state.dashboardWidgets)
  const reminders = useAppStore((state) => state.reminders)
  const savedViews = useAppStore((state) => state.savedViews)
  const toggleProjectTask = useAppStore((state) => state.toggleProjectTask)
  const toggleReminder = useAppStore((state) => state.toggleReminder)

  const urgentQueue = useMemo(
    () =>
      projects
        .flatMap((project) =>
          project.tasks
            .filter((task) => !task.done && task.urgency === 'now')
            .map((task) => ({ project, task })),
        )
        .sort((a, b) => (a.task.dueDate || '9999-12-31').localeCompare(b.task.dueDate || '9999-12-31')),
    [projects],
  )

  const recentDrops = useMemo<RecentDrop[]>(() => {
    const rows: RecentDrop[] = [
      ...projects.map((project) => ({
        id: project.id,
        entityId: project.id,
        kind: 'project' as const,
        title: project.name,
        subtitle: 'Project',
        createdAt: project.createdAt,
        href: `/projects/${project.id}`,
        attachment: project.coverAttachment,
      })),
      ...opportunities.map((opportunity) => ({
        id: opportunity.id,
        entityId: opportunity.id,
        kind: 'opportunity' as const,
        title: opportunity.name,
        subtitle: opportunity.type,
        createdAt: opportunity.createdAt,
        href: `/pipeline/${opportunity.id}`,
        attachment: opportunity.attachments[0],
      })),
      ...people.map((person) => ({
        id: person.id,
        entityId: person.id,
        kind: 'person' as const,
        title: person.name,
        subtitle: person.company || person.relationship,
        createdAt: person.createdAt,
        href: `/network/${person.id}`,
      })),
      ...docs.map((doc) => ({
        id: doc.id,
        entityId: doc.id,
        kind: 'doc' as const,
        title: doc.name,
        subtitle: doc.docType,
        createdAt: doc.createdAt,
        href: `/docs/${doc.id}`,
        attachment: doc.versions[0]?.attachment,
      })),
      ...capital.map((entry) => ({
        id: entry.id,
        entityId: entry.id,
        kind: 'capital' as const,
        title: entry.description,
        subtitle: `${entry.direction} $${entry.amount.toLocaleString()}`,
        createdAt: entry.createdAt,
        href: '/capital',
      })),
      ...notes.map((note) => ({
        id: note.id,
        entityId: note.id,
        kind: 'note' as const,
        title: note.text,
        subtitle: 'Note',
        createdAt: note.createdAt,
        href: '/',
        attachment: note.attachments[0],
      })),
    ]

    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  }, [capital, docs, notes, opportunities, people, projects])

  const pendingReminders = useMemo(
    () => reminders.filter((reminder) => !reminder.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6),
    [reminders],
  )

  const pipelineDeadlines = useMemo(
    () =>
      opportunities
        .filter((opportunity) => opportunity.deadline)
        .slice()
        .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
        .slice(0, 5),
    [opportunities],
  )

  const recentDocs = useMemo(() => docs.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5), [docs])

  const capitalSummary = useMemo(() => {
    const spent = capital.filter((entry) => entry.direction === 'spent').reduce((total, entry) => total + entry.amount, 0)
    const received = capital.filter((entry) => entry.direction === 'received').reduce((total, entry) => total + entry.amount, 0)
    return { spent, received, net: received - spent }
  }, [capital])

  function money(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
  }

  function renderWidget(widgetId: DashboardWidgetId) {
    if (widgetId === 'urgentQueue') {
      return (
        <section key={widgetId} className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Urgent queue</h2>
              <p className="mt-1 text-sm text-gray-500">Tasks marked now stay visible here.</p>
            </div>
            {urgentQueue.length > 10 ? (
              <Link to="/projects" className="text-sm font-medium text-signal hover:underline">
                See all
              </Link>
            ) : null}
          </div>
          <div className="space-y-3">
            {urgentQueue.length ? (
              urgentQueue.slice(0, 10).map(({ project, task }) => (
                <div key={task.id} className="grid gap-3 rounded-lg border border-line bg-paper p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone="red">now</Badge>
                      <span className="text-xs font-medium text-gray-500">{formatShortDate(task.dueDate)}</span>
                    </div>
                    <Link to={`/projects/${project.id}`} className="mt-2 block truncate text-sm font-semibold text-ink hover:text-signal">
                      {task.title}
                    </Link>
                    <p className="mt-1 truncate text-xs text-gray-500">{project.name}</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => toggleProjectTask(project.id, task.id)}
                    icon={<CheckCircle2 size={17} aria-hidden="true" />}
                  >
                    Done
                  </Button>
                </div>
              ))
            ) : (
              <EmptyPrompt title="Nothing urgent. Drop something in when it matters." />
            )}
          </div>
        </section>
      )
    }

    if (widgetId === 'reminders') {
      return (
        <section key={widgetId} className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Reminders</h2>
          <div className="space-y-3">
            {pendingReminders.length ? (
              pendingReminders.map((reminder) => (
                <div key={reminder.id} className="grid gap-3 rounded-lg border border-line bg-paper p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <label className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-signal focus:ring-signal"
                      checked={reminder.done}
                      onChange={() => toggleReminder(reminder.id)}
                    />
                    <span className="truncate text-sm font-semibold text-ink">{reminder.title}</span>
                  </label>
                  <Badge tone="amber">{formatShortDate(reminder.dueDate)}</Badge>
                </div>
              ))
            ) : (
              <EmptyPrompt title="No reminders yet." />
            )}
          </div>
        </section>
      )
    }

    if (widgetId === 'pipelineDeadlines') {
      return (
        <section key={widgetId} className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Pipeline deadlines</h2>
          <div className="space-y-3">
            {pipelineDeadlines.length ? (
              pipelineDeadlines.map((opportunity) => (
                <Link key={opportunity.id} to={`/pipeline/${opportunity.id}`} className="block rounded-lg border border-line bg-paper p-3 transition hover:border-signal">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-ink">{opportunity.name}</p>
                    <Badge tone="amber">{formatShortDate(opportunity.deadline)}</Badge>
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-500">{opportunity.stage}</p>
                </Link>
              ))
            ) : (
              <EmptyPrompt title="No pipeline deadlines." />
            )}
          </div>
        </section>
      )
    }

    if (widgetId === 'capitalSnapshot') {
      return (
        <section key={widgetId} className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Capital snapshot</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-paper p-3">
              <p className="text-xs font-medium text-gray-500">Spent</p>
              <p className="mt-2 text-xl font-semibold text-red-700">{money(capitalSummary.spent)}</p>
            </div>
            <div className="rounded-lg bg-paper p-3">
              <p className="text-xs font-medium text-gray-500">Received</p>
              <p className="mt-2 text-xl font-semibold text-signal">{money(capitalSummary.received)}</p>
            </div>
            <div className="rounded-lg bg-paper p-3">
              <p className="text-xs font-medium text-gray-500">Net</p>
              <p className="mt-2 text-xl font-semibold text-ink">{money(capitalSummary.net)}</p>
            </div>
          </div>
        </section>
      )
    }

    if (widgetId === 'recentDocs') {
      return (
        <section key={widgetId} className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Recent docs</h2>
          <div className="space-y-3">
            {recentDocs.length ? (
              recentDocs.map((doc) => (
                <Link key={doc.id} to={`/docs/${doc.id}`} className="block rounded-lg border border-line bg-paper p-3 transition hover:border-signal">
                  <p className="truncate text-sm font-semibold text-ink">{doc.name}</p>
                  <p className="mt-2 text-xs font-medium text-gray-500">Updated {relativeTime(doc.updatedAt)}</p>
                </Link>
              ))
            ) : (
              <EmptyPrompt title="No docs yet." />
            )}
          </div>
        </section>
      )
    }

    if (widgetId === 'savedViews') {
      return (
        <section key={widgetId} className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Saved views</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {savedViews.length ? (
              savedViews.map((view) => (
                <Link key={view.id} to={view.href} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper p-3 text-sm font-semibold text-ink transition hover:border-signal">
                  <span className="truncate">{view.name}</span>
                  <ArrowRight size={16} className="text-gray-400" aria-hidden="true" />
                </Link>
              ))
            ) : (
              <EmptyPrompt title="No saved views." />
            )}
          </div>
        </section>
      )
    }

    return (
      <section key={widgetId} className="rounded-lg border border-line bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Recent drops</h2>
            <p className="mt-1 text-sm text-gray-500">The last things that entered the system.</p>
          </div>
        </div>
        <div className="space-y-3">
          {recentDrops.length ? (
            recentDrops.map((drop) => (
              <Link
                key={`${drop.kind}-${drop.id}`}
                to={drop.href}
                className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-lg border border-line bg-paper p-2 transition hover:border-signal"
              >
                <div className="h-16 overflow-hidden rounded-lg bg-white">
                  {drop.attachment ? (
                    <AttachmentGrid attachments={[drop.attachment]} compact />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-semibold uppercase text-gray-400">
                      {drop.kind.slice(0, 3)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{drop.title}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {drop.subtitle} - {relativeTime(drop.createdAt)}
                  </p>
                </div>
                <ArrowRight size={16} className="text-gray-400" aria-hidden="true" />
              </Link>
            ))
          ) : (
            <EmptyPrompt />
          )}
        </div>
      </section>
    )
  }

  const activeWidgets: DashboardWidgetId[] = dashboardWidgets.length ? dashboardWidgets : ['urgentQueue', 'recentDrops']
  const titleOwner = profile.founderName.trim() || 'you'
  const attentionCount = urgentQueue.length + pendingReminders.length

  return (
    <div>
      <PageHeading
        eyebrow={[profile.startupName, profile.defaultFocus, format(new Date(), 'EEEE, MMMM d')].filter(Boolean).join(' / ')}
        title={`${attentionCount} ${attentionCount === 1 ? 'thing needs' : 'things need'} ${titleOwner} today.`}
      />

      <div className="grid gap-5 xl:grid-cols-2">{activeWidgets.map((widgetId) => renderWidget(widgetId))}</div>
    </div>
  )
}
