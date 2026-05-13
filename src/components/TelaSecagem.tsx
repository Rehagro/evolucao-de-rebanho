import { useMemo } from 'react'
import type { Fazenda, ResultadoProjecao } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'

interface Props {
  fazenda: Fazenda
  projecao: ResultadoProjecao | null
  onSalvar: (f: Fazenda) => void
}

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function nomeMes(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return `${MESES_PT[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`
}

export function TelaSecagem({ fazenda, projecao }: Props) {
  const secagensIndividuais = useMemo(() => {
    if (!fazenda.rebanhoAtual) return []
    const { vacasSecagem } = fazenda.rebanhoAtual
    const { parametros } = fazenda

    return vacasSecagem.map(vaca => {
      let dtProducao: Date | null = null
      if (vaca.ultCL_kg !== null && vaca.dtUltLeite) {
        const meses = (vaca.ultCL_kg - parametros.limiteProducaoSecagem) / parametros.declinioProdMensal
        if (meses > 0) {
          dtProducao = new Date(vaca.dtUltLeite.getTime() + meses * 30.44 * 24 * 60 * 60 * 1000)
        }
      }

      let dtFinal: Date | null = null
      let motivo: 'Rotina' | 'Baixa produção' | 'Sem data' = 'Sem data'

      if (vaca.dtSecPrev && dtProducao) {
        if (vaca.dtSecPrev < dtProducao) {
          dtFinal = vaca.dtSecPrev; motivo = 'Rotina'
        } else {
          dtFinal = dtProducao; motivo = 'Baixa produção'
        }
      } else if (vaca.dtSecPrev) {
        dtFinal = vaca.dtSecPrev; motivo = 'Rotina'
      } else if (dtProducao) {
        dtFinal = dtProducao; motivo = 'Baixa produção'
      }

      return { ...vaca, dtSecFinal: dtFinal, motivo }
    }).sort((a, b) => {
      if (!a.dtSecFinal) return 1
      if (!b.dtSecFinal) return -1
      return a.dtSecFinal.getTime() - b.dtSecFinal.getTime()
    })
  }, [fazenda])

  // Usa todos os meses calculados pelo motor (suporta até 84 meses).
  const resumoMensal = projecao?.meses ?? []

  return (
    <div className="space-y-6">
      {/* Resumo mensal */}
      {resumoMensal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Secagens projetadas por mês</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-slate-500">Mês</th>
                  <th className="text-right px-4 py-3 text-slate-500">Total</th>
                  <th className="text-right px-4 py-3 text-slate-500">Por Rotina</th>
                  <th className="text-right px-4 py-3 text-slate-500">Baixa Produção</th>
                  <th className="text-right px-4 py-3 text-slate-500">Fonte</th>
                </tr>
              </thead>
              <tbody>
                {resumoMensal.map((m, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-2.5 text-slate-700 font-medium">{nomeMes(m.mes)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                      {Math.round(m.secagens)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">
                      {Math.round(m.secagensPorRotina)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">
                      {Math.round(m.secagensPorBaixaProducao)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {m.usouDadosReais
                        ? <Badge variant="info">Dados reais</Badge>
                        : <Badge variant="muted">Projeção</Badge>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Lista individual */}
      {secagensIndividuais.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lista individual de secagens — {secagensIndividuais.length} vacas</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto max-h-[500px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-500">N° Animal</th>
                  <th className="text-left px-4 py-3 text-slate-500">Sit. Rep.</th>
                  <th className="text-right px-4 py-3 text-slate-500">Últ. CL (kg)</th>
                  <th className="text-right px-4 py-3 text-slate-500">Data Sec. Rotina</th>
                  <th className="text-right px-4 py-3 text-slate-500">Data Sec. Produção</th>
                  <th className="text-right px-4 py-3 text-slate-500">Data Final</th>
                  <th className="text-right px-4 py-3 text-slate-500">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {secagensIndividuais.map((v, i) => (
                  <tr key={v.nAnimal} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-2 text-slate-800 font-medium">{v.nAnimal}</td>
                    <td className="px-4 py-2 text-slate-600">{v.sitRep}</td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      {v.ultCL_kg?.toFixed(1) ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      {v.dtSecPrev
                        ? v.dtSecPrev.toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      {(v as typeof v & { dtSecFinal: Date | null }).dtSecFinal
                        ? (v as typeof v & { motivo: string; dtSecFinal: Date }).dtSecFinal.toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-800">
                      {(v as typeof v & { dtSecFinal: Date | null }).dtSecFinal
                        ? (v as typeof v & { dtSecFinal: Date }).dtSecFinal.toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {(v as typeof v & { motivo: string }).motivo === 'Rotina'
                        ? <Badge variant="info">Rotina</Badge>
                        : (v as typeof v & { motivo: string }).motivo === 'Baixa produção'
                        ? <Badge variant="warning">Baixa prod.</Badge>
                        : <Badge variant="muted">—</Badge>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {secagensIndividuais.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-400">
              Importe o arquivo de secagem do Ideagri para ver a lista individual.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
