interface Props {
  children: React.ReactNode
  variant?: 'default' | 'page'
  className?: string
}

/**
 * Label decorativa em maiúsculas, mono, com tracking espaçado.
 *
 * - `variant="default"`: cor `ink-3`, sem linha (uso interno em cards).
 * - `variant="page"`: cor `brand`, com linha de 18px à esquerda (uso em cabeçalho de página).
 */
export function Eyebrow({ children, variant = 'default', className = '' }: Props) {
  const base = variant === 'page' ? 'page-eyebrow' : 'eyebrow'
  return <span className={`${base} ${className}`}>{children}</span>
}
