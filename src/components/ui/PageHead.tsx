import { Eyebrow } from './Eyebrow'

interface Props {
  /** Texto pequeno em cima (ex: "DASHBOARD · ABR/2026 → ABR/2027"). */
  eyebrow?: React.ReactNode
  /** Título principal — pode conter <em> (itálico brand) ou <b> (brand sem peso extra). */
  title: React.ReactNode
  /** Subtítulo opcional. */
  sub?: React.ReactNode
  /** Ações à direita (botões). */
  actions?: React.ReactNode
}

/**
 * Cabeçalho padrão de página (Dashboard, Cenários, etc.).
 * Tipografia editorial: título em Instrument Serif 38px.
 */
export function PageHead({ eyebrow, title, sub, actions }: Props) {
  return (
    <div className="flex items-start justify-between gap-6 mb-6">
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="mb-2"><Eyebrow variant="page">{eyebrow}</Eyebrow></div>}
        <h1 className="font-display text-[38px] leading-tight tracking-tight text-ink m-0 [&_em]:italic [&_em]:text-brand [&_em]:not-italic [&_em]:font-normal [&_b]:text-brand [&_b]:font-normal">
          {title}
        </h1>
        {sub && <p className="text-sm text-ink-2 mt-2 max-w-2xl">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
