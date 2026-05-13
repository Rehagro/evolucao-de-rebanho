// ─── Parâmetros Zootécnicos ───────────────────────────────────────────────────

export interface TaxaConcepcaoMensal {
  jan: number; fev: number; mar: number; abr: number;
  mai: number; jun: number; jul: number; ago: number;
  set: number; out: number; nov: number; dez: number;
}

export interface ParametrosForragem {
  silagem: ForragemTipo;
  segundaForragem: ForragemTipo;
  volumosoAdicional: ForragemTipo;
}

export interface ForragemTipo {
  nome: string;
  consumoPorCategoria: ConsumoPorCategoria; // kg MS/dia
  pctMS: number;    // % matéria seca (0–1)
  pctPerda: number; // % perda (0–1)
  produtividadeHa: number; // ton MS/ha
  estoqueAtual: number;    // ton MN
}

export interface ConsumoPorCategoria {
  vacasLactacao: number;
  vacasSecas: number;
  maternidade: number;
  bezerras: number;
  novilhas: number;
  novilhasPrenhas: number;
}

export interface Parametros {
  // Reprodução — Vacas
  taxaServicoCacas: TaxaConcepcaoMensal;      // linha 9 aba meta IA vacas — varia por mês
  taxaConcepcaoVacas: TaxaConcepcaoMensal;    // linha 11 aba meta IA vacas — varia por mês
  manutencaoPrenhez_Vacas: number;            // E7 = 0.95 — célula cinza aba meta IA vacas
  pev: 30 | 60;                               // dias
  pctVacasAptasAposParto: number;             // 0.91
  pctPrenhesToque_Vacas: number;              // 0.40
  pctPrenhesSemPartoEfetivo_Vacas: number;    // 0.26

  // Reprodução — Novilhas
  taxaServico_Novilhas: TaxaConcepcaoMensal;  // linha 8 aba meta IA novilhas — varia por mês
  taxaConcepcao_Novilhas: TaxaConcepcaoMensal; // linha 10 aba meta IA novilhas — varia por mês
  manutencaoPrenhez_Novilhas: number;          // E6 = 0.90 — célula cinza aba meta IA novilhas
  pctPrenhesToque_Novilhas: number;           // 0.60
  pctPrenhesSemPartoEfetivo_Novilhas: number; // 0.12
  idadeAoParto: 24 | 26 | 28 | 30 | 32 | 36; // meses — alvo de primeiro parto
  idadeLiberacao: number;                     // meses — idade de entrada no programa reprodutivo

  // Override manual da liberação de novilhas por mês (chave = índice 0..10 → meses +1 a +11).
  // Quando definido, sobrescreve o cálculo do motor naquele mês.
  // Análogo a Param!B67-L67 da planilha, mas calculado automaticamente pelo motor a partir do CSV.
  liberacaoNovilhasOverride?: Record<number, number>;

  // Perdas de prenhez por mês do parto (9 posições: mês 1 = parto iminente, mês 9 = início da gestação)
  // Vacas — linha 11 da aba Parâmetros (B11:J11)
  perdasPrenhez_Vaca: number[];              // [0.02,0.04,0.06,0.08,0.10,0.12,0.12,0.16,0.20]
  // Novilhas — linha 10 da aba Parâmetros (B10:J10)
  perdasPrenhez_Novilha: number[];           // [0.02,0.02,0.06,0.06,0.06,0.06,0.06,0.08,0.10]

