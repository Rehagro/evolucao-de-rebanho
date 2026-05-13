# Roadmap — Evolução de Rebanho

> Plano de trabalho em ondas. Uma onda termina antes da próxima começar.
> Status: `[ ]` não iniciado · `[~]` em andamento · `[✓]` concluído

---

## Estado atual (13/05/2026)

- Motor matemático calibrado e validado (idêntico à planilha Bela Vista).
- UI parcialmente refeita: alguns componentes em shadcn/Tailwind, outros em `style={{}}` inline. Inconsistência visual a corrigir.
- Protótipo de design feito no Claude Design (paleta Rehagro verde, fontes Plus Jakarta Sans + Instrument Serif + JetBrains Mono).
- Telas placeholder: `TelaCenarios.tsx` e `TelaPrevistoRealizado.tsx`.

---

## Visão geral das ondas

| # | Onda | Status | Depende de |
|---|---|---|---|
| 1 | Fundação (design system, limpeza de estilos) | `[ ]` | `styles.css` do protótipo |
| 2 | Dashboard novo (4 KPIs, sidebar renomeada, gráfico em destaque) | `[ ]` | Onda 1 |
| 3 | Upload guiado (checklist, instruções por arquivo) | `[ ]` | Onda 1 + lista dos 3 relatórios Ideagri |
| 4 | Parâmetros reestruturada (Vacas / Novilhas / Manejo) | `[ ]` | Onda 1 |
| 5 | Cenários lado a lado | `[ ]` | Ondas 1, 2 e 4 |
| 6 | Telas pendentes (Previsto×Realizado, refinamentos) | `[ ]` | Onda 5 |

---

## Onda 1 — Fundação

**Status:** `[ ]` não iniciado · **Bloqueado por:** styles.css do protótipo Claude Design

### Objetivo
Estabelecer o sistema visual unificado e eliminar dívida técnica de estilos inline. Sem isso, nenhuma onda seguinte fica consistente.

### Entregas
- Tema Tailwind atualizado com paleta Rehagro (verde "pasture") + 3 fontes
- `docs/DESIGN_SYSTEM.md` com tokens, escalas, regras de uso
- Migração de `style={{}}` inline → Tailwind/shadcn em:
  - `pages/DashboardFazenda.tsx` (header, tabs, alertas, empty state)
  - `components/SidebarParams.tsx` (todo o componente)
  - `components/CardsResumo.tsx` (KPIs e tabela anual)
- `App.css` reduzido ao mínimo necessário (idealmente vazio ou só Tailwind base)
- Logo Rehagro substituindo o ícone `MilkIcon` no header
- **Infraestrutura de rascunho (novo):**
  - Estado de rascunho único na `DashboardFazenda` — compartilhado entre sidebar e Tela Parâmetros
  - Gráfico/KPIs recalculam em tempo real conforme o rascunho muda
  - Componente `<DraftFAB>` (Floating Action Bar inferior direito) com Salvar / Enviar para comparativo / Descartar
  - Indicador visual discreto de rascunho ativo na topbar
- Componentes utilitários novos:
  - `<InfoTooltip term="VL">` — lê do glossário, renderiza ícone (?) + tooltip
  - `<Stepper>` — pra fluxos guiados (Upload, empty state Dashboard)
  - `<HelpBanner>` — banner curto de instruções no topo de telas com input
  - `<DraftFAB>` — botão flutuante de rascunho ativo (ver acima)

### Critérios de aceite
- Zero `style={{}}` inline em `DashboardFazenda`, `SidebarParams`, `CardsResumo` (exceto cores dinâmicas calculadas, ex: `style={{ color: pctVLColor }}`)
- Logo Rehagro aparece no header da `ListaFazendas` e do `DashboardFazenda`
- Paleta default carregada via tokens Tailwind (`bg-brand`, `text-brand`, etc.)
- 3 fontes Google carregadas em `index.html` e mapeadas no Tailwind (`font-sans`, `font-serif`, `font-mono`)
- `<InfoTooltip>` funcionando em pelo menos 3 termos como demonstração
- Build limpo (`npm run build` sem erros) e `npm run dev` rodando sem regressão visual

### Spec
`docs/specs/01-fundacao.md`

---

## Onda 2 — Dashboard novo

**Status:** `[ ]` não iniciado · **Depende de:** Onda 1

### Objetivo
Refazer o Dashboard com foco no gráfico (EvolutionGrid como protagonista), 4 KPIs novos no topo e sidebar de Indicadores renomeada.

