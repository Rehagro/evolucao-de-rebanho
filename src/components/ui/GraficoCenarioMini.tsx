import { useMemo } from 'react'
import type { MesProjetado, ResultadoProjecao } from '@/types'
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
  /** 'mensal' (default): 1 coluna por mês. 'anual': 1 coluna por ano com média mensal. */
  modo?: 'mensal' | 'anual'
}

interface Coluna {
  label: string
  valores: Record<CategoriaRebanho, number>
  pctVL: number
  anoParcial: boolean
}

/**
 * Versão simplificada do gráfico de barras para a TelaCenarios.
 *
 * Suporta dois modos:
 * - mensal (default): 1 barra agrupada por mês, igual ao Dashboard.
 * - anual: agrupa os meses do filtro por ano e mostra a MÉDIA mensal de cada
 *   categoria como barra anual. Útil pra visão sintética de 1+ anos.
 */
export function GraficoCenarioMini({ projecao, horizonte, categorias, tall = false, modo = 'mensal' }: Props) {
  const visOrd = ORDEM_CATEGORIAS.filter(k => categorias.has(k))

  const colunas = useMemo<Coluna[]>(() => {
    const meses = projecao.meses.slice(0, horizonte)
    if (modo === 'anual') {
      const grupo = new Map<number, MesProjetado[]>()
      for (const m of meses) {
        const ano = new Date(m.mes).getFullYear()
        if (!grupo.has(ano)) grupo.set(ano, [])
        grupo.get(ano)!.push(m)
      }
      return Array.from(grupo.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([ano, ms]) => {
          const valores = {} as Record<CategoriaRebanho, number>
          for (const k of ORDEM_CATEGORIAS) {
            valores[k] = ms.reduce((s, m) => s + ((m[k] as number) || 0), 0) / ms.length
          }
          const pctVL = ms.reduce((s, m) => s + m.pctVL, 0) / ms.length
          return {
            label: String(ano) + (ms.length < 12 ? '*' : ''),
            valores,
            pctVL,
            anoParcial: ms.length < 12,
          }
        })
    }
    // mensal
    return meses.map(m => {
      const valores = {} as Record<CategoriaRebanho, number>
      for (const k of ORDEM_CATEGORIAS) valores[k] = (m[k] as number) || 0
      return {
        label: fmtMes(m.mes),
        valores,
        pctVL: m.pctVL,
        anoParcial: false,
      }
    })
  }, [projecao, horizonte, modo])

  // Cresce colW conforme aumenta horizonte pra dar respiro entre meses.
  // O wrapper tem overflow-x-auto, então scroll horizontal cobre a largura extra.
  const colW = (() => {
    if (modo === 'anual') {
      return tall ? 220 : 160
    }
    if (tall) {
      if (horizonte <= 12) return 120
      if (horizonte <= 24) return 92
      if (horizonte <= 36) return 76
      if (horizonte <= 48) return 68
      if (horizonte <= 60) return 62
      return 56    // 84m
    }
    if (horizonte <= 12) return 72
    if (horizonte <= 24) return 56
    if (horizonte <= 36) return 50
    if (horizonte <= 48) return 48
    if (horizonte <= 60) return 46
    return 44      // 84m
  })()
  const BMAX = modo === 'anual' ? (tall ? 80 : 48) : (tall ? 44 : 18)
  const BGAP = modo === 'anual' ? 8 : 2
  const CH = tall ? 480 : 200

  // Em horizontes longos, mostrar label de mês a cada N pra não encavalar
  const labelStep = modo === 'anual'
    ? 1
    : (horizonte <= 12 ? 1 : horizonte <= 24 ? 2 : horizonte <= 36 ? 3 : horizonte <= 60 ? 4 : 6)

  // bar min 4px (era 6) pra garantir que 5 cats cabem em colW de horizontes longos.
  // Antes, 5 bars × 6px + 4 gaps × 2px = 38px > colW (28px em 84m) → bezerras
  // desenhava fora da coluna e ficava sob outras barras (bug visto).
  const bW = Math.min(BMAX, visOrd.length > 0
    ? Math.max(4, Math.floor((colW - 4 - (visOrd.length - 1) * BGAP) / visOrd.length))
    : colW - 4)

  // Headroom de 12% para os rótulos acima das barras caberem sem colar no topo.
  const maxV = useMemo(
    () => Math.max(1, ...colunas.flatMap(c => visOrd.map(k => c.valores[k] || 0))) * 1.12,
    [colunas, visOrd],
  )

  const totalW = colW * colunas.length + 50

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
        <div className="flex-1" style={{ minWidth: colW * colunas.length }}>
          {/* Headers (meses ou anos) — em horizontes longos, mostra label a cada labelStep */}
          <div className="flex h-7 border-b border-line">
            {colunas.map((c, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center justify-center text-[10px] font-semibold text-ink-3 font-mono"
                style={{ width: colW }}
                title={c.anoParcial ? 'Ano parcial (menos de 12 meses no filtro)' : c.label}
              >
                {i % labelStep === 0 ? c.label : ''}
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
            {colunas.map((c, i) => (
              <div
                key={i}
                className="shrink-0 flex items-end justify-center px-0.5 relative z-[1]"
                style={{ width: colW, height: CH, gap: BGAP }}
              >
                {visOrd.map(k => {
                  const val = c.valores[k] || 0
                  const bH = val > 0 ? Math.max(2, (val / maxV) * CH) : 0
                  const cor = CORES_CATEGORIAS[k]
                  // Em modo anual sempre exibe rótulo (espaço sobra)
                  const lblOk = val > 0 && (modo === 'anual' || bW >= 6)
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
                            fontSize: modo === 'anual' ? 11 : bW >= 14 ? 10 : 9,
                            color: cor,
                            marginBottom: 1,
                            writingMode: bW < 11 && modo !== 'anual' ? 'vertical-rl' : 'horizontal-tb',
                            transform: bW < 11 && modo !== 'anual' ? 'rotate(180deg)' : 'none',
                            maxHeight: bW < 11 && modo !== 'anual' ? 30 : 'auto',
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
            {colunas.map((c, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center justify-center text-[9px] font-semibold text-brand font-mono tabular-nums"
                style={{ width: colW }}
              >
                {(c.pctVL * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
