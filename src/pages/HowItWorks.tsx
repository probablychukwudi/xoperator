import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  Network,
  Plus,
  Rocket,
  SlidersHorizontal,
} from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { PageHeading } from '../components/ui/PageHeading'

const loop = [
  {
    title: 'Capture',
    text: 'Drop raw ideas, files, costs, people, and opportunities into the system before they scatter.',
    href: '/',
    label: 'Use Quick Add',
    icon: Plus,
  },
  {
    title: 'Convert',
    text: 'Turn drops into projects, pipeline items, docs, contacts, capital entries, or notes.',
    href: '/projects',
    label: 'Open projects',
    icon: Rocket,
  },
  {
    title: 'Advance',
    text: 'Move work through custom stages, add tasks, attach evidence, and keep a build log.',
    href: '/pipeline',
    label: 'Review pipeline',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Review',
    text: 'Use Home and Calendar to see today’s tasks, reminders, deadlines, synced events, and recent work.',
    href: '/calendar',
    label: 'Open calendar',
    icon: CalendarDays,
  },
]

const destinations = [
  { title: 'Projects', text: 'Builds, tasks, artifacts, cover media, and build logs.', href: '/projects', icon: Rocket },
  { title: 'Pipeline', text: 'Grants, investors, accelerators, contracts, jobs, awards, and partnerships.', href: '/pipeline', icon: BriefcaseBusiness },
  { title: 'Network', text: 'People, contact notes, links, relationship status, and opportunity links.', href: '/network', icon: Network },
  { title: 'Docs', text: 'Pitch decks, PRDs, roadmaps, IP briefs, and your custom templates.', href: '/docs', icon: FileText },
  { title: 'Calendar', text: 'Internal deadlines, reminders, capital dates, doc activity, and external calendar events.', href: '/calendar', icon: CalendarDays },
  { title: 'Capital', text: 'Money spent, money received, notes, buckets, and net position.', href: '/capital', icon: Banknote },
]

const setup = [
  {
    title: 'Set workspace identity',
    text: 'Add startup name, founder name, role, focus areas, and dashboard widgets.',
    href: '/customize',
    icon: SlidersHorizontal,
  },
  {
    title: 'Shape your workflow',
    text: 'Customize pipeline stages and save document templates that match how you operate.',
    href: '/customize',
    icon: CheckCircle2,
  },
  {
    title: 'Add reminders',
    text: 'Create follow-ups that appear on Home and Calendar so important loops close.',
    href: '/customize',
    icon: Bell,
  },
  {
    title: 'Sync calendars',
    text: 'Subscribe to an .ics feed or import an .ics file when a provider blocks direct browser sync.',
    href: '/calendar',
    icon: CalendarDays,
  },
]

export function HowItWorks() {
  return (
    <div>
      <PageHeading title="How it works" eyebrow="Guide" />

      <section className="mb-5 rounded-lg border border-line bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="blue">Daily loop</Badge>
          <Badge>local first</Badge>
          <Badge>customizable</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {loop.map((step, index) => {
            const Icon = step.icon
            return (
              <article key={step.title} className="rounded-lg border border-line bg-paper p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-ink">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h2 className="text-base font-semibold text-ink">{step.title}</h2>
                <p className="mt-2 min-h-20 text-sm leading-6 text-gray-500">{step.text}</p>
                <Link to={step.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-signal hover:underline">
                  {step.label}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Where work lands</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {destinations.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.title} to={item.href} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-line bg-paper p-3 transition hover:border-signal">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-600">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{item.text}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Recommended setup</h2>
          <div className="space-y-3">
            {setup.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.title} to={item.href} className="block rounded-lg border border-line bg-paper p-3 transition hover:border-signal">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon size={16} className="text-gray-500" aria-hidden="true" />
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                  </div>
                  <p className="text-sm leading-6 text-gray-500">{item.text}</p>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
