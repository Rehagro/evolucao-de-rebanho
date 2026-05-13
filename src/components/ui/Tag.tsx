interface Props {
  children: React.ReactNode
  kind?: 'green' | 'amber' | 'red' | 'brand' | 'neutral'
  className?: string
}

/**
 * Tag colorida (pill). Diferencia categorias/estados.
 */
export function Tag({ children, kind = 'neutral', className = '' }: Props) {
  const kindClass = {
    green:   'bg-[var(--color-top25)] text-[var(--color-top25-fg)]',
    amber:   'bg-[var(--color-median)] text-[var(--color-median-fg)]',
    red:     'bg-[var(--color-inf25)] text-[var(--color-inf25-fg)]',
    brand:   'bg-brand-tint text-brand-3',
    neutral: 'bg-surface-inset text-ink-2',
  }[kind]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${kindClass} ${className}`}>
      {children}
    </span>
  )
}
