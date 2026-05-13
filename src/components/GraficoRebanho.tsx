import { useEffect, useMemo, useState } from 'react'
import { FileText, Maximize2 } from 'lucide-react'
import type { MesProjetado, Parametros, ResultadoProjecao, Fazenda } from '@/types'
import { CORES_CATEGORIAS, LABELS_CATEGORIAS, ORDEM_CATEGORIAS, type CategoriaRebanho } from '@/lib/coresCategorias'
import { Modal } from '@/components/ui/Modal'
import { exportarRelatorioPDF } from '@/lib/exportPDF'
import '@/styles/charts.css'

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmtMes(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return ''
  return `${MESES_PT[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`
}

const DATA_ROWS = [
  { key: 'descartes',      label: 'Descartes (cab.)',  color: 'var(--color-status-bad)',    get: (m: MesProjetado) => Math.round(m.descarteInvoluntario + m.descarteVoluntario) },
  { key: 'mortes',         label: 'Mortes (cab.)',     color: 'var(--color-status-warn)',   get: (m: MesProjetado) => Math.round(m.mortalidadeAdulta) },
  { key: 'partosNovilhas', label: 'Partos — Novilhas', color: CORES_CATEGORIAS.novilhas12_24m, get: (m: MesProjetado) => Math.round(m.partosNovilhas) },
  { key: 'partosVacas',    label: 'Partos — Vacas',    color: CORES_CATEGORIAS.vacasLactacao,  get: (m: MesProjetado) => Math.round(m.partosVacas) },
  { key: 'secagens',       label: 'Secagens',          color: 'var(--color-status-mid)',    get: (m: MesProjetado) => Math.round(m.secagens) },
]

const _LBLW   = 156
const _HDR_H  = 38
const _DISC_H = 34
const CH     = 210
const _ROW_H  = 32
const BMAX   = 28
const BGAP   = 2

/* ── CvInput: local text state so typing "-" works correctly ── */
function CvInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(value === 0 ? '' : String(value))

  useEffect(() => {
    const parsed = parseInt(text, 10)
    if (isNaN(parsed) ? value !== 0 : parsed !== value) {
      setText(value === 0 ? '' : String(value))
    }
  }, [value])

  const cls = value === 0 ? 'cv-input' : value > 0 ? 'cv-input pos' : 'cv-input neg'

  return (
    <input
      type="text"
      inputMode="numeric"
      className={cls}
      value={text}
      placeholder="0"
      onChange={e => {
        const raw = e.target.value
        if (raw === '' || raw === '-' || /^-?\d+$/.test(raw)) {
          setText(raw)
          const parsed = parseInt(raw, 10)
          onChange(isNaN(parsed) ? 0 : parsed)
        }
      }}
      onBlur={() => {
        const parsed = parseInt(text, 10)
        const v = isNaN(parsed) ? 0 : parsed
        onChange(v)
        setText(v === 0 ? '' : String(v))
      }}
      onFocus={e => e.target.select()}
    />
  )
}

interface Props {
  projecao: ResultadoProjecao
  params: Parametros
  hz: number
  setHz: (h: number) => void
  discOvr: Record<number, number>
  setDiscOvr: React.Dispatch<React.SetStateAction<Record<number, number>>>
  cv: { lac: Record<number, number>; sec: Record<number, number>; nov: Record<number, number> }
  setCv: React.Dispatch<React.SetStateAction<{ lac: Record<number, number>; sec: Record<number, number>; nov: Record<number, number> }>>
  onExport: () => void
  fazenda?: Fazenda
}

