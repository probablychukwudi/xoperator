export type EntityStatus =
  | 'active'
  | 'paused'
  | 'shipped'
  | 'archived'
  | 'won'
  | 'passed'
  | 'done'

export type UrgencyLevel = 'now' | 'week' | 'soon'

export type AttachmentType = 'image' | 'video' | 'pdf' | 'link' | 'snippet'

export interface Attachment {
  id: string
  type: AttachmentType
  label?: string
  url: string
  idbKey?: string
  createdAt: string
}

export interface LogEntry {
  id: string
  text: string
  attachments: Attachment[]
  createdAt: string
}

export interface Task {
  id: string
  title: string
  urgency: UrgencyLevel
  dueDate?: string
  done: boolean
  createdAt: string
}

export interface Artifact {
  id: string
  name: string
  type: string
  url?: string
  attachment?: Attachment
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  type: string[]
  status: EntityStatus
  coverAttachment?: Attachment
  buildLog: LogEntry[]
  artifacts: Artifact[]
  tasks: Task[]
  createdAt: string
  updatedAt: string
}

export interface Opportunity {
  id: string
  name: string
  type: string
  stage: string
  value?: string
  deadline?: string
  url?: string
  description?: string
  contactPersonId?: string
  log: LogEntry[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface Person {
  id: string
  name: string
  role?: string
  company?: string
  email?: string
  urls: { label: string; url: string }[]
  relationship: string
  status: string
  notes?: string
  contactLog: LogEntry[]
  linkedOpportunityIds: string[]
  createdAt: string
  updatedAt: string
}

export interface DocSection {
  id: string
  title: string
  done: boolean
  notes?: string
  optional?: boolean
}

export interface DocVersion {
  id: string
  label?: string
  attachment: Attachment
  createdAt: string
}

export interface FounderDoc {
  id: string
  name: string
  docType: string
  status: 'not-started' | 'in-progress' | 'done'
  linkedProjectId?: string
  sections: DocSection[]
  versions: DocVersion[]
  log: LogEntry[]
  createdAt: string
  updatedAt: string
}

export interface CapitalEntry {
  id: string
  description: string
  amount: number
  direction: 'spent' | 'received'
  bucket: string
  note?: string
  date: string
  createdAt: string
}

export interface ExternalCalendar {
  id: string
  name: string
  source: 'url' | 'file'
  url?: string
  color: string
  lastSyncedAt?: string
  syncError?: string
  createdAt: string
  updatedAt: string
}

export interface ExternalCalendarEvent {
  id: string
  calendarId: string
  uid: string
  title: string
  startsAt: string
  endsAt?: string
  allDay: boolean
  location?: string
  description?: string
  url?: string
}

export type DashboardWidgetId =
  | 'urgentQueue'
  | 'reminders'
  | 'pipelineDeadlines'
  | 'capitalSnapshot'
  | 'recentDocs'
  | 'savedViews'
  | 'recentDrops'

export interface WorkspaceProfile {
  startupName: string
  founderName: string
  role: string
  focusAreas: string[]
  defaultFocus: string
}

export interface Reminder {
  id: string
  title: string
  dueDate: string
  linkedHref?: string
  notes?: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomDocTemplate {
  id: string
  name: string
  sections: string[]
  createdAt: string
  updatedAt: string
}

export interface SavedView {
  id: string
  name: string
  href: string
  createdAt: string
}

export interface AppState {
  projects: Project[]
  opportunities: Opportunity[]
  people: Person[]
  docs: FounderDoc[]
  capital: CapitalEntry[]
  notes: LogEntry[]
  externalCalendars: ExternalCalendar[]
  externalCalendarEvents: ExternalCalendarEvent[]
  workspaceProfile: WorkspaceProfile
  dashboardWidgets: DashboardWidgetId[]
  reminders: Reminder[]
  customOpportunityStages: Record<string, string[]>
  customDocTemplates: CustomDocTemplate[]
  savedViews: SavedView[]
}

export interface RecentDrop {
  id: string
  entityId: string
  kind: 'project' | 'opportunity' | 'person' | 'doc' | 'capital' | 'note'
  title: string
  subtitle: string
  createdAt: string
  href: string
  attachment?: Attachment
}