### Entregas
- 4 cards novos no topo, **Variante A** (borda superior 3px colorida + serif na cor):
  1. %VL médio — brand verde `#1A7F3C`
  2. Partos totais / Partos vacas — roxo `#A864D4`
  3. Vacas totais / Rebanho total — azul `#2D6BC8`
  4. % crescimento de (VL+VS) — verde claro `#5BA84F`
- KPIs calculados sobre o **período filtrado** (acompanha o 12m/24m do gráfico)
- **Remover a Tabela Anual** que aparece entre KPIs e gráfico (era do `CardsResumo` atual; sai do Dashboard)
- Sidebar esquerda renomeada de "Parâmetros Zootécnicos" → **"Indicadores"**
- Sidebar com fundo dark (`--side-bg` = `#1F2A23`) conforme protótipo Rehagro
- Aba/botão do header renomeado para **"Parâmetros"** (acessa `TelaParametros`)
- **EvolutionGrid (`GraficoRebanho.tsx`) permanece como protagonista** — apenas re-estilizar usando tokens novos
- **Remover a linha %VL sobreposta** ao gráfico (e o filtro de %VL nas pílulas). %VL fica só na linha de dados abaixo.
- Migrar cores das categorias do gráfico para as do protótipo:
  - VL `#2D6BC8`, VS `#9CA09C`, Bezerras 0-12m `#4FA85C`, Bezerras 12-23m `#9E5AC8`, Novilhas Prenhas `#28A89A`
- Tooltip em cada KPI explicando a fórmula

### Critérios de aceite
- 4 cards refletem as definições exatas do CLAUDE.md §7
- Variante A aplicada (borda superior colorida + serif na cor)
- Nomenclatura "Indicadores" vs "Parâmetros" consistente em todo o app
- Gráfico ocupa ≥ 50% da altura visível do body em desktop
- Sem Tabela Anual no Dashboard
- Sem linha %VL sobreposta no gráfico
- Hierarquia visual: KPIs → EvolutionGrid

### Spec
`docs/specs/02-dashboard-kpis.md`

---

## Onda 3 — Upload guiado

**Status:** `[ ]` não iniciado · **Depende de:** Onda 1 + lista dos 3 relatórios Ideagri (nome no menu + campos obrigatórios)

### Objetivo
Transformar `TelaUpload` numa tela auto-explicativa: o técnico sabe quais 3 relatórios precisa, vê o status de cada um e tem feedback claro.

### Entregas
- Nome da fazenda em destaque ("Importando dados para **{nome}**")
- Checklist visual com 3 slots fixos: Secagem · Agenda de Partos · Animais em Crescimento
- Cada slot mostra:
  - Nome do relatório no Ideagri (ex: "Relatório de Previsão de Secagem")
  - Campos obrigatórios esperados (lista curta)
  - Status: vazio / detectado / parseado com sucesso / com erro
- Dropzone único que distribui automaticamente nos slots por detecção
- Preview enriquecido após sucesso (contagens, badges)
- Botão "Confirmar importação" só habilitado quando todos os slots em sucesso (ou usuário marca "importar parcial")
- Remover orientação técnica de baixo nível ("encoding latin-1", "separador ponto-vírgula") da view principal — mover pra collapse "Detalhes técnicos"

### Critérios de aceite
- 3 slots sempre visíveis, mesmo antes de qualquer upload
- Cada slot tem ícone, nome do relatório Ideagri, campos obrigatórios
- Estado de erro mostra qual campo faltou
- Nome da fazenda visível e em fonte maior que o resto

### Spec
`docs/specs/03-upload-guiado.md`

---

## Onda 4 — Parâmetros reestruturada

**Status:** `[ ]` não iniciado · **Depende de:** Onda 1 + análise do `TelaParametros.tsx` atual

### Objetivo
Reestruturar a `TelaParametros` (hoje ~28 KB de inputs verticais) em divisão clara por contexto, com tooltips e valores típicos.

### Entregas
- Divisão primária por tabs ou seções colapsáveis:
  - **Vacas** — Reprodução · Saída de lactação · Mortalidade/Descarte adulto
  - **Novilhas** — Reprodução · Liberação · Mortalidade jovem
  - **Manejo geral** — Período seco · Aborto/natimortos · % fêmeas nascidas · Secagem · Forragem
