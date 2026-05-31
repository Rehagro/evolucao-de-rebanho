/**
 * Conteúdo canônico do FAQ (aba "Ajuda" do Dashboard).
 *
 * ESTA é a fonte viva do conteúdo — editável sem tocar no layout.
 * Transcreve `docs/faq-conteudo.md` aplicando as correções acordadas:
 *  - sem valores fixos de fazenda: onde o texto citava números que na verdade
 *    são campos editáveis (% saindo da lactação 0–8m/8m+, período seco), o texto
 *    passa a apontar o campo ajustável em vez de cravar o número;
 *  - o âncora de tempo é o campo "Mês de início da projeção" (não a data do upload);
 *  - "onde fica o campo" reflete o app atual (ver comentários por pergunta).
 *
 * Mecânica conferida contra `src/engine/projecao.ts`. Termos seguem `glossary.ts`.
 * Cada resposta segue o padrão de 3 blocos (spec §3):
 *   respostaCurta (falar ao produtor) → mecanica (o porquê) → oQueChecar (na ferramenta).
 */

export type FaqCaminho = 'justificativa' | 'preenchimento'

export interface FaqPergunta {
  id: string
  caminho: FaqCaminho
  secao: string
  pergunta: string
  /** Bloco 1 — uma a duas frases para falar ao produtor. */
  respostaCurta: string
  /** Bloco 2 — a mecânica do motor em linguagem de campo. */
  mecanica: string
  /** Bloco 3 — onde olhar na ferramenta para confirmar. */
  oQueChecar: string[]
  /** Slugs de tag (renderizados com "#"). Conjunto canônico em TAGS_CANONICAS. */
  tags: string[]
  /** Prompt de ajuda contextual — reservado para evolução futura (sem botão hoje). */
  verEmDetalhe?: string
}

/** Conjunto canônico de tags (spec §2 + #partos). */
export const TAGS_CANONICAS = [
  'vacas-lactação',
  'secagem',
  'prenhez',
  'partos',
  'novilhas',
  'mortalidade',
  'reprodução',
  'forragem',
] as const

export const CAMINHO_META: Record<FaqCaminho, { titulo: string; descricao: string; sublabel: string }> = {
  justificativa: {
    titulo: 'Como explico esse resultado?',
    descricao: 'Por que o gráfico se comporta assim, para falar ao produtor.',
    sublabel: 'Como explico esse resultado · leitura do gráfico',
  },
  preenchimento: {
    titulo: 'Como preencho?',
    descricao: 'O que cada Indicador e Parâmetro faz na projeção.',
    sublabel: 'Como preencho · Indicadores e Parâmetros',
  },
}

