import type { Fazenda, ResultadoProjecao } from '@/types'
import { Card, CardContent } from './ui/Card'
import { ClipboardCheck } from 'lucide-react'

interface Props {
  fazenda: Fazenda
  projecao: ResultadoProjecao
  onSalvar: (f: Fazenda) => void
}

export function TelaPrevistoRealizado({ fazenda: _f, projecao: _p, onSalvar: _s }: Props) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <ClipboardCheck size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 mb-1">Previsto × Realizado</p>
        <p className="text-xs text-slate-400">Em desenvolvimento — disponível na próxima versão.</p>
      </CardContent>
    </Card>
  )
}
