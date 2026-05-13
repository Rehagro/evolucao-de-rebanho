interface Props {
  label: React.ReactNode
  value: string | number
  sub?: React.ReactNode
  /** Cor (hex ou var CSS) — aplicada à borda superior, label e valor. */
  color: string
  /** Variante de tamanho do valor (32px serif default, 26px sans). */
  variant?: 'serif' | 'sans'
  /** Conteúdo extra abaixo do sub (delta, mini-info). */
  footer?: React.ReactNode
  className?: string
}

/**
 * KPI Variante A compacta: borda superior 3px na cor + label uppercase na cor + valor em destaque na cor.
 */
export function KPI({ label, value, sub, color, variant = 'serif', footer, className = '' }: Props) {
  const valueClass = variant === 'serif'
    ? 'font-display'
    : 'font-sans font-semibold'
  const valueSize = variant === 'serif' ? 32 : 26

  return (
    <div
      className={`bg-surface border border-line rounded-md px-3.5 py-2.5 flex-1 min-w-[130px] ${className}`}
      style={{ borderTopWidth: 3, borderTopColor: color }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-1 leading-none" style={{ color }}>
        {label}
      </div>
      <div
        className={`${valueClass} tabular-nums leading-none tracking-tight`}
        style={{ color, fontSize: valueSize, fontWeight: variant === 'serif' ? 400 : 600 }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-ink-3 mt-1.5 leading-tight">{sub}</div>}
      {footer && <div className="mt-1">{footer}</div>}
    </div>
  )
}