export const FAQ: FaqPergunta[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // CAMINHO A — "Como explico esse resultado?" (justificativa)
  // ─────────────────────────────────────────────────────────────────────────

  // Seção: Vacas em lactação (VL)
  {
    id: 'vl-queda-mensal',
    caminho: 'justificativa',
    secao: 'Vacas em lactação (VL)',
    pergunta: 'Por que as vacas em lactação caem em alguns meses?',
    respostaCurta:
      'Naquele mês saíram mais vacas da lactação (secagens para o período seco, mais mortes e descartes) do que entraram por parto. É um vale de calendário, não um erro do sistema.',
    mecanica:
      'A cada mês o número de vacas em lactação é um saldo. Entram as vacas que pariram no mês e as novilhas de primeiro parto. Saem as vacas que secaram (entram no período seco antes do próximo parto), mais a parcela de mortes e descartes que estava em lactação. Quando os partos previstos do mês são poucos e, ao mesmo tempo, há muitas gestantes secando pouco antes de parir (definido pelo período seco), o saldo do mês fica negativo e a curva desce. Há ainda um detalhe que acentua quedas no meio/fim do horizonte: a partir do 8º mês de projeção o modelo passa a debitar uma fatia maior das mortes e descartes sobre as vacas em lactação — essa fatia é o que você configura em "% saindo da lactação", com um valor para os primeiros 8 meses e outro para depois.',
    oQueChecar: [
      'Na tabela mensal, compare partos e secagens do mês exato da queda — normalmente as secagens superam os partos ali.',
      'Na aba Secagem, veja se foi concentração de secagem por rotina (muitas gestantes parindo logo à frente) ou por baixa produção.',
      'Nos Indicadores, confira mortalidade adulta, descarte involuntário e os campos "% saindo da lactação (0–8m / 8m+)" — se estiverem altos, ampliam a saída.',
    ],
    tags: ['vacas-lactação', 'secagem', 'partos', 'mortalidade'],
    verEmDetalhe:
      'Explique passo a passo como o motor calcula o saldo de vacas em lactação de um mês (entradas e saídas).',
  },
  {
    id: 'vl-ondas',
    caminho: 'justificativa',
    secao: 'Vacas em lactação (VL)',
    pergunta: 'Por que a curva de vacas em lactação sobe e desce em "ondas"?',
    respostaCurta:
      'As ondas refletem a sazonalidade da reprodução: meses de melhor concepção geram picos de parto cerca de nove meses depois, e cada pico de parto vira um pico de secagem mais adiante.',
    mecanica:
      'Uma prenhez confirmada hoje só vira parto cerca de nove meses à frente — o modelo carrega cada concepção numa fila de gestação até o parto. Como a taxa de concepção varia ao longo do ano, os meses bons concentram concepções que reaparecem juntas como partos, e esses partos, depois de uma lactação, viram um bloco de secagens. O resultado é uma curva ondulada: cada onda de partos empurra a lactação para cima e, meses depois, a onda de secagens correspondente puxa para baixo.',
    oQueChecar: [
      'Nos Parâmetros, veja a taxa de concepção mês a mês das vacas — meses mais altos antecedem os picos de parto.',
      'Na tabela mensal, alinhe os picos de partos com as quedas de secagens cerca de dez meses depois.',
    ],
    tags: ['vacas-lactação', 'partos', 'secagem', 'reprodução'],
    verEmDetalhe:
      'Como a fila de gestação e a sazonalidade da concepção produzem ondas na curva de vacas em lactação?',
  },

  // Seção: % de vacas em lactação (%VL)
  {
    id: 'pctvl-nivel',
    caminho: 'justificativa',
    secao: '% de vacas em lactação (%VL)',
    pergunta: 'Por que o %VL fica muito alto (ou muito baixo)?',
    respostaCurta:
      'O %VL mede quantas das vacas adultas estão produzindo. Sobe quando há poucas vacas secas em relação às em lactação — geralmente período seco mais curto, boa distribuição de partos, ou poucas secagens concentradas. Cai no contrário.',
    mecanica:
      'O %VL é vacas em lactação dividido pelo total de vacas adultas (lactação + secas). Tudo que aumenta o tempo ou o número de vacas no período seco derruba o indicador: período seco mais longo, picos de secagem concentrados, ou queda de partos que reduz a reposição de lactação. Como o período seco entra direto nessa conta, mudá-lo move o %VL de forma sensível. Vales pontuais aparecem nos meses em que muitas vacas secam ao mesmo tempo.',
    oQueChecar: [
      'Nos Parâmetros (e na aba Secagem), confira o período seco — é a alavanca mais direta sobre o %VL.',
      'Na tabela mensal, veja se o vale de %VL coincide com um pico de secagens.',
    ],
    tags: ['vacas-lactação', 'secagem', 'reprodução'],
    verEmDetalhe: 'O que faz o %VL subir ou descer mês a mês, segundo o cálculo do motor?',
  },

  // Seção: Partos de novilhas
  {
    id: 'partos-novilha-vale',
    caminho: 'justificativa',
    secao: 'Partos de novilhas',
    pergunta: 'Por que aparecem tão poucos partos de novilhas em certo período?',
    respostaCurta:
      'Os partos de novilha de um período dependem do grupo de novilhas que estava na idade certa para emprenhar cerca de nove meses antes. Se aquele grupo era pequeno, o número de partos cai — é o reflexo de uma "safra" menor de bezerras lá atrás.',
    mecanica:
      'Cada grupo de animais nasce, envelhece mês a mês (sofrendo a mortalidade da idade) e, ao atingir a idade de liberação, entra no programa reprodutivo. Só então pode emprenhar e, nove meses depois, parir. Então um vale de partos de novilha hoje aponta para um vale de nascimentos ou de animais disponíveis na faixa de liberação meses atrás. Há também o momento da transição: nos primeiros meses a projeção usa a agenda real de partos importada; quando essa agenda acaba, passa a usar os partos calculados pelo motor reprodutivo — e o tamanho desse fluxo depende de quantas novilhas estavam aptas naquele instante.',
    oQueChecar: [
      'Na tabela mensal/gráfico, olhe as categorias jovens cerca de 9 a 12 meses antes do vale — se a faixa de novilhas estava magra, o vale é esperado.',
      'Nos Parâmetros, confira idade de liberação (aba Novilhas) e idade ao parto (Indicadores): elas definem quando cada grupo começa a emprenhar e quando pare.',
      'Verifique a liberação de novilhas por mês — se houver override manual, ele manda sobre o cálculo automático.',
    ],
    tags: ['novilhas', 'partos', 'reprodução'],
    verEmDetalhe:
      'Como o motor decide quantos partos de novilha acontecem em cada mês, da coorte jovem até o parto?',
  },
  {
    id: 'partos-novilha-transicao',
    caminho: 'justificativa',
    secao: 'Partos de novilhas',
    pergunta: 'Por que os partos de novilha mudam de patamar a partir de certo mês?',
    respostaCurta:
      'Há um ponto em que a projeção deixa de usar a agenda de partos que você importou e passa a usar os partos que o próprio modelo calcula. Essa troca pode mudar o patamar, porque a base de cálculo muda.',
    mecanica:
      'Os primeiros meses usam contagem direta da agenda do Ideagri (partos já agendados, separados entre novilhas e vacas). Depois vêm alguns meses baseados nos serviços de inseminação já realizados que ainda não tinham parto agendado. Só então o modelo passa a projetar partos a partir das novas prenhezes que ele mesmo estima. Cada uma dessas fases tem uma base diferente, então a transição entre elas pode aparecer como um degrau na curva — especialmente se a agenda importada cobria um período de partos atípico (acima ou abaixo do ritmo normal da fazenda).',
    oQueChecar: [
      'Identifique na tabela mensal até onde vão os dados da agenda importada — o degrau costuma estar nessa fronteira.',
      'Nos Parâmetros, confira os serviços de inseminação realizados (vacas e novilhas) e a idade ao parto.',
    ],
    tags: ['novilhas', 'partos', 'reprodução'],
    verEmDetalhe:
      'Quais são as fases de cálculo de partos do motor e por que a transição entre elas pode criar um degrau?',
  },

  // Seção: Perda de prenhez
  {
    id: 'perda-prenhez-ano',
    caminho: 'justificativa',
    secao: 'Perda de prenhez',
    pergunta: 'Qual a influência da perda de prenhez no resultado de um ano específico?',
    respostaCurta:
      'A perda de prenhez reduz quantas confirmações de prenhez viram parto de fato. Mais perda em um período significa menos partos cerca de nove meses depois — e, com isso, menos entrada de vacas em lactação e menos bezerras nascidas nesse intervalo.',
    mecanica:
      'Nem toda prenhez confirmada chega ao parto: parte se perde ao longo da gestação. O modelo aplica esse desconto antes de transformar prenhez em parto, e o risco não é igual o tempo todo — prenhezes no início da gestação têm risco de perda maior do que as já perto do parto. Por isso uma prenhez recém-confirmada "vale menos" na projeção do que uma adiantada. Como parto puxa vacas em lactação e nascimento de bezerras, um aumento de perda de prenhez se propaga: menos partos, menos lactação e menos bezerras naquele intervalo, e menos reposição alguns anos à frente.',
    oQueChecar: [
      'Nos Parâmetros, confira as perdas de prenhez de vacas e de novilhas (variam conforme o mês da gestação) e a perda total.',
      'Na tabela mensal, compare partos e nascimentos de bezerras nos meses afetados.',
    ],
    tags: ['prenhez', 'partos', 'reprodução', 'vacas-lactação'],
    verEmDetalhe:
      'Como a perda de prenhez entra no cálculo de partos do motor e por que o risco varia ao longo da gestação?',
  },

  // Seção: Mortalidade e descarte
  {
    id: 'mortalidade-descarte-efeito',
    caminho: 'justificativa',
    secao: 'Mortalidade e descarte',
    pergunta: 'Qual a influência da mortalidade de vacas e do descarte no resultado?',
    respostaCurta:
      'Mortalidade e descarte tiram vacas adultas do plantel todo mês. A maior parte dessa baixa é debitada das vacas em lactação, então quanto maiores essas taxas, mais a curva de lactação e o crescimento do rebanho perdem força.',
    mecanica:
      'A cada mês o modelo aplica a taxa anual de mortalidade e a de descarte involuntário sobre o total de vacas adultas, divididas em parcela mensal. Essas baixas são repartidas entre vacas em lactação e secas, com a maior parte saindo da lactação — e esse peso sobre a lactação aumenta a partir do 8º mês de projeção. Quanto cabe à lactação é o que você define em "% saindo da lactação" (um valor para os primeiros 8 meses, outro para depois). O primeiro mês projetado costuma usar taxas próprias, refletindo o que já aconteceu de fato no rebanho recente. Como mortes e descartes não voltam, seu efeito é cumulativo no crescimento: o rebanho cresce menos quando perde mais matrizes.',
    oQueChecar: [
      'Nos Indicadores, ajuste mortalidade adulta e descarte involuntário e observe o gráfico recalcular — é o jeito mais rápido de mostrar o impacto ao produtor.',
      'Ainda nos Indicadores, confira "% saindo da lactação (0–8m / 8m+)": é o que decide quanto da baixa pesa sobre as vacas em lactação.',
      'No resumo anual, veja "reposição necessária": ela cresce junto com mortes mais descartes.',
    ],
    tags: ['mortalidade', 'vacas-lactação', 'reprodução'],
    verEmDetalhe:
      'Como o motor aplica mortalidade e descarte de adultas mês a mês e como isso se reparte entre lactação e secas?',
  },

  // Seção: Secagem
  {
    id: 'secagem-pico',
    caminho: 'justificativa',
    secao: 'Secagem',
    pergunta: 'Por que tantas vacas secam num mês específico?',
    respostaCurta:
      'Um pico de secagem é o eco de um pico de partos anterior (as vacas que pariram juntas tendem a secar juntas antes do próximo parto) ou de um grupo de vacas que atingiu o limite de baixa produção no mesmo mês.',
    mecanica:
      'O modelo seca uma vaca pela primeira de duas razões a acontecer: a rotina (a data de secagem prevista antes do próximo parto, ligada ao período seco) ou a baixa produção (quando a produção estimada cai abaixo do limite configurado). Vacas que pariram no mesmo período entram juntas na rotina de secagem; e vacas em queda de produção parecida cruzam o limite quase juntas. Os dois efeitos podem coincidir e formar um pico. Vacas ainda no início da lactação não entram na conta de baixa produção, porque a produção ainda está subindo.',
    oQueChecar: [
      'Na aba Secagem, veja a divisão entre secagem por rotina e por baixa produção no mês do pico.',
      'Nos Parâmetros, confira o período seco (afeta a rotina) e o limite de produção e o declínio mensal (afetam a baixa produção).',
    ],
    tags: ['secagem', 'vacas-lactação'],
    verEmDetalhe: 'Como o motor decide a data de secagem de cada vaca entre rotina e baixa produção?',
  },

  // Seção: Crescimento e reposição
  {
    id: 'crescimento-ritmo',
    caminho: 'justificativa',
    secao: 'Crescimento e reposição',
    pergunta: 'Por que o rebanho cresce menos (ou mais) do que o esperado?',
    respostaCurta:
      'O crescimento é a diferença entre o que entra (novilhas que parem pela primeira vez) e o que sai (mortes e descartes de adultas). Cresce mais quando entram muitas novilhas e se perde pouco; cresce menos no contrário.',
    mecanica:
      'O motor compara o tamanho do plantel adulto no fim e no início do período. Entradas vêm das novilhas que amadurecem e parem; saídas vêm de mortalidade e descarte. Reprodução fraca (baixa concepção ou muita perda de prenhez), poucas novilhas chegando à idade de parto, ou taxas altas de morte/descarte freiam o crescimento. Como há sempre o atraso da gestação e da recria, decisões reprodutivas de hoje só aparecem como crescimento mais à frente.',
    oQueChecar: [
      'No resumo anual, compare partos de novilha contra mortes mais descartes do mesmo período.',
      'Nos Indicadores, teste cenários de concepção e descarte para mostrar a sensibilidade ao produtor.',
    ],
    tags: ['reprodução', 'novilhas', 'mortalidade', 'partos'],
    verEmDetalhe: 'Como o motor calcula o crescimento anual do rebanho e quais alavancas mais o afetam?',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAMINHO B — "Como preencho?" (Indicadores e Parâmetros)
  // ─────────────────────────────────────────────────────────────────────────

  // Seção: Por onde começar
  {
    id: 'indicadores-vs-parametros',
    caminho: 'preenchimento',
    secao: 'Por onde começar',
    pergunta: 'Qual a diferença entre os "Indicadores" (na lateral) e os "Parâmetros" (na tela)?',
    respostaCurta:
      'Os Indicadores na lateral são para testar hipóteses rápido — você mexe e o gráfico recalcula na hora. Os Parâmetros são a calibração de fundo da fazenda, que você ajusta com calma e salva.',
    mecanica:
      'São dois ritmos de trabalho. A lateral é o laboratório: mexe, vê, ajusta — ideal para mostrar ao produtor o efeito de mudar descarte, mortalidade ou idade ao parto. A tela de Parâmetros é onde mora a configuração séria da fazenda: estado atual do rebanho, reprodução mês a mês, perdas de prenhez, serviços de inseminação, horizonte. Os dois conjuntos não se sobrepõem — cada campo está num lugar só.',
    oQueChecar: [
      'Use a lateral (Indicadores) para simulações rápidas durante a conversa.',
      'Use a tela de Parâmetros para deixar a fazenda calibrada antes de tirar conclusões.',
    ],
    tags: ['reprodução', 'vacas-lactação'],
  },
  {
    id: 'upload-ideagri',
    caminho: 'preenchimento',
    secao: 'Por onde começar',
    pergunta: 'O que muda quando importo os arquivos do Ideagri?',
    respostaCurta:
      'Os arquivos do Ideagri dão ao modelo o ponto de partida real da fazenda: as vacas em lactação e suas datas de secagem, a agenda de partos já confirmados e os animais jovens por idade. Quanto mais fiel o upload, mais fiel a projeção.',
    mecanica:
      'O modelo usa os dados importados para montar o retrato inicial e os primeiros meses da projeção: a agenda de partos alimenta diretamente os primeiros meses de parto; a lista de secagem define quem seca por rotina e quem seca por baixa produção; os animais em crescimento são distribuídos por idade para prever quando viram novilhas aptas. A partir do momento em que esses dados reais se esgotam, o modelo passa a projetar sozinho. O ponto de partida no tempo (qual mês é o "mês 1") não vem do arquivo: é o campo "Mês de início da projeção", que você define nos Parâmetros.',
    oQueChecar: [
      'Na tela de Importação, confira o preview (totais e situação reprodutiva) antes de confirmar.',
      'Nos Parâmetros, confira o "Mês de início da projeção" — é ele que ancora todos os cálculos de tempo.',
    ],
    tags: ['partos', 'secagem', 'novilhas'],
  },
  {
    // Pergunta NOVA (decisão 2a): o âncora de tempo passou a ser este campo (14/05).
    id: 'mes-inicio-projecao',
    caminho: 'preenchimento',
    secao: 'Por onde começar',
    pergunta: 'O que é o "Mês de início da projeção" e por que ele importa?',
    respostaCurta:
      'É o mês que a ferramenta trata como "mês 1" da projeção — o ponto de partida no calendário. Tudo que o modelo faz com datas (partos da agenda, secagens, sazonalidade da concepção) é contado a partir dele.',
    mecanica:
      'A projeção precisa saber a qual mês do calendário o primeiro mês corresponde para alinhar a agenda de partos importada, as datas de secagem e a taxa de concepção mês a mês. Esse mês de início é definido por você nos Parâmetros, e não é deduzido automaticamente da data em que você subiu os arquivos. Se ele estiver errado, a projeção fica deslocada no tempo: os partos da agenda caem nos meses errados e a sazonalidade não bate com a realidade da fazenda.',
    oQueChecar: [
      'Nos Parâmetros, confira o campo "Mês de início da projeção" no topo da tela.',
      'Confira se os primeiros meses da tabela mensal batem com a agenda do Ideagri que você importou — se estiverem deslocados, ajuste o mês de início.',
    ],
    tags: ['partos', 'secagem'],
  },

  // Seção: Reprodução
  {
    id: 'ts-tc',
    caminho: 'preenchimento',
    secao: 'Reprodução',
    pergunta: 'O que a taxa de serviço e a taxa de concepção fazem na projeção?',
    respostaCurta:
      'A taxa de serviço é quantas vacas aptas você consegue inseminar; a taxa de concepção é quantas dessas emprenham. Juntas, definem quantas prenhezes novas surgem por mês — e, nove meses depois, quantos partos.',
    mecanica:
      'A cada mês o modelo pega as vacas aptas, aplica a taxa de serviço (ajustada do ciclo reprodutivo para o mês civil) para achar quantas são inseminadas, e sobre essas aplica a taxa de concepção do mês para achar as novas prenhezes. Essas prenhezes entram na fila de gestação e viram parto cerca de nove meses à frente. Por isso a concepção é sazonal na ferramenta: meses melhores geram picos de parto adiante. Mexer nessas taxas é a forma mais direta de simular melhoria reprodutiva.',
    oQueChecar: [
      'Nos Parâmetros, a taxa de concepção de vacas é preenchida mês a mês (há sazonalidade); a de novilhas costuma ser única.',
      'Depois de ajustar, observe o pico de partos surgir cerca de nove meses adiante.',
    ],
    tags: ['reprodução', 'prenhez', 'partos'],
    verEmDetalhe: 'Como taxa de serviço e taxa de concepção viram prenhezes e depois partos no motor?',
  },
  {
    id: 'pev',
    caminho: 'preenchimento',
    secao: 'Reprodução',
    pergunta: 'O que é o PEV e por que ele afeta o resultado?',
    respostaCurta:
      'O PEV é o tempo de descanso após o parto antes de a vaca voltar a ser inseminada. PEV maior atrasa a volta à reprodução; menor antecipa, mas pode pressionar vacas ainda em recuperação.',
    mecanica:
      'Vacas recém-paridas só entram no grupo de aptas depois de cumprir o período de espera. O modelo segura essas vacas pelo PEV configurado antes de liberá-las para inseminação. Um PEV mais curto devolve as vacas mais cedo ao grupo de aptas, o que pode adiantar prenhezes e partos; um PEV mais longo faz o contrário. É um parâmetro de manejo que muda o ritmo de toda a engrenagem reprodutiva.',
    oQueChecar: [
      'O PEV fica nos Parâmetros, na aba Vacas (Reprodução).',
      'Compare cenários com PEV diferente para mostrar o efeito no ritmo de partos.',
    ],
    tags: ['reprodução', 'prenhez'],
  },
  {
    id: 'estado-reprodutivo',
    caminho: 'preenchimento',
    secao: 'Reprodução',
    pergunta: 'O que significam "vacas aptas", "atrasadas" e "inseminadas" no estado atual?',
    respostaCurta:
      'São as categorias reprodutivas do ponto de partida: aptas estão prontas para inseminar, atrasadas já passaram do tempo sem confirmar prenhez, e inseminadas estão aguardando o diagnóstico. O modelo trata cada grupo de um jeito ao montar a projeção.',
    mecanica:
      'O retrato inicial separa as vacas pelo estágio reprodutivo porque cada uma contribui de forma diferente: aptas e atrasadas alimentam o grupo que pode emprenhar agora; inseminadas recentes ainda podem ou não confirmar (o modelo estima quantas confirmam pelo percentual de prenhez no diagnóstico); e as que confirmam entram na fila de gestação rumo ao parto. Preencher esses números aproxima os primeiros meses da realidade da fazenda.',
    oQueChecar: [
      'Esses campos ficam no Estado Atual do Rebanho (Parâmetros) e, quando você importa o Ideagri, vêm em boa parte da situação reprodutiva do arquivo de secagem.',
    ],
    tags: ['reprodução', 'prenhez'],
  },

  // Seção: Manejo
  {
    id: 'periodo-seco',
    caminho: 'preenchimento',
    secao: 'Manejo',
    pergunta: 'O que o período seco muda na projeção?',
    respostaCurta:
      'O período seco é quanto tempo a vaca fica sem produzir antes do parto. Quanto mais longo, mais tempo cada vaca passa como seca — o que derruba o %VL — e mais cedo ela precisa secar antes do parto.',
    mecanica:
      'O período seco define a data de secagem por rotina: o modelo recua essa quantidade de dias a partir do parto previsto para saber quando a vaca sai da lactação. Períodos mais longos antecipam a secagem e mantêm mais vacas no grupo de secas a cada momento, reduzindo o %VL; períodos mais curtos fazem o oposto. É uma das alavancas mais sensíveis sobre o %VL.',
    oQueChecar: [
      'O período seco fica nos Parâmetros (Manejo) e na aba Secagem. Ajuste e observe o %VL e a curva de secagens responderem.',
    ],
    tags: ['secagem', 'vacas-lactação'],
  },
  {
    id: 'secagem-baixa-producao',
    caminho: 'preenchimento',
    secao: 'Manejo',
    pergunta: 'Como funcionam o limite de produção e o declínio para a secagem por baixa produção?',
    respostaCurta:
      'O modelo estima a produção de cada vaca caindo um pouco a cada mês (o declínio) e seca a vaca quando ela cruza o limite que você definir. Limite mais alto ou declínio maior antecipam secagens.',
    mecanica:
      'Para cada vaca com produção conhecida, o modelo projeta a produção dos próximos meses subtraindo o declínio mensal e marca a secagem no primeiro mês em que ela fica abaixo do limite. Essa data por baixa produção compete com a data por rotina, e vale a que vier primeiro. Vacas no início da lactação ficam de fora dessa conta, porque ainda estão subindo de produção. Mexer no limite e no declínio muda quantas vacas secam por produção e quando.',
    oQueChecar: [
      'O limite de produção e o declínio mensal ficam nos Parâmetros (Manejo) e na aba Secagem.',
      'Na aba Secagem, veja quanto da secagem do mês veio por baixa produção depois de ajustá-los.',
    ],
    tags: ['secagem', 'vacas-lactação'],
  },
  {
    id: 'idade-parto-liberacao',
    caminho: 'preenchimento',
    secao: 'Manejo',
    pergunta: 'O que é a idade ao parto e a idade de liberação, e como afetam o futuro?',
    respostaCurta:
      'A idade de liberação é quando a novilha entra no programa reprodutivo; a idade ao parto é com quantos meses ela tem o primeiro filho. Antecipá-las traz a reposição mais cedo e acelera o crescimento; atrasá-las faz o contrário.',
    mecanica:
      'Cada grupo de novilhas avança mês a mês até a idade de liberação, quando passa a poder emprenhar; a idade ao parto fecha o ciclo definindo quando aquele grupo realmente entra em lactação pela primeira vez. Reduzir essas idades faz as novilhas chegarem antes ao plantel produtivo, aumentando a entrada de lactação mais cedo; aumentá-las adia essa entrada. Por isso são alavancas de longo prazo: o efeito aparece na frente, não no mês seguinte.',
    oQueChecar: [
      'A idade ao parto fica nos Indicadores (lateral); a idade de liberação fica nos Parâmetros, na aba Novilhas.',
      'Observe as categorias jovens e os partos de novilha se deslocarem no tempo ao mudar esses valores.',
    ],
    tags: ['novilhas', 'reprodução', 'partos'],
  },

  // Seção: Mortalidade dos jovens
  {
    id: 'mortalidade-jovem',
    caminho: 'preenchimento',
    secao: 'Mortalidade dos jovens',
    pergunta: 'Como as mortalidades por faixa de idade entram na conta?',
    respostaCurta:
      'Cada faixa de idade dos animais jovens tem sua própria mortalidade. O modelo aplica essa perda mês a mês enquanto o grupo cresce, então menos animais chegam à idade de virar novilha apta.',
    mecanica:
      'Os animais jovens são acompanhados por idade. A cada mês, o grupo daquela faixa perde a fração correspondente à mortalidade da idade antes de avançar para a faixa seguinte. Mortalidade alta nas primeiras idades é especialmente cara, porque reduz a base que vai alimentar toda a reposição futura. Por isso esses campos, embora pareçam pequenos, afetam o crescimento de longo prazo.',
    oQueChecar: [
      'As mortalidades por faixa de idade ficam nos Indicadores (lateral).',
      'No resumo anual, acompanhe as médias das categorias jovens para ver o efeito acumulado.',
    ],
    tags: ['mortalidade', 'novilhas'],
  },

  // Seção: Forragem e leite
  {
    id: 'forragem',
    caminho: 'preenchimento',
    secao: 'Forragem e leite',
    pergunta: 'Como o consumo de forragem é calculado?',
    respostaCurta:
      'O modelo multiplica o número de animais de cada categoria pelo consumo que você definiu para ela, soma tudo e converte para matéria natural e área necessária. Mais animais ou mais consumo por cabeça aumentam a demanda.',
    mecanica:
      'Para cada mês, o consumo de volumoso é a soma, por categoria de animal, do número de animais vezes o consumo diário daquela categoria, vezes os dias do mês. Esse total em matéria seca é convertido para matéria natural pelo teor de matéria seca, e em área pela produtividade por hectare. Como o número de animais muda a cada mês com a projeção, a demanda de forragem acompanha a evolução do rebanho.',
    oQueChecar: [
      'Na aba Forragem, ajuste consumo por categoria, teor de matéria seca, perdas e produtividade.',
      'Compare a demanda projetada com o estoque cadastrado.',
    ],
    tags: ['forragem'],
  },
  {
    id: 'producao-leite',
    caminho: 'preenchimento',
    secao: 'Forragem e leite',
    pergunta: 'Como a produção e o leite vendido são estimados?',
    respostaCurta:
      'A produção do dia é o número de vacas em lactação vezes a meta de litros por vaca. O leite vendido desconta o que as bezerras consomem no aleitamento.',
    mecanica:
      'O modelo multiplica as vacas em lactação de cada mês pela meta de produção por vaca para chegar à produção diária, e subtrai o consumo das bezerras em aleitamento para chegar ao leite vendido. Por isso tudo que move a curva de vacas em lactação (partos, secagens, mortes, descartes) move também a produção projetada.',
    oQueChecar: [
      'Ajuste a meta de produção por vaca e o consumo das bezerras nos Parâmetros (Manejo).',
      'Acompanhe produção e leite vendido no resumo anual.',
    ],
    tags: ['vacas-lactação', 'forragem'],
  },

  // Seção: Cenários e horizonte
  {
    id: 'cenarios',
    caminho: 'preenchimento',
    secao: 'Cenários e horizonte',
    pergunta: 'Para que servem os Cenários A e B?',
    respostaCurta:
      'Os cenários deixam você comparar lado a lado duas configurações da mesma fazenda — por exemplo, a situação atual contra uma melhoria reprodutiva — partindo do mesmo rebanho inicial.',
    mecanica:
      'Os dois cenários usam o mesmo ponto de partida do rebanho; só os parâmetros mudam entre eles. Cada cenário é uma fotografia dos parâmetros no momento em que você o envia — não muda sozinho depois. Assim dá para mostrar ao produtor, no mesmo gráfico, o que acontece se ele melhorar a concepção, reduzir o descarte ou encurtar o período seco.',
    oQueChecar: [
      'Monte um cenário na lateral, envie para A; ajuste e envie para B; abra a aba Cenários para comparar.',
    ],
    tags: ['reprodução'],
  },
  {
    id: 'horizonte',
    caminho: 'preenchimento',
    secao: 'Cenários e horizonte',
    pergunta: 'O que é o horizonte de projeção e como escolher?',
    respostaCurta:
      'O horizonte é por quantos meses a projeção vai à frente. Horizontes curtos são mais confiáveis porque se apoiam mais nos dados reais; horizontes longos mostram tendência, mas acumulam incerteza.',
    mecanica:
      'Os primeiros meses se apoiam na agenda de partos e nas secagens reais importadas, então são os mais firmes. Quanto mais longe, mais a projeção depende do motor reprodutivo e das premissas que você configurou, e pequenas diferenças vão se acumulando. Por isso o horizonte longo serve para enxergar direção e tendência, não para cravar um número de um mês distante.',
    oQueChecar: [
      'Escolha o horizonte conforme a conversa: curto para planejar o ano, longo para discutir estratégia de crescimento.',
    ],
    tags: ['reprodução'],
  },
]
