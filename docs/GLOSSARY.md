# Glossário — Evolução de Rebanho

> Fonte canônica dos tooltips na UI. Tom objetivo — o técnico já conhece os indicadores; aqui apenas a sigla, o cálculo e o que distingue conceitos próximos.
>
> O componente `<InfoTooltip term="VL">` lê deste arquivo. Quando o conceito for complexo, o tooltip pode levar a um modal "Saber mais" com o bloco completo.

---

## Categorias do rebanho

### VL
Vacas em lactação.

### VS
Vacas secas — no período seco antes do próximo parto.

### %VL
`VL / (VL + VS)`. Indicador-chave de eficiência reprodutiva.

### Bezerras 0–12m
Animais fêmeas até 12 meses.

### Bezerras 12–23m
Fêmeas entre 12 e 23 meses, antes da idade de liberação.

### Novilhas Prenhas
Novilhas confirmadas gestantes, aguardando 1º parto. Saem da categoria ao parir e viram VL.

### Rebanho total (efetivo fêmea)
`VL + VS + bezerras 0–12 + bezerras 12–23 + novilhas prenhas`. Denominador do Card 3 do Dashboard.

---

## Reprodução

### PEV
Período de espera voluntário. Dias após o parto antes de liberar pra inseminação. Vacas dentro do PEV não entram em "aptas".

### Apta
Vaca ou novilha vazia, fora do PEV, pronta para inseminação.

### Atrasada
Apta há mais de 1 ciclo sem confirmar prenhez.

### TC
Taxa de concepção. `prenhezes confirmadas ÷ inseminações realizadas`. Varia por mês, categoria e fazenda.

### TS
Taxa de serviço. Fração mensal de aptas que recebem ao menos um serviço.

### IA
Inseminação artificial.

### Meta IA
`aptas × TS × (30/21)`. Projeção de inseminações no mês. O fator `30/21` converte ciclo estral (21 dias) em mês civil.

### Meta Prenhez
`Meta IA × TC`. Entrada na fila de gestação que gera partos 9 meses depois.

### Manutenção de prenhez
Fração mensal de gestações que se mantêm. Aplicada como decay sobre o estoque de prenhas a cada mês. As que perdem voltam ao pool de aptas no mês seguinte.

Referência planilha: **E7** (vacas), **E6** (novilhas).

### Perda de prenhez total
Perda acumulada do diagnóstico positivo até o parto. Usada apenas nos partos previstos de serviços históricos.

Referência planilha: **B15** (vacas), **B14** (novilhas).

> **Cuidado:** "manutenção de prenhez" e "perda de prenhez total" são conceitos diferentes. A primeira é decay mensal aplicado ao estoque; a segunda é fator único aplicado a serviços históricos.

### Perdas de prenhez por mês do parto
Fração de gestações que não geram partos efetivos, indexada pelo mês do parto previsto. Mês 1 = parto iminente (perda mínima); Mês 9 = início da gestação (perda máxima).

Referência planilha: **Param! linha 10** (novilhas), **linha 11** (vacas).

### Aborto / natimorto
Fração de gestações que terminam sem bezerro vivo. Aplicada nos nascimentos:

```
nascimentos = partos × pctFêmeas × (1 − aborto)
```

### Idade ao parto
Idade média do 1º parto de novilhas (meses). Define quando uma novilha prenha vira VL.

### Idade de liberação
Idade em que a novilha entra no pool de aptas reprodutivas. Animais com idade inferior aguardam crescimento.

Pode ser sobrescrita manualmente para os 11 primeiros meses (override Param!B67–L67).

---

## Manejo e secagem

### Período seco
Dias entre secagem e parto. Vacas iniciam o período seco automaticamente quando faltam X dias para o parto previsto.

### Coorte
Grupo de animais por idade em meses. O motor mantém 28 coortes (1m a 28m). A cada mês, todas avançam uma posição. A coorte com idade igual à idade-ao-parto se esvazia (animais parem e viram VL).

