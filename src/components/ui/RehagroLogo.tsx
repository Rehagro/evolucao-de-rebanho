import logoDark from '@/assets/logo-rehagro-tratada.png'   // sem fundo, verde — usar em tela cream
import logoLight from '@/assets/logo-rehagro-branca.png'  // branca, com fundo — usar em sidebar dark

interface Props {
  variant?: 'dark' | 'light'
  className?: string
}

/**
 * Logo Rehagro.
 *
 * - `variant="dark"` (default): logo verde **sem fundo** — usa transparência. Ideal para topbar cream.
 * - `variant="light"`: logo branca — para fundos escuros (sidebar dark).
 */
export function RehagroLogo({ variant = 'dark', className = '' }: Props) {
  return (
    <img
      src={variant === 'light' ? logoLight : logoDark}
      alt="Rehagro"
      className={className}
      draggable={false}
    />
  )
}
