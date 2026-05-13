import type { ResultadoProjecao, Parametros } from '@/types'
import { Card, CardContent } from './ui/Card'

interface Props {
  projecao: ResultadoProjecao
  parametros: Parametros
}

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmt(n: number): string {
  return Math.round(n).toString()
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%'
}

function nomeMes(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return `${MESES_PT[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`
}

const CATEGORIAS = [
  { key: 'vacasLactacao', label: 'Vacas em Lactação', destaque: true },
  { key: 'vacasSecas', label: 'Vacas Secas', destaque: false },
  { key: 'pctVL', label: '%VL', format: pct, destaque: true },
  { key: 'separator1', label: '─── Fluxos ───', separator: true },
  { key: 'partosVacas', label: 'Partos Vacas', destaque: false },
  { key: 'partosNovilhas', label: 'Partos Novilhas', destaque: false },
  { key: 'secagens', label: 'Secagens', destaque: false },
  { key: 'mortalidadeAdulta', label: 'Mortalidade Adulta', destaque: false },
  { key: 'descarteInvoluntario', label: 'Descarte Involuntário', destaque: false },
  { key: 'separator2', label: '─── Jovens ───', separator: true },
  { key: 'bezerras0_12m', label: 'Bezerras 0–12m', destaque: false },
  { key: 'novilhas12_24m', label: 'Novilhas 12–24m', destaque: false },
  { key: 'novilhasPrenhas', label: 'Novilhas Prenhas', destaque: false },
  { key: 'separator3', label: '─── Reprodução ───', separator: true },
  { key: 'novasBezerrasFemeas', label: 'Novas Bezerras Fêmeas', destaque: false },
  { key: 'novasPrenezes_Vacas', label: 'Prenhezes Vacas', destaque: false },
  { key: 'novasPrenezes_Novilhas', label: 'Prenhezes Novilhas', destaque: false },
] as const

type CatKey = typeof CATEGORIAS[number]['key']

export function TabelaMensal({ projecao, parametros: _p }: Props) {
  const meses = projecao.meses

  const getValue = (m: typeof meses[0], key: CatKey): string => {
    if (key.startsWith('separator')) return ''
    const val = m[key as keyof typeof m]
    if (typeof val === 'number') {
      if (key === 'pctVL') return pct(val)
      return fmt(val)
    }
    return '—'
  }

  // Agrupar por ano para subtotais
  const anos = [...new Set(meses.map(m => m.ano))]

  return (
    <Card>
      <CardContent className="p-0 overflow-auto max-h-[70vh]">
        <table className="w-full text-xs border-collapse min-w-max">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              <th className="sticky left-0 bg-white text-left px-4 py-3 text-slate-600 font-semibold border-b border-r border-slate-200 min-w-[180px] z-20">
                Indicador
              </th>
              {meses.map(m => (
                <th
                  key={m.mes.toString()}
                  className={[
                    'text-right px-3 py-3 font-medium border-b border-slate-200 min-w-[70px]',
                    m.usouDadosReais ? 'bg-blue-50 text-blue-700' : 'text-slate-600',
                  ].join(' ')}
                >
                  {nomeMes(m.mes)}
                </th>
              ))}
            </tr>
            {/* Linha de anos */}
            <tr className="border-b border-slate-100">
              <th className="sticky left-0 bg-slate-50 border-r border-slate-200" />
              {anos.map(ano => {
                const mesesDoAno = meses.filter(m => m.ano === ano)
                return (
                  <th
                    key={ano}
                    colSpan={mesesDoAno.length}
                    className="text-center py-1 text-xs text-slate-400 font-medium bg-slate-50"
                  >
                    {ano}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {CATEGORIAS.map((cat, i) => {
              if ('separator' in cat && cat.separator) {
                return (
                  <tr key={i} className="bg-slate-50">
                    <td className="sticky left-0 bg-slate-50 px-4 py-1.5 text-xs text-slate-400 font-medium border-r border-slate-200">
                      {cat.label}
                    </td>
                    {meses.map(m => (
                      <td key={m.mes.toString()} className="bg-slate-50" />
                    ))}
                  </tr>
                )
              }

              return (
                <tr
                  key={cat.key}
                  className={[
                    'hover:bg-slate-50',
                    'destaque' in cat && cat.destaque ? 'bg-blue-50/30' : '',
                  ].join(' ')}
                >
                  <td className={[
                    'sticky left-0 px-4 py-2 border-r border-slate-100 border-b border-slate-50',
                    'destaque' in cat && cat.destaque
                      ? 'bg-blue-50/50 text-slate-800 font-semibold'
                      : 'bg-white text-slate-600',
                  ].join(' ')}>
                    {cat.label}
                  </td>
                  {meses.map(m => (
                    <td
                      key={m.mes.toString()}
                      className={[
                        'text-right px-3 py-2 border-b border-slate-50',
                        'destaque' in cat && cat.destaque ? 'font-semibold text-blue-700' : 'text-slate-600',
                        m.usouDadosReais ? 'bg-blue-50/20' : '',
                      ].join(' ')}
                    >
                      {getValue(m, cat.key)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
