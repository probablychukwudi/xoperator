import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import type { DashboardWidgetId } from '../types'
import {
  DEFAULT_DASHBOARD_WIDGETS,
  OPPORTUNITY_TYPES,
  opportunityStageTrackFor,
  useAppStore,
} from '../store/useAppStore'
import { todayInputValue } from '../utils/dates'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { PageHeading } from '../components/ui/PageHeading'
import { TextArea, TextInput, inputClass, labelClass } from '../components/ui/TextInput'

const widgetOptions: { id: DashboardWidgetId; label: string }[] = [
  { id: 'urgentQueue', label: 'Urgent queue' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'pipelineDeadlines', label: 'Pipeline deadlines' },
  { id: 'capitalSnapshot', label: 'Capital snapshot' },
  { id: 'recentDocs', label: 'Recent docs' },
  { id: 'savedViews', label: 'Saved views' },
  { id: 'recentDrops', label: 'Recent drops' },
]

const savedViewRoutes = [
  '/',
  '/projects',
  '/pipeline',
  '/network',
  '/docs',
  '/calendar',
  '/capital',
  '/customize',
]

function cleanLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function Customize() {
  const profile = useAppStore((state) => state.workspaceProfile)
  const dashboardWidgets = useAppStore((state) => state.dashboardWidgets)
  const reminders = useAppStore((state) => state.reminders)
  const customOpportunityStages = useAppStore((state) => state.customOpportunityStages)
  const customDocTemplates = useAppStore((state) => state.customDocTemplates)
  const savedViews = useAppStore((state) => state.savedViews)
  const updateWorkspaceProfile = useAppStore((state) => state.updateWorkspaceProfile)
  const setDashboardWidgets = useAppStore((state) => state.setDashboardWidgets)
  const addReminder = useAppStore((state) => state.addReminder)
  const toggleReminder = useAppStore((state) => state.toggleReminder)
  const removeReminder = useAppStore((state) => state.removeReminder)
  const setCustomOpportunityStages = useAppStore((state) => state.setCustomOpportunityStages)
  const resetCustomOpportunityStages = useAppStore((state) => state.resetCustomOpportunityStages)
  const addCustomDocTemplate = useAppStore((state) => state.addCustomDocTemplate)
  const removeCustomDocTemplate = useAppStore((state) => state.removeCustomDocTemplate)
  const addSavedView = useAppStore((state) => state.addSavedView)
  const removeSavedView = useAppStore((state) => state.removeSavedView)
  const [focusAreasText, setFocusAreasText] = useState(profile.focusAreas.join(', '))
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDate, setReminderDate] = useState(todayInputValue())
  const [reminderHref, setReminderHref] = useState('/calendar')
  const [reminderError, setReminderError] = useState('')
  const [stageType, setStageType] = useState(OPPORTUNITY_TYPES[0])
  const [stageText, setStageText] = useState('')
  const [stageStatus, setStageStatus] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateSections, setTemplateSections] = useState('Overview\nAudience\nOffer\nMilestones')
  const [templateError, setTemplateError] = useState('')
  const [templateStatus, setTemplateStatus] = useState('')
  const [viewName, setViewName] = useState('')
  const [viewHref, setViewHref] = useState('/pipeline')
  const [viewError, setViewError] = useState('')

  const sortedReminders = useMemo(
    () => [...reminders].sort((a, b) => Number(a.done) - Number(b.done) || a.dueDate.localeCompare(b.dueDate)),
    [reminders],
  )

  useEffect(() => {
    setStageText(opportunityStageTrackFor(stageType, customOpportunityStages).join('\n'))
  }, [customOpportunityStages, stageType])

  function toggleWidget(widgetId: DashboardWidgetId) {
    const active = dashboardWidgets.includes(widgetId)
    const next = active ? dashboardWidgets.filter((item) => item !== widgetId) : [...dashboardWidgets, widgetId]
    setDashboardWidgets(next)
  }

  function saveFocusAreas() {
    const focusAreas = focusAreasText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    updateWorkspaceProfile({
      focusAreas,
      defaultFocus: focusAreas.includes(profile.defaultFocus) ? profile.defaultFocus : focusAreas[0] || '',
    })
  }

  function submitReminder(event: FormEvent) {
    event.preventDefault()
    if (!reminderTitle.trim()) {
      setReminderError('Name the reminder before adding it.')
      return
    }
    if (!reminderDate) {
      setReminderError('Choose a due date for the reminder.')
      return
    }
    addReminder({
      title: reminderTitle.trim(),
      dueDate: reminderDate,
      linkedHref: reminderHref,
    })
    setReminderTitle('')
    setReminderDate(todayInputValue())
    setReminderHref('/calendar')
    setReminderError('')
  }

  function submitStages(event: FormEvent) {
    event.preventDefault()
    const stages = cleanLines(stageText)
    if (!stages.length) return
    setCustomOpportunityStages(stageType, stages)
    setStageStatus(`${stageType} stages saved.`)
  }

  function resetStages() {
    resetCustomOpportunityStages(stageType)
    setStageStatus(`${stageType} stages reset.`)
  }

  function submitTemplate(event: FormEvent) {
    event.preventDefault()
    const sections = cleanLines(templateSections)
    if (!templateName.trim()) {
      setTemplateError('Name the template before saving it.')
      return
    }
    if (!sections.length) {
      setTemplateError('Add at least one section.')
      return
    }
    addCustomDocTemplate({ name: templateName.trim(), sections })
    setTemplateName('')
    setTemplateSections('Overview\nAudience\nOffer\nMilestones')
    setTemplateError('')
    setTemplateStatus('Template saved.')
  }

  function submitSavedView(event: FormEvent) {
    event.preventDefault()
    if (!viewName.trim()) {
      setViewError('Name the saved view before adding it.')
      return
    }
    addSavedView({ name: viewName.trim(), href: viewHref })
    setViewName('')
    setViewHref('/pipeline')
    setViewError('')
  }

  return (
    <div>
      <PageHeading title="Customize" eyebrow="Personalization" />

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-4 text-base font-semibold">Workspace profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Startup name</span>
              <TextInput value={profile.startupName} onChange={(event) => updateWorkspaceProfile({ startupName: event.target.value })} />
            </label>
            <label>
              <span className={labelClass}>Founder name</span>
              <TextInput value={profile.founderName} onChange={(event) => updateWorkspaceProfile({ founderName: event.target.value })} />
            </label>
            <label>
              <span className={labelClass}>Role</span>
              <TextInput value={profile.role} onChange={(event) => updateWorkspaceProfile({ role: event.target.value })} />
            </label>
            <label>
              <span className={labelClass}>Default focus</span>
              <select className={inputClass} value={profile.defaultFocus} onChange={(event) => updateWorkspaceProfile({ defaultFocus: event.target.value })}>
                {(profile.focusAreas.length ? profile.focusAreas : ['Build']).map((focus) => (
                  <option key={focus} value={focus}>
                    {focus}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>Focus areas</span>
              <TextInput value={focusAreasText} onChange={(event) => setFocusAreasText(event.target.value)} onBlur={saveFocusAreas} />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Dashboard widgets</h2>
            <Button size="sm" variant="ghost" onClick={() => setDashboardWidgets(DEFAULT_DASHBOARD_WIDGETS)} icon={<RotateCcw size={15} aria-hidden="true" />}>
              Reset
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {widgetOptions.map((widget) => (
              <label key={widget.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-paper px-3 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-signal focus:ring-signal"
                  checked={dashboardWidgets.includes(widget.id)}
                  onChange={() => toggleWidget(widget.id)}
                />
                {widget.label}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-4 text-base font-semibold">Reminders</h2>
          <form className="grid gap-3 sm:grid-cols-[1fr_150px] lg:grid-cols-[1fr_150px_160px_auto]" onSubmit={submitReminder}>
            <TextInput
              value={reminderTitle}
              onChange={(event) => {
                setReminderTitle(event.target.value)
                setReminderError('')
              }}
              placeholder="Reminder"
            />
            <TextInput type="date" value={reminderDate} onChange={(event) => setReminderDate(event.target.value)} />
            <select className={inputClass} value={reminderHref} onChange={(event) => setReminderHref(event.target.value)}>
              {savedViewRoutes.map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
            <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
              Add
            </Button>
            {reminderError ? <p className="text-sm font-medium text-red-700 lg:col-span-4">{reminderError}</p> : null}
          </form>
          <div className="mt-4 space-y-2">
            {sortedReminders.length ? (
              sortedReminders.map((reminder) => (
                <div key={reminder.id} className="grid gap-3 rounded-lg border border-line bg-paper p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <label className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-signal focus:ring-signal"
                      checked={reminder.done}
                      onChange={() => toggleReminder(reminder.id)}
                    />
                    <span className={reminder.done ? 'truncate text-sm text-gray-400 line-through' : 'truncate text-sm font-medium text-ink'}>{reminder.title}</span>
                  </label>
                  <Badge tone={reminder.done ? 'green' : 'amber'}>{reminder.dueDate}</Badge>
                  <Button size="icon" variant="ghost" aria-label={`Remove ${reminder.title}`} onClick={() => removeReminder(reminder.id)} icon={<Trash2 size={16} aria-hidden="true" />} />
                </div>
              ))
            ) : (
              <EmptyPrompt title="No reminders yet." />
            )}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-4 text-base font-semibold">Pipeline stages</h2>
          <form className="space-y-3" onSubmit={submitStages}>
            <select className={inputClass} value={stageType} onChange={(event) => setStageType(event.target.value)}>
              {OPPORTUNITY_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <TextArea className="min-h-40" value={stageText} onChange={(event) => setStageText(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" type="submit" icon={<Save size={17} aria-hidden="true" />}>
                Save stages
              </Button>
              <Button variant="secondary" onClick={resetStages} icon={<RotateCcw size={17} aria-hidden="true" />}>
                Reset stages
              </Button>
            </div>
            {stageStatus ? <p className="text-sm font-medium text-teal-700">{stageStatus}</p> : null}
          </form>
        </section>

        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-4 text-base font-semibold">Doc templates</h2>
          <form className="space-y-3" onSubmit={submitTemplate}>
            <TextInput
              value={templateName}
              onChange={(event) => {
                setTemplateName(event.target.value)
                setTemplateError('')
              }}
              placeholder="Template name"
            />
            <TextArea className="min-h-36" value={templateSections} onChange={(event) => setTemplateSections(event.target.value)} />
            <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
              Save template
            </Button>
            {templateError ? <p className="text-sm font-medium text-red-700">{templateError}</p> : null}
            {templateStatus ? <p className="text-sm font-medium text-teal-700">{templateStatus}</p> : null}
          </form>
          <div className="mt-4 space-y-2">
            {customDocTemplates.length ? (
              customDocTemplates.map((template) => (
                <div key={template.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{template.name}</p>
                    <p className="mt-1 text-xs font-medium text-gray-500">{template.sections.length} sections</p>
                  </div>
                  <Button size="icon" variant="ghost" aria-label={`Remove ${template.name}`} onClick={() => removeCustomDocTemplate(template.id)} icon={<Trash2 size={16} aria-hidden="true" />} />
                </div>
              ))
            ) : (
              <EmptyPrompt title="No custom templates yet." />
            )}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-4 text-base font-semibold">Saved views</h2>
          <form className="grid gap-3 sm:grid-cols-[1fr_160px_auto]" onSubmit={submitSavedView}>
            <TextInput
              value={viewName}
              onChange={(event) => {
                setViewName(event.target.value)
                setViewError('')
              }}
              placeholder="View name"
            />
            <select className={inputClass} value={viewHref} onChange={(event) => setViewHref(event.target.value)}>
              {savedViewRoutes.map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
            <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
              Save
            </Button>
            {viewError ? <p className="text-sm font-medium text-red-700 sm:col-span-3">{viewError}</p> : null}
          </form>
          <div className="mt-4 space-y-2">
            {savedViews.length ? (
              savedViews.map((view) => (
                <div key={view.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{view.name}</p>
                    <p className="mt-1 truncate text-xs font-medium text-gray-500">{view.href}</p>
                  </div>
                  <Button size="icon" variant="ghost" aria-label={`Remove ${view.name}`} onClick={() => removeSavedView(view.id)} icon={<Trash2 size={16} aria-hidden="true" />} />
                </div>
              ))
            ) : (
              <EmptyPrompt title="No saved views yet." />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
