import { CheckCircle, AlertTriangle, FileText, Loader, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from './Badge'
import type { RelatorioIdeagri } from '@/lib/relatoriosIdeagri'

export type UploadSlotEstado = 'vazio' | 'detectado' | 'sucesso' | 'erro'

interface Props {
  relatorio: RelatorioIdeagri
  estado: UploadSlotEstado
  nomeArquivo?: string
  resumo?: ReactNode
  erros?: string[]
  avisos?: string[]
  onRemover?: () => void
}

/**
 * Slot fixo de upload Ideagri.
 *
 * Estados:
 * - `vazio`: aguardando arquivo, mostra nome Ideagri + campos obrigatórios
 * - `detectado`: arquivo arrastado, processando
 * - `sucesso`: parse OK, mostra preview enriquecido (resumo)
 * - `erro`: parse falhou, mostra qual problema
 */
export function UploadSlot({ relatorio, estado, nomeArquivo, resumo, erros, avisos, onRemover }: Props) {
  const icone = {
    vazio: <span className="w-2 h-2 rounded-full bg-ink-4 inline-block" />,
    detectado: <Loader size={14} className="animate-spin text-brand" />,
    sucesso: <CheckCircle size={16} className="text-status-ok" />,
    erro: <AlertTriangle size={16} className="text-status-bad" />,
  }[estado]

  const borderColor =
    estado === 'sucesso' ? 'border-status-ok/40' :
    estado === 'erro'    ? 'border-status-bad/40' :
    'border-line'

  return (
    <div className={`bg-surface border ${borderColor} rounded-md p-4 transition-colors`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icone}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink">{relatorio.rotulo}</div>
          <div className="text-xs text-ink-3 mt-0.5">
            Relatório <span className="font-medium text-ink-2">{relatorio.nomeIdeagri}</span> do Ideagri
          </div>
          <div className="text-xs text-ink-3 mt-1.5">
            <span className="text-ink-4">Campos:</span> {relatorio.camposObrigatorios.join(', ')}
          </div>

          {nomeArquivo && (
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <Badge variant="muted">
                <FileText size={10} className="mr-1" />
                {nomeArquivo}
              </Badge>
              {onRemover && (
                <button
                  onClick={onRemover}
                  className="text-xs text-ink-4 hover:text-status-bad inline-flex items-center gap-0.5"
                >
                  <X size={11} /> remover
                </button>
              )}
            </div>
          )}

          {resumo && <div className="mt-2">{resumo}</div>}

          {erros?.map((e, i) => (
            <p key={i} className="text-xs text-status-bad mt-1.5 flex items-center gap-1">
              <X size={11} /> {e}
            </p>
          ))}
          {avisos?.map((a, i) => (
            <p key={i} className="text-xs text-status-warn mt-1.5 flex items-center gap-1">
              <AlertTriangle size={11} /> {a}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
