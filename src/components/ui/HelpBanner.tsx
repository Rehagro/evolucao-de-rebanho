import { Info } from 'lucide-react'

interface Props {
  children: React.ReactNode
  /** Variante visual. */
  kind?: 'info' | 'brand' | 'warn'
  /** Conteúdo "Saber mais" (collapse opcional). */
  more?: React.ReactNode
  className?: string
}

/**
 * Banner curto de instrução no topo de telas com input.
 * Visível sem clique — UX_PRINCIPLES §2.2: "instruções por contexto, visíveis".
 */
export function HelpBanner({ children, kind = 'info', more, className = '' }: Props) {
  const kindClass = {
    info:  'bg-brand-tint-2 border-brand-soft text-ink-2',
    brand: 'bg-brand-tint border-brand-soft text-brand-3',
    warn:  'bg-[var(--color-median)]/40 border-[var(--color-median)] text-[var(--color-median-fg)]',
  }[kind]

  return (
    <div className={`flex items-start gap-3 px-4 py-3 border rounded-md ${kindClass} ${className}`}>
      <Info size={16} className="shrink-0 mt-0.5" />
      <div className="flex-1 text-[13px] leading-relaxed">
        {children}
        {more && (
          <details className="mt-2">
            <summary className="text-[12px] cursor-pointer underline underline-offset-2 opacity-80 hover:opacity-100">
              Saber mais
            </summary>
            <div className="mt-2 text-[12.5px] opacity-90">{more}</div>
          </details>
        )}
      </div>
    </div>
  )
}