- Cada campo:
  - Label com `<InfoTooltip>`
  - Unidade visível (%, meses, dias, kg/dia, L)
  - Vem preenchido com o valor atual da fazenda (sem placeholders sugestivos)
  - Validação leve (avisar se sair de faixa razoável, mas não bloquear)
- Indicador de "X de Y parâmetros preenchidos" no topo
- Banner de instrução: "Esses parâmetros calibram o motor à realidade da sua fazenda. Comece pelos campos em destaque (mais sensíveis)."

### Critérios de aceite
- Vacas e Novilhas em seções visualmente distintas
- Todo campo com tooltip
- Todo campo com unidade explícita
- Mantém retrocompatibilidade com fazendas salvas no localStorage

### Spec
`docs/specs/04-parametros-reestruturada.md`

---

## Onda 5 — Cenários lado a lado

**Status:** `[ ]` não iniciado · **Depende de:** Ondas 1, 2 e 4

### Objetivo
Implementar a tela de Cenários como visualização comparativa pura: dois snapshots (A e B) com gráficos lado a lado, sem edição inline. A edição acontece nas telas normais (sidebar + Tela Parâmetros) e o envio é via FAB de rascunho.

### Modelo
- A fazenda tem 2 slots: **Cenário A** e **Cenário B**.
- Cada cenário é um **snapshot fixo** do conjunto de parâmetros no momento do envio.
- Regra: A = 1º envio, B = 2º. Sem vínculo automático com o Salvo.
- Cenários **não são vivos** — só atualizam se o técnico reenviar do rascunho.
- Tela "Cenários" é **aba normal**, sem redirect automático após envio.

### Entregas
- Tipo `CenarioSnapshot` no `types/index.ts` armazenando: `parametros`, `estadoAtual`, `dataEnvio`, `nome` (auto, ex: "13/05 14:32")
- Persistência: `Fazenda.cenarioA` e `Fazenda.cenarioB` no localStorage
- No FAB de rascunho ativo (entregue na Onda 1): ação "Enviar para comparativo" abre escolha A ou B
- Tela "Cenários" mostra:
  - Dois painéis lado a lado, cada um com o **gráfico** do EvolutionGrid completo
  - Filtros (horizonte 12m/24m/36m, categorias visíveis) **compartilhados** entre A e B — mexer num filtra os dois
  - Cabeçalho de cada painel com timestamp do snapshot e botão "Limpar"
  - Botão "Promover B → A" no topo (substitui A com snapshot de B)
- **Sem KPIs, sem tabela, sem sidebar de Indicadores** na tela de Cenários
- Estado vazio: se nenhum cenário enviado, mensagem "Envie um rascunho do Dashboard para comparar"
- Componente `<CompareChart>` reaproveitando estrutura do EvolutionGrid já estilizada

### Critérios de aceite
- Enviar pro Cenário A grava snapshot e não afeta o rascunho atual
- Editar parâmetros depois do envio NÃO altera o cenário (snapshot fixo)
- Tela Cenários só renderiza após pelo menos 1 cenário ter sido enviado
- Filtros sincronizados entre A e B
- Promover B → A substitui A e mantém B intacto
- Botões "Limpar A" e "Limpar B" sempre disponíveis

### Spec
`docs/specs/05-cenarios-lado-a-lado.md`

---

## Onda 6 — Telas pendentes e refinamentos

**Status:** `[ ]` não iniciado · **Depende de:** Onda 5

### Objetivo
Fechar as telas placeholder e refinar o que ficou em débito.

### Entregas
- `TelaPrevistoRealizado.tsx` — comparação projeção vs realidade mês a mês com inputs de valores reais
- Refinamentos em `TelaForragem` (mais detalhes de área, custos)
- Tela de Receita (pendência do escopo original)
- Onboarding/tour inicial pra primeiro uso
- Revisão geral de microcopy

### Critérios de aceite
- A definir no spec da onda

### Spec
`docs/specs/06-telas-pendentes.md`

---

## Como executar uma onda

1. **Aqui no chat com Claude (Sonnet/Opus):** produzimos o `docs/specs/0X-*.md` e um prompt pronto.
2. **No VS Code com Claude Code:** você cola o spec no repo e roda o prompt. Claude Code lê `CLAUDE.md` + spec, propõe plano, espera aprovação, executa.
3. **Você testa** com `npm run dev` (UI) e `python _compare.py` (se mexeu no motor).
4. **Volta aqui** com feedback se precisar ajustar; senão, marca onda como `[✓]` e passa pra próxima.
