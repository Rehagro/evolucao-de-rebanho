import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Fazenda, ResultadoProjecao, Parametros } from '@/types'
import { CORES_CATEGORIAS, type CategoriaRebanho } from '@/lib/coresCategorias'
import logoRehagroUrl from '@/assets/logo-rehagro-tratada.png'

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmtMes(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d)
  return `${MESES_PT[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const m = cleaned.match(/.{2}/g) ?? ['00', '00', '00']
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)]
}

async function loadImageAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function getImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 1, h: 1 })
    img.src = dataUrl
  })
}

function detectFormat(dataUrl: string): 'PNG' | 'JPEG' {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG'
  return 'PNG'
}

interface ExportParams {
  fazenda: Fazenda
  projecao: ResultadoProjecao
  params: Parametros
  /** Conjunto de categorias visíveis (filtro do dashboard). Default: todas. */
  categoriasVisiveis?: Set<CategoriaRebanho>
  /** Horizonte em meses (default 12). */
  horizonte?: number
}

export async function exportarRelatorioPDF({
  fazenda,
  projecao,
  categoriasVisiveis,
  horizonte = 12,
}: ExportParams): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297
  const H = 210
  const M = 12

  // ── Cabeçalho: logos + nome ────────────────────────────────────────────────
  const rehagroDataUrl = await loadImageAsDataUrl(logoRehagroUrl)
  const rehagroDim = await getImageDimensions(rehagroDataUrl)
  const logoH = 14
  const logoW_Reha = logoH * (rehagroDim.w / rehagroDim.h)
  doc.addImage(rehagroDataUrl, 'PNG', M, M, logoW_Reha, logoH)

  if (fazenda.logoBase64) {
    const dim = await getImageDimensions(fazenda.logoBase64)
    const ratio = dim.w / dim.h
    const logoW_Faz = Math.min(40, logoH * ratio)
    const fmt = detectFormat(fazenda.logoBase64)
    doc.addImage(fazenda.logoBase64, fmt, W - M - logoW_Faz, M, logoW_Faz, logoH)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...hexToRgb('#1A7F3C'))
  doc.text(fazenda.nome, W / 2, M + 7, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.text('Relatório de Evolução de Rebanho', W / 2, M + 12.5, { align: 'center' })

  const agora = new Date()
  const dataGeracao =
    agora.toLocaleDateString('pt-BR') + ' ' +
    agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  doc.setFontSize(8)
  doc.setTextColor(130, 130, 130)
  doc.text(`Gerado em ${dataGeracao}  ·  Horizonte: ${horizonte} meses`, W / 2, M + 17, { align: 'center' })

  // ── Gráfico de barras — categorias e horizonte conforme filtro do dashboard ──
  const meses = projecao.meses.slice(0, horizonte)
  const nMeses = meses.length
  const chartX = M
  const chartY = M + 22
  const chartW = W - 2 * M
  const chartH = 75
  const labelGutter = 12

  const TODAS_SERIES = [
    { key: 'vacasLactacao',  label: 'VL',                color: CORES_CATEGORIAS.vacasLactacao },
    { key: 'vacasSecas',     label: 'VS',                color: CORES_CATEGORIAS.vacasSecas },
    { key: 'bezerras0_12m',  label: 'Bezerras 0–12m',    color: CORES_CATEGORIAS.bezerras0_12m },
    { key: 'novilhas12_24m', label: 'Novilhas 12–23m',   color: CORES_CATEGORIAS.novilhas12_24m },
    { key: 'novilhasPrenhas', label: 'Novilhas Prenhas', color: CORES_CATEGORIAS.novilhasPrenhas },
  ] as const

  // Filtra séries pelo filtro do dashboard (se passado). Default: todas.
  const series = categoriasVisiveis
    ? TODAS_SERIES.filter(s => categoriasVisiveis.has(s.key as CategoriaRebanho))
    : TODAS_SERIES

  // Se o usuário desligou todas as categorias, força VL+VS pra não ficar gráfico vazio.
  const seriesEfetivo = series.length > 0
    ? series
    : TODAS_SERIES.filter(s => s.key === 'vacasLactacao' || s.key === 'vacasSecas')

  const maxV =
    Math.max(
      1,
      ...meses.flatMap(m => seriesEfetivo.map(s => Number(m[s.key as keyof typeof m] ?? 0))),
    ) * 1.12

  // Eixo Y + grid
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.2)
  for (let p = 0; p <= 4; p++) {
    const y = chartY + chartH - (p / 4) * chartH
    doc.line(chartX + labelGutter, y, chartX + chartW, y)
    doc.setFontSize(6)
    doc.setTextColor(120, 120, 120)
    doc.text(String(Math.round((maxV * p) / 4)), chartX + labelGutter - 1, y + 1, { align: 'right' })
  }

  const plotW = chartW - labelGutter
  const colW = plotW / nMeses
  const barGroupW = colW * 0.78
  const barW = barGroupW / seriesEfetivo.length

  // Pula labels de mês quando há muitos meses (evita amassar)
  const labelStep = nMeses <= 12 ? 1 : nMeses <= 24 ? 2 : nMeses <= 48 ? 3 : 6
  const labelFont = nMeses <= 12 ? 7 : nMeses <= 24 ? 6 : 5

  meses.forEach((m, i) => {
    const cx = chartX + labelGutter + i * colW + colW / 2
    seriesEfetivo.forEach((s, si) => {
      const val = Number(m[s.key as keyof typeof m] ?? 0)
      const bH = val > 0 ? Math.max(0.4, (val / maxV) * chartH) : 0
      const bx = cx - barGroupW / 2 + si * barW
      const by = chartY + chartH - bH
      const [r, g, b] = hexToRgb(s.color)
      doc.setFillColor(r, g, b)
      doc.rect(bx, by, barW * 0.9, bH, 'F')

      if (val > 0 && barW >= 3.5 && nMeses <= 12) {
        doc.setFontSize(5)
        doc.setTextColor(r, g, b)
        doc.text(String(Math.round(val)), bx + (barW * 0.9) / 2, by - 0.5, { align: 'center' })
      }
    })
    if (i % labelStep === 0) {
      doc.setFontSize(labelFont)
      doc.setTextColor(80, 80, 80)
      doc.text(fmtMes(m.mes), cx, chartY + chartH + 4, { align: 'center' })
    }
  })

  // Legenda
  let lx = chartX + labelGutter
  const ly = chartY + chartH + 9
  doc.setFontSize(8)
  seriesEfetivo.forEach(s => {
    const [r, g, b] = hexToRgb(s.color)
    doc.setFillColor(r, g, b)
    doc.rect(lx, ly - 2.5, 3, 3, 'F')
    doc.setTextColor(60, 60, 60)
    doc.text(s.label, lx + 4, ly)
    lx += doc.getTextWidth(s.label) + 14
  })

  // ── Tabela mensal (cobre o horizonte filtrado) ─────────────────────────────
  const tableData = meses.map(m => [
    fmtMes(m.mes),
    Math.round(m.vacasLactacao),
    Math.round(m.vacasSecas),
    Math.round(m.partosVacas + m.partosNovilhas),
    Math.round(m.novasBezerrasFemeas),
    Math.round(m.descarteInvoluntario + m.descarteVoluntario),
    Math.round(m.mortalidadeAdulta),
  ])

  autoTable(doc, {
    startY: chartY + chartH + 13,
    head: [['Mês', 'N VL', 'N VS', 'Partos totais', 'Fêmeas nascidas', 'Descartes vacas', 'Mortes vacas']],
    body: tableData,
    theme: 'grid',
    margin: { left: M, right: M, bottom: 10 },
    styles: { fontSize: nMeses <= 24 ? 8 : 7, cellPadding: nMeses <= 24 ? 1.4 : 1, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: hexToRgb('#1A7F3C'), textColor: 255, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      1: { textColor: hexToRgb(CORES_CATEGORIAS.vacasLactacao) },
      2: { textColor: hexToRgb(CORES_CATEGORIAS.vacasSecas) },
    },
  })

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  doc.setFontSize(7)
  doc.setTextColor(140, 140, 140)
  doc.text('Relatório gerado por Evolução de Rebanho — Rehagro', W / 2, H - 5, { align: 'center' })

  const slug = fazenda.nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
  const dataIso = agora.toISOString().slice(0, 10)
  doc.save(`evolucao-rebanho-${slug}-${dataIso}.pdf`)
}
