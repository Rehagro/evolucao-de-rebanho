import type { Fazenda, ResultadoProjecao } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface Props {
  projecao: ResultadoProjecao
  fazenda: Fazenda
  onSalvar: (f: Fazenda) => void
}

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function nomeMes(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return `${MESES_PT[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`
}

export function TelaForragem({ projecao, fazenda: _f }: Props) {
  const meses = projecao.meses.slice(0, 24)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Demanda de Forragem — Silagem</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-slate-500">Mês</th>
                <th className="text-right px-4 py-3 text-slate-500">VL</th>
                <th className="text-right px-4 py-3 text-slate-500">Ton MS/mês</th>
                <th className="text-right px-4 py-3 text-slate-500">Ton MN/mês</th>
                <th className="text-right px-4 py-3 text-slate-500">Área (ha)</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-2.5 text-slate-700 font-medium">{nomeMes(m.mes)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{Math.round(m.vacasLactacao)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                    {m.consumoMS_Silagem.toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">
                    {m.consumoMN_Silagem.toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">
                    {m.areaNecessariaHa.toFixed(1)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 font-semibold bg-slate-50">
                <td className="px-4 py-2.5 text-slate-800">Total 24m</td>
                <td className="px-4 py-2.5 text-right" />
                <td className="px-4 py-2.5 text-right text-blue-700">
                  {meses.reduce((a, m) => a + m.consumoMS_Silagem, 0).toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-right text-blue-700">
                  {meses.reduce((a, m) => a + m.consumoMN_Silagem, 0).toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-right" />
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