  // Manejo
  periodoSeco: number;                         // dias (ex: 45, 60, 90)
  fatorCorrecaoSecagem: number;                // ex: 0.003 — corrige secagem estimada (× VL do mês)
  servicosRealizados_Vacas: { nServicos: number; txConcepcao: number }[]; // IA histórica para partos sem agenda (Param!B34/C34)
  servicosRealizados_Novilhas: { nServicos: number; txConcepcao: number }[]; // Param!B28/C28
  perdaPrenhez_Total_Vaca: number;             // 0.20 — perda total da confirmação ao parto (Param!B15)
  perdaPrenhez_Total_Novilha: number;          // 0.10 — perda total novilha (Param!B14)
  taxaAbortoNatimortos: number;               // 0.14
  pctFemeasNascidas: number;                  // 0.62
  descarteInvoluntarioAnual: number;          // 0.20
  descarteInvoluntarioAnualMes1: number;      // 0.00 — descarte no 1º mês projetado (já realizado)
  descarteVoluntarioVL: number;               // 0 (configurável)
  mortalidadeAdultaAnual: number;             // 0.05
  mortalidadeAdultaAnualMes1: number;         // 0.04 — mortalidade no 1º mês projetado
  pctDescarteMorteSaindoLactacao_8meses: number;   // 0.70
  pctDescarteMorteSaindoLactacao_apos8m: number;   // 0.87
  declinioProdMensal: number;                 // L/mês, ex: 0.8 (Param!A37)
  limiteProducaoSecagem: number;              // kg/dia, ex: 10 (Param!A38)
  // Data de referência para cálculo de secagem por baixa produção (Param!A39 da planilha).
  // A partir dessa data, o motor itera 5 meses (1m, 2m, ..., 5m) checando se a produção
  // estimada de cada vaca cai abaixo de `limiteProducaoSecagem`.
  // Default: ~30 dias após dataReferencia (= 05/05 quando DATA_REF=31/03).
  dataReferenciaSecagem?: Date;

  // Mortalidade jovens por faixa (por mês da coorte)
  mortalidade_0_3m: number;   // 0.03
  mortalidade_3_6m: number;   // 0.01
  mortalidade_6_9m: number;   // 0.02
  mortalidade_9_12m: number;  // 0.01
  mortalidade_12_26m: number; // 0.02

  // Forragem
  forragem: ParametrosForragem;

  // Produção de leite (para cálculo de receita estimada)
  metaProducaoLDia: number; // L/vaca/dia (configurável por ano)
  consumoLeiteBezerros: number; // L/dia por bezerra em aleitamento

  // Horizonte de projeção
  horizonteMeses: 12 | 24 | 36 | 48 | 60 | 84;
}

// ─── Estado Atual do Rebanho ──────────────────────────────────────────────────

export interface EstadoAtualRebanho {
  vacasLactacao: number;
  vacasSecas: number;
  bezerrasMenores180d: number;
  bezerrasNovilhas180dAteAptas: number;
  vacasVaziasAptas: number;
  vacasAtrasadas: number;
  vacasInseminadas_lt25: number;
  vacasInseminadas_gt25: number;
  novilhasVaziasAptas: number;
  novilhasAtrasadas: number;
  novilhasInseminadas_lt25: number;
  novilhasInseminadas_gt25: number;
  partosUltimos30d: number;
  partos31a60d: number;
}

// ─── Dados Importados dos CSVs ────────────────────────────────────────────────

export type SitRep = 'Ges.' | 'Ins.' | 'Vaz. pev' | 'Vaz. atr.' | 'Vaz. apt.';

export interface VacaSecagem {
  nAnimal: number;
  dtSecPrev: Date | null;
  dtUltLeite: Date | null;
  sitPro: string;
  sitRep: SitRep;
  ultCL_kg: number | null;
  dtSecagemPorProducao?: Date | null;
  dtSecagemFinal?: Date | null;
}

export interface PartoPrevisto {
  nMatriz: number;
  partoPrevisto: Date;
  faltamDias: number;
  op: number;           // ordem de parto
  sp: 'L' | 'S' | null; // situação produtiva (null = novilha)
  reprodRaca: string | null;
  isNovilha: boolean;   // op === 1
}

export interface AnimalCrescimento {
  nAnimal: number;
  idadeDias: number;
  idadeMeses: number;
  faixaEtaria: FaixaEtaria;
  categoria: 'Em crescimento' | 'Novilha' | string;
}

export type FaixaEtaria =
  | '0-3m' | '3-6m' | '6-9m' | '9-12m'
  | '12-18m' | '18-24m' | 'apta';

export interface RebanhoAtual {
  dataReferencia: Date;
  vacasSecagem: VacaSecagem[];
  partosPrevistos: PartoPrevisto[];
  animaisCrescimento: AnimalCrescimento[];
}

// ─── Motor de Projeção ────────────────────────────────────────────────────────

export interface MesProjetado {
  mes: Date; // último dia do mês
  ano: number;
  mesNum: number; // 1–12

