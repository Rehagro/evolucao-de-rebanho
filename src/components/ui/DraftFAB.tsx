import { Trash2 } from 'lucide-react'
import { EnviarComparativoButton } from './EnviarComparativoButton'

interface Props {
  visible: boolean
  onSalvar: () => void
  onEnviarSlot: (slot: 'A' | 'B') => void
  cenarioAOcupado: boolean
  cenarioBOcupado: boolean
  cenarioATimestamp?: string | null
  cenarioBTimestamp?: string | null
  onDescartar: () => void
}

/**
 * Floating Action Bar de rascunho ativo.
 *
 * Aparece inferior direito quando há rascunho. Três ações:
 *   - Descartar (volta ao Salvo)
 *   - Enviar para comparativo (popover A/B via `<EnviarComparativoButton>`)
 *   - Salvar (grava no localStorage)
 *
 * O rascunho persiste após "Enviar para comparativo" — o técnico segue editando.
 */
export function DraftFAB({
  visible, onSalvar, onEnviarSlot, cenarioAOcupado, cenarioBOcupado,
  cenarioATimestamp, cenarioBTimestamp, onDescartar,
}: Props) {
  if (!visible) return null

  return (
    <div
      className="fixed bottom-5 right-5 z-50 bg-surface-pure border border-line-2 rounded-lg shadow-lg p-3 pr-4 max-w-sm"
      role="region"
      aria-label="Alterações pendentes"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="relative flex w-2.5 h-2.5">
          <span className="absolute inline-flex w-full h-full rounded-full bg-status-ok opacity-60 animate-ping" />
          <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-status-ok" />
        </span>
        <span className="text-sm font-semibold text-ink">Alterações não salvas</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDescartar}
          className="inline-flex items-center gap-1 text-[12px] text-status-bad hover:underline px-2 py-1.5"
          title="Descartar alterações e voltar ao salvo"
        >
          <Trash2 size={12} />
          Descartar
        </button>
        <EnviarComparativoButton
          onEnviarSlot={onEnviarSlot}
          cenarioAOcupado={cenarioAOcupado}
          cenarioBOcupado={cenarioBOcupado}
          cenarioATimestamp={cenarioATimestamp}
          cenarioBTimestamp={cenarioBTimestamp}
          variant="outline"
          size="sm"
          label="Enviar p/ comparativo"
        />
        <button
          type="button"
          onClick={onSalvar}
          className="text-[12px] px-3 py-1.5 bg-brand text-white rounded-md hover:bg-brand-2 font-semibold transition-colors"
        >
          Salvar alterações
        </button>
      </div>
    </div>
  )
}
