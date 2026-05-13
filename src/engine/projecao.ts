import type {
  Parametros, EstadoAtualRebanho, RebanhoAtual,
  MesProjetado, ResultadoProjecao, ResumoAnual,
  TaxaConcepcaoMensal,
} from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ultimoDiaMes(ano: number, mes: number): Date {
  return new Date(ano, mes, 0)
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate()
}

function taxaConcepcaoDoMes(tc: TaxaConcepcaoMensal, mes: number): number {
  const keys = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'] as const
  return tc[keys[mes - 1]]
}

function mortalidadeMensalJovem(params: Parametros, mesesDeVida: number, idadeAoParto: number): number {
  // Replica planilha: parâmetros são taxas AO LONGO DA FAIXA (não mensais).
  // Mensalmente, divide pela largura da faixa.
  if (mesesDeVida <= 3) return params.mortalidade_0_3m / 3
  if (mesesDeVida <= 6) return params.mortalidade_3_6m / 3
  if (mesesDeVida <= 9) return params.mortalidade_6_9m / 3
  if (mesesDeVida <= 12) return params.mortalidade_9_12m / 3
  return params.mortalidade_12_26m / Math.max(1, idadeAoParto - 13)  // = /11 para idadeAoParto=24
}

// ─── Secagens por mês a partir dos dados reais ───────────────────────────────

/**
 * EOMONTH idêntica ao Excel: último dia do mês da data dada + offset de meses.
 */
function eomonth(d: Date, offsetMonths = 0): Date {
  return new Date(d.getFullYear(), d.getMonth() + offsetMonths + 1, 0)
}

function calcularSecagensPorMes(
  rebanho: RebanhoAtual,
  params: Parametros,
): Map<string, { rotina: number; producao: number }> {
  const map = new Map<string, { rotina: number; producao: number }>()

  // Replica planilha (aba secagem, colunas G-O):
  //   G1 = EOMONTH(A39, 0); H1 = EOMONTH(G1+1, 0); ... K1 = 5º mês
  //   G2 = F2 - 0.8 (= produção em 1m); H2 = G2 - 0.8; ... K2 = F2 - 4×0.8
  //   M2 = IF(G2<10, G1, IF(H2<10, H1, IF(I2<10, I1, IF(J2<10, J1, IF(K2<10, K1, "")))))
  //   N2 = MIN(B2, M2)   ← Secagem real = MIN(rotina, baixa)
  //   O2 = EOMONTH(N2, 0)  ← Mes seca real
  const dataRef = params.dataReferenciaSecagem
    ? new Date(params.dataReferenciaSecagem)
    : new Date(rebanho.dataReferencia.getFullYear(), rebanho.dataReferencia.getMonth() + 1, 5)
  const limiar = params.limiteProducaoSecagem
  const declinio = params.declinioProdMensal
  const dia1 = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1)
  // Datas de fim-de-mês dos 5 próximos meses (G1..K1)
  const fimMesFutoro: Date[] = []
  for (let m = 0; m < 5; m++) {
    fimMesFutoro.push(eomonth(dia1, m))
  }

  for (const vaca of rebanho.vacasSecagem) {
    const dtRotina = vaca.dtSecPrev

    // Secagem por BAIXA produção: planilha M2 = IF(E2="Vaz. Pev", "", ...) — pula PEV
    let dtProducao: Date | null = null
    if (vaca.sitRep !== 'Vaz. pev' && vaca.ultCL_kg !== null && vaca.ultCL_kg !== undefined) {
      for (let m = 1; m <= 5; m++) {
        const prodM = vaca.ultCL_kg - m * declinio
        if (prodM < limiar) {
          dtProducao = fimMesFutoro[m - 1]
          break
        }
      }
    }

    // Secagem real = MIN(rotina, baixa) — "o que vier primeiro"
    let dtSecFinal: Date | null = null
    let tipoSecagem: 'rotina' | 'producao' = 'rotina'
    if (dtRotina && dtProducao) {
      dtSecFinal = dtRotina < dtProducao ? dtRotina : dtProducao
      tipoSecagem = dtRotina < dtProducao ? 'rotina' : 'producao'
    } else if (dtRotina) {
      dtSecFinal = dtRotina
    } else if (dtProducao) {
      dtSecFinal = dtProducao
      tipoSecagem = 'producao'
    }

    if (dtSecFinal) {
      // Mes seca real = EOMONTH(N2, 0) → usa o último dia do mês para chave
      const eom = eomonth(dtSecFinal)
      const key = `${eom.getFullYear()}-${String(eom.getMonth() + 1).padStart(2, '0')}`
      const cur = map.get(key) ?? { rotina: 0, producao: 0 }
      if (tipoSecagem === 'rotina') cur.rotina++
      else cur.producao++
      map.set(key, cur)
    }
  }

  return map
}

