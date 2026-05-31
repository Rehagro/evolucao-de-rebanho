# Conteúdo do FAQ — Evolução de Rebanho

> **Fonte viva do conteúdo:** `src/lib/faqData.ts`.
> Este documento é apenas a referência de redação. Para corrigir um texto de
> resposta, edite **`src/lib/faqData.ts`** (o layout não precisa ser tocado).
>
> Cada pergunta segue o padrão de 3 blocos (`docs/specs/faq-evolucao.md` §3):
> **Resposta curta** (para falar ao produtor) → **Por que acontece** (mecânica)
> → **O que checar na ferramenta**.

## Estrutura

- **Caminho A — "Como explico esse resultado?"** (`caminho: 'justificativa'`):
  leitura do gráfico. Seções: Vacas em lactação · %VL · Partos de novilhas ·
  Perda de prenhez · Mortalidade e descarte · Secagem · Crescimento e reposição.
- **Caminho B — "Como preencho?"** (`caminho: 'preenchimento'`): Indicadores e
  Parâmetros. Seções: Por onde começar · Reprodução · Manejo · Mortalidade dos
  jovens · Forragem e leite · Cenários e horizonte.

## Tags canônicas

`#vacas-lactação` · `#secagem` · `#prenhez` · `#partos` · `#novilhas` ·
`#mortalidade` · `#reprodução` · `#forragem` (definidas em `TAGS_CANONICAS`).

## Correções aplicadas em relação ao rascunho original

1. **Sem valores fixos de fazenda** (spec §3). Onde o texto cravava números que
   na verdade são campos editáveis, passou a apontar o campo ajustável:
   - "% saindo da lactação (0–8m / 8m+)" nos Indicadores — antes citado como
     "70% / 87%" fixos (perguntas `vl-queda-mensal`, `mortalidade-descarte-efeito`);
     mantém-se a explicação de que o peso muda a partir do 8º mês.
   - período seco — antes citado como "~60 dias" fixo.
2. **Âncora de tempo** é o campo **"Mês de início da projeção"** (Parâmetros),
   não a data do upload. Pergunta `upload-ideagri` corrigida e nova pergunta
   `mes-inicio-projecao` adicionada em "Por onde começar".
3. **"Onde fica o campo"** reflete o app atual: PEV em Parâmetros → Vacas
   (Reprodução); idade ao parto nos Indicadores e idade de liberação em
   Parâmetros → Novilhas; período seco / limite / declínio em Parâmetros (Manejo)
   e na aba Secagem.

Mecânica conferida contra `src/engine/projecao.ts`. Termos seguem `glossary.ts`.
