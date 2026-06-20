import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cx } from '../../utils/cx'

export const inputClass =
  'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:shadow-focus'

export const labelClass = 'mb-1 block text-xs font-medium text-gray-400'

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputClass, className)} {...props} />
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputClass, 'min-h-24 resize-y', className)} {...props} />
}