  // Categorias principais
  vacasLactacao: number;
  vacasSecas: number;
  maternidade: number;

  // Coortes jovens individuais (índice = meses de vida, 1–idadeAoParto)
  coortesJovens: number[]; // coortesJovens[0] = 1 mês, [1] = 2 meses, etc.
  bezerras0_12m: number;   // soma coortes 1–12m
  novilhas12_24m: number;  // soma coortes 13–24m (ou até idadeAoParto)
  novilhasPrenhas: number;

  totalAnimais: number;
  pctVL: number; // VL / (VL + VS)

  // Fluxos do mês
  partosVacas: number;
  partosNovilhas: number;
  secagens: number;
  secagensPorRotina: number;
  secagensPorBaixaProducao: number;
  mortalidadeAdulta: number;
  descarteInvoluntario: number;
  descarteVoluntario: number;
  novasBezerrasFemeas: number;

  // Reprodução
  vacasAptasInseminacao: number;
  novilhasAptasInseminacao: number;
  metaIA_Vacas: number;
  metaIA_Novilhas: number;
  novasPrenezes_Vacas: number;
  novasPrenezes_Novilhas: number;

  // Forragem
  consumoMS_Silagem: number;   // ton MS/mês
  consumoMN_Silagem: number;
  consumoMS_Segunda: number;
  consumoMN_Segunda: number;
  consumoMS_Adicional: number;
  consumoMN_Adicional: number;
  areaNecessariaHa: number;

  // Produção de leite
  producaoLeiteDia: number;
  leiteVendidoDia: number;

  usouDadosReais: boolean; // true = partos vieram da agenda Ideagri
}

export interface ResultadoProjecao {
  meses: MesProjetado[];
  resumoAnual: ResumoAnual[];
}

export interface ResumoAnual {
  ano: number;
  mediaVL: number;
  mediaVS: number;
  pctVL: number;
  crescimentoYoY: number | null;
  partosVacas: number;
  partosNovilhas: number;
  relacaoPartosVacas: number;
  descarteInvoluntario: number;
  mortalidadeAdulta: number;
  reposicaoNecessaria: number;
  producaoLeiteDia: number;
  leiteVendidoDia: number;
  mediaAleitamento: number;
  mediaRecria: number;
  mediaNovilhas: number;
  mediaNovilhasPrenhas: number;
}

// ─── Cenário ──────────────────────────────────────────────────────────────────

export interface Cenario {
  id: string;
  /** Nome auto-gerado no envio (ex: "13/05 14:32"). */
  nome: string;
  parametros: Parametros;
  /** Snapshot do estado atual do rebanho no momento do envio (opcional para compat). */
  estadoAtual?: EstadoAtualRebanho;
  /** Snapshot dos overrides do gráfico (descarte mensal e compra/venda). */
  discOvr?: Record<number, number>;
  cv?: { lac: Record<number, number>; sec: Record<number, number>; nov: Record<number, number> };
  projecao?: ResultadoProjecao;
  criadoEm: string;
}

// ─── Previsto × Realizado ─────────────────────────────────────────────────────

export interface PrevistoRealizado {
  mesReferencia: string; // 'YYYY-MM'
  vlReal: number | null;
  partosVacasReal: number | null;
  partosNovilhasReal: number | null;
  secagensReal: number | null;
  mortalidadeAdultaReal: number | null;
  descarteInvoluntarioReal: number | null;
}

// ─── Fazenda ──────────────────────────────────────────────────────────────────

export interface Fazenda {
  id: string;
  nome: string;
  dataCriacao: string;       // ISO string
  dataUltimoUpload: string | null;
  parametros: Parametros;
  rebanhoAtual: RebanhoAtual | null;
  estadoAtual: EstadoAtualRebanho;
  /** Cenário A — 1º snapshot enviado do rascunho. */
  cenarioA?: Cenario | null;
  /** Cenário B — 2º snapshot enviado do rascunho. */
  cenarioB: Cenario | null;
  previstoRealizado: PrevistoRealizado[];
  /** Logo da fazenda em data URL (base64). Opcional — usado no relatório PDF. */
  logoBase64?: string | null;
}
