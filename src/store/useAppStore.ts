import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  AppState,
  Artifact,
  Attachment,
  CapitalEntry,
  CustomDocTemplate,
  DashboardWidgetId,
  ExternalCalendar,
  ExternalCalendarEvent,
  FounderDoc,
  LogEntry,
  Opportunity,
  Person,
  Project,
  Reminder,
  SavedView,
  Task,
  UrgencyLevel,
  WorkspaceProfile,
} from '../types'
import { makeDocSections } from './docTypes'
import { createId } from '../utils/id'
import { nowIso, todayInputValue } from '../utils/dates'

export const PROJECT_TYPES = ['hardware', 'firmware', 'iOS', 'macOS', 'web', 'research', 'design', 'experiment']
export const PROJECT_STATUSES = ['active', 'paused', 'shipped', 'archived'] as const
export const OPPORTUNITY_TYPES = [
  'accelerator',
  'hackathon',
  'grant',
  'investor',
  'contract',
  'job',
  'partnership',
  'award',
]
export const PERSON_RELATIONSHIPS = ['outreach', 'advisor', 'investor', 'talent', 'partner', 'customer', 'peer']
export const PERSON_STATUSES = ['to contact', 'in convo', 'active', 'cold', 'hired', 'declined']
export const CAPITAL_BUCKETS = [
  'hardware',
  'software',
  'api/cloud',
  'legal/ip',
  'marketing',
  'travel',
  'grant',
  'revenue',
  'investment',
  'salary',
  'other',
]

export const OPPORTUNITY_STAGE_TRACKS: Record<string, string[]> = {
  accelerator: ['Researching', 'Applying', 'Submitted', 'In Convo', 'Decision', 'Won', 'Passed'],
  grant: ['Researching', 'Applying', 'Submitted', 'In Convo', 'Decision', 'Won', 'Passed'],
  investor: ['Researching', 'Applying', 'Submitted', 'In Convo', 'Decision', 'Won', 'Passed'],
  contract: ['Identified', 'Outreach', 'Proposal', 'Negotiating', 'Signed', 'Declined'],
  job: ['Identified', 'Outreach', 'Proposal', 'Negotiating', 'Signed', 'Declined'],
  hackathon: ['Registered', 'Building', 'Submitted', 'Results', 'Won', 'Placed', 'Passed'],
  partnership: ['Identified', 'Outreach', 'Proposal', 'Negotiating', 'Signed', 'Declined'],
  award: ['Researching', 'Applying', 'Submitted', 'In Convo', 'Decision', 'Won', 'Passed'],
}

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetId[] = [
  'urgentQueue',
  'reminders',
  'pipelineDeadlines',
  'capitalSnapshot',
  'recentDocs',
  'recentDrops',
]

export const DEFAULT_WORKSPACE_PROFILE: WorkspaceProfile = {
  startupName: '',
  founderName: '',
  role: 'Founder',
  focusAreas: ['Build', 'Fundraise', 'Customers'],
  defaultFocus: 'Build',
}

export function opportunityStageTrackFor(type: string, customStages: Record<string, string[]> = {}) {
  const custom = customStages[type]?.map((stage) => stage.trim()).filter(Boolean)
  return custom?.length ? custom : OPPORTUNITY_STAGE_TRACKS[type] ?? OPPORTUNITY_STAGE_TRACKS.accelerator
}

function touch<T extends { updatedAt: string }>(entity: T): T {
  return { ...entity, updatedAt: nowIso() }
}

function makeLogEntry(text: string, attachments: Attachment[] = []): LogEntry {
  return {
    id: createId('log'),
    text,
    attachments,
    createdAt: nowIso(),
  }
}

const EXTERNAL_CALENDAR_COLORS = ['#0f766e', '#2563eb', '#7c3aed', '#c2410c', '#be123c', '#4b5563']

type ExternalCalendarEventInput = Omit<ExternalCalendarEvent, 'id' | 'calendarId'>

function makeExternalEventId(calendarId: string, event: ExternalCalendarEventInput, index: number) {
  return `${calendarId}:${event.uid || index}:${event.startsAt}`
}

