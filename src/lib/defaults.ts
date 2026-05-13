import type { Parametros, EstadoAtualRebanho } from '@/types'

export const DEFAULT_PARAMETROS: Parametros = {
  taxaServicoCacas: {
    jan: 0.65, fev: 0.65, mar: 0.65, abr: 0.65,
    mai: 0.65, jun: 0.65, jul: 0.65, ago: 0.65,
    set: 0.65, out: 0.65, nov: 0.65, dez: 0.65,
  },
  taxaConcepcaoVacas: {
    jan: 0.34, fev: 0.34, mar: 0.36, abr: 0.42,
    mai: 0.44, jun: 0.44, jul: 0.44, ago: 0.44,
    set: 0.44, out: 0.42, nov: 0.38, dez: 0.38,
  },
  manutencaoPrenhez_Vacas: 0.95,
  pev: 60,
  pctVacasAptasAposParto: 0.91,
  pctPrenhesToque_Vacas: 0.40,
  pctPrenhesSemPartoEfetivo_Vacas: 0.26,

  taxaServico_Novilhas: {
    jan: 0.60, fev: 0.60, mar: 0.60, abr: 0.60,
    mai: 0.60, jun: 0.60, jul: 0.60, ago: 0.60,
    set: 0.60, out: 0.60, nov: 0.60, dez: 0.60,
  },
  taxaConcepcao_Novilhas: {
    jan: 0.50, fev: 0.50, mar: 0.50, abr: 0.50,
    mai: 0.50, jun: 0.50, jul: 0.50, ago: 0.50,
    set: 0.50, out: 0.50, nov: 0.50, dez: 0.50,
  },
  manutencaoPrenhez_Novilhas: 0.90,
  pctPrenhesToque_Novilhas: 0.60,
  pctPrenhesSemPartoEfetivo_Novilhas: 0.12,
  idadeAoParto: 24,
  idadeLiberacao: 13,

  // Perdas de prenhez por mês do parto (planilha aba Parâmetros linhas 10 e 11)
  // Índice 0 = animais parindo no mês 1 da projeção (risco mínimo, parto iminente)
  // Índice 8 = animais parindo no mês 9 (risco máximo, início da gestação)
  perdasPrenhez_Vaca: [0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.12, 0.16, 0.20],
  perdasPrenhez_Novilha: [0.02, 0.02, 0.06, 0.06, 0.06, 0.06, 0.06, 0.08, 0.10],

  periodoSeco: 60,
  fatorCorrecaoSecagem: 0.003,
  servicosRealizados_Vacas: [
    { nServicos: 0, txConcepcao: 0.40 },
    { nServicos: 0, txConcepcao: 0.40 },
  ],
  servicosRealizados_Novilhas: [
    { nServicos: 0, txConcepcao: 0.50 },
    { nServicos: 0, txConcepcao: 0.50 },
  ],
  perdaPrenhez_Total_Vaca: 0.20,
  perdaPrenhez_Total_Novilha: 0.10,
  taxaAbortoNatimortos: 0.14,
  pctFemeasNascidas: 0.62,
  descarteInvoluntarioAnual: 0.20,
  descarteInvoluntarioAnualMes1: 0.00,
  descarteVoluntarioVL: 0,
  mortalidadeAdultaAnual: 0.05,
  mortalidadeAdultaAnualMes1: 0.04,
  pctDescarteMorteSaindoLactacao_8meses: 0.70,
  pctDescarteMorteSaindoLactacao_apos8m: 0.87,
  declinioProdMensal: 0.8,
  limiteProducaoSecagem: 10,

  mortalidade_0_3m: 0.03,
  mortalidade_3_6m: 0.01,
  mortalidade_6_9m: 0.02,
  mortalidade_9_12m: 0.01,
  mortalidade_12_26m: 0.02,

  forragem: {
    silagem: {
      nome: 'Silagem de milho',
      consumoPorCategoria: {
        vacasLactacao: 12.5,
        vacasSecas: 0,
        maternidade: 10,
        bezerras: 4,
        novilhas: 0,
        novilhasPrenhas: 0,
      },
      pctMS: 0.34,
      pctPerda: 0.15,
      produtividadeHa: 50,
      estoqueAtual: 0,
    },
    segundaForragem: {
      nome: 'Segunda forragem',
      consumoPorCategoria: {
        vacasLactacao: 0,
        vacasSecas: 0,
        maternidade: 0,
        bezerras: 0,
        novilhas: 0,
        novilhasPrenhas: 0,
      },
      pctMS: 0.28,
      pctPerda: 0.15,
      produtividadeHa: 100,
      estoqueAtual: 0,
    },
    volumosoAdicional: {
      nome: 'Volumoso adicional',
      consumoPorCategoria: {
        vacasLactacao: 0,
        vacasSecas: 0,
        maternidade: 0,
        bezerras: 0,
        novilhas: 0,
        novilhasPrenhas: 0,
      },
      pctMS: 1.0,
      pctPerda: 0,
      produtividadeHa: 0,
      estoqueAtual: 0,
    },
  },

  metaProducaoLDia: 27,
  consumoLeiteBezerros: 5,
  horizonteMeses: 24,
}

export const DEFAULT_ESTADO_ATUAL: EstadoAtualRebanho = {
  vacasLactacao: 0,
  vacasSecas: 0,
  bezerrasMenores180d: 0,
  bezerrasNovilhas180dAteAptas: 0,
  vacasVaziasAptas: 0,
  vacasAtrasadas: 0,
  vacasInseminadas_lt25: 0,
  vacasInseminadas_gt25: 0,
  novilhasVaziasAptas: 0,
  novilhasAtrasadas: 0,
  novilhasInseminadas_lt25: 0,
  novilhasInseminadas_gt25: 0,
  partosUltimos30d: 0,
  partos31a60d: 0,
}
