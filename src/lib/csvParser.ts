import Papa from 'papaparse'
import type { VacaSecagem, PartoPrevisto, AnimalCrescimento, FaixaEtaria, SitRep } from '@/types'

function parseDate_ddmmaaaa(s: string): Date | null {
  if (!s || !s.trim()) return null
  const clean = s.trim()
  // dd/mm/aa or dd/mm/aaaa
  const parts = clean.split('/')
  if (parts.length !== 3) return null
  const d = parseInt(parts[0])
  const m = parseInt(parts[1]) - 1
  let y = parseInt(parts[2])
  if (y < 100) y += 2000
  const dt = new Date(y, m, d)
  if (isNaN(dt.getTime())) return null
  return dt
}

function parseFloat_br(s: string): number | null {
  if (!s || !s.trim()) return null
  const n = parseFloat(s.trim().replace(',', '.'))
  return isNaN(n) ? null : n
}

export interface ParseResult<T> {
  data: T[]
  errors: string[]
  warnings: string[]
}

// ─── secagem.csv ─────────────────────────────────────────────────────────────

export function parseSecagem(content: string): ParseResult<VacaSecagem> {
  const errors: string[] = []
  const warnings: string[] = []
  const data: VacaSecagem[] = []

  // Papa.parse síncrono (sem callback) retorna ParseResult, mas o type ficou bagunçado.
  // Workaround: chamar via type-assertion preservando o comportamento.
  const result = (Papa.parse as unknown as (input: string, config: unknown) => Papa.ParseResult<string[]>)(content, {
    delimiter: ';',
    skipEmptyLines: true,
    encoding: 'latin1',
  })


  const rows = result.data
  if (rows.length < 2) {
    errors.push('Arquivo de secagem não contém dados.')
    return { data, errors, warnings }
  }

  // Validate header
  const header = rows[0]
  if (!header[0]?.includes('animal')) {
    errors.push('Cabeçalho inesperado no arquivo de secagem.')
    return { data, errors, warnings }
  }

  const ids = new Set<number>()
  let nullCL = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const nAnimalStr = row[0]?.trim()
    if (!nAnimalStr) continue

    const nAnimal = parseInt(nAnimalStr)
    if (isNaN(nAnimal)) continue

    if (ids.has(nAnimal)) {
      warnings.push(`Animal ${nAnimal} duplicado na linha ${i + 1}`)
    }
    ids.add(nAnimal)

    const ultCL = parseFloat_br(row[5])
    if (ultCL === null) nullCL++

    const sitRepRaw = row[4]?.trim() as SitRep
    const sitRep: SitRep = ['Ges.', 'Ins.', 'Vaz. pev', 'Vaz. atr.', 'Vaz. apt.'].includes(sitRepRaw)
      ? sitRepRaw
      : 'Vaz. apt.'

    data.push({
      nAnimal,
      dtSecPrev: parseDate_ddmmaaaa(row[1]),
      dtUltLeite: parseDate_ddmmaaaa(row[2]),
      sitPro: row[3]?.trim() ?? 'Lac.',
      sitRep,
      ultCL_kg: ultCL,
    })
  }

  if (nullCL > data.length * 0.1) {
    warnings.push(`${nullCL} animais (${Math.round(nullCL / data.length * 100)}%) sem valor de Último CL — verifique o arquivo.`)
  }

  return { data, errors, warnings }
}

// ─── Agenda_de_parto.csv ─────────────────────────────────────────────────────

export function parseAgendaParto(content: string, dataReferencia: Date): ParseResult<PartoPrevisto> {
  const errors: string[] = []
  const warnings: string[] = []
  const data: PartoPrevisto[] = []

  // Papa.parse síncrono (sem callback) retorna ParseResult, mas o type ficou bagunçado.
  // Workaround: chamar via type-assertion preservando o comportamento.
  const result = (Papa.parse as unknown as (input: string, config: unknown) => Papa.ParseResult<string[]>)(content, {
    delimiter: ';',
    skipEmptyLines: true,
    encoding: 'latin1',
  })


  let rows = result.data

  // Skip "Parto simples" title line if present
  if (rows[0]?.[0]?.toLowerCase().includes('parto simples')) {
    rows = rows.slice(1)
  }

  if (rows.length < 2) {
    errors.push('Arquivo de agenda de partos não contém dados.')
    return { data, errors, warnings }
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const nMatrizStr = row[0]?.trim()
    if (!nMatrizStr) continue

    const nMatriz = parseInt(nMatrizStr)
    if (isNaN(nMatriz)) continue

    const partoPrevisto = parseDate_ddmmaaaa(row[1])
    if (!partoPrevisto) continue

    // Recalculate faltam dias from upload reference date
    const faltamDias = Math.round((partoPrevisto.getTime() - dataReferencia.getTime()) / (1000 * 60 * 60 * 24))

    const op = parseInt(row[3]?.trim())
    const spRaw = row[4]?.trim()
    const sp = spRaw === 'L' ? 'L' : spRaw === 'S' ? 'S' : null

    data.push({
      nMatriz,
      partoPrevisto,
      faltamDias,
      op: isNaN(op) ? 1 : op,
      sp,
      reprodRaca: row[5]?.trim() || null,
      isNovilha: op === 1,
    })
  }

  return { data, errors, warnings }
}