export function GraficoRebanho({ projecao, params, hz, setHz, discOvr, setDiscOvr, cv, setCv, onExport, fazenda }: Props) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  const handleExportPDF = async () => {
    if (!fazenda || exportingPDF) return
    setExportingPDF(true)
    try {
      await exportarRelatorioPDF({ fazenda, projecao, params })
    } finally {
      setExportingPDF(false)
    }
  }

  const [vis, setVis] = useState<Set<CategoriaRebanho>>(new Set(ORDEM_CATEGORIAS))

  const meses = projecao.meses.slice(0, hz)
  const visOrd = ORDEM_CATEGORIAS.filter(k => vis.has(k))

  // Headroom de 12% acima da maior barra para o eixo Y não ficar colado no topo.
  const maxV = useMemo(
    () => Math.max(1, ...meses.flatMap(m => visOrd.map(k => (m[k] as number) || 0))) * 1.12,
    [meses, visOrd],
  )

  const hzOptions = ([12, 24, 36, 48, 60, 84] as const).filter(h => h <= projecao.meses.length)

  const stripeBg = (i: number) =>
    i % 2 === 0 ? 'bg-surface' : 'bg-surface-2/40'

  const renderChartContent = (tall: boolean) => {
    const _LBLW   = tall ? 220 : 156
    const _HDR_H  = tall ? 50  : 38
    const _DISC_H = tall ? 46  : 34
    const _CH     = tall ? 460 : 210
    const _ROW_H  = tall ? 44  : 32
    const _BMAX   = tall ? 52  : 28
    const _colW   = tall
      ? (hz <= 12 ? 124 : hz <= 24 ? 104 : 86)
      : (hz <= 12 ?  84 : hz <= 24 ?  72 : 62)

    const _bW = Math.min(_BMAX, visOrd.length > 0
      ? Math.max(8, Math.floor((_colW - 12 - (visOrd.length - 1) * BGAP) / visOrd.length))
      : _colW - 12)

    const _totalW = _LBLW + _colW * meses.length

    return (
    <div className={tall ? 'bg-surface flex flex-col max-h-[calc(96vh-110px)]' : 'bg-surface rounded-lg border border-line shadow-sm overflow-hidden'}>

      {/* ── CONTROLS ── */}
      <div className="border-b border-line shrink-0">

        {/* Row 1: título + ações */}
        <div className="px-[18px] pt-3 pb-2 flex items-center gap-2">
          <span className="text-[13px] font-bold text-ink flex-1">Evolução do Rebanho</span>
          {fazenda && (
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="flex items-center gap-1 px-[11px] py-1 rounded-md border border-line bg-surface-pure text-[11px] font-semibold text-ink-2 hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-wait"
              title="Exportar relatório PDF (12 meses)"
            >
              <FileText size={12} />
              {exportingPDF ? 'Gerando…' : 'PDF'}
            </button>
          )}
          <button
            onClick={onExport}
            className="flex items-center gap-1 px-[11px] py-1 rounded-md border border-line bg-surface-pure text-[11px] font-semibold text-ink-2 hover:bg-surface-2 transition-colors"
            title="Exportar CSV"
          >
            ⬇ CSV
          </button>
          {!tall && (
            <button
              onClick={() => setFullscreenOpen(true)}
              className="flex items-center gap-1 px-[11px] py-1 rounded-md border border-line bg-surface-pure text-[11px] font-semibold text-ink-2 hover:bg-surface-2 transition-colors"
              title="Expandir gráfico em tela cheia"
            >
              <Maximize2 size={12} />
              Expandir
            </button>
          )}
        </div>

        {/* Row 2: category pills */}
        <div className="px-[18px] pb-2 flex gap-1.5 overflow-x-auto">
          {ORDEM_CATEGORIAS.map(k => {
            const on = vis.has(k)
            const cor = CORES_CATEGORIAS[k]
            return (
              <button
                key={k}
                className="cat-pill"
                style={{
                  borderColor: on ? cor : 'var(--color-line)',
                  background: on ? cor + '18' : 'var(--color-surface-2)',
                  color: on ? cor : 'var(--color-ink-4)',
                }}
                onClick={() => setVis(v => {
                  const n = new Set(v)
                  if (on) n.delete(k); else n.add(k)
                  return n
                })}
              >
                <div
                  className="w-[7px] h-[7px] rounded-[2px] shrink-0"
                  style={{ background: on ? cor : 'var(--color-line-2)' }}
                />
                {LABELS_CATEGORIAS[k]}
              </button>
            )
          })}
        </div>

        {/* Row 3: horizon selector */}
        {hzOptions.length > 1 && (
          <div className="px-[18px] pb-2.5 flex gap-0.5">
            <div className="flex gap-0.5 bg-surface-inset rounded-full p-[3px_4px] border border-line">
              {hzOptions.map(h => (
                <button key={h} className={`hz-btn${hz === h ? ' act' : ''}`} onClick={() => setHz(h)}>{h}m</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SCROLLABLE CHART + TABLE ── */}
      <div className={tall ? 'flex-1 overflow-auto' : 'overflow-x-auto overflow-y-visible'}>
        <div className="flex" style={{ minWidth: _totalW }}>

          {/* ── STICKY LABEL COLUMN ── */}
          <div
            className="shrink-0 sticky left-0 z-[5] bg-surface border-r-2 border-line"
            style={{ width: _LBLW }}
          >

            <div
              className={`flex items-center px-3.5 border-b border-line bg-surface-2 ${tall ? 'sticky top-0 z-[7]' : ''}`}
              style={{ height: _HDR_H }}
            >
              <span className="text-[10.5px] font-semibold text-ink-3">Indicador / Mês</span>
            </div>

            <div
              className="flex items-center px-3.5 border-b"
              style={{
                height: _DISC_H,
                background: 'var(--color-median)',
                borderBottomColor: 'var(--color-median-fg)',
              }}
            >
              <span className="text-[11px] font-bold" style={{ color: 'var(--color-median-fg)' }}>
                Descarte Mensal
              </span>
            </div>

            <div
              className="flex flex-col justify-between px-3.5 py-1 bg-surface"
              style={{ height: _CH }}
            >
              {[1, .75, .5, .25, 0].map(p => (
                <div key={p} className="text-[9px] text-ink-4 text-right font-mono tabular-nums">
                  {Math.round(maxV * p)}
                </div>
              ))}
            </div>

            {/* Linha de label %VL (sempre visível agora) */}
            <div
              className="flex items-center px-3.5 border-t border-b"
              style={{
                height: 22,
                background: 'var(--color-brand-tint-2)',
                borderTopColor: 'var(--color-brand-soft)',
                borderBottomColor: 'var(--color-brand-soft)',
              }}
            >
              <span className="text-[9.5px] font-semibold text-brand">%VL</span>
            </div>

            {DATA_ROWS.map((row, ri) => (
              <div
                key={row.key}
                className={`flex items-center px-3.5 border-t border-line ${stripeBg(ri)}`}
                style={{ height: _ROW_H }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-[7px] h-[7px] rounded-[2px] shrink-0" style={{ background: row.color }} />
                  <span className="text-[11px] text-ink-2 font-medium">{row.label}</span>
                </div>
              </div>
            ))}

            <div
              className="flex items-center px-3.5 border-t-2 border-line bg-brand-tint-2"
              style={{ height: 26 }}
            >
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-brand-3">
                Aquisições e Vendas
              </span>
            </div>
            {[
              { label: 'Vaca Lactação', color: CORES_CATEGORIAS.vacasLactacao },
              { label: 'Vaca Seca',     color: 'var(--color-ink-3)' },
              { label: 'Novilhas',      color: CORES_CATEGORIAS.novilhas12_24m },
            ].map((r, ri) => (
              <div
                key={ri}
                className={`flex items-center px-3.5 border-t border-line ${stripeBg(ri)}`}
                style={{ height: _ROW_H }}
              >
                <span className="text-[11px] font-semibold" style={{ color: r.color }}>{r.label}</span>
              </div>
            ))}
            <div className="h-2 bg-surface" />
          </div>

          {/* ── SCROLLABLE CONTENT ── */}
          <div className="flex-1" style={{ minWidth: _colW * meses.length }}>

            {/* Month headers */}
            <div className={`flex bg-surface-2 border-b border-line ${tall ? 'sticky top-0 z-[6]' : ''}`} style={{ height: _HDR_H }}>
              {meses.map((m, i) => (
                <div
                  key={i}
                  className="shrink-0 flex items-center justify-center text-[11px] font-semibold text-ink-3 font-mono tabular-nums"
                  style={{ width: _colW }}
                >
                  {fmtMes(m.mes)}
                </div>
              ))}
            </div>

            {/* Descarte override inputs */}
            <div
              className="flex items-center border-b"
              style={{
                height: _DISC_H,
                background: 'var(--color-median)',
                borderBottomColor: 'var(--color-median-fg)',
              }}
            >
              {meses.map((_, i) => {
                const ov  = discOvr[i] !== undefined
                const val = ov
                  ? Math.round(discOvr[i] * 100)
                  : Math.round(params.descarteInvoluntarioAnual * 100)
                return (
                  <div key={i} className="shrink-0 px-1.5" style={{ width: _colW }}>
                    <input type="number" className={`disc-input${ov ? ' ov' : ''}`}
                      value={val} step={1} min={0} max={100}
                      onFocus={e => e.target.select()}
                      onChange={e => setDiscOvr(d => ({ ...d, [i]: (parseInt(e.target.value) || 0) / 100 }))}
                      onDoubleClick={() => setDiscOvr(d => { const n = { ...d }; delete n[i]; return n })} />
                  </div>
                )
              })}
            </div>

            {/* Bar chart — sem linha %VL sobreposta */}
            <div className="flex relative bg-surface" style={{ height: _CH }}>
              {[.25, .5, .75].map(p => (
                <div
                  key={p}
                  className="absolute left-0 right-0 h-px pointer-events-none z-0"
                  style={{
                    top: `${(1 - p) * 100}%`,
                    background: 'var(--color-line)',
                  }}
                />
              ))}

              {meses.map((m, i) => (
                <div
                  key={i}
                  className="shrink-0 flex items-end justify-center px-1 relative z-[1]"
                  style={{ width: _colW, height: _CH, gap: BGAP }}
                >
                  {visOrd.map(k => {
                    const val = (m[k] as number) || 0
                    const bH  = val > 0 ? Math.max(2, (val / maxV) * _CH) : 0
                    const lblOk = val > 0 && _bW >= 8
                    const cor = CORES_CATEGORIAS[k]
                    return (
                      <div
                        key={k}
                        className="flex flex-col items-center justify-end"
                        style={{ height: _CH }}
                      >
                        {lblOk && (
                          <div
                            className="font-bold leading-tight overflow-hidden font-mono tabular-nums"
                            style={{
                              fontSize: _bW >= 16 ? 11.5 : 10.5,
                              color: cor,
                              marginBottom: 1,
                              writingMode: _bW < 13 ? 'vertical-rl' : 'horizontal-tb',
                              transform: _bW < 13 ? 'rotate(180deg)' : 'none',
                              maxHeight: _bW < 13 ? 32 : 'auto',
                            }}
                          >
                            {Math.round(val)}
                          </div>
                        )}
                        <div
                          className="rounded-t-[3px] transition-[height] duration-200 ease-in-out"
                          style={{
                            width: _bW,
                            height: bH,
                            background: cor,
                            minHeight: val > 0 ? 2 : 0,
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* %VL values row — sempre visível */}
            <div
              className="flex border-t border-b"
              style={{
                height: 22,
                background: 'var(--color-brand-tint-2)',
                borderTopColor: 'var(--color-brand-soft)',
                borderBottomColor: 'var(--color-brand-soft)',
              }}
            >
              {meses.map((m, i) => (
                <div
                  key={i}
                  className="shrink-0 flex items-center justify-center text-[9.5px] font-bold text-brand font-mono tabular-nums"
                  style={{ width: _colW }}
                >
                  {(m.pctVL * 100).toFixed(1)}%
                </div>
              ))}
            </div>

            {/* Data rows */}
            {DATA_ROWS.map((row, ri) => (
              <div
                key={row.key}
                className={`flex items-center border-t border-line ${stripeBg(ri)}`}
                style={{ height: _ROW_H }}
              >
                {meses.map((m, i) => (
                  <div
                    key={i}
                    className="shrink-0 text-center text-[11.5px] font-semibold font-mono tabular-nums"
                    style={{ width: _colW, color: row.color }}
                  >
                    {row.get(m)}
                  </div>
                ))}
              </div>
            ))}

            {/* Aquisições e Vendas header */}
            <div
              className="flex items-center border-t-2 border-line bg-brand-tint-2"
              style={{ height: 26 }}
            >
              {meses.map((_, i) => <div key={i} className="shrink-0" style={{ width: _colW }} />)}
            </div>

            {/* Compra/Venda inputs */}
            {(['lac', 'sec', 'nov'] as const).map((rowKey, ri) => (
              <div
                key={rowKey}
                className={`flex items-center border-t border-line ${stripeBg(ri)}`}
                style={{ height: _ROW_H }}
              >
                {Array.from({ length: meses.length }, (_, i) => (
                  <div key={i} className="shrink-0 px-1.5" style={{ width: _colW }}>
                    <CvInput
                      value={cv[rowKey]?.[i] ?? 0}
                      onChange={val => setCv(c => ({ ...c, [rowKey]: { ...c[rowKey], [i]: val } }))}
                    />
                  </div>
                ))}
              </div>
            ))}
            <div className="h-2" />
          </div>
        </div>
      </div>
    </div>
    )
  }

  return (
    <>
      {renderChartContent(false)}
      <Modal
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        size="fullscreen"
        title={`Evolução do Rebanho${fazenda ? ` — ${fazenda.nome}` : ''}`}
      >
        {renderChartContent(true)}
      </Modal>
    </>
  )
}
