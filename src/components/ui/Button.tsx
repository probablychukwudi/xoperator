import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'border-ink bg-ink text-white shadow-[0_2px_8px_rgb(0_0_0/0.12)] hover:bg-black',
  secondary: 'border-line bg-white text-ink shadow-[0_1px_4px_rgb(0_0_0/0.04)] hover:bg-gray-50',
  ghost: 'border-transparent bg-transparent text-gray-500 hover:bg-gray-100 hover:text-ink',
  danger: 'border-red-700 bg-red-700 text-white hover:bg-red-800',
}

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-8 px-3 text-xs',
  md: 'min-h-9 px-4 text-sm',
  icon: 'h-9 w-9 p-0',
}

export function Button({
  className,
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition focus:outline-none focus-visible:shadow-focus disabled:opacity-45 active:translate-y-px',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
