import { useState, useRef, useEffect } from 'react'
import { GitCompare } from 'lucide-react'

interface Props {
  /** Envia o snapshot atual para o slot escolhido. */
  onEnviarSlot: (slot: 'A' | 'B') => void
  cenarioAOcupado: boolean
  cenarioBOcupado: boolean
  cenarioATimestamp?: string | null
  cenarioBTimestamp?: string | null
  /** Variante visual do botão. */
  variant?: 'primary' | 'outline' | 'subtle'
  /** Tamanho. */
  size?: 'sm' | 'md'
  label?: string
}

function fmtData(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Botão que abre popover com escolha de slot (A/B) e envia o snapshot atual.
 *
 * Compartilhado entre `<DraftFAB>` (Onda 5) e a barra inferior da `<TelaParametros>`.
 * Cada uso decide o que conta como "snapshot atual" via o callback `onEnviarSlot`.
 */
export function EnviarComparativoButton({
  onEnviarSlot,
  cenarioAOcupado,
  cenarioBOcupado,
  cenarioATimestamp,
  cenarioBTimestamp,
  variant = 'outline',
  size = 'md',
  label = 'Enviar para comparativo',
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const escolher = (slot: 'A' | 'B') => {
    onEnviarSlot(slot)
    setOpen(false)
  }

  const sizeClasses = size === 'sm' ? 'text-[12px] px-3 py-1.5' : 'text-[13px] px-4 py-2'
  const variantClasses = {
    primary: 'bg-brand text-white hover:bg-brand-2 border border-brand',
    outline: 'border border-line-2 text-ink hover:bg-surface-2 bg-surface-pure',
    subtle:  'border border-line text-ink-2 hover:bg-surface-2 bg-surface',
  }[variant]

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(s => !s)}
        className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition-colors ${sizeClasses} ${variantClasses}`}
      >
        <GitCompare size={14} />
        {label}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 bg-surface-pure border border-line-2 rounded-md shadow-xl p-2.5 w-64 z-[60]">
          <p className="text-[11px] text-ink-3 mb-2 px-1">Enviar snapshot atual como:</p>
          <SlotOption
            label="Cenário A"
            ocupado={cenarioAOcupado}
            timestamp={cenarioATimestamp}
            onClick={() => escolher('A')}
          />
          <SlotOption
            label="Cenário B"
            ocupado={cenarioBOcupado}
            timestamp={cenarioBTimestamp}
            onClick={() => escolher('B')}
          />
          <button
            onClick={() => setOpen(false)}
            className="w-full text-[11px] text-ink-4 hover:text-ink-2 mt-1.5 py-1"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

function SlotOption({
  label, ocupado, timestamp, onClick,
}: { label: string; ocupado: boolean; timestamp?: string | null; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-2 rounded-md hover:bg-surface-2 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        {ocupado && <span className="text-[10px] text-status-warn font-medium">substituir</span>}
      </div>
      {ocupado && timestamp && (
        <p className="text-[10.5px] text-ink-4 mt-0.5 font-mono tabular-nums">
          atual: {fmtData(timestamp)}
        </p>
      )}
    </button>
  )
}
