import { useMemo } from 'react'
import type { ResultadoProjecao, MesProjetado } from '@/types'
import { CORES_CATEGORIAS, LABELS_CATEGORIAS, ORDEM_CATEGORIAS, type CategoriaRebanho } from '@/lib/coresCategorias'

interface Props {
  projecao: ResultadoProjecao
  /** Quantos meses considerar a partir do início. */
  horizonte: number
  /** Categorias visíveis (igual aos pills do filtro). */
  categorias: Set<CategoriaRebanho>
}

interface MediaAno {
  ano: number
  meses: number   // quantos meses do ano caem no filtro (1–12)
  valores: Record<CategoriaRebanho, number>
}

/**
 * Resumo anual de médias por categoria + crescimento year-over-year.
 *
 * Agrupa os `horizonte` meses por ano calendário, calcula a média mensal de cada
 * categoria do gráfico e mostra a variação % vs ano anterior.
 *
 * Anos parciais (com menos de 12 meses no filtro) ficam marcados com sufixo "*"
 * e o YoY é omitido para evitar comparação enviesada.
 */
export function TabelaResumoAnual({ projecao, horizonte, categorias }: Props) {
  const dados = useMemo<MediaAno[]>(() => {
    const meses = projecao.meses.slice(0, horizonte)
    const grupo = new Map<number, MesProjetado[]>()
    for (const m of meses) {
      const ano = new Date(m.mes).getFullYear()
      if (!grupo.has(ano)) grupo.set(ano, [])
      grupo.get(ano)!.push(m)
    }
    return Array.from(grupo.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ano, ms]) => ({
        ano,
        meses: ms.length,
        valores: {
          vacasLactacao:   media(ms, 'vacasLactacao'),
          vacasSecas:      media(ms, 'vacasSecas'),
          bezerras0_12m:   media(ms, 'bezerras0_12m'),
          novilhas12_24m:  media(ms, 'novilhas12_24m'),
          novilhasPrenhas: media(ms, 'novilhasPrenhas'),
        },
      }))
  }, [projecao, horizonte])

  if (dados.length === 0) return null

  const categoriasOrd = ORDEM_CATEGORIAS.filter(c => categorias.has(c))
  if (categoriasOrd.length === 0) return null

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-2">
        Média anual e crescimento (YoY)
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left py-2 px-2 font-semibold text-ink-3">Categoria</th>
              {dados.map((d, i) => (
                <th key={d.ano} className="text-right py-2 px-2 font-semibold text-ink-3 font-mono tabular-nums">
                  {d.ano}{d.meses < 12 ? '*' : ''}
                  {i > 0 && (
                    <span className="ml-1 text-[10px] text-ink-4 font-normal">(YoY)</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categoriasOrd.map(cat => {
              const cor = CORES_CATEGORIAS[cat]
              return (
                <tr key={cat} className="border-b border-line/60">
                  <td className="py-1.5 px-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-[2px]" style={{ background: cor }} />
                    <span className="text-ink-2">{LABELS_CATEGORIAS[cat]}</span>
                  </td>
                  {dados.map((d, i) => {
                    const valor = d.valores[cat]
                    const prev = i > 0 ? dados[i - 1].valores[cat] : null
                    // Só mostra YoY se ambos anos têm 12 meses (ou se o anterior tem >= 6 e atual também >= 6)
                    const podeYoY = i > 0 && dados[i - 1].meses >= 6 && d.meses >= 6 && prev !== null && prev > 0
                    const yoy = podeYoY ? ((valor - prev!) / prev!) * 100 : null
                    return (
                      <td key={d.ano} className="py-1.5 px-2 text-right font-mono tabular-nums">
                        <span className="text-ink">{Math.round(valor)}</span>
                        {yoy !== null && (
                          <span
                            className="ml-1.5 text-[10px]"
                            style={{
                              color: yoy >= 0 ? 'var(--color-status-good)' : 'var(--color-status-bad)',
                            }}
                          >
                            {yoy >= 0 ? '+' : ''}{yoy.toFixed(1).replace('.', ',')}%
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {dados.some(d => d.meses < 12) && (
        <p className="text-[10px] text-ink-4 mt-2">
          * Ano parcial (menos de 12 meses no filtro). YoY oculto quando comparação fica enviesada.
        </p>
      )}
    </div>
  )
}

function media(meses: MesProjetado[], campo: keyof MesProjetado): number {
  if (meses.length === 0) return 0
  const soma = meses.reduce((s, m) => s + (Number(m[campo]) || 0), 0)
  return soma / meses.length
}
