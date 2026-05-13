interface Props {
  /** Valor numérico (positivo = up, negativo = down, 0 = flat). */
  value: number
  /** Sufixo (default '%'). */
  suffix?: string
  /** Casas decimais (default 1). */
  fractionDigits?: number
  className?: string
}

/**
 * Pill de delta — verde (up), vermelho (down) ou neutro (flat).
 * Usa tabular-nums para alinhar valores.
 */
export function Delta({ value, suffix = '%', fractionDigits = 1, className = '' }: Props) {
  const isFlat = Math.abs(value) < 0.05
  const isUp = !isFlat && value > 0

  const baseClass = 'inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded'
  const colorClass = isFlat
    ? 'bg-surface-inset text-ink-3'
    : isUp
    ? 'bg-[var(--color-top25)] text-[var(--color-top25-fg)]'
    : 'bg-[var(--color-inf25)] text-[var(--color-inf25-fg)]'

  return (
    <span className={`${baseClass} ${colorClass} ${className}`}>
      {isFlat ? '—' : isUp ? '▲' : '▼'}{' '}
      {!isFlat && `${Math.abs(value).toFixed(fractionDigits)}${suffix}`}
    </span>
  )
}