// ─── ANimais_crescimento.csv ──────────────────────────────────────────────────

function idadeDiasToFaixa(dias: number): FaixaEtaria {
  if (dias <= 90) return '0-3m'
  if (dias <= 180) return '3-6m'
  if (dias <= 270) return '6-9m'
  if (dias <= 365) return '9-12m'
  if (dias <= 547) return '12-18m'
  if (dias <= 730) return '18-24m'
  return 'apta'
}

export function parseCrescimento(content: string): ParseResult<AnimalCrescimento> {
  const errors: string[] = []
  const warnings: string[] = []
  const data: AnimalCrescimento[] = []

  // Papa.parse síncrono (sem callback) retorna ParseResult, mas o type ficou bagunçado.
  // Workaround: chamar via type-assertion preservando o comportamento.
  const result = (Papa.parse as unknown as (input: string, config: unknown) => Papa.ParseResult<string[]>)(content, {
    delimiter: ';',
    skipEmptyLines: true,
    encoding: 'latin1',
  })


  const rows = result.data
  if (rows.length < 2) {
    errors.push('Arquivo de animais em crescimento não contém dados.')
    return { data, errors, warnings }
  }

  const ids = new Set<number>()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const nAnimalStr = row[0]?.trim()
    if (!nAnimalStr) continue

    const nAnimal = parseInt(nAnimalStr)
    if (isNaN(nAnimal)) continue

    const idadeDias = parseInt(row[1]?.trim())
    if (isNaN(idadeDias)) continue

    if (ids.has(nAnimal)) {
      warnings.push(`Animal ${nAnimal} duplicado na linha ${i + 1}`)
    }
    ids.add(nAnimal)

    const categoriaRaw = row[2]?.trim() ?? ''
    const categoria = categoriaRaw === 'Novilha' ? 'Novilha' : 'Em crescimento'

    data.push({
      nAnimal,
      idadeDias,
      idadeMeses: Math.round(idadeDias / 30.44),
      faixaEtaria: idadeDiasToFaixa(idadeDias),
      categoria,
    })
  }

  return { data, errors, warnings }
}

// ─── Preview Summary ─────────────────────────────────────────────────────────

export interface SecagemSummary {
  total: number
  porSitRep: Record<string, number>
  semDtSecPrev: number
  semUltCL: number
}

export interface AgendaSummary {
  total: number
  novilhas: number
  vacas: number
  porMes: Record<string, { total: number; novilhas: number; vacas: number }>
  jaOcorridos: number
}

export interface CrescimentoSummary {
  total: number
  porFaixa: Record<string, number>
}

export function summarizeSecagem(data: VacaSecagem[]): SecagemSummary {
  const porSitRep: Record<string, number> = {}
  let semDtSecPrev = 0
  let semUltCL = 0
  for (const v of data) {
    porSitRep[v.sitRep] = (porSitRep[v.sitRep] ?? 0) + 1
    if (!v.dtSecPrev) semDtSecPrev++
    if (v.ultCL_kg === null) semUltCL++
  }
  return { total: data.length, porSitRep, semDtSecPrev, semUltCL }
}

export function summarizeAgenda(data: PartoPrevisto[]): AgendaSummary {
  const porMes: Record<string, { total: number; novilhas: number; vacas: number }> = {}
  let jaOcorridos = 0
  let novilhas = 0
  let vacas = 0

  for (const p of data) {
    const key = `${p.partoPrevisto.getMonth() + 1}/${p.partoPrevisto.getFullYear()}`
    if (!porMes[key]) porMes[key] = { total: 0, novilhas: 0, vacas: 0 }
    porMes[key].total++
    if (p.isNovilha) { porMes[key].novilhas++; novilhas++ }
    else { porMes[key].vacas++; vacas++ }
    if (p.faltamDias < 0) jaOcorridos++
  }

  return { total: data.length, novilhas, vacas, porMes, jaOcorridos }
}

export function summarizeCrescimento(data: AnimalCrescimento[]): CrescimentoSummary {
  const porFaixa: Record<string, number> = {}
  for (const a of data) {
    porFaixa[a.faixaEtaria] = (porFaixa[a.faixaEtaria] ?? 0) + 1
  }
  return { total: data.length, porFaixa }
}