### Liberação de novilha
Saída da coorte de crescimento para o pool de aptas reprodutivas.

### Declínio mensal de produção
L/dia/mês que a produção cai ao longo da lactação. Usado para projetar quando uma vaca atinge o limite de secagem por baixa produção.

### Limite de produção para secagem
L/dia mínimo abaixo do qual a vaca é secada antes do período programado.

### Secagem por rotina
Secagem programada pela proximidade do parto (= período seco antes do parto previsto).

### Secagem por baixa produção
Secagem antecipada quando a produção projetada cai abaixo do limite. Calculada projetando 5 meses à frente da data de referência aplicando o declínio mensal. Vacas em "Vaz. pev" (vazias em PEV) são puladas.

---

## Saídas do rebanho

### Descarte involuntário
Vacas que saem por razões fora do controle (problemas reprodutivos, sanitários). Taxa anual distribuída entre VL e VS conforme a fração que sai de lactação.

### Descarte voluntário
Vacas removidas por escolha (baixa produção, baixo valor genético). Aplicado apenas a VL.

### Mortalidade adulta
Mortes em vacas (VL + VS) no ano. Distribuída entre VL e VS conforme a fração que sai de lactação.

> **Caso especial — Mês 1:** a planilha usa valores específicos para o 1º mês da projeção (C12 e C75 da aba Evolução Rebanho), distintos das taxas crônicas anuais. O motor respeita.

### Mortalidade jovem
Mortes em bezerras e novilhas, definida em faixas (0–3m, 3–6m, 6–9m, 9–12m, 12–26m). Taxas são **acumuladas ao longo da faixa** — o motor divide pela largura da faixa para obter taxa mensal.

### % saindo de lactação
Fração das saídas (descarte + morte) que sai de VL — o complemento sai de VS.

Referência planilha: **C6** (primeiros 8 meses), **C7** (do 9º em diante).

---

## Indicadores do Dashboard (Onda 2)

Fórmulas usadas pelos 4 KPIs no topo do Dashboard, calculadas sobre o horizonte filtrado.

### Card 1 — %VL médio
```
média(VL_i / (VL_i + VS_i))  para i no período
```

### Card 2 — Partos totais / Partos vacas
```
total = Σ (partosV_i + partosN_i)
sub   = Σ partosV_i  (e Σ partosN_i para novilhas)
```

### Card 3 — Vacas totais / Rebanho total
```
(VL + VS) / (VL + VS + bezerras 0–12 + bezerras 12–23 + novilhas prenhas)
```
Calculado no último mês do período, em %.

### Card 4 — % crescimento
```
(VL+VS no último mês − VL+VS no primeiro mês) / (VL+VS no primeiro mês) × 100
```

---

## Termos de processo (UI)

### Projeção
Resultado calculado mês a mês pelo motor. Os primeiros meses usam dados reais (agenda Ideagri); os seguintes entram no regime de meta-IA.

### Dados reais vs Projeção
A transição é marcada visualmente no gráfico e na tabela. Distinção controlada pelo `usouDadosReais: boolean` em cada `MesProjetado`.

### Rascunho
Edições em memória (sidebar + Tela Parâmetros) ainda não salvas nem enviadas pro comparativo. Persiste durante a sessão, descartado ao fechar.

### Cenário (A / B)
Snapshot fixo de parâmetros enviado do rascunho. Não atualiza sozinho — apenas se reenviado.

---

## Mapeamento de tempo no motor

Apenas pra leitura do código `engine/projecao.ts`:

| Motor `i` | Período | Origem dos partos |
|---|---|---|
| 0–7 | 8 meses iniciais | Agenda Ideagri |
| 8, 9 | Meses 9–10 | Serviços históricos (Param!B28/C28, B34/C34) |
| 10+ | Mês 11 em diante | Meta IA (aba "meta de inseminação") |
