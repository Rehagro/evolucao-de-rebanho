import { useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import type { ResultadoProjecao, Parametros } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import { Button } from './ui/Button'

interface Props {
  projecao: ResultadoProjecao
  parametros: Parametros
  projecaoCenarioB?: ResultadoProjecao
}

type Horizonte = 12 | 24 | 36 | 48 | 60 | 84

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function formatarMes(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return `${MESES_PT[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`
}

import { CORES_CATEGORIAS } from '@/lib/coresCategorias'

const CORES = {
  vl: CORES_CATEGORIAS.vacasLactacao,
  vs: CORES_CATEGORIAS.vacasSecas,
  bezerras: CORES_CATEGORIAS.bezerras0_12m,
  novilhas: CORES_CATEGORIAS.novilhas12_24m,
  novilhasPrenhas: CORES_CATEGORIAS.novilhasPrenhas,
  vlB: '#7AA8E0',   // tom mais claro de vacasLactacao
  vsB: '#BFC3BF',   // tom mais claro de vacasSecas
}

export function GraficoEvolucao({ projecao, projecaoCenarioB }: Props) {
  const [horizonte, setHorizonte] = useState<Horizonte>(24)
  const [seriesSelecionadas, setSeriesSelecionadas] = useState<Set<string>>(
    new Set(['vl', 'vs', 'bezerras', 'novilhas'])
  )

  const mesesFiltrados = projecao.meses.slice(0, horizonte)

  const dados = mesesFiltrados.map((m, i) => {
    const mB = projecaoCenarioB?.meses[i]
    return {
      mes: formatarMes(m.mes),
      vl: Math.round(m.vacasLactacao),
      vs: Math.round(m.vacasSecas),
      bezerras: Math.round(m.bezerras0_12m),
      novilhas: Math.round(m.novilhas12_24m + m.novilhasPrenhas),
      ...(mB ? {
        vlB: Math.round(mB.vacasLactacao),
        vsB: Math.round(mB.vacasSecas),
      } : {}),
      usouDadosReais: m.usouDadosReais,
    }
  })

  const toggleSerie = (id: string) => {
    setSeriesSelecionadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const ultimoMesReal = dados.findLastIndex(d => d.usouDadosReais)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Evolução do Rebanho</CardTitle>
          <div className="flex items-center gap-1">
            {([12, 24, 36, 48, 60, 84] as Horizonte[]).map(h => (
              <Button
                key={h}
                size="sm"
                variant={horizonte === h ? 'primary' : 'ghost'}
                onClick={() => setHorizonte(h)}
                className="text-xs px-2"
              >
                {h}m
              </Button>
            ))}
          </div>
        </div>

        {/* Legenda / toggles */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { id: 'vl', label: 'Vacas Lactação', cor: CORES.vl },
            { id: 'vs', label: 'Vacas Secas', cor: CORES.vs },
            { id: 'bezerras', label: 'Bezerras 0–12m', cor: CORES.bezerras },
            { id: 'novilhas', label: 'Novilhas/Prenhas', cor: CORES.novilhas },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => toggleSerie(s.id)}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all',
                seriesSelecionadas.has(s.id)
                  ? 'bg-white border-slate-300 text-slate-700'
                  : 'bg-slate-100 border-transparent text-slate-400',
              ].join(' ')}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.cor }} />
              {s.label}
            </button>
          ))}
          {projecaoCenarioB && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="inline-block w-6 border-t-2 border-dashed border-blue-300" />
              Cenário B
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-4">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={dados} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: '#93958A' }}
              tickLine={false}
              interval={Math.ceil(horizonte / 12) - 1}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#93958A' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              labelStyle={{ fontWeight: 600, color: '#1e293b' }}
            />
            <Legend
              wrapperStyle={{ display: 'none' }}
            />

            {/* Linha de transição dados reais → projeção */}
            {ultimoMesReal >= 0 && (
              <ReferenceLine
                x={dados[ultimoMesReal]?.mes}
                stroke="#93958A"
                strokeDasharray="4 4"
                label={{ value: 'Projeção ↓', position: 'insideTopRight', fontSize: 10, fill: '#93958A' }}
              />
            )}

            {seriesSelecionadas.has('vl') && (
              <Line type="monotone" dataKey="vl" name="VL" stroke={CORES.vl} strokeWidth={2.5} dot={false} />
            )}
            {seriesSelecionadas.has('vs') && (
              <Line type="monotone" dataKey="vs" name="VS" stroke={CORES.vs} strokeWidth={1.5} dot={false} />
            )}
            {seriesSelecionadas.has('bezerras') && (
              <Line type="monotone" dataKey="bezerras" name="Bezerras" stroke={CORES.bezerras} strokeWidth={1.5} dot={false} />
            )}
            {seriesSelecionadas.has('novilhas') && (
              <Line type="monotone" dataKey="novilhas" name="Novilhas" stroke={CORES.novilhas} strokeWidth={1.5} dot={false} />
            )}
            {projecaoCenarioB && seriesSelecionadas.has('vl') && (
              <Line type="monotone" dataKey="vlB" name="VL (B)" stroke={CORES.vlB} strokeWidth={2} strokeDasharray="6 3" dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
