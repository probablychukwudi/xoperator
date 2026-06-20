import type { ReactNode } from 'react'
import { ChevronRight, FileText } from 'lucide-react'

export function PageHeading({
  title,
  eyebrow,
  action,
}: {
  title: string
  eyebrow?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-5">
      <div className="mb-7 flex items-center gap-3 text-xs font-medium text-gray-400">
        <FileText size={17} aria-hidden="true" />
        <ChevronRight size={14} aria-hidden="true" />
        <span>{eyebrow || 'Board'}</span>
        <ChevronRight size={14} aria-hidden="true" />
        <span className="rounded-md bg-[#f0f0f0] px-2 py-1 text-gray-700">Overview</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[2rem]">{title}</h1>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  )
}
