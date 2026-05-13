import { useState } from 'react'
import { Info } from 'lucide-react'
import { GLOSSARY, type GlossaryTerm } from '@/lib/glossary'

interface Props {
  /** Chave do glossário (ver `lib/glossary.ts`). */
  term: GlossaryTerm
  /** Conteúdo wrapado pelo tooltip — geralmente a label do campo. */
  children?: React.ReactNode
  /** Tamanho do ícone (?), em pixels. */
  iconSize?: number
  /** Posição vertical do tooltip. */
  placement?: 'top' | 'bottom'
}

/**
 * Tooltip de glossário. Lê do `lib/glossary.ts`.
 *
 * Uso:
 *   <InfoTooltip term="VL">Vacas em lactação</InfoTooltip>
 *
 * O ícone (?) aparece à direita do conteúdo (ou sozinho se sem children).
 * Mostra a definição "curta" em fundo escuro. Conceitos complexos podem ter
 * uma extensão em modal "Saber mais" via campo `extensa` (não exposta nesse
 * componente — futura Onda).
 */
export function InfoTooltip({ term, children, iconSize = 13, placement = 'bottom' }: Props) {
  const [show, setShow] = useState(false)
  const entry = GLOSSARY[term]

  if (!entry) {
    if (import.meta.env.DEV) console.warn(`InfoTooltip: termo "${term}" não está em GLOSSARY`)
    return <>{children}</>
  }

  const tooltipPos = placement === 'bottom'
    ? 'top-full mt-1'
    : 'bottom-full mb-1'

  return (
    <span className="inline-flex items-center gap-1 relative">
      {children}
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-ink-4 hover:text-brand focus:text-brand focus:outline-none transition-colors"
        aria-label={`Sobre ${entry.nome}`}
        tabIndex={0}
      >
        <Info size={iconSize} />
      </button>
      {show && (
        <span
          role="tooltip"
          className={`absolute z-50 left-0 ${tooltipPos} max-w-[280px] w-max px-3 py-2 bg-ink text-surface text-xs rounded-md shadow-lg leading-snug pointer-events-none`}
        >
          <strong className="font-semibold">{entry.nome}.</strong>{' '}
          <span className="font-normal">{entry.curta}</span>
        </span>
      )}
    </span>
  )
}