// ─── Previsão de liberação de novilhas por mês (+1 a +11) ────────────────────

/**
 * Calcula quantas novilhas vão se liberar em cada um dos 11 próximos meses,
 * a partir das coortes iniciais. Replica Param!B67-L67 da planilha — mas
 * calculado automaticamente pelo motor (regra: idade idadeLib-t HOJE libera +t).
 *
 * Aplica mortalidade acumulada da faixa (12_26m por simplificação, é a faixa
 * em que a maioria dos animais que vão liberar nos próximos 11 meses está).
 */
export function preverLiberacaoNovilhas(
  rebanho: RebanhoAtual,
  estado: EstadoAtualRebanho,
  params: Parametros,
): number[] {
  const partosReaisMap = indexarPartosReais(rebanho)
  const dataRef = rebanho.dataReferencia
  const coortes = construirCoortesIniciais(estado, params.idadeAoParto, partosReaisMap, dataRef)
  const previsao: number[] = []
  const sim = [...coortes]
  const size = sim.length
  for (let t = 0; t < 11; t++) {
    const idx = Math.max(0, params.idadeLiberacao - 2)
    previsao.push(Math.round(sim[idx] ?? 0))
    // Avança coortes (replica regra da planilha — coorte idadeAoParto-1 zera)
    for (let j = size - 1; j > 0; j--) {
      if (j === params.idadeAoParto - 1) {
        sim[j] = 0
      } else {
        const mort = mortalidadeMensalJovem(params, j + 1, params.idadeAoParto)
        sim[j] = sim[j - 1] * (1 - mort)
      }
    }
    sim[0] = 0 // novas bezerras (gestação > 9m, não impacta nos primeiros 11m)
  }
  return previsao
}

// ─── Coortes iniciais a partir dos CSVs ──────────────────────────────────────

// Tamanho das coortes — cobrir até 28m (coortes 19-28 = partos futuros/iminentes na planilha B52-B61)
const COORTE_SIZE = (idadeAoParto: number) => Math.max(idadeAoParto + 4, 28)

function construirCoortesIniciais(
  estado: EstadoAtualRebanho,
  idadeAoParto: number,
  partosReaisMap: Map<string, { vacas: number; novilhas: number }>,
  dataReferencia: Date,
): number[] {
  // Replica planilha (linhas 34-69 da aba Evolução Rebanho — coluna B "Valor inicial"):
  //   B34-B39 (1m-6m):    Param!A53 / 6                = bezerras<180d / 6
  //   B40-B47 (7m-14m):   Param!A54 / 8                = bez_180d_até_aptas / 8
  //   B48-B51 (15m-18m):  SUM(A45:A48) / 4             = (aptas+atrasadas+insLt25+insGt25)/4
  //   B52-B61 (19m-28m):  partos novilha previstos meses 10..1 (futuro→passado da agenda)
  const size = COORTE_SIZE(idadeAoParto)
  const coortes = new Array<number>(size).fill(0)

  // 1m-6m
  for (let i = 0; i < 6; i++) {
    coortes[i] = estado.bezerrasMenores180d / 6
  }
  // 7m-14m
  for (let i = 6; i < 14; i++) {
    coortes[i] = estado.bezerrasNovilhas180dAteAptas / 8
  }
  // 15m-18m
  const totalRepro = estado.novilhasVaziasAptas + estado.novilhasAtrasadas
    + estado.novilhasInseminadas_lt25 + estado.novilhasInseminadas_gt25
  for (let i = 14; i < 18; i++) {
    coortes[i] = totalRepro / 4
  }
  // 19m-28m: partos novilha previstos
  for (let i = 18; i < 28; i++) {
    const mesRel = 28 - i   // i=18 → mês 10 (futuro), i=27 → mês 1 (próximo)
    const d = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + mesRel, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    coortes[i] = partosReaisMap.get(key)?.novilhas ?? 0
  }

  return coortes
}

