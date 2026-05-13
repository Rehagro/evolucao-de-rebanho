import type { ResultadoProjecao, Parametros } from '@/types'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtMes(d: Date): string {
  return `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
}

export function exportCSV(projecao: ResultadoProjecao, params: Parametros): void {
  const meses = projecao.meses
  const header = ['Indicador', ...meses.map(m => fmtMes(m.mes))]

  const rows: (string | number)[][] = [
    header,
    ['Vacas em Lactação',    ...meses.map(m => Math.round(m.vacasLactacao))],
    ['Vacas Secas',          ...meses.map(m => Math.round(m.vacasSecas))],
    ['Maternidade (pré-parto)', ...meses.map(m => Math.round(m.maternidade))],
    ...Array.from({ length: params.idadeAoParto }, (_, i) =>
      [`Recria ${i + 1}m`, ...meses.map(m => Math.round(m.coortesJovens[i] ?? 0))]
    ),
    ['Partos — Vacas',       ...meses.map(m => Math.round(m.partosVacas))],
    ['Partos — Novilhas',    ...meses.map(m => Math.round(m.partosNovilhas))],
    ['Secagens',             ...meses.map(m => Math.round(m.secagens))],
    ['Descartes',            ...meses.map(m => Math.round(m.descarteInvoluntario + m.descarteVoluntario))],
    ['Mortes',               ...meses.map(m => Math.round(m.mortalidadeAdulta))],
    ['%VL',                  ...meses.map(m => (m.pctVL * 100).toFixed(1))],
    ['Produção leite (L/dia)', ...meses.map(m => Math.round(m.producaoLeiteDia))],
    ['Leite vendido (L/dia)', ...meses.map(m => Math.round(m.leiteVendidoDia))],
  ]

  const csv = '﻿' + rows.map(r => r.join(';')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'evolucao_rebanho.csv'
  a.click()
  URL.revokeObjectURL(url)
}
