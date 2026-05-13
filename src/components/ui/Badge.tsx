import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

/**
 * Badge — tag visual pequena com variantes coloridas.
 * Cores migradas para tokens Rehagro cream (Onda 3).
 */
export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-surface-2 text-ink-2 border border-line',
    success: 'bg-brand-tint text-brand-3 border border-brand-soft',
    warning: 'bg-[var(--color-median)] text-[var(--color-median-fg)] border border-[var(--color-median-fg)]/30',
    danger:  'bg-[var(--color-inf25)] text-[var(--color-inf25-fg)] border border-[var(--color-inf25-fg)]/30',
    info:    'bg-brand-tint-2 text-brand-3 border border-brand-soft',
    muted:   'bg-surface text-ink-3 border border-line',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
