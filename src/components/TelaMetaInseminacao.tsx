import type { ResultadoProjecao } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'

interface Props {
  projecao: ResultadoProjecao
}

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function nomeMes(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return `${MESES_PT[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`
}

function fmt(n: number): string {
  return Math.round(n).toString()
}

function fmtDec(n: number): string {
  return n.toFixed(1)
}

export function TelaMetaInseminacao({ projecao }: Props) {
  // Usa todos os meses calculados pelo motor (= params.horizonteMeses,
  // ampliado pelo hz do Dashboard via Math.max). Suporta até 84 meses.
  const meses = projecao.meses

  return (
    <div className="space-y-6">

      {/* Vacas */}
      <Card>
        <CardHeader>
          <CardTitle>Meta de Inseminação — Vacas</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-slate-500">Mês</th>
                <th className="text-right px-4 py-3 text-slate-500">Aptas</th>
                <th className="text-right px-4 py-3 text-slate-500">META IA</th>
                <th className="text-right px-4 py-3 text-slate-500">META PRENHEZ</th>
                <th className="text-right px-4 py-3 text-slate-500">%VL</th>
                <th className="text-right px-4 py-3 text-slate-500">Fonte</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-2.5 text-slate-700 font-medium">{nomeMes(m.mes)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{fmt(m.vacasAptasInseminacao)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmtDec(m.metaIA_Vacas)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-blue-700">{fmtDec(m.novasPrenezes_Vacas)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{(m.pctVL * 100).toFixed(1)}%</td>
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

      {/* Novilhas */}
      <Card>
        <CardHeader>
          <CardTitle>Meta de Inseminação — Novilhas</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-slate-500">Mês</th>
                <th className="text-right px-4 py-3 text-slate-500">Aptas</th>
                <th className="text-right px-4 py-3 text-slate-500">META IA</th>
                <th className="text-right px-4 py-3 text-slate-500">META PRENHEZ</th>
                <th className="text-right px-4 py-3 text-slate-500">Novilhas Prenhas</th>
                <th className="text-right px-4 py-3 text-slate-500">Fonte</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-2.5 text-slate-700 font-medium">{nomeMes(m.mes)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{fmt(m.novilhasAptasInseminacao)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmtDec(m.metaIA_Novilhas)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{fmtDec(m.novasPrenezes_Novilhas)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{fmt(m.novilhasPrenhas)}</td>
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

    </div>
  )
}
