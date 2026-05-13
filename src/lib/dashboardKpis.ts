import type { MesProjetado } from '@/types'

/**
 * KPIs do Dashboard (Onda 2).
 *
 * Calculados sobre o array `meses` já filtrado pelo horizonte (`hz`).
 */
export interface KpisDashboard {
  /** Média mensal de pctVL no horizonte (0–1). */
  pctVLMedio: number
  /** Média mensal de vacas em lactação no horizonte (cabeças). */
  mediaVL: number
  /** Σ partosVacas + partosNovilhas no horizonte. */
  partosTotal: number
  partosVacas: number
  partosNovilhas: number
  /** partosTotal / partosVacas (0..N, tipicamente >1). 0 quando não há partos de vacas. */
  razaoPartosTotalSobreVacas: number
  /** (VL + VS) / rebanho total no último mês (0–1). */
  vacasSobreRebanho: number
  /** Último mês do horizonte (data). */
  mesFim: Date | null
  /** Primeiro mês do horizonte (data). */
  mesInicio: Date | null
  /** (VL+VS último − VL+VS primeiro) / VL+VS primeiro × 100. */
  crescimentoPct: number
  /** VL+VS no primeiro mês do horizonte. */
  vlInicio: number
  /** VL+VS no último mês do horizonte. */
  vlFim: number
}

export function calcularKpisDashboard(meses: MesProjetado[]): KpisDashboard {
  if (meses.length === 0) {
    return {
      pctVLMedio: 0,
      mediaVL: 0,
      partosTotal: 0,
      partosVacas: 0,
      partosNovilhas: 0,
      razaoPartosTotalSobreVacas: 0,
      vacasSobreRebanho: 0,
      mesFim: null,
      mesInicio: null,
      crescimentoPct: 0,
      vlInicio: 0,
      vlFim: 0,
    }
  }

  const pctVLMedio = meses.reduce((s, m) => s + m.pctVL, 0) / meses.length
  const mediaVL = meses.reduce((s, m) => s + m.vacasLactacao, 0) / meses.length

  const partosVacas = meses.reduce((s, m) => s + m.partosVacas, 0)
  const partosNovilhas = meses.reduce((s, m) => s + m.partosNovilhas, 0)
  const partosTotal = partosVacas + partosNovilhas
  const razaoPartosTotalSobreVacas = partosVacas > 0 ? partosTotal / partosVacas : 0

  const primeiro = meses[0]
  const ultimo = meses[meses.length - 1]
  const vacasTotaisFim = ultimo.vacasLactacao + ultimo.vacasSecas
  const rebanhoTotalFim = vacasTotaisFim
    + (ultimo.bezerras0_12m ?? 0)
    + (ultimo.novilhas12_24m ?? 0)
    + (ultimo.novilhasPrenhas ?? 0)
  const vacasSobreRebanho = rebanhoTotalFim > 0 ? vacasTotaisFim / rebanhoTotalFim : 0

  const vlInicio = primeiro.vacasLactacao + primeiro.vacasSecas
  const vlFim = vacasTotaisFim
  const crescimentoPct = vlInicio > 0 ? ((vlFim - vlInicio) / vlInicio) * 100 : 0

  return {
    pctVLMedio,
    mediaVL,
    partosTotal,
    partosVacas,
    partosNovilhas,
    razaoPartosTotalSobreVacas,
    vacasSobreRebanho,
    mesFim: ultimo.mes,
    mesInicio: primeiro.mes,
    crescimentoPct,
    vlInicio,
    vlFim,
  }
}
