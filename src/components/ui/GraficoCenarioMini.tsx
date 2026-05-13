import { useMemo } from 'react'
import type { ResultadoProjecao } from '@/types'
import { CORES_CATEGORIAS, LABELS_CATEGORIAS, ORDEM_CATEGORIAS, type CategoriaRebanho } from '@/lib/coresCategorias'

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmtMes(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return ''
  return `${MESES_PT[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`
}

interface Props {
  projecao: ResultadoProjecao
  horizonte: number
  categorias: Set<CategoriaRebanho>
  tall?: boolean
}

/**
 * Versão simplificada do gráfico de barras para a TelaCenarios.
 *
 * Mantém os rótulos de dados acima das barras (paridade com o Dashboard principal).
 * Sem inputs editáveis. Headroom no eixo Y de 12% para não colar no topo.
 */
export function GraficoCenarioMini({ projecao, horizonte, categorias, tall = false }: Props) {
  const meses = projecao.meses.slice(0, horizonte)
  const visOrd = ORDEM_CATEGORIAS.filter(k => categorias.has(k))
  const colW = tall
    ? (horizonte <= 12 ? 120 : horizonte <= 24 ? 92 : horizonte <= 36 ? 68 : 54)
    : (horizonte <= 12 ?  64 : horizonte <= 24 ? 48 : horizonte <= 36 ? 36 : 28)
  const BMAX = tall ? 44 : 20
  const BGAP = 2
  const CH = tall ? 480 : 200

  const bW = Math.min(BMAX, visOrd.length > 0
    ? Math.max(6, Math.floor((colW - 6 - (visOrd.length - 1) * BGAP) / visOrd.length))
    : colW - 6)

  // Headroom de 12% para os rótulos acima das barras caberem sem colar no topo.
  const maxV = useMemo(
    () => Math.max(1, ...meses.flatMap(m => visOrd.map(k => (m[k] as number) || 0))) * 1.12,
    [meses, visOrd],
  )

  const totalW = colW * meses.length + 50

  return (
    <div className="overflow-x-auto">
      <div className="flex" style={{ minWidth: totalW }}>
        {/* Eixo Y */}
        <div className="w-[50px] shrink-0 sticky left-0 z-[1] bg-surface">
          <div className="h-7" />
          <div className="flex flex-col justify-between py-1 pr-2 text-right" style={{ height: CH }}>
            {[1, 0.75, 0.5, 0.25, 0].map(p => (
              <div key={p} className="text-[9px] text-ink-4 font-mono tabular-nums">
                {Math.round(maxV * p)}
              </div>
            ))}
          </div>
          <div className="h-5" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1" style={{ minWidth: colW * meses.length }}>
          {/* Headers de meses */}
          <div className="flex h-7 border-b border-line">
            {meses.map((m, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center justify-center text-[10px] font-semibold text-ink-3 font-mono"
                style={{ width: colW }}
              >
                {fmtMes(m.mes)}
              </div>
            ))}
          </div>

          {/* Barras com rótulos */}
          <div className="flex relative" style={{ height: CH }}>
            {[0.25, 0.5, 0.75].map(p => (
              <div
                key={p}
                className="absolute left-0 right-0 h-px pointer-events-none bg-line z-0"
                style={{ top: `${(1 - p) * 100}%` }}
              />
            ))}
            {meses.map((m, i) => (
              <div
                key={i}
                className="shrink-0 flex items-end justify-center px-0.5 relative z-[1]"
                style={{ width: colW, height: CH, gap: BGAP }}
              >
                {visOrd.map(k => {
                  const val = (m[k] as number) || 0
                  const bH = val > 0 ? Math.max(2, (val / maxV) * CH) : 0
                  const cor = CORES_CATEGORIAS[k]
                  const lblOk = val > 0 && bW >= 6
                  return (
                    <div
                      key={k}
                      className="flex flex-col items-center justify-end"
                      style={{ height: CH }}
                    >
                      {lblOk && (
                        <div
                          className="font-bold leading-tight overflow-hidden font-mono tabular-nums"
                          style={{
                            fontSize: bW >= 14 ? 10 : 9,
                            color: cor,
                            marginBottom: 1,
                            writingMode: bW < 11 ? 'vertical-rl' : 'horizontal-tb',
                            transform: bW < 11 ? 'rotate(180deg)' : 'none',
                            maxHeight: bW < 11 ? 30 : 'auto',
                          }}
                          title={`${LABELS_CATEGORIAS[k]}: ${Math.round(val)}`}
                        >
                          {Math.round(val)}
                        </div>
                      )}
                      <div
                        className="rounded-t-[2px]"
                        style={{
                          width: bW,
                          height: bH,
                          background: cor,
                          minHeight: val > 0 ? 2 : 0,
                        }}
                        title={`${LABELS_CATEGORIAS[k]}: ${Math.round(val)}`}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* %VL embaixo */}
          <div
            className="flex h-5 border-t border-b"
            style={{
              background: 'var(--color-brand-tint-2)',
              borderTopColor: 'var(--color-brand-soft)',
              borderBottomColor: 'var(--color-brand-soft)',
            }}
          >
            {meses.map((m, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center justify-center text-[9px] font-semibold text-brand font-mono tabular-nums"
                style={{ width: colW }}
              >
                {(m.pctVL * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
