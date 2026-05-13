interface Option<T> {
  value: T
  label: React.ReactNode
}

interface Props<T extends string | number> {
  value: T
  onChange: (v: T) => void
  options: Option<T>[]
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Segmented control. Fundo `surface-inset`, item ativo com `surface-pure` + sombra leve.
 */
export function Seg<T extends string | number>({ value, onChange, options, className = '', size = 'md' }: Props<T>) {
  const sizeClass = size === 'sm'
    ? 'h-7 text-[11px]'
    : 'h-8 text-xs'

  return (
    <div className={`inline-flex items-center bg-surface-inset rounded-md p-0.5 ${sizeClass} ${className}`}>
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 h-full rounded font-medium transition-all whitespace-nowrap ${
              active
                ? 'bg-surface-pure text-ink shadow-sm'
                : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