interface AppActions {
  addProject: (input: { name: string; coverAttachment?: Attachment }) => Project
  updateProject: (projectId: string, patch: Partial<Project>) => void
  addProjectTask: (projectId: string, input: { title: string; urgency?: UrgencyLevel; dueDate?: string }) => void
  updateProjectTask: (projectId: string, taskId: string, patch: Partial<Task>) => void
  toggleProjectTask: (projectId: string, taskId: string) => void
  addProjectLog: (projectId: string, text: string, attachments?: Attachment[]) => void
  addProjectArtifact: (
    projectId: string,
    input: { name: string; type: string; url?: string; attachment?: Attachment },
  ) => void

  addOpportunity: (input: { name: string; type?: string; attachment?: Attachment }) => Opportunity
  updateOpportunity: (opportunityId: string, patch: Partial<Opportunity>) => void
  setOpportunityStage: (opportunityId: string, stage: string) => void
  addOpportunityLog: (opportunityId: string, text: string, attachments?: Attachment[]) => void

  addPerson: (input: { name: string; attachment?: Attachment }) => Person
  updatePerson: (personId: string, patch: Partial<Person>) => void
  addContactLog: (personId: string, text: string, attachments?: Attachment[]) => void

  addDoc: (input: { name: string; docType?: string; linkedProjectId?: string; attachment?: Attachment }) => FounderDoc
  updateDoc: (docId: string, patch: Partial<FounderDoc>) => void
  toggleDocSection: (docId: string, sectionId: string) => void
  updateDocSection: (docId: string, sectionId: string, patch: Partial<FounderDoc['sections'][number]>) => void
  moveDocSection: (docId: string, sectionId: string, direction: 'up' | 'down') => void
  addDocVersion: (docId: string, attachment: Attachment, label?: string) => void
  addDocLog: (docId: string, text: string, attachments?: Attachment[]) => void

  addCapitalEntry: (input: {
    description: string
    amount?: number
    direction?: 'spent' | 'received'
    bucket?: string
    date?: string
    note?: string
  }) => CapitalEntry
  updateCapitalEntry: (entryId: string, patch: Partial<CapitalEntry>) => void

  addNote: (text: string, attachments?: Attachment[]) => LogEntry

  addExternalCalendar: (input: { name: string; source: 'url' | 'file'; url?: string }) => ExternalCalendar
  updateExternalCalendar: (calendarId: string, patch: Partial<ExternalCalendar>) => void
  removeExternalCalendar: (calendarId: string) => void
  replaceExternalCalendarEvents: (calendarId: string, events: ExternalCalendarEventInput[]) => void

  updateWorkspaceProfile: (patch: Partial<WorkspaceProfile>) => void
  setDashboardWidgets: (widgets: DashboardWidgetId[]) => void
  addReminder: (input: { title: string; dueDate: string; linkedHref?: string; notes?: string }) => Reminder
  updateReminder: (reminderId: string, patch: Partial<Reminder>) => void
  toggleReminder: (reminderId: string) => void
  removeReminder: (reminderId: string) => void
  setCustomOpportunityStages: (type: string, stages: string[]) => void
  resetCustomOpportunityStages: (type: string) => void
  addCustomDocTemplate: (input: { name: string; sections: string[] }) => CustomDocTemplate
  removeCustomDocTemplate: (templateId: string) => void
  addSavedView: (input: { name: string; href: string }) => SavedView
  removeSavedView: (viewId: string) => void
}

export type AppStore = AppState & AppActions