// ─── Partos reais indexados por mês ──────────────────────────────────────────

function indexarPartosReais(rebanho: RebanhoAtual): Map<string, { vacas: number; novilhas: number }> {
  const map = new Map<string, { vacas: number; novilhas: number }>()
  for (const parto of rebanho.partosPrevistos) {
    const d = parto.partoPrevisto
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const cur = map.get(key) ?? { vacas: 0, novilhas: 0 }
    if (parto.isNovilha) cur.novilhas++
    else cur.vacas++
    map.set(key, cur)
  }
  return map
}

// ─── Motor principal ──────────────────────────────────────────────────────────

export function calcularProjecao(
  params: Parametros,
  estado: EstadoAtualRebanho,
  rebanho: RebanhoAtual | null,
  dataReferencia: Date,
  discOvr?: Record<number, number>,
  cv?: { lac: Record<number, number>; sec: Record<number, number>; nov: Record<number, number> },
): ResultadoProjecao {
  const meses: MesProjetado[] = []

  const partosReaisMap = rebanho ? indexarPartosReais(rebanho) : new Map<string, { vacas: number; novilhas: number }>()
  const secagensReaisMap = rebanho ? calcularSecagensPorMes(rebanho, params) : new Map<string, { rotina: number; producao: number }>()

  let coortes = construirCoortesIniciais(estado, params.idadeAoParto, partosReaisMap, dataReferencia)

  // Estado reprodutivo atual
  let vacasLactacao = estado.vacasLactacao
  let vacasSecas = estado.vacasSecas

  // B13: vacasAptas inicial = vazias + atrasadas + insLt25×(1-TC) + insGt25×(1-DG%) + PEV/2
  // Aba IA usa B11 = TC do mês B2 (= mês 2 da projeção, +2 meses civis em relação a DATA_REF).
  // DATA_REF=31/03 (getMonth=2, Mar) → mês 2 da projeção = Maio = base 1: 5.
  // Fórmula: ((getMonth + 2) % 12) + 1 → trata virada de ano.
  const _mesPoolInicial = ((dataReferencia.getMonth() + 2) % 12) + 1
  const tcInicialVacas = taxaConcepcaoDoMes(params.taxaConcepcaoVacas, _mesPoolInicial)
  const tcInicialNovilhas = taxaConcepcaoDoMes(params.taxaConcepcao_Novilhas, _mesPoolInicial)
  const pevMeses = params.pev === 60 ? 2 : 1
  const partosPev = pevMeses === 2 ? estado.partos31a60d : estado.partosUltimos30d
  let vacasAptasPool = estado.vacasVaziasAptas + estado.vacasAtrasadas
    + partosPev * params.pctVacasAptasAposParto / 2
    + estado.vacasInseminadas_lt25 * (1 - tcInicialVacas)
    + estado.vacasInseminadas_gt25 * (1 - params.pctPrenhesToque_Vacas)

  // Helper: liberação de novilhas no mês idx (0-based, 0 = aba IA col B = 1º mês da IA).
  // Para idx < 11: usa override do usuário (Param!B67-L67). Para idx >= 11: coorte natural.
  const liberaNoMes = (idx: number): number => {
    const ov = params.liberacaoNovilhasOverride?.[idx]
    if (ov !== undefined) return ov
    return coortes[Math.max(0, params.idadeLiberacao - 2)] ?? 0
  }

  // Pool inicial de novilhas — replica B12 da aba IA novilhas: + B3/2 (= libera_mês_1 / 2)
  let novilhasAptasPool = estado.novilhasVaziasAptas + estado.novilhasAtrasadas
    + liberaNoMes(0) / 2
    + estado.novilhasInseminadas_lt25 * (1 - tcInicialNovilhas)
    + estado.novilhasInseminadas_gt25 * (1 - params.pctPrenhesToque_Novilhas)

  // Fila de partos calculados (9 posições = 9 meses de gestação restantes)
  const filaPartosVacas: number[] = new Array(9).fill(0)
  const filaPartosNovilhas: number[] = new Array(9).fill(0)

  // Popula filas retroativamente com gestantes da agenda (mês 0 = mês atual, até +7)
  for (let _k = 0; _k <= 7; _k++) {
    const _d = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + _k, 1)
    const _keyFut = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}`
    const _partosAgenda = partosReaisMap.get(_keyFut)
    if (_partosAgenda) {
      filaPartosVacas[_k] += _partosAgenda.vacas
      filaPartosNovilhas[_k] += _partosAgenda.novilhas
    }
  }

  // Posição [8] = gestantes confirmadas do estado atual → partos ~9 meses à frente
  filaPartosVacas[8] += estado.vacasInseminadas_gt25 * tcInicialVacas
                      + estado.vacasInseminadas_lt25 * params.pctPrenhesToque_Vacas
  filaPartosNovilhas[8] += estado.novilhasInseminadas_gt25 * tcInicialNovilhas
                         + estado.novilhasInseminadas_lt25 * params.pctPrenhesToque_Novilhas

  // Taxas anuais → mensais via divisão simples (/12), idêntico à planilha Excel
  // Mês 1 usa parâmetros específicos (mortalidadeAdultaAnualMes1, descarteInvoluntarioAnualMes1)

  // PEV: aba IA usa partos -30d (= estado.partosUltimos30d) na transição B→C (i=1 do motor).
  // Para i>=2 usa totalPartos do iter ANTERIOR (= partos mês i-1 da projeção,
  // pula partos do mês 1 = abril, replicando o gap da planilha entre C e D da aba IA).
  let ultimoTotalPartos = 0

  let mesAtual = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() - 1, 1)
  let mesAnteriorVL = vacasLactacao // para calcular crescimento

  for (let i = 0; i < params.horizonteMeses; i++) {
    mesAtual = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1)
    const ano = mesAtual.getFullYear()
    const mesNum = mesAtual.getMonth() + 1
    const mesKey = `${ano}-${String(mesNum).padStart(2, '0')}`
    const diasMes = diasNoMes(ano, mesNum)

    // ─── 1. Partos do mês ──────────────────────────────────────────────────

    const dadosReais = partosReaisMap.get(mesKey)
    const usouDadosReais = !!dadosReais

    // Fila sempre avança, independente de usar agenda ou fila
    const filaPartosVacasFront = filaPartosVacas.shift() ?? 0
    filaPartosVacas.push(0)
    const filaPartosNovilhasFront = filaPartosNovilhas.shift() ?? 0
    filaPartosNovilhas.push(0)

    let partosVacas: number
    let partosNovilhas: number

    // Replica planilha (linhas 73/74):
    //   i=0..7  (C-J): GETPIVOTDATA agenda × (1-perdaPrenhez[i])
    //   i=8,9   (K,L): serviços históricos × (1-perdaPrenhezTotal) [vacas B15=0.20, novilhas B14=0.10]
    //   i>=10   (M+):  meta IA (filaPartos com pctSemPartoEfetivo)
    const PRIMEIRO_MES_SEM_AGENDA = 8 // i<8 → agenda Ideagri
    const perdaIdx = Math.min(i, params.perdasPrenhez_Vaca.length - 1)

    if (i < PRIMEIRO_MES_SEM_AGENDA) {
      // Agenda Ideagri × perda mês do parto
      partosVacas = (dadosReais?.vacas ?? 0) * (1 - params.perdasPrenhez_Vaca[perdaIdx])
      partosNovilhas = (dadosReais?.novilhas ?? 0) * (1 - params.perdasPrenhez_Novilha[perdaIdx])
    } else if (i - PRIMEIRO_MES_SEM_AGENDA < params.servicosRealizados_Vacas.length) {
      // Serviços históricos × perda total
      const idxServ = i - PRIMEIRO_MES_SEM_AGENDA
      const sV = params.servicosRealizados_Vacas[idxServ]
      const sN = params.servicosRealizados_Novilhas[idxServ] ?? { nServicos: 0, txConcepcao: 0.50 }
      partosVacas = sV.nServicos * sV.txConcepcao * (1 - params.perdaPrenhez_Total_Vaca)
      partosNovilhas = sN.nServicos * sN.txConcepcao * (1 - params.perdaPrenhez_Total_Novilha)
    } else {
      // Meta IA (fila × pctSemPartoEfetivo)
      partosVacas = filaPartosVacasFront * (1 - params.pctPrenhesSemPartoEfetivo_Vacas)
      partosNovilhas = filaPartosNovilhasFront * (1 - params.pctPrenhesSemPartoEfetivo_Novilhas)
    }

    const totalPartos = partosVacas + partosNovilhas

    // ─── 3-5. Mort/desc/secagem/VL/VS — RESOLVIDOS COM ITERAÇÃO INTERNA ────
    // Planilha tem refs circulares: D75/D77 = f(VL+VS atual), D72 = f(VL atual).
    // Excel resolve com cálc iterativo. Motor faz o mesmo com loop interno.

    const vlOld = vacasLactacao
    const vsOld = vacasSecas
    const mortAnualEste = i === 0 ? params.mortalidadeAdultaAnualMes1 : params.mortalidadeAdultaAnual
    const descarteBaseAnual = i === 0
      ? params.descarteInvoluntarioAnualMes1
      : (discOvr?.[i] !== undefined ? discOvr[i] : params.descarteInvoluntarioAnual)
    const pctSaindoLac = i < 8
      ? params.pctDescarteMorteSaindoLactacao_8meses
      : params.pctDescarteMorteSaindoLactacao_apos8m
    const secagensReais = secagensReaisMap.get(mesKey)
    const secagensPorProducao = secagensReais?.producao ?? 0

    // Base da secagem (não depende de VL — só do mês)
    let baseSecModo: 'csv' | 'formula'
    let baseSecValor = 0
    if (i < 6 && secagensReais?.rotina) {
      baseSecModo = 'csv'
      baseSecValor = secagensReais.rotina
    } else {
      baseSecModo = 'formula'
      const periodoMeses = Math.round(params.periodoSeco / 30)
      const PRIMEIRO_MES_SEM_AGENDA = 8
      const partoMesIdx = i + periodoMeses
      const servicosIdx = partoMesIdx - PRIMEIRO_MES_SEM_AGENDA
      if (servicosIdx >= 0
        && servicosIdx < params.servicosRealizados_Vacas.length
        && params.servicosRealizados_Vacas[servicosIdx].nServicos > 0) {
        const s = params.servicosRealizados_Vacas[servicosIdx]
        baseSecValor = s.nServicos * s.txConcepcao * (1 - params.perdaPrenhez_Total_Vaca)
      } else {
        const keyParto = (() => {
          const d = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + periodoMeses, 1)
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        })()
        const partosFuturos = partosReaisMap.get(keyParto)
        if (partosFuturos) {
          baseSecValor = partosFuturos.vacas
        } else {
          const idxFuturo = periodoMeses - 1
          const secagemPerdaIdx = Math.min(i + periodoMeses, params.perdasPrenhez_Vaca.length - 1)
          baseSecValor = idxFuturo < filaPartosVacas.length
            ? filaPartosVacas[idxFuturo] * (1 - params.perdasPrenhez_Vaca[secagemPerdaIdx])
            : 0
        }
      }
    }

    // Mês 1: usa o parâmetro mortalidadeAdultaAnualMes1 (% a.a. mês 1).
    // ANTES: hardcoded 1.2 (replicava Bela Vista C75 onde produtor digitou valor fixo).
    // AGORA: aplica a fórmula =(C31+C32+C33)*(C12/12) que é o padrão das planilhas
    // (Barreiro Alto e fazendas novas). Para Bela Vista bater exato com a planilha,
    // o usuário pode ajustar mortalidadeAdultaAnualMes1 = 1.2 × 12 / (VL+VS) ≈ 3.81%.

    let mortalidade = 0, mortalidadeVL = 0, mortalidadeVS = 0
    let descarteInv = 0, descarteVol = 0, descarteVL = 0, descarteVS = 0
    let totalSecagens = 0, secagensPorRotina = 0

    // Itera até convergir (8 iters bastam) — resolve refs circulares
    for (let it = 0; it < 8; it++) {
      const totalVacas = vacasLactacao + vacasSecas
      mortalidade = totalVacas * (mortAnualEste / 12)
      descarteInv = totalVacas * (descarteBaseAnual / 12)
      descarteVol = vacasLactacao * (params.descarteVoluntarioVL / 12)
      mortalidadeVL = mortalidade * pctSaindoLac
      mortalidadeVS = mortalidade - mortalidadeVL
      descarteVL = descarteInv * pctSaindoLac + descarteVol
      descarteVS = descarteInv - descarteInv * pctSaindoLac
      secagensPorRotina = baseSecModo === 'csv'
        ? baseSecValor
        : baseSecValor + params.fatorCorrecaoSecagem * vacasLactacao
      totalSecagens = secagensPorRotina + secagensPorProducao

      const vsPariu = Math.min(vsOld, partosVacas)
      const vlNew = Math.max(0,
        vlOld + vsPariu + partosNovilhas - totalSecagens - mortalidadeVL - descarteVL,
      )
      const vsNew = Math.max(0,
        vsOld - vsPariu + totalSecagens - mortalidadeVS - descarteVS,
      )
      if (Math.abs(vlNew - vacasLactacao) < 0.001 && Math.abs(vsNew - vacasSecas) < 0.001) {
        vacasLactacao = vlNew
        vacasSecas = vsNew
        break
      }
      vacasLactacao = vlNew
      vacasSecas = vsNew
    }

    // Compra/Venda
    if (cv) {
      const cvLac = cv.lac?.[i] ?? 0
      const cvSec = cv.sec?.[i] ?? 0
      const cvNov = cv.nov?.[i] ?? 0
      if (cvLac !== 0) vacasLactacao = Math.max(0, vacasLactacao + cvLac)
      if (cvSec !== 0) vacasSecas = Math.max(0, vacasSecas + cvSec)
      if (cvNov !== 0) novilhasAptasPool = Math.max(0, novilhasAptasPool + cvNov)
    }

    // ─── 6. Maternidade ────────────────────────────────────────────────────

    // Animais pré-parto: estimativa de 5 dias antes do parto
    const maternidade = totalPartos * (5 / diasMes)

    // ─── 7. Novas bezerras fêmeas ──────────────────────────────────────────

    const novasBezerras = totalPartos * params.pctFemeasNascidas * (1 - params.taxaAbortoNatimortos)

    // ─── 8. Avançar coortes jovens ────────────────────────────────────────
    // Liberação de novilhas é aplicada NA ATUALIZAÇÃO no final do iter (passo 10),
    // não no início — replica planilha (C3, D3, E3 entram na fórmula C12 = B12 - meta + C3).

    // Avança coortes — replica planilha (linha 57: coorte idadeAoParto-1 zera ao avançar)
    for (let j = coortes.length - 1; j > 0; j--) {
      if (j === params.idadeAoParto - 1) {
        coortes[j] = 0   // coorte (idadeAoParto)m sempre zera (animal pariu)
      } else {
        const mort = mortalidadeMensalJovem(params, j + 1, params.idadeAoParto)
        coortes[j] = coortes[j - 1] * (1 - mort)
      }
    }
    coortes[0] = novasBezerras

    // ─── 9. Reprodução — Vacas (fórmula C13 da planilha: aba meta de inseminação vacas) ──
    // META_IA = aptas × TS_mês × (30/21); META_PRENHEZ = META_IA × TC_mês
    // IMPORTANTE: aba IA começa em B = mês 2 da projeção. i=0 (abr) pula.

    const taxaConcVacas = taxaConcepcaoDoMes(params.taxaConcepcaoVacas, mesNum)
    const tsVacas = taxaConcepcaoDoMes(params.taxaServicoCacas, mesNum)
    const vacasAptasAntes = vacasAptasPool
    const metaIA_Vacas = vacasAptasAntes * Math.min(1, tsVacas * (30 / 21))

    const tsNovilhas = taxaConcepcaoDoMes(params.taxaServico_Novilhas, mesNum)
    const tcNovilhas = taxaConcepcaoDoMes(params.taxaConcepcao_Novilhas, mesNum)
    const novilhasAptasAntes = novilhasAptasPool
    const metaIA_Novilhas = novilhasAptasAntes * Math.min(1, tsNovilhas * (30 / 21))

    let novasPrenezes_Vacas = 0
    let novasPrenezes_Novilhas = 0

    if (i > 0) {
      // Vacas
      novasPrenezes_Vacas = metaIA_Vacas * taxaConcVacas
      filaPartosVacas[filaPartosVacas.length - 1] += novasPrenezes_Vacas

      // pev_source (replica planilha aba IA linha 4):
      //   i=1 (mai→jun, = C4): partos -30d × 0.91 = estado.partosUltimos30d × 0.91
      //   i>=2 (D4+): totalPartos do iter anterior × 0.91
      const pevSource = (i === 1) ? estado.partosUltimos30d : ultimoTotalPartos
      const pevArrivals = pevSource * params.pctVacasAptasAposParto
      vacasAptasPool = Math.max(0, vacasAptasPool - novasPrenezes_Vacas * params.manutencaoPrenhez_Vacas + pevArrivals)

      // Novilhas — atualização replica C12 = B12 - meta×0.90 + C3 (libera CHEIO no fim do iter)
      novasPrenezes_Novilhas = metaIA_Novilhas * tcNovilhas
      filaPartosNovilhas[filaPartosNovilhas.length - 1] += novasPrenezes_Novilhas
      // liberaNoMes(i) corresponde a C3 (i=1), D3 (i=2), ..., L3 (i=10), depois coorte natural
      const liberacaoProximo = liberaNoMes(i)
      novilhasAptasPool = Math.max(0, novilhasAptasPool - novasPrenezes_Novilhas * params.manutencaoPrenhez_Novilhas + liberacaoProximo)

      // Atualiza histórico de partos para próxima iter
      ultimoTotalPartos = totalPartos
    }

    // ─── 11. Novilhas prenhas ─────────────────────────────────────────────

    const novilhasPrenhas = filaPartosNovilhas.reduce((a, b) => a + b, 0)

    // ─── 12. Totais ───────────────────────────────────────────────────────

    const bezerras0_12m = coortes.slice(0, 12).reduce((a, b) => a + b, 0)
    const novilhas12_24m = coortes.slice(12, params.idadeAoParto).reduce((a, b) => a + b, 0)
    const totalAnimais = vacasLactacao + vacasSecas + bezerras0_12m + novilhas12_24m + novilhasPrenhas

    // ─── 13. Forragem ─────────────────────────────────────────────────────

    const bezerrasAleitamento = coortes.slice(0, 3).reduce((a, b) => a + b, 0)
    const bezerrasRecria = bezerras0_12m - bezerrasAleitamento

    function calcMS(consumo: typeof params.forragem.silagem.consumoPorCategoria): number {
      return (
        vacasLactacao * consumo.vacasLactacao +
        vacasSecas * consumo.vacasSecas +
        maternidade * consumo.maternidade +
        (bezerrasAleitamento + bezerrasRecria) * consumo.bezerras +
        novilhas12_24m * consumo.novilhas +
        novilhasPrenhas * consumo.novilhasPrenhas
      ) * diasMes / 1000
    }

    const msS = calcMS(params.forragem.silagem.consumoPorCategoria)
    const ms2 = calcMS(params.forragem.segundaForragem.consumoPorCategoria)
    const msA = calcMS(params.forragem.volumosoAdicional.consumoPorCategoria)

    const mnS = params.forragem.silagem.pctMS > 0 ? msS / params.forragem.silagem.pctMS : 0
    const mn2 = params.forragem.segundaForragem.pctMS > 0 ? ms2 / params.forragem.segundaForragem.pctMS : 0
    const mnA = params.forragem.volumosoAdicional.pctMS > 0 ? msA / params.forragem.volumosoAdicional.pctMS : 0

    const areaHa = params.forragem.silagem.produtividadeHa > 0
      ? msS / params.forragem.silagem.produtividadeHa
      : 0

    // ─── 14. Leite ───────────────────────────────────────────────────────

    const producaoLeiteDia = vacasLactacao * params.metaProducaoLDia
    const consumoBezerros = bezerrasAleitamento * params.consumoLeiteBezerros
    const leiteVendidoDia = Math.max(0, producaoLeiteDia - consumoBezerros)

    void mesAnteriorVL // suppress unused var warning
    mesAnteriorVL = vacasLactacao

    // ─── Montar resultado ─────────────────────────────────────────────────

    meses.push({
      mes: ultimoDiaMes(ano, mesNum),
      ano,
      mesNum,
      vacasLactacao,
      vacasSecas,
      maternidade,
      coortesJovens: [...coortes],
      bezerras0_12m,
      novilhas12_24m,
      novilhasPrenhas,
      totalAnimais,
      pctVL: (vacasLactacao + vacasSecas) > 0 ? vacasLactacao / (vacasLactacao + vacasSecas) : 0,
      partosVacas,
      partosNovilhas,
      secagens: totalSecagens,
      secagensPorRotina,
      secagensPorBaixaProducao: secagensPorProducao,
      mortalidadeAdulta: mortalidade,
      descarteInvoluntario: descarteInv,
      descarteVoluntario: descarteVol,
      novasBezerrasFemeas: novasBezerras,
      vacasAptasInseminacao: vacasAptasAntes,
      novilhasAptasInseminacao: novilhasAptasAntes,
      metaIA_Vacas,
      metaIA_Novilhas,
      novasPrenezes_Vacas,
      novasPrenezes_Novilhas,
      consumoMS_Silagem: msS,
      consumoMN_Silagem: mnS,
      consumoMS_Segunda: ms2,
      consumoMN_Segunda: mn2,
      consumoMS_Adicional: msA,
      consumoMN_Adicional: mnA,
      areaNecessariaHa: areaHa,
      producaoLeiteDia,
      leiteVendidoDia,
      usouDadosReais,
    })
  }

  return { meses, resumoAnual: calcularResumoAnual(meses) }
}

// ─── Resumo Anual ─────────────────────────────────────────────────────────────

function calcularResumoAnual(meses: MesProjetado[]): ResumoAnual[] {
  const porAno = new Map<number, MesProjetado[]>()
  for (const m of meses) {
    const arr = porAno.get(m.ano) ?? []
    arr.push(m)
    porAno.set(m.ano, arr)
  }

  const anos = [...porAno.keys()].sort()
  const resumos: ResumoAnual[] = []

  for (let idx = 0; idx < anos.length; idx++) {
    const ano = anos[idx]
    const ms = porAno.get(ano)!
    const n = ms.length

    const avg = (fn: (m: MesProjetado) => number) => ms.reduce((a, m) => a + fn(m), 0) / n
    const sum = (fn: (m: MesProjetado) => number) => ms.reduce((a, m) => a + fn(m), 0)

    const mediaVL = avg(m => m.vacasLactacao)
    const prevMediaVL = idx > 0 ? resumos[idx - 1].mediaVL : null
    const crescYoY = prevMediaVL ? (mediaVL - prevMediaVL) / prevMediaVL : null

    resumos.push({
      ano,
      mediaVL,
      mediaVS: avg(m => m.vacasSecas),
      pctVL: avg(m => m.pctVL),
      crescimentoYoY: crescYoY,
      partosVacas: sum(m => m.partosVacas),
      partosNovilhas: sum(m => m.partosNovilhas),
      relacaoPartosVacas: mediaVL > 0 ? sum(m => m.partosVacas + m.partosNovilhas) / mediaVL : 0,
      descarteInvoluntario: sum(m => m.descarteInvoluntario),
      mortalidadeAdulta: sum(m => m.mortalidadeAdulta),
      reposicaoNecessaria: sum(m => m.descarteInvoluntario + m.mortalidadeAdulta),
      producaoLeiteDia: avg(m => m.producaoLeiteDia),
      leiteVendidoDia: avg(m => m.leiteVendidoDia),
      mediaAleitamento: avg(m => m.coortesJovens.slice(0, 3).reduce((a, b) => a + b, 0)),
      mediaRecria: avg(m => m.bezerras0_12m),
      mediaNovilhas: avg(m => m.novilhas12_24m),
      mediaNovilhasPrenhas: avg(m => m.novilhasPrenhas),
    })
  }

  return resumos
}
