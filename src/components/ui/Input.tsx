import { type InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  suffix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className, label, error, suffix, id, ...props
}, ref) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-ink-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          className={clsx(
            'w-full rounded-md border border-line bg-surface-pure px-3 py-2 text-sm text-ink',
            'placeholder:text-ink-4',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
            'disabled:bg-surface-2 disabled:text-ink-4',
            error && 'border-status-bad focus:ring-status-bad',
            suffix && 'pr-10',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-status-bad">{error}</p>}
    </div>
  )
})
Input.displayName = 'Input'
