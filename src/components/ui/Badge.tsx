import type { ReactNode } from 'react'
import { cx } from '../../utils/cx'

type Tone = 'neutral' | 'green' | 'amber' | 'red' | 'blue'

const toneClasses: Record<Tone, string> = {
  neutral: 'border-transparent bg-[#f0f0f0] text-gray-500',
  green: 'border-transparent bg-emerald-50 text-emerald-600',
  amber: 'border-transparent bg-amber-50 text-amber-600',
  red: 'border-transparent bg-red-50 text-red-600',
  blue: 'border-transparent bg-sky-50 text-sky-600',
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex max-w-full items-center rounded-md border px-2 py-1 text-[0.68rem] font-medium leading-none',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
