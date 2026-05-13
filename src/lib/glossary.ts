/**
 * Glossário canônico dos termos da UI.
 * Espelho TS do `app/docs/GLOSSARY.md`. Atualizar manualmente quando o MD mudar.
 *
 * Cada entrada tem:
 * - `nome`: a sigla/termo (ex: "VL", "%VL", "PEV")
 * - `curta`: definição objetiva (1-2 frases) — usada no tooltip
 * - `extensa` (opcional): explicação mais completa — usada em modal "Saber mais"
 *
 * O componente `<InfoTooltip term="VL">` lê deste arquivo.
 */

export interface GlossaryEntry {
  nome: string
  curta: string
  extensa?: string
}

export const GLOSSARY = {
  /* ─── Categorias do rebanho ──────────────────────────────────── */
  VL: {
    nome: 'VL',
    curta: 'Vacas em lactação.',
  },
  VS: {
    nome: 'VS',
    curta: 'Vacas secas — no período seco antes do próximo parto.',
  },
  PCT_VL: {
    nome: '%VL',
    curta: 'VL / (VL + VS). Indicador-chave de eficiência reprodutiva.',
  },
  BEZERRAS_0_12: {
    nome: 'Bezerras 0–12m',
    curta: 'Animais fêmeas até 12 meses.',
  },
  BEZERRAS_12_23: {
    nome: 'Bezerras 12–23m',
    curta: 'Fêmeas entre 12 e 23 meses, antes da idade de liberação.',
  },
  NOVILHAS_PRENHAS: {
    nome: 'Novilhas prenhas',
    curta: 'Novilhas confirmadas gestantes, aguardando 1º parto. Saem da categoria ao parir e viram VL.',
  },
  REBANHO_TOTAL: {
    nome: 'Rebanho total',
    curta: 'VL + VS + bezerras 0–12 + bezerras 12–23 + novilhas prenhas.',
  },

  /* ─── Reprodução ──────────────────────────────────────────────── */
  PEV: {
    nome: 'PEV',
    curta: 'Período de espera voluntário. Dias após o parto antes de liberar para inseminação.',
    extensa: 'Vacas dentro do PEV não entram em "aptas" — estão em recuperação pós-parto. O técnico define a duração (30 ou 60 dias é típico).',
  },
  APTA: {
    nome: 'Apta',
    curta: 'Vaca ou novilha vazia, fora do PEV, pronta para inseminação.',
  },
  ATRASADA: {
    nome: 'Atrasada',
    curta: 'Apta há mais de 1 ciclo sem confirmar prenhez.',
  },
  TC: {
    nome: 'TC',
    curta: 'Taxa de concepção. Prenhezes confirmadas ÷ inseminações realizadas.',
  },
  TS: {
    nome: 'TS',
    curta: 'Taxa de serviço. Fração mensal de aptas que recebem ao menos um serviço.',
  },
  IA: {
    nome: 'IA',
    curta: 'Inseminação artificial.',
  },
  META_IA: {
    nome: 'Meta IA',
    curta: 'aptas × TS × (30/21). Projeção de inseminações no mês.',
    extensa: 'O fator 30/21 converte o ciclo estral (21 dias) em mês civil (30 dias). Resulta em quantos serviços, em média, cabem no mês.',
  },
  META_PRENHEZ: {
    nome: 'Meta de prenhez',
    curta: 'Meta IA × TC. Entrada na fila de gestação que gera partos 9 meses depois.',
  },
  MANUTENCAO_PRENHEZ: {
    nome: 'Manutenção de prenhez',
    curta: 'Fração mensal de gestações que se mantêm. As que perdem voltam ao pool de aptas no mês seguinte.',
    extensa: 'Aplicada como decay sobre o estoque de prenhas a cada mês. Diferente de "perda de prenhez total" (fator único aplicado aos serviços históricos).',
  },
  PERDA_PRENHEZ_TOTAL: {
    nome: 'Perda de prenhez total',
    curta: 'Perda acumulada do diagnóstico positivo até o parto. Usada apenas em partos previstos de serviços históricos.',
  },
  PERDAS_PRENHEZ_MES_PARTO: {
    nome: 'Perdas de prenhez por mês do parto',
    curta: 'Fração de gestações que não geram partos efetivos, indexada pelo mês do parto previsto. Mês 1 = parto iminente (perda mínima); Mês 9 = início da gestação (perda máxima).',
  },
  ABORTO_NATIMORTO: {
    nome: 'Aborto / natimorto',
    curta: 'Fração de gestações que terminam sem bezerro vivo. nascimentos = partos × %fêmeas × (1 − aborto).',
  },
  IDADE_AO_PARTO: {
    nome: 'Idade ao parto',
    curta: 'Idade média do 1º parto de novilhas (meses). Define quando uma novilha prenha vira VL.',
  },
  IDADE_LIBERACAO: {
    nome: 'Idade de liberação',
    curta: 'Idade em que a novilha entra no pool de aptas reprodutivas. Animais mais novos aguardam crescimento.',
  },

  /* ─── Manejo e secagem ───────────────────────────────────────── */
  PERIODO_SECO: {
    nome: 'Período seco',
    curta: 'Dias entre secagem e parto. Vacas iniciam o período seco quando faltam X dias para o parto previsto.',
  },
  COORTE: {
    nome: 'Coorte',
    curta: 'Grupo de animais por idade em meses. O motor mantém 28 coortes (1m a 28m). A cada mês todas avançam uma posição.',
  },
  LIBERACAO_NOVILHA: {
    nome: 'Liberação de novilha',
    curta: 'Saída da coorte de crescimento para o pool de aptas reprodutivas.',
  },
  DECLINIO_PRODUCAO: {
    nome: 'Declínio mensal de produção',
    curta: 'Litros/dia que a produção cai por mês ao longo da lactação. Usado para projetar quando a vaca atinge o limite de secagem por baixa produção.',
  },
  LIMITE_SECAGEM: {
    nome: 'Limite de produção para secagem',
    curta: 'Litros/dia mínimo abaixo do qual a vaca é secada antes do período programado.',
  },
  SECAGEM_ROTINA: {
    nome: 'Secagem por rotina',
    curta: 'Secagem programada pela proximidade do parto (= período seco antes do parto previsto).',
  },
  SECAGEM_BAIXA: {
    nome: 'Secagem por baixa produção',
    curta: 'Secagem antecipada quando a produção projetada cai abaixo do limite.',
    extensa: 'O motor projeta a produção 5 meses à frente da data de referência aplicando o declínio mensal. Se em algum desses meses a produção cair abaixo do limite, a vaca é secada antes. Vacas em "Vaz. pev" são puladas.',
  },
  FATOR_CORRECAO_SECAGEM: {
    nome: 'Fator de correção (× VL)',
    curta: 'Fator adicional aplicado sobre VL para corrigir secagens estimadas a partir do mês 7 da projeção.',
  },

  /* ─── Saídas do rebanho ──────────────────────────────────────── */
  DESCARTE_INV: {
    nome: 'Descarte involuntário',
    curta: 'Vacas que saem por razões fora do controle (problemas reprodutivos, sanitários). Taxa anual distribuída entre VL e VS.',
  },
  DESCARTE_VOL: {
    nome: 'Descarte voluntário',
    curta: 'Vacas removidas por escolha (baixa produção, baixo valor genético). Aplicado apenas a VL.',
  },
  MORTALIDADE_ADULTA: {
    nome: 'Mortalidade adulta',
    curta: 'Mortes em vacas (VL + VS) no ano. Distribuída entre VL e VS conforme a fração que sai de lactação.',
  },
  MORTALIDADE_JOVEM: {
    nome: 'Mortalidade jovem',
    curta: 'Mortes em bezerras e novilhas, definida em faixas (0–3m, 3–6m, 6–9m, 9–12m, 12–26m). Taxas são acumuladas ao longo da faixa.',
  },
  PCT_SAINDO_LACTACAO: {
    nome: '% saindo de lactação',
    curta: 'Fração das saídas (descarte + morte) que sai de VL — o complemento sai de VS.',
  },

  /* ─── Calibração de vacas/novilhas (Onda 4) ──────────────────── */
  PCT_VACAS_APTAS_POS_PARTO: {
    nome: '% vacas aptas pós-parto',
    curta: 'Fração das vacas que entram em "aptas" após sair do PEV. O restante segue em descarte/perda.',
  },
  PCT_PRENHES_TOQUE: {
    nome: '% prenhas no toque (DG)',
    curta: 'Fração de inseminações que confirmam prenhez no diagnóstico de gestação. Diferente de TC, que mede concepção inicial.',
  },
  PCT_PRENHES_SEM_PARTO: {
    nome: '% prenhezes sem parto efetivo',
    curta: 'Fração de gestações confirmadas no DG que não geram parto vivo (somatório de aborto + natimorto + outras perdas).',
  },
  META_PRODUCAO: {
    nome: 'Meta de produção',
    curta: 'L/vaca/dia esperado para o cálculo de receita estimada e secagem por baixa produção.',
  },
  CONSUMO_BEZERROS: {
    nome: 'Consumo de bezerros',
    curta: 'L/dia por bezerra em aleitamento. Subtraído do leite produzido para chegar ao leite vendido.',
  },

  /* ─── Indicadores do Dashboard (Onda 2) ──────────────────────── */
  KPI_PCT_VL_MEDIO: {
    nome: '%VL médio',
    curta: 'Média mensal de VL ÷ (VL + VS) no horizonte filtrado.',
  },
  KPI_PARTOS: {
    nome: 'Partos totais / Partos de vacas',
    curta: '(partos de vacas + partos de novilhas) ÷ partos de vacas no horizonte filtrado. Valores ≥ 100% indicam reposição via novilhas; sub-info mostra os absolutos.',
  },
  KPI_MEDIA_VL: {
    nome: 'Média VL',
    curta: 'Média mensal de vacas em lactação no horizonte filtrado.',
  },
  KPI_REBANHO: {
    nome: 'Vacas / Rebanho',
    curta: '(VL + VS) ÷ (VL + VS + bezerras 0–12 + bezerras 12–23 + novilhas prenhas) no último mês do horizonte.',
  },
  KPI_CRESCIMENTO: {
    nome: 'Crescimento',
    curta: '(VL+VS último − VL+VS primeiro) ÷ VL+VS primeiro × 100, no horizonte filtrado.',
  },

  /* ─── Termos de processo (UI) ────────────────────────────────── */
  PROJECAO: {
    nome: 'Projeção',
    curta: 'Resultado calculado mês a mês pelo motor. Primeiros meses usam dados reais (agenda Ideagri); demais entram no regime de meta-IA.',
  },
  RASCUNHO: {
    nome: 'Rascunho',
    curta: 'Edições em memória ainda não salvas nem enviadas para comparativo. Persiste durante a sessão, é descartado ao fechar.',
  },
  CENARIO: {
    nome: 'Cenário',
    curta: 'Snapshot fixo de parâmetros enviado do rascunho. Não atualiza sozinho — apenas se reenviado.',
  },
} as const satisfies Record<string, GlossaryEntry>

export type GlossaryTerm = keyof typeof GLOSSARY
