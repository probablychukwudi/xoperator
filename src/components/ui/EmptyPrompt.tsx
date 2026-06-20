import type { ReactNode } from 'react'

export function EmptyPrompt({ title = 'Drop something in.', action }: { title?: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-40 flex-col items-start justify-center rounded-2xl border border-dashed border-gray-300 bg-[#fbfbfb] px-5 py-6">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