const initialState: AppState = {
  projects: [],
  opportunities: [],
  people: [],
  docs: [],
  capital: [],
  notes: [],
  externalCalendars: [],
  externalCalendarEvents: [],
  workspaceProfile: DEFAULT_WORKSPACE_PROFILE,
  dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
  reminders: [],
  customOpportunityStages: {},
  customDocTemplates: [],
  savedViews: [
    {
      id: 'view-pipeline',
      name: 'Pipeline board',
      href: '/pipeline',
      createdAt: nowIso(),
    },
  ],
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addProject: ({ name, coverAttachment }) => {
        const timestamp = nowIso()
        const project: Project = {
          id: createId('project'),
          name: name.trim() || 'Untitled project',
          description: '',
          type: [],
          status: 'active',
          coverAttachment,
          buildLog: coverAttachment ? [makeLogEntry('Initial media drop', [coverAttachment])] : [],
          artifacts: [],
          tasks: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ projects: [project, ...state.projects] }))
        return project
      },

      updateProject: (projectId, patch) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? touch({ ...project, ...patch }) : project,
          ),
        }))
      },

      addProjectTask: (projectId, input) => {
        const task: Task = {
          id: createId('task'),
          title: input.title.trim() || 'Untitled task',
          urgency: input.urgency ?? 'soon',
          dueDate: input.dueDate,
          done: false,
          createdAt: nowIso(),
        }
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? touch({ ...project, tasks: [task, ...project.tasks] }) : project,
          ),
        }))
      },

      updateProjectTask: (projectId, taskId, patch) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? touch({
                  ...project,
                  tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
                })
              : project,
          ),
        }))
      },

      toggleProjectTask: (projectId, taskId) => {
        get().updateProjectTask(projectId, taskId, {
          done: !get().projects.find((project) => project.id === projectId)?.tasks.find((task) => task.id === taskId)
            ?.done,
        })
      },

      addProjectLog: (projectId, text, attachments = []) => {
        const entry = makeLogEntry(text.trim() || 'Untitled update', attachments)
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? touch({ ...project, buildLog: [entry, ...project.buildLog] }) : project,
          ),
        }))
      },

      addProjectArtifact: (projectId, input) => {
        const artifact: Artifact = {
          id: createId('artifact'),
          name: input.name.trim() || 'Untitled artifact',
          type: input.type || 'other',
          url: input.url,
          attachment: input.attachment,
          createdAt: nowIso(),
        }
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? touch({ ...project, artifacts: [artifact, ...project.artifacts] }) : project,
          ),
        }))
      },

      addOpportunity: ({ name, type = 'accelerator', attachment }) => {
        const timestamp = nowIso()
        const opportunity: Opportunity = {
          id: createId('opportunity'),
          name: name.trim() || 'Untitled opportunity',
          type,
          stage: opportunityStageTrackFor(type, get().customOpportunityStages)[0],
          value: '',
          deadline: '',
          url: '',
          description: '',
          log: attachment ? [makeLogEntry('Initial media drop', [attachment])] : [],
          attachments: attachment ? [attachment] : [],
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ opportunities: [opportunity, ...state.opportunities] }))
        return opportunity
      },

      updateOpportunity: (opportunityId, patch) => {
        set((state) => ({
          opportunities: state.opportunities.map((opportunity) =>
            opportunity.id === opportunityId ? touch({ ...opportunity, ...patch }) : opportunity,
          ),
        }))
      },

      setOpportunityStage: (opportunityId, stage) => {
        get().updateOpportunity(opportunityId, { stage })
      },

      addOpportunityLog: (opportunityId, text, attachments = []) => {
        const entry = makeLogEntry(text.trim() || 'Untitled update', attachments)
        set((state) => ({
          opportunities: state.opportunities.map((opportunity) =>
            opportunity.id === opportunityId
              ? touch({
                  ...opportunity,
                  log: [entry, ...opportunity.log],
                  attachments: [...attachments, ...opportunity.attachments],
                })
              : opportunity,
          ),
        }))
      },

      addPerson: ({ name, attachment }) => {
        const timestamp = nowIso()
        const person: Person = {
          id: createId('person'),
          name: name.trim() || 'Untitled person',
          role: '',
          company: '',
          email: '',
          urls: [],
          relationship: 'outreach',
          status: 'to contact',
          notes: '',
          contactLog: attachment ? [makeLogEntry('Initial media drop', [attachment])] : [],
          linkedOpportunityIds: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ people: [person, ...state.people] }))
        return person
      },

      updatePerson: (personId, patch) => {
        set((state) => ({
          people: state.people.map((person) => (person.id === personId ? touch({ ...person, ...patch }) : person)),
        }))
      },

      addContactLog: (personId, text, attachments = []) => {
        const entry = makeLogEntry(text.trim() || 'Untitled contact note', attachments)
        set((state) => ({
          people: state.people.map((person) =>
            person.id === personId ? touch({ ...person, contactLog: [entry, ...person.contactLog] }) : person,
          ),
        }))
      },

      addDoc: ({ name, docType = 'pitch-deck', linkedProjectId, attachment }) => {
        const timestamp = nowIso()
        const doc: FounderDoc = {
          id: createId('doc'),
          name: name.trim() || 'Untitled doc',
          docType,
          status: 'not-started',
          linkedProjectId,
          sections: makeDocSections(docType, get().customDocTemplates),
          versions: attachment ? [{ id: createId('version'), attachment, createdAt: timestamp }] : [],
          log: attachment ? [makeLogEntry('Initial version attached', [attachment])] : [],
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ docs: [doc, ...state.docs] }))
        return doc
      },

      updateDoc: (docId, patch) => {
        set((state) => ({
          docs: state.docs.map((doc) => (doc.id === docId ? touch({ ...doc, ...patch }) : doc)),
        }))
      },

      toggleDocSection: (docId, sectionId) => {
        set((state) => ({
          docs: state.docs.map((doc) =>
            doc.id === docId
              ? touch({
                  ...doc,
                  status: 'in-progress',
                  sections: doc.sections.map((section) =>
                    section.id === sectionId ? { ...section, done: !section.done } : section,
                  ),
                })
              : doc,
          ),
        }))
      },

      updateDocSection: (docId, sectionId, patch) => {
        set((state) => ({
          docs: state.docs.map((doc) =>
            doc.id === docId
              ? touch({
                  ...doc,
                  sections: doc.sections.map((section) =>
                    section.id === sectionId ? { ...section, ...patch } : section,
                  ),
                })
              : doc,
          ),
        }))
      },

      moveDocSection: (docId, sectionId, direction) => {
        set((state) => ({
          docs: state.docs.map((doc) => {
            if (doc.id !== docId) return doc
            const index = doc.sections.findIndex((section) => section.id === sectionId)
            const target = direction === 'up' ? index - 1 : index + 1
            if (index < 0 || target < 0 || target >= doc.sections.length) return doc
            const sections = [...doc.sections]
            const [section] = sections.splice(index, 1)
            sections.splice(target, 0, section)
            return touch({ ...doc, sections })
          }),
        }))
      },

      addDocVersion: (docId, attachment, label) => {
        const version = { id: createId('version'), attachment, label, createdAt: nowIso() }
        set((state) => ({
          docs: state.docs.map((doc) =>
            doc.id === docId
              ? touch({
                  ...doc,
                  versions: [version, ...doc.versions],
                  log: [makeLogEntry(label || 'Version attached', [attachment]), ...doc.log],
                })
              : doc,
          ),
        }))
      },

      addDocLog: (docId, text, attachments = []) => {
        const entry = makeLogEntry(text.trim() || 'Untitled doc note', attachments)
        set((state) => ({
          docs: state.docs.map((doc) => (doc.id === docId ? touch({ ...doc, log: [entry, ...doc.log] }) : doc)),
        }))
      },

      addCapitalEntry: (input) => {
        const entry: CapitalEntry = {
          id: createId('capital'),
          description: input.description.trim() || 'Untitled transaction',
          amount: Number(input.amount) || 0,
          direction: input.direction ?? 'spent',
          bucket: input.bucket ?? 'other',
          note: input.note ?? '',
          date: input.date || todayInputValue(),
          createdAt: nowIso(),
        }
        set((state) => ({ capital: [entry, ...state.capital] }))
        return entry
      },

      updateCapitalEntry: (entryId, patch) => {
        set((state) => ({
          capital: state.capital.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry)),
        }))
      },

      addNote: (text, attachments = []) => {
        const entry = makeLogEntry(text.trim() || 'Untitled note', attachments)
        set((state) => ({ notes: [entry, ...state.notes] }))
        return entry
      },

      addExternalCalendar: ({ name, source, url }) => {
        const timestamp = nowIso()
        const calendar: ExternalCalendar = {
          id: createId('cal'),
          name: name.trim() || 'External calendar',
          source,
          url,
          color: EXTERNAL_CALENDAR_COLORS[get().externalCalendars.length % EXTERNAL_CALENDAR_COLORS.length],
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ externalCalendars: [calendar, ...state.externalCalendars] }))
        return calendar
      },

      updateExternalCalendar: (calendarId, patch) => {
        set((state) => ({
          externalCalendars: state.externalCalendars.map((calendar) =>
            calendar.id === calendarId ? touch({ ...calendar, ...patch }) : calendar,
          ),
        }))
      },

      removeExternalCalendar: (calendarId) => {
        set((state) => ({
          externalCalendars: state.externalCalendars.filter((calendar) => calendar.id !== calendarId),
          externalCalendarEvents: state.externalCalendarEvents.filter((event) => event.calendarId !== calendarId),
        }))
      },

      replaceExternalCalendarEvents: (calendarId, events) => {
        const nextEvents = events.map((event, index) => ({
          ...event,
          id: makeExternalEventId(calendarId, event, index),
          calendarId,
        }))
        set((state) => ({
          externalCalendarEvents: [
            ...state.externalCalendarEvents.filter((event) => event.calendarId !== calendarId),
            ...nextEvents,
          ],
        }))
      },

      updateWorkspaceProfile: (patch) => {
        set((state) => ({
          workspaceProfile: {
            ...state.workspaceProfile,
            ...patch,
          },
        }))
      },

      setDashboardWidgets: (widgets) => {
        set({ dashboardWidgets: widgets.length ? widgets : DEFAULT_DASHBOARD_WIDGETS })
      },

      addReminder: ({ title, dueDate, linkedHref, notes }) => {
        const timestamp = nowIso()
        const reminder: Reminder = {
          id: createId('reminder'),
          title: title.trim() || 'Untitled reminder',
          dueDate,
          linkedHref,
          notes,
          done: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ reminders: [reminder, ...state.reminders] }))
        return reminder
      },

      updateReminder: (reminderId, patch) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === reminderId ? touch({ ...reminder, ...patch }) : reminder,
          ),
        }))
      },

      toggleReminder: (reminderId) => {
        const reminder = get().reminders.find((item) => item.id === reminderId)
        if (!reminder) return
        get().updateReminder(reminderId, { done: !reminder.done })
      },

      removeReminder: (reminderId) => {
        set((state) => ({ reminders: state.reminders.filter((reminder) => reminder.id !== reminderId) }))
      },

      setCustomOpportunityStages: (type, stages) => {
        const cleanStages = stages.map((stage) => stage.trim()).filter(Boolean)
        set((state) => ({
          customOpportunityStages: {
            ...state.customOpportunityStages,
            [type]: cleanStages.length ? cleanStages : opportunityStageTrackFor(type),
          },
        }))
      },

      resetCustomOpportunityStages: (type) => {
        set((state) => {
          const { [type]: _removed, ...rest } = state.customOpportunityStages
          return { customOpportunityStages: rest }
        })
      },

      addCustomDocTemplate: ({ name, sections }) => {
        const timestamp = nowIso()
        const template: CustomDocTemplate = {
          id: createId('template'),
          name: name.trim() || 'Custom template',
          sections: sections.map((section) => section.trim()).filter(Boolean),
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ customDocTemplates: [template, ...state.customDocTemplates] }))
        return template
      },

      removeCustomDocTemplate: (templateId) => {
        set((state) => ({
          customDocTemplates: state.customDocTemplates.filter((template) => template.id !== templateId),
        }))
      },

      addSavedView: ({ name, href }) => {
        const view: SavedView = {
          id: createId('view'),
          name: name.trim() || 'Saved view',
          href: href.trim() || '/',
          createdAt: nowIso(),
        }
        set((state) => ({ savedViews: [view, ...state.savedViews] }))
        return view
      },

      removeSavedView: (viewId) => {
        set((state) => ({ savedViews: state.savedViews.filter((view) => view.id !== viewId) }))
      },
    }),
    {
      name: 'owo-os-state',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)
