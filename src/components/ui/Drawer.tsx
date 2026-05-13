import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  /** Largura em px. Default 540. */
  width?: number
}

/**
 * Drawer lateral direito. Slide-in com backdrop semi-transparente.
 * Para detalhes contextuais sem sair da tela.
 */
export function Drawer({ open, onClose, title, children, width = 540 }: Props) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/30"
        onClick={onClose}
        aria-hidden
      />
      {/* Painel */}
      <aside
        role="dialog"
        aria-modal="true"
        className="absolute top-0 right-0 h-full bg-surface-pure border-l border-line-2 shadow-lg flex flex-col"
        style={{ width }}
      >
        {(title !== undefined) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div className="text-base font-semibold text-ink">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-3 hover:text-ink transition-colors p-1 -mr-1"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </aside>
    </div>
  )
}
