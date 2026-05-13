import type { ResultadoProjecao } from '@/types'
import { KPI } from '@/components/ui/KPI'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { calcularKpisDashboard } from '@/lib/dashboardKpis'

interface Props {
  projecao: ResultadoProjecao
  hz: number
}

const MESES_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
function fmtMes(d: Date | string | null): string {
  if (!d) return '—'
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return '—'
  return `${MESES_PT[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`
}

function pctStr(n: number, d = 1) {
  if (!Number.isFinite(n)) return '—'
  return (n * 100).toFixed(d).replace('.', ',') + '%'
}
function num(n: number) {
  if (!Number.isFinite(n)) return '—'
  return Math.round(n).toLocaleString('pt-BR')
}

/**
 * Dashboard KPIs — 5 cards compactos (Variante A).
 * Calculados sobre o horizonte filtrado (`hz`).
 */
export function CardsResumo({ projecao, hz }: Props) {
  const n = Math.min(hz, projecao.meses.length)
  const meses = projecao.meses.slice(0, n)
  const k = calcularKpisDashboard(meses)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
      <KPI
        label={<InfoTooltip term="KPI_PCT_VL_MEDIO" placement="bottom">%VL médio</InfoTooltip>}
        value={pctStr(k.pctVLMedio)}
        sub={`média de ${n} meses`}
        color="var(--color-kpi-pctvl)"
      />
      <KPI
        label={<InfoTooltip term="KPI_MEDIA_VL" placement="bottom">Média VL</InfoTooltip>}
        value={num(k.mediaVL)}
        sub={`vacas em lactação · ${n}m`}
        color="var(--color-data-vl)"
      />
      <KPI
        label={<InfoTooltip term="KPI_PARTOS" placement="bottom">Partos totais / Vacas</InfoTooltip>}
        value={pctStr(k.razaoPartosTotalSobreVacas)}
        sub={`${num(k.partosTotal)} totais · ${num(k.partosVacas)} vacas`}
        color="var(--color-kpi-partos)"
      />
      <KPI
        label={<InfoTooltip term="KPI_REBANHO" placement="bottom">Vacas / Rebanho</InfoTooltip>}
        value={pctStr(k.vacasSobreRebanho)}
        sub={`composição em ${fmtMes(k.mesFim)}`}
        color="var(--color-kpi-rebanho)"
      />
      <KPI
        label={<InfoTooltip term="KPI_CRESCIMENTO" placement="bottom">Crescimento</InfoTooltip>}
        value={Number.isFinite(k.crescimentoPct)
          ? `${k.crescimentoPct >= 0 ? '+' : ''}${k.crescimentoPct.toFixed(1).replace('.', ',')}%`
          : '—'}
        sub={`${fmtMes(k.mesInicio)} → ${fmtMes(k.mesFim)} (${num(k.vlInicio)} → ${num(k.vlFim)})`}
        color={k.crescimentoPct >= 0 ? 'var(--color-kpi-cresc)' : 'var(--color-status-bad)'}
      />
    </div>
  )
}
