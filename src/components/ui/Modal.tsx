import { type ReactNode, useEffect } from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    fullscreen: 'max-w-[98vw] w-[98vw]',
  }

  const isFullscreen = size === 'fullscreen'

  return (
    <div className={clsx('fixed inset-0 z-50 flex items-center justify-center', isFullscreen ? 'p-2' : 'p-4')}>
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={clsx(
        'relative w-full bg-surface-pure border border-line rounded-2xl shadow-2xl flex flex-col',
        isFullscreen ? 'max-h-[96vh] h-[96vh]' : 'max-h-[90vh]',
        sizes[size],
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-ink-4 hover:text-ink-2 hover:bg-surface-2 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
